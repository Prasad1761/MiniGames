/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Canvas loops often benefit from single mount during dev
};

module.exports = nextConfig;
