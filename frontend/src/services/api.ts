import type { RecordingResponse, RecordingDetailResponse } from '@/types/recording'

class ApiService {
  private baseURL: string

  constructor() {
    // Dynamic base URL based on environment
    if (import.meta.env.VITE_API_BASE_URL) {
      // Use explicit environment variable if set
      this.baseURL = import.meta.env.VITE_API_BASE_URL
    } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // Development mode: connect to local backend
      this.baseURL = 'http://localhost:8080/api'
    } else {
      // Production mode: use same protocol, host, and port with /api path
      this.baseURL = `${window.location.protocol}//${window.location.host}/api`
    }
  }

  async uploadRecording(blob: Blob, filename: string = 'recording.webm'): Promise<RecordingResponse> {
    const formData = new FormData()
    formData.append('video', blob, filename)

    const response = await fetch(`${this.baseURL}/recordings`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Upload failed: ${response.status} - ${errorText}`)
    }

    return response.json()
  }

  async getRecordingMetadata(uuid: string): Promise<RecordingDetailResponse> {
    const response = await fetch(`${this.baseURL}/recordings/${uuid}`)

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Recording not found')
      }
      const errorText = await response.text()
      throw new Error(`Failed to fetch recording: ${response.status} - ${errorText}`)
    }

    return response.json()
  }

  getStreamUrl(uuid: string): string {
    return `${this.baseURL}/recordings/${uuid}/stream`
  }
}

export const apiService = new ApiService()
