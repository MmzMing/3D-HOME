import { LineBox } from '@/scene/primitives/line-shape';
import { useRoomInteraction } from '@/scene/primitives/use-room-interaction';
import { useRoomStore } from '@/stores/room-store';

export function WallSwitch() {
  const interaction = useRoomInteraction('wall-switch');
  const theme = useRoomStore((state) => state.theme);
  return (
    <group position={[4.55, 2.9, -8.36]} {...interaction.bind}>
      <LineBox args={[0.36, 0.58, 0.08]} hovered={interaction.hovered} />
      <LineBox
        args={[0.12, 0.25, 0.08]}
        position={[0, theme === 'dark' ? -0.08 : 0.08, 0.07]}
        rotation={[theme === 'dark' ? 0.35 : -0.35, 0, 0]}
        accent={theme === 'dark' ? 'warm' : undefined}
      />
    </group>
  );
}
