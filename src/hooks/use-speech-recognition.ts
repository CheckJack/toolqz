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

export function useSpeechRecognition() {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onFinalRef = useRef<((text: string) => void) | null>(null);

  useEffect(() => {
    setIsSupported(Boolean(getRecognitionCtor()));
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  const startListening = useCallback(
    (onFinal: (text: string) => void) => {
      const Ctor = getRecognitionCtor();
      if (!Ctor) return false;

      onFinalRef.current = onFinal;
      recognitionRef.current?.abort();

      const recognition = new Ctor();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let interim = "";
        let finalText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const chunk = event.results[i][0]?.transcript ?? "";
          if (event.results[i].isFinal) finalText += chunk;
          else interim += chunk;
        }
        setInterimTranscript(interim);
        if (finalText.trim()) {
          onFinalRef.current?.(finalText.trim());
          setInterimTranscript("");
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setInterimTranscript("");
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript("");
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
        setIsListening(true);
        return true;
      } catch {
        setIsListening(false);
        return false;
      }
    },
    []
  );

  useEffect(() => {
    return () => recognitionRef.current?.abort();
  }, []);

  return {
    isSupported,
    isListening,
    interimTranscript,
    startListening,
    stopListening,
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
