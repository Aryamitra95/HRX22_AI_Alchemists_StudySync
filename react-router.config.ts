import type { Config } from "@react-router/dev/config";

export default {
  // Config options...
  // Server-side render by default, to enable SPA mode set this to `false`
  // Disable SSR in development to prevent hydration issues with browser-only code
  ssr: process.env.NODE_ENV === 'production',
} satisfies Config;
