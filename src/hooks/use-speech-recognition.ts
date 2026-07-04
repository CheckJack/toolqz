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

export const MIC_BLOCKED_HELP =
  "Click the lock or tune icon in your browser address bar → Site settings → Microphone → Allow, then reload the page and try again.";

function speechErrorMessage(code: string): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return `Microphone access was blocked. ${MIC_BLOCKED_HELP}`;
    case "no-speech":
      return "No speech detected. Tap the mic and try again.";
    case "audio-capture":
      return "No microphone found. Check your device settings.";
    case "network":
      return "Voice input needs a network connection in this browser.";
    default:
      return "Voice input failed. Try Chrome or Edge on a secure (HTTPS) connection.";
  }
}

async function requestMicrophoneAccess(): Promise<{ ok: true } | { ok: false; message: string }> {
  if (typeof window === "undefined") {
    return { ok: false, message: "Voice input is only available in the browser." };
  }

  if (!window.isSecureContext) {
    return {
      ok: false,
      message: "Microphone requires HTTPS. Open the admin site with https:// (not http://).",
    };
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    return { ok: true };
  }

  try {
    const status = await navigator.permissions.query({
      name: "microphone" as PermissionName,
    });
    if (status.state === "denied") {
      return { ok: false, message: `Microphone is blocked for this site. ${MIC_BLOCKED_HELP}` };
    }
  } catch {
    // Permissions API unsupported in some browsers — continue to getUserMedia prompt.
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    for (const track of stream.getTracks()) track.stop();
    return { ok: true };
  } catch (error) {
    if (error instanceof DOMException) {
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        return { ok: false, message: `Microphone permission denied. ${MIC_BLOCKED_HELP}` };
      }
      if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        return { ok: false, message: "No microphone found. Connect a mic or check System Settings." };
      }
      if (error.name === "NotReadableError") {
        return {
          ok: false,
          message: "Microphone is in use by another app. Close other apps using the mic and try again.",
        };
      }
    }
    return { ok: false, message: "Could not access the microphone. Try again." };
  }
}

export function useSpeechRecognition() {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isRequestingMic, setIsRequestingMic] = useState(false);
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
    setIsRequestingMic(false);
  }, []);

  const startListening = useCallback(async (): Promise<boolean> => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return false;

    setSpeechError(null);
    setIsRequestingMic(true);

    const micAccess = await requestMicrophoneAccess();
    if (!micAccess.ok) {
      setSpeechError(micAccess.message);
      setIsRequestingMic(false);
      return false;
    }

    recognitionRef.current?.abort();
    accumulatedRef.current = "";
    setLiveTranscript("");
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
      setIsRequestingMic(false);
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
          setIsRequestingMic(false);
        }
        return;
      }
      setIsListening(false);
      setIsRequestingMic(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
      setIsRequestingMic(false);
      return true;
    } catch {
      wantsListeningRef.current = false;
      setIsListening(false);
      setIsRequestingMic(false);
      setSpeechError("Could not start voice input. Try again.");
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
    isRequestingMic,
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
