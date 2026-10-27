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

// ---- Visitor / Server cookies ----
// Accepts raw Netscape cookies.txt text or its base64 form.
static List<Cookie> ParseVisitorCookies(string? input)
{
    var cookies = new List<Cookie>();
    if (string.IsNullOrWhiteSpace(input))
        return cookies;
    var text = input.Trim().Trim('"', '\'');
    if (!text.Contains(".youtube.com", StringComparison.OrdinalIgnoreCase)
        && !text.Contains('\t'))
    {
        try { text = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(text)); }
        catch { return cookies; }
    }
    var allowedCookies = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        "SID", "HSID", "SSID", "APISID", "SAPISID", "LOGIN_INFO"
    };

    foreach (var line in text.Split('\n'))
    {
        var l = line.Trim();
        if (l.Length == 0 || (l.StartsWith('#') && !l.StartsWith("#HttpOnly_")))
            continue;
        l = l.Replace("#HttpOnly_", "", StringComparison.Ordinal);
        var parts = l.Split('\t');
        if (parts.Length < 7)
            continue;
        var name = parts[5].Trim();
        var val = parts[6].Trim();
        if (!allowedCookies.Contains(name))
            continue;
        try
        {
            var domain = parts[0].Trim();
            if (!domain.StartsWith('.'))
                domain = "." + domain;
            var cleanVal = val.Trim('"');
            cookies.Add(new Cookie(name, cleanVal)
            {
                Domain = domain,
                Path = "/",
                Secure = true,
            });
        }
        catch { /* skip malformed cookie lines */ }
    }
    return cookies;
}

// ---- YoutubeExplode client (supports server-level COOKIES_B64 env var) ----
var customHttpClient = new HttpClient(new SocketsHttpHandler
{
    PooledConnectionLifetime = TimeSpan.FromMinutes(15),
    ConnectTimeout = TimeSpan.FromSeconds(15),
});
customHttpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36");

var serverCookies = ParseVisitorCookies(Environment.GetEnvironmentVariable("COOKIES_B64"));
var hasCookies = serverCookies.Count > 0;
var youtube = hasCookies ? new YoutubeClient(customHttpClient, serverCookies) : new YoutubeClient(customHttpClient);
Console.WriteLine($"[startup] toolverse-ye-backend loaded {serverCookies.Count} server cookies.");

static void AddVisitorAuth(HttpRequestMessage req, IReadOnlyList<Cookie> cookies)
{
    if (cookies.Count == 0)
        return;
    req.Headers.Add("Cookie", string.Join("; ", cookies.Select(c => $"{c.Name}={c.Value}")));
    req.Headers.Add("Origin", "https://www.youtube.com");
    req.Headers.Add("Referer", "https://www.youtube.com/");
    var sapisid = cookies.FirstOrDefault(c => c.Name == "__Secure-3PAPISID")?.Value
        ?? cookies.FirstOrDefault(c => c.Name == "SAPISID")?.Value;
    if (string.IsNullOrEmpty(sapisid))
        return;
    var ts = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
    var bytes = System.Text.Encoding.UTF8.GetBytes($"{ts} {sapisid} https://www.youtube.com");
    var hash = Convert.ToHexString(System.Security.Cryptography.SHA1.HashData(bytes)).ToLowerInvariant();
    req.Headers.Add("Authorization", $"SAPISIDHASH {ts}_{hash}");
}
var rawHttp = new HttpClient();

async Task<string?> ResolveVisitorDataAsync(CancellationToken ct, IReadOnlyList<Cookie> cookies)
{
    try
    {
        using var req = new HttpRequestMessage(HttpMethod.Get, "https://www.youtube.com/sw.js_data");
        req.Headers.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
        req.Headers.Add("User-Agent", "com.google.android.youtube/20.10.38 (Linux; U; ANDROID 11) gzip");
        AddVisitorAuth(req, cookies);
        using var res = await rawHttp.SendAsync(req, ct);
        if (!res.IsSuccessStatusCode) return null;
        var json = await res.Content.ReadAsStringAsync(ct);
        if (json.StartsWith(")]}'"))
            json = json[4..];
        using var doc = JsonDocument.Parse(json);
        return doc.RootElement[0][2][0][0][13].GetString();
    }
    catch
    {
        return null;
    }
}

async Task<(PlayerMetadata Meta, List<IVideoStreamInfo> Video, List<IAudioStreamInfo> Audio, string ClientUsed)> FetchPlayerResponseAsync(string videoId, CancellationToken ct, IReadOnlyList<Cookie> cookies)
{
    // YouTube's public innertube web-client key (the same one YoutubeExplode
    // appends to youtubei requests; it is embedded in YouTube's own pages).
    const string apiKeyInnertube = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
    var visitorData = await ResolveVisitorDataAsync(ct, cookies);
    var androidClient = new Dictionary<string, object?>
    {
        ["clientName"] = "ANDROID",
        ["clientVersion"] = "20.10.38",
        ["androidSdkVersion"] = 31,
        ["osName"] = "Android",
        ["osVersion"] = "12",
        ["hl"] = "en",
    };
    if (!string.IsNullOrEmpty(visitorData))
        androidClient["visitorData"] = visitorData;

    var clients = new[] { androidClient };
    string lastError = "unknown player error";
    (PlayerMetadata Meta, List<IVideoStreamInfo> Video, List<IAudioStreamInfo> Audio, string ClientUsed)? bestCandidate = null;
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
        var cn = client["clientName"]?.ToString() ?? "";
        if (cn == "ANDROID")
        {
            req.Headers.Add("User-Agent", "com.google.android.youtube/20.10.38 (Linux; U; ANDROID 11) gzip");
            if (cookies.Count > 0)
                req.Headers.Add("Cookie", string.Join("; ", cookies.Select(c => $"{c.Name}={c.Value}")));
        }
        else
        {
            req.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36");
            AddVisitorAuth(req, cookies);
        }
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
                    try
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
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[muxed-format-err] {ex.GetType().Name}: {ex.Message}");
                    }
                }
            }
            if (sd.TryGetProperty("adaptiveFormats", out var afmts))
            {
                foreach (var f in afmts.EnumerateArray())
                {
                    try
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
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[adaptive-format-err] {ex.GetType().Name}: {ex.Message}");
                    }
                }
            }
        }
        Console.WriteLine($"[player] cn={cn}, videoCount={videoInfos.Count}, audioCount={audioInfos.Count}");
        if (videoInfos.Count == 0 && audioInfos.Count == 0)
        {
            lastError = "player OK but no direct-URL streams";
            continue;
        }
        bestCandidate = (new PlayerMetadata(title, author, duration, thumb), videoInfos, audioInfos, cn);
        break; // ANDROID unciphered streams are direct and unthrottled
    }
    if (bestCandidate != null)
        return bestCandidate.Value;
    throw new YoutubeExplodeException($"Video is not playable via the player API: {lastError}");
}

static long ParseLen(JsonElement f) =>
    f.TryGetProperty("contentLength", out var cl) && long.TryParse(cl.GetString(), out var n) ? n : 0;

static long ParseBitrate(JsonElement f) =>
    f.TryGetProperty("bitrate", out var b) && b.ValueKind == JsonValueKind.Number ? b.GetInt64() : 0;

var cache = new ConcurrentDictionary<string, (DateTimeOffset Expires, VideoData Data)>(); // VideoData defined below

async Task<VideoData> GetVideoDataAsync(string url, CancellationToken ct, IReadOnlyList<Cookie>? visitorCookies = null, bool bypassCache = false)
{
    var vc = (visitorCookies != null && visitorCookies.Count > 0) ? visitorCookies : serverCookies;

    if (!bypassCache && (visitorCookies == null || visitorCookies.Count == 0))
    {
        if (cache.TryGetValue(url, out var hit) && hit.Expires > DateTimeOffset.UtcNow)
            return hit.Data;
    }
    if (visitorCookies != null && visitorCookies.Count > 0)
        Console.WriteLine($"[info] visitor cookies supplied ({visitorCookies.Count} cookies)");

    var videoId = VideoId.TryParse(url)
        ?? throw new ArgumentException($"Invalid YouTube video ID or URL '{url}'.");

    (PlayerMetadata Meta, List<IVideoStreamInfo> Video, List<IAudioStreamInfo> Audio, string ClientUsed)? raw = null;
    string? rawError = null;
    try
    {
        raw = await FetchPlayerResponseAsync(videoId.Value, ct, vc);
    }
    catch (Exception ex)
    {
        rawError = ex.Message;
        Console.WriteLine($"[player] raw player error: {ex.Message}");
    }

    StreamManifest? manifest = null;
    string? yeError = null;
    if (Environment.GetEnvironmentVariable("FORCE_RAW_FALLBACK") == "1")
    {
        Console.WriteLine("[fallback] FORCE_RAW_FALLBACK=1; using raw player streams");
    }
    else
    {
        // 1. Try with cookies if available
        if (vc.Count > 0)
        {
            try
            {
                var cookieClient = new YoutubeClient(customHttpClient, vc);
                manifest = await cookieClient.Videos.Streams.GetManifestAsync(videoId, ct);
            }
            catch (Exception ex1)
            {
                try
                {
                    var cookieClientNoHttp = new YoutubeClient(vc);
                    manifest = await cookieClientNoHttp.Videos.Streams.GetManifestAsync(videoId, ct);
                }
                catch (Exception ex2)
                {
                    yeError = $"cookie: {ex1.GetType().Name} ({ex1.Message}) | cookieNoHttp: {ex2.GetType().Name} ({ex2.Message})";
                    Console.WriteLine($"[ye] cookie manifest failed ({yeError})");
                }
            }
        }
        // 2. Try clean client if manifest is still null
        if (manifest == null)
        {
            try
            {
                var cleanClient = new YoutubeClient(customHttpClient);
                manifest = await cleanClient.Videos.Streams.GetManifestAsync(videoId, ct);
            }
            catch (Exception ex3)
            {
                try
                {
                    var cleanClientNoHttp = new YoutubeClient();
                    manifest = await cleanClientNoHttp.Videos.Streams.GetManifestAsync(videoId, ct);
                }
                catch (Exception ex4)
                {
                    yeError = (yeError != null ? yeError + " | " : "") + $"clean: {ex3.GetType().Name} ({ex3.Message}) | cleanNoHttp: {ex4.GetType().Name} ({ex4.Message})";
                    Console.WriteLine($"[fallback] YE manifest failed ({yeError}); using raw {raw?.ClientUsed} player streams");
                }
            }
        }
    }

    if (manifest == null && raw == null)
        throw new YoutubeExplodeException($"Could not extract video streams. (YE: {yeError} | Raw: {rawError})");

    PlayerMetadata meta = raw?.Meta ?? new PlayerMetadata("YouTube Video", "", null, null);
    if (raw == null && manifest != null)
    {
        try
        {
            var dlClient = vc.Count > 0 ? new YoutubeClient(vc) : new YoutubeClient();
            var v = await dlClient.Videos.GetAsync(videoId.Value, ct);
            meta = new PlayerMetadata(
                v.Title,
                v.Author.ChannelTitle,
                v.Duration?.TotalSeconds,
                v.Thumbnails.OrderByDescending(t => t.Resolution.Area).FirstOrDefault()?.Url
            );
        }
        catch { /* keep fallback meta */ }
    }

    var data = manifest is not null
        ? new VideoData(meta, manifest.GetVideoStreams().ToList(), manifest.GetAudioStreams().ToList(), "youtubeExplode", raw?.ClientUsed ?? "youtubeExplode", null)
        : new VideoData(meta, raw!.Value.Video, raw.Value.Audio, "rawPlayer", raw.Value.ClientUsed, yeError);
    if (visitorCookies == null || visitorCookies.Count == 0)
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
    version = "3.0-robust",
    engine = "YoutubeExplode",
    cookies = hasCookies,
    serverCookiesCount = serverCookies.Count,
    visitorCookies = true,
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
    var visitorCookies = ParseVisitorCookies(
        body.TryGetProperty("cookies", out var ck) ? ck.GetString() : null);
    try
    {
        var data = await GetVideoDataAsync(url!, ct, visitorCookies);
        var meta = data.Meta;
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
        else if (byHeight.Values.Any(v => v.HasAudio))
        {
            var muxed = byHeight.Values.First(v => v.HasAudio).Stream;
            resources.Add(new
            {
                id = "audio",
                quality = 0,
                ext = "mp3",
                size = muxed.Size.Bytes,
                sizeLabel = SizeLabel(muxed.Size.Bytes),
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
            cookies = visitorCookies.Count > 0,
            source = data.Source,
            clientUsed = data.RawClient,
            yeError = data.YeError,
        });
    }
    catch (Exception ex) when (ex is YoutubeExplodeException or OperationCanceledException or ArgumentException or FormatException or HttpRequestException or IOException)
    {
        return Results.Json(new
        {
            error = "Could not fetch video info.",
            detail = ex.Message,
            hint = "YouTube blocks anonymous server IPs; this service needs an unflagged IP.",
            cookiesUsed = visitorCookies.Count > 0,
        }, statusCode: 502);
    }
});

async Task DownloadMediaStreamAsync(string streamUrl, string destinationPath, IReadOnlyList<Cookie> cookies, CancellationToken ct)
{
    using var dlReq = new HttpRequestMessage(HttpMethod.Get, streamUrl);
    var ua = streamUrl.Contains("c=ANDROID", StringComparison.OrdinalIgnoreCase)
        ? "com.google.android.youtube/20.10.38 (Linux; U; ANDROID 11) gzip"
        : streamUrl.Contains("c=IOS", StringComparison.OrdinalIgnoreCase)
            ? "com.google.ios.youtube/19.29.1 (iPhone16,2; U; CPU iOS 17_5_1 like Mac OS X; en_US)"
            : streamUrl.Contains("c=VISIONOS", StringComparison.OrdinalIgnoreCase)
                ? "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
                : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
    dlReq.Headers.Add("User-Agent", ua);
    dlReq.Headers.Add("Referer", "https://www.youtube.com/");
    if (cookies.Count > 0)
        dlReq.Headers.Add("Cookie", string.Join("; ", cookies.Select(c => $"{c.Name}={c.Value}")));

    using var dlRes = await rawHttp.SendAsync(dlReq, HttpCompletionOption.ResponseHeadersRead, ct);
    if (!dlRes.IsSuccessStatusCode)
    {
        var body = await dlRes.Content.ReadAsStringAsync(ct);
        throw new YoutubeExplodeException($"GoogleVideo returned HTTP {(int)dlRes.StatusCode}: {body[..Math.Min(300, body.Length)]}");
    }
    await using var fs = new FileStream(destinationPath, FileMode.Create, FileAccess.Write, FileShare.None);
    await dlRes.Content.CopyToAsync(fs, ct);
}

// ---- Download ----
app.MapGet("/api/download", async (HttpContext ctx, CancellationToken ct) =>
{
    if (!RateOk(ctx, 20))
        return Results.Json(new { error = "Rate limited." }, statusCode: 429);
    var q = ctx.Request.Query;
    var url = q["url"].FirstOrDefault();
    var formatId = q["format_id"].FirstOrDefault();
    var qualityRaw = q["quality"].FirstOrDefault();
    var audioOnly = q["audio"].FirstOrDefault() == "1" || formatId == "audio";
    var visitorCookies = ParseVisitorCookies(q["cookies"].FirstOrDefault());
    var activeCookies = visitorCookies.Count > 0 ? visitorCookies : serverCookies;
    var audioFormat = q["audio_format"].FirstOrDefault()?.ToLowerInvariant() ?? "mp3";
    if (!new[] { "mp3", "m4a", "wav", "opus", "ogg" }.Contains(audioFormat))
        audioFormat = "mp3";
    if (!IsValidUrl(url))
        return Results.Json(new { error = "A valid video URL is required." }, statusCode: 400);

    using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
    timeout.CancelAfter(TimeSpan.FromMinutes(maxMinutes));
    var token = timeout.Token;

    try
    {
        var data = await GetVideoDataAsync(url!, token, visitorCookies, bypassCache: true);
        var meta = data.Meta;
        var title = SanitizeFilename(meta.Title);
        var id = Guid.NewGuid().ToString("N")[..12];
        var videoStreams = data.Video;
        var audioStreams = data.Audio;
        var dlClient = activeCookies.Count > 0 ? new YoutubeClient(activeCookies) : new YoutubeClient();

        if (audioOnly)
        {
            var audio = audioStreams
                .OrderByDescending(s => s.Bitrate.BitsPerSecond)
                .FirstOrDefault()
                ?? videoStreams.FirstOrDefault(s => s is MuxedStreamInfo) as IStreamInfo
                ?? throw new YoutubeExplodeException("No audio stream available.");
            var inPath = Path.Combine(tmpDir, $"in-{id}.bin");
            var outPath = Path.Combine(tmpDir, $"tvdl-{id}.{audioFormat}");

            try
            {
                if (data.Source == "youtubeExplode")
                    await dlClient.Videos.Streams.DownloadAsync(audio, inPath, null, token);
                else
                    await DownloadMediaStreamAsync(audio.Url, inPath, activeCookies, token);

                using var proc = new System.Diagnostics.Process();
                proc.StartInfo.FileName = ffmpegPath;
                proc.StartInfo.ArgumentList.Add("-y");
                proc.StartInfo.ArgumentList.Add("-i");
                proc.StartInfo.ArgumentList.Add(inPath);
                proc.StartInfo.ArgumentList.Add("-vn");
                if (audioFormat == "m4a")
                {
                    proc.StartInfo.ArgumentList.Add("-c:a");
                    proc.StartInfo.ArgumentList.Add("aac");
                    proc.StartInfo.ArgumentList.Add("-b:a");
                    proc.StartInfo.ArgumentList.Add("192k");
                }
                else if (audioFormat == "opus")
                {
                    proc.StartInfo.ArgumentList.Add("-c:a");
                    proc.StartInfo.ArgumentList.Add("libopus");
                    proc.StartInfo.ArgumentList.Add("-b:a");
                    proc.StartInfo.ArgumentList.Add("128k");
                }
                else if (audioFormat == "ogg")
                {
                    proc.StartInfo.ArgumentList.Add("-c:a");
                    proc.StartInfo.ArgumentList.Add("libvorbis");
                    proc.StartInfo.ArgumentList.Add("-b:a");
                    proc.StartInfo.ArgumentList.Add("192k");
                }
                else if (audioFormat == "wav")
                {
                    proc.StartInfo.ArgumentList.Add("-c:a");
                    proc.StartInfo.ArgumentList.Add("pcm_s16le");
                }
                else
                {
                    proc.StartInfo.ArgumentList.Add("-c:a");
                    proc.StartInfo.ArgumentList.Add("libmp3lame");
                    proc.StartInfo.ArgumentList.Add("-b:a");
                    proc.StartInfo.ArgumentList.Add("192k");
                }
                proc.StartInfo.ArgumentList.Add(outPath);
                proc.StartInfo.RedirectStandardError = true;
                proc.StartInfo.UseShellExecute = false;
                proc.StartInfo.CreateNoWindow = true;
                proc.Start();
                var stderrTask = proc.StandardError.ReadToEndAsync(token);
                await proc.WaitForExitAsync(token);
                var stderr = await stderrTask;
                if (!File.Exists(outPath) || new FileInfo(outPath).Length == 0)
                {
                    var errTail = stderr.Length > 500 ? stderr[^500..] : stderr;
                    throw new YoutubeExplodeException($"FFmpeg audio extraction failed (exit {proc.ExitCode}): {errTail.Replace("\r", "").Replace("\n", " ")}");
                }
            }
            finally
            {
                if (File.Exists(inPath))
                    try { File.Delete(inPath); } catch {}
            }

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
            if (data.Source == "youtubeExplode")
                await dlClient.Videos.Streams.DownloadAsync(videoStream, outVideo, null, token);
            else
                await DownloadMediaStreamAsync(videoStream.Url, outVideo, activeCookies, token);
        }
        else
        {
            var inVideo = Path.Combine(tmpDir, $"inv-{id}.mp4");
            var inAudio = Path.Combine(tmpDir, $"ina-{id}.m4a");
            var audio = audioStreams
                .OrderByDescending(s => s.Bitrate.BitsPerSecond)
                .FirstOrDefault();
            try
            {
                if (data.Source == "youtubeExplode")
                {
                    await dlClient.Videos.Streams.DownloadAsync(videoStream, inVideo, null, token);
                    if (audio is not null)
                        await dlClient.Videos.Streams.DownloadAsync(audio, inAudio, null, token);
                }
                else
                {
                    await DownloadMediaStreamAsync(videoStream.Url, inVideo, activeCookies, token);
                    if (audio is not null)
                        await DownloadMediaStreamAsync(audio.Url, inAudio, activeCookies, token);
                }

                if (audio is not null)
                {
                    using var proc = new System.Diagnostics.Process();
                    proc.StartInfo.FileName = ffmpegPath;
                    proc.StartInfo.ArgumentList.Add("-y");
                    proc.StartInfo.ArgumentList.Add("-i");
                    proc.StartInfo.ArgumentList.Add(inVideo);
                    proc.StartInfo.ArgumentList.Add("-i");
                    proc.StartInfo.ArgumentList.Add(inAudio);
                    proc.StartInfo.ArgumentList.Add("-c:v");
                    proc.StartInfo.ArgumentList.Add("copy");
                    proc.StartInfo.ArgumentList.Add("-c:a");
                    proc.StartInfo.ArgumentList.Add("aac");
                    proc.StartInfo.ArgumentList.Add("-movflags");
                    proc.StartInfo.ArgumentList.Add("+faststart");
                    proc.StartInfo.ArgumentList.Add(outVideo);
                    proc.StartInfo.RedirectStandardError = true;
                    proc.StartInfo.UseShellExecute = false;
                    proc.StartInfo.CreateNoWindow = true;
                    proc.Start();
                    var stderrTask = proc.StandardError.ReadToEndAsync(token);
                    await proc.WaitForExitAsync(token);
                    var stderr = await stderrTask;
                    if (!File.Exists(outVideo) || new FileInfo(outVideo).Length == 0)
                    {
                        var errTail = stderr.Length > 500 ? stderr[^500..] : stderr;
                        throw new YoutubeExplodeException($"FFmpeg muxing failed (exit {proc.ExitCode}): {errTail.Replace("\r", "").Replace("\n", " ")}");
                    }
                }
                else
                {
                    File.Move(inVideo, outVideo, overwrite: true);
                }
            }
            finally
            {
                if (File.Exists(inVideo)) try { File.Delete(inVideo); } catch {}
                if (File.Exists(inAudio)) try { File.Delete(inAudio); } catch {}
            }
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
            detail = $"{ex.GetType().Name}: {ex.Message}",
        }, statusCode: 502);
    }
});

app.Urls.Clear();
app.Urls.Add($"http://*:{port}");
Console.WriteLine($"toolverse-ye-backend on :{port} (cookies: {(hasCookies ? "yes" : "no")})");
await app.RunAsync();

// Type declarations must follow all top-level statements.
record PlayerMetadata(string Title, string Author, double? DurationSeconds, string? ThumbnailUrl);
record VideoData(PlayerMetadata Meta, List<IVideoStreamInfo> Video, List<IAudioStreamInfo> Audio, string Source, string RawClient, string? YeError = null);
