<template>
  <div class="character-panel">
    <Transition name="slide" mode="out-in">
      <CharacterDetail
        v-if="selectedCharacter"
        :character-id="selectedCharacter"
        @back="selectedCharacter = null"
        @open-modal="$emit('openModal', $event)"
      />
      <CharacterList
        v-else
        @select="selectedCharacter = $event"
        @open-modal="$emit('openModal', $event)"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CharacterList from './CharacterList.vue';
import CharacterDetail from './CharacterDetail.vue';

const selectedCharacter = ref<string | null>(null);

defineEmits<{
  (e: 'openModal', type: string): void;
}>();
</script>

<style lang="scss" scoped>
.character-panel {
  position: relative;
  min-height: 400px;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
