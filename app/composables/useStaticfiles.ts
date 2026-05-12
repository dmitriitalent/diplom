/**
 * Composable для работы со статическими файлами шаблонов (BFF staticfiles API).
 *
 * Endpoints:
 *   GET    /api/staticfiles          — список всех ключей
 *   GET    /api/staticfiles/:key     — получить файл по ключу
 *   PUT    /api/staticfiles/:key     — загрузить/заменить файл (ADMIN)
 *   DELETE /api/staticfiles/:key     — удалить файл (ADMIN)
 */

export interface StaticfileEntry {
	key: string;
	url: string;
}

export function useStaticfiles() {
	const list = ref<StaticfileEntry[]>([]);
	const loading = ref(false);
	const error = ref<string | null>(null);

	/** Получить список всех загруженных файлов */
	const fetchList = async () => {
		loading.value = true;
		error.value = null;
		try {
			list.value = await $fetch<StaticfileEntry[]>("/api/staticfiles");
		} catch (e: any) {
			error.value = e?.data?.message ?? e?.message ?? "Ошибка загрузки списка";
		} finally {
			loading.value = false;
		}
	};

	/** Загрузить или заменить файл по ключу (ADMIN) */
	const upload = async (key: string, file: File): Promise<{ url: string } | null> => {
		loading.value = true;
		error.value = null;
		try {
			const formData = new FormData();
			formData.append("file", file);
			const res = await $fetch<{ key: string; url: string; size: number }>(
				`/api/staticfiles/${key}`,
				{ method: "PUT", body: formData },
			);
			// Обновляем список
			const idx = list.value.findIndex((e) => e.key === key);
			if (idx !== -1) {
				list.value[idx] = { key: res.key, url: res.url };
			} else {
				list.value.push({ key: res.key, url: res.url });
			}
			return { url: res.url };
		} catch (e: any) {
			error.value = e?.data?.message ?? e?.message ?? "Ошибка загрузки файла";
			return null;
		} finally {
			loading.value = false;
		}
	};

	/** Удалить файл по ключу (ADMIN) */
	const remove = async (key: string): Promise<boolean> => {
		loading.value = true;
		error.value = null;
		try {
			await $fetch(`/api/staticfiles/${key}`, { method: "DELETE" });
			list.value = list.value.filter((e) => e.key !== key);
			return true;
		} catch (e: any) {
			error.value = e?.data?.message ?? e?.message ?? "Ошибка удаления файла";
			return false;
		} finally {
			loading.value = false;
		}
	};

	return { list, loading, error, fetchList, upload, remove };
}
