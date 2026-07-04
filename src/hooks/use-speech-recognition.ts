"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: { isFinal: boolean; [index: number]: { transcript: string } };
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function getRecognitionCtor(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function speechErrorMessage(code: string): string {
  switch (code) {
    case "not-allowed":
      return "Microphone access was blocked. Allow the mic in your browser settings and try again.";
    case "no-speech":
      return "No speech detected. Tap the mic and try again.";
    case "audio-capture":
      return "No microphone found. Check your device settings.";
    case "network":
      return "Voice input needs a network connection in this browser.";
    default:
      return "Voice input failed. Try Chrome or Edge.";
  }
}

export function useSpeechRecognition() {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [speechError, setSpeechError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const wantsListeningRef = useRef(false);
  const accumulatedRef = useRef("");

  const updateLiveTranscript = useCallback((interim: string) => {
    const full = [accumulatedRef.current, interim].filter(Boolean).join(" ").trim();
    setLiveTranscript(full);
  }, []);

  useEffect(() => {
    setIsSupported(Boolean(getRecognitionCtor()));
  }, []);

  const stopListening = useCallback(() => {
    wantsListeningRef.current = false;
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return false;

    recognitionRef.current?.abort();
    accumulatedRef.current = "";
    setLiveTranscript("");
    setSpeechError(null);
    wantsListeningRef.current = true;

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang =
      typeof navigator !== "undefined" && navigator.language
        ? navigator.language
        : "en-US";

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0]?.transcript ?? "";
        if (event.results[i].isFinal) {
          accumulatedRef.current = `${accumulatedRef.current} ${chunk}`.trim();
        } else {
          interim += chunk;
        }
      }
      updateLiveTranscript(interim);
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted") return;
      setSpeechError(speechErrorMessage(event.error));
      wantsListeningRef.current = false;
      setIsListening(false);
      setLiveTranscript("");
      accumulatedRef.current = "";
    };

    recognition.onend = () => {
      if (wantsListeningRef.current) {
        try {
          recognition.start();
        } catch {
          wantsListeningRef.current = false;
          setIsListening(false);
        }
        return;
      }
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
      return true;
    } catch {
      wantsListeningRef.current = false;
      setIsListening(false);
      setSpeechError("Could not start the microphone. Try again.");
      return false;
    }
  }, [updateLiveTranscript]);

  const consumeTranscript = useCallback(() => {
    const text = liveTranscript.trim();
    accumulatedRef.current = "";
    setLiveTranscript("");
    return text;
  }, [liveTranscript]);

  useEffect(() => {
    return () => {
      wantsListeningRef.current = false;
      recognitionRef.current?.abort();
    };
  }, []);

  return {
    isSupported,
    isListening,
    liveTranscript,
    speechError,
    startListening,
    stopListening,
    consumeTranscript,
    clearSpeechError: () => setSpeechError(null),
  };
}

export function speakText(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const cleaned = text
    .replace(/\*\*/g, "")
    .replace(/→/g, "")
    .replace(/https?:\/\/\S+/g, "link")
    .slice(0, 800);
  const utterance = new SpeechSynthesisUtterance(cleaned);
  utterance.lang = "en-US";
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window !== "undefined") window.speechSynthesis?.cancel();
}
