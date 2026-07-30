# Edge data migration design

## Goal

Restore the proven weather and GitHub data paths from `my-home` in `3D-home` without exposing provider credentials to browser code. Local development and EdgeOne deployment must dispatch the same `/api/*` routes and return the same response contracts.

## Architecture

- Add one method-aware API dispatcher for `/api/feeds`, `/api/github`, `/api/health`, `/api/music`, and `/api/weather`.
- Make the EdgeOne catch-all function delegate to that dispatcher.
- Make the Vite development middleware adapt Node requests to Fetch `Request` objects and delegate to the same dispatcher.
- Keep provider access in edge handlers. Browser modules continue to call same-origin `/api/*` paths only.
- Copy the ignored local `.env` from `my-home` so local handlers receive the already working QWeather and GitHub credentials. Production credentials remain EdgeOne project environment variables.

## Weather behavior

EdgeOne GET requests use platform geolocation. Vite does not have EdgeOne geolocation, so GET may return the existing `location-unavailable` response. The existing device-location action sends coordinates with POST and provides the local-development path without inventing a default location.

## Validation and errors

The migrated client schemas retain the stricter validated contracts from `my-home`: seven forecast days, valid timestamps, and non-empty provider fields. The shared dispatcher preserves structured 404 and 405 responses. The Vite adapter preserves status, headers, body, and environment variables.

## Tests and acceptance

- Unit tests prove route/method dispatch and structured 404/405 responses.
- Client API tests prove weather and GitHub responses are accepted and malformed responses are rejected.
- Type checking, linting, formatting, tests, and production build pass.
- With the migrated local environment, live local `/api/github` succeeds and weather POST succeeds when valid coordinates are supplied.
