import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  resolve: {
    dedupe: ["react", "react-dom"],
  },

  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globIgnores: ["**/index.html"],
        navigateFallback: null,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "rtc-pages",
              networkTimeoutSeconds: 3,
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxEntries: 3,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
            },
          },
        ],
      },

      manifest: {
        name: "Release The Creature",
        short_name: "RTC",
        description:
          "Release The Creature – colleziona tutte le varianti",

        theme_color: "#0f172a",
        background_color: "#0f172a",

        display: "standalone",

        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
