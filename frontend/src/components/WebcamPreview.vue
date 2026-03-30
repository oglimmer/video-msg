<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const props = defineProps<{
  stream: MediaStream | null
}>()

const videoEl = ref<HTMLVideoElement>()

function attachStream() {
  if (videoEl.value) {
    videoEl.value.srcObject = props.stream || null
  }
}

watch(() => props.stream, attachStream, { flush: 'post' })

onMounted(() => {
  attachStream()
})
</script>

<template>
  <div v-if="stream" 
    class="fixed bottom-8 right-8 z-50 rounded-full shadow-2xl overflow-hidden border-4 border-white ring-2 ring-black/10 bg-black w-36 h-36"
  >
    <video
      ref="videoEl"
      autoplay
      playsinline
      muted
      class="w-full h-full object-cover pointer-events-none"
      style="transform: scaleX(-1)"
    />
  </div>
</template>
