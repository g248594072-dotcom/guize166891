<template>
  <div class="terminal-snippets" v-if="isLargeScreen">
    <div class="scroll-content">
      <div v-for="(line, i) in repeatedSnippets" :key="i" class="snippet">
        {{ line }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';

const snippets = [
  '0x00F1: MEMORY_ALLOC_OK',
  '0x00F2: KERNEL_PANIC_AVOIDED',
  '0x00F3: OVERRIDE_PROTOCOL_INIT',
  '0x00F4: NEURAL_LINK_ESTABLISHED',
  '0x00F5: REALITY_ANCHOR_STABLE',
  '0x00F6: INJECTING_RULES...',
  '0x00F7: SYNC_RATE_99_PERCENT',
  '0x00F8: AWAITING_COMMAND',
];

const repeatedSnippets = computed(() =>
  [...snippets, ...snippets, ...snippets]
);

// 响应式显示
const isLargeScreen = ref(false);

const checkScreen = () => {
  isLargeScreen.value = window.innerWidth >= 1280;
};

onMounted(() => {
  checkScreen();
  window.addEventListener('resize', checkScreen);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkScreen);
});
</script>

<style scoped lang="scss">
.terminal-snippets {
  position: absolute;
  left: 16px;
  top: 25%;
  bottom: 25%;
  width: 200px;
  overflow: hidden;
  pointer-events: none;
  opacity: 0.05;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: #06b6d4;
  line-height: 1.6;
  z-index: 1;
}

.scroll-content {
  animation: scroll-terminal 20s linear infinite;
}

@keyframes scroll-terminal {
  0% { transform: translateY(0); }
  100% { transform: translateY(-33.33%); }
}

.snippet {
  margin-bottom: 8px;
  white-space: nowrap;
}
</style>
