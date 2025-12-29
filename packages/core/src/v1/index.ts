import { AudioPipeline, AudioData, AudioResult } from './audio';
import { TextPipeline, TextData, TextResult } from './text';
import { ImagePipeline, ImageData, ImageResult } from './image';

const steal = {
  audio: (data: AudioData) => new AudioPipeline(data),
  text: (data: TextData) => new TextPipeline(data),
  image: (data: ImageData) => new ImagePipeline(data),
};

export default steal;

export { steal };
export { AudioPipeline, TextPipeline, ImagePipeline };
export type { AudioData, AudioResult, TextData, TextResult, ImageData, ImageResult };

