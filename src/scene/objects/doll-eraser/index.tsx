import { Text } from '@react-three/drei';

import { InteractionProxy, LineBox } from '@/scene/primitives/line-shape';
import { useRoomInteraction } from '@/scene/primitives/use-room-interaction';
import { useRoomStore } from '@/stores/room-store';

const pixelFont = '/assets/fonts/ark-pixel-12px-proportional-zh-cn.woff';

export function DollWordEraser() {
  const wordCount = useRoomStore((state) => state.dollWordCount);
  const clearDollWords = useRoomStore((state) => state.clearDollWords);
  const interaction = useRoomInteraction('doll-eraser', clearDollWords);
  const color = useRoomStore((state) => (state.theme === 'light' ? '#000000' : '#f3f4f6'));

  if (wordCount === 0) return null;

  return (
    <group position={[1.72, 0.38, 0.62]} {...interaction.bind}>
      <LineBox args={[0.58, 0.58, 0.58]} hovered={interaction.hovered} />
      <Text
        anchorX="center"
        anchorY="middle"
        color={interaction.hovered ? '#0e7490' : color}
        font={pixelFont}
        fontSize={0.26}
        position={[0, 0, 0.3]}
      >
        X
      </Text>
      <InteractionProxy args={[0.82, 0.82, 0.82]} />
    </group>
  );
}
