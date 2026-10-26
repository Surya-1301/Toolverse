// Toolverse YouTube download backend — YoutubeExplode method (no yt-dlp).
//
// How it works (traced from Tyrrrz/YoutubeExplode):
//   1. visitorData is fetched from youtube.com/sw.js_data (Android UA).
//   2. Player response comes from youtubei/v1/player, client VISIONOS first,
//      ANDROID as fallback, TVHTML5_SIMPLY_EMBEDDED_PLAYER when a signature
//      timestamp is known (age-gated videos; stream URLs then need signature
//      deciphering, which YoutubeExplode does internally).
//   3. Stream URLs come from the player response's streamingData. If the
//      player call itself fails (the datacenter-IP bot block), no streams
//      exist at all — no downloader library can work around that from a
//      blocked IP; only a different IP or a paid API changes the outcome.
//
// API (kept compatible with yt-backend so the frontend only changes URL):
//   GET  /                            -> health check
//   POST /api/info   {url}            -> { title, thumbnail, duration,
//                                         uploader, isLive, resources[],
//                                         qualities[], hasAudio, cookies }
//        resources[]: { id, quality, ext, size, sizeLabel, hasAudio, fps,
//                       audioOnly? }  — video ids are "v<height>" (e.g.
//                       "v720"), the audio resource id is "audio".
//   GET  /api/download?url=&format_id=&quality=&audio=0|1
//          [&audio_format=mp3]        -> the file (attachment)
//
// Env:
//   PORT        listen port (default 3000; Render injects its own)
//   API_KEY     when set, /api/* requires x-api-key header or ?api_key=
//   CORS_ORIGIN comma-separated allowed origins (default: *)
//   TMPDIR      temp dir for in-progress downloads (default system temp)
//   MAX_MINUTES max download time per request (default 10)
//   CACHE_MIN   info/manifest cache TTL in minutes (default 10)
//   FFMPEG_PATH path to ffmpeg (default "ffmpeg" from PATH)
// Visitor cookies (per-request only): the server holds NO cookies of its
// own. A visitor may supply their own exported YouTube cookies with a
// request (info body "cookies", download query "cookies", raw Netscape
// text or base64). They are used for that request's player calls only,
// then dropped: never stored, never cached under, never logged. The
// frontend must point at a LOGIN_REQUIRED region for this to help —
// a hard-403 region (Frankfurt) refuses the player call itself, and no
// cookies of anyone's can pass that.

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

// ---- YoutubeExplode client (supports server-level cookies via COOKIES_B64 or cookies.txt, plus per-request visitor cookies) ----
var serverCookies = new List<Cookie>();
if (Environment.GetEnvironmentVariable("COOKIES_B64") is { Length: > 0 } b64)
{
    serverCookies = ParseVisitorCookies(b64);
}
else
{
    var cookieFile = Path.Combine(AppContext.BaseDirectory, "cookies.txt");
    if (File.Exists(cookieFile))
    {
        try { serverCookies = ParseVisitorCookies(File.ReadAllText(cookieFile)); } catch { }
    }
}
var hasCookies = serverCookies.Count > 0;
var youtube = hasCookies ? new YoutubeClient(serverCookies) : new YoutubeClient();

// ---- Visitor cookies: parsed per request, never stored or logged ----
// Accepts raw Netscape cookies.txt text or its base64 form (base64 is what
// the frontend sends in the download query string, where raw text with
// tabs/newlines does not belong). Only the count is ever logged.
static List<Cookie> ParseVisitorCookies(string? input)
{
    var cookies = new Dictionary<string, Cookie>(StringComparer.OrdinalIgnoreCase);
    if (string.IsNullOrWhiteSpace(input))
        return cookies.Values.ToList();
    var text = input.Trim();
    if (!text.Contains(".youtube.com", StringComparison.OrdinalIgnoreCase)
        && !text.Contains('\t'))
    {
        try { text = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(text)); }
        catch { return cookies.Values.ToList(); }
    }
    foreach (var line in text.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries))
    {
        var l = line.Trim();
        if (l.Length == 0 || (l.StartsWith('#') && !l.StartsWith("#HttpOnly_")))
            continue;
        l = l.Replace("#HttpOnly_", "", StringComparison.Ordinal);
        var parts = l.Split('\t');
        if (parts.Length < 7)
            continue;
        try
        {
            var rawDomain = parts[0].Trim();
            var name = parts[5].Trim();
            var val = parts[6].Trim();
            var path = string.IsNullOrWhiteSpace(parts[2]) ? "/" : parts[2].Trim();
            var isSecure = string.Equals(parts[3].Trim(), "TRUE", StringComparison.OrdinalIgnoreCase);

            var domain = rawDomain.StartsWith('.') ? rawDomain : "." + rawDomain;
            if (!domain.Contains("youtube.com"))
                domain = ".youtube.com";

            cookies[name] = new Cookie(name, val, path, domain) { Secure = isSecure };
        }
        catch { /* skip malformed cookie lines */ }
    }
    return cookies.Values.ToList();
}

static void AddVisitorAuth(HttpRequestMessage req, IReadOnlyList<Cookie> cookies)
{
    if (cookies.Count == 0)
        return;
    req.Headers.Add("Cookie", string.Join("; ", cookies.Select(c => $"{c.Name}={c.Value}")));
    var sapisid = cookies.FirstOrDefault(c => c.Name == "SAPISID")?.Value
        ?? cookies.FirstOrDefault(c => c.Name == "__Secure-3PAPISID")?.Value;
    if (string.IsNullOrEmpty(sapisid))
        return;
    var ts = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
    var bytes = System.Text.Encoding.UTF8.GetBytes($"{ts} {sapisid} https://www.youtube.com");
    var hash = Convert.ToHexString(System.Security.Cryptography.SHA1.HashData(bytes)).ToLowerInvariant();
    req.Headers.Add("Authorization", $"SAPISIDHASH {ts}_{hash}");
    if (!req.Headers.Contains("Origin"))
        req.Headers.Add("Origin", "https://www.youtube.com");
}

// ---- Metadata + manifest, player-API only ----
// YoutubeExplode's Videos.GetAsync() starts from the HTML watch page, which
// datacenter IPs get bot-checked on. The player API (innertube) is gated far
// less strictly, so metadata comes from a raw player POST — the same
// VISIONOS -> ANDROID client flow YoutubeExplode's VideoController uses —
// while streams/downloads still go through YoutubeExplode itself.
var rawHttp = new HttpClient();

async Task<string> ResolveVisitorDataAsync(CancellationToken ct)
{
    try
    {
        using var req = new HttpRequestMessage(HttpMethod.Get, "https://www.youtube.com/sw.js_data");
        req.Headers.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
        req.Headers.Add("User-Agent", "com.google.android.youtube/20.10.38 (Linux; U; ANDROID 11) gzip");
        using var res = await rawHttp.SendAsync(req, ct);
        if (!res.IsSuccessStatusCode)
            return "";
        var json = await res.Content.ReadAsStringAsync(ct);
        if (json.StartsWith(")]}'"))
            json = json[4..];
        using var doc = JsonDocument.Parse(json);
        return doc.RootElement[0][2][0][0][13].GetString() ?? "";
    }
    catch
    {
        return "";
    }
}

async Task<(PlayerMetadata Meta, List<IVideoStreamInfo> Video, List<IAudioStreamInfo> Audio, string ClientUsed)> FetchPlayerResponseAsync(string videoId, CancellationToken ct, IReadOnlyList<Cookie> cookies)
{
    // YouTube's public innertube web-client key (the same one YoutubeExplode
    // appends to youtubei requests; it is embedded in YouTube's own pages).
    const string apiKeyInnertube = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";

    var clients = new List<(string Name, string UA, Dictionary<string, object?> Context, bool UseWebAuth, bool SendCookies)>();

    // 1. If cookies are present, try WEB client first with proper visitor authorization
    if (cookies.Count > 0)
    {
        var webCtx = new Dictionary<string, object?>
        {
            ["clientName"] = "WEB",
            ["clientVersion"] = "2.20241021.01.00",
            ["hl"] = "en",
            ["gl"] = "US",
        };

        clients.Add((
            "WEB",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
            webCtx,
            true,
            true
        ));
    }

    // 2. ANDROID (Clean mobile client - works without web botguard and returns itag 18 direct stream)
    var androidCtx = new Dictionary<string, object?>
    {
        ["clientName"] = "ANDROID",
        ["clientVersion"] = "21.26.364",
        ["androidSdkVersion"] = 30,
        ["osName"] = "Android",
        ["osVersion"] = "11",
        ["hl"] = "en",
        ["gl"] = "US",
    };
    clients.Add((
        "ANDROID",
        "com.google.android.youtube/21.26.364 (Linux; U; Android 11; en_US; Pixel 7 Build/RQ3A.211001.001) gzip",
        androidCtx,
        false,
        false
    ));

    // 3. IOS (yt-dlp modern iOS client context)
    var iosCtx = new Dictionary<string, object?>
    {
        ["clientName"] = "IOS",
        ["clientVersion"] = "21.26.4",
        ["deviceMake"] = "Apple",
        ["deviceModel"] = "iPhone16,2",
        ["osName"] = "iOS",
        ["osVersion"] = "18.3.2.22D82",
        ["hl"] = "en",
        ["gl"] = "US",
    };
    clients.Add((
        "IOS",
        "com.google.ios.youtube/21.26.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)",
        iosCtx,
        false,
        false
    ));

    // 4. VISIONOS (fallback)
    var visionCtx = new Dictionary<string, object?>
    {
        ["clientName"] = "VISIONOS",
        ["clientVersion"] = "1.02",
        ["deviceMake"] = "Apple",
        ["deviceModel"] = "RealityDevice17,1",
        ["osName"] = "visionOS",
        ["osVersion"] = "26.5.23O471",
        ["hl"] = "en",
        ["gl"] = "US",
    };
    clients.Add((
        "VISIONOS",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        visionCtx,
        false,
        false
    ));

    string lastError = "unknown player error";
    foreach (var (clientName, userAgent, clientContext, useWebAuth, sendCookies) in clients)
    {
        var payload = JsonSerializer.Serialize(new Dictionary<string, object?>
        {
            ["videoId"] = videoId,
            ["contentCheckOk"] = true,
            ["racyCheckOk"] = true,
            ["context"] = new Dictionary<string, object?> { ["client"] = clientContext },
        });
        using var req = new HttpRequestMessage(HttpMethod.Post,
            $"https://www.youtube.com/youtubei/v1/player?key={apiKeyInnertube}&hl=en");
        req.Content = new StringContent(payload, System.Text.Encoding.UTF8, "application/json");
        req.Headers.Add("User-Agent", userAgent);

        if (useWebAuth && cookies.Count > 0)
        {
            req.Headers.Add("Referer", $"https://www.youtube.com/watch?v={videoId}");
            req.Headers.Add("X-YouTube-Client-Name", "1");
            req.Headers.Add("X-YouTube-Client-Version", "2.20241021.01.00");
            AddVisitorAuth(req, cookies);
        }
        else if (sendCookies && cookies.Count > 0)
        {
            req.Headers.Add("Cookie", string.Join("; ", cookies.Select(c => $"{c.Name}={c.Value}")));
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
        // Streams: formats[] are muxed (video+audio); adaptiveFormats[] are
        // video-only or audio-only. Only direct-URL entries are usable —
        // ciphered entries (signatureCipher, no url) are skipped.
        // Crucially, the entries are built as REAL YoutubeExplode stream
        // infos, so downloads go through the library's own MediaStream,
        // which beats YouTube's rate throttling with segmented Range
        // requests (~9.9 MB segments). A naive single GET of these URLs
        // gets throttled to a crawl and never finishes.
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

        // If formats returned a muxed stream (e.g. 360p itag 18) but no adaptive audio streams
        // had a direct URL, synthesize an audio stream from the muxed stream so audio extraction (mp3) works.
        if (audioInfos.Count == 0 && videoInfos.Any(v => v is MuxedStreamInfo))
        {
            var muxed = (MuxedStreamInfo)videoInfos.First(v => v is MuxedStreamInfo);
            audioInfos.Add(new AudioOnlyStreamInfo(
                muxed.Url,
                new Container("mp4"),
                muxed.Size,
                muxed.Bitrate,
                !string.IsNullOrEmpty(muxed.AudioCodec) ? muxed.AudioCodec : "mp4a.40.2",
                null,
                null
            ));
        }

        if (videoInfos.Count == 0 && audioInfos.Count == 0)
        {
            lastError = "player OK but no direct-URL streams";
            continue;
        }
        var clientUsed = clientName;
        return (new PlayerMetadata(title, author, duration, thumb), videoInfos, audioInfos, clientUsed);
    }
    throw new YoutubeExplodeException($"Video is not playable via the player API: {lastError}");
}

static long ParseLen(JsonElement f) =>
    f.TryGetProperty("contentLength", out var cl) && long.TryParse(cl.GetString(), out var n) ? n : 0;

static long ParseBitrate(JsonElement f) =>
    f.TryGetProperty("bitrate", out var b) && b.ValueKind == JsonValueKind.Number ? b.GetInt64() : 0;

// ---- Unified video data: YoutubeExplode manifest first, raw player fallback ----
// The raw player response is fetched FIRST (it also supplies metadata), then
// the YoutubeExplode manifest is attempted. If that fails with an HTTP error
// (e.g. HTTP 403 from a flagged datacenter IP — YoutubeExplode's own
// VISIONOS->ANDROID fallback does NOT trigger on HTTP errors, only on
// "unplayable" player responses), the raw streams are used instead and the
// fallback is logged, so the Render logs themselves show which player client
// worked from that IP. FORCE_RAW_FALLBACK=1 skips the YE manifest entirely
// (local testing of the raw path).
var cache = new ConcurrentDictionary<string, (DateTimeOffset Expires, VideoData Data)>(); // VideoData defined below

async Task<VideoData> GetVideoDataAsync(string url, CancellationToken ct, IReadOnlyList<Cookie>? visitorCookies = null)
{
    var vc = visitorCookies ?? Array.Empty<Cookie>();
    var effectiveCookies = vc.Count > 0 ? vc : (IReadOnlyList<Cookie>)serverCookies;
    // Visitor-cookie requests are never served from, or written to, the
    // shared cache: a manifest fetched as one visitor must never leak to
    // another. Only anonymous requests use the cache.
    if (vc.Count == 0 && cache.TryGetValue(url, out var hit) && hit.Expires > DateTimeOffset.UtcNow)
        return hit.Data;
    if (vc.Count > 0)
        Console.WriteLine($"[info] visitor cookies supplied ({vc.Count} cookies)");
    else if (serverCookies.Count > 0)
        Console.WriteLine($"[info] server cookies active ({serverCookies.Count} cookies)");

    // Normalize URL / extract 11-char video ID
    var videoId = VideoId.TryParse(url)
        ?? throw new ArgumentException($"Invalid YouTube video ID or URL '{url}'.");

    var client = effectiveCookies.Count > 0 ? new YoutubeClient(effectiveCookies) : youtube;

    // Try raw player response
    (PlayerMetadata Meta, List<IVideoStreamInfo> Video, List<IAudioStreamInfo> Audio, string ClientUsed)? raw = null;
    string? rawErr = null;
    try
    {
        raw = await FetchPlayerResponseAsync(videoId.Value, ct, effectiveCookies);
    }
    catch (Exception ex)
    {
        rawErr = ex.Message;
        Console.WriteLine($"[player] raw player failed ({ex.GetType().Name}: {ex.Message[..Math.Min(120, ex.Message.Length)]})");
    }

    StreamManifest? manifest = null;
    if (Environment.GetEnvironmentVariable("FORCE_RAW_FALLBACK") == "1")
    {
        Console.WriteLine("[fallback] FORCE_RAW_FALLBACK=1; using raw player streams");
    }
    else
    {
        try
        {
            manifest = await client.Videos.Streams.GetManifestAsync(videoId, ct);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[fallback] YE manifest failed ({ex.GetType().Name}: {ex.Message[..Math.Min(120, ex.Message.Length)]})");
        }
    }

    if (manifest is null && raw is null)
    {
        throw new YoutubeExplodeException($"Could not fetch video streams. {rawErr ?? "YouTube requires authentication or a non-datacenter IP."}");
    }

    PlayerMetadata meta;
    if (raw is not null)
    {
        meta = raw.Value.Meta;
    }
    else
    {
        try
        {
            var vid = await client.Videos.GetAsync(videoId, ct);
            meta = new PlayerMetadata(vid.Title, vid.Author.ChannelTitle, vid.Duration?.TotalSeconds, vid.Thumbnails.TryGetWithHighestResolution()?.Url);
        }
        catch
        {
            meta = new PlayerMetadata("YouTube Video", "", null, null);
        }
    }

    var vStreams = manifest is not null ? manifest.GetVideoStreams().ToList() : raw!.Value.Video;
    var aStreams = manifest is not null ? manifest.GetAudioStreams().ToList() : raw!.Value.Audio;

    if (aStreams.Count == 0 && vStreams.Any(v => v is MuxedStreamInfo))
    {
        var muxed = (MuxedStreamInfo)vStreams.First(v => v is MuxedStreamInfo);
        aStreams.Add(new AudioOnlyStreamInfo(
            muxed.Url,
            new Container("mp4"),
            muxed.Size,
            muxed.Bitrate,
            !string.IsNullOrEmpty(muxed.AudioCodec) ? muxed.AudioCodec : "mp4a.40.2",
            null,
            null
        ));
    }

    var sourceUsed = manifest is not null ? "youtubeExplode" : "rawPlayer";
    var clientUsed = raw?.ClientUsed ?? "youtubeExplode";

    var data = new VideoData(meta, vStreams, aStreams, sourceUsed, clientUsed);
    if (vc.Count == 0)
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
    service = "toolverse-yt-backend",
    version = "2026.10.26.6",
    engine = "YoutubeExplode",
    cookies = hasCookies,
    // Build marker: true only on the visitor-cookies build. Open the
    // backend URL in a browser to confirm the deployed build supports
    // per-request visitor cookies at all.
    visitorCookies = true,
    maxMinutes,
});

// ---- Fast Diagnostic Endpoint ----
app.MapGet("/api/diag", async (HttpContext ctx, CancellationToken ct) =>
{
    var url = ctx.Request.Query["url"].FirstOrDefault() ?? "https://www.youtube.com/watch?v=enY83Li8_ps";
    var videoId = VideoId.TryParse(url);
    if (videoId is null) return Results.Json(new { error = "Invalid URL" }, statusCode: 400);

    const string apiKeyInnertube = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
    var results = new List<object>();

    // Test ANDROID clean
    try
    {
        var androidCtx = new Dictionary<string, object?>
        {
            ["clientName"] = "ANDROID",
            ["clientVersion"] = "21.26.364",
            ["androidSdkVersion"] = 30,
            ["osName"] = "Android",
            ["osVersion"] = "11",
            ["hl"] = "en",
        };
        var payload = JsonSerializer.Serialize(new Dictionary<string, object?>
        {
            ["videoId"] = videoId.Value.Value,
            ["contentCheckOk"] = true,
            ["racyCheckOk"] = true,
            ["context"] = new Dictionary<string, object?> { ["client"] = androidCtx },
        });
        using var req = new HttpRequestMessage(HttpMethod.Post,
            $"https://www.youtube.com/youtubei/v1/player?key={apiKeyInnertube}&hl=en");
        req.Content = new StringContent(payload, System.Text.Encoding.UTF8, "application/json");
        req.Headers.Add("User-Agent", "com.google.android.youtube/21.26.364 (Linux; U; Android 11; en_US; Pixel 7 Build/RQ3A.211001.001) gzip");

        using var res = await rawHttp.SendAsync(req, ct);
        var bodyStr = await res.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(bodyStr);
        var root = doc.RootElement;
        var ps = root.TryGetProperty("playabilityStatus", out var p) ? p : default;
        var st = ps.ValueKind != JsonValueKind.Undefined && ps.TryGetProperty("status", out var s) ? s.GetString() : "none";
        var r = ps.ValueKind != JsonValueKind.Undefined && ps.TryGetProperty("reason", out var re) ? re.GetString() : null;
        var hasSd = root.TryGetProperty("streamingData", out var sd);
        var fmtCount = hasSd && sd.TryGetProperty("formats", out var f) ? f.GetArrayLength() : 0;
        var afmtCount = hasSd && sd.TryGetProperty("adaptiveFormats", out var af) ? af.GetArrayLength() : 0;
        results.Add(new { client = "ANDROID", http = (int)res.StatusCode, status = st, reason = r, formats = fmtCount, adaptive = afmtCount });
    }
    catch (Exception ex)
    {
        results.Add(new { client = "ANDROID", error = ex.Message });
    }

    var cookiesRaw = ctx.Request.Query["cookies"].FirstOrDefault();
    if (!string.IsNullOrEmpty(cookiesRaw))
    {
        var cookies = ParseVisitorCookies(cookiesRaw);
        try
        {
            var webCtx = new Dictionary<string, object?>
            {
                ["clientName"] = "WEB",
                ["clientVersion"] = "2.20241021.01.00",
                ["hl"] = "en",
                ["gl"] = "US",
            };
            var payload = JsonSerializer.Serialize(new Dictionary<string, object?>
            {
                ["videoId"] = videoId.Value.Value,
                ["contentCheckOk"] = true,
                ["racyCheckOk"] = true,
                ["context"] = new Dictionary<string, object?> { ["client"] = webCtx },
            });
            using var req = new HttpRequestMessage(HttpMethod.Post,
                $"https://www.youtube.com/youtubei/v1/player?key={apiKeyInnertube}&hl=en");
            req.Content = new StringContent(payload, System.Text.Encoding.UTF8, "application/json");
            req.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36");
            req.Headers.Add("Referer", $"https://www.youtube.com/watch?v={videoId.Value.Value}");
            req.Headers.Add("X-YouTube-Client-Name", "1");
            req.Headers.Add("X-YouTube-Client-Version", "2.20241021.01.00");
            AddVisitorAuth(req, cookies);

            using var res = await rawHttp.SendAsync(req, ct);
            var bodyStr = await res.Content.ReadAsStringAsync(ct);
            using var doc = JsonDocument.Parse(bodyStr);
            var root = doc.RootElement;
            var ps = root.TryGetProperty("playabilityStatus", out var p) ? p : default;
            var st = ps.ValueKind != JsonValueKind.Undefined && ps.TryGetProperty("status", out var s) ? s.GetString() : "none";
            var r = ps.ValueKind != JsonValueKind.Undefined && ps.TryGetProperty("reason", out var re) ? re.GetString() : null;
            results.Add(new { client = "WEB_WITH_COOKIES", cookieCount = cookies.Count, http = (int)res.StatusCode, status = st, reason = r });
        }
        catch (Exception ex)
        {
            results.Add(new { client = "WEB_WITH_COOKIES", error = ex.Message });
        }
    }

    return Results.Json(new { url, results });
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
            cookies = visitorCookies.Count > 0 || hasCookies,
            source = data.Source,
        });
    }
    catch (Exception ex) when (ex is YoutubeExplodeException or OperationCanceledException or ArgumentException or FormatException or HttpRequestException or IOException)
    {
        return Results.Json(new
        {
            error = "Could not fetch video info.",
            detail = ex.Message[..Math.Min(200, ex.Message.Length)],
            hint = "YouTube blocks anonymous server IPs; this service needs an unflagged IP or cookies.",
            cookiesUsed = visitorCookies.Count > 0 || hasCookies,
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
    var visitorCookies = ParseVisitorCookies(q["cookies"].FirstOrDefault());
    // Stream URLs are pre-signed once issued, but the download calls go
    // through the visitor's client anyway so nothing in the chain is
    // anonymous when the visitor supplied cookies.
    var dlClient = visitorCookies.Count > 0 ? new YoutubeClient(visitorCookies) : youtube;
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
        var data = await GetVideoDataAsync(url!, token, visitorCookies);
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
            await dlClient.Videos.DownloadAsync(
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
            await dlClient.Videos.Streams.DownloadAsync(videoStream, outVideo, null, token);
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
            await dlClient.Videos.DownloadAsync(
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
