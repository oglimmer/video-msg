<script setup lang="ts">
import { computed } from 'vue'
import { apiService } from '@/services/api'

const props = defineProps<{
  uuid: string
}>()

const streamUrl = computed(() => apiService.getStreamUrl(props.uuid))
</script>

<template>
  <div class="video-player">
    <video
      :src="streamUrl"
      controls
      class="player"
    >
      Your browser does not support the video tag.
    </video>
  </div>
</template>

<style scoped>
.video-player {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.player {
  width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background-color: #000;
}
</style>
