import { profileConfig } from '@/config';

let context: AudioContext | null = null;
const activeProfileAudios = new Set<HTMLAudioElement>();
const profileAudioCache = new Map<string, HTMLAudioElement>();
let profileAudioPreload: Promise<void> | null = null;
const objectSounds = {
  'air-conditioner-on': {
    src: '/assets/audio/room/air-conditioner-on.mp3',
    volume: 0.34,
  },
  'light-switch': { src: '/assets/audio/room/light-switch.mp3', volume: 0.42 },
  'office-chair-roll': { src: '/assets/audio/room/office-chair-roll.mp3', volume: 0.36 },
  'window-open': { src: '/assets/audio/room/window-open.mp3', volume: 0.46 },
} as const;
type ObjectSoundKind = keyof typeof objectSounds;
const activeObjectAudios = new Map<ObjectSoundKind, HTMLAudioElement>();

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

export function preloadProfileAudio() {
  profileAudioPreload ??= Promise.all(
    Array.from(new Set(profileConfig.intro.audioPhrases.map(({ track }) => track))).map(
      (track) =>
        new Promise<void>((resolve) => {
          const audio = new Audio();
          let settled = false;
          const finish = () => {
            if (settled) return;
            settled = true;
            window.clearTimeout(timeout);
            audio.removeEventListener('canplaythrough', finish);
            audio.removeEventListener('error', finish);
            profileAudioCache.set(track, audio);
            resolve();
          };
          const timeout = window.setTimeout(finish, 5_000);
          audio.preload = 'auto';
          audio.addEventListener('canplaythrough', finish, { once: true });
          audio.addEventListener('error', finish, { once: true });
          audio.src = track;
          audio.load();
          if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) finish();
        }),
    ),
  ).then(() => undefined);
  return profileAudioPreload;
}

export function playObjectSound(kind: ObjectSoundKind, enabled: boolean) {
  if (!enabled) return;

  const previous = activeObjectAudios.get(kind);
  if (previous !== undefined) {
    previous.pause();
    previous.removeAttribute('src');
    previous.load();
  }

  const sound = objectSounds[kind];
  const audio = new Audio(sound.src);
  const release = () => {
    if (activeObjectAudios.get(kind) === audio) activeObjectAudios.delete(kind);
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  };

  activeObjectAudios.set(kind, audio);
  audio.volume = sound.volume;
  audio.addEventListener('ended', release, { once: true });
  audio.addEventListener('error', release, { once: true });
  void audio.play().catch(release);
}

export function playProfileAudio(track: string, enabled: boolean) {
  if (!enabled) return;

  const cached = profileAudioCache.get(track);
  const audio =
    cached !== undefined && !activeProfileAudios.has(cached) ? cached : new Audio(track);
  const release = () => {
    activeProfileAudios.delete(audio);
    audio.pause();
    if (audio !== cached) {
      audio.removeAttribute('src');
      audio.load();
    } else {
      audio.currentTime = 0;
    }
  };

  activeProfileAudios.add(audio);
  audio.currentTime = 0;
  audio.volume = 0.6;
  audio.addEventListener('ended', release, { once: true });
  audio.addEventListener('error', release, { once: true });
  void audio.play().catch(release);
}
