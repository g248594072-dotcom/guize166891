<template>
  <div class="block-progress">
    <div
      v-for="i in totalSegments"
      :key="i"
      class="segment"
      :class="{ active: i <= activeSegments, glow: i === activeSegments }"
      :style="{ transitionDelay: `${(i - 1) * 0.02}s` }"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  value: number; // 0-100
  totalSegments?: number;
  color?: string;
}>();

const totalSegments = computed(() => props.totalSegments || 20);
const activeSegments = computed(() =>
  Math.floor((props.value / 100) * totalSegments.value)
);
</script>

<style scoped lang="scss">
.block-progress {
  display: flex;
  gap: 2px;
  height: 6px;

  .segment {
    flex: 1;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 1px;
    transition: all 0.3s ease;

    &.active {
      background: linear-gradient(180deg, #a855f7, #06b6d4);
    }

    &.glow {
      box-shadow: 0 0 8px currentColor;
      filter: brightness(1.5);
    }
  }
}
</style>
