import { profileConfig } from '@/config';

let context: AudioContext | null = null;
const activeProfileAudios = new Set<HTMLAudioElement>();

function getContext() {
  context ??= new AudioContext();
  if (context.state === 'suspended') void context.resume();
  return context;
}

export function playRoomSound(kind: 'click' | 'chime' | 'soft' | 'switch', enabled: boolean) {
  if (!enabled) return;

  const audio = getContext();
  const now = audio.currentTime;
  const notes =
    kind === 'chime'
      ? [880, 1174, 1568]
      : kind === 'switch'
        ? [640, 420]
        : kind === 'soft'
          ? [190]
          : [980];

  notes.forEach((frequency, index) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const start = now + index * 0.07;
    oscillator.type = kind === 'soft' ? 'sine' : 'triangle';
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(kind === 'chime' ? 0.045 : 0.025, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + (kind === 'chime' ? 0.7 : 0.16));
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + (kind === 'chime' ? 0.75 : 0.2));
  });
}

export function playRandomProfileAudio(enabled: boolean) {
  const clips = profileConfig.intro.audioPhrases;
  if (!enabled || clips.length === 0) return;

  const clip = clips[Math.floor(Math.random() * clips.length)];
  if (clip === undefined) return;

  playProfileAudio(clip.track, enabled);
}

export function playProfileAudio(track: string, enabled: boolean) {
  if (!enabled) return;

  const audio = new Audio(track);
  const release = () => {
    activeProfileAudios.delete(audio);
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  };

  activeProfileAudios.add(audio);
  audio.volume = 0.6;
  audio.addEventListener('ended', release, { once: true });
  audio.addEventListener('error', release, { once: true });
  void audio.play().catch(release);
}
