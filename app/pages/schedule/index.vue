<script setup lang="ts">
import { jwtDecode } from "jwt-decode";
import { useAuthStore } from "~/stores/authStore";
import type { TimelineSession } from "~/components/ui/types/TimelineSession";
import type { ShowerDtoById } from "~~/server/dto/shower/byId";
import type { ShowerDtoList } from "~~/server/dto/shower/list";
import type {
	WashingMachineBooking,
	WashingMachineDto,
} from "~~/server/dto/washingmachine/index";

const { at } = useAuthStore();
const decoded = jwtDecode(at as string) as any;
const isAdmin = decoded.roles.includes("ADMIN");
const currentUserId = decoded.sub as string;

// ─── Types ────────────────────────────────────────────────────────────────────

type ShowerSlot = {
	from: number; // seconds since midnight
	till: number; // seconds since midnight
	gender: string;
};

type ParsedShower = {
	id: string;
	name: string;
	location: string;
	days: ShowerSlot[][];
};

// ─── Color map ────────────────────────────────────────────────────────────────

const SLOT_COLORS: Record<string, string> = {
	male: "#90c4e8",
	female: "#e890c4",
	any: "#c890e8",
	cleaning: "#e8e090",
	repair: "#e8b070",
	shutoff: "#e87070",
};
const DEFAULT_SLOT_COLOR = "#e8a090";

const SLOT_LABELS: Record<string, string> = {
	male: "Мужской",
	female: "Женский",
	any: "Общий",
	cleaning: "Уборка",
	repair: "Ремонт",
	shutoff: "Отключение воды",
};

const slotColor = (gender: string) => SLOT_COLORS[gender] ?? DEFAULT_SLOT_COLOR;
const slotLabel = (gender: string) => SLOT_LABELS[gender] ?? gender;

// ─── Day selector ─────────────────────────────────────────────────────────────

const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const jsDayToIdx = (d: number) => (d === 0 ? 6 : d - 1);
const selectedDay = ref(jsDayToIdx(new Date().getDay()));

// ─── Data: showers ────────────────────────────────────────────────────────────

const { data: rawShowers } = await useAsyncData<ShowerDtoById[]>(
	"showers-list",
	async () => {
		const headers = process.server
			? useRequestHeaders(["cookie"])
			: undefined;
		return await $fetch<ShowerDtoList>("/api/shower/list", { headers });
	},
);

const showers = computed<ParsedShower[]>(() =>
	(rawShowers.value ?? []).map((s) => ({
		id: s.id,
		name: "",
		location: s.location,
		days: Array.isArray(s.schedule)
			? (s.schedule as ShowerSlot[][])
			: [[], [], [], [], [], [], []],
	})),
);

// ─── Data: washing machines ───────────────────────────────────────────────────

const { data: rawMachines } = await useAsyncData<WashingMachineDto[]>(
	"wm-list",
	async () => {
		const headers = process.server
			? useRequestHeaders(["cookie"])
			: undefined;
		return await $fetch<WashingMachineDto[]>("/api/washingmachine/list", {
			headers,
		});
	},
);

const machines = computed<WashingMachineDto[]>(() => rawMachines.value ?? []);

// ─── Timeline computation ─────────────────────────────────────────────────────

const getDayMidnightUtc = (dayIdx: number): number => {
	const now = new Date();
	const todayIdx = jsDayToIdx(now.getUTCDay());
	const diff = dayIdx - todayIdx;
	return (
		Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) /
			1000 +
		diff * 86400
	);
};

const timelineStart = computed(() => getDayMidnightUtc(selectedDay.value));
const timelineEnd = computed(() => getDayMidnightUtc(selectedDay.value) + 86400);

const showerSessions = (
	shower: ParsedShower,
	showerId: string,
): TimelineSession<ShowerSlot>[] => {
	const state = getState(showerId);
	const buffer = (state.end - state.start) * 0.35;
	const firstDay = Math.floor((state.start - buffer) / 86400) * 86400;
	const lastDay = Math.floor((state.end + buffer) / 86400) * 86400;

	const result: TimelineSession<ShowerSlot>[] = [];
	for (let dayStart = firstDay; dayStart <= lastDay; dayStart += 86400) {
		const jsDay = new Date(dayStart * 1000).getUTCDay();
		const dayIdx = jsDay === 0 ? 6 : jsDay - 1;
		for (const slot of shower.days[dayIdx] ?? []) {
			result.push({
				startAt: dayStart + slot.from,
				endAt: dayStart + slot.till,
				color: slotColor(slot.gender),
				content: slot,
			});
		}
	}
	return result;
};

const WM_MY_COLOR = "#70c8a0";
const WM_OTHER_COLOR = "#b0a0d8";

const wmSessions = (
	machine: WashingMachineDto,
	machineId: string,
): TimelineSession<WashingMachineBooking>[] => {
	const state = getState(machineId);
	const buffer = (state.end - state.start) * 0.35;
	const result: TimelineSession<WashingMachineBooking>[] = [];

	for (const booking of machine.bookings) {
		const [y, m, d] = booking.bookingDate.split("-").map(Number);
		const dayMidnight = Date.UTC(y, m - 1, d) / 1000;
		const startAt = dayMidnight + booking.fromMinutes * 60;
		const endAt = dayMidnight + booking.tillMinutes * 60;
		if (endAt < state.start - buffer || startAt > state.end + buffer)
			continue;
		result.push({
			startAt,
			endAt,
			color: booking.userId === currentUserId ? WM_MY_COLOR : WM_OTHER_COLOR,
			content: booking,
		});
	}
	return result;
};

// ─── Timeline nav/zoom ────────────────────────────────────────────────────────

type TimelineState = { start: number; end: number };
const timelineStates = ref<Record<string, TimelineState>>({});

const getState = (id: string): TimelineState => {
	if (!timelineStates.value[id]) {
		timelineStates.value[id] = {
			start: timelineStart.value,
			end: timelineEnd.value,
		};
	}
	return timelineStates.value[id];
};

const MIN_PERIOD = 4 * 3600;
const MAX_PERIOD = 3 * 86400;

const clamp = (s: TimelineState) => {
	const p = s.end - s.start;
	if (p < MIN_PERIOD) {
		const c = (s.start + s.end) / 2;
		s.start = c - MIN_PERIOD / 2;
		s.end = c + MIN_PERIOD / 2;
	} else if (p > MAX_PERIOD) {
		const c = (s.start + s.end) / 2;
		s.start = c - MAX_PERIOD / 2;
		s.end = c + MAX_PERIOD / 2;
	}
};

const onMinus = (id: string) => {
	const s = getState(id);
	const center = (s.start + s.end) / 2;
	const half = (s.end - s.start) / 2;
	s.start = center - half * 1.5;
	s.end = center + half * 1.5;
	clamp(s);
};
const onPlus = (id: string) => {
	const s = getState(id);
	const center = (s.start + s.end) / 2;
	const half = (s.end - s.start) / 2;
	s.start = center - half * 0.67;
	s.end = center + half * 0.67;
	clamp(s);
};
const onPrev = (id: string) => {
	const s = getState(id);
	const shift = (s.end - s.start) * 0.3;
	s.start -= shift;
	s.end -= shift;
};
const onNext = (id: string) => {
	const s = getState(id);
	const shift = (s.end - s.start) * 0.3;
	s.start += shift;
	s.end += shift;
};

watch(selectedDay, () => {
	for (const id in timelineStates.value) {
		timelineStates.value[id] = {
			start: timelineStart.value,
			end: timelineEnd.value,
		};
	}
});

// ─── Shower tooltip ───────────────────────────────────────────────────────────

type TooltipState = {
	visible: boolean;
	label: string;
	time: string;
	x: number;
	y: number;
};
const tooltip = ref<TooltipState>({
	visible: false,
	label: "",
	time: "",
	x: 0,
	y: 0,
});

const formatTime = (seconds: number) => {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const formatMinutes = (minutes: number) => {
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const onSessionEnter = (
	event: MouseEvent,
	session: TimelineSession<ShowerSlot>,
) => {
	const slot = session.content;
	tooltip.value = {
		visible: true,
		label: slotLabel(slot.gender),
		time: `${formatTime(slot.from)} – ${formatTime(slot.till)}`,
		x: event.clientX,
		y: event.clientY,
	};
};
const onSessionLeave = () => {
	tooltip.value.visible = false;
};

// ─── WM interactive tooltip ───────────────────────────────────────────────────

type WmTooltipState = {
	visible: boolean;
	booking: WashingMachineBooking | null;
	machineId: string;
	x: number;
	y: number;
};
const wmTooltip = ref<WmTooltipState>({
	visible: false,
	booking: null,
	machineId: "",
	x: 0,
	y: 0,
});
let wmTooltipTimer: ReturnType<typeof setTimeout> | null = null;

const onWmSessionEnter = (
	e: MouseEvent,
	s: TimelineSession<WashingMachineBooking>,
	machineId: string,
) => {
	if (wmTooltipTimer) clearTimeout(wmTooltipTimer);
	wmTooltip.value = {
		visible: true,
		booking: s.content,
		machineId,
		x: e.clientX,
		y: e.clientY,
	};
};
const onWmSessionLeave = () => {
	wmTooltipTimer = setTimeout(() => {
		wmTooltip.value.visible = false;
	}, 150);
};
const onWmTooltipEnter = () => {
	if (wmTooltipTimer) clearTimeout(wmTooltipTimer);
};
const onWmTooltipLeave = () => {
	wmTooltipTimer = setTimeout(() => {
		wmTooltip.value.visible = false;
	}, 150);
};

const canDeleteBooking = computed(
	() =>
		wmTooltip.value.booking &&
		(wmTooltip.value.booking.userId === currentUserId || isAdmin),
);

const deletingBooking = ref(false);
const deleteBooking = async () => {
	if (!wmTooltip.value.booking) return;
	deletingBooking.value = true;
	try {
		const { machineId, booking } = wmTooltip.value;
		await $fetch(
			`/api/washingmachine/booking/delete?id=${machineId}&from=${booking!.fromMinutes}&till=${booking!.tillMinutes}`,
			{ method: "DELETE" },
		);
		await refreshNuxtData("wm-list");
		wmTooltip.value.visible = false;
	} finally {
		deletingBooking.value = false;
	}
};

// ─── WM booking modal ─────────────────────────────────────────────────────────

const bookModalOpen = ref(false);
const bookMachineId = ref("");
const bookForm = ref({ fromH: "8", fromM: "0", tillH: "9", tillM: "0" });
const bookSaving = ref(false);

const openBookModal = (machineId: string) => {
	bookMachineId.value = machineId;
	bookForm.value = { fromH: "8", fromM: "0", tillH: "9", tillM: "0" };
	bookModalOpen.value = true;
};

const createBooking = async () => {
	bookSaving.value = true;
	try {
		const fromMinutes =
			Number(bookForm.value.fromH) * 60 + Number(bookForm.value.fromM);
		const tillMinutes =
			Number(bookForm.value.tillH) * 60 + Number(bookForm.value.tillM);
		if (tillMinutes <= fromMinutes) return;
		await $fetch(
			`/api/washingmachine/booking/create?machineId=${bookMachineId.value}`,
			{ method: "POST", body: { fromMinutes, tillMinutes } },
		);
		await refreshNuxtData("wm-list");
		bookModalOpen.value = false;
	} finally {
		bookSaving.value = false;
	}
};

// ─── WM admin modals ──────────────────────────────────────────────────────────

const wmCreateOpen = ref(false);
const wmCreateLocation = ref("");
const wmCreateSaving = ref(false);

const createMachine = async () => {
	wmCreateSaving.value = true;
	try {
		await $fetch("/api/washingmachine/create", {
			method: "POST",
			body: { location: wmCreateLocation.value },
		});
		await refreshNuxtData("wm-list");
		wmCreateOpen.value = false;
		wmCreateLocation.value = "";
	} finally {
		wmCreateSaving.value = false;
	}
};

const wmEditOpen = ref(false);
const wmEditMachine = ref<{ id: string; location: string } | null>(null);
const wmEditSaving = ref(false);

const openWmEdit = (m: WashingMachineDto) => {
	wmEditMachine.value = { id: m.id, location: m.location };
	wmEditOpen.value = true;
};

const saveWmEdit = async () => {
	if (!wmEditMachine.value) return;
	wmEditSaving.value = true;
	try {
		await $fetch("/api/washingmachine/edit", {
			method: "PUT",
			body: {
				id: wmEditMachine.value.id,
				location: wmEditMachine.value.location,
			},
		});
		await refreshNuxtData("wm-list");
		wmEditOpen.value = false;
	} finally {
		wmEditSaving.value = false;
	}
};

const deleteMachine = async (id: string) => {
	await $fetch(`/api/washingmachine/delete?id=${id}`, { method: "DELETE" });
	await refreshNuxtData("wm-list");
};

// ─── Shower edit modal ────────────────────────────────────────────────────────

const editModalOpen = ref(false);
const editShower = ref<ParsedShower | null>(null);
const editDayIdx = ref(0);
const editSaving = ref(false);

const GENDER_OPTIONS = [
	{ value: "male", label: "Мужской" },
	{ value: "female", label: "Женский" },
	{ value: "any", label: "Общий" },
	{ value: "cleaning", label: "Уборка" },
	{ value: "repair", label: "Ремонт" },
	{ value: "shutoff", label: "Отключение воды" },
];

const newSlot = ref({
	fromH: "0",
	fromM: "0",
	tillH: "0",
	tillM: "0",
	gender: "male",
	recurring: false,
});

const openEdit = (shower: ParsedShower) => {
	editShower.value = {
		...shower,
		days: shower.days.map((d) => d.map((s) => ({ ...s }))),
	};
	while (editShower.value.days.length < 7) editShower.value.days.push([]);
	editDayIdx.value = selectedDay.value;
	editModalOpen.value = true;
	newSlot.value = {
		fromH: "0",
		fromM: "0",
		tillH: "0",
		tillM: "0",
		gender: "male",
		recurring: false,
	};
};

const closeEdit = () => {
	editModalOpen.value = false;
	editShower.value = null;
};

const addSlot = () => {
	if (!editShower.value) return;
	const from =
		Number(newSlot.value.fromH) * 3600 + Number(newSlot.value.fromM) * 60;
	const till =
		Number(newSlot.value.tillH) * 3600 + Number(newSlot.value.tillM) * 60;
	if (till <= from) return;
	const slot: ShowerSlot = { from, till, gender: newSlot.value.gender };
	if (newSlot.value.recurring) {
		for (let i = 0; i < 7; i++) editShower.value.days[i].push({ ...slot });
	} else {
		editShower.value.days[editDayIdx.value].push({ ...slot });
	}
	newSlot.value = {
		fromH: "0",
		fromM: "0",
		tillH: "0",
		tillM: "0",
		gender: "male",
		recurring: false,
	};
};

const removeSlot = (dayIdx: number, slotIdx: number) => {
	editShower.value?.days[dayIdx].splice(slotIdx, 1);
};

const saveEdit = async () => {
	if (!editShower.value) return;
	editSaving.value = true;
	try {
		await $fetch(`/api/shower/edit?id=${editShower.value.id}`, {
			method: "PUT",
			body: {
				location: editShower.value.location,
				schedule: editShower.value.days,
			},
		});
		await refreshNuxtData("showers-list");
		closeEdit();
	} finally {
		editSaving.value = false;
	}
};

// ─── Shower create modal ──────────────────────────────────────────────────────

const createModalOpen = ref(false);
const createForm = ref({ name: "", location: "" });
const createSaving = ref(false);

const createShower = async () => {
	createSaving.value = true;
	try {
		await $fetch("/api/shower/create", {
			method: "POST",
			body: {
				location: createForm.value.location,
				schedule: [[], [], [], [], [], [], []],
			},
		});
		await refreshNuxtData("showers-list");
		createModalOpen.value = false;
		createForm.value = { name: "", location: "" };
	} finally {
		createSaving.value = false;
	}
};

const deleteShower = async (id: string) => {
	await $fetch(`/api/shower/delete?id=${id}`, { method: "DELETE" });
	await refreshNuxtData("showers-list");
};
</script>

<template>
	<div :class="$style.wrapper">
		<div :class="$style.container">
			<!-- ── Day selector (shared) ──────────────────────────────────── -->

			<div :class="$style.daySelector">
				<UiButton
					v-for="(name, idx) in DAY_NAMES"
					:key="idx"
					:class="[$style.dayBtn, selectedDay === idx && $style.dayBtnActive]"
					inset
					@click="selectedDay = idx"
				>
					{{ name }}
				</UiButton>
			</div>

			<!-- ── Showers ────────────────────────────────────────────────── -->

			<div :class="$style.sectionHeader">
				<h1 :class="$style.sectionTitle">Душевые</h1>
				<UiButton v-if="isAdmin" accent @click="createModalOpen = true">
					Добавить
				</UiButton>
			</div>

			<div :class="$style.legend">
				<div
					v-for="(color, key) in SLOT_COLORS"
					:key="key"
					:class="$style.legendItem"
				>
					<span
						:class="$style.legendDot"
						:style="{ backgroundColor: color }"
					/>
					<span :class="$style.legendLabel">{{ SLOT_LABELS[key] }}</span>
				</div>
				<div :class="$style.legendItem">
					<span
						:class="$style.legendDot"
						style="background-color: #c8f0c8; border: 1px solid #a0d8a0"
					/>
					<span :class="$style.legendLabel">Свободно</span>
				</div>
			</div>

			<div v-if="showers.length === 0" :class="$style.empty">
				Душевые не найдены
			</div>

			<div
				v-for="shower in showers"
				:key="shower.id"
				:class="$style.machineRow"
			>
				<div :class="$style.machineHeader">
					<span :class="$style.machineLocation">{{ shower.location }}</span>
					<div :class="$style.machineActions">
						<UiButton v-if="isAdmin" inset @click="openEdit(shower)"
							>Редактировать</UiButton
						>
						<UiButton
							v-if="isAdmin"
							:class="$style.deleteBtn"
							@click="deleteShower(shower.id)"
							>Удалить</UiButton
						>
					</div>
				</div>

				<ClientOnly>
					<UiTimeline
						:class="$style.timeline"
						:start-unix="getState(shower.id).start || timelineStart"
						:end-unix="getState(shower.id).end || timelineEnd"
						:sessions="showerSessions(shower, shower.id)"
						@minus-click="onMinus(shower.id)"
						@plus-click="onPlus(shower.id)"
						@prev-click="onPrev(shower.id)"
						@next-click="onNext(shower.id)"
						@session-mouse-enter="(e: any, s: any) => onSessionEnter(e, s)"
						@session-mouse-leave="onSessionLeave"
					/>
				</ClientOnly>
			</div>

			<!-- ── Washing machines ───────────────────────────────────────── -->

			<div :class="$style.sectionHeader">
				<h1 :class="$style.sectionTitle">Стиральные машины</h1>
				<UiButton v-if="isAdmin" accent @click="wmCreateOpen = true">
					Добавить
				</UiButton>
			</div>

			<div :class="$style.legend">
				<div :class="$style.legendItem">
					<span
						:class="$style.legendDot"
						:style="{ backgroundColor: WM_MY_COLOR }"
					/>
					<span :class="$style.legendLabel">Моя запись</span>
				</div>
				<div :class="$style.legendItem">
					<span
						:class="$style.legendDot"
						:style="{ backgroundColor: WM_OTHER_COLOR }"
					/>
					<span :class="$style.legendLabel">Занято</span>
				</div>
				<div :class="$style.legendItem">
					<span
						:class="$style.legendDot"
						style="background-color: #c8f0c8; border: 1px solid #a0d8a0"
					/>
					<span :class="$style.legendLabel">Свободно</span>
				</div>
			</div>

			<div v-if="machines.length === 0" :class="$style.empty">
				Стиральные машины не найдены
			</div>

			<div
				v-for="machine in machines"
				:key="machine.id"
				:class="$style.machineRow"
			>
				<div :class="$style.machineHeader">
					<span :class="$style.machineLocation">{{ machine.location }}</span>
					<div :class="$style.machineActions">
						<UiButton inset @click="openBookModal(machine.id)"
							>Записаться</UiButton
						>
						<UiButton
							v-if="isAdmin"
							inset
							@click="openWmEdit(machine)"
							>Редактировать</UiButton
						>
						<UiButton
							v-if="isAdmin"
							:class="$style.deleteBtn"
							@click="deleteMachine(machine.id)"
							>Удалить</UiButton
						>
					</div>
				</div>

				<ClientOnly>
					<UiTimeline
						:class="$style.timeline"
						:start-unix="getState(machine.id).start || timelineStart"
						:end-unix="getState(machine.id).end || timelineEnd"
						:sessions="wmSessions(machine, machine.id)"
						@minus-click="onMinus(machine.id)"
						@plus-click="onPlus(machine.id)"
						@prev-click="onPrev(machine.id)"
						@next-click="onNext(machine.id)"
						@session-mouse-enter="
							(e: any, s: any) => onWmSessionEnter(e, s, machine.id)
						"
						@session-mouse-leave="onWmSessionLeave"
					/>
				</ClientOnly>
			</div>
		</div>

		<!-- ── Shower tooltip ─────────────────────────────────────────────── -->
		<Teleport to="body">
			<div
				v-if="tooltip.visible"
				:class="$style.tooltip"
				:style="{ left: tooltip.x + 12 + 'px', top: tooltip.y - 8 + 'px' }"
			>
				<strong>{{ tooltip.label }}</strong>
				<span>{{ tooltip.time }}</span>
			</div>
		</Teleport>

		<!-- ── WM interactive tooltip ─────────────────────────────────────── -->
		<Teleport to="body">
			<div
				v-if="wmTooltip.visible && wmTooltip.booking"
				:class="$style.wmTooltip"
				:style="{
					left: wmTooltip.x + 12 + 'px',
					top: wmTooltip.y - 8 + 'px',
				}"
				@mouseenter="onWmTooltipEnter"
				@mouseleave="onWmTooltipLeave"
			>
				<span :class="$style.wmTooltipTime">
					{{
						formatMinutes(wmTooltip.booking.fromMinutes)
					}}
					–
					{{ formatMinutes(wmTooltip.booking.tillMinutes) }}
				</span>
				<NuxtLink
					:to="`/profile/${wmTooltip.booking.userId}`"
					:class="$style.wmTooltipUser"
				>
					Профиль пользователя
				</NuxtLink>
				<UiButton
					v-if="canDeleteBooking"
					:class="$style.wmTooltipDelete"
					:disabled="deletingBooking"
					@click="deleteBooking"
				>
					{{ deletingBooking ? "Удаление..." : "Удалить запись" }}
				</UiButton>
			</div>
		</Teleport>

		<!-- ── Shower edit modal ──────────────────────────────────────────── -->
		<Teleport to="body">
			<div
				v-if="editModalOpen"
				:class="$style.overlay"
				@click.self="closeEdit"
			>
				<div :class="$style.modal">
					<h2 :class="$style.modalTitle">Редактировать душевую</h2>

					<div :class="$style.modalFields">
						<div :class="$style.field">
							<label :class="$style.label">Местоположение</label>
							<UiInput
								v-model="editShower!.location"
								:class="$style.input"
							/>
						</div>
					</div>

					<div :class="$style.dayTabs">
						<UiButton
							v-for="(name, idx) in DAY_NAMES"
							:key="idx"
							:class="[
								$style.dayTabBtn,
								editDayIdx === idx && $style.dayTabBtnActive,
							]"
							inset
							@click="editDayIdx = idx"
						>
							{{ name }}
						</UiButton>
					</div>

					<div :class="$style.slotsList">
						<div
							v-if="editShower!.days[editDayIdx].length === 0"
							:class="$style.noSlots"
						>
							Нет записей на этот день
						</div>
						<div
							v-for="(slot, si) in editShower!.days[editDayIdx]"
							:key="si"
							:class="$style.slotItem"
						>
							<span
								:class="$style.slotDot"
								:style="{ backgroundColor: slotColor(slot.gender) }"
							/>
							<span :class="$style.slotLabel">{{
								slotLabel(slot.gender)
							}}</span>
							<span :class="$style.slotTime">
								{{ formatTime(slot.from) }} – {{ formatTime(slot.till) }}
							</span>
							<UiButton
								unset
								:class="$style.slotDelete"
								@click="removeSlot(editDayIdx, si)"
							>
								<Icon
									name="material-symbols:delete-outline"
									:class="$style.slotDeleteIcon"
								/>
							</UiButton>
						</div>
					</div>

					<div :class="$style.addSlotForm">
						<h3 :class="$style.addSlotTitle">Добавить запись</h3>
						<div :class="$style.timeRow">
							<span :class="$style.timeLabel">С</span>
							<UiInput
								v-model="newSlot.fromH"
								type="number"
								:class="$style.timeInput"
								placeholder="0"
							/>
							<span :class="$style.timeSep">:</span>
							<UiInput
								v-model="newSlot.fromM"
								type="number"
								:class="$style.timeInput"
								placeholder="00"
							/>
							<span :class="$style.timeLabel">До</span>
							<UiInput
								v-model="newSlot.tillH"
								type="number"
								:class="$style.timeInput"
								placeholder="0"
							/>
							<span :class="$style.timeSep">:</span>
							<UiInput
								v-model="newSlot.tillM"
								type="number"
								:class="$style.timeInput"
								placeholder="00"
							/>
						</div>
						<div :class="$style.typeRow">
							<UiButton
								v-for="opt in GENDER_OPTIONS"
								:key="opt.value"
								:class="[
									$style.typeBtn,
									newSlot.gender === opt.value && $style.typeBtnActive,
								]"
								inset
								@click="newSlot.gender = opt.value"
							>
								{{ opt.label }}
							</UiButton>
						</div>
						<label :class="$style.recurringLabel">
							<input
								type="checkbox"
								v-model="newSlot.recurring"
								:class="$style.recurringCheck"
							/>
							Повторять каждый день
						</label>
						<UiButton accent @click="addSlot">Добавить</UiButton>
					</div>

					<div :class="$style.modalActions">
						<UiButton @click="closeEdit">Отмена</UiButton>
						<UiButton accent :disabled="editSaving" @click="saveEdit">
							{{ editSaving ? "Сохранение..." : "Сохранить" }}
						</UiButton>
					</div>
				</div>
			</div>
		</Teleport>

		<!-- ── Shower create modal ────────────────────────────────────────── -->
		<Teleport to="body">
			<div
				v-if="createModalOpen"
				:class="$style.overlay"
				@click.self="createModalOpen = false"
			>
				<div :class="$style.modal">
					<h2 :class="$style.modalTitle">Новая душевая</h2>
					<div :class="$style.modalFields">
						<div :class="$style.field">
							<label :class="$style.label">Местоположение</label>
							<UiInput
								v-model="createForm.location"
								:class="$style.input"
								placeholder="Корпус А, 1 этаж"
							/>
						</div>
					</div>
					<div :class="$style.modalActions">
						<UiButton @click="createModalOpen = false">Отмена</UiButton>
						<UiButton accent :disabled="createSaving" @click="createShower">
							{{ createSaving ? "Создание..." : "Создать" }}
						</UiButton>
					</div>
				</div>
			</div>
		</Teleport>

		<!-- ── WM create modal ────────────────────────────────────────────── -->
		<Teleport to="body">
			<div
				v-if="wmCreateOpen"
				:class="$style.overlay"
				@click.self="wmCreateOpen = false"
			>
				<div :class="$style.modal">
					<h2 :class="$style.modalTitle">Новая стиральная машина</h2>
					<div :class="$style.modalFields">
						<div :class="$style.field">
							<label :class="$style.label">Местоположение</label>
							<UiInput
								v-model="wmCreateLocation"
								:class="$style.input"
								placeholder="Этаж 2, комната 201"
							/>
						</div>
					</div>
					<div :class="$style.modalActions">
						<UiButton @click="wmCreateOpen = false">Отмена</UiButton>
						<UiButton
							accent
							:disabled="wmCreateSaving"
							@click="createMachine"
						>
							{{ wmCreateSaving ? "Создание..." : "Создать" }}
						</UiButton>
					</div>
				</div>
			</div>
		</Teleport>

		<!-- ── WM edit modal ──────────────────────────────────────────────── -->
		<Teleport to="body">
			<div
				v-if="wmEditOpen"
				:class="$style.overlay"
				@click.self="wmEditOpen = false"
			>
				<div :class="$style.modal">
					<h2 :class="$style.modalTitle">Редактировать машину</h2>
					<div :class="$style.modalFields">
						<div :class="$style.field">
							<label :class="$style.label">Местоположение</label>
							<UiInput
								v-model="wmEditMachine!.location"
								:class="$style.input"
							/>
						</div>
					</div>
					<div :class="$style.modalActions">
						<UiButton @click="wmEditOpen = false">Отмена</UiButton>
						<UiButton
							accent
							:disabled="wmEditSaving"
							@click="saveWmEdit"
						>
							{{ wmEditSaving ? "Сохранение..." : "Сохранить" }}
						</UiButton>
					</div>
				</div>
			</div>
		</Teleport>

		<!-- ── WM booking modal ───────────────────────────────────────────── -->
		<Teleport to="body">
			<div
				v-if="bookModalOpen"
				:class="$style.overlay"
				@click.self="bookModalOpen = false"
			>
				<div :class="$style.modal">
					<h2 :class="$style.modalTitle">Записаться на стирку</h2>
					<div :class="$style.addSlotForm">
						<div :class="$style.timeRow">
							<span :class="$style.timeLabel">С</span>
							<UiInput
								v-model="bookForm.fromH"
								type="number"
								:class="$style.timeInput"
								placeholder="8"
							/>
							<span :class="$style.timeSep">:</span>
							<UiInput
								v-model="bookForm.fromM"
								type="number"
								:class="$style.timeInput"
								placeholder="00"
							/>
							<span :class="$style.timeLabel">До</span>
							<UiInput
								v-model="bookForm.tillH"
								type="number"
								:class="$style.timeInput"
								placeholder="9"
							/>
							<span :class="$style.timeSep">:</span>
							<UiInput
								v-model="bookForm.tillM"
								type="number"
								:class="$style.timeInput"
								placeholder="00"
							/>
						</div>
					</div>
					<div :class="$style.modalActions">
						<UiButton @click="bookModalOpen = false">Отмена</UiButton>
						<UiButton accent :disabled="bookSaving" @click="createBooking">
							{{ bookSaving ? "Сохранение..." : "Записаться" }}
						</UiButton>
					</div>
				</div>
			</div>
		</Teleport>
	</div>
</template>

<style module lang="scss">
.wrapper {
	.container {
		@include container;

		display: flex;
		flex-direction: column;
		row-gap: 24px;
	}

	.sectionHeader {
		display: flex;
		align-items: center;
		justify-content: space-between;

		.sectionTitle {
			@include reset;
			@include title-l;
			@include color-black;
		}
	}

	.daySelector {
		display: flex;
		column-gap: 8px;
		flex-wrap: wrap;
		row-gap: 8px;

		.dayBtn {
			min-width: 48px;
		}

		.dayBtnActive {
			@include color-black-bg(0.12);
		}
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 12px 20px;

		.legendItem {
			display: flex;
			align-items: center;
			column-gap: 6px;

			.legendDot {
				width: 12px;
				height: 12px;
				border-radius: 3px;
				flex-shrink: 0;
			}

			.legendLabel {
				@include text-s;
				@include color-black;
			}
		}
	}

	.empty {
		@include text-m;
		@include color-black;

		opacity: 0.5;
		text-align: center;
		padding: 40px 0;
	}

	.machineRow {
		display: flex;
		flex-direction: column;
		row-gap: 16px;
		padding: 20px;
		border-radius: 10px;

		@include color-black-bg(0.04);

		.machineHeader {
			display: flex;
			align-items: center;
			justify-content: space-between;

			.machineLocation {
				@include title-s;
				@include color-black;
			}

			.machineActions {
				display: flex;
				column-gap: 8px;

				.deleteBtn {
					@include color-error-bg;
				}
			}
		}

		.timeline {
			width: 100%;
		}
	}
}

// ─── Shower tooltip ───────────────────────────────────────────────────────────

.tooltip {
	@include text-s;
	@include color-white;

	position: fixed;
	z-index: 9999;
	background: rgba(0, 0, 0, 0.8);
	border-radius: 6px;
	padding: 6px 10px;
	display: flex;
	flex-direction: column;
	row-gap: 2px;
	pointer-events: none;
	white-space: nowrap;
}

// ─── WM interactive tooltip ───────────────────────────────────────────────────

.wmTooltip {
	position: fixed;
	z-index: 9999;
	background: #fff;
	border: 1px solid rgba(0, 0, 0, 0.1);
	border-radius: 8px;
	padding: 10px 14px;
	display: flex;
	flex-direction: column;
	row-gap: 8px;
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
	min-width: 180px;

	.wmTooltipTime {
		@include text-s;
		@include color-black;

		font-weight: 600;
	}

	.wmTooltipUser {
		@include text-s;
		@include color-black;

		text-decoration: underline;
		opacity: 0.7;

		&:hover {
			opacity: 1;
		}
	}

	.wmTooltipDelete {
		@include color-error-bg;

		font-size: 13px;
		padding: 4px 10px;
	}
}

// ─── Modal / Overlay ──────────────────────────────────────────────────────────

.overlay {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.5);
	z-index: 1000;
	display: flex;
	align-items: center;
	justify-content: center;
}

.modal {
	background: #fff;
	border-radius: 12px;
	padding: 28px;
	width: min(600px, 95vw);
	max-height: 90vh;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	row-gap: 20px;

	.modalTitle {
		@include reset;
		@include title-m;
		@include color-black;
	}

	.modalFields {
		display: flex;
		flex-direction: column;
		row-gap: 14px;
	}

	.field {
		display: flex;
		flex-direction: column;
		row-gap: 6px;
	}

	.label {
		@include text-s;
		@include color-black;
	}

	.input {
		width: 100%;
	}

	.dayTabs {
		display: flex;
		column-gap: 6px;
		flex-wrap: wrap;
		row-gap: 6px;

		.dayTabBtn {
			min-width: 44px;
		}

		.dayTabBtnActive {
			@include color-black-bg(0.12);
		}
	}

	.slotsList {
		display: flex;
		flex-direction: column;
		row-gap: 8px;
		min-height: 48px;

		.noSlots {
			@include text-s;
			@include color-black;

			opacity: 0.5;
		}

		.slotItem {
			display: flex;
			align-items: center;
			column-gap: 10px;

			.slotDot {
				width: 10px;
				height: 10px;
				border-radius: 3px;
				flex-shrink: 0;
			}

			.slotLabel {
				@include text-s;
				@include color-black;

				flex: 1;
			}

			.slotTime {
				@include text-s;
				@include color-black;

				opacity: 0.6;
			}

			.slotDelete {
				padding: 4px;
			}

			.slotDeleteIcon {
				width: 16px;
				height: 16px;
				opacity: 0.5;
			}
		}
	}

	.addSlotForm {
		display: flex;
		flex-direction: column;
		row-gap: 12px;
		padding: 16px;
		border-radius: 8px;

		@include color-black-bg(0.04);

		.addSlotTitle {
			@include reset;
			@include text-m;
			@include color-black;
		}

		.timeRow {
			display: flex;
			align-items: center;
			column-gap: 6px;

			.timeLabel {
				@include text-s;
				@include color-black;
			}

			.timeInput {
				width: 56px;
			}

			.timeSep {
				@include text-m;
				@include color-black;
			}
		}

		.typeRow {
			display: flex;
			flex-wrap: wrap;
			gap: 6px;

			.typeBtn {
				font-size: 13px;
				padding: 4px 10px;
			}

			.typeBtnActive {
				@include color-black-bg(0.12);
			}
		}

		.recurringLabel {
			display: flex;
			align-items: center;
			column-gap: 8px;
			cursor: pointer;

			@include text-s;
			@include color-black;

			.recurringCheck {
				cursor: pointer;
			}
		}
	}

	.modalActions {
		display: flex;
		column-gap: 10px;
		justify-content: flex-end;
	}
}
</style>
