export function createWavHeader(
  audioData: Uint8Array,
  sampleRate: number = 44100,
  channels: number = 2,
  bitsPerSample: number = 16,
): Uint8Array {
  const dataSize = audioData.length
  const fileSize = 36 + dataSize
  const byteRate = sampleRate * channels * (bitsPerSample / 8)
  const blockAlign = channels * (bitsPerSample / 8)

  const header = new ArrayBuffer(44)
  const view = new DataView(header)

  // RIFF header
  view.setUint32(0, 0x46464952, true) // "RIFF"
  view.setUint32(4, fileSize, true) // File size
  view.setUint32(8, 0x45564157, true) // "WAVE"

  // Format chunk
  view.setUint32(12, 0x20746d66, true) // "fmt "
  view.setUint32(16, 16, true) // Format chunk size
  view.setUint16(20, 1, true) // Audio format (PCM)
  view.setUint16(22, channels, true) // Number of channels
  view.setUint32(24, sampleRate, true) // Sample rate
  view.setUint32(28, byteRate, true) // Byte rate
  view.setUint16(32, blockAlign, true) // Block align
  view.setUint16(34, bitsPerSample, true) // Bits per sample

  // Data chunk
  view.setUint32(36, 0x61746164, true) // "data"
  view.setUint32(40, dataSize, true) // Data size

  return new Uint8Array(header)
}

export function createWavFile(
  audioData: Uint8Array,
  sampleRate: number = 44100,
  channels: number = 2,
  bitsPerSample: number = 16,
): Uint8Array {
  const header = createWavHeader(audioData, sampleRate, channels, bitsPerSample)
  const wavFile = new Uint8Array(header.length + audioData.length)
  wavFile.set(header, 0)
  wavFile.set(audioData, header.length)
  return wavFile
}
