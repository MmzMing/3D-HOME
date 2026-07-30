import { LineBox, LineCylinder, LineSphere } from '@/scene/primitives/line-shape';

function GameController() {
  return (
    <group position={[-0.52, 1.24, 0.08]} rotation={[0, -0.12, 0]}>
      <LineSphere args={[0.42, 20, 14]} scale={[1.15, 0.18, 0.58]} />
      <LineBox
        args={[0.32, 0.16, 0.55]}
        position={[-0.34, -0.04, 0.2]}
        rotation={[0, -0.28, -0.16]}
      />
      <LineBox args={[0.32, 0.16, 0.55]} position={[0.34, -0.04, 0.2]} rotation={[0, 0.28, 0.16]} />
      <LineBox args={[0.28, 0.035, 0.07]} position={[-0.2, 0.19, -0.04]} />
      <LineBox args={[0.07, 0.035, 0.28]} position={[-0.2, 0.19, -0.04]} />
      {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((angle) => (
        <LineCylinder
          key={angle}
          args={[0.035, 0.035, 0.025, 12]}
          position={[0.22 + Math.cos(angle) * 0.1, 0.2, -0.04 + Math.sin(angle) * 0.1]}
        />
      ))}
      <LineCylinder args={[0.08, 0.09, 0.045, 16]} position={[-0.06, 0.2, 0.08]} />
      <LineCylinder args={[0.08, 0.09, 0.045, 16]} position={[0.08, 0.2, 0.08]} />
    </group>
  );
}

export function CoffeeTable() {
  return (
    <group position={[-5.52, 0, 0.22]} rotation={[0, Math.PI / 2, 0]}>
      <LineBox args={[4.6, 0.22, 1.86]} position={[0, 1.02, 0]} />
      <LineBox args={[4.18, 0.24, 0.16]} position={[0, 0.82, -0.74]} />
      <LineBox args={[4.18, 0.24, 0.16]} position={[0, 0.82, 0.74]} />
      <LineBox args={[0.16, 0.24, 1.48]} position={[-2.09, 0.82, 0]} />
      <LineBox args={[0.16, 0.24, 1.48]} position={[2.09, 0.82, 0]} />
      {[-1.96, 1.96].flatMap((x) =>
        [-0.68, 0.68].map((z) => (
          <LineBox
            key={`${String(x)}-${String(z)}`}
            args={[0.22, 0.84, 0.22]}
            position={[x, 0.42, z]}
          />
        )),
      )}
      <LineBox args={[3.82, 0.12, 1.32]} position={[0, 0.34, 0]} />
      <LineBox args={[3.98, 0.12, 0.12]} position={[0, 0.2, -0.62]} />
      <LineBox args={[3.98, 0.12, 0.12]} position={[0, 0.2, 0.62]} />
      <LineCylinder args={[0.27, 0.27, 0.12, 22]} position={[1.25, 1.19, -0.3]} />
      <GameController />
    </group>
  );
}
