export interface GenParams {
  baseColor: string;
  secondaryColor: string;
  accentColor: string;
  scale: number;
  distortion: number;
  seed: number;
  contrast: number;
  brightness: number;
  detail: number; // Number of noise octaves (1-8)
  phase: number;  // Sine wave wrapping (0-20)
}

export interface Preset {
  name: string;
  params: GenParams;
}