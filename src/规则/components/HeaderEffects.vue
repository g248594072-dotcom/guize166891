<template>
  <div class="header-effects">
    <!-- 动态渐变边框 -->
    <div class="gradient-border"></div>

    <!-- 粒子流背景 -->
    <div class="particles-container">
      <div
        v-for="particle in particles"
        :key="particle.id"
        class="particle"
        :style="{
          left: particle.x + '%',
          top: particle.y + '%',
          width: particle.size + 'px',
          height: particle.size + 'px',
          opacity: particle.opacity,
          animationDelay: particle.delay + 's',
          animationDuration: particle.duration + 's'
        }"
      />
    </div>

    <!-- 扫描线效果 -->
    <div class="scan-line"></div>

    <!-- 流光文字遮罩 -->
    <div class="glow-text-mask">
      <span class="glow-text">游戏正文</span>
    </div>

    <!-- 脉冲光晕 -->
    <div class="pulse-glow"></div>

    <!-- 数据流动画 -->
    <div class="data-stream">
      <div
        v-for="stream in dataStreams"
        :key="stream.id"
        class="stream-line"
        :style="{
          left: stream.x + '%',
          animationDelay: stream.delay + 's',
          animationDuration: stream.duration + 's'
        }"
      >
        <span
          v-for="char in stream.chars"
          :key="char.id"
          class="stream-char"
          :style="{ animationDelay: char.delay + 's' }"
        >{{ char.value }}</span>
      </div>
    </div>

    <!-- 角标装饰 -->
    <div class="corner-decorations">
      <div class="corner top-left"></div>
      <div class="corner top-right"></div>
      <div class="corner bottom-left"></div>
      <div class="corner bottom-right"></div>
    </div>
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

interface StreamChar {
  id: number;
  value: string;
  delay: number;
}

interface DataStream {
  id: number;
  x: number;
  delay: number;
  duration: number;
  chars: StreamChar[];
}

const particles = ref<Particle[]>([]);
const dataStreams = ref<DataStream[]>([]);

const hexChars = '0123456789ABCDEF';

onMounted(() => {
  // 生成粒子
  particles.value = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    opacity: Math.random() * 0.5 + 0.2,
    delay: Math.random() * 3,
    duration: Math.random() * 4 + 3
  }));

  // 生成数据流
  dataStreams.value = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    x: 10 + (i * 15),
    delay: Math.random() * 2,
    duration: Math.random() * 3 + 4,
    chars: Array.from({ length: 4 }, (_, j) => ({
      id: j,
      value: hexChars[Math.floor(Math.random() * hexChars.length)],
      delay: j * 0.15
    }))
  }));
});
</script>

<style scoped lang="scss">
.header-effects {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

// 动态渐变边框
.gradient-border {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(6, 182, 212, 0.3) 25%,
    rgba(168, 85, 247, 0.3) 50%,
    rgba(6, 182, 212, 0.3) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: gradient-flow 3s linear infinite;
  opacity: 0.6;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      rgba(6, 182, 212, 0.4) 0%,
      transparent 30%,
      transparent 70%,
      rgba(168, 85, 247, 0.4) 100%
    );
    opacity: 0.5;
  }
}

@keyframes gradient-flow {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

// 粒子流
.particles-container {
  position: absolute;
  inset: 0;
}

.particle {
  position: absolute;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.8) 0%, transparent 70%);
  border-radius: 50%;
  animation: float-particle ease-in-out infinite;
}

@keyframes float-particle {
  0%, 100% {
    transform: translateY(0) scale(1);
    opacity: 0.2;
  }
  50% {
    transform: translateY(-10px) scale(1.2);
    opacity: 0.6;
  }
}

// 扫描线
.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(6, 182, 212, 0.8) 50%,
    transparent 100%
  );
  box-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
  animation: scan-move 4s linear infinite;
}

@keyframes scan-move {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100vw); }
}

// 流光文字遮罩
.glow-text-mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 20px;
  opacity: 0.15;

  .glow-text {
    font-size: 2rem;
    font-weight: 900;
    background: linear-gradient(
      90deg,
      rgba(6, 182, 212, 0.8) 0%,
      rgba(168, 85, 247, 0.8) 50%,
      rgba(6, 182, 212, 0.8) 100%
    );
    background-size: 200% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: text-shine 2s linear infinite;
    text-transform: uppercase;
    letter-spacing: 0.5em;
  }
}

@keyframes text-shine {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

// 脉冲光晕
.pulse-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 100%;
  background: radial-gradient(
    ellipse at center,
    rgba(6, 182, 212, 0.15) 0%,
    rgba(168, 85, 247, 0.1) 30%,
    transparent 70%
  );
  animation: pulse-glow 3s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    opacity: 0.3;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.6;
    transform: translate(-50%, -50%) scale(1.1);
  }
}

// 数据流动画
.data-stream {
  position: absolute;
  inset: 0;
  opacity: 0.4;
}

.stream-line {
  position: absolute;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  font-family: 'Courier New', monospace;
  font-size: 8px;
  animation: stream-float ease-in-out infinite;
}

.stream-char {
  color: rgba(6, 182, 212, 0.6);
  animation: char-fade ease-in-out infinite;

  &:nth-child(2n) {
    color: rgba(168, 85, 247, 0.6);
  }
}

@keyframes stream-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

@keyframes char-fade {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.8; }
}

// 角标装饰
.corner-decorations {
  position: absolute;
  inset: 0;

  .corner {
    position: absolute;
    width: 20px;
    height: 20px;
    border-color: rgba(6, 182, 212, 0.5);
    border-style: solid;
    animation: corner-pulse 2s ease-in-out infinite;

    &.top-left {
      top: 8px;
      left: 8px;
      border-width: 2px 0 0 2px;
    }

    &.top-right {
      top: 8px;
      right: 8px;
      border-width: 2px 2px 0 0;
    }

    &.bottom-left {
      bottom: 8px;
      left: 8px;
      border-width: 0 0 2px 2px;
    }

    &.bottom-right {
      bottom: 8px;
      right: 8px;
      border-width: 0 2px 2px 0;
    }
  }
}

@keyframes corner-pulse {
  0%, 100% {
    opacity: 0.4;
    border-color: rgba(6, 182, 212, 0.5);
  }
  50% {
    opacity: 0.8;
    border-color: rgba(168, 85, 247, 0.6);
  }
}
</style>
