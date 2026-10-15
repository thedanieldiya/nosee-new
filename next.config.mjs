const nextConfig = {
  experimental: { globalNotFound: true, authInterrupts: true, serverActions: { bodySizeLimit: "32kb" } },
  // Laravel accepts trailing slashes; meeting variants must return a direct 302.
  skipTrailingSlashRedirect: true,
};
export default nextConfig;
