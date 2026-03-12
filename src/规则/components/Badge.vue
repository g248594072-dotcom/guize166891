<template>
  <span class="badge" :class="{ highlight }">
    {{ text }}
  </span>
</template>

<script setup lang="ts">
defineProps<{
  text: string;
  highlight?: boolean;
}>();
</script>

<style lang="scss" scoped>
.badge {
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #a1a1aa;

  &.highlight {
    background: rgba(39, 39, 42, 0.8);
    border-color: #52525b;
    color: #e4e4e7;
  }
}

:global(.light) .badge {
  border-color: rgba(0, 0, 0, 0.1);
  background: #f4f4f5;
  color: #71717a;

  &.highlight {
    background: #e4e4e7;
    border-color: #a1a1aa;
    color: #27272a;
  }
}
</style>
