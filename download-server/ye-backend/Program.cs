using System.Collections.Concurrent;
using System.Net;
using System.Text.Json;
using YoutubeExplode;
using YoutubeExplode.Common;
using YoutubeExplode.Converter;
using YoutubeExplode.Exceptions;
using YoutubeExplode.Videos;
using YoutubeExplode.Videos.ClosedCaptions;
using YoutubeExplode.Videos.Streams;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors();
var app = builder.Build();

var port = Environment.GetEnvironmentVariable("PORT") is { } pStr
    && int.TryParse(pStr, out var p)
    ? p
    : 3000;
var apiKey = Environment.GetEnvironmentVariable("API_KEY") ?? "";
var corsOrigins = (Environment.GetEnvironmentVariable("CORS_ORIGIN") ?? "*")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
var tmpDir = Environment.GetEnvironmentVariable("TMPDIR") is { Length: > 0 } t
    ? t
    : Path.GetTempPath();
var maxMinutes = int.TryParse(Environment.GetEnvironmentVariable("MAX_MINUTES"), out var mm) ? mm : 10;
var cacheMinutes = int.TryParse(Environment.GetEnvironmentVariable("CACHE_MIN"), out var cm) ? cm : 10;
var ffmpegPath = Environment.GetEnvironmentVariable("FFMPEG_PATH") is { Length: > 0 } f
    ? f
    : "ffmpeg";
Directory.CreateDirectory(tmpDir);

// ---- CORS ----
app.UseCors(policy =>
{
    if (corsOrigins.Contains("*"))
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    else
        policy.WithOrigins(corsOrigins).AllowAnyHeader().AllowAnyMethod();
});

// ---- API key gate (only /api/*; health stays open) ----
app.Use(async (ctx, next) =>
{
    if (apiKey.Length > 0 && ctx.Request.Path.StartsWithSegments("/api"))
    {
        var provided = ctx.Request.Headers["x-api-key"].FirstOrDefault()
            ?? ctx.Request.Query["api_key"].FirstOrDefault();
        if (provided != apiKey)
        {
            ctx.Response.StatusCode = 401;
            await ctx.Response.WriteAsJsonAsync(new { error = "Invalid API key." });
            return;
        }
    }
    await next();
});

// ---- Tiny per-IP rate limiter (sliding 60s window) ----
var hits = new ConcurrentDictionary<string, ConcurrentQueue<DateTimeOffset>>();
bool RateOk(HttpContext ctx, int maxPerMin)
{
    var ip = ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    var q = hits.GetOrAdd(ip, _ => new ConcurrentQueue<DateTimeOffset>());
    var now = DateTimeOffset.UtcNow;
    q.Enqueue(now);
    while (q.TryPeek(out var oldest) && oldest < now.AddSeconds(-60))
        q.TryDequeue(out _);
    return q.Count <= maxPerMin;
}

// ---- YoutubeExplode client (cookies optional, same idea as yt-backend) ----
List<Cookie> LoadCookies()
{
    var cookies = new List<Cookie>();
    string? text = null;
    if (Environment.GetEnvironmentVariable("COOKIES_B64") is { Length: > 0 } b64)
    {
        try { text = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(b64)); }
        catch { /* ignore bad env value */ }
    }
    else
    {
        var file = Path.Combine(AppContext.BaseDirectory, "cookies.txt");
        if (File.Exists(file))
            text = File.ReadAllText(file);
    }
    if (text is null)
        return cookies;
    foreach (var line in text.Split('\n'))
    {
        var l = line.Trim();
        if (l.Length == 0 || l.StartsWith('#') && !l.StartsWith("#HttpOnly_"))
            continue;
        l = l.Replace("#HttpOnly_", "", StringComparison.Ordinal);
        var parts = l.Split('\t');
        if (parts.Length < 7)
            continue;
        try
        {
            cookies.Add(new Cookie(parts[5], parts[6])
            {
                Domain = parts[0],
                Path = parts[2],
                Secure = string.Equals(parts[3], "TRUE", StringComparison.OrdinalIgnoreCase),
            });
        }
        catch { /* skip malformed cookie lines */ }
    }
    return cookies;
}

var youtube = new YoutubeClient(LoadCookies());
var hasCookies = LoadCookies().Count > 0;

// ---- Metadata + manifest, player-API only ----
// YoutubeExplode's Videos.GetAsync() starts from the HTML watch page, which
// datacenter IPs get bot-checked on. The player API (innertube) is gated far
// less strictly, so metadata comes from a raw player POST — the same
// VISIONOS -> ANDROID client flow YoutubeExplode's VideoController uses —
// while streams/downloads still go through YoutubeExplode itself.
var rawHttp = new HttpClient();

async Task<string> ResolveVisitorDataAsync(CancellationToken ct)
{
    using var req = new HttpRequestMessage(HttpMethod.Get, "https://www.youtube.com/sw.js_data");
    req.Headers.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
    req.Headers.Add("User-Agent", "com.google.android.youtube/20.10.38 (Linux; U; ANDROID 11) gzip");
    using var res = await rawHttp.SendAsync(req, ct);
    res.EnsureSuccessStatusCode();
    var json = await res.Content.ReadAsStringAsync(ct);
    if (json.StartsWith(")]}'"))
        json = json[4..];
    using var doc = JsonDocument.Parse(json);
    var value = doc.RootElement[0][2][0][0][13].GetString();
    if (string.IsNullOrWhiteSpace(value))
        throw new YoutubeExplodeException("Failed to resolve visitor data.");
    return value;
}

async Task<PlayerMetadata> FetchPlayerMetadataAsync(string videoId, CancellationToken ct)
{
    // YouTube's public innertube web-client key (the same one YoutubeExplode
    // appends to youtubei requests; it is embedded in YouTube's own pages).
    const string apiKeyInnertube = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
    var visitorData = await ResolveVisitorDataAsync(ct);
    var clients = new[]
    {
        // VISIONOS (primary in YoutubeExplode)
        new Dictionary<string, object?>
        {
            ["clientName"] = "VISIONOS", ["clientVersion"] = "1.02",
            ["deviceMake"] = "Apple", ["deviceModel"] = "RealityDevice17,1",
            ["osName"] = "visionOS", ["osVersion"] = "26.5.23O471",
            ["visitorData"] = visitorData, ["hl"] = "en",
        },
        // ANDROID (YoutubeExplode's fallback)
        new Dictionary<string, object?>
        {
            ["clientName"] = "ANDROID", ["clientVersion"] = "21.26.364",
            ["androidSdkVersion"] = 30, ["osName"] = "Android", ["osVersion"] = "11",
            ["visitorData"] = visitorData, ["hl"] = "en",
        },
    };
    string lastError = "unknown player error";
    foreach (var client in clients)
    {
        var payload = JsonSerializer.Serialize(new Dictionary<string, object?>
        {
            ["videoId"] = videoId,
            ["contentCheckOk"] = true,
            ["racyCheckOk"] = true,
            ["context"] = new Dictionary<string, object?> { ["client"] = client },
        });
        using var req = new HttpRequestMessage(HttpMethod.Post,
            $"https://www.youtube.com/youtubei/v1/player?key={apiKeyInnertube}&hl=en");
        req.Content = new StringContent(payload, System.Text.Encoding.UTF8, "application/json");
        using var res = await rawHttp.SendAsync(req, ct);
        if (!res.IsSuccessStatusCode)
        {
            lastError = $"player HTTP {(int)res.StatusCode}";
            continue;
        }
        using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync(ct));
        var root = doc.RootElement;
        var status = root.TryGetProperty("playabilityStatus", out var ps)
            && ps.TryGetProperty("status", out var st) ? st.GetString() : null;
        if (!string.Equals(status, "OK", StringComparison.OrdinalIgnoreCase))
        {
            lastError = ps.TryGetProperty("reason", out var r) ? r.GetString() ?? status ?? "unplayable" : status ?? "unplayable";
            continue;
        }
        var details = root.GetProperty("videoDetails");
        var title = details.GetProperty("title").GetString() ?? "video";
        var author = details.TryGetProperty("author", out var a) ? a.GetString() ?? "" : "";
        double? duration = details.TryGetProperty("lengthSeconds", out var ls)
            && double.TryParse(ls.GetString(), out var d) ? d : null;
        string? thumb = null;
        if (details.TryGetProperty("thumbnail", out var th)
            && th.TryGetProperty("thumbnails", out var thumbs) && thumbs.GetArrayLength() > 0)
        {
            var best = thumbs.EnumerateArray()
                .OrderByDescending(t => t.TryGetProperty("width", out var w) ? w.GetInt32() : 0)
                .First();
            thumb = best.TryGetProperty("url", out var u) ? u.GetString() : null;
        }
        return new PlayerMetadata(title, author, duration, thumb);
    }
    throw new YoutubeExplodeException($"Video is not playable via the player API: {lastError}");
}

// ---- Info/manifest cache (10 min, keyed by URL) ----
var cache = new ConcurrentDictionary<string, (DateTimeOffset Expires, PlayerMetadata Meta, StreamManifest Manifest)>();

async Task<(PlayerMetadata Meta, StreamManifest Manifest)> GetVideoAndManifestAsync(
    string url, CancellationToken ct)
{
    if (cache.TryGetValue(url, out var hit) && hit.Expires > DateTimeOffset.UtcNow)
        return (hit.Meta, hit.Manifest);
    // NOTE: new VideoId(url) does NOT normalize — it stores the raw string.
    // Only VideoId.Parse/TryParse extract the 11-char id from a watch URL.
    var videoId = VideoId.TryParse(url)
        ?? throw new ArgumentException($"Invalid YouTube video ID or URL '{url}'.");
    var manifest = await youtube.Videos.Streams.GetManifestAsync(videoId, ct);
    var meta = await FetchPlayerMetadataAsync(videoId.Value, ct);
    cache[url] = (DateTimeOffset.UtcNow.AddMinutes(cacheMinutes), meta, manifest);
    return (meta, manifest);
}

static string SizeLabel(long bytes) => bytes switch
{
    < 1024 => $"{bytes} B",
    < 1024L * 1024 => $"{bytes / 1024.0:F1} KB",
    < 1024L * 1024 * 1024 => $"{bytes / 1024.0 / 1024.0:F1} MB",
    _ => $"{bytes / 1024.0 / 1024.0 / 1024.0:F2} GB",
};

static string SanitizeFilename(string name)
{
    foreach (var c in Path.GetInvalidFileNameChars())
        name = name.Replace(c, '_');
    name = name.Trim().Trim('.');
    if (name.Length > 100)
        name = name[..100].Trim();
    return name.Length == 0 ? "download" : name;
}

static bool IsValidUrl(string? u) =>
    Uri.TryCreate(u, UriKind.Absolute, out var uri)
    && (uri.Scheme == "http" || uri.Scheme == "https");

// ---- Health ----
app.MapGet("/", () => new
{
    ok = true,
    service = "toolverse-ye-backend",
    engine = "YoutubeExplode",
    cookies = hasCookies,
    maxMinutes,
});

// ---- Video info + resource table ----
app.MapPost("/api/info", async (HttpContext ctx, JsonElement body, CancellationToken ct) =>
{
    if (!RateOk(ctx, 30))
        return Results.Json(new { error = "Rate limited." }, statusCode: 429);
    var url = body.TryGetProperty("url", out var u) ? u.GetString() : null;
    if (!IsValidUrl(url))
        return Results.Json(new { error = "A valid video URL is required." }, statusCode: 400);
    try
    {
        var (meta, manifest) = await GetVideoAndManifestAsync(url!, ct);

        // One resource per height: prefer a muxed (has-audio) stream, then bigger file.
        var byHeight = new Dictionary<int, (IStreamInfo Stream, bool HasAudio)>();
        foreach (var s in manifest.GetVideoStreams())
        {
            var h = s.VideoResolution.Height;
            var hasAudio = s is MuxedStreamInfo;
            var score = (hasAudio ? 1L << 50 : 0) + s.Size.Bytes;
            if (!byHeight.TryGetValue(h, out var cur)
                || score > ((cur.HasAudio ? 1L << 50 : 0) + cur.Stream.Size.Bytes))
                byHeight[h] = (s, hasAudio);
        }
        var resources = new List<object>();
        foreach (var h in byHeight.Keys.OrderBy(x => x))
        {
            var (s, hasAudio) = byHeight[h];
            resources.Add(new
            {
                id = $"v{h}",
                quality = h,
                ext = "mp4",
                size = s.Size.Bytes,
                sizeLabel = SizeLabel(s.Size.Bytes),
                hasAudio,
                fps = (int?)null,
            });
        }
        var bestAudio = manifest.GetAudioStreams()
            .OrderByDescending(s => s.Bitrate.BitsPerSecond)
            .FirstOrDefault();
        if (bestAudio is not null)
        {
            resources.Add(new
            {
                id = "audio",
                quality = 0,
                ext = "mp3",
                size = bestAudio.Size.Bytes,
                sizeLabel = SizeLabel(bestAudio.Size.Bytes),
                hasAudio = true,
                fps = (int?)null,
                audioOnly = true,
            });
        }

        return Results.Json(new
        {
            title = meta.Title,
            thumbnail = meta.ThumbnailUrl,
            duration = meta.DurationSeconds,
            uploader = meta.Author,
            isLive = false,
            resources,
            qualities = byHeight.Keys.OrderBy(x => x).ToArray(),
            hasAudio = bestAudio is not null || byHeight.Values.Any(v => v.HasAudio),
            cookies = hasCookies,
        });
    }
    catch (Exception ex) when (ex is YoutubeExplodeException or OperationCanceledException or ArgumentException or FormatException)
    {
        return Results.Json(new
        {
            error = "Could not fetch video info.",
            detail = ex.Message[..Math.Min(200, ex.Message.Length)],
            hint = hasCookies ? null : "YouTube blocks anonymous server IPs; this service needs an unflagged IP or cookies.",
        }, statusCode: 502);
    }
});

// ---- Download ----
app.MapGet("/api/download", async (HttpContext ctx, CancellationToken ct) =>
{
    if (!RateOk(ctx, 20))
        return Results.Json(new { error = "Rate limited." }, statusCode: 429);
    var q = ctx.Request.Query;
    var url = q["url"].FirstOrDefault();
    var formatId = q["format_id"].FirstOrDefault();
    var qualityRaw = q["quality"].FirstOrDefault();
    var audioOnly = q["audio"].FirstOrDefault() == "1";
    // Only mp3 output is supported (Converter has no m4a container target);
    // any other requested audio format falls back to mp3, like yt-backend's default.
    var audioFormat = "mp3";
    if (!IsValidUrl(url))
        return Results.Json(new { error = "A valid video URL is required." }, statusCode: 400);

    using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
    timeout.CancelAfter(TimeSpan.FromMinutes(maxMinutes));
    var token = timeout.Token;

    try
    {
        var (meta, manifest) = await GetVideoAndManifestAsync(url!, token);
        var title = SanitizeFilename(meta.Title);
        var id = Guid.NewGuid().ToString("N")[..12];

        if (audioOnly)
        {
            var audio = manifest.GetAudioStreams()
                .OrderByDescending(s => s.Bitrate.BitsPerSecond)
                .FirstOrDefault()
                ?? throw new YoutubeExplodeException("No audio stream available.");
            var outPath = Path.Combine(tmpDir, $"tvdl-{id}.{audioFormat}");
            var request = new ConversionRequestBuilder(outPath)
                .SetFFmpegPath(ffmpegPath)
                .SetContainer(Container.Mp3)
                .SetPreset(ConversionPreset.Medium)
                .Build();
            await youtube.Videos.DownloadAsync(
                new[] { audio }, Array.Empty<ClosedCaptionTrackInfo>(), request, null, token);
            var stream = new FileStream(outPath, FileMode.Open, FileAccess.Read, FileShare.None,
                65536, FileOptions.DeleteOnClose);
            return Results.File(stream, "application/octet-stream", $"{title}.{audioFormat}");
        }

        // Resolve the video stream: exact "v<height>", else height<=quality, else 720.
        IStreamInfo? videoStream = null;
        bool wantMuxed = false;
        if (formatId is { Length: > 1 } && formatId[0] == 'v'
            && int.TryParse(formatId[1..], out var exactH))
        {
            videoStream = manifest.GetVideoStreams()
                .Where(s => s.VideoResolution.Height == exactH)
                .OrderByDescending(s => s is MuxedStreamInfo)
                .ThenByDescending(s => s.Size.Bytes)
                .FirstOrDefault();
        }
        if (videoStream is null)
        {
            var wanted = Math.Clamp(int.TryParse(qualityRaw, out var qq) ? qq : 720, 144, 2160);
            videoStream = manifest.GetVideoStreams()
                .Where(s => s.VideoResolution.Height <= wanted)
                .OrderByDescending(s => s.VideoResolution.Height)
                .ThenByDescending(s => s is MuxedStreamInfo)
                .ThenByDescending(s => s.Size.Bytes)
                .FirstOrDefault()
                ?? manifest.GetVideoStreams()
                    .OrderBy(s => s.VideoResolution.Height)
                    .FirstOrDefault();
        }
        if (videoStream is null)
            throw new YoutubeExplodeException("No video stream available.");
        wantMuxed = videoStream is MuxedStreamInfo;

        var outVideo = Path.Combine(tmpDir, $"tvdl-{id}.mp4");
        if (wantMuxed)
        {
            await youtube.Videos.Streams.DownloadAsync(videoStream, outVideo, null, token);
        }
        else
        {
            var audio = manifest.GetAudioStreams()
                .OrderByDescending(s => s.Bitrate.BitsPerSecond)
                .FirstOrDefault();
            var streams = audio is null
                ? new[] { videoStream }
                : new IStreamInfo[] { videoStream, audio };
            var request = new ConversionRequestBuilder(outVideo)
                .SetFFmpegPath(ffmpegPath)
                .SetContainer(Container.Mp4)
                .SetPreset(ConversionPreset.Medium)
                .Build();
            await youtube.Videos.DownloadAsync(
                streams, Array.Empty<ClosedCaptionTrackInfo>(), request, null, token);
        }
        var vStream = new FileStream(outVideo, FileMode.Open, FileAccess.Read, FileShare.None,
            65536, FileOptions.DeleteOnClose);
        return Results.File(vStream, "application/octet-stream", $"{title}.mp4");
    }
    catch (Exception ex) when (ex is YoutubeExplodeException or OperationCanceledException or ArgumentException or FormatException)
    {
        return Results.Json(new
        {
            error = "Download failed.",
            detail = ex.Message[..Math.Min(200, ex.Message.Length)],
        }, statusCode: 502);
    }
});

app.Urls.Clear();
app.Urls.Add($"http://*:{port}");
Console.WriteLine($"toolverse-ye-backend on :{port} (cookies: {(hasCookies ? "yes" : "no")})");
await app.RunAsync();

// Type declarations must follow all top-level statements.
record PlayerMetadata(string Title, string Author, double? DurationSeconds, string? ThumbnailUrl);
