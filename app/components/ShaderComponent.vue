<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";
import * as THREE from "three";

const props = defineProps({
	cubes: {
		type: Number,
		default: 3,
	},
});

const container = ref<HTMLDivElement | null>(null);

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let animationId: number;

onMounted(() => {
	if (!container.value) return;

	scene = new THREE.Scene();
	scene.background = new THREE.Color(0xfffaf0);

	camera = new THREE.PerspectiveCamera(
		75,
		container.value.clientWidth / container.value.clientHeight,
		0.1,
		1000
	);
	camera.position.z = 15;

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(container.value.clientWidth, container.value.clientHeight);

	container.value.appendChild(renderer.domElement);

	const geometry = new THREE.BoxGeometry();
	const material = new THREE.MeshNormalMaterial();
	const cubes: Array<THREE.Mesh> = [];
	for (let i = 0; i < props.cubes; i++) {
		const cube = new THREE.Mesh(geometry, material);
		cube.translateX((Math.random() > 0.5 ? -1 : 1) * Math.random() * 24);
		cube.translateY((Math.random() > 0.5 ? -1 : 1) * Math.random() * 12);
		cube.translateZ((Math.random() > 0.5 ? -1 : 1) * Math.random() * 5);
		cubes.push(cube);
		scene.add(cube);
	}

	const animate = () => {
		cubes.forEach((cube: THREE.Mesh) => {
			cube.rotation.x += 0.005 + Math.random() * 0.01;
			cube.rotation.y += 0.005 + Math.random() * 0.01;
		});

		renderer.render(scene, camera);
		animationId = requestAnimationFrame(animate);
	};

	animate();
});

onBeforeUnmount(() => {
	cancelAnimationFrame(animationId);
	renderer?.dispose();
});
</script>

<template>
	<div ref="container" :class="$style.scene"></div>
</template>

<style module>
.scene {
	filter: blur(25px);
}
</style>
