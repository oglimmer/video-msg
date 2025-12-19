<script setup lang="ts">
import { ref } from 'vue'
import { useMediaRecorder } from '@/composables/useMediaRecorder'
import { useRecordingStore } from '@/stores/recording'

const emit = defineEmits<{
  recordingStopped: [blob: Blob]
}>()

const { isRecording, recordingTime, error, previewUrl, startRecording, stopRecording, formatTime } = useMediaRecorder()
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
  <div class="recording-controls">
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div class="controls-section">
      <button
        v-if="!isRecording"
        @click="handleStart"
        class="btn btn-start"
      >
        Start Recording
      </button>

      <div v-else class="recording-active">
        <div class="recording-indicator">
          <span class="recording-dot"></span>
          <span class="recording-time">{{ formatTime(recordingTime) }}</span>
        </div>
        <button
          @click="handleStop"
          :disabled="isStopping"
          class="btn btn-stop"
        >
          {{ isStopping ? 'Stopping...' : 'Stop Recording' }}
        </button>
      </div>
    </div>

    <div v-if="previewUrl && !isRecording" class="preview-section">
      <h3>Preview</h3>
      <video :src="previewUrl" controls class="preview-video"></video>
    </div>
  </div>
</template>

<style scoped>
.recording-controls {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.error-message {
  background-color: #fee;
  color: #c33;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 16px;
}

.controls-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
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

.btn-start {
  background-color: #42b983;
  color: white;
}

.btn-start:hover {
  background-color: #359268;
}

.btn-stop {
  background-color: #e53935;
  color: white;
}

.btn-stop:hover {
  background-color: #c62828;
}

.recording-active {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.recording-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 24px;
  font-weight: bold;
}

.recording-dot {
  width: 12px;
  height: 12px;
  background-color: #e53935;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

.recording-time {
  font-family: 'Courier New', monospace;
  color: #333;
}

.preview-section {
  margin-top: 32px;
}

.preview-section h3 {
  margin-bottom: 12px;
  color: #333;
}

.preview-video {
  width: 100%;
  max-width: 100%;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
