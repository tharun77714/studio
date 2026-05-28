export const FRAME_COUNT = 113

const BASE_PATH = '/frames/ezgif-frame-'

export function frameUrl(index: number): string {
  if (index < 0 || index >= FRAME_COUNT) {
    throw new RangeError(`frame index out of range: ${index}`)
  }
  const n = String(index + 1).padStart(3, '0')
  return `${BASE_PATH}${n}.jpg`
}

export function allFrameUrls(): string[] {
  return Array.from({ length: FRAME_COUNT }, (_, i) => frameUrl(i))
}

