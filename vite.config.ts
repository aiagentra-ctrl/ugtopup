import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "icon-192x192.png", "icon-512x512.png", "apple-touch-icon.png"],
      manifest: {
        name: "UGTOPUPS - Game Top-Up",
        short_name: "UGTOPUPS",
        description: "Fast, secure top-up for online games & digital gift cards",
        theme_color: "#1e293b",
        background_color: "#0f172a",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png",
            purpose: "apple touch icon",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        importScripts: ["/sw-push.js"],
        navigateFallbackDenylist: [/^\/~oauth/],
        runtimeCaching: [
          // Supabase REST API — products, categories, offers, banners (NetworkFirst with fallback)
          {
            urlPattern: /^https:\/\/iwcqutzgtpbdowghalnl\.supabase\.co\/rest\/v1\/(dynamic_products|product_categories|offers|banner_slides|game_product_prices|reward_milestones|referral_settings)/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "supabase-products-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 24 * 60 * 60, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Supabase REST API — user-specific data (orders, profile, coupons)
          {
            urlPattern: /^https:\/\/iwcqutzgtpbdowghalnl\.supabase\.co\/rest\/v1\/(product_orders|profiles|coupons|payment_requests|user_notifications|referrals)/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-user-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              networkTimeoutSeconds: 5,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Supabase Storage — product images, banners, screenshots
          {
            urlPattern: /^https:\/\/iwcqutzgtpbdowghalnl\.supabase\.co\/storage\/v1\/object\/public\//i,
            handler: "CacheFirst",
            options: {
              cacheName: "supabase-images-cache",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Supabase RPC and other API calls
          {
            urlPattern: /^https:\/\/iwcqutzgtpbdowghalnl\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60,
              },
              networkTimeoutSeconds: 8,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // External images (Google avatars etc.)
          {
            urlPattern: /^https:\/\/(lh3\.googleusercontent\.com|avatars\.githubusercontent\.com)\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "external-images-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
