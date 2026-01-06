/** @type {import('next').NextConfig} */
const nextConfig = {
  skipMiddlewareUrlNormalize: true,
  skipTrailingSlashRedirect: true,
  experimental: {
    skipMiddlewareUrlNormalize: true,
  },
};

module.exports = nextConfig;
