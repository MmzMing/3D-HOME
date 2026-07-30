import { Music2 } from 'lucide-react';

import type { MusicTrack } from '@/stores/player-store';

export function TrackCard({
  active,
  onSelect,
  track,
}: {
  active: boolean;
  onSelect: () => void;
  track: MusicTrack;
}) {
  return (
    <button
      type="button"
      className="track-card"
      aria-current={active ? 'true' : undefined}
      onClick={onSelect}
    >
      {track.cover === undefined ? (
        <span className="track-cover-placeholder">
          <Music2 aria-hidden="true" size={18} />
        </span>
      ) : (
        <img src={track.cover} alt="" />
      )}
      <span>
        <strong>{track.title}</strong>
        <small>{track.artist}</small>
      </span>
    </button>
  );
}
