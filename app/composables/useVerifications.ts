export interface Verification {
	id: string;
	userId: string;
	documentId: string;
	status: "PENDING" | "APPROVED" | "REJECTED" | string;
	comment?: string;
	reviewedBy?: string;
	createdAt: string;
	updatedAt: string;
}

export function useVerifications() {
	const myVerification = ref<Verification | null>(null);
	const pending = ref<Verification[]>([]);
	const loading = ref(false);
	const error = ref<string | null>(null);

	const fetchMine = async () => {
		loading.value = true;
		error.value = null;
		try {
			myVerification.value = await $fetch<Verification | null>("/api/verifications/me");
		} catch (e: any) {
			error.value = e?.data?.message ?? e?.message ?? "Ошибка загрузки";
		} finally {
			loading.value = false;
		}
	};

	const fetchPending = async () => {
		loading.value = true;
		error.value = null;
		try {
			const res = await $fetch<{ items: Verification[] }>("/api/verifications/pending");
			pending.value = res.items ?? [];
		} catch (e: any) {
			error.value = e?.data?.message ?? e?.message ?? "Ошибка загрузки";
		} finally {
			loading.value = false;
		}
	};

	const submit = async (documentId: string): Promise<Verification | null> => {
		loading.value = true;
		error.value = null;
		try {
			const v = await $fetch<Verification>("/api/verifications", {
				method: "POST",
				body: { documentId },
			});
			myVerification.value = v;
			return v;
		} catch (e: any) {
			error.value = e?.data?.message ?? e?.message ?? "Не удалось отправить заявку";
			return null;
		} finally {
			loading.value = false;
		}
	};

	const review = async (id: string, approve: boolean, comment?: string): Promise<boolean> => {
		loading.value = true;
		error.value = null;
		try {
			await $fetch(`/api/verifications/${id}/review`, {
				method: "POST",
				body: { approve, comment },
			});
			pending.value = pending.value.filter((v) => v.id !== id);
			return true;
		} catch (e: any) {
			error.value = e?.data?.message ?? e?.message ?? "Не удалось применить решение";
			return false;
		} finally {
			loading.value = false;
		}
	};

	return { myVerification, pending, loading, error, fetchMine, fetchPending, submit, review };
}
