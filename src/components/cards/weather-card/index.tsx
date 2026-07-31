import { LocateFixed, MapPin, Navigation, ThermometerSun } from 'lucide-react';

import type { WeatherData } from '@/api';

import { WeatherIcon } from './weather-icon';

const weekdayFormatter = new Intl.DateTimeFormat('zh-CN', { weekday: 'short' });
const dayFormatter = new Intl.DateTimeFormat('zh-CN', { day: 'numeric' });

interface WeatherCardProps {
  data: WeatherData;
  locating: boolean;
  onLocate: () => void;
}

export function WeatherCard({ data, locating, onLocate }: WeatherCardProps) {
  return (
    <section className="weather-card" aria-label="当前及未来七天天气">
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
      <button type="button" className="secondary-action" onClick={onLocate} disabled={locating}>
        <LocateFixed aria-hidden="true" size={16} />
        {locating ? '正在定位' : '使用设备位置'}
      </button>
    </section>
  );
}
