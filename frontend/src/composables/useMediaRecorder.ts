import { ref, onUnmounted } from 'vue'

export function useMediaRecorder() {
  const isRecording = ref(false)
  const recordingTime = ref(0)
  const error = ref<string | null>(null)
  const previewUrl = ref<string | null>(null)
  const isBrowserSupported = ref(true)
  const webcamEnabled = ref(true)
  const webcamStream = ref<MediaStream | null>(null)

  let mediaRecorder: MediaRecorder | null = null
  let chunks: Blob[] = []
  let mediaStream: MediaStream | null = null
  let timerInterval: number | null = null
  let stopResolve: ((blob: Blob) => void) | null = null
  let stopReject: ((error: Error) => void) | null = null
  let audioContext: AudioContext | null = null
  let audioDestination: MediaStreamAudioDestinationNode | null = null

  // Layout state for compositor
  // Position is normalized (0.0 to 1.0) relative to canvas size
  // Size is normalized radius (0.0 to 0.5)
  const currentLayout = { x: 0.1, y: 0.9, size: 0.09 } // Default bottom-left
  const targetLayout = { x: 0.1, y: 0.9, size: 0.09 }
  
  // Easing factor for smooth transition (approx 0.1 per frame at 30fps = ~0.5s settle)
  const LERP_FACTOR = 0.15
  let animationFrameId: number | null = null
  let displayVideoEl: HTMLVideoElement | null = null
  let webcamVideoEl: HTMLVideoElement | null = null
  let displayStream: MediaStream | null = null

  // Check browser support on initialization
  function checkBrowserSupport(): { supported: boolean; message: string | null } {
    if (!navigator.mediaDevices) {
      return {
        supported: false,
        message:
          'Your browser does not support media devices API. Please use a modern desktop browser like Chrome, Firefox, or Edge.',
      }
    }

    if (!navigator.mediaDevices.getDisplayMedia) {
      return {
        supported: false,
        message:
          'Screen recording is not supported on this device. Please use a desktop browser like Chrome, Firefox, or Edge.',
      }
    }

    if (typeof MediaRecorder === 'undefined') {
      return {
        supported: false,
        message:
          'MediaRecorder API is not supported in your browser. Please update your browser or try a different one.',
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

  async function initWebcam(): Promise<MediaStream | null> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      })
      webcamStream.value = stream
      return stream
    } catch (e) {
      console.warn('Could not access webcam:', e)
      webcamEnabled.value = false
      return null
    }
  }

  function stopWebcam() {
    if (webcamStream.value) {
      webcamStream.value.getTracks().forEach((track) => track.stop())
      webcamStream.value = null
    }
  }

  async function toggleWebcam() {
    if (webcamStream.value) {
      stopWebcam()
      webcamEnabled.value = false
    } else {
      webcamEnabled.value = true
      await initWebcam()
    }
  }

  function startCompositingLoop(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    dispVideo: HTMLVideoElement,
    camVideo: HTMLVideoElement | null,
  ) {
    const cw = canvas.width
    const ch = canvas.height

    let lastFrameTime = 0
    const TARGET_FPS = 30
    const FRAME_INTERVAL = 1000 / TARGET_FPS

    function compositeFrame(timestamp: number) {
      animationFrameId = requestAnimationFrame(compositeFrame)

      // Throttle frame rate
      if (timestamp - lastFrameTime < FRAME_INTERVAL) {
        return
      }
      lastFrameTime = timestamp

      // Draw screen capture as background
      ctx.drawImage(dispVideo, 0, 0, cw, ch)

      // Interpolate layout
      currentLayout.x += (targetLayout.x - currentLayout.x) * LERP_FACTOR
      currentLayout.y += (targetLayout.y - currentLayout.y) * LERP_FACTOR
      currentLayout.size += (targetLayout.size - currentLayout.size) * LERP_FACTOR

      // Draw webcam overlay if available
      if (camVideo && camVideo.readyState >= 2 && webcamStream.value) {
        // Calculate pixel values from normalized state
        const bubbleRadius = Math.min(cw, ch) * currentLayout.size
        const cx = cw * currentLayout.x
        const cy = ch * currentLayout.y

        // Circular clip
        ctx.save()
        ctx.beginPath()
        ctx.arc(cx, cy, bubbleRadius, 0, Math.PI * 2)
        ctx.clip()

        // Mirror webcam horizontally (natural mirror view in recording)
        ctx.translate(cx, cy)
        ctx.scale(-1, 1)
        ctx.translate(-cx, -cy)

        // Center-crop webcam to square to fill the circle
        const vw = camVideo.videoWidth
        const vh = camVideo.videoHeight
        const cropSize = Math.min(vw, vh)
        const sx = (vw - cropSize) / 2
        const sy = (vh - cropSize) / 2

        ctx.drawImage(
          camVideo,
          sx,
          sy,
          cropSize,
          cropSize,
          cx - bubbleRadius,
          cy - bubbleRadius,
          bubbleRadius * 2,
          bubbleRadius * 2,
        )
        ctx.restore()

        // White border ring
        ctx.beginPath()
        ctx.arc(cx, cy, bubbleRadius, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.lineWidth = 3
        ctx.stroke()

        // Subtle outer shadow
        ctx.beginPath()
        ctx.arc(cx, cy, bubbleRadius + 2, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)'
        ctx.lineWidth = 1
        ctx.stroke()
      }

      animationFrameId = requestAnimationFrame(compositeFrame)
    }

    requestAnimationFrame(compositeFrame)
  }

  async function startRecording() {
    if (!isBrowserSupported.value) {
      throw new Error('Browser does not support screen recording')
    }

    try {
      error.value = null
      chunks = []

      // Request screen capture (video + system audio if available)
      displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      })

      console.log('Display stream tracks:', {
        video: displayStream.getVideoTracks().length,
        audio: displayStream.getAudioTracks().length,
      })

      // Request microphone audio for narration
      let micStream: MediaStream | null = null
      try {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        })
        console.log('Microphone stream tracks:', {
          audio: micStream.getAudioTracks().length,
        })
      } catch (micError) {
        console.warn('Could not access microphone:', micError)
      }

      // Initialize webcam if enabled and not already running
      if (webcamEnabled.value && !webcamStream.value) {
        await initWebcam()
      }

      // Use Web Audio API to mix audio tracks
      const hasSystemAudio = displayStream.getAudioTracks().length > 0
      const hasMicAudio = micStream !== null

      let finalAudioStream: MediaStream | null = null

      if (hasSystemAudio || hasMicAudio) {
        audioContext = new AudioContext()
        audioDestination = audioContext.createMediaStreamDestination()

        if (hasSystemAudio) {
          const systemAudioSource = audioContext.createMediaStreamSource(displayStream)
          systemAudioSource.connect(audioDestination)
          console.log('Connected system audio to mixer')
        }

        if (hasMicAudio && micStream) {
          const micAudioSource = audioContext.createMediaStreamSource(micStream)
          micAudioSource.connect(audioDestination)
          console.log('Connected microphone audio to mixer')
        }

        finalAudioStream = audioDestination.stream
        console.log('Mixed audio stream created')
      }

      // Determine video track: use canvas compositing if webcam is available
      let finalVideoTrack: MediaStreamTrack
      const originalDisplayTrack = displayStream.getVideoTracks()[0]
      if (!originalDisplayTrack) {
        throw new Error('No video track available from screen capture')
      }

      if (webcamStream.value) {
        // Set up canvas compositing for screen + webcam overlay
        const settings = originalDisplayTrack.getSettings()
        
        // Cap resolution at 1080p to improve performance
        const rawWidth = settings.width || 1920
        const rawHeight = settings.height || 1080
        const MAX_WIDTH = 1920
        const MAX_HEIGHT = 1080
        
        let width = rawWidth
        let height = rawHeight
        
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
          console.log(`Downscaling recording canvas from ${rawWidth}x${rawHeight} to ${width}x${height}`)
        } else {
          console.log(`Recording canvas size: ${width}x${height}`)
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!

        displayVideoEl = document.createElement('video')
        displayVideoEl.srcObject = displayStream
        displayVideoEl.muted = true
        await displayVideoEl.play()

        webcamVideoEl = document.createElement('video')
        webcamVideoEl.srcObject = webcamStream.value
        webcamVideoEl.muted = true
        await webcamVideoEl.play()

        startCompositingLoop(canvas, ctx, displayVideoEl, webcamVideoEl)

        const canvasStream = canvas.captureStream(30)
        const canvasTrack = canvasStream.getVideoTracks()[0]
        if (!canvasTrack) {
          throw new Error('Failed to capture video from compositing canvas')
        }
        finalVideoTrack = canvasTrack

        // When user stops screen sharing, stop the recording
        originalDisplayTrack.onended = () => {
          console.log('Display stream ended by user')
          if (isRecording.value && mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop()
          }
        }
      } else {
        // No webcam: use display stream directly (original behavior)
        finalVideoTrack = originalDisplayTrack

        finalVideoTrack.onended = () => {
          console.log('Media stream ended by user')
          if (isRecording.value && mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop()
          }
        }
      }

      // Combine video and mixed audio into final stream
      mediaStream = new MediaStream()
      mediaStream.addTrack(finalVideoTrack)

      if (finalAudioStream) {
        finalAudioStream.getAudioTracks().forEach((track) => {
          mediaStream!.addTrack(track)
          console.log('Added mixed audio track')
        })
      }

      console.log('Final MediaStream tracks:', {
        video: mediaStream.getVideoTracks().length,
        audio: mediaStream.getAudioTracks().length,
      })

      // Check for supported MIME type
      const mimeType = getSupportedMimeType()
      console.log('Using MIME type:', mimeType)
      if (!mimeType) {
        throw new Error('No supported video MIME type found')
      }

      // Create MediaRecorder
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

      // Handle stop event
      mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped, chunks:', chunks.length)
        const blob = new Blob(chunks, { type: mimeType })
        previewUrl.value = URL.createObjectURL(blob)
        isRecording.value = false
        stopTimer()

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

      // Start recording
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

      stopResolve = (blob: Blob) => {
        cleanup()
        resolve(blob)
      }
      stopReject = (err: Error) => {
        cleanup()
        reject(err)
      }

      try {
        console.log('Current chunks before stop:', chunks.length)
        console.log('Calling mediaRecorder.stop()')

        mediaRecorder.stop()

        // Safety timeout in case onstop never fires
        setTimeout(() => {
          if (stopResolve) {
            console.warn('onstop event did not fire within 3 seconds, forcing stop')
            console.log('Chunks available:', chunks.length)

            if (mediaRecorder && mediaRecorder.state === 'recording') {
              try {
                mediaRecorder.requestData()
                setTimeout(() => {
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
          const type = getSupportedMimeType() || 'video/webm'
          const blob = new Blob(chunks, { type })
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
    // Stop compositing loop
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }

    // Clean up hidden video elements
    if (displayVideoEl) {
      displayVideoEl.pause()
      displayVideoEl.srcObject = null
      displayVideoEl = null
    }
    if (webcamVideoEl) {
      webcamVideoEl.pause()
      webcamVideoEl.srcObject = null
      webcamVideoEl = null
    }

    // Stop display stream tracks
    if (displayStream) {
      displayStream.getTracks().forEach((track) => track.stop())
      displayStream = null
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop())
      mediaStream = null
    }
    if (audioContext) {
      audioContext.close()
      audioContext = null
      audioDestination = null
    }
    stopTimer()
    stopWebcam()
  }

  function getSupportedMimeType(): string | null {
    const types = [
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9,opus',
      'video/webm',
      'video/mp4',
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
    stopWebcam()
  })

  return {
    isRecording,
    recordingTime,
    error,
    previewUrl,
    isBrowserSupported,
    webcamEnabled,
    webcamStream,
    startRecording,
    stopRecording,
    formatTime,
    toggleWebcam,
    initWebcam,
    setWebcamLayout: (layout: { x: number, y: number, size: number }) => {
      targetLayout.x = layout.x
      targetLayout.y = layout.y
      targetLayout.size = layout.size
    }
  }
}
