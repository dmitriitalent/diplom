// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: "2025-07-15",
	devtools: { enabled: true },

	runtimeConfig: {
		api: "http://localhost:8180", // приватная переменная, доступна только на сервере
		public: {
			api: "http://localhost:8180", // публичная, доступна и на клиенте
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

	modules: ["@nuxt/icon", "@nuxt/eslint", "@nuxt/fonts", "@pinia/nuxt"],
});
