<template>
  <span>{{ displayText }}</span>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';

const props = defineProps<{
  text: string;
  autoPlay?: boolean;
}>();

const displayText = ref('');
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';

const scramble = () => {
  let iteration = 0;
  const target = props.text;

  const interval = setInterval(() => {
    displayText.value = target
      .split('')
      .map((letter, index) => {
        if (letter === ' ') return ' ';
        if (index < iteration) return target[index];
        return chars[Math.floor(Math.random() * chars.length)];
      })
      .join('');

    if (iteration >= target.length) {
      clearInterval(interval);
      displayText.value = target;
    }
    iteration += 1 / 3;
  }, 30);
};

watch(() => props.text, () => {
  if (props.autoPlay !== false) {
    scramble();
  }
});

onMounted(() => {
  if (props.autoPlay !== false) {
    scramble();
  } else {
    displayText.value = props.text;
  }
});
</script>
