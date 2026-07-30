import { LocateFixed, MapPin, Navigation, ThermometerSun } from 'lucide-react';

import type { WeatherData } from '@/api';

interface WeatherCardProps {
  data: WeatherData;
  locating: boolean;
  onLocate: () => void;
}

export function WeatherCard({ data, locating, onLocate }: WeatherCardProps) {
  return (
    <section className="weather-card" aria-label="当前天气">
      <div className="weather-location">
        <MapPin aria-hidden="true" size={16} />
        <span>
          {data.location.region}
          {data.location.city}
        </span>
      </div>
      <div className="weather-current">
        <strong>{data.current.temperature}°</strong>
        <div>
          <b>{data.current.text}</b>
          <span>体感 {data.current.feelsLike}°</span>
        </div>
      </div>
      <dl>
        <div>
          <dt>
            <ThermometerSun aria-hidden="true" size={15} />
            湿度
          </dt>
          <dd>{data.current.humidity}%</dd>
        </div>
        <div>
          <dt>
            <Navigation aria-hidden="true" size={15} />
            风力
          </dt>
          <dd>
            {data.current.windDirection} {data.current.windScale}级
          </dd>
        </div>
      </dl>
      <button type="button" className="secondary-action" onClick={onLocate} disabled={locating}>
        <LocateFixed aria-hidden="true" size={16} />
        {locating ? '正在定位' : '使用设备位置'}
      </button>
    </section>
  );
}
