<template>
  <div class="rule-card" :class="type">
    <div class="card-header">
      <span class="type-label">{{ typeLabels[type] }}</span>
      <div class="status-dot" :class="{ active }"></div>
    </div>
    <h4 class="title">{{ title }}</h4>
    <p class="desc">{{ desc }}</p>
  </div>
</template>

<script setup lang="ts">
type RuleType = 'world' | 'regional' | 'personal';

defineProps<{
  type: RuleType;
  title: string;
  desc: string;
  active: boolean;
}>();

const typeLabels: Record<RuleType, string> = {
  world: '世界规则',
  regional: '区域规则',
  personal: '个人规则',
};
</script>

<style lang="scss" scoped>
.rule-card {
  padding: 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-left: 3px solid;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  &.world {
    border-left-color: #3b82f6;
  }

  &.regional {
    border-left-color: #10b981;
  }

  &.personal {
    border-left-color: #a855f7;
  }
}

:global(.light) .rule-card {
  background: #f4f4f5;
  border-color: rgba(0, 0, 0, 0.1);

  &:hover {
    background: #e4e4e7;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;

  .type-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #71717a;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #52525b;

    &.active {
      background: #d4d4d8;
      box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
    }
  }
}

.title {
  font-size: 14px;
  font-weight: 500;
  color: #f4f4f5;
  margin-bottom: 4px;
}

:global(.light) .title {
  color: #18181b;
}

.desc {
  font-size: 12px;
  color: #71717a;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
