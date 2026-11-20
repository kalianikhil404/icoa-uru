import os from "node:os"
import type { NextConfig } from "next"

/* Lets phones and laptops on the same WiFi open the site while it runs on
   this computer (npm run dev). Every WiFi address of this computer is allowed. */
function wifiHosts() {
  const hosts = new Set<string>(["localhost", "127.0.0.1", "*.local", os.hostname(), `${os.hostname().toLowerCase()}.local`])
  for (const list of Object.values(os.networkInterfaces())) {
    for (const net of list ?? []) {
      if (net.family === "IPv4" && !net.internal) hosts.add(net.address)
    }
  }
  return [...hosts]
}

const nextConfig: NextConfig = {
  allowedDevOrigins: wifiHosts(),
  // no Next.js badge in the corner while the website runs on this computer
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    // Product photos are served as modern formats automatically.
    formats: ["image/avif", "image/webp"],
  },
}

export default nextConfig
