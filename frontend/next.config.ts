/** @type {import('next').NextConfig} */

const nextConfig = {
  eslint: {
    //remove these lines if you want to use eslint
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
 
};

export default nextConfig;