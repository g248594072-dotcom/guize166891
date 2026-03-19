<template>
  <article class="personal-rule-item">
    <div class="item-header">
      <div class="title-group">
        <i class="fa-solid fa-user-circle"></i>
        <h4>{{ character }}</h4>
      </div>
      <div class="item-actions">
        <button class="edit-btn" @click="$emit('openModal', 'edit_personal_rule', personalPayload)">
          <i class="fa-solid fa-pen"></i>
          <span>编辑</span>
        </button>
        <button class="delete-btn" @click="$emit('openModal', 'delete_personal_rule', personalPayload)">
          <i class="fa-solid fa-trash"></i>
          <span>删除</span>
        </button>
      </div>
    </div>
    <div class="rules-list">
      <div v-for="(rule, idx) in rules" :key="idx" class="rule-item">
        {{ rule }}
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  character: string;
  rules: string[];
  item?: { title?: string; character?: string; desc?: string };
}>();

const personalPayload = computed(() => props.item ?? {
  title: props.character,
  character: props.character,
  desc: Array.isArray(props.rules) ? props.rules.join('\n') : '',
});

defineEmits<{
  (e: 'openModal', type: string, payload?: Record<string, any>): void;
}>();
</script>

<style lang="scss" scoped>
.personal-rule-item {
  padding: 20px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
}

:global(.light) .personal-rule-item {
  border-color: rgba(0, 0, 0, 0.1);
  background: #fff;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 12px;

  .title-group {
    display: flex;
    align-items: center;
    gap: 12px;

    i {
      font-size: 20px;
      color: #a1a1aa;
    }

    h4 {
      font-size: 16px;
      font-weight: 500;
      color: #f4f4f5;
    }
  }

  .item-actions {
    display: flex;
    gap: 8px;
  }

  .edit-btn,
  .delete-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #71717a;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
      color: #fff;
    }
  }

  .delete-btn:hover {
    color: #ef4444;
  }
}

:global(.light) .item-header {
  border-color: rgba(0, 0, 0, 0.05);

  .title-group h4 {
    color: #18181b;
  }

  .edit-btn:hover {
    color: #18181b;
  }
}

.rules-list {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .rule-item {
    padding: 12px;
    border-radius: 8px;
    font-size: 14px;
    color: #d4d4d8;
    border: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(255, 255, 255, 0.05);
  }
}

:global(.light) .rules-list .rule-item {
  color: #3f3f46;
  border-color: rgba(0, 0, 0, 0.05);
  background: #f4f4f5;
}
</style>
