/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com'], // For uploaded images
  },
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig
