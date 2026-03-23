<template>
  <div class="sidebar-effects">
    <!-- 背景光晕层 -->
    <div class="ambient-glow"></div>

    <!-- 垂直渐变流光 -->
    <div class="vertical-glow"></div>

    <!-- 呼吸光球 -->
    <div class="glow-orb orb-top"></div>
    <div class="glow-orb orb-middle"></div>
    <div class="glow-orb orb-bottom"></div>

    <!-- 粒子效果 -->
    <div class="particles">
      <div
        v-for="particle in particles"
        :key="particle.id"
        class="particle"
        :style="{
          top: particle.y + '%',
          left: particle.x + '%',
          width: particle.size + 'px',
          height: particle.size + 'px',
          opacity: particle.opacity,
          animationDelay: particle.delay + 's',
          animationDuration: particle.duration + 's'
        }"
      />
    </div>

    <!-- 边框光效 -->
    <div class="border-glow"></div>

    <!-- 网格纹理 -->
    <div class="grid-texture"></div>

    <!-- Logo区域特殊光效 -->
    <div class="logo-glow"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  delay: number;
  duration: number;
}

const particles = ref<Particle[]>([]);

onMounted(() => {
  // 生成粒子 - 主要分布在两侧
  particles.value = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.random() * 30 + 5, // 左侧区域
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    opacity: Math.random() * 0.4 + 0.2,
    delay: Math.random() * 4,
    duration: Math.random() * 5 + 4
  }));
});
</script>

<style scoped lang="scss">
.sidebar-effects {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

// 背景环境光晕
.ambient-glow {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      ellipse at 0% 20%,
      rgba(6, 182, 212, 0.08) 0%,
      transparent 50%
    ),
    radial-gradient(
      ellipse at 0% 80%,
      rgba(168, 85, 247, 0.06) 0%,
      transparent 50%
    );
  animation: ambient-pulse 6s ease-in-out infinite;
}

@keyframes ambient-pulse {
  0%, 100% {
    opacity: 0.6;
    filter: blur(40px);
  }
  50% {
    opacity: 1;
    filter: blur(60px);
  }
}

// 垂直渐变流光
.vertical-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(6, 182, 212, 0.4) 20%,
    rgba(168, 85, 247, 0.4) 50%,
    rgba(6, 182, 212, 0.4) 80%,
    transparent 100%
  );
  opacity: 0.6;
  animation: vertical-flow 8s ease-in-out infinite;
}

@keyframes vertical-flow {
  0%, 100% {
    opacity: 0.3;
    transform: scaleY(0.8);
  }
  50% {
    opacity: 0.7;
    transform: scaleY(1);
  }
}

// 呼吸光球
.glow-orb {
  position: absolute;
  left: -50px;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.4;

  &.orb-top {
    top: 10%;
    background: rgba(6, 182, 212, 0.3);
    animation: orb-breathe-1 5s ease-in-out infinite;
  }

  &.orb-middle {
    top: 45%;
    background: rgba(168, 85, 247, 0.25);
    animation: orb-breathe-2 6s ease-in-out infinite;
    animation-delay: -2s;
  }

  &.orb-bottom {
    bottom: 15%;
    background: rgba(6, 182, 212, 0.2);
    animation: orb-breathe-1 7s ease-in-out infinite;
    animation-delay: -4s;
  }
}

@keyframes orb-breathe-1 {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1) translateX(0);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.2) translateX(20px);
  }
}

@keyframes orb-breathe-2 {
  0%, 100% {
    opacity: 0.25;
    transform: scale(1) translateX(0);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.3) translateX(30px);
  }
}

// 粒子效果
.particles {
  position: absolute;
  inset: 0;
}

.particle {
  position: absolute;
  background: radial-gradient(
    circle,
    rgba(6, 182, 212, 0.8) 0%,
    transparent 70%
  );
  border-radius: 50%;
  animation: particle-float ease-in-out infinite;
}

@keyframes particle-float {
  0%, 100% {
    transform: translateY(0) translateX(0);
    opacity: 0.2;
  }
  25% {
    transform: translateY(-8px) translateX(3px);
    opacity: 0.5;
  }
  50% {
    transform: translateY(-4px) translateX(-2px);
    opacity: 0.3;
  }
  75% {
    transform: translateY(-12px) translateX(4px);
    opacity: 0.6;
  }
}

// 边框光效
.border-glow {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(6, 182, 212, 0.5) 15%,
    rgba(168, 85, 247, 0.5) 50%,
    rgba(6, 182, 212, 0.5) 85%,
    transparent 100%
  );
  opacity: 0.6;
  animation: border-pulse 4s ease-in-out infinite;
}

@keyframes border-pulse {
  0%, 100% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.8;
  }
}

// 网格纹理
.grid-texture {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(
      to bottom,
      rgba(6, 182, 212, 0.03) 1px,
      transparent 1px
    );
  background-size: 100% 60px;
  opacity: 0.5;
  mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 20%,
    black 80%,
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 20%,
    black 80%,
    transparent 100%
  );
}

// Logo区域特殊光效
.logo-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: calc(80px * var(--ui-scale, 1));
  background: linear-gradient(
    180deg,
    rgba(6, 182, 212, 0.08) 0%,
    rgba(168, 85, 247, 0.04) 50%,
    transparent 100%
  );
  opacity: 0.6;
  animation: logo-glow-pulse 3s ease-in-out infinite;
}

@keyframes logo-glow-pulse {
  0%, 100% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.8;
  }
}
</style>
