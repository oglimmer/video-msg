import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import WebcamPreview from '../components/WebcamPreview.vue'

describe('WebcamPreview', () => {
  it('attaches the stream to the video element when stream prop changes', async () => {
    const wrapper = mount(WebcamPreview, {
      props: {
        stream: null
      }
    })

    // Create a mock stream
    const mockStream = {
      id: 'mock-stream',
      active: true,
      getTracks: () => [],
    } as unknown as MediaStream

    // Update the stream prop
    await wrapper.setProps({ stream: mockStream })

    // Find the video element
    const video = wrapper.find('video')
    expect(video.exists()).toBe(true)

    // Check if srcObject was set
    // Note: in jsdom/vitest, srcObject is a property on the element
    const srcObject = (video.element as HTMLVideoElement).srcObject as MediaStream
    expect(srcObject).toBeDefined()
    expect(srcObject.id).toBe(mockStream.id)
  })

  it('handles initial stream prop', async () => {
    const mockStream = {
      id: 'mock-stream-2',
      active: true,
      getTracks: () => [],
    } as unknown as MediaStream

    const wrapper = mount(WebcamPreview, {
      props: {
        stream: mockStream
      }
    })

    const video = wrapper.find('video')
    expect(video.exists()).toBe(true)
    const srcObject = (video.element as HTMLVideoElement).srcObject as MediaStream
    expect(srcObject).toBeDefined()
    expect(srcObject.id).toBe(mockStream.id)
  })
})
