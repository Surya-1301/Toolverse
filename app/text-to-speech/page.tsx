"use client";

import { useEffect, useMemo, useState } from "react";
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
    description: "Everything runs locally — the text never leaves your device.",
    icon: <Volume2 className="h-5 w-5" />,
  },
];

function HowToUseSection() {
  return (
    <section className="mt-14">
      <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
        How to use Text to Speech
      </h2>

      <div className="mt-8 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
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
      if (available.length) {
        setVoices(available);
        if (!voiceUri || !available.some((voice) => voice.voiceURI === voiceUri)) {
          setVoiceUri(available[0]?.voiceURI || "");
        }
      }
    }

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedVoice = useMemo(
    () => voices.find((voice) => voice.voiceURI === voiceUri) || null,
    [voices, voiceUri],
  );

  function stopSpeech() {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
  }

  function speak() {
    if (!supported || !text.trim()) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onstart = () => {
      setSpeaking(true);
      setPaused(false);
    };
    utterance.onresume = () => setPaused(false);
    utterance.onpause = () => setPaused(true);
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
    if (!supported) return;

    if (paused) {
      window.speechSynthesis.resume();
    } else if (speaking) {
      window.speechSynthesis.pause();
    }
  }

  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Container className="py-12 sm:py-16">
      <BackToToolsLink />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Text to Speech
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Turn written text into spoken audio using your browser&apos;s
          built-in speech engine — completely offline and private.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        {unsupported ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-6 text-center">
            <p className="text-sm leading-6 text-amber-200">
              Your browser does not support the Web Speech API. Try Chrome,
              Edge, or Safari.
            </p>
          </div>
        ) : (
          <>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={6}
              placeholder="Type or paste text to speak..."
              className="w-full resize-none rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm leading-7 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
            />

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Voice{" "}
                  <span className="font-normal text-slate-500">
                    ({voices.length} available)
                  </span>
                </label>
                <select
                  value={voiceUri}
                  onChange={(event) => setVoiceUri(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-500"
                >
                  {voices.map((voice) => (
                    <option key={voice.voiceURI} value={voice.voiceURI}>
                      {voice.name} ({voice.lang})
                      {voice.default ? " · Default" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">
                    Rate: {rate.toFixed(2)}×
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={rate}
                    onChange={(event) => setRate(Number(event.target.value))}
                    className="w-full accent-violet-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">
                    Pitch: {pitch.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={pitch}
                    onChange={(event) => setPitch(Number(event.target.value))}
                    className="w-full accent-violet-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                onClick={speak}
                disabled={!text.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Play className="h-4 w-4" />
                Speak
              </button>

              <button
                onClick={togglePause}
                disabled={!speaking && !paused}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
              >
                {paused ? (
                  <>
                    <Play className="h-4 w-4" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4" />
                    Pause
                  </>
                )}
              </button>

              <button
                onClick={stopSpeech}
                disabled={!speaking && !paused}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
              >
                <Square className="h-4 w-4" />
                Stop
              </button>

              <button
                onClick={() => {
                  stopSpeech();
                  setText("");
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
              >
                <Eraser className="h-4 w-4" />
                Clear
              </button>

              <span
                className={[
                  "ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                  speaking && !paused
                    ? "bg-emerald-500/10 text-emerald-300"
                    : paused
                      ? "bg-amber-500/10 text-amber-300"
                      : "bg-slate-800 text-slate-400",
                ].join(" ")}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {paused ? "Paused" : speaking ? "Speaking" : "Idle"}
              </span>
            </div>
          </>
        )}
      </div>

      <HowToUseSection />
    </Container>
  );
}