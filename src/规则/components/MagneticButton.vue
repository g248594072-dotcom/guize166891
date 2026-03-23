<template>
  <button
    ref="btnRef"
    class="magnetic-btn"
    :class="customClass"
    :style="buttonStyle"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
    @click="handleClick"
  >
    <span class="content" :style="contentStyle">
      <slot />
    </span>
    <span
      v-for="ripple in ripples"
      :key="ripple.id"
      class="ripple-span"
      :style="ripple.style"
    />
  </button>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  customClass?: string;
}>();

const emit = defineEmits<{
  click: [e: MouseEvent];
}>();

const btnRef = ref<HTMLButtonElement>();
const pos = ref({ x: 0, y: 0 });
const ripples = ref<Array<{ id: number; style: Record<string, string> }>>([]);
let rippleId = 0;

const buttonStyle = computed(() => ({
  transform: `translate(${pos.value.x}px, ${pos.value.y}px)`,
}));

const contentStyle = computed(() => ({
  transform: `translate(${pos.value.x * 0.3}px, ${pos.value.y * 0.3}px)`,
}));

const handleMouseMove = (e: MouseEvent) => {
  const rect = btnRef.value?.getBoundingClientRect();
  if (!rect) return;

  const x = (e.clientX - rect.left - rect.width / 2) * 0.3;
  const y = (e.clientY - rect.top - rect.height / 2) * 0.3;
  pos.value = { x, y };
};

const handleMouseLeave = () => {
  pos.value = { x: 0, y: 0 };
};

const handleClick = (e: MouseEvent) => {
  const rect = btnRef.value?.getBoundingClientRect();
  if (!rect) return;

  const size = Math.max(rect.width, rect.height) * 2;
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;

  const newRipple = {
    id: rippleId++,
    style: {
      left: `${x}px`,
      top: `${y}px`,
      width: `${size}px`,
      height: `${size}px`,
    },
  };

  ripples.value.push(newRipple);
  setTimeout(() => {
    ripples.value = ripples.value.filter(r => r.id !== newRipple.id);
  }, 600);

  emit('click', e);
};
</script>

<style scoped lang="scss">
.magnetic-btn {
  position: relative;
  overflow: hidden;
  transition: transform 0.15s ease-out;
  cursor: pointer;
  border: none;
  background: transparent;
  padding: 0;

  &:focus {
    outline: none;
  }
}

.content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease-out;
}
</style>
