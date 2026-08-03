import type { EdgeContext } from './shared.ts';

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function getOrigin(request: Request) {
  return new URL(request.url).origin;
}

function textResponse(source: string, contentType: string) {
  return new Response(source, {
    headers: {
      'cache-control': 'public, max-age=3600, s-maxage=3600',
      'content-type': contentType,
    },
  });
}

export function handleRobotsGet(context: EdgeContext) {
  const sitemapUrl = `${getOrigin(context.request)}/sitemap.xml`;
  return textResponse(
    `User-agent: *\nAllow: /\nSitemap: ${sitemapUrl}\n`,
    'text/plain; charset=UTF-8',
  );
}

export function handleSitemapGet(context: EdgeContext) {
  const loc = escapeXml(`${getOrigin(context.request)}/`);
  const source = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '  <url>',
    `    <loc>${loc}</loc>`,
    '  </url>',
    '</urlset>',
    '',
  ].join('\n');

  return textResponse(source, 'application/xml; charset=UTF-8');
}
