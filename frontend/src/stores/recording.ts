import { ref } from 'vue'
import { defineStore } from 'pinia'
import { apiService } from '@/services/api'

export const useRecordingStore = defineStore('recording', () => {
  const currentRecording = ref<Blob | null>(null)
  const uploadProgress = ref(0)
  const uploadedUuid = ref<string | null>(null)
  const isUploading = ref(false)
  const error = ref<string | null>(null)

  async function uploadRecording(blob: Blob, filename: string = 'recording.webm'): Promise<string> {
    isUploading.value = true
    error.value = null
    uploadProgress.value = 0

    try {
      const response = await apiService.uploadRecording(blob, filename)
      uploadedUuid.value = response.uuid
      uploadProgress.value = 100
      return response.uuid
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Upload failed'
      throw err
    } finally {
      isUploading.value = false
    }
  }

  function setCurrentRecording(blob: Blob) {
    currentRecording.value = blob
  }

  function clearRecording() {
    currentRecording.value = null
    uploadedUuid.value = null
    uploadProgress.value = 0
    error.value = null
  }

  function setError(message: string) {
    error.value = message
  }

  return {
    currentRecording,
    uploadProgress,
    uploadedUuid,
    isUploading,
    error,
    uploadRecording,
    setCurrentRecording,
    clearRecording,
    setError
  }
})
