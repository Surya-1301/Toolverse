using System.Collections.Concurrent;
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

// ---- YoutubeExplode client (anonymous only, no cookies by design) ----
var youtube = new YoutubeClient();
var hasCookies = false;
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

async Task<(PlayerMetadata Meta, List<IVideoStreamInfo> Video, List<IAudioStreamInfo> Audio, string ClientUsed)> FetchPlayerResponseAsync(string videoId, CancellationToken ct)
{
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
        var videoInfos = new List<IVideoStreamInfo>();
        var audioInfos = new List<IAudioStreamInfo>();
        if (root.TryGetProperty("streamingData", out var sd))
        {
            static (string Mime, string Sub, string[] Codecs) ParseMime(JsonElement f)
            {
                var full = f.TryGetProperty("mimeType", out var m) ? m.GetString() ?? "" : "";
                var mime = full.Split(';')[0].Trim();
                var sub = mime.Contains('/') ? mime[(mime.IndexOf('/') + 1)..] : "mp4";
                var codecs = Array.Empty<string>();
                var ci = full.IndexOf("codecs=\"", StringComparison.Ordinal);
                if (ci >= 0)
                {
                    var ce = full.IndexOf('"', ci + 8);
                    if (ce > ci)
                        codecs = full[(ci + 8)..ce].Split(',').Select(c => c.Trim()).ToArray();
                }
                return (mime, sub, codecs);
            }
            static int PropInt(JsonElement f, string name, int fallback) =>
                f.TryGetProperty(name, out var p) && p.ValueKind == JsonValueKind.Number ? p.GetInt32() : fallback;

            if (sd.TryGetProperty("formats", out var fmts))
            {
                foreach (var f in fmts.EnumerateArray())
                {
                    if (!f.TryGetProperty("url", out var u)) continue;
                    var (mime, _, codecs) = ParseMime(f);
                    if (mime != "video/mp4") continue; // only mp4 muxed is usable as-is
                    var h = PropInt(f, "height", 0);
                    var w = PropInt(f, "width", 0);
                    if (h <= 0) continue;
                    videoInfos.Add(new MuxedStreamInfo(
                        u.GetString()!, new Container("mp4"), new FileSize(ParseLen(f)), new Bitrate(ParseBitrate(f)),
                        codecs.Length > 1 ? codecs[1] : "", null, null,
                        codecs.Length > 0 ? codecs[0] : "",
                        new VideoQuality(h, PropInt(f, "fps", 30)), new Resolution(w, h)));
                }
            }
            if (sd.TryGetProperty("adaptiveFormats", out var afmts))
            {
                foreach (var f in afmts.EnumerateArray())
                {
                    if (!f.TryGetProperty("url", out var u)) continue;
                    var (mime, sub, codecs) = ParseMime(f);
                    var h = PropInt(f, "height", 0);
                    var w = PropInt(f, "width", 0);
                    var fps = PropInt(f, "fps", 30);
                    if (mime.StartsWith("video/"))
                    {
                        if (h <= 0) continue;
                        videoInfos.Add(new VideoOnlyStreamInfo(
                            u.GetString()!, new Container(sub), new FileSize(ParseLen(f)), new Bitrate(ParseBitrate(f)),
                            codecs.Length > 0 ? codecs[0] : "",
                            new VideoQuality(h, fps), new Resolution(w, h), false));
                    }
                    else if (mime.StartsWith("audio/"))
                    {
                        audioInfos.Add(new AudioOnlyStreamInfo(
                            u.GetString()!, new Container(sub), new FileSize(ParseLen(f)), new Bitrate(ParseBitrate(f)),
                            codecs.Length > 0 ? codecs[0] : "", null, null));
                    }
                }
            }
        }
        if (videoInfos.Count == 0 && audioInfos.Count == 0)
        {
            lastError = "player OK but no direct-URL streams";
            continue;
        }
        var clientUsed = client["clientName"]?.ToString() ?? "?";
        return (new PlayerMetadata(title, author, duration, thumb), videoInfos, audioInfos, clientUsed);
    }
    throw new YoutubeExplodeException($"Video is not playable via the player API: {lastError}");
}

static long ParseLen(JsonElement f) =>
    f.TryGetProperty("contentLength", out var cl) && long.TryParse(cl.GetString(), out var n) ? n : 0;

static long ParseBitrate(JsonElement f) =>
    f.TryGetProperty("bitrate", out var b) && b.ValueKind == JsonValueKind.Number ? b.GetInt64() : 0;

var cache = new ConcurrentDictionary<string, (DateTimeOffset Expires, VideoData Data)>(); // VideoData defined below

async Task<VideoData> GetVideoDataAsync(string url, CancellationToken ct)
{
    if (cache.TryGetValue(url, out var hit) && hit.Expires > DateTimeOffset.UtcNow)
        return hit.Data;
    // NOTE: new VideoId(url) does NOT normalize — it stores the raw string.
    // Only VideoId.Parse/TryParse extract the 11-char id from a watch URL.
    var videoId = VideoId.TryParse(url)
        ?? throw new ArgumentException($"Invalid YouTube video ID or URL '{url}'.");
    var raw = await FetchPlayerResponseAsync(videoId.Value, ct);
    StreamManifest? manifest = null;
    if (Environment.GetEnvironmentVariable("FORCE_RAW_FALLBACK") == "1")
    {
        Console.WriteLine("[fallback] FORCE_RAW_FALLBACK=1; using raw player streams");
    }
    else
    {
        try
        {
            manifest = await youtube.Videos.Streams.GetManifestAsync(videoId, ct);
        }
        catch (Exception ex) when (ex is HttpRequestException or IOException)
        {
            Console.WriteLine($"[fallback] YE manifest failed ({ex.GetType().Name}: {ex.Message[..Math.Min(120, ex.Message.Length)]}); using raw {raw.ClientUsed} player streams");
        }
    }
    var data = manifest is not null
        ? new VideoData(raw.Meta, manifest.GetVideoStreams().ToList(), manifest.GetAudioStreams().ToList(), "youtubeExplode", raw.ClientUsed)
        : new VideoData(raw.Meta, raw.Video, raw.Audio, "rawPlayer", raw.ClientUsed);
    cache[url] = (DateTimeOffset.UtcNow.AddMinutes(cacheMinutes), data);
    return data;
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
        var data = await GetVideoDataAsync(url!, ct);
        var meta = data.Meta;

        // One resource per height: prefer a muxed (has-audio) stream, then bigger file.
        // Both sources now speak IStreamInfo, so one code path serves both.
        var resources = new List<object>();
        var byHeight = new Dictionary<int, (IStreamInfo Stream, bool HasAudio)>();
        foreach (var s in data.Video)
        {
            var h = s.VideoResolution.Height;
            var hasAud = s is MuxedStreamInfo;
            var score = (hasAud ? 1L << 50 : 0) + s.Size.Bytes;
            if (!byHeight.TryGetValue(h, out var cur)
                || score > ((cur.HasAudio ? 1L << 50 : 0) + cur.Stream.Size.Bytes))
                byHeight[h] = (s, hasAud);
        }
        foreach (var h in byHeight.Keys.OrderBy(x => x))
        {
            var (s, hasAud) = byHeight[h];
            resources.Add(new
            {
                id = $"v{h}",
                quality = h,
                ext = "mp4",
                size = s.Size.Bytes,
                sizeLabel = SizeLabel(s.Size.Bytes),
                hasAudio = hasAud,
                fps = (int?)null,
            });
        }
        var bestAudio = data.Audio
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
        var heights = byHeight.Keys.OrderBy(x => x).ToList();
        var hasAudio = bestAudio is not null || byHeight.Values.Any(v => v.HasAudio);

        return Results.Json(new
        {
            title = meta.Title,
            thumbnail = meta.ThumbnailUrl,
            duration = meta.DurationSeconds,
            uploader = meta.Author,
            isLive = false,
            resources,
            qualities = heights.ToArray(),
            hasAudio,
            cookies = hasCookies,
            source = data.Source,
        });
    }
    catch (Exception ex) when (ex is YoutubeExplodeException or OperationCanceledException or ArgumentException or FormatException or HttpRequestException or IOException)
    {
        return Results.Json(new
        {
            error = "Could not fetch video info.",
            detail = ex.Message[..Math.Min(200, ex.Message.Length)],
            hint = "YouTube blocks anonymous server IPs; this service needs an unflagged IP.",
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
        var data = await GetVideoDataAsync(url!, token);
        var meta = data.Meta;
        var title = SanitizeFilename(meta.Title);
        var id = Guid.NewGuid().ToString("N")[..12];
        // Both sources speak IStreamInfo, so downloads use the library path for
        // both: MediaStream's segmented Range requests beat YouTube's throttling.
        var videoStreams = data.Video;
        var audioStreams = data.Audio;

        if (audioOnly)
        {
            var audio = audioStreams
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
            videoStream = videoStreams
                .Where(s => s.VideoResolution.Height == exactH)
                .OrderByDescending(s => s is MuxedStreamInfo)
                .ThenByDescending(s => s.Size.Bytes)
                .FirstOrDefault();
        }
        if (videoStream is null)
        {
            var wanted = Math.Clamp(int.TryParse(qualityRaw, out var qq) ? qq : 720, 144, 2160);
            videoStream = videoStreams
                .Where(s => s.VideoResolution.Height <= wanted)
                .OrderByDescending(s => s.VideoResolution.Height)
                .ThenByDescending(s => s is MuxedStreamInfo)
                .ThenByDescending(s => s.Size.Bytes)
                .FirstOrDefault()
                ?? videoStreams
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
            var audio = audioStreams
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
    catch (Exception ex) when (ex is YoutubeExplodeException or OperationCanceledException or ArgumentException or FormatException or HttpRequestException or IOException)
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
record VideoData(PlayerMetadata Meta, List<IVideoStreamInfo> Video, List<IAudioStreamInfo> Audio, string Source, string RawClient);