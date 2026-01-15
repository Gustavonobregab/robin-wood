import { AudioPipeline, AudioData, AudioResult } from './audio'
import { TextPipeline, TextData, TextResult } from './text'
import { ImagePipeline, ImageData, ImageResult } from './image'
import { Metrics, PipelineResult, AudioDetails, TextDetails, ImageDetails } from './types'
import { getConfig, setConfig, isInitialized } from './config'

export interface InitOptions {
  apiKey: string
  apiUrl?: string
}

// Definição do objeto principal
const steal = {
  async init(options: InitOptions): Promise<void> {

    if (!options.apiKey) {
      throw new Error('[RobinWood] API key is required')
    }

    const apiUrl = options.apiUrl || getConfig().apiUrl

    if (!apiUrl) {
      throw new Error('[RobinWood] API URL is required')
    }

    const response = await fetch(`${apiUrl}/auth/validate-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: options.apiKey }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`[RobinWood] Invalid API key: ${(errorData as { message?: string })?.message || response.statusText}`)
    }

    setConfig({ apiKey: options.apiKey, apiUrl, validated: true })
  },

  isInitialized,

  audio: (data: AudioData) => new AudioPipeline(data),
  text: (data: TextData) => new TextPipeline(data),
  image: (data: ImageData) => new ImagePipeline(data),
}

export default steal

// Exportações Principais
export { steal }
export { AudioPipeline, TextPipeline, ImagePipeline }

// Funcionalidades Novas (Branch Conversor)
export { decodeAudio } from './decoder';
export { encodeAudio } from './encoder';

// Tipagem Completa (Branch Main + Conversor)
export type {
  AudioData,
  AudioResult,
  TextData,
  TextResult,
  ImageData,
  ImageResult,
  Metrics,
  PipelineResult,
  AudioDetails,
  TextDetails,
  ImageDetails
}