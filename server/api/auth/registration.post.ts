import axios from "axios";

const FILENAME = "registration.post.ts";

export default defineEventHandler(async (event) => {
	try {
		// const res = await axios.get(
		// 	"https://jsonplaceholder.typicode.com/todos/1"
		// );
		// return res.data;

		setCookie(
			event,
			"at",
			"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidXNlcklkIjoxLCJyb2xlIjoic3R1ZGVudCIsImlhdCI6MTc2Nzc1ODU0MywiZXhwIjoxNzY3NzYyMTQzfQ.gy88ar5lRt0Io7qa22ll0Ajxknt-xb18NB2UC_mm7os"
		);
		return "registration success";
	} catch (err) {
		// console.log("error at " + FILENAME + ": " + String(err));
		// console.log(err);
		// throw createError({
		// 	statusCode: 500,
		// });
	}
});
