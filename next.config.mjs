/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  outputFileTracingIncludes: {
    "/api/ui-spec": ["./docs/**"],
    "/api/products-prd": ["./docs/**"],
  },
};

export default nextConfig;
