const SOUND_URL = "/sounds/notification.wav";

let audio: HTMLAudioElement | null = null;
let unlocked = false;

function getAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!audio) {
    audio = new Audio(SOUND_URL);
    audio.preload = "auto";
    audio.volume = 0.65;
  }
  return audio;
}

/** Prime audio on a user gesture so later notification sounds can autoplay. */
export function unlockNotificationSound() {
  const el = getAudio();
  if (!el || unlocked) return;

  el.currentTime = 0;
  void el
    .play()
    .then(() => {
      el.pause();
      el.currentTime = 0;
      unlocked = true;
    })
    .catch(() => {});
}

/** Play the notification chime (call after unlockNotificationSound on first click). */
export async function playNotificationSound() {
  const el = getAudio();
  if (!el) return;

  el.currentTime = 0;
  try {
    await el.play();
    unlocked = true;
  } catch {
    // Still blocked — user may need to interact with the page first.
  }
}
