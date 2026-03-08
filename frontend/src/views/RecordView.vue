<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import RecordingControls from '@/components/RecordingControls.vue'
import { useRecordingStore } from '@/stores/recording'

const router = useRouter()
const recordingStore = useRecordingStore()

const showUploadSection = ref(false)
const shareLink = ref('')
const copied = ref(false)

const isComplete = computed(() => !!shareLink.value)

async function handleRecordingStopped(_blob: Blob) {
  showUploadSection.value = true
}

async function uploadRecording() {
  const blob = recordingStore.currentRecording
  if (!blob) return

  try {
    const uuid = await recordingStore.uploadRecording(blob)
    const baseUrl = window.location.origin
    shareLink.value = `${baseUrl}/watch/${uuid}`
  } catch (err) {
    console.error('Upload failed:', err)
  }
}

function copyToClipboard() {
  navigator.clipboard.writeText(shareLink.value)
    .then(() => {
      copied.value = true
      setTimeout(() => (copied.value = false), 2000)
    })
    .catch(err => console.error('Failed to copy:', err))
}

function watchRecording() {
  if (recordingStore.uploadedUuid) {
    router.push(`/watch/${recordingStore.uploadedUuid}`)
  }
}

function startNewRecording() {
  recordingStore.clearRecording()
  shareLink.value = ''
  showUploadSection.value = false
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-6 py-16 min-h-screen flex flex-col">
    <!-- Header -->
    <header class="text-center mb-16 animate-fade-up">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-overlay border border-border-subtle mb-6">
        <span class="w-1.5 h-1.5 rounded-full bg-accent"></span>
        <span class="text-xs font-display font-semibold text-text-secondary uppercase tracking-widest">Screen + Audio</span>
      </div>
      <h1 class="font-display text-5xl sm:text-6xl font-extrabold text-text-primary tracking-tight leading-none mb-4">
        Record.<br>
        <span class="text-text-muted">Comment.</span><br>
        <span class="text-accent">Share.</span>
      </h1>
    </header>

    <!-- Recording controls -->
    <div class="flex-1 flex flex-col items-center justify-start">
      <RecordingControls @recording-stopped="handleRecordingStopped" />

      <!-- Upload section -->
      <div v-if="showUploadSection && !isComplete" class="mt-10 flex flex-col items-center gap-6 animate-fade-up">
        <button
          @click="uploadRecording"
          :disabled="recordingStore.isUploading"
          class="group flex items-center gap-3 px-8 py-4 bg-accent hover:bg-accent-hover text-white font-display font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_var(--color-accent-glow)] hover:shadow-[0_0_40px_var(--color-accent-glow)] cursor-pointer"
        >
          <svg v-if="!recordingStore.isUploading" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
          </svg>
          <svg v-else class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          {{ recordingStore.isUploading ? 'Uploading...' : 'Upload & Share' }}
        </button>

        <!-- Progress bar -->
        <div v-if="recordingStore.isUploading" class="w-full max-w-sm">
          <div class="w-full h-1 bg-surface-overlay rounded-full overflow-hidden">
            <div
              class="h-full bg-accent transition-all duration-300 ease-out rounded-full"
              :style="{ width: recordingStore.uploadProgress + '%' }"
            ></div>
          </div>
          <p class="mt-2 text-text-muted text-xs text-center font-mono tabular-nums">{{ recordingStore.uploadProgress }}%</p>
        </div>

        <!-- Error -->
        <div v-if="recordingStore.error" class="w-full max-w-sm bg-surface-overlay border border-danger/30 text-danger px-5 py-3 rounded-xl text-sm">
          {{ recordingStore.error }}
        </div>
      </div>

      <!-- Success / Share section -->
      <div v-if="isComplete" class="mt-10 w-full animate-fade-up">
        <div class="bg-surface-raised border border-border-subtle rounded-2xl p-8">
          <!-- Success indicator -->
          <div class="flex items-center gap-3 mb-6">
            <span class="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
              <svg class="w-4 h-4 text-success" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </span>
            <h2 class="font-display font-bold text-xl text-text-primary">Ready to share</h2>
          </div>

          <!-- Share link -->
          <div class="flex gap-2 mb-6">
            <input
              type="text"
              :value="shareLink"
              readonly
              class="flex-1 px-4 py-3 bg-surface-overlay border border-border-subtle rounded-lg text-text-secondary text-sm font-mono focus:outline-none focus:border-accent/50 transition-colors"
            />
            <button
              @click="copyToClipboard"
              class="px-5 py-3 bg-surface-overlay border border-border-subtle hover:border-accent/40 text-text-primary text-sm font-display font-semibold rounded-lg transition-all duration-200 whitespace-nowrap cursor-pointer"
            >
              {{ copied ? 'Copied!' : 'Copy' }}
            </button>
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              @click="watchRecording"
              class="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white font-display font-bold text-sm rounded-lg transition-all duration-200 cursor-pointer"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Watch
            </button>
            <button
              @click="startNewRecording"
              class="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-surface-overlay border border-border-subtle hover:border-text-muted text-text-secondary hover:text-text-primary font-display font-semibold text-sm rounded-lg transition-all duration-200 cursor-pointer"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New Recording
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="text-center mt-16 animate-fade-in delay-5">
      <p class="text-text-muted text-xs tracking-wide">Screen + Mic recording in your browser. Nothing leaves your device until you hit upload.</p>
    </footer>
  </div>
</template>
