let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;

/** Voice lists load asynchronously in most browsers — wait for `voiceschanged` if needed. */
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!("speechSynthesis" in window)) return Promise.resolve([]);
  const existing = window.speechSynthesis.getVoices();
  if (existing.length > 0) return Promise.resolve(existing);
  if (!voicesPromise) {
    voicesPromise = new Promise((resolve) => {
      const handler = () => {
        window.speechSynthesis.removeEventListener("voiceschanged", handler);
        resolve(window.speechSynthesis.getVoices());
      };
      window.speechSynthesis.addEventListener("voiceschanged", handler);
      // some browsers never fire the event — don't wait forever
      setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1000);
    });
  }
  return voicesPromise;
}

/** Higher score = more natural-sounding, based on how browsers/OSes name their better voices. */
function scoreVoice(voice: SpeechSynthesisVoice): number {
  const name = voice.name.toLowerCase();
  let score = 0;
  if (/enhanced|premium|neural|natural|plus|siri/.test(name)) score += 10;
  if (/google/.test(name)) score += 5;
  if (!voice.localService) score += 2;
  if (voice.default) score += 1;
  return score;
}

async function getBestItalianVoice(): Promise<SpeechSynthesisVoice | undefined> {
  const voices = await loadVoices();
  const italian = voices.filter((v) => v.lang.toLowerCase().startsWith("it"));
  if (italian.length === 0) return undefined;
  return italian.sort((a, b) => scoreVoice(b) - scoreVoice(a))[0];
}

export async function speak(text: string, onStart?: () => void, onEnd?: () => void) {
  if (!("speechSynthesis" in window) || !text) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "it-IT";
  utterance.rate = 1;
  utterance.pitch = 1;
  const voice = await getBestItalianVoice();
  if (voice) utterance.voice = voice;
  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

type SpeechRecognitionCtor = new () => SpeechRecognition;

export function getSpeechRecognition(): SpeechRecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}
