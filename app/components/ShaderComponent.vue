<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from "vue";

// ════════════════════════════════════════════════════════════════════
//   ПАРАМЕТРЫ ДЛЯ ТЮНИНГА — играй здесь
// ════════════════════════════════════════════════════════════════════

// Количество частиц (100..500)
const PARTICLE_COUNT = 3000;

// Размер точки (радиус в пикселях)
const PARTICLE_SIZE = 4;

// Базовая скорость частицы (px/кадр)
const PARTICLE_SPEED = 1.3;

// Длина шлейфа: чем меньше → длиннее след. 0.01..0.4
// 0.04 = очень длинный, 0.15 = средний, 0.3 = короткий
const TRAIL_FADE = 0.1;

// Радиус действия курсора (px)
const CURSOR_REPEL_RADIUS = 160;

// Сила отталкивания от курсора (ускорение)
const CURSOR_REPEL_STRENGTH = 1.2;

// Эластичность отскока: 1 = идеальный, 0.9 = с потерей энергии
const BOUNCE_DAMPING = 1;

// Затухание скорости каждый кадр (1 = без трения, 0.99 = лёгкое трение)
const VELOCITY_DAMPING = 0.99;

// Минимальная скорость — частицы не могут полностью остановиться
const MIN_SPEED = 0.5;

// Длительность постепенного появления частиц из центра (секунд)
const EMISSION_DURATION = 5;

// Цвета берём из CSS-переменных (см. assets/scss/vars.scss),
// чтобы шейдер реагировал на смену темы.
const readThemeColors = () => {
	const root = getComputedStyle(document.documentElement);
	const bg = root.getPropertyValue("--c-white").trim() || "#fffaf0";
	const blackRgb =
		root.getPropertyValue("--c-black-rgb").trim() || "38, 28, 7";
	const accentRgb =
		root.getPropertyValue("--c-accent-rgb").trim() || "248, 194, 78";
	return {
		bg,
		particles: [
			`rgba(${blackRgb}, 0.55)`,
			`rgba(${accentRgb}, 0.7)`,
			`rgba(${blackRgb}, 0.35)`,
		],
	};
};

let BACKGROUND_COLOR = "#fffaf0";
let PARTICLE_COLORS: string[] = [
	"rgba(38, 28, 7, 0.55)",
	"rgba(248, 194, 78, 0.7)",
	"rgba(38, 28, 7, 0.35)",
];

const { theme } = useTheme();

// Включить движение частиц вместе со скроллом
// true  — частицы «приклеены» к странице (двигаются при скролле)
// false — частицы живут в координатах viewport (скролл их не двигает)
const SCROLL_LOCKED_TO_PAGE = true;

// ════════════════════════════════════════════════════════════════════

defineProps({
	// Бэк-компат с layouts/welcome.vue: <ShaderComponent :cubes="800" />
	// Не используется, оставлен чтобы не падать.
	cubes: { type: Number, default: 0 },
});

const canvas = ref<HTMLCanvasElement | null>(null);

type Particle = {
	x: number;
	y: number;
	vx: number;
	vy: number;
	color: string;
};

let raf = 0;
const cleanups: Array<() => void> = [];

onMounted(() => {
	const c = canvas.value;
	if (!c) return;
	const ctx = c.getContext("2d");
	if (!ctx) return;

	// Подтянуть актуальные цвета темы на этапе монтирования.
	{
		const { bg, particles } = readThemeColors();
		BACKGROUND_COLOR = bg;
		PARTICLE_COLORS = particles;
	}

	const dpr = Math.min(window.devicePixelRatio || 1, 2);
	let width = 0;
	let height = 0;

	const resize = () => {
		width = window.innerWidth;
		height = window.innerHeight;
		c.width = Math.floor(width * dpr);
		c.height = Math.floor(height * dpr);
		c.style.width = width + "px";
		c.style.height = height + "px";
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.fillStyle = BACKGROUND_COLOR;
		ctx.fillRect(0, 0, width, height);
	};
	resize();

	// Все частицы создаются заранее, но изначально «спящие» (alive=false).
	// Каждые tick'и просыпается порция, разбрасывая время появления по
	// EMISSION_DURATION секундам. Направление и базовая скорость заданы
	// заранее, чтобы порядок и углы выглядели равномерно.
	type AliveParticle = Particle & { alive: boolean; spawnAt: number };
	const particles: AliveParticle[] = [];
	for (let i = 0; i < PARTICLE_COUNT; i++) {
		const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + Math.random() * 0.3;
		const speed = PARTICLE_SPEED * (0.6 + Math.random() * 1.0);
		particles.push({
			x: 0,
			y: 0,
			vx: Math.cos(angle) * speed,
			vy: Math.sin(angle) * speed,
			color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
			alive: false,
			// Время появления — равномерно по EMISSION_DURATION с лёгким джиттером
			spawnAt:
				(i / PARTICLE_COUNT) * EMISSION_DURATION * 1000 +
				Math.random() * 100,
		});
	}
	const startedAt = performance.now();

	// Курсор
	let mouseX = -9999;
	let mouseY = -9999;
	const onMouseMove = (e: MouseEvent) => {
		mouseX = e.clientX;
		mouseY = e.clientY;
	};
	const onMouseOut = () => {
		mouseX = -9999;
		mouseY = -9999;
	};

	// Scroll: частицы двигаются вместе со страницей
	let lastScroll = window.scrollY;
	const onScroll = () => {
		const delta = window.scrollY - lastScroll;
		lastScroll = window.scrollY;
		if (!SCROLL_LOCKED_TO_PAGE) return;
		for (let i = 0; i < particles.length; i++) {
			particles[i].y -= delta;
		}
	};

	window.addEventListener("mousemove", onMouseMove, { passive: true });
	window.addEventListener("mouseout", onMouseOut, { passive: true });
	window.addEventListener("scroll", onScroll, { passive: true });
	window.addEventListener("resize", resize);

	cleanups.push(() => {
		window.removeEventListener("mousemove", onMouseMove);
		window.removeEventListener("mouseout", onMouseOut);
		window.removeEventListener("scroll", onScroll);
		window.removeEventListener("resize", resize);
	});

	// Helper: hex → rgba для подложки шлейфа
	const hexToRgbaWithAlpha = (hex: string, alpha: number) => {
		const h = hex.replace("#", "");
		if (h.length < 6) return `rgba(255, 250, 240, ${alpha})`;
		const r = parseInt(h.substring(0, 2), 16);
		const g = parseInt(h.substring(2, 4), 16);
		const b = parseInt(h.substring(4, 6), 16);
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	};
	let fadeColor = hexToRgbaWithAlpha(BACKGROUND_COLOR, TRAIL_FADE);

	// При смене темы перечитываем цвета и переназначаем частицам новую палитру.
	const stopThemeWatch = watch(theme, () => {
		const { bg, particles: newPalette } = readThemeColors();
		BACKGROUND_COLOR = bg;
		PARTICLE_COLORS = newPalette;
		fadeColor = hexToRgbaWithAlpha(BACKGROUND_COLOR, TRAIL_FADE);
		for (let i = 0; i < particles.length; i++) {
			particles[i].color = newPalette[i % newPalette.length];
		}
	});
	cleanups.push(() => stopThemeWatch());

	const tick = () => {
		// Подложка для шлейфа — заливка с малой прозрачностью затирает
		// предыдущие кадры постепенно, создавая эффект следа.
		ctx.fillStyle = fadeColor;
		ctx.fillRect(0, 0, width, height);

		const repelR2 = CURSOR_REPEL_RADIUS * CURSOR_REPEL_RADIUS;
		const elapsed = performance.now() - startedAt;

		// Центр экрана — пересчитываем каждый кадр на случай ресайза
		const cx = width / 2;
		const cy = height / 2;

		for (let i = 0; i < particles.length; i++) {
			const p = particles[i];

			// Пробуждение по расписанию: появляется в центре с заданной скоростью
			if (!p.alive) {
				if (elapsed < p.spawnAt) continue;
				p.alive = true;
				p.x = cx;
				p.y = cy;
			}

			// Отталкивание от курсора
			if (mouseX > -9000) {
				const dx = p.x - mouseX;
				const dy = p.y - mouseY;
				const d2 = dx * dx + dy * dy;
				if (d2 < repelR2 && d2 > 0.001) {
					const d = Math.sqrt(d2);
					const force =
						(1 - d / CURSOR_REPEL_RADIUS) * CURSOR_REPEL_STRENGTH;
					p.vx += (dx / d) * force;
					p.vy += (dy / d) * force;
				}
			}

			// Лёгкое трение
			p.vx *= VELOCITY_DAMPING;
			p.vy *= VELOCITY_DAMPING;

			// Защита от полной остановки — сохраняем направление, масштабируем
			// скорость до минимума. Если совсем нулевая (ровно стояла), то даём
			// случайный лёгкий толчок.
			const speedSq = p.vx * p.vx + p.vy * p.vy;
			if (speedSq < MIN_SPEED * MIN_SPEED) {
				const speed = Math.sqrt(speedSq);
				if (speed > 0.0001) {
					const scale = MIN_SPEED / speed;
					p.vx *= scale;
					p.vy *= scale;
				} else {
					const a = Math.random() * Math.PI * 2;
					p.vx = Math.cos(a) * MIN_SPEED;
					p.vy = Math.sin(a) * MIN_SPEED;
				}
			}

			// Движение
			p.x += p.vx;
			p.y += p.vy;

			// Отскок от краёв экрана (viewport)
			if (p.x < 0) {
				p.x = 0;
				p.vx = -p.vx * BOUNCE_DAMPING;
			} else if (p.x > width) {
				p.x = width;
				p.vx = -p.vx * BOUNCE_DAMPING;
			}
			if (p.y < 0) {
				p.y = 0;
				p.vy = -p.vy * BOUNCE_DAMPING;
			} else if (p.y > height) {
				p.y = height;
				p.vy = -p.vy * BOUNCE_DAMPING;
			}

			// Рисуем точку
			ctx.fillStyle = p.color;
			ctx.beginPath();
			ctx.arc(p.x, p.y, PARTICLE_SIZE, 0, Math.PI * 2);
			ctx.fill();
		}

		raf = requestAnimationFrame(tick);
	};
	tick();
});

onBeforeUnmount(() => {
	cancelAnimationFrame(raf);
	cleanups.forEach((fn) => fn());
});
</script>

<template>
	<canvas ref="canvas" :class="$style.canvas"></canvas>
</template>

<style module>
.canvas {
	position: fixed;
	inset: 0;
	z-index: 0;
	pointer-events: none;
	width: 100vw;
	height: 100vh;
	filter: blur(12px);
}
</style>
