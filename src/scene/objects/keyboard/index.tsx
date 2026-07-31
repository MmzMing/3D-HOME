import { LineBox } from '@/scene/primitives/line-shape';
import { useRoomInteraction } from '@/scene/primitives/use-room-interaction';
import { useRoomStore } from '@/stores/room-store';

export function Keyboard() {
  const interaction = useRoomInteraction('keyboard');
  const lampOn = useRoomStore((state) => state.objectState.deskLampOn);
  const theme = useRoomStore((state) => state.theme);
  const warmGlow =
    theme === 'dark' && lampOn
      ? {
          color: '#ffd166',
          intensity: 2.15,
          lineWidth: 1.35,
          opacity: 0.72,
          scale: 1.012,
        }
      : undefined;
  return (
    <group position={[-2.18, 2.24, -5.98]} rotation={[0, 0.04, 0]} {...interaction.bind}>
      <LineBox
        args={[1.7, 0.1, 0.58]}
        accent={interaction.hovered ? 'active' : undefined}
        glow={warmGlow}
        hovered={interaction.hovered}
      />
      {Array.from({ length: 6 }, (_, column) =>
        Array.from({ length: 3 }, (_, row) => (
          <LineBox
            key={[column, row].join('-')}
            args={[0.2, 0.025, 0.11]}
            position={[-0.64 + column * 0.26, 0.065, -0.16 + row * 0.17]}
            accent={interaction.hovered ? 'active' : undefined}
            glow={
              warmGlow === undefined
                ? undefined
                : { ...warmGlow, intensity: 1.75, lineWidth: 1.05, opacity: 0.58 }
            }
          />
        )),
      )}
    </group>
  );
}
