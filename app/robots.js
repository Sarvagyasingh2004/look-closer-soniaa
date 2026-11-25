// Tells search engines what to crawl: the profile, but never the private inbox or the API.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/inbox', '/api/'] }],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
