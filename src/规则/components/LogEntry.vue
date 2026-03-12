<template>
  <div class="log-entry" :class="[type, { user: isUser }]">
    <span class="timestamp">{{ type }} [{{ time }}]</span>
    <div class="content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  type: string;
  time: string;
  isDarkMode?: boolean;
}>();

const isUser = computed(() => props.type === 'user');
</script>

<style lang="scss" scoped>
.log-entry {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &.user {
    align-items: flex-end;

    .content {
      background: #27272a;
      color: #f4f4f5;
      border-radius: 24px 24px 24px 4px;
      border: 1px solid #3f3f46;
    }
  }

  &:not(.user) .content {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #e4e4e7;
    border-radius: 24px 24px 4px 24px;
  }
}

:global(.light) .log-entry {
  &.user .content {
    background: #18181b;
    color: #fff;
    border: none;
  }

  &:not(.user) .content {
    background: #fff;
    border: 1px solid rgba(0, 0, 0, 0.1);
    color: #27272a;
  }
}

.timestamp {
  font-size: 12px;
  color: #71717a;
  font-family: monospace;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.content {
  padding: 20px;
  font-size: 16px;
  line-height: 1.6;
  max-width: 85%;

  :deep(.highlight) {
    font-weight: 500;
    color: #fff;
  }

  :deep(.subtext) {
    font-size: 14px;
    font-style: italic;
    color: #71717a;
  }
}

:global(.light) .content {
  :deep(.highlight) {
    color: #18181b;
  }

  :deep(.subtext) {
    color: #a1a1aa;
  }
}
</style>
