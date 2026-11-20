import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Flashcard uploads send up to 4 MB of PDFs/photos through a server action (default limit is 1 MB).
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
};

export default nextConfig;
