declare module 'whisper-node' {
  interface WhisperResult {
    speech: string
  }

  function whisper(audioPath: string): Promise<WhisperResult[]>
  export default whisper
}
