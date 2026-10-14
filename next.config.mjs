const nextConfig = {
  experimental: { globalNotFound: true },
  // Laravel accepts trailing slashes; meeting variants must return a direct 302.
  skipTrailingSlashRedirect: true,
};
export default nextConfig;
