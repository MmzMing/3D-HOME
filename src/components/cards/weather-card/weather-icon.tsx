import {
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSun,
  Snowflake,
  Sun,
  type LucideIcon,
} from 'lucide-react';

type WeatherEffect = 'cloud' | 'fog' | 'none' | 'rain' | 'snow' | 'sun' | 'thunder';

function getWeatherIcon(code: string): { effect: WeatherEffect; icon: LucideIcon } {
  const numericCode = Number(code);

  if (!Number.isInteger(numericCode)) return { effect: 'none', icon: CloudSun };
  if (numericCode >= 200 && numericCode < 300) return { effect: 'thunder', icon: CloudLightning };
  if (numericCode >= 300 && numericCode < 400) return { effect: 'rain', icon: CloudRain };
  if (numericCode >= 400 && numericCode < 500) return { effect: 'snow', icon: Snowflake };
  if (numericCode >= 500 && numericCode < 600) return { effect: 'fog', icon: Cloud };
  if (numericCode === 100) return { effect: 'sun', icon: Sun };
  if (numericCode >= 101 && numericCode < 200) return { effect: 'cloud', icon: Cloud };

  return { effect: 'none', icon: CloudSun };
}

interface WeatherIconProps {
  code: string;
  size?: number;
}

export function WeatherIcon({ code, size = 24 }: WeatherIconProps) {
  const { effect, icon: Icon } = getWeatherIcon(code);

  return (
    <span className="weather-icon" data-effect={effect} aria-hidden="true">
      <Icon size={size} />
    </span>
  );
}
