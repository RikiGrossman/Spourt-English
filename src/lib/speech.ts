/** Speaks English text with the browser's built-in speech synthesis. */
export function speak(text: string, slow = false) {
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

export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;
