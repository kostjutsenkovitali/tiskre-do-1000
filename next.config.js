/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',              // writes the static site to out/
  images: { unoptimized: true }, // needed for static export if you use next/image

  // let the build succeed even with lint/type errors
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

module.exports = nextConfig;
