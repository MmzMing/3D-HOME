import { useTexture } from '@react-three/drei';

import { LineBox } from '@/scene/primitives/line-shape';
import { useRoomInteraction } from '@/scene/primitives/use-room-interaction';

const portraitImage = '/assets/images/profile/home1.webp';

export function Portrait() {
  const interaction = useRoomInteraction('portrait');
  const texture = useTexture(portraitImage);

  return (
    <group position={[-9.86, 3.45, 6.45]} rotation={[0, Math.PI / 2, 0]} {...interaction.bind}>
      <LineBox
        args={[1.55, 1.25, 0.09]}
        hovered={interaction.hovered}
        accent={interaction.hovered ? 'active' : undefined}
      />
      <mesh position={[0, 0, 0.052]}>
        <planeGeometry args={[0.94, 0.94]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  );
}
