export interface GenParams {
  baseColor: string;
  secondaryColor: string;
  accentColor: string;
  scale: number;
  distortion: number;
  seed: number;
  contrast: number;
  brightness: number;
}

export interface Preset {
  name: string;
  params: GenParams;
}
