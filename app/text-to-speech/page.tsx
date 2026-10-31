"use client";

import { BackButton } from "@/components/BackButton";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AudioLines,
  Download,
  Gauge,
  Loader2,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Square,
  Volume2,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";
import { fetchApi } from "@/lib/apiBase";
import { saveBlobNative } from "@/lib/capacitor";

export interface UniversalVoice {
  id: string;
  name: string;
  lang: string;
  gender: "Male" | "Female";
  region: string;
}

export const UNIVERSAL_VOICES: UniversalVoice[] = [
  // English (United States)
  { id: "en-US-GuyNeural", name: "Guy", lang: "en-US", gender: "Male", region: "English (US)" },
  { id: "en-US-JennyNeural", name: "Jenny", lang: "en-US", gender: "Female", region: "English (US)" },
  { id: "en-US-AriaNeural", name: "Aria", lang: "en-US", gender: "Female", region: "English (US)" },
  { id: "en-US-ChristopherNeural", name: "Christopher", lang: "en-US", gender: "Male", region: "English (US)" },
  { id: "en-US-EricNeural", name: "Eric", lang: "en-US", gender: "Male", region: "English (US)" },
  { id: "en-US-MichelleNeural", name: "Michelle", lang: "en-US", gender: "Female", region: "English (US)" },

  // English (United Kingdom)
  { id: "en-GB-RyanNeural", name: "Ryan", lang: "en-GB", gender: "Male", region: "English (UK)" },
  { id: "en-GB-SoniaNeural", name: "Sonia", lang: "en-GB", gender: "Female", region: "English (UK)" },

  // English (Australia & India)
  { id: "en-AU-WilliamNeural", name: "William", lang: "en-AU", gender: "Male", region: "English (Australia)" },
  { id: "en-IN-NeerjaNeural", name: "Neerja", lang: "en-IN", gender: "Female", region: "English (India)" },
  { id: "en-IN-PrabhatNeural", name: "Prabhat", lang: "en-IN", gender: "Male", region: "English (India)" },

  // Spanish
  { id: "es-ES-AlvaroNeural", name: "Alvaro", lang: "es-ES", gender: "Male", region: "Spanish (Spain)" },
  { id: "es-ES-ElviraNeural", name: "Elvira", lang: "es-ES", gender: "Female", region: "Spanish (Spain)" },

  // French
  { id: "fr-FR-HenriNeural", name: "Henri", lang: "fr-FR", gender: "Male", region: "French (France)" },
  { id: "fr-FR-DeniseNeural", name: "Denise", lang: "fr-FR", gender: "Female", region: "French (France)" },

  // German
  { id: "de-DE-ConradNeural", name: "Conrad", lang: "de-DE", gender: "Male", region: "German (Germany)" },
  { id: "de-DE-KatjaNeural", name: "Katja", lang: "de-DE", gender: "Female", region: "German (Germany)" },

  // Hindi
  { id: "hi-IN-MadhurNeural", name: "Madhur", lang: "hi-IN", gender: "Male", region: "Hindi (India)" },
  { id: "hi-IN-SwaraNeural", name: "Swara", lang: "hi-IN", gender: "Female", region: "Hindi (India)" },

  // Japanese
  { id: "ja-JP-KeitaNeural", name: "Keita", lang: "ja-JP", gender: "Male", region: "Japanese (Japan)" },
  { id: "ja-JP-NanamiNeural", name: "Nanami", lang: "ja-JP", gender: "Female", region: "Japanese (Japan)" },
];

const howToUseSteps = [
  {
    title: "Enter text",
    description: "Type or paste the text you want converted to speech.",
    icon: <AudioLines className="h-5 w-5" />,
  },
  {
    title: "Pick a natural voice",
    description:
      "Choose from universal male and female voices available on all devices.",
    icon: <Mic className="h-5 w-5" />,
  },
  {
    title: "Adjust pace",
    description: "Tune the speaking rate and pitch to your preference.",
    icon: <Gauge className="h-5 w-5" />,
  },
  {
    title: "Play & pause",
    description: "Listen to the exact spoken speech directly in your browser.",
    icon: <Play className="h-5 w-5" />,
  },
  {
    title: "Stop anytime",
    description: "Stop the audio playback instantly and reset speech.",
    icon: <Square className="h-5 w-5" />,
  },
  {
    title: "Download MP3",
    description:
      "Download the exact same audio file (.mp3) directly to your device.",
    icon: <Download className="h-5 w-5" />,
  },
];

const DEFAULT_TEXT =
  "Welcome to Toolverse. This text is being spoken using a high-quality neural voice, available on every device.";

export default function TextToSpeechPage() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [voiceId, setVoiceId] = useState(UNIVERSAL_VOICES[0].id);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentBlobRef = useRef<Blob | null>(null);
  const currentBlobKeyRef = useRef<string>("");

  const selectedVoice = useMemo(() => {
    return (
      UNIVERSAL_VOICES.find((v) => v.id === voiceId) || UNIVERSAL_VOICES[0]
    );
  }, [voiceId]);

  // Clean up audio element on unmount
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const onEnded = () => {
      setSpeaking(false);
      setPaused(false);
    };

    const onError = () => {
      setSpeaking(false);
      setPaused(false);
      setLoadingAudio(false);
    };

    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.pause();
      audio.src = "";
    };
  }, []);

  function stopSpeech() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setSpeaking(false);
    setPaused(false);
    setLoadingAudio(false);
  }

  function resetSettings() {
    setRate(1);
    setPitch(1);
  }

  /**
   * Fetches the synthesized audio MP3 blob from the backend.
   */
  async function fetchSpeechBlob(): Promise<Blob | null> {
    const trimmed = text.trim();
    if (!trimmed) return null;

    const cacheKey = `${trimmed}|${selectedVoice.id}|${rate.toFixed(2)}|${pitch.toFixed(2)}`;
    if (currentBlobRef.current && currentBlobKeyRef.current === cacheKey) {
      return currentBlobRef.current;
    }

    const res = await fetchApi("/api/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: trimmed,
        voice: selectedVoice.id,
        lang: selectedVoice.lang,
        rate,
        pitch,
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to generate speech (${res.status})`);
    }

    const blob = await res.blob();
    if (!blob || blob.size === 0) {
      throw new Error("Received empty audio response.");
    }

    currentBlobRef.current = blob;
    currentBlobKeyRef.current = cacheKey;
    return blob;
  }

  async function togglePlayPause() {
    if (!text.trim()) return;
    setStatusError(null);

    const audio = audioRef.current;
    if (!audio) return;

    // If currently speaking and not paused -> pause
    if (speaking && !paused) {
      audio.pause();
      setPaused(true);
      return;
    }

    // If currently paused -> resume
    const trimmed = text.trim();
    const currentKey = `${trimmed}|${selectedVoice.id}|${rate.toFixed(2)}|${pitch.toFixed(2)}`;

    if (paused && currentBlobKeyRef.current === currentKey) {
      try {
        await audio.play();
        setPaused(false);
        setSpeaking(true);
      } catch (e) {
        console.warn("Resume playback failed:", e);
      }
      return;
    }

    // Otherwise, generate audio and play
    try {
      setLoadingAudio(true);
      const blob = await fetchSpeechBlob();
      if (!blob) return;

      const audioUrl = URL.createObjectURL(blob);
      audio.src = audioUrl;
      audio.playbackRate = 1; // Rate is handled in server-side synthesis

      await audio.play();
      setSpeaking(true);
      setPaused(false);
    } catch (err: unknown) {
      console.error("Playback error:", err);
      setStatusError("Could not play audio. Please check your connection.");
      setSpeaking(false);
      setPaused(false);
    } finally {
      setLoadingAudio(false);
    }
  }

  async function downloadAudio() {
    if (!text.trim() || downloading) return;

    setDownloading(true);
    setStatusError(null);

    const safeVoice = selectedVoice.name.replace(/[\\/:*?"<>|\n\r]/g, "_").trim();
    const safePrefix = (text.trim().slice(0, 24) || "speech")
      .replace(/[\\/:*?"<>|\n\r]/g, "_")
      .trim();
    const cleanFilename = `${safePrefix}_${safeVoice}.mp3`;

    try {
      const blob = await fetchSpeechBlob();
      if (!blob) throw new Error("No audio generated.");

      await saveBlobNative(blob, cleanFilename);
    } catch (err: unknown) {
      console.error("Download error:", err);
      setStatusError("Could not download audio. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Container className="py-12 sm:py-16">
      <div className="mb-8">
        <BackButton fallbackHref="/tools/text-tools" />
      </div>

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Text to Speech
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400 light:text-slate-600">
          Convert written text into natural, lifelike spoken audio with
          universal voices available across all devices.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6 light:border-slate-900/10 light:bg-white">
        <textarea
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            // Invalidate current playback if text edited while speaking
            if (speaking || paused) {
              stopSpeech();
            }
          }}
          rows={6}
          placeholder="Type or paste text to speak..."
          className="w-full resize-none rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm leading-7 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-sky-500 light:border-slate-900/10 light:bg-white light:text-slate-900 light:placeholder:text-slate-400"
        />

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="tts-voice"
              className="mb-2 block text-sm font-semibold text-slate-300 light:text-slate-700"
            >
              Voice{" "}
              <span className="font-normal text-slate-500 light:text-slate-500">
                ({UNIVERSAL_VOICES.length} universal voices)
              </span>
            </label>

            <select
              id="tts-voice"
              value={voiceId}
              onChange={(event) => {
                setVoiceId(event.target.value);
                stopSpeech();
              }}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-500 light:border-slate-900/10 light:bg-white light:text-slate-900"
            >
              {UNIVERSAL_VOICES.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name} · {voice.region} ({voice.gender})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="tts-rate"
                className="mb-2 block text-sm font-semibold text-slate-300 light:text-slate-700"
              >
                Rate: {rate.toFixed(2)}×
              </label>

              <input
                id="tts-rate"
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={rate}
                onChange={(event) => {
                  setRate(Number(event.target.value));
                  stopSpeech();
                }}
                className="w-full accent-sky-500"
              />
            </div>

            <div>
              <label
                htmlFor="tts-pitch"
                className="mb-2 block text-sm font-semibold text-slate-300 light:text-slate-700"
              >
                Pitch: {pitch.toFixed(2)}
              </label>

              <input
                id="tts-pitch"
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={pitch}
                onChange={(event) => {
                  setPitch(Number(event.target.value));
                  stopSpeech();
                }}
                className="w-full accent-sky-500"
              />
            </div>
          </div>
        </div>

        <div className="mt-6">
          {/* Playback Controls */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={togglePlayPause}
              disabled={!text.trim() || loadingAudio}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 sm:px-5 ${
                speaking && !paused
                  ? "bg-amber-600 hover:bg-amber-500 shadow-amber-500/20"
                  : "bg-sky-500 hover:bg-sky-400 shadow-sky-500/20"
              }`}
            >
              {loadingAudio ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading…</span>
                </>
              ) : speaking && !paused ? (
                <>
                  <Pause className="h-4 w-4" />
                  <span>Pause</span>
                </>
              ) : paused ? (
                <>
                  <Play className="h-4 w-4" />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Speak</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={stopSpeech}
              disabled={!speaking && !paused && !loadingAudio}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 text-white font-semibold shadow-sm hover:bg-red-500 px-3 py-2.5 text-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 sm:px-5"
            >
              <Square className="h-4 w-4" />
              <span>Stop</span>
            </button>
          </div>

          {/* Action Controls */}
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={downloadAudio}
              disabled={!text.trim() || downloading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 sm:px-5"
            >
              {downloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Downloading…</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Download MP3</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={resetSettings}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-600 text-white font-semibold shadow-sm hover:bg-amber-500 px-3 py-2.5 text-sm transition active:scale-[0.98] sm:px-5"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </button>
          </div>

          {statusError ? (
            <p className="mt-2 text-center text-xs text-red-400 light:text-red-600">
              {statusError}
            </p>
          ) : null}
        </div>
      </div>

      <HowToUse
        title="How to use Text to Speech"
        subtitle=""
        steps={howToUseSteps}
      />
    </Container>
  );
}
