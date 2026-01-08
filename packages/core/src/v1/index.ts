import { AudioPipeline, AudioData, AudioResult } from './audio'
import { TextPipeline, TextData, TextResult } from './text'
import { ImagePipeline, ImageData, ImageResult } from './image'
import { Metrics, PipelineResult, AudioDetails, TextDetails, ImageDetails } from './types'

// Definição do objeto principal
const steal = {
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