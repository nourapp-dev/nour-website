import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const isDevelopment = process.env.NODE_ENV === "development";

let supabaseOrigin = "";
let supabaseWsOrigin = "";

try {
  if (supabaseUrl) {
    const parsedSupabaseUrl = new URL(supabaseUrl);

    supabaseOrigin = parsedSupabaseUrl.origin;
    supabaseWsOrigin = parsedSupabaseUrl.origin.replace(
      /^https:/,
      "wss:"
    );
  }
} catch {
  supabaseOrigin = "";
  supabaseWsOrigin = "";
}

const contentSecurityPolicy = `
  default-src 'self';

  base-uri 'self';

  form-action 'self';

  frame-ancestors 'none';

  object-src 'none';

  script-src
    'self'
    'unsafe-inline'
    https://eauthenticate.saudibusiness.gov.sa
    ${isDevelopment ? "'unsafe-eval'" : ""};

  style-src
    'self'
    'unsafe-inline';

  img-src
    'self'
    data:
    blob:
    ${supabaseOrigin}
    https://tile.openstreetmap.org
    https://nourappglobal.com
    https://www.nourappglobal.com;

  font-src
    'self'
    data:;

  connect-src
    'self'
    ${supabaseOrigin}
    ${supabaseWsOrigin};

  media-src
    'self'
    blob:
    ${supabaseOrigin};

  frame-src
    https://eauthenticate.saudibusiness.gov.sa;

  worker-src
    'self'
    blob:;

  manifest-src
    'self';

  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "off",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
