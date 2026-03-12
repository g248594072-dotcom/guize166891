<template>
  <div class="stat-row">
    <span class="label">{{ label }}</span>
    <span class="value">{{ value }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  value: string;
}>();
</script>

<style lang="scss" scoped>
.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;

  .label {
    font-size: 14px;
    color: #71717a;
  }

  .value {
    font-size: 14px;
    font-family: monospace;
    color: #f4f4f5;
  }
}

:global(.light) .stat-row .value {
  color: #18181b;
}
</style>
