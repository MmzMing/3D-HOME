import type { IncomingMessage } from 'node:http';

import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';

import { dispatchApiRequest } from './src/api/edge/router.ts';
import { handleRobotsGet, handleSitemapGet } from './src/api/edge/seo.ts';
import feedsData from './src/config/feeds.json' with { type: 'json' };
import linksData from './src/config/links.json' with { type: 'json' };
import profileData from './src/config/profile.json' with { type: 'json' };
import siteRecordsData from './src/config/site-records.json' with { type: 'json' };
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

function anchor(href: string, label: string, rel: string) {
  return `<a href="${escapeHtml(href)}" rel="${rel}">${escapeHtml(label)}</a>`;
}

const knownSkills = Array.from(
  new Set(profileData.skills.flatMap((group) => group.items.map((item) => item.name))),
);

// AI crawlers and search-engine robots do not execute JavaScript, so the room's content
// has to exist in the raw HTML. This shell is hidden once React mounts, and doubles as the
// no-JS reading view.
function renderSeoShell() {
  const skills = profileData.skills
    .map((group) => {
      const items = group.items.map((item) => escapeHtml(item.name)).join('、');
      return `        <li><h3>${escapeHtml(group.label)}</h3><p>${items}</p></li>`;
    })
    .join('\n');

  const sites = linksData
    .map(
      (link) =>
        `        <li>${anchor(link.url, link.title, 'me')}<p>${escapeHtml(link.description)}</p></li>`,
    )
    .join('\n');

  const socials = profileData.socialLinks
    .map((social) => `        <li>${anchor(social.url, social.label, 'me noopener')}</li>`)
    .join('\n');

  const friends = feedsData
    .filter((feed) => feed.enabled)
    .map((feed) => {
      const tags = feed.tags.map((tag) => escapeHtml(tag)).join(' · ');
      return `        <li>${anchor(feed.siteUrl, feed.name, 'noopener')}<span class="seo-tag">${tags}</span></li>`;
    })
    .join('\n');

  const { copyright, icp, police } = siteRecordsData;

  return `<div class="seo-shell">
  <header class="seo-block">
    <h1>${escapeHtml(siteConfig.siteName)}</h1>
    <p class="seo-role">${escapeHtml(profileData.name)} · ${escapeHtml(profileData.intro.role)}</p>
    <p>${escapeHtml(siteConfig.description)}</p>
    <p>${escapeHtml(profileData.bio)}</p>
  </header>

  <section class="seo-block" aria-labelledby="seo-sites-title">
    <h2 id="seo-sites-title">我的站点</h2>
    <ul class="seo-list">
${sites}
    </ul>
  </section>

  <section class="seo-block" aria-labelledby="seo-skills-title">
    <h2 id="seo-skills-title">技术栈</h2>
    <ul class="seo-list">
${skills}
    </ul>
  </section>

  <section class="seo-block" aria-labelledby="seo-social-title">
    <h2 id="seo-social-title">其他平台</h2>
    <ul class="seo-inline-list">
${socials}
    </ul>
  </section>

  <section class="seo-block" aria-labelledby="seo-friends-title">
    <h2 id="seo-friends-title">友情链接</h2>
    <p>房间里书架上的 RSS 来源，推开门就能抵达：</p>
    <ul class="seo-inline-list">
${friends}
    </ul>
  </section>

  <footer class="seo-block">
    <p>${escapeHtml(copyright)}</p>
    <p class="seo-record">
      ${anchor(icp.url, icp.label, 'noopener')}
      ${anchor(police.url, police.label, 'noopener')}
    </p>
  </footer>
</div>`;
}

// The llms.txt convention: a plain-text page only AI engines read, so it must stay short
// enough to survive their truncation and must never contradict the HTML shell.
function renderLlmsTxt() {
  const skills = knownSkills.join('、');
  const friends = feedsData
    .filter((feed) => feed.enabled)
    .map((feed) => `- [${feed.name}](${feed.siteUrl})`);

  return [
    `# ${siteConfig.siteName}`,
    '',
    `> ${siteConfig.title}`,
    '',
    siteConfig.description,
    '',
    '本站是一个可交互的 3D 房间，正文与链接在首页 HTML 中直接输出，不需要执行 JavaScript。',
    '',
    '## 作者',
    '',
    `- 名称：${profileData.name}`,
    `- 职位：${profileData.intro.role}`,
    `- 简介：${siteConfig.personDescription}`,
    `- 技术栈：${skills}`,
    '',
    '## 我的站点',
    '',
    ...linksData.map((link) => `- [${link.title}](${link.url}): ${link.description}`),
    '',
    '## 其他平台',
    '',
    ...profileData.socialLinks.map((social) => `- [${social.label}](${social.url})`),
    '',
    '## 友情链接',
    '',
    ...friends,
    '',
  ].join('\n');
}

function siteSeo(): Plugin {
  const siteUrl = siteConfig.siteUrl.replace(/\/+$/, '');
  const ogImage = `${siteUrl}${siteConfig.image}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        description: siteConfig.description,
        inLanguage: 'zh-CN',
        name: siteConfig.siteName,
        publisher: { '@id': `${siteUrl}/#person` },
        url: `${siteUrl}/`,
      },
      {
        '@type': 'ProfilePage',
        '@id': `${siteUrl}/#webpage`,
        dateModified: siteConfig.lastmod,
        description: siteConfig.description,
        inLanguage: 'zh-CN',
        isPartOf: { '@id': `${siteUrl}/#website` },
        mainEntity: { '@id': `${siteUrl}/#person` },
        name: siteConfig.title,
        primaryImageOfPage: { '@id': `${siteUrl}/#cover` },
        url: `${siteUrl}/`,
      },
      {
        '@type': 'Person',
        '@id': `${siteUrl}/#person`,
        description: siteConfig.personDescription,
        image: ogImage,
        jobTitle: profileData.intro.role,
        knowsAbout: knownSkills,
        name: profileData.name,
        sameAs: profileData.socialLinks.map((social) => social.url),
        url: `${siteUrl}/`,
      },
      {
        '@type': 'ImageObject',
        '@id': `${siteUrl}/#cover`,
        caption: siteConfig.imageAlt,
        height: siteConfig.imageHeight,
        url: ogImage,
        width: siteConfig.imageWidth,
      },
      {
        '@type': 'ItemList',
        '@id': `${siteUrl}/#sites`,
        itemListElement: linksData.map((link, index) => ({
          '@type': 'ListItem',
          name: link.title,
          position: index + 1,
          url: link.url,
        })),
        name: 'MmzMing 的站点',
        numberOfItems: linksData.length,
      },
    ],
  };

  const replacements: Record<string, string> = {
    __SITE_AUTHOR__: siteConfig.author,
    __SITE_DESCRIPTION__: siteConfig.description,
    __SITE_IMAGE_ALT__: siteConfig.imageAlt,
    __SITE_IMAGE_HEIGHT__: String(siteConfig.imageHeight),
    __SITE_IMAGE_WIDTH__: String(siteConfig.imageWidth),
    __SITE_JSONLD__: JSON.stringify(jsonLd).replaceAll('<', '\\u003c'),
    __SITE_NAME__: siteConfig.siteName,
    __SITE_OG_IMAGE__: ogImage,
    __SITE_SEO_SHELL__: renderSeoShell(),
    __SITE_SOCIAL_DESCRIPTION__: siteConfig.socialDescription,
    __SITE_TITLE__: siteConfig.title,
    __SITE_URL__: siteUrl,
  };

  return {
    name: 'site-seo',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'llms.txt', source: renderLlmsTxt() });
    },
    transformIndexHtml(html) {
      let transformed = html;
      Object.entries(replacements).forEach(([token, value]) => {
        transformed = transformed.replaceAll(token, value);
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
      sourcemap: false,
      // Rapier is ~1 MB brotli and only the doll-word glyphs need it, so keep it off the
      // critical path; the layer already pulls it in with a dynamic import.
      modulePreload: {
        resolveDependencies: (_filename, dependencies) =>
          dependencies.filter((dependency) => !dependency.includes('doll-words-physics')),
      },
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
