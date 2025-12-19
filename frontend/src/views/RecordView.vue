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
  <div class="record-view">
    <h1>Video Message Recorder</h1>

    <RecordingControls @recording-stopped="handleRecordingStopped" />

    <div v-if="showUploadSection && !recordingStore.uploadedUuid" class="upload-section">
      <button
        @click="uploadRecording"
        :disabled="recordingStore.isUploading"
        class="btn btn-upload"
      >
        {{ recordingStore.isUploading ? 'Uploading...' : 'Upload Recording' }}
      </button>

      <div v-if="recordingStore.isUploading" class="upload-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: recordingStore.uploadProgress + '%' }"></div>
        </div>
        <p>Uploading... {{ recordingStore.uploadProgress }}%</p>
      </div>

      <div v-if="recordingStore.error" class="error-message">
        {{ recordingStore.error }}
      </div>
    </div>

    <div v-if="shareLink" class="share-section">
      <h2>Recording Uploaded Successfully!</h2>

      <div class="share-link-container">
        <input
          type="text"
          :value="shareLink"
          readonly
          class="share-link-input"
        />
        <button @click="copyToClipboard" class="btn btn-copy">
          Copy Link
        </button>
      </div>

      <div class="action-buttons">
        <button @click="watchRecording" class="btn btn-watch">
          Watch Recording
        </button>
        <button @click="startNewRecording" class="btn btn-new">
          Start New Recording
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.record-view {
  padding: 40px 20px;
  max-width: 900px;
  margin: 0 auto;
}

h1 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 32px;
}

h2 {
  color: #42b983;
  margin-bottom: 20px;
}

.upload-section {
  margin-top: 32px;
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

.btn-upload {
  background-color: #3498db;
  color: white;
}

.btn-upload:hover:not(:disabled) {
  background-color: #2980b9;
}

.btn-upload:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.upload-progress {
  margin-top: 20px;
}

.progress-bar {
  width: 100%;
  height: 24px;
  background-color: #ecf0f1;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background-color: #3498db;
  transition: width 0.3s;
}

.error-message {
  background-color: #fee;
  color: #c33;
  padding: 12px;
  border-radius: 4px;
  margin-top: 16px;
}

.share-section {
  margin-top: 40px;
  padding: 24px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.share-link-container {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.share-link-input {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: monospace;
}

.btn-copy {
  background-color: #95a5a6;
  color: white;
}

.btn-copy:hover {
  background-color: #7f8c8d;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-watch {
  background-color: #42b983;
  color: white;
}

.btn-watch:hover {
  background-color: #359268;
}

.btn-new {
  background-color: #e67e22;
  color: white;
}

.btn-new:hover {
  background-color: #d35400;
}
</style>
