import { ref, onUnmounted } from 'vue'

export function useMediaRecorder() {
  const isRecording = ref(false)
  const recordingTime = ref(0)
  const error = ref<string | null>(null)
  const previewUrl = ref<string | null>(null)
  const isBrowserSupported = ref(true)

  let mediaRecorder: MediaRecorder | null = null
  let chunks: Blob[] = []
  let mediaStream: MediaStream | null = null
  let timerInterval: number | null = null
  let stopResolve: ((blob: Blob) => void) | null = null
  let stopReject: ((error: Error) => void) | null = null
  let audioContext: AudioContext | null = null
  let audioDestination: MediaStreamAudioDestinationNode | null = null

  // Check browser support on initialization
  function checkBrowserSupport(): { supported: boolean; message: string | null } {
    // Check if navigator.mediaDevices is available
    if (!navigator.mediaDevices) {
      return {
        supported: false,
        message: 'Your browser does not support media devices API. Please use a modern desktop browser like Chrome, Firefox, or Edge.'
      }
    }

    // Check if getDisplayMedia is available (not supported on mobile)
    if (!navigator.mediaDevices.getDisplayMedia) {
      return {
        supported: false,
        message: 'Screen recording is not supported on this device. Please use a desktop browser like Chrome, Firefox, or Edge.'
      }
    }

    // Check if MediaRecorder is available
    if (typeof MediaRecorder === 'undefined') {
      return {
        supported: false,
        message: 'MediaRecorder API is not supported in your browser. Please update your browser or try a different one.'
      }
    }

    return { supported: true, message: null }
  }

  // Run the check on initialization
  const browserCheck = checkBrowserSupport()
  isBrowserSupported.value = browserCheck.supported
  if (!browserCheck.supported && browserCheck.message) {
    error.value = browserCheck.message
  }

  async function startRecording() {
    // Prevent recording if browser is not supported
    if (!isBrowserSupported.value) {
      throw new Error('Browser does not support screen recording')
    }

    try {
      error.value = null
      chunks = []

      // Request screen capture (video + system audio if available)
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      })

      console.log('Display stream tracks:', {
        video: displayStream.getVideoTracks().length,
        audio: displayStream.getAudioTracks().length
      })

      // Request microphone audio for narration
      let micStream: MediaStream | null = null
      try {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false
        })
        console.log('Microphone stream tracks:', {
          audio: micStream.getAudioTracks().length
        })
      } catch (micError) {
        console.warn('Could not access microphone:', micError)
        // Continue without microphone
      }

      // Use Web Audio API to mix audio tracks
      const hasSystemAudio = displayStream.getAudioTracks().length > 0
      const hasMicAudio = micStream !== null

      let finalAudioStream: MediaStream | null = null

      if (hasSystemAudio || hasMicAudio) {
        // Create audio context to mix audio sources
        audioContext = new AudioContext()
        audioDestination = audioContext.createMediaStreamDestination()

        // Add system audio to the mix
        if (hasSystemAudio) {
          const systemAudioSource = audioContext.createMediaStreamSource(displayStream)
          systemAudioSource.connect(audioDestination)
          console.log('Connected system audio to mixer')
        }

        // Add microphone audio to the mix
        if (hasMicAudio && micStream) {
          const micAudioSource = audioContext.createMediaStreamSource(micStream)
          micAudioSource.connect(audioDestination)
          console.log('Connected microphone audio to mixer')
        }

        finalAudioStream = audioDestination.stream
        console.log('Mixed audio stream created')
      }

      // Combine video and mixed audio into final stream
      mediaStream = new MediaStream()

      // Add video track from display
      displayStream.getVideoTracks().forEach(track => {
        mediaStream!.addTrack(track)
      })

      // Add mixed audio track
      if (finalAudioStream) {
        finalAudioStream.getAudioTracks().forEach(track => {
          mediaStream!.addTrack(track)
          console.log('Added mixed audio track')
        })
      }

      console.log('Final MediaStream tracks:', {
        video: mediaStream.getVideoTracks().length,
        audio: mediaStream.getAudioTracks().length
      })

      // Check for supported MIME type
      const mimeType = getSupportedMimeType()
      console.log('Using MIME type:', mimeType)
      if (!mimeType) {
        throw new Error('No supported video MIME type found')
      }

      // Create MediaRecorder
      // Try without specifying mimeType to use browser default
      try {
        mediaRecorder = new MediaRecorder(mediaStream)
        console.log('MediaRecorder created with default mimeType:', mediaRecorder.mimeType)
      } catch (_e) {
        console.log('Failed to create with default, trying explicit mimeType:', mimeType)
        mediaRecorder = new MediaRecorder(mediaStream, { mimeType })
      }

      // Handle data available event
      mediaRecorder.ondataavailable = (event) => {
        console.log('ondataavailable fired, data size:', event.data?.size)
        if (event.data && event.data.size > 0) {
          chunks.push(event.data)
          console.log('Chunk added, total chunks:', chunks.length)
        }
      }

      // Handle stop event - this must be set up before start()
      mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped, chunks:', chunks.length)
        const blob = new Blob(chunks, { type: mimeType })
        previewUrl.value = URL.createObjectURL(blob)
        isRecording.value = false
        stopTimer()

        // Resolve the promise if stopRecording was called
        if (stopResolve) {
          stopResolve(blob)
          stopResolve = null
          stopReject = null
        }
      }

      // Handle errors
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        error.value = 'Recording error occurred'

        if (stopReject) {
          stopReject(new Error('Recording error occurred'))
          stopResolve = null
          stopReject = null
        }
        cleanup()
      }

      // Handle stream end (user stops sharing) - auto-stop recording
      const videoTrack = mediaStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.onended = () => {
          console.log('Media stream ended by user')
          if (isRecording.value && mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop()
          }
        }
      }

      // Start recording
      // Don't use timeslice - let it buffer all data until stop
      console.log('Starting MediaRecorder...')
      mediaRecorder.start()
      isRecording.value = true
      startTimer()
      console.log('MediaRecorder started, state:', mediaRecorder.state)

    } catch (err) {
      console.error('Error starting recording:', err)
      error.value = err instanceof Error ? err.message : 'Failed to start recording'
      cleanup()
      throw err
    }
  }

  async function stopRecording(): Promise<Blob> {
    console.log('stopRecording called, mediaRecorder state:', mediaRecorder?.state)

    return new Promise((resolve, reject) => {
      if (!mediaRecorder) {
        reject(new Error('No active recording'))
        return
      }

      if (mediaRecorder.state === 'inactive') {
        reject(new Error('Recording already stopped'))
        return
      }

      // Store the promise callbacks so onstop can resolve them
      stopResolve = (blob: Blob) => {
        cleanup() // Clean up after blob is created
        resolve(blob)
      }
      stopReject = (err: Error) => {
        cleanup() // Clean up on error too
        reject(err)
      }

      try {
        console.log('Current chunks before stop:', chunks.length)
        console.log('MediaRecorder state before stop:', mediaRecorder.state)
        console.log('Calling mediaRecorder.stop()')

        mediaRecorder.stop()

        console.log('MediaRecorder state after stop call:', mediaRecorder.state)

        // Check state after a short delay
        setTimeout(() => {
          console.log('MediaRecorder state after 100ms:', mediaRecorder?.state)
        }, 100)

        // Safety timeout in case onstop never fires
        setTimeout(() => {
          if (stopResolve) {
            console.warn('onstop event did not fire within 3 seconds, forcing stop')
            console.log('MediaRecorder final state:', mediaRecorder?.state)
            console.log('Chunks available:', chunks.length, 'Total size:', chunks.reduce((sum, c) => sum + c.size, 0))

            // Try to force data collection one more time
            if (mediaRecorder && mediaRecorder.state === 'recording') {
              console.log('MediaRecorder still recording, requesting data...')
              try {
                mediaRecorder.requestData()
                setTimeout(() => {
                  console.log('After requestData, chunks:', chunks.length)
                  finishStop()
                }, 500)
                return
              } catch (e) {
                console.error('requestData failed:', e)
              }
            }

            finishStop()
          }
        }, 3000)

        function finishStop() {
          const mimeType = getSupportedMimeType() || 'video/webm'
          const blob = new Blob(chunks, { type: mimeType })
          console.log('Created blob, size:', blob.size)

          if (blob.size > 0) {
            previewUrl.value = URL.createObjectURL(blob)
            isRecording.value = false
            stopTimer()
            stopResolve!(blob)
          } else {
            stopReject!(new Error('No data recorded'))
          }
          stopResolve = null
          stopReject = null
          cleanup()
        }
      } catch (err) {
        console.error('Error calling stop():', err)
        stopResolve = null
        stopReject = null
        cleanup()
        reject(new Error('Failed to stop recording: ' + err))
      }
    })
  }

  function startTimer() {
    recordingTime.value = 0
    timerInterval = window.setInterval(() => {
      recordingTime.value++
    }, 1000)
  }

  function stopTimer() {
    if (timerInterval !== null) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  function cleanup() {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop())
      mediaStream = null
    }
    if (audioContext) {
      audioContext.close()
      audioContext = null
      audioDestination = null
    }
    stopTimer()
  }

  function getSupportedMimeType(): string | null {
    const types = [
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9,opus',
      'video/webm',
      'video/mp4'
    ]

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }

    return null
  }

  function formatTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  onUnmounted(() => {
    cleanup()
  })

  return {
    isRecording,
    recordingTime,
    error,
    previewUrl,
    isBrowserSupported,
    startRecording,
    stopRecording,
    formatTime
  }
}
