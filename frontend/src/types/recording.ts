export enum ProcessingStatus {
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  FAILED = 'FAILED'
}

export interface RecordingResponse {
  uuid: string
  filename: string
  fileSize: number
  contentType: string
  processingStatus: ProcessingStatus
  createdAt: string
}

export interface RecordingDetailResponse extends RecordingResponse {
  duration: number | null
  processingError: string | null
}
