import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Business Lending Advocate',
    short_name: 'BLA',
    description:
      'Free DSCR calculator, business cash flow analysis, loan packaging, and lender-readiness support for small-business owners.',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#020617',
    icons: [
      {
        src: '/images/Logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
