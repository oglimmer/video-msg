<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMediaRecorder } from '@/composables/useMediaRecorder'
import { useRecordingStore } from '@/stores/recording'
import WebcamPreview from '@/components/WebcamPreview.vue'

const emit = defineEmits<{
  recordingStopped: [blob: Blob]
}>()

const {
  isRecording,
  recordingTime,
  error,
  previewUrl,
  isBrowserSupported,
  startRecording,
  stopRecording,
  formatTime,
  webcamEnabled,
  webcamStream,
  toggleWebcam,
  initWebcam,
  setWebcamLayout
} = useMediaRecorder()
const recordingStore = useRecordingStore()
const isStopping = ref(false)
const currentLayoutMode = ref<'tl' | 'tr' | 'bl' | 'br' | 'center'>('bl')

onMounted(async () => {
  if (webcamEnabled.value) {
    await initWebcam()
  }
})

function setLayout(mode: 'tl' | 'tr' | 'bl' | 'br' | 'center') {
  currentLayoutMode.value = mode
  
  // Update recording compositor
  // Coordinates are normalized (0.0 - 1.0)
  // Size is normalized radius relative to min(width, height)
  let layout = { x: 0.1, y: 0.9, size: 0.09 } // Default BL

  switch (mode) {
    case 'tl':
      layout = { x: 0.1, y: 0.15, size: 0.09 }
      break
    case 'tr':
      layout = { x: 0.9, y: 0.15, size: 0.09 }
      break
    case 'bl':
      layout = { x: 0.1, y: 0.85, size: 0.09 }
      break
    case 'br':
      layout = { x: 0.9, y: 0.85, size: 0.09 }
      break
    case 'center':
      layout = { x: 0.5, y: 0.5, size: 0.27 } // Large size for focus
      break
  }
  
  setWebcamLayout(layout)
}

async function handleStart() {
  try {
    await startRecording()
  } catch (err) {
    console.error('Failed to start recording:', err)
  }
}

async function handleStop() {
  if (isStopping.value) return // Prevent double-click

  isStopping.value = true
  try {
    const blob = await stopRecording()
    recordingStore.setCurrentRecording(blob)
    emit('recordingStopped', blob)
  } catch (err) {
    console.error('Failed to stop recording:', err)
  } finally {
    isStopping.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto p-6">
    <div v-if="!isBrowserSupported" class="bg-amber-50 border-2 border-amber-300 text-amber-900 px-6 py-5 rounded-xl mb-6">
      <div class="flex items-start gap-3">
        <svg class="w-6 h-6 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <div>
          <h3 class="font-bold text-lg mb-1">Browser Not Supported</h3>
          <p class="text-sm">{{ error }}</p>
        </div>
      </div>
    </div>

    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6">
      {{ error }}
    </div>

    <!-- Webcam toggle and Layout Controls -->
    <div v-if="isBrowserSupported && !previewUrl" class="flex flex-col items-center gap-4 mb-6">
      <button
        @click="toggleWebcam"
        class="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200"
        :class="webcamEnabled
          ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 ring-1 ring-indigo-300'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200 ring-1 ring-gray-300'"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path v-if="webcamEnabled" stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9.75a2.25 2.25 0 002.25-2.25V7.5a2.25 2.25 0 00-2.25-2.25H4.5A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
          <path v-else stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 01-2.25-2.25V9m12.841 9.091L16.5 19.5m-1.409-.591l-6.341-6.34M2.25 7.5l14.5 14.5" />
        </svg>
        {{ webcamEnabled ? 'Camera On' : 'Camera Off' }}
      </button>

      <!-- Layout Controls -->
      <div v-if="webcamEnabled" class="flex items-center gap-3 p-2 bg-gray-100 rounded-xl">
        <button 
          @click="setLayout('tl')" 
          title="Top Left"
          class="p-3 rounded-lg shadow-sm transition-all duration-200"
          :class="currentLayoutMode === 'tl' ? 'bg-indigo-600 text-white shadow-md scale-105' : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-indigo-600'"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h6v6H3V3z" /></svg>
        </button>
        <button 
          @click="setLayout('tr')" 
          title="Top Right"
          class="p-3 rounded-lg shadow-sm transition-all duration-200"
          :class="currentLayoutMode === 'tr' ? 'bg-indigo-600 text-white shadow-md scale-105' : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-indigo-600'"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 3h6v6h-6V3z" /></svg>
        </button>
        <button 
          @click="setLayout('center')" 
          title="Focus Center"
          class="p-3 rounded-lg shadow-sm transition-all duration-200"
          :class="currentLayoutMode === 'center' ? 'bg-indigo-600 text-white shadow-md scale-105' : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-indigo-600'"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4h16v16H4V4z M9 9h6v6H9V9z" /></svg>
        </button>
        <button 
          @click="setLayout('bl')" 
          title="Bottom Left"
          class="p-3 rounded-lg shadow-sm transition-all duration-200"
          :class="currentLayoutMode === 'bl' ? 'bg-indigo-600 text-white shadow-md scale-105' : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-indigo-600'"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15h6v6H3v-6z" /></svg>
        </button>
        <button 
          @click="setLayout('br')" 
          title="Bottom Right"
          class="p-3 rounded-lg shadow-sm transition-all duration-200"
          :class="currentLayoutMode === 'br' ? 'bg-indigo-600 text-white shadow-md scale-105' : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-indigo-600'"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15h6v6h-6v-6z" /></svg>
        </button>
      </div>
    </div>

    <div class="flex flex-col items-center gap-6 mb-8">
      <button
        v-if="!isRecording"
        @click="handleStart"
        :disabled="!isBrowserSupported"
        class="group relative px-12 py-5 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:from-gray-400 disabled:to-gray-500"
      >
        <span class="flex items-center gap-3">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
          </svg>
          Start Recording
        </span>
      </button>

      <div v-else class="flex flex-col items-center gap-6">
        <div class="flex items-center gap-3 bg-white px-8 py-4 rounded-2xl shadow-lg border border-red-200">
          <span class="relative flex h-4 w-4">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
          </span>
          <span class="text-3xl font-bold font-mono text-gray-800 tabular-nums">{{ formatTime(recordingTime) }}</span>
        </div>
        <button
          @click="handleStop"
          :disabled="isStopping"
          class="px-12 py-5 bg-gradient-to-r from-red-500 to-rose-600 text-white text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <span class="flex items-center gap-3">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
            {{ isStopping ? 'Stopping...' : 'Stop Recording' }}
          </span>
        </button>
      </div>
    </div>

    <!-- Webcam live preview bubble (shown when webcam is on) -->
    <WebcamPreview :stream="webcamStream" />

    <div v-if="previewUrl && !isRecording" class="mt-8">
      <h3 class="text-2xl font-bold text-gray-800 mb-4">Preview</h3>
      <div class="bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
        <video :src="previewUrl" controls class="w-full rounded-lg"></video>
      </div>
    </div>
  </div>
</template>
