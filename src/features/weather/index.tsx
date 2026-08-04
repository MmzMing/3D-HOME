import { useQuery } from '@tanstack/react-query';
import { LocateFixed } from 'lucide-react';
import { useState } from 'react';

import { getDeviceWeather, getWeather } from '@/api';
import { WeatherCard } from '@/components/cards/weather-card';
import { ModalShell } from '@/components/common/modal-shell';
import { ObjectShowcase } from '@/components/common/object-showcase';
import { ErrorStatus, LoadingStatus } from '@/components/common/status-view';
import { weatherConfig } from '@/config';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useRoomStore } from '@/stores/room-store';

export function WeatherPopover() {
  const open = useRoomStore((state) => state.isWeatherOpen);
  const setOpen = useRoomStore((state) => state.setWeatherOpen);
  const isDesktop = useMediaQuery('(min-width: 720px)');
  const [locating, setLocating] = useState(false);
  const [deviceData, setDeviceData] = useState<Awaited<ReturnType<typeof getDeviceWeather>> | null>(
    null,
  );
  const query = useQuery({
    enabled: open,
    queryFn: getWeather,
    queryKey: ['weather', 'edge'],
    refetchInterval: open ? weatherConfig.refreshIntervalMs : false,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  async function locate() {
    setLocating(true);
    try {
      setDeviceData(await getDeviceWeather());
    } catch {
      await query.refetch();
    } finally {
      setLocating(false);
    }
  }

  const displayData = deviceData ?? query.data;
  const content = (
    <>
      {query.isLoading && deviceData === null ? <LoadingStatus label="正在获取位置与天气" /> : null}
      {query.isError && deviceData === null ? (
        <div className="weather-error-actions">
          <ErrorStatus message="天气暂不可用。" onRetry={() => void query.refetch()} />
          <button
            type="button"
            className="secondary-action"
            onClick={() => void locate()}
            disabled={locating}
          >
            <LocateFixed aria-hidden="true" size={16} />
            {locating ? '正在定位' : '使用设备位置'}
          </button>
        </div>
      ) : null}
      {displayData === undefined ? null : (
        <WeatherCard data={displayData.data} locating={locating} onLocate={() => void locate()} />
      )}
    </>
  );

  if (isDesktop) {
    return (
      <ObjectShowcase
        layout="weather-split"
        open={open}
        onOpenChange={setOpen}
        title="天气"
        description="晴天娃娃正在读取当前位置的天气"
      >
        {content}
      </ObjectShowcase>
    );
  }

  return (
    <ModalShell
      open={open}
      onOpenChange={setOpen}
      title="天气"
      description="晴天娃娃正在读取当前位置的天气"
      size="compact"
    >
      {content}
    </ModalShell>
  );
}
