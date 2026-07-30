import { LineBox, LinePlane } from '@/scene/primitives/line-shape';
import { useRoomInteraction } from '@/scene/primitives/use-room-interaction';

export function Portrait() {
  const interaction = useRoomInteraction('portrait');
  return (
    <group position={[-9.86, 3.45, 6.45]} rotation={[0, Math.PI / 2, 0]} {...interaction.bind}>
      <LineBox
        args={[1.55, 1.25, 0.09]}
        hovered={interaction.hovered}
        accent={interaction.hovered ? 'active' : undefined}
      />
      <LinePlane args={[1.2, 0.9]} position={[0, 0, 0.052]} />
      <LineBox args={[0.34, 0.34, 0.04]} position={[0, 0.17, 0.085]} />
      <LineBox args={[0.78, 0.25, 0.04]} position={[0, -0.31, 0.085]} />
    </group>
  );
}
