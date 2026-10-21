import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    return [
      { source: "/admin/:path*", headers: noindex },
      { source: "/nhan-vien/:path*", headers: noindex },
      { source: "/dang-nhap", headers: noindex },
      { source: "/api/:path*", headers: noindex },
    ];
  },
};

export default nextConfig;
