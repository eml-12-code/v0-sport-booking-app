/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'standalone',

  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  outputFileTracingIncludes: {
    '/**': ['./lib/lua/**/*'],
  },

}

export default nextConfig
