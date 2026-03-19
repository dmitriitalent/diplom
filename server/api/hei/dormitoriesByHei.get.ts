const FILENAME = "hei/dormitoriesByHei.get.ts";

export default defineEventHandler(async (event) => {
	try {
		return [
			{
				name: "Икар (г. Москва, ул. Дубосековская, д. 13)",
				value: "Икар (г. Москва, ул. Дубосековская, д. 13)",
				leftIconName: "material-symbols:home-work-outline-rounded",

				buildings: [
					{
						name: "1",
						value: "1",
						leftIconName:
							"material-symbols:home-work-outline-rounded",

						floors: [
							{
								name: "1",
								value: "1",
								leftIconName:
									"material-symbols:home-work-outline-rounded",
							},
							{
								name: "2",
								value: "2",
								leftIconName:
									"material-symbols:home-work-outline-rounded",
							},
							{
								name: "3",
								value: "3",
								leftIconName:
									"material-symbols:home-work-outline-rounded",
							},
							{
								name: "4",
								value: "4",
								leftIconName:
									"material-symbols:home-work-outline-rounded",
							},
							{
								name: "5",
								value: "5",
								leftIconName:
									"material-symbols:home-work-outline-rounded",
							},
						],
					},
					{
						name: "2",
						value: "2",
						leftIconName:
							"material-symbols:home-work-outline-rounded",

						floors: [
							{
								name: "1",
								value: "1",
								leftIconName:
									"material-symbols:home-work-outline-rounded",
							},
							{
								name: "2",
								value: "2",
								leftIconName:
									"material-symbols:home-work-outline-rounded",
							},
							{
								name: "3",
								value: "3",
								leftIconName:
									"material-symbols:home-work-outline-rounded",
							},
							{
								name: "4",
								value: "4",
								leftIconName:
									"material-symbols:home-work-outline-rounded",
							},
							{
								name: "5",
								value: "5",
								leftIconName:
									"material-symbols:home-work-outline-rounded",
							},
						],
					},
				],
			},
			{
				name: "1Икар (г. Москва, ул. Дубосековская, д. 13)",
				value: "1Икар (г. Москва, ул. Дубосековская, д. 13)",
				leftIconName: "material-symbols:home-work-outline-rounded",

				buildings: [
					{
						name: "1",
						value: "1",
						leftIconName:
							"material-symbols:home-work-outline-rounded",

						floors: [
							{
								name: "1",
								value: "1",
								leftIconName:
									"material-symbols:home-work-outline-rounded",
							},
						],
					},
				],
			},
		];
	} catch (err) {
		console.log("error at " + FILENAME + ": " + String(err));
		console.log(err);
		throw createError({
			statusCode: 500,
		});
	}
});
