<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VideoPlayer from '@/components/VideoPlayer.vue'
import { apiService } from '@/services/api'
import { ProcessingStatus, type RecordingDetailResponse } from '@/types/recording'

const route = useRoute()
const router = useRouter()

const uuid = ref(route.params.uuid as string)
const recording = ref<RecordingDetailResponse | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const isProcessing = ref(false)
let pollingInterval: number | null = null

async function loadRecording() {
  try {
    loading.value = true
    recording.value = await apiService.getRecordingMetadata(uuid.value)

    if (recording.value.processingStatus === ProcessingStatus.PROCESSING) {
      isProcessing.value = true
      startPolling()
    } else {
      isProcessing.value = false
      stopPolling()
    }

    error.value = null
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load recording'
    stopPolling()
  } finally {
    loading.value = false
  }
}

function startPolling() {
  if (!pollingInterval) {
    pollingInterval = window.setInterval(async () => {
      try {
        const updatedRecording = await apiService.getRecordingMetadata(uuid.value)
        recording.value = updatedRecording

        if (updatedRecording.processingStatus !== ProcessingStatus.PROCESSING) {
          isProcessing.value = false
          stopPolling()
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }, 3000)
  }
}

function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval)
    pollingInterval = null
  }
}

onMounted(() => {
  loadRecording()
})

onUnmounted(() => {
  stopPolling()
})

function goToRecord() {
  router.push('/record')
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString()
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-6 py-12 min-h-screen">
    <!-- Back nav -->
    <nav class="mb-8 animate-fade-up">
      <button
        @click="goToRecord"
        class="group flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors text-sm font-display font-semibold cursor-pointer"
      >
        <svg class="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        New Recording
      </button>
    </nav>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-32 animate-fade-in">
      <div class="w-10 h-10 border-2 border-border-subtle border-t-accent rounded-full animate-spin mb-4"></div>
      <p class="text-text-muted text-sm font-display">Loading recording...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex flex-col items-center justify-center py-32 animate-fade-up">
      <div class="w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center mb-5">
        <svg class="w-6 h-6 text-danger" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <p class="text-danger text-base font-display font-semibold mb-2">Something went wrong</p>
      <p class="text-text-muted text-sm mb-6">{{ error }}</p>
      <button
        @click="goToRecord"
        class="px-6 py-3 bg-surface-overlay border border-border-subtle hover:border-accent/40 text-text-primary font-display font-semibold text-sm rounded-lg transition-all duration-200 cursor-pointer"
      >
        Back to Recorder
      </button>
    </div>

    <!-- Content -->
    <div v-else-if="recording" class="flex flex-col gap-6">
      <!-- Processing -->
      <div v-if="recording.processingStatus === 'PROCESSING'" class="animate-fade-up">
        <div class="bg-surface-raised border border-border-subtle rounded-2xl p-12 text-center">
          <div class="w-12 h-12 border-2 border-border-subtle border-t-accent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 class="font-display font-bold text-2xl text-text-primary mb-3">Processing your video</h2>
          <p class="text-text-secondary text-sm mb-2">Re-encoding for optimal playback. This may take a minute.</p>
          <p class="text-text-muted text-xs">This page updates automatically.</p>
          <!-- Animated bar -->
          <div class="mt-8 w-full h-0.5 bg-surface-overlay rounded-full overflow-hidden">
            <div class="h-full w-1/3 bg-accent/60 rounded-full" style="animation: processing-bar 2s ease-in-out infinite;"></div>
          </div>
        </div>
      </div>

      <!-- Failed -->
      <div v-else-if="recording.processingStatus === 'FAILED'" class="animate-fade-up">
        <div class="bg-surface-raised border border-danger/20 rounded-2xl p-12 text-center">
          <div class="w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-5">
            <svg class="w-6 h-6 text-danger" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 class="font-display font-bold text-2xl text-text-primary mb-3">Processing Failed</h2>
          <p class="text-danger text-sm mb-6">{{ recording.processingError || 'An error occurred while processing your video.' }}</p>
          <button
            @click="goToRecord"
            class="px-6 py-3 bg-surface-overlay border border-border-subtle hover:border-accent/40 text-text-primary font-display font-semibold text-sm rounded-lg transition-all duration-200 cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>

      <!-- Video player -->
      <div v-else class="animate-fade-up">
        <VideoPlayer :uuid="uuid" />
      </div>

      <!-- Recording details -->
      <div class="bg-surface-raised border border-border-subtle rounded-xl p-6 animate-fade-up delay-2">
        <div class="flex items-center justify-between mb-5">
          <h2 class="font-display font-bold text-base text-text-primary">Details</h2>
          <span
            class="px-2.5 py-1 rounded-md text-xs font-display font-bold uppercase tracking-wider"
            :class="{
              'bg-warning/10 text-warning': recording.processingStatus === 'PROCESSING',
              'bg-success/10 text-success': recording.processingStatus === 'READY',
              'bg-danger/10 text-danger': recording.processingStatus === 'FAILED'
            }"
          >
            {{ recording.processingStatus }}
          </span>
        </div>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <div>
            <span class="text-text-muted text-xs font-display font-semibold uppercase tracking-wider block mb-1">Filename</span>
            <span class="text-text-secondary text-sm truncate block">{{ recording.filename }}</span>
          </div>
          <div>
            <span class="text-text-muted text-xs font-display font-semibold uppercase tracking-wider block mb-1">Size</span>
            <span class="text-text-secondary text-sm">{{ formatFileSize(recording.fileSize) }}</span>
          </div>
          <div>
            <span class="text-text-muted text-xs font-display font-semibold uppercase tracking-wider block mb-1">Type</span>
            <span class="text-text-secondary text-sm">{{ recording.contentType }}</span>
          </div>
          <div>
            <span class="text-text-muted text-xs font-display font-semibold uppercase tracking-wider block mb-1">Created</span>
            <span class="text-text-secondary text-sm">{{ formatDate(recording.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
