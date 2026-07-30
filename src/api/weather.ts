import { z } from 'zod';

import { requestApi } from '@/api/http';

const weatherSchema = z.object({
  current: z.object({
    feelsLike: z.string().min(1),
    humidity: z.string().min(1),
    icon: z.string().min(1),
    observedAt: z.iso.datetime({ offset: true }),
    temperature: z.string().min(1),
    text: z.string().min(1),
    visibility: z.string().min(1),
    windDirection: z.string().min(1),
    windScale: z.string().min(1),
  }),
  forecast: z
    .array(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        icon: z.string().min(1),
        temperatureMax: z.string().min(1),
        temperatureMin: z.string().min(1),
        text: z.string().min(1),
      }),
    )
    .length(7),
  location: z.object({ city: z.string().min(1), region: z.string().min(1) }),
});

export type WeatherData = z.infer<typeof weatherSchema>;

export function getWeather() {
  return requestApi('/api/weather', weatherSchema);
}

export function getDeviceWeather() {
  if (!('geolocation' in navigator)) return Promise.reject(new Error('此设备不支持定位。'));

  return new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      maximumAge: 300_000,
      timeout: 8_000,
    });
  }).then((position) =>
    requestApi('/api/weather', weatherSchema, {
      body: JSON.stringify({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    }),
  );
}
