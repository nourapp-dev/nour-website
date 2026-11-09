import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const isDevelopment = process.env.NODE_ENV === "development";
const isUiPreview = process.env.NEXT_PUBLIC_UI_PREVIEW === "true";
if (isUiPreview && !isDevelopment) throw new Error("UI fixtures may only run in local development.");

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

  frame-ancestors ${isUiPreview ? "'self'" : "'none'"};

  object-src 'none';

  script-src
    'self'
    'unsafe-inline'
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
    https://www.youtube-nocookie.com
    https://player.vimeo.com
    ${isUiPreview ? "'self'" : "https://eauthenticate.saudibusiness.gov.sa"};

  worker-src
    'self'
    blob:;

  manifest-src
    'self';

  ${isDevelopment ? "" : "upgrade-insecure-requests;"}
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
    value: isUiPreview ? "SAMEORIGIN" : "DENY",
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
  distDir: isUiPreview ? ".next-ui-preview" : ".next",
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {source:"/admin/website/:path*",headers:[{key:"Content-Security-Policy",value:contentSecurityPolicy.replace(/frame-ancestors [^;]+;/,"frame-ancestors 'self';").replace(/frame-src [^;]+;/,"frame-src 'self';")},{key:"X-Frame-Options",value:"SAMEORIGIN"},{key:"Surrogate-Control",value:"no-store"}]},
    ];
  },
};

export default nextConfig;
