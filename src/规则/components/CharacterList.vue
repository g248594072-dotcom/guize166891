<template>
  <section id="panel-character-list" class="character-list">
    <div class="section-header">
      <p class="desc">管理当前世界中的所有角色实体。</p>
      <div class="actions">
        <button id="btn-add-character" class="action-btn" @click="$emit('openModal', 'add_character')">
          <i class="fa-solid fa-plus"></i>
          <span>新增角色</span>
        </button>
      </div>
    </div>

    <!-- 加载中状态 -->
    <div v-if="isLoading" class="loading-state">
      <i class="fa-solid fa-circle-notch fa-spin"></i>
      <span>正在加载角色数据...</span>
    </div>

    <div v-else-if="visibleCharacters.length === 0" class="empty-state">
      <i class="fa-solid fa-users"></i>
      <p>暂无角色</p>
      <span class="hint">点击上方按钮添加新角色，或等待AI生成初始数据</span>
    </div>

    <div v-else class="character-grid">
      <article
        v-for="char in visibleCharacters"
        :key="char.id"
        class="character-card"
        @click="$emit('select', char.id)"
      >
        <div class="card-header">
          <div class="avatar">
            <i class="fa-solid fa-user"></i>
          </div>
          <div class="info">
            <h4>{{ char.name }}</h4>
            <p>{{ char.role }} | {{ char.id }}</p>
          </div>
        </div>
        <div class="stats">
          <div class="stat-row">
            <span class="label">好感度 AFFECTION</span>
            <span class="value">{{ char.affection }}%</span>
          </div>
          <div class="stat-row">
            <span class="label">发情值 LUST</span>
            <span class="value">{{ char.lust }}%</span>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { CharacterData } from '../types';
import { readCharacters } from '../utils/variableReader';

interface CharacterCardView {
  id: string;
  name: string;
  role: string;
  status: string;
  lust: number;
  affection: number;
}

const characters = ref<CharacterCardView[]>([]);
const isLoading = ref(true);

const visibleCharacters = computed(() => {
  return characters.value || [];
});

function toDisplayName(name: unknown, fallback: string) {
  const n = String(name ?? '').trim();
  if (!n) return fallback;
  if (n === '未知' || n === '未命名') return fallback;
  return n;
}

async function loadCharacters() {
  isLoading.value = true;
  try {
    const list: CharacterData[] = await readCharacters();

    const cards: CharacterCardView[] = [];

    for (const c of list) {
      cards.push({
        id: c.id,
        name: toDisplayName((c as any).name, c.id),
        role: '角色',
        status: c.status === 'active' ? '出场中' : '暂时退场',
        lust: typeof (c as any).stats?.lust === 'number' ? (c as any).stats.lust : 0,
        affection: typeof (c as any).stats?.affection === 'number' ? (c as any).stats.affection : 0,
      });
    }

    characters.value = cards;
    console.log('✅ [CharacterList] 加载角色:', cards.length);
  } catch (e) {
    console.warn('加载角色列表失败', e);
    characters.value = [];
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadCharacters();

  // 监听消息更新事件，刷新数据
  if (typeof eventOn === 'function' && typeof tavern_events !== 'undefined') {
    eventOn(tavern_events.MESSAGE_UPDATED, () => {
      console.log('🔄 [CharacterList] 消息更新，刷新角色...');
      loadCharacters();
    });
  }
});

defineEmits<{
  (e: 'select', id: string): void;
  (e: 'openModal', type: string): void;
}>();
</script>

<style lang="scss" scoped>
.character-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 80px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .desc {
    font-size: 14px;
    color: #a1a1aa;
  }
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  background: rgba(255, 255, 255, 0.05);
  color: #e4e4e7;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

:global(.light) .action-btn {
  background: rgba(0, 0, 0, 0.05);
  color: #27272a;

  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }
}

.character-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.character-card {
  padding: 20px;
  border-radius: 16px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.2s;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);

  &:hover {
    border-color: rgba(255, 255, 255, 0.2);
  }

}

:global(.light) .character-card {
  border-color: rgba(0, 0, 0, 0.1);
  background: #fff;

  &:hover {
    border-color: rgba(0, 0, 0, 0.2);
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;

  .avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    color: #a1a1aa;
    transition: all 0.2s;

    i {
      font-size: 24px;
    }

    &:hover {
      color: #e4e4e7;
    }
  }

  .info {
    h4 {
      font-size: 16px;
      font-weight: 500;
      color: #f4f4f5;
      margin-bottom: 4px;
    }

    p {
      font-size: 12px;
      color: #71717a;
    }
  }
}

:global(.light) .card-header {
  .avatar {
    background: rgba(0, 0, 0, 0.05);
    color: #71717a;

    &.protagonist {
      background: rgba(0, 0, 0, 0.1);
      color: #18181b;
    }
  }

  .info h4 {
    color: #18181b;
  }
}

.stats {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .stat-row {
    display: flex;
    justify-content: space-between;
    font-size: 12px;

    .label {
      color: #71717a;
    }

    .value {
      color: #d4d4d8;
      font-family: monospace;
    }
  }
}

:global(.light) .stats .stat-row .value {
  color: #27272a;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 24px;
  color: #71717a;
  font-size: 14px;

  i {
    font-size: 20px;
  }
}

:global(.light) .loading-state {
  color: #a1a1aa;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  gap: 12px;

  i {
    font-size: 48px;
    color: #52525b;
    opacity: 0.5;
  }

  p {
    font-size: 16px;
    font-weight: 500;
    color: #e4e4e7;
    margin: 0;
  }

  .hint {
    font-size: 13px;
    color: #71717a;
    max-width: 280px;
  }
}

:global(.light) .empty-state {
  i {
    color: #a1a1aa;
  }

  p {
    color: #27272a;
  }

  .hint {
    color: #a1a1aa;
  }
}
</style>
