<script setup lang="ts">
import { computed } from 'vue'
import { apiService } from '@/services/api'

const props = defineProps<{
  uuid: string
}>()

const streamUrl = computed(() => apiService.getStreamUrl(props.uuid))
</script>

<template>
  <div class="w-full">
    <div class="viewfinder bg-surface-raised rounded-xl overflow-hidden border border-border-subtle">
      <video
        :src="streamUrl"
        controls
        class="w-full h-auto block bg-black"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  </div>
</template>
