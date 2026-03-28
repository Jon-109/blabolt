import withMDX from '@next/mdx';

const nextConfig = {
  reactStrictMode: true,
};

export default withMDX({
  extension: /\.mdx?$/,
  options: {
    // MDX options can be customized here
  },
})(nextConfig);
