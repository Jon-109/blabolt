import withMDX from '@next/mdx';

const nextConfig = {
  // Any custom Next.js config here
};

export default withMDX({
  extension: /\.mdx?$/,
  options: {
    // MDX options can be customized here
  },
})(nextConfig);
