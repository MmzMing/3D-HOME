import type { IncomingMessage } from 'node:http';

import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';

import { dispatchApiRequest } from './src/api/edge/router.ts';
import { handleRobotsGet, handleSitemapGet } from './src/api/edge/seo.ts';
import siteConfig from './src/config/site.json' with { type: 'json' };

function readRequestBody(request: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on('data', (chunk: unknown) => {
      if (typeof chunk === 'string') chunks.push(Buffer.from(chunk));
      else if (chunk instanceof Uint8Array) chunks.push(Buffer.from(chunk));
    });
    request.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    request.on('error', reject);
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderSiteFallback() {
  const { fallback } = siteConfig;
  const links = fallback.links
    .map(({ label, url }) => `<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>`)
    .join('');

  return [
    '<main>',
    `  <h1>${escapeHtml(fallback.heading)}</h1>`,
    `  <p>${escapeHtml(fallback.intro)}</p>`,
    `  <p>${escapeHtml(fallback.notice)}</p>`,
    '  <nav aria-label="站点链接">',
    `    ${links}`,
    '  </nav>',
    '</main>',
  ].join('\n');
}

function siteSeo(): Plugin {
  const replacements = {
    __SITE_AUTHOR__: siteConfig.author,
    __SITE_DESCRIPTION__: siteConfig.description,
    __SITE_IMAGE__: siteConfig.image,
    __SITE_NAME__: siteConfig.siteName,
    __SITE_SOCIAL_DESCRIPTION__: siteConfig.socialDescription,
    __SITE_TITLE__: siteConfig.title,
  };

  return {
    name: 'site-seo',
    transformIndexHtml(html) {
      let transformed = html.replace('<!-- SITE_NOSCRIPT -->', renderSiteFallback());
      Object.entries(replacements).forEach(([token, value]) => {
        transformed = transformed.replaceAll(token, escapeHtml(value));
      });
      return transformed;
    },
  };
}

function dispatchLocalEdgeRequest(context: Parameters<typeof dispatchApiRequest>[0]) {
  const pathname = new URL(context.request.url).pathname;
  if (pathname === '/robots.txt') return handleRobotsGet(context);
  if (pathname === '/sitemap.xml') return handleSitemapGet(context);
  return dispatchApiRequest(context);
}

function localEdgeApi(env: Record<string, string | undefined>): Plugin {
  return {
    name: 'local-edge-api',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        void (async () => {
          const relativeUrl = request.url;
          if (relativeUrl === undefined) {
            next();
            return;
          }
          const pathname = new URL(relativeUrl, 'http://127.0.0.1').pathname;
          if (
            pathname !== '/robots.txt' &&
            pathname !== '/sitemap.xml' &&
            !pathname.startsWith('/api/')
          ) {
            next();
            return;
          }

          const method = request.method?.toUpperCase() ?? 'GET';
          const headers = new Headers();
          Object.entries(request.headers).forEach(([name, value]) => {
            if (value !== undefined)
              headers.set(name, Array.isArray(value) ? value.join(', ') : value);
          });
          const body =
            method === 'GET' || method === 'HEAD' ? undefined : await readRequestBody(request);
          const protocol = headers.get('x-forwarded-proto') ?? 'http';
          const host = headers.get('host') ?? '127.0.0.1';
          const edgeRequest = new Request(new URL(relativeUrl, `${protocol}://${host}`), {
            body,
            headers,
            method,
          });
          const edgeResponse = await dispatchLocalEdgeRequest({
            env,
            request: edgeRequest,
            waitUntil: (promise) => {
              void promise.catch(() => undefined);
            },
          });
          response.statusCode = edgeResponse.status;
          edgeResponse.headers.forEach((value, key) => response.setHeader(key, value));
          response.end(Buffer.from(await edgeResponse.arrayBuffer()));
        })().catch(next);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const edgeEnv = { ...process.env, ...loadEnv(mode, process.cwd(), '') };

  return {
    plugins: [react(), localEdgeApi(edgeEnv), siteSeo()],
    resolve: { tsconfigPaths: true },
    build: {
      // The 3D runtime is intentionally shipped as one vendor chunk.
      chunkSizeWarningLimit: 1200,
      target: 'es2023',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (
              id.includes('node_modules/@react-three/rapier') ||
              id.includes('node_modules/@dimforge/rapier3d-compat')
            ) {
              return 'doll-words-physics';
            }
            if (id.includes('node_modules/three') || id.includes('node_modules/@react-three')) {
              return 'three-vendor';
            }
            if (
              id.includes('node_modules/react') ||
              id.includes('node_modules/zustand') ||
              id.includes('node_modules/@tanstack/react-query')
            ) {
              return 'react-vendor';
            }
            return undefined;
          },
        },
      },
    },
    server: {
      host: '127.0.0.1',
      port: 5173,
    },
  };
});
