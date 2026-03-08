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
  if (isStopping.value) return

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
  <div>
    <!-- Browser not supported -->
    <div v-if="!isBrowserSupported" class="bg-surface-overlay border border-warning/30 text-warning px-6 py-5 rounded-xl mb-8 animate-fade-up">
      <div class="flex items-start gap-3">
        <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <div>
          <h3 class="font-display font-bold text-base mb-1">Browser Not Supported</h3>
          <p class="text-sm text-text-secondary">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-surface-overlay border border-danger/30 text-danger px-6 py-4 rounded-xl mb-8 animate-fade-up">
      {{ error }}
    </div>

    <!-- Main recording area -->
    <div class="flex flex-col items-center gap-8">
      <!-- Idle state: big record button -->
      <div v-if="!isRecording && !previewUrl" class="flex flex-col items-center gap-6 animate-fade-up">
        <button
          @click="handleStart"
          :disabled="!isBrowserSupported"
          class="group relative w-40 h-40 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <!-- Outer ring -->
          <span class="absolute inset-0 rounded-full border-2 border-accent/30 group-hover:border-accent/60 transition-colors duration-300"></span>
          <!-- Inner circle -->
          <span class="w-24 h-24 rounded-full bg-accent group-hover:bg-accent-hover transition-all duration-300 group-hover:scale-110 group-active:scale-95 flex items-center justify-center shadow-[0_0_30px_var(--color-accent-glow)]">
            <svg class="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="8" />
            </svg>
          </span>
        </button>
        <p class="text-text-muted text-sm tracking-wide uppercase font-display font-semibold">Click to record</p>
      </div>

      <!-- Recording state -->
      <div v-if="isRecording" class="flex flex-col items-center gap-8 animate-fade-up">
        <!-- Animated recording indicator -->
        <div class="relative w-40 h-40 flex items-center justify-center">
          <span class="absolute inset-0 rounded-full border-2 border-accent/40 animate-glow-pulse"></span>
          <span class="absolute inset-3 rounded-full border border-accent/20"></span>
          <div class="flex flex-col items-center gap-2">
            <span class="relative flex h-3 w-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
            </span>
            <span class="text-3xl font-display font-bold text-text-primary tabular-nums tracking-tight">{{ formatTime(recordingTime) }}</span>
            <span class="text-xs text-accent font-semibold uppercase tracking-widest">Recording</span>
          </div>
        </div>

        <button
          @click="handleStop"
          :disabled="isStopping"
          class="group flex items-center gap-3 px-8 py-4 bg-surface-overlay border border-border-subtle hover:border-accent/50 text-text-primary rounded-xl transition-all duration-200 hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <span class="w-4 h-4 rounded-sm bg-accent group-hover:bg-accent-hover transition-colors"></span>
          <span class="font-display font-semibold text-sm tracking-wide">{{ isStopping ? 'Stopping...' : 'Stop Recording' }}</span>
        </button>
      </div>

      <!-- Preview -->
      <div v-if="previewUrl && !isRecording" class="w-full animate-fade-up delay-1">
        <div class="flex items-center gap-2 mb-4">
          <span class="w-1.5 h-1.5 rounded-full bg-success"></span>
          <h3 class="font-display font-bold text-text-primary text-lg">Preview</h3>
        </div>
        <div class="viewfinder bg-surface-raised rounded-xl overflow-hidden border border-border-subtle">
          <video :src="previewUrl" controls class="w-full block"></video>
        </div>
      </div>
    </div>
  </div>
</template>
