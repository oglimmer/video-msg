<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import RecordingControls from '@/components/RecordingControls.vue'
import { useRecordingStore } from '@/stores/recording'

const router = useRouter()
const recordingStore = useRecordingStore()

const showUploadSection = ref(false)
const shareLink = ref('')

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
    .then(() => alert('Link copied to clipboard!'))
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
  <div class="max-w-5xl mx-auto px-6 py-12">
    <div class="text-center mb-12">
      <h1 class="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
        Screen Recording Tool
      </h1>
      <p class="text-gray-600 text-lg">Record your screen with audio commentary and share instantly</p>
    </div>

    <RecordingControls @recording-stopped="handleRecordingStopped" />

    <div v-if="showUploadSection && !recordingStore.uploadedUuid" class="mt-8 text-center">
      <button
        @click="uploadRecording"
        :disabled="recordingStore.isUploading"
        class="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {{ recordingStore.isUploading ? 'Uploading...' : 'Upload Recording' }}
      </button>

      <div v-if="recordingStore.isUploading" class="mt-6 max-w-md mx-auto">
        <div class="w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
          <div
            class="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out rounded-full"
            :style="{ width: recordingStore.uploadProgress + '%' }"
          ></div>
        </div>
        <p class="mt-3 text-gray-700 font-medium">Uploading... {{ recordingStore.uploadProgress }}%</p>
      </div>

      <div v-if="recordingStore.error" class="mt-6 max-w-md mx-auto bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
        {{ recordingStore.error }}
      </div>
    </div>

    <div v-if="shareLink" class="mt-12 bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <div class="text-center mb-6">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-4">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h2 class="text-3xl font-bold text-gray-800">Recording Uploaded Successfully!</h2>
      </div>

      <div class="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          :value="shareLink"
          readonly
          class="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          @click="copyToClipboard"
          class="px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors duration-200 whitespace-nowrap shadow-md hover:shadow-lg"
        >
          Copy Link
        </button>
      </div>

      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          @click="watchRecording"
          class="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          Watch Recording
        </button>
        <button
          @click="startNewRecording"
          class="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          Start New Recording
        </button>
      </div>
    </div>
  </div>
</template>
