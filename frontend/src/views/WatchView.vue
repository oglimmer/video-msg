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

    // Check if still processing
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
  // Poll every 3 seconds
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
  <div class="watch-view">
    <h1>Watch Recording</h1>

    <div v-if="loading" class="loading">
      Loading recording...
    </div>

    <div v-else-if="error" class="error-message">
      <p>{{ error }}</p>
      <button @click="goToRecord" class="btn btn-back">
        Back to Recorder
      </button>
    </div>

    <div v-else-if="recording" class="recording-container">
      <!-- Processing Status Message -->
      <div v-if="recording.processingStatus === 'PROCESSING'" class="processing-message">
        <div class="spinner"></div>
        <h2>Processing Video...</h2>
        <p>Your video is being re-encoded to ensure optimal playback. This may take a minute.</p>
        <p class="info-text">The page will update automatically when processing is complete.</p>
      </div>

      <!-- Failed Status Message -->
      <div v-else-if="recording.processingStatus === 'FAILED'" class="error-message">
        <h2>Processing Failed</h2>
        <p>{{ recording.processingError || 'An error occurred while processing your video.' }}</p>
        <button @click="goToRecord" class="btn btn-back">
          Try Recording Again
        </button>
      </div>

      <!-- Video Player (only show when READY) -->
      <VideoPlayer v-else :uuid="uuid" />

      <div class="recording-info">
        <h2>Recording Details</h2>
        <div class="info-grid">
          <div class="info-item">
            <strong>Filename:</strong>
            <span>{{ recording.filename }}</span>
          </div>
          <div class="info-item">
            <strong>Size:</strong>
            <span>{{ formatFileSize(recording.fileSize) }}</span>
          </div>
          <div class="info-item">
            <strong>Type:</strong>
            <span>{{ recording.contentType }}</span>
          </div>
          <div class="info-item">
            <strong>Status:</strong>
            <span :class="`status-${recording.processingStatus.toLowerCase()}`">
              {{ recording.processingStatus }}
            </span>
          </div>
          <div class="info-item">
            <strong>Created:</strong>
            <span>{{ formatDate(recording.createdAt) }}</span>
          </div>
          <div class="info-item">
            <strong>UUID:</strong>
            <span class="uuid">{{ recording.uuid }}</span>
          </div>
        </div>
      </div>

      <div class="actions">
        <button @click="goToRecord" class="btn btn-back">
          Create New Recording
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.watch-view {
  padding: 40px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 32px;
}

h2 {
  color: #2c3e50;
  margin-bottom: 16px;
}

.loading {
  text-align: center;
  font-size: 18px;
  color: #666;
  padding: 60px 0;
}

.error-message {
  text-align: center;
  padding: 40px;
}

.error-message p {
  color: #c33;
  font-size: 18px;
  margin-bottom: 20px;
}

.recording-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.recording-info {
  background-color: #f8f9fa;
  padding: 24px;
  border-radius: 8px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item strong {
  color: #666;
  font-size: 14px;
}

.info-item span {
  color: #2c3e50;
  font-size: 16px;
}

.uuid {
  font-family: monospace;
  font-size: 14px;
}

.actions {
  text-align: center;
}

.btn {
  padding: 12px 32px;
  font-size: 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-weight: 500;
}

.btn-back {
  background-color: #42b983;
  color: white;
}

.btn-back:hover {
  background-color: #359268;
}

.processing-message {
  text-align: center;
  padding: 60px 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.processing-message h2 {
  color: white;
  margin-bottom: 16px;
}

.processing-message p {
  font-size: 16px;
  margin-bottom: 8px;
  opacity: 0.95;
}

.processing-message .info-text {
  font-size: 14px;
  opacity: 0.8;
  font-style: italic;
}

.spinner {
  width: 50px;
  height: 50px;
  margin: 0 auto 24px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.status-processing {
  color: #f39c12;
  font-weight: 600;
}

.status-ready {
  color: #27ae60;
  font-weight: 600;
}

.status-failed {
  color: #e74c3c;
  font-weight: 600;
}
</style>
