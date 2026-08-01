import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';

import { useRoomStore } from '@/stores/room-store';

interface PhysicsLayerProps {
  onReady: () => void;
}

let physicsModule: Promise<{ default: ComponentType<PhysicsLayerProps> }> | null = null;

function loadPhysicsModule() {
  physicsModule ??= import('./physics');
  return physicsModule;
}

class DollWordErrorBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('3D doll words were disabled because their assets failed to load.', error);
    useRoomStore.getState().setDollWordCount(0);
    this.props.onFailure();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function DollWordLayer({ onReady }: { onReady: () => void }) {
  const [PhysicsLayer, setPhysicsLayer] = useState<ComponentType<PhysicsLayerProps> | null>(null);
  const readyReported = useRef(false);
  const reportReady = useCallback(() => {
    if (readyReported.current) return;
    readyReported.current = true;
    onReady();
  }, [onReady]);

  useEffect(() => {
    if (PhysicsLayer !== null) return;
    let cancelled = false;
    void loadPhysicsModule()
      .then((module) => {
        if (!cancelled) setPhysicsLayer(() => module.default);
      })
      .catch((error: unknown) => {
        console.warn('3D doll words could not be preloaded.', error);
        reportReady();
      });
    return () => {
      cancelled = true;
    };
  }, [PhysicsLayer, reportReady]);

  if (PhysicsLayer === null) return null;
  return (
    <DollWordErrorBoundary onFailure={reportReady}>
      <Suspense fallback={null}>
        <PhysicsLayer onReady={reportReady} />
      </Suspense>
    </DollWordErrorBoundary>
  );
}
