import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  // Los e2e compilan su propio build (NEXT_DIST_DIR=.next-e2e) para no pelearse
  // por el lock de `.next` con un `next dev` abierto: sin esto, lanzar la suite
  // con el servidor de desarrollo levantado aborta con "Another next build
  // process is already running".
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
};

export default nextConfig;
