"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  AudioLines,
  Eraser,
  Gauge,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Square,
  Volume2,
} from "lucide-react";
import { Container } from "@/components/Container";
import { HowToUse } from "@/components/HowToUse";

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
    title: "Enter text",
    description: "Type or paste the text you want spoken aloud.",
    icon: <AudioLines className="h-5 w-5" />,
  },
  {
    title: "Pick a voice",
    description: "Choose from the voices installed on your device.",
    icon: <Mic className="h-5 w-5" />,
  },
  {
    title: "Adjust pace",
    description: "Tune the speaking rate and pitch to your liking.",
    icon: <Gauge className="h-5 w-5" />,
  },
  {
    title: "Listen",
    description: "Play the speech using your browser's voice engine.",
    icon: <Play className="h-5 w-5" />,
  },
  {
    title: "Pause anytime",
    description: "Pause, resume, or stop the playback instantly.",
    icon: <Pause className="h-5 w-5" />,
  },
  {
    title: "Stays private",
    description:
      "Everything runs locally — the text never leaves your device.",
    icon: <Volume2 className="h-5 w-5" />,
  },
];


const DEFAULT_TEXT =
  "Welcome to Toolverse. This text is being spoken using your browser's built-in speech engine, right on your device.";

export default function TextToSpeechPage() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceUri, setVoiceUri] = useState("");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [unsupported, setUnsupported] = useState(false);

  const supported =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window;

  useEffect(() => {
    if (!supported) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUnsupported(true);
      return;
    }

    function loadVoices() {
      const available = window.speechSynthesis.getVoices();

      if (!available.length) {
        return;
      }

      /*
       * Some browsers/platforms can return duplicate voices
       * with the same voiceURI. React requires unique keys,
       * and voiceURI is also what we use as the select value.
       *
       * Keep only the first occurrence of each voiceURI.
       */
      const uniqueVoices = Array.from(
        new Map(
          available.map((voice) => [
            voice.voiceURI,
            voice,
          ]),
        ).values(),
      );

      setVoices(uniqueVoices);

      setVoiceUri((currentVoiceUri) => {
        const currentStillExists = uniqueVoices.some(
          (voice) => voice.voiceURI === currentVoiceUri,
        );

        if (currentStillExists) {
          return currentVoiceUri;
        }

        return uniqueVoices[0]?.voiceURI ?? "";
      });
    }

    loadVoices();

    window.speechSynthesis.addEventListener(
      "voiceschanged",
      loadVoices,
    );

    return () => {
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        loadVoices,
      );
    };
  }, [supported]);

  const selectedVoice = useMemo(() => {
    return (
      voices.find(
        (voice) => voice.voiceURI === voiceUri,
      ) ?? null
    );
  }, [voices, voiceUri]);

  function stopSpeech() {
    if (!supported) {
      return;
    }

    window.speechSynthesis.cancel();

    setSpeaking(false);
    setPaused(false);
  }

  function speak() {
    if (!supported || !text.trim()) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(text);

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onstart = () => {
      setSpeaking(true);
      setPaused(false);
    };

    utterance.onresume = () => {
      setPaused(false);
    };

    utterance.onpause = () => {
      setPaused(true);
    };

    utterance.onend = () => {
      setSpeaking(false);
      setPaused(false);
    };

    utterance.onerror = () => {
      setSpeaking(false);
      setPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  }

  function togglePause() {
    if (!supported) {
      return;
    }

    if (paused) {
      window.speechSynthesis.resume();
      return;
    }

    if (speaking) {
      window.speechSynthesis.pause();
    }
  }

  function resetSettings() {
    setRate(1);
    setPitch(1);
  }

  useEffect(() => {
    return () => {
      if (supported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [supported]);

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Text to Speech
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Turn written text into spoken audio using your
          browser&apos;s built-in speech engine —
          completely offline and private.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        {unsupported ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-6 text-center">
            <p className="text-sm leading-6 text-amber-200">
              Your browser does not support the Web
              Speech API. Try Chrome, Edge, or Safari.
            </p>
          </div>
        ) : (
          <>
            <textarea
              value={text}
              onChange={(event) =>
                setText(event.target.value)
              }
              rows={6}
              placeholder="Type or paste text to speak..."
              className="w-full resize-none rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm leading-7 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
            />

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="tts-voice"
                  className="mb-2 block text-sm font-semibold text-slate-300"
                >
                  Voice{" "}
                  <span className="font-normal text-slate-500">
                    ({voices.length} available)
                  </span>
                </label>

                <select
                  id="tts-voice"
                  value={voiceUri}
                  onChange={(event) =>
                    setVoiceUri(event.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-500"
                >
                  {voices.length === 0 ? (
                    <option value="">
                      Loading voices...
                    </option>
                  ) : (
                    voices.map((voice) => (
                      <option
                        key={voice.voiceURI}
                        value={voice.voiceURI}
                      >
                        {voice.name} ({voice.lang})
                        {voice.default
                          ? " · Default"
                          : ""}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="tts-rate"
                    className="mb-2 block text-sm font-semibold text-slate-300"
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
                    onChange={(event) =>
                      setRate(
                        Number(event.target.value),
                      )
                    }
                    className="w-full accent-violet-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="tts-pitch"
                    className="mb-2 block text-sm font-semibold text-slate-300"
                  >
                    Pitch: {pitch.toFixed(2)}
                  </label>

                  <input
                    id="tts-pitch"
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={pitch}
                    onChange={(event) =>
                      setPitch(
                        Number(event.target.value),
                      )
                    }
                    className="w-full accent-violet-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={speak}
                disabled={!text.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                Speak
              </button>

              <button
                type="button"
                onClick={togglePause}
                disabled={!speaking}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {paused ? (
                  <Play className="h-4 w-4" />
                ) : (
                  <Pause className="h-4 w-4" />
                )}

                {paused ? "Resume" : "Pause"}
              </button>

              <button
                type="button"
                onClick={stopSpeech}
                disabled={!speaking}
                className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-5 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Square className="h-4 w-4" />
                Stop
              </button>

              <button
                type="button"
                onClick={() => setText("")}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <Eraser className="h-4 w-4" />
                Clear
              </button>

              <button
                type="button"
                onClick={resetSettings}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-200">
                    {speaking
                      ? paused
                        ? "Paused"
                        : "Speaking..."
                      : "Ready"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Voice
                  </p>

                  <p className="mt-1 max-w-[240px] truncate text-sm text-slate-300">
                    {selectedVoice
                      ? `${selectedVoice.name} (${selectedVoice.lang})`
                      : "System default"}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <HowToUse
        title="How to use Text to Speech"
        subtitle=""
        steps={howToUseSteps}
      />

    </Container>
  );
}