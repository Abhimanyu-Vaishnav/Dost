import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  allowedDevOrigins: [
    "192.168.1.202",
    "192.168.1.223",
    "192.168.1.1",
    "10.83.89.169",
    "localhost:3000",
    "0.0.0.0:3000",
    "*.trycloudflare.com",
    "senators-calculate-assessed-accomplished.trycloudflare.com",
    "warm-suns-warn.loca.lt",
    "*.loca.lt",
    "*.ngrok-free.app",
    "*.localtunnel.me"
  ],
};

export default nextConfig;
