/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export so the landing page can be hosted on Cloudflare Pages (build output: out/).
  output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
