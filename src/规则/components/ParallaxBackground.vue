<template>
  <div class="parallax-container" @mousemove="handleMouseMove">
    <!-- 网格层（远景） -->
    <div class="layer layer-far" :style="farStyle">
      <div class="grid-bg" />
    </div>

    <!-- 点阵层 -->
    <div class="dot-matrix-bg" />

    <!-- 浮动光球（近景） -->
    <div class="floating-orbs">
      <div class="orb orb-1" />
      <div class="orb orb-2" />
      <div class="orb orb-3" />
    </div>

    <!-- 扫描线 -->
    <div class="scanline-container">
      <div class="scanline" />
    </div>

    <!-- 噪点 -->
    <div class="noise-overlay" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

const mousePos = ref({ x: 0, y: 0 });

const handleMouseMove = (e: MouseEvent) => {
  const { innerWidth, innerHeight } = window;
  mousePos.value = {
    x: (e.clientX - innerWidth / 2) / innerWidth,
    y: (e.clientY - innerHeight / 2) / innerHeight,
  };
};

const farStyle = computed(() => ({
  transform: `translate(${mousePos.value.x * -20}px, ${mousePos.value.y * -20}px)`,
}));

// 平滑动画帧
let rafId: number;
const smoothMouseMove = (e: MouseEvent) => {
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(() => handleMouseMove(e));
};

onMounted(() => {
  window.addEventListener('mousemove', smoothMouseMove);
});

onUnmounted(() => {
  window.removeEventListener('mousemove', smoothMouseMove);
  cancelAnimationFrame(rafId);
});
</script>

<style scoped lang="scss">
.parallax-container {
  position: fixed;
  inset: -5%;
  width: 110%;
  height: 110%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.layer {
  position: absolute;
  inset: 0;
  transition: transform 0.1s ease-out;
  will-change: transform;
}

// 网格背景
.grid-bg {
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(circle at center, black 30%, transparent 80%);
  -webkit-mask-image: radial-gradient(circle at center, black 30%, transparent 80%);
  opacity: 0.4;
}

// 点阵纹理
.dot-matrix-bg {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px);
  background-size: 4px 4px;
  opacity: 0.03;
}

// 浮动光球
.floating-orbs {
  position: absolute;
  inset: 0;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
}

.orb-1 {
  top: -20%;
  left: -10%;
  width: 50vw;
  height: 50vw;
  background: rgba(168, 85, 247, 0.1);
  animation: float-orb 10s ease-in-out infinite;
}

.orb-2 {
  bottom: -20%;
  right: -10%;
  width: 50vw;
  height: 50vw;
  background: rgba(6, 182, 212, 0.1);
  animation: float-orb 12s ease-in-out infinite;
  animation-delay: -5s;
}

.orb-3 {
  top: 40%;
  left: 40%;
  width: 20vw;
  height: 20vw;
  background: rgba(99, 102, 241, 0.05);
  animation: pulse-orb 4s ease-in-out infinite;
}

@keyframes float-orb {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-20px) scale(1.05); }
}

@keyframes pulse-orb {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

// 扫描线
.scanline-container {
  position: absolute;
  inset: 0;
  overflow: hidden;
  opacity: 0.3;
}

.scanline {
  width: 100%;
  height: 2px;
  background: rgba(6, 182, 212, 0.5);
  filter: blur(1px);
  box-shadow: 0 0 15px rgba(6, 182, 212, 0.8);
  animation: scanline-move 8s linear infinite;
}

@keyframes scanline-move {
  0% { transform: translateY(-100vh); }
  100% { transform: translateY(100vh); }
}

// 噪点
.noise-overlay {
  position: absolute;
  inset: -10%;
  width: 120%;
  height: 120%;
  background: url('https://grainy-gradients.vercel.app/noise.svg');
  opacity: 0.06;
  mix-blend-mode: overlay;
  animation: noise-move 0.4s infinite steps(2);
}

@keyframes noise-move {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-1%, -1%); }
  20% { transform: translate(-2%, 1%); }
  30% { transform: translate(1%, -2%); }
  40% { transform: translate(-1%, 3%); }
  50% { transform: translate(-2%, 1%); }
  60% { transform: translate(3%, 0); }
  70% { transform: translate(0, 3%); }
  80% { transform: translate(1%, 5%); }
  90% { transform: translate(-2%, 2%); }
}
</style>
