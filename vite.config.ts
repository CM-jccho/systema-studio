import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' https://api.openai.com https://api.anthropic.com",
  "base-uri 'none'",
  "form-action 'none'",
  "object-src 'none'",
].join("; ");

const cspPlugin = {
  name: "systema-csp",
  apply: "build" as const,
  transformIndexHtml(html: string) {
    return html.replace(
      "</head>",
      `    <meta http-equiv="Content-Security-Policy" content="${csp}" />\n  </head>`,
    );
  },
};

export default defineConfig({
  base: "./",
  plugins: [react(), cspPlugin],
  build: {
    outDir: "dist",
    assetsInlineLimit: 2048,
  },
});
