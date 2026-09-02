"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  FileAudio,
  Loader2,
  Music,
  RefreshCw,
  Settings2,
  Upload,
  Waves,
} from "lucide-react";
import { Container } from "@/components/Container";
import { Mp3Encoder } from "lamejs";

function BackToToolsLink() {
  return (
    <Link
      href="/tools/text-developer-tools"
      className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to tools
    </Link>
  );
}

const howToUseSteps = [
  {
    title: "Upload audio",
    description: "Add an audio file — MP3, WAV, OGG, WebM, M4A, and more.",
    icon: <Upload className="h-5 w-5" />,
  },
  {
    title: "Pick a format",
    description: "Choose MP3, WAV, or WebM (Opus) as the output.",
    icon: <Settings2 className="h-5 w-5" />,
  },
  {
    title: "Set quality",
    description: "Adjust the bitrate for smaller or higher-fidelity files.",
    icon: <Waves className="h-5 w-5" />,
  },
  {
    title: "Convert & download",
    description: "Convert right in your browser, then download the result.",
    icon: <Download className="h-5 w-5" />,
  },
];

function HowToUseSection() {
  return (
    <section className="mt-14">
      <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
        How to use Audio Converter
      </h2>

      <div className="mt-8 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
        {howToUseSteps.map((step) => (
          <div
            key={step.title}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500 text-white shadow-lg shadow-cyan-500/20">
              {step.icon}
            </div>
            <h3 className="text-sm font-semibold text-white">{step.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:hidden">
        {howToUseSteps.map((step) => (
          <div
            key={step.title}
            className="flex items-center gap-4 rounded-2xl border border-cyan-400/10 bg-[#071522] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/10 bg-[#092B40] text-[#63E5F7] shadow-[0_0_18px_rgba(34,211,238,0.08)]">
              {step.icon}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[14px] font-semibold leading-5 text-white">
                {step.title}
              </h3>
              <p className="mt-1 text-[12px] leading-5 text-slate-400">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ==========================================================================
   FORMAT CONFIG
========================================================================== */

type OutputFormat = "mp3" | "wav" | "webm";

const FORMAT_LABELS: Record<OutputFormat, string> = {
  mp3: "MP3",
  wav: "WAV",
  webm: "WebM (Opus)",
};

const FORMAT_EXTENSIONS: Record<OutputFormat, string> = {
  mp3: "mp3",
  wav: "wav",
  webm: "webm",
};

const DEFAULT_BITRATES: Record<OutputFormat, number> = {
  mp3: 192,
  wav: 16, // bits per sample for WAV
  webm: 128,
};

/* ==========================================================================
   UTILITIES
========================================================================== */

async function decodeAudioFile(file: File): Promise<{
  audioBuffer: AudioBuffer;
}> {
  const arrayBuffer = await file.arrayBuffer();

  // Try decoding directly
  const AudioContextCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;

  const ctx = new AudioContextCtor();
  try {
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    return { audioBuffer };
  } finally {
    await ctx.close();
  }
}

function floatTo16BitPCM(float32Array: Float32Array): Int16Array {
  const int16 = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16;
}

/* Encode an AudioBuffer to WAV (PCM). */
function encodeToWav(buffer: AudioBuffer, bitsPerSample = 16): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = numFrames * blockAlign;

  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  // fmt chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // byte rate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  // data chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;

  // Interleave channels
  if (numChannels === 2) {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    for (let i = 0; i < numFrames; i++) {
      writeSample(view, offset, left[i], bitsPerSample); offset += bytesPerSample;
      writeSample(view, offset, right[i], bitsPerSample); offset += bytesPerSample;
    }
  } else {
    const data = buffer.getChannelData(0);
    for (let i = 0; i < numFrames; i++) {
      writeSample(view, offset, data[i], bitsPerSample); offset += bytesPerSample;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });

  function writeSample(v: DataView, o: number, val: number, bits: number) {
    const clamped = Math.max(-1, Math.min(1, val));
    if (bits === 16) {
      v.setInt16(o, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    } else {
      v.setInt8(o, clamped * 0x7f);
    }
  }
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/* Encode an AudioBuffer to MP3 using lamejs. */
function encodeToMp3(buffer: AudioBuffer, kbps: number): Blob {
  const channels = buffer.numberOfChannels >= 2 ? 2 : 1;
  const sampleRate = buffer.sampleRate;
  const left = floatTo16BitPCM(buffer.getChannelData(0));
  const right =
    channels === 2 ? floatTo16BitPCM(buffer.getChannelData(1)) : undefined;

  const encoder = new Mp3Encoder(channels, sampleRate, kbps);
  const maxSamples = 1152;
  const chunks: BlobPart[] = [];

  const pushChunk = (buf: Int8Array) => {
    if (buf.length === 0) return;
    const out = new Uint8Array(buf.length);
    out.set(new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength));
    chunks.push(out);
  };

  for (let i = 0; i < left.length; i += maxSamples) {
    const leftChunk = left.subarray(i, i + maxSamples);
    const rightChunk = right ? right.subarray(i, i + maxSamples) : undefined;
    pushChunk(encoder.encodeBuffer(leftChunk, rightChunk));
  }

  pushChunk(encoder.flush());

  return new Blob(chunks, { type: "audio/mpeg" });
}

/* Encode an AudioBuffer to WebM (Opus) via MediaRecorder. */
async function encodeToWebm(
  buffer: AudioBuffer,
  kbps: number,
): Promise<Blob> {
  const AudioContextCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;

  const ctx = new AudioContextCtor();
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  if (!ctx.createMediaStreamDestination) {
    throw new Error("Video/audio recording is not supported in this browser.");
  }

  const dest = ctx.createMediaStreamDestination();
  source.connect(dest);

  const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : "audio/webm";

  const recorder = new MediaRecorder(dest.stream, {
    mimeType,
    audioBitsPerSecond: kbps * 1000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });

  recorder.start();
  source.start(0);

  // Wait until the source finishes playing.
  await new Promise<void>((resolve) => {
    source.onended = () => resolve();
  });

  // Slight delay to flush remaining data.
  await new Promise((r) => setTimeout(r, 250));
  recorder.stop();
  await stopped;

  await ctx.close();

  return new Blob(chunks, { type: mimeType });
}

interface AudioFileInfo {
  file: File;
  name: string;
  size: number;
  duration: number;
  sampleRate: number;
  channels: number;
  buffer: AudioBuffer;
}

/* ==========================================================================
   PAGE
========================================================================== */

export default function AudioConverterPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [info, setInfo] = useState<AudioFileInfo | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("mp3");
  const [kbps, setKbps] = useState(DEFAULT_BITRATES.mp3);
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState("");
  const [output, setOutput] = useState<{ blob: Blob; name: string; format: OutputFormat; size: number } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFile = useCallback(async (file: File | undefined) => {
    if (!file) return;
    setError("");
    setOutput(null);
    setLoading(true);
    try {
      const { audioBuffer } = await decodeAudioFile(file);
      const name = file.name.replace(/\.[^.]+$/, "");
      setInfo({
        file,
        name,
        size: file.size,
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
        buffer: audioBuffer,
      });
      setKbps(DEFAULT_BITRATES[outputFormat]);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not decode this audio file.",
      );
    } finally {
      setLoading(false);
    }
  }, [outputFormat]);

  function onFormatChange(fmt: OutputFormat) {
    setOutputFormat(fmt);
    setKbps(DEFAULT_BITRATES[fmt]);
    setOutput(null);
  }

  async function convert() {
    if (!info) return;
    setConverting(true);
    setError("");
    setOutput(null);
    try {
      let blob: Blob;
      if (outputFormat === "wav") {
        blob = encodeToWav(info.buffer, kbps);
      } else if (outputFormat === "mp3") {
        blob = encodeToMp3(info.buffer, Math.max(32, Math.min(320, kbps)));
      } else {
        blob = await encodeToWebm(info.buffer, Math.max(32, Math.min(320, kbps)));
      }

      const outName = `${info.name}.${FORMAT_EXTENSIONS[outputFormat]}`;
      setOutput({ blob, name: outName, format: outputFormat, size: blob.size });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Conversion failed.",
      );
    } finally {
      setConverting(false);
    }
  }

  function download() {
    if (!output) return;
    const a = document.createElement("a");
    const url = URL.createObjectURL(output.blob);
    a.href = url;
    a.download = output.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function copyToClipboard() {
    if (!output) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          [output.blob.type || "application/octet-stream"]: output.blob,
        }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Could not copy the audio. Try downloading instead.");
    }
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function formatDuration(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function reset() {
    setInfo(null);
    setOutput(null);
    setError("");
    setKbps(DEFAULT_BITRATES.mp3);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Audio Converter
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-400">
          Convert audio files between MP3, WAV, and WebM formats right in your
          browser. Your files never leave your device.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        {/* Upload */}
        {!info && (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFile(e.dataTransfer.files?.[0]);
            }}
            className="cursor-pointer rounded-2xl border-2 border-dashed border-white/15 bg-slate-950/50 p-10 text-center transition hover:border-violet-400/40 hover:bg-slate-950"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.ogg,.webm,.m4a,.aac,.flac,.opus,.mpeg,.oga"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            {loading ? (
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-violet-400" />
            ) : (
              <Upload className="mx-auto h-10 w-10 text-slate-500" />
            )}
            <p className="mt-4 text-sm font-semibold text-slate-300">
              {loading ? "Decoding audio..." : "Click to upload or drag & drop"}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              MP3, WAV, OGG, WebM, M4A, AAC, FLAC and more
            </p>
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm font-medium leading-6 text-red-200">{error}</p>
          </div>
        )}

        {/* Loaded file info */}
        {info && !error && (
          <div className="mt-2 space-y-5">
            {/* File card */}
            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-950 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-600/15 text-violet-300 ring-1 ring-violet-400/20">
                <Music className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{info.file.name}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {formatBytes(info.size)} · {formatDuration(info.duration)} · {info.sampleRate} Hz · {info.channels} ch
                </p>
              </div>
              <button
                onClick={reset}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:border-red-500/30 hover:text-red-400"
                title="Remove file"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {/* Output format choice */}
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-300">Convert to</p>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(FORMAT_LABELS) as OutputFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => onFormatChange(fmt)}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                      outputFormat === fmt
                        ? "border-violet-400/50 bg-violet-600/15 text-white"
                        : "border-white/10 text-slate-400 hover:border-violet-400/30 hover:text-white"
                    }`}
                  >
                    <FileAudio className="h-4 w-4" />
                    {FORMAT_LABELS[fmt]}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality / bitrate */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-300">
                  {outputFormat === "wav" ? "Bits per sample" : "Bitrate"}
                </p>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                  {outputFormat === "wav" ? `${kbps}-bit` : `${kbps} kbps`}
                </span>
              </div>
              <input
                type="range"
                min={outputFormat === "wav" ? 8 : 32}
                max={outputFormat === "wav" ? 16 : 320}
                step={outputFormat === "wav" ? 8 : 16}
                value={kbps}
                onChange={(e) => setKbps(Number(e.target.value))}
                className="w-full accent-violet-500"
              />
              {outputFormat !== "wav" && (
                <div className="mt-1 flex justify-between text-[10px] text-slate-600">
                  <span>32 (low)</span>
                  <span>128 (standard)</span>
                  <span>320 (high)</span>
                </div>
              )}
            </div>

            {/* Convert button */}
            <button
              onClick={convert}
              disabled={converting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {converting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Waves className="h-4 w-4" />
              )}
              {converting ? "Converting..." : `Convert to ${FORMAT_LABELS[outputFormat]}`}
            </button>

            {/* Output */}
            {output && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300">
                    <Check className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{output.name}</p>
                    <p className="text-xs text-slate-400">{formatBytes(output.size)} · ready to download</p>
                  </div>
                  <button
                    onClick={download}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
                  >
                    <Download className="h-4 w-4" /> Download
                  </button>
                  <button
                    onClick={copyToClipboard}
                    disabled={!navigator.clipboard || !window.ClipboardItem}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <HowToUseSection />
    </Container>
  );
}
