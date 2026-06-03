/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  // The maintainer form's server action talks to Azure Table Storage via
  // @azure/data-tables + @azure/identity (DefaultAzureCredential / managed
  // identity). These SDKs use dynamic requires that Next 16 + Turbopack's
  // standalone file tracer does NOT reliably follow through pnpm's symlinked
  // store, so they (and their @azure/core-*, msal-* transitive deps) were
  // omitted from .next/standalone. At runtime the server action then threw
  // ERR_MODULE_NOT_FOUND *before* its try/catch (HTTP 200 with an RSC error
  // digest, no console.error, no status banner, nothing written to the table).
  //
  // serverExternalPackages declares them external CommonJS (do not bundle into
  // the RSC/server output; require() them natively at runtime). The matching
  // files are placed in the standalone node_modules by the Dockerfile, which
  // installs this exact closure flat (see Dockerfile "azure-deps" stage) — a
  // tracer-independent guarantee that the write path exists in the container.
  serverExternalPackages: ['@azure/identity', '@azure/data-tables'],
  images: {
    unoptimized: true,
  },
  async headers() {
    // Security headers apply in production only — CSP blocks Turbopack eval() in dev
    if (process.env.NODE_ENV !== 'production') return [];

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self';",
          },
        ],
      },
    ];
  },
}

export default nextConfig