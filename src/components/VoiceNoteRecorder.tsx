"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, MicOff, Save } from "lucide-react";

const TITLE_MAX_LENGTH = 120;

type SpeechRecognitionAlternative = { transcript: string };
type SpeechRecognitionResult = {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
};
type SpeechRecognitionResultList = {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
};
type SpeechRecognitionEventLike = {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
};
type SpeechRecognitionErrorEventLike = { readonly error: string };

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export default function VoiceNoteRecorder() {
  const [isSupported, setIsSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interim = "";
      let finalChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) finalChunk += text;
        else interim += text;
      }
      if (finalChunk) {
        setFinalTranscript((prev) => (prev ? `${prev} ${finalChunk.trim()}` : finalChunk.trim()));
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      setError(
        event.error === "not-allowed"
          ? "Microphone access was denied. Enable it in your browser settings."
          : `Dictation error: ${event.error}`,
      );
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.stop();
    };
  }, []);

  function toggleListening() {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    setError(null);
    setStatus(null);
    if (isListening) {
      recognition.stop();
      return;
    }
    try {
      recognition.start();
      setIsListening(true);
    } catch {
      setError("Could not start dictation. Try again.");
    }
  }

  function clearTranscript() {
    setFinalTranscript("");
    setInterimTranscript("");
    setStatus(null);
  }

  async function saveAsTask() {
    const transcript = finalTranscript.trim();
    if (!transcript) return;

    setIsSaving(true);
    setError(null);
    setStatus(null);
    try {
      const title =
        transcript.length > TITLE_MAX_LENGTH
          ? `${transcript.slice(0, TITLE_MAX_LENGTH - 1).trimEnd()}…`
          : transcript;
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, notes: transcript }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Could not save task");
      }
      setStatus("Saved as a task.");
      setFinalTranscript("");
      setInterimTranscript("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save task");
    } finally {
      setIsSaving(false);
    }
  }

  if (!isSupported) {
    return (
      <div className="rounded-md border border-[#d8d1c2] bg-white p-6">
        <div className="flex items-center gap-3 text-[#8a3a24]">
          <MicOff size={20} aria-hidden="true" />
          <p className="text-sm font-medium">
            Voice dictation isn&apos;t supported in this browser — try Chrome or Edge.
          </p>
        </div>
      </div>
    );
  }

  const hasTranscript = Boolean(finalTranscript.trim());

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-[#d8d1c2] bg-white p-6">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={toggleListening}
            aria-pressed={isListening}
            className={`inline-flex h-11 items-center gap-2 rounded-md px-4 text-sm font-semibold ${
              isListening
                ? "bg-[#8a3a24] text-white"
                : "bg-[#17453b] text-white"
            }`}
          >
            {isListening ? (
              <>
                <MicOff size={18} aria-hidden="true" />
                Stop
              </>
            ) : (
              <>
                <Mic size={18} aria-hidden="true" />
                Start dictation
              </>
            )}
          </button>
          {isListening && (
            <span className="inline-flex items-center gap-2 text-sm font-medium text-[#17453b]">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#17453b]" aria-hidden="true" />
              Listening
            </span>
          )}
        </div>

        <div
          className="mt-4 min-h-24 rounded-md border border-[#e3dccf] bg-[#fcfbf7] p-4 text-sm text-[#17201b]"
          aria-live="polite"
          aria-label="Transcript"
        >
          {hasTranscript || interimTranscript ? (
            <p>
              {finalTranscript}
              {interimTranscript && (
                <span className="text-[#8a9389]">
                  {finalTranscript ? " " : ""}
                  {interimTranscript}
                </span>
              )}
            </p>
          ) : (
            <p className="text-[#8a9389]">
              Your spoken words will appear here. Press start and begin talking.
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={saveAsTask}
            disabled={!hasTranscript || isSaving}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[#17453b] px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              <Save size={16} aria-hidden="true" />
            )}
            Save as task
          </button>
          <button
            type="button"
            onClick={clearTranscript}
            disabled={!hasTranscript || isSaving}
            className="inline-flex h-10 items-center rounded-md border border-[#b8ad99] bg-white px-4 text-sm font-semibold disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      </div>

      {status && (
        <p role="status" className="rounded-md border border-[#a9c7b8] bg-[#eef5f0] px-4 py-3 text-sm text-[#17453b]">
          {status}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-md border border-[#e0b4a4] bg-[#faf0eb] px-4 py-3 text-sm text-[#8a3a24]">
          {error}
        </p>
      )}
    </div>
  );
}
