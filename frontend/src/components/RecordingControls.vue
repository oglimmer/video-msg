<script setup lang="ts">
import { ref } from 'vue'
import { useMediaRecorder } from '@/composables/useMediaRecorder'
import { useRecordingStore } from '@/stores/recording'

const emit = defineEmits<{
  recordingStopped: [blob: Blob]
}>()

const { isRecording, recordingTime, error, previewUrl, isBrowserSupported, startRecording, stopRecording, formatTime } = useMediaRecorder()
const recordingStore = useRecordingStore()
const isStopping = ref(false)

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

    <div v-if="previewUrl && !isRecording" class="mt-8">
      <h3 class="text-2xl font-bold text-gray-800 mb-4">Preview</h3>
      <div class="bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
        <video :src="previewUrl" controls class="w-full rounded-lg"></video>
      </div>
    </div>
  </div>
</template>
