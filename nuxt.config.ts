// https://nuxt.com/docs/api/configuration/nuxt-config
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
	},

	build: {
		transpile: ["@vuepic/vue-datepicker"],
	},

	modules: ["@nuxt/icon", "@nuxt/eslint", "@pinia/nuxt", "nuxt-swiper"],
});
