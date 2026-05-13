export default defineNuxtConfig({
	compatibilityDate: "2025-07-15",
	devtools: { enabled: true },

	runtimeConfig: {
		api: "http://api-gateway:8080",
		public: {
			publicRoutes: ["/", "/welcome", "/login", "/registration"],
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
			name: "Dormitory",
			short_name: "Dorm",
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
			navigateFallback: "/",
			globPatterns: ["**/*.{js,css,html,png,svg,ico,woff2}"],
			runtimeCaching: [
				{
					urlPattern: /^\/api\/images\/byGuid/,
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
					urlPattern: /^\/api\//,
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
			link: [
				{ rel: "icon", href: "/favicon.ico", sizes: "any" },
				{
					rel: "apple-touch-icon",
					href: "/icons/apple-touch-icon-180x180.png",
				},
			],
			meta: [
				{ name: "theme-color", content: "#fffaf0" },
				{ name: "apple-mobile-web-app-capable", content: "yes" },
				{
					name: "apple-mobile-web-app-status-bar-style",
					content: "default",
				},
				{ name: "apple-mobile-web-app-title", content: "Dormitory" },
			],
		},
	},
});
