export type ProgressStage =
  | 'idle'
  | 'loading'
  | 'upscalingImage'
  | 'upscalingFrames'
  | 'scalingFrames'
  | 'copyingAudio'
  | 'finalizing'
  | 'done';

export interface ImageProgress {
  progress: number;
  stage: ProgressStage;
  label?: string;
}

export type ScaleFactor = 2 | 4;

export interface VideoProgress {
  progress: number;
  stage: ProgressStage;
  label?: string;
}
