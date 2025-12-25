"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type SynthesisStatus = "idle" | "speaking" | "paused";

export default function Home() {
  const isBrowser = typeof window !== "undefined";
  const synthesis = isBrowser ? window.speechSynthesis : null;

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [rate, setRate] = useState<number>(1);
  const [pitch, setPitch] = useState<number>(1);
  const [status, setStatus] = useState<SynthesisStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSupported = useMemo(
    () => typeof window !== "undefined" && "speechSynthesis" in window,
    [],
  );

  useEffect(() => {
    if (!synthesis) {
      return;
    }

    const initVoices = () => {
      const available = synthesis.getVoices();
      if (available.length === 0) {
        return;
      }

      setVoices(available);
      setSelectedVoice((prev) => {
        if (prev) {
          return prev;
        }
        const defaultVoice =
          available.find((voice) => voice.default) ?? available[0];
        return defaultVoice?.name ?? "";
      });
    };

    initVoices();
    synthesis.addEventListener("voiceschanged", initVoices);

    return () => {
      synthesis.removeEventListener("voiceschanged", initVoices);
    };
  }, [synthesis]);

  const resetPlayback = useCallback(() => {
    if (!synthesis) {
      return;
    }

    synthesis.cancel();
    utteranceRef.current = null;
    setStatus("idle");
  }, [synthesis]);

  const handleSpeak = useCallback(() => {
    if (!synthesis) {
      setError("Text to speech is not supported in this browser.");
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) {
      setError("Enter some text first.");
      return;
    }

    resetPlayback();
    setError(null);

    const utterance = new SpeechSynthesisUtterance(trimmed);

    const voice = voices.find((option) => option.name === selectedVoice);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onstart = () => setStatus("speaking");
    utterance.onend = () => {
      setStatus("idle");
      utteranceRef.current = null;
    };
    utterance.onerror = (event) => {
      setError(
        event.error === "canceled"
          ? "Playback stopped."
          : "Something went wrong while speaking the text.",
      );
      setStatus("idle");
    };
    utterance.onpause = () => setStatus("paused");
    utterance.onresume = () => setStatus("speaking");

    utteranceRef.current = utterance;
    synthesis.speak(utterance);
  }, [pitch, rate, resetPlayback, selectedVoice, synthesis, text, voices]);

  const handlePause = useCallback(() => {
    if (!synthesis) {
      return;
    }
    if (synthesis.paused) {
      return;
    }
    synthesis.pause();
    setStatus("paused");
  }, [synthesis]);

  const handleResume = useCallback(() => {
    if (!synthesis) {
      return;
    }
    if (!synthesis.paused) {
      return;
    }
    synthesis.resume();
    setStatus("speaking");
  }, [synthesis]);

  const handleStop = useCallback(() => {
    resetPlayback();
  }, [resetPlayback]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-100 px-4 py-16 text-zinc-900">
      <main className="mx-auto max-w-4xl space-y-12 rounded-3xl border border-zinc-200 bg-white/80 p-10 shadow-2xl backdrop-blur">
        <header className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-500">
            Agentic Studio
          </p>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 md:text-5xl">
            Text to Voice Agent
          </h1>
          <p className="max-w-2xl text-lg text-zinc-600">
            Convert any text into spoken audio instantly. Craft multilingual
            voice-overs, narration, or accessibility support with fine-grained
            control over tone and pacing.
          </p>
        </header>

        {!isSupported ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">
            Your browser does not support the Speech Synthesis API yet. Try the
            latest version of Chrome, Edge, or Safari to enable text to voice.
          </div>
        ) : (
          <div className="grid gap-10 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <section className="space-y-6">
              <label
                htmlFor="message"
                className="block text-sm font-semibold uppercase tracking-widest text-indigo-500"
              >
                Text Input
              </label>
              <textarea
                id="message"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Type or paste the content you want to hear…"
                className="h-64 w-full resize-none rounded-2xl border border-zinc-200 bg-white px-6 py-5 text-base leading-relaxed text-zinc-800 shadow-inner outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
              />
              {error && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  {error}
                </p>
              )}
            </section>

            <aside className="space-y-8 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm font-semibold uppercase tracking-widest text-indigo-500">
                  <span>Voice</span>
                  <span className="text-xs text-indigo-400">
                    {voices.length} available
                  </span>
                </div>
                <select
                  value={selectedVoice}
                  onChange={(event) => setSelectedVoice(event.target.value)}
                  disabled={voices.length === 0}
                  className="w-full rounded-xl border border-indigo-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-60"
                >
                  {voices.length === 0 ? (
                    <option>Loading voices…</option>
                  ) : (
                    voices.map((voice) => (
                      <option key={voice.voiceURI} value={voice.name}>
                        {voice.name} · {voice.lang}
                        {voice.default ? " (Default)" : ""}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
                    <span>Rate</span>
                    <span className="font-mono text-indigo-600">
                      {rate.toFixed(2)}×
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2}
                    step={0.1}
                    value={rate}
                    onChange={(event) => setRate(Number(event.target.value))}
                    className="w-full accent-indigo-500"
                  />
                  <p className="text-xs text-indigo-400">
                    Adjust how fast the agent delivers your message.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
                    <span>Pitch</span>
                    <span className="font-mono text-indigo-600">
                      {pitch.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2}
                    step={0.1}
                    value={pitch}
                    onChange={(event) => setPitch(Number(event.target.value))}
                    className="w-full accent-indigo-500"
                  />
                  <p className="text-xs text-indigo-400">
                    Fine-tune the tonal character of the synthesized voice.
                  </p>
                </div>
              </div>

              <div className="grid gap-3">
                <button
                  onClick={handleSpeak}
                  className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
                >
                  <PlayIcon />
                  Speak
                </button>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={handlePause}
                    disabled={status !== "speaking"}
                    className="flex items-center justify-center gap-2 rounded-xl border border-indigo-200 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-indigo-500 transition hover:border-indigo-400 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <PauseIcon />
                    Pause
                  </button>
                  <button
                    onClick={handleResume}
                    disabled={status !== "paused"}
                    className="flex items-center justify-center gap-2 rounded-xl border border-indigo-200 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-indigo-500 transition hover:border-indigo-400 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <PlayIcon />
                    Resume
                  </button>
                  <button
                    onClick={handleStop}
                    disabled={status === "idle"}
                    className="flex items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-rose-500 transition hover:border-rose-400 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <StopIcon />
                    Stop
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-indigo-100 bg-white/80 px-4 py-3 text-xs text-indigo-500">
                <p className="font-semibold uppercase tracking-[0.4em] text-indigo-400">
                  Agent Status
                </p>
                <p className="font-mono text-sm text-indigo-700">
                  {status.toUpperCase()}
                </p>
              </div>
            </aside>
          </div>
        )}

        <footer className="rounded-2xl border border-zinc-200 bg-zinc-50/80 px-6 py-5 text-sm text-zinc-500">
          Tip: you can keep the agent speaking while you explore other tabs.
          Voices and languages depend on your operating system. Install voice
          packs locally to expand the catalog.
        </footer>
      </main>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M7 4.5v15l12-7.5-12-7.5z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className="h-4 w-4"
    >
      <path d="M8 5h2v14H8zM14 5h2v14h-2z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
    >
      <rect x="6.5" y="6.5" width="11" height="11" rx="1.5" />
    </svg>
  );
}
