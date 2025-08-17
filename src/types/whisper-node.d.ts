declare module 'whisper-node' {
  interface WhisperResult {
    speech: string
  }

  interface WhisperOptions {
    modelName?: string
    modelPath?: string
    whisperOptions?: {
      language?: string
      gen_file_txt?: boolean
      gen_file_subtitle?: boolean
      gen_file_vtt?: boolean
      word_timestamps?: boolean
    }
  }

  function whisper(audioPath: string, options?: WhisperOptions): Promise<WhisperResult[]>
  export default whisper
}
