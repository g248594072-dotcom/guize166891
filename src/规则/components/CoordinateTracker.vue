<template>
  <div class="coord-tracker">
    <span class="coord-label">X</span>
    <span class="coord-value">{{ formattedX }}</span>
    <span class="coord-separator">::</span>
    <span class="coord-label">Y</span>
    <span class="coord-value">{{ formattedY }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

const x = ref(0);
const y = ref(0);

const formattedX = computed(() => Math.round(x.value).toString().padStart(4, '0'));
const formattedY = computed(() => Math.round(y.value).toString().padStart(4, '0'));

let rafId: number;

onMounted(() => {
  const handler = (e: MouseEvent) => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      x.value = e.clientX;
      y.value = e.clientY;
    });
  };
  window.addEventListener('mousemove', handler);

  onUnmounted(() => {
    window.removeEventListener('mousemove', handler);
    cancelAnimationFrame(rafId);
  });
});
</script>

<style scoped lang="scss">
.coord-tracker {
  position: fixed;
  bottom: 16px;
  right: 16px;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  pointer-events: none;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: 0.1em;
}

.coord-label {
  color: rgba(168, 85, 247, 0.8);
}

.coord-value {
  color: rgba(6, 182, 212, 0.6);
  font-weight: bold;
  min-width: 40px;
}

.coord-separator {
  color: rgba(255, 255, 255, 0.3);
  margin: 0 4px;
}
</style>
