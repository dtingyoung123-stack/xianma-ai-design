/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    "/api/ui-spec": ["./docs/**"],
  },
};

export default nextConfig;
