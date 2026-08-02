import { z } from 'zod';

import weatherConfigData from '../../config/weather.json' with { type: 'json' };

import {
  createRequestId,
  failure,
  fetchWithTimeout,
  getEdgeCache,
  getEdgeGeo,
  success,
  type EdgeContext,
  type EdgeGeo,
} from './shared.ts';

const weatherConfigSchema = z.object({
  language: z.enum(['zh', 'en']),
  provider: z.literal('qweather'),
  refreshIntervalMs: z.number().int().min(60_000).max(3_600_000),
  unit: z.enum(['m', 'i']),
});

const qweatherNowSchema = z.object({
  code: z.literal('200'),
  now: z.object({
    cloud: z.string().min(1),
    feelsLike: z.string().min(1),
    humidity: z.string().min(1),
    icon: z.string().min(1),
    obsTime: z.iso.datetime({ offset: true }),
    temp: z.string().min(1),
    text: z.string().min(1),
    vis: z.string().min(1),
    windDir: z.string().min(1),
    windScale: z.string().min(1),
  }),
});

const qweatherForecastSchema = z.object({
  code: z.literal('200'),
  daily: z
    .array(
      z.object({
        fxDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        iconDay: z.string().min(1),
        precip: z.string().min(1),
        pressure: z.string().min(1),
        sunrise: z.string().min(1),
        sunset: z.string().min(1),
        tempMax: z.string().min(1),
        tempMin: z.string().min(1),
        textDay: z.string().min(1),
        uvIndex: z.string().min(1),
      }),
    )
    .length(7),
});

const qweatherLocationSchema = z.object({
  code: z.literal('200'),
  location: z
    .array(z.object({ adm1: z.string().min(1), adm2: z.string().min(1), name: z.string().min(1) }))
    .min(1),
});

const qweatherHostSchema = z.string().regex(/^(?:[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?\.)+[a-z]{2,}$/i);
const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

function qweatherUrl(host: string, path: string, longitude: number, latitude: number) {
  const url = new URL(`https://${host}${path}`);
  url.searchParams.set('location', `${longitude.toFixed(2)},${latitude.toFixed(2)}`);
  return url;
}

function qweatherRequest(url: URL, apiKey: string) {
  return fetchWithTimeout(url, { headers: { 'x-qw-api-key': apiKey } }, 5_000);
}

async function respondWithWeather(context: EdgeContext, geo: EdgeGeo) {
  const requestId = createRequestId();
  const config = weatherConfigSchema.safeParse(weatherConfigData);
  const apiHost = qweatherHostSchema.safeParse(context.env.QWEATHER_API_HOST);
  const apiKey = context.env.QWEATHER_API_KEY;
  if (!config.success || !apiHost.success || apiKey === undefined || apiKey.length === 0) {
    return failure('provider-unavailable', '天气服务尚未配置。', requestId, false, 503);
  }

  const cacheUrl = new URL(context.request.url);
  cacheUrl.search = '';
  cacheUrl.searchParams.set('location', `${geo.longitude.toFixed(2)},${geo.latitude.toFixed(2)}`);
  const cacheKey = new Request(cacheUrl);
  const cached = await getEdgeCache().match(cacheKey);
  if (cached !== undefined) return cached;

  const currentUrl = qweatherUrl(apiHost.data, '/v7/weather/now', geo.longitude, geo.latitude);
  const forecastUrl = qweatherUrl(apiHost.data, '/v7/weather/7d', geo.longitude, geo.latitude);
  const locationUrl = qweatherUrl(apiHost.data, '/geo/v2/city/lookup', geo.longitude, geo.latitude);
  currentUrl.searchParams.set('lang', config.data.language);
  currentUrl.searchParams.set('unit', config.data.unit);
  forecastUrl.searchParams.set('lang', config.data.language);
  forecastUrl.searchParams.set('unit', config.data.unit);
  locationUrl.searchParams.set('lang', config.data.language);

  try {
    const [currentResponse, forecastResponse, locationResponse] = await Promise.all([
      qweatherRequest(currentUrl, apiKey),
      qweatherRequest(forecastUrl, apiKey),
      qweatherRequest(locationUrl, apiKey),
    ]);
    const currentPayload: unknown = await currentResponse.json();
    const forecastPayload: unknown = await forecastResponse.json();
    const locationPayload: unknown = await locationResponse.json();
    const current = qweatherNowSchema.safeParse(currentPayload);
    const forecast = qweatherForecastSchema.safeParse(forecastPayload);
    const location = qweatherLocationSchema.safeParse(locationPayload);
    if (
      !currentResponse.ok ||
      !forecastResponse.ok ||
      !locationResponse.ok ||
      !current.success ||
      !forecast.success ||
      !location.success
    ) {
      return failure('provider-unavailable', '天气数据暂时不可用。', requestId, true, 502);
    }

    const place = location.data.location[0];
    const today = forecast.data.daily[0];
    if (place === undefined || today === undefined) {
      return failure('provider-unavailable', '天气数据暂时不可用。', requestId, true, 502);
    }

    const cacheMaxAge = Math.floor(config.data.refreshIntervalMs / 1_000).toString();
    const response = success(
      {
        current: {
          cloud: current.data.now.cloud,
          feelsLike: current.data.now.feelsLike,
          humidity: current.data.now.humidity,
          icon: current.data.now.icon,
          observedAt: current.data.now.obsTime,
          precip: today.precip,
          pressure: today.pressure,
          sunrise: today.sunrise,
          sunset: today.sunset,
          temperature: current.data.now.temp,
          temperatureMax: today.tempMax,
          temperatureMin: today.tempMin,
          text: current.data.now.text,
          uvIndex: today.uvIndex,
          visibility: current.data.now.vis,
          windDirection: current.data.now.windDir,
          windScale: current.data.now.windScale,
        },
        forecast: forecast.data.daily.map((day) => ({
          date: day.fxDate,
          icon: day.iconDay,
          temperatureMax: day.tempMax,
          temperatureMin: day.tempMin,
          text: day.textDay,
        })),
        location: { city: place.adm2 || place.name, region: place.adm1 },
      },
      requestId,
      {
        headers: {
          'cache-control': `s-maxage=${cacheMaxAge}, stale-while-revalidate=1800`,
        },
      },
    );
    context.waitUntil(getEdgeCache().put(cacheKey, response.clone()));
    return response;
  } catch {
    return failure('provider-unavailable', '天气数据暂时不可用。', requestId, true, 502);
  }
}

export async function handleWeatherGet(context: EdgeContext) {
  const geo = getEdgeGeo(context.request);
  if (geo === null) {
    return failure('location-unavailable', '无法获取当前位置。', createRequestId(), false, 422);
  }
  return respondWithWeather(context, geo);
}

export async function handleWeatherPost(context: EdgeContext) {
  const payload: unknown = await context.request.json().catch(() => null);
  const coordinates = coordinatesSchema.safeParse(payload);
  if (!coordinates.success) {
    return failure('location-unavailable', '无法获取当前位置。', createRequestId(), false, 422);
  }
  return respondWithWeather(context, coordinates.data);
}
