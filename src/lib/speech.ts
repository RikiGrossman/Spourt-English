import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

// Android's WebView has no Web Speech API, so the installed app uses the
// device's native text-to-speech engine instead.
const native = Capacitor.isNativePlatform();

/** Speaks English text with the browser's built-in speech synthesis (or native TTS in the app). */
export function speak(text: string, slow = false) {
  if (native) {
    void TextToSpeech.stop()
      .then(() => TextToSpeech.speak({ text, lang: 'en-US', rate: slow ? 0.6 : 0.95 }))
      .catch(() => {
        // No English voice installed – exercises still work from the written text.
      });
    return;
  }
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = slow ? 0.6 : 0.95;
  const voice = synth.getVoices().find((v) => v.lang.startsWith('en'));
  if (voice) utterance.voice = voice;
  synth.speak(utterance);
}

export const canSpeak = native || (typeof window !== 'undefined' && 'speechSynthesis' in window);
