import type { MetadataRoute } from 'next';

const siteUrl = 'https://www.businesslendingadvocate.com';
const lastModified = new Date('2026-03-28T00:00:00.000Z');

const routes: Array<{
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;
  priority: number;
}> = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/cash-flow-analysis', changeFrequency: 'weekly', priority: 0.95 },
  { path: '/comprehensive-cash-flow-analysis', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/loan-services', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/loan-packaging', changeFrequency: 'weekly', priority: 0.85 },
  { path: '/loan-payment-calculator', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/get-funded', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/sba-7a-loans', changeFrequency: 'monthly', priority: 0.75 },
  { path: '/templates', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/sba-413', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/blog', changeFrequency: 'weekly', priority: 0.65 },
  { path: '/faq', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/privacy-policy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/terms-of-service', changeFrequency: 'yearly', priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
