import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_USER_ENDPOINT: process.env.NEXT_PUBLIC_USER_ENDPOINT,
    NEXT_PUBLIC_API_ENDPOINT: process.env.NEXT_PUBLIC_API_ENDPOINT,
    NEXT_PUBLIC_CAMERA_ENDPOINT: process.env.NEXT_PUBLIC_CAMERA_ENDPOINT,
    NEXT_PUBLIC_NOTIFICATION_ENDPOINT: process.env.NEXT_PUBLIC_NOTIFICATION_ENDPOINT,
  },
}

export default nextConfig
