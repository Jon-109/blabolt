import withMDX from '@next/mdx';

const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: '/sba-413',
        destination: '/templates/personal_financial_statement?source=sba-413',
        permanent: false,
      },
    ];
  },
};

export default withMDX({
  extension: /\.mdx?$/,
  options: {
    // MDX options can be customized here
  },
})(nextConfig);
