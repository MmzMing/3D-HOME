import {
  Cloud,
  CloudRain,
  Droplet,
  Eye,
  Gauge,
  LocateFixed,
  MapPin,
  Navigation,
  Sunrise,
  Sunset,
  ThermometerSun,
  Sun,
} from 'lucide-react';

import type { WeatherData } from '@/api';

import { WeatherIcon } from './weather-icon';

const weekdayFormatter = new Intl.DateTimeFormat('zh-CN', { weekday: 'short' });
const dayFormatter = new Intl.DateTimeFormat('zh-CN', { day: 'numeric' });

interface MetricItemProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}

function MetricItem({ icon, label, value, highlight }: MetricItemProps) {
  return (
    <div className={`weather-metric ${highlight ? 'weather-metric-highlight' : ''}`}>
      <span className="weather-metric-icon">{icon}</span>
      <span className="weather-metric-value">{value}</span>
      <span className="weather-metric-label">{label}</span>
    </div>
  );
}

interface WeatherCardProps {
  data: WeatherData;
  locating: boolean;
  onLocate: () => void;
}

export function WeatherCard({ data, locating, onLocate }: WeatherCardProps) {
  const humidityHigh = Number.parseInt(data.current.humidity, 10) >= 90;

  return (
    <section className="weather-card" aria-label="当前及未来七天天气">
      <div className="weather-top">
        <div className="weather-top-main">
          <WeatherIcon code={data.current.icon} size={56} />
          <div>
            <strong>{data.current.temperature}°</strong>
            <div className="weather-place-row">
              <span className="weather-city">
                <MapPin aria-hidden="true" size={14} />
                {data.location.region} {data.location.city}
              </span>
              <span className="weather-text">{data.current.text}</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          className="weather-locate-btn"
          onClick={onLocate}
          disabled={locating}
          aria-label={locating ? '正在定位' : '使用设备位置'}
        >
          <LocateFixed aria-hidden="true" size={16} />
        </button>
      </div>
      <div className="weather-temp-range">
        高温 <span className="weather-temp-high">{data.current.temperatureMax}°</span>{' '}
        <span className="weather-divider">/</span> 低温{' '}
        <span className="weather-temp-low">{data.current.temperatureMin}°</span>
      </div>
      <div className="weather-metrics">
        <MetricItem
          icon={<ThermometerSun aria-hidden="true" size={16} />}
          label="体感"
          value={`${data.current.feelsLike}°`}
        />
        <MetricItem
          icon={<Droplet aria-hidden="true" size={16} />}
          label="湿度"
          value={`${data.current.humidity}%`}
          highlight={humidityHigh}
        />
        <MetricItem
          icon={<Navigation aria-hidden="true" size={16} />}
          label="风力"
          value={`${data.current.windScale}级`}
        />
        <MetricItem
          icon={<Eye aria-hidden="true" size={16} />}
          label="能见度"
          value={`${data.current.visibility}km`}
        />
        <MetricItem
          icon={<Gauge aria-hidden="true" size={16} />}
          label="气压"
          value={`${data.current.pressure}hPa`}
        />
        <MetricItem
          icon={<Cloud aria-hidden="true" size={16} />}
          label="云量"
          value={`${data.current.cloud}%`}
        />
        <MetricItem
          icon={<Sun aria-hidden="true" size={16} />}
          label="紫外线"
          value={data.current.uvIndex}
        />
        <MetricItem
          icon={<CloudRain aria-hidden="true" size={16} />}
          label="降水"
          value={`${data.current.precip}mm`}
        />
        <MetricItem
          icon={<Sunrise aria-hidden="true" size={16} />}
          label="日出日落"
          value={
            <span className="weather-sun-inline">
              <span className="weather-sunrise-text">
                <Sunrise aria-hidden="true" size={11} />
                {data.current.sunrise}
              </span>
              <span className="weather-sunset-text">
                <Sunset aria-hidden="true" size={11} />
                {data.current.sunset}
              </span>
            </span>
          }
        />
      </div>
      <ol className="weather-forecast" aria-label="未来七天天气">
        {data.forecast.map((day, index) => {
          const date = new Date(`${day.date}T00:00:00`);

          return (
            <li key={day.date} data-today={index === 0 || undefined}>
              <time dateTime={day.date}>
                <span>{weekdayFormatter.format(date)}</span>
                <strong>{dayFormatter.format(date)}</strong>
              </time>
              <span className="weather-forecast-icon">
                <WeatherIcon code={day.icon} size={25} />
              </span>
              <span className="visually-hidden">{day.text}</span>
              <span
                className="weather-forecast-temperature"
                aria-label={`最高 ${day.temperatureMax} 度，最低 ${day.temperatureMin} 度`}
              >
                <b aria-hidden="true">{day.temperatureMax}°</b>
                <i aria-hidden="true">{day.temperatureMin}°</i>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
