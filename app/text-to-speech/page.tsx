"use client";

import { BackButton } from "@/components/BackButton";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
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
      // Some platforms return duplicate voiceURIs — keep first occurrence.
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

    // Android WebView often delivers voices late and fires
    // voiceschanged zero or multiple times — poll briefly too.
    const retries = [500, 1500, 3000];
    const timers = retries.map((ms) =>
      setTimeout(() => {
        if (window.speechSynthesis.getVoices().length) loadVoices();
      }, ms),
    );

    // Some WebViews need a kick to populate the voice list.
    try {
      const kick = new SpeechSynthesisUtterance(" ");
      kick.volume = 0;
      window.speechSynthesis.speak(kick);
      window.speechSynthesis.cancel();
    } catch {
      // ignore — kick is best-effort
    }

    window.speechSynthesis.addEventListener(
      "voiceschanged",
      loadVoices,
    );

    return () => {
      timers.forEach(clearTimeout);
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        loadVoices,
      );
      window.speechSynthesis.cancel();
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
      <div className="mb-8">
        <BackButton fallbackHref="/tools/text-tools" />
      </div>

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Text to Speech
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400 light:text-slate-600">
          Turn written text into spoken audio using your
          browser&apos;s built-in speech engine —
          completely offline and private.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6 light:border-slate-900/10 light:bg-white">
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
                    ({voices.length} available)
                  </span>
                </label>

                <select
                  id="tts-voice"
                  value={voiceUri}
                  onChange={(event) =>
                    setVoiceUri(event.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-500 light:border-slate-900/10 light:bg-white light:text-slate-900"
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
                    onChange={(event) =>
                      setRate(
                        Number(event.target.value),
                      )
                    }
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
                    min="0"
                    max="2"
                    step="0.1"
                    value={pitch}
                    onChange={(event) =>
                      setPitch(
                        Number(event.target.value),
                      )
                    }
                    className="w-full accent-sky-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={speak}
                disabled={!text.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-sky-500/20 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50 sm:px-5"
              >
                <Play className="h-4 w-4" />
                Speak
              </button>

              <button
                type="button"
                onClick={togglePause}
                disabled={!speaking}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 text-white font-semibold shadow-sm hover:bg-sky-500 px-4 py-2.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 sm:px-5"
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
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 text-white font-semibold shadow-sm hover:bg-red-500 px-4 py-2.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 sm:px-5"
              >
                <Square className="h-4 w-4" />
                Stop
              </button>

              <button
                type="button"
                onClick={() => setText("")}
                className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:border-red-500/50 hover:bg-red-500/10 sm:col-span-1 sm:px-5 light:border-red-600/30 light:text-red-700 light:hover:bg-red-50"
              >
                <Eraser className="h-4 w-4" />
                Clear
              </button>

              <button
                type="button"
                onClick={resetSettings}
                className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 text-white font-semibold shadow-sm hover:bg-amber-500 px-4 py-2.5 text-sm transition sm:col-span-1 sm:px-5"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/50 p-4 light:border-slate-900/10 light:bg-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 light:text-slate-500">
                    Status
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-200 light:text-slate-800">
                    {speaking
                      ? paused
                        ? "Paused"
                        : "Speaking..."
                      : "Ready"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 light:text-slate-500">
                    Voice
                  </p>

                  <p className="mt-1 max-w-[240px] truncate text-sm text-slate-300 light:text-slate-700">
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