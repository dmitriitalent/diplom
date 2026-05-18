export default defineNuxtConfig({
	compatibilityDate: "2025-07-15",
	devtools: { enabled: true },

	runtimeConfig: {
		api: "http://api-gateway:8080",
		public: {
			publicRoutes: [
				"/",
				"/login",
				"/registration",
				"/privacy",
				"/privacy-policy",
				"/agreements/privacy",
				"/agreements/terms",
			],
			api: "http://api-gateway:8080",
		},
	},

	vite: {
		css: {
			preprocessorOptions: {
				scss: {
					additionalData: `
                        @use "~/assets/scss/imports.scss" as *;
                        @use "~/assets/scss/vars.scss" as *;
                        @use "~/assets/scss/mixins.scss" as *;
                    `,
				},
			},
		},
		optimizeDeps: {
			include: [
				"@vuepic/vue-datepicker",
				"date-fns",
				"date-fns/locale",
				"jwt-decode",
				"axios",
			],
		},
	},

	build: {
		transpile: ["@vuepic/vue-datepicker"],
	},

	modules: [
		"@nuxt/icon",
		"@nuxt/eslint",
		"@pinia/nuxt",
		"nuxt-swiper",
		"@vite-pwa/nuxt",
	],

	pwa: {
		registerType: "autoUpdate",

		manifest: {
			name: "Hostelite",
			short_name: "Hostelite",
			description: "Сервис общежития",
			lang: "ru",
			theme_color: "#fffaf0",
			background_color: "#fffaf0",
			display: "standalone",
			orientation: "portrait",
			start_url: "/",
			scope: "/",
			icons: [
				{
					src: "/icons/pwa-192x192.png",
					sizes: "192x192",
					type: "image/png",
				},
				{
					src: "/icons/pwa-512x512.png",
					sizes: "512x512",
					type: "image/png",
				},
				{
					src: "/icons/maskable-icon-512x512.png",
					sizes: "512x512",
					type: "image/png",
					purpose: "maskable",
				},
			],
		},

		workbox: {
			disableDevLogs: true,
			globPatterns: ["**/*.{js,css,png,svg,ico,woff2}"],
			navigateFallbackDenylist: [/\/api\//, /\/_nuxt\//],
			runtimeCaching: [
				{
					urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
					handler: "StaleWhileRevalidate",
					options: {
						cacheName: "google-fonts-stylesheets",
					},
				},
				{
					urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
					handler: "CacheFirst",
					options: {
						cacheName: "google-fonts-webfonts",
						cacheableResponse: { statuses: [0, 200] },
						expiration: {
							maxEntries: 30,
							maxAgeSeconds: 60 * 60 * 24 * 365,
						},
					},
				},
				{
					urlPattern: /\/api\/images\/byGuid/,
					handler: "CacheFirst",
					options: {
						cacheName: "images",
						expiration: {
							maxEntries: 200,
							maxAgeSeconds: 60 * 60 * 24 * 7,
						},
					},
				},
				{
					urlPattern: /\/api\/_nuxt_icon\//,
					handler: "StaleWhileRevalidate",
					options: {
						cacheName: "nuxt-icon",
						expiration: {
							maxEntries: 100,
							maxAgeSeconds: 60 * 60 * 24 * 30,
						},
					},
				},
				{
					urlPattern: /\/_nuxt\/builds\//,
					handler: "NetworkOnly",
				},
				{
					urlPattern: /\/icons\//,
					handler: "CacheFirst",
					options: {
						cacheName: "static-icons",
						expiration: {
							maxEntries: 50,
							maxAgeSeconds: 60 * 60 * 24 * 30,
						},
					},
				},
				{
					urlPattern: /\/api\//,
					handler: "NetworkFirst",
					options: {
						cacheName: "api",
						networkTimeoutSeconds: 5,
					},
				},
			],
		},

		devOptions: {
			enabled: true,
			type: "module",
		},

		client: {
			installPrompt: true,
			periodicSyncForUpdates: 3600,
		},
	},

	app: {
		head: {
			htmlAttrs: {
				lang: "ru",
			},
			link: [
				{ rel: "icon", href: "/icons/favicon.ico", sizes: "any" },
				{
					rel: "apple-touch-icon",
					href: "/icons/apple-touch-icon-180x180.png",
				},
				{ rel: "manifest", href: "/manifest.webmanifest" },
			],
			meta: [
				{ name: "theme-color", content: "#fffaf0" },
				{ name: "mobile-web-app-capable", content: "yes" },
				{ name: "apple-mobile-web-app-capable", content: "yes" },
				{
					name: "apple-mobile-web-app-status-bar-style",
					content: "default",
				},
				{ name: "apple-mobile-web-app-title", content: "Hostelite" },
				// ── Language hints (предотвращают предложение перевода) ─────
				{ "http-equiv": "Content-Language", content: "ru" },
				{ name: "language", content: "Russian" },
				// ── Базовое SEO ─────────────────────────────────────────────
				{
					name: "description",
					content:
						"Hostelite — вся инфраструктура общежития в одном месте: соседи, расписания, услуги, объявления и чаты.",
				},
				{ name: "robots", content: "index, follow" },
				// ── Open Graph ──────────────────────────────────────────────
				{ property: "og:site_name", content: "Hostelite" },
				{ property: "og:locale", content: "ru_RU" },
				{ property: "og:type", content: "website" },
				{ property: "og:title", content: "Hostelite" },
				{
					property: "og:description",
					content:
						"Вся инфраструктура общежития в одном месте: соседи, расписания, услуги, объявления и чаты.",
				},
				{
					property: "og:image",
					content: "/icons/pwa-512x512.png",
				},
				// ── Twitter Card ────────────────────────────────────────────
				{ name: "twitter:card", content: "summary" },
				{ name: "twitter:title", content: "Hostelite" },
				{
					name: "twitter:description",
					content: "Вся инфраструктура общежития в одном месте.",
				},
				{
					name: "twitter:image",
					content: "/icons/pwa-512x512.png",
				},
			],
		},
	},
});
