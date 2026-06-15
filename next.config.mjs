/** @type {import('next').NextConfig} */
const nextConfig = {
  // Nur `next dev`: erlaubt den Dev-Server-Zugriff (HMR + /_next/* Chunks) über
  // 127.0.0.1. Next 16 blockt sonst Dev-Ressourcen, die von einem anderen Host
  // als dem Default angefragt werden — was die Hydration verhindert. Die
  // Playwright-E2E-Suite läuft fest auf 127.0.0.1 (deterministisches Matching
  // mit den Firebase-Emulator-Hosts). In Produktionsbuilds ohne Wirkung.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
