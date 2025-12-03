
export type DecorationType = 'photo' | 'particle';

export interface TreeItemData {
  id: number;
  type: DecorationType;
  url?: string; // Only for photos
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}

export interface TreeConfig {
  scatter: number;
  glowStrength: number;
  rotationSpeed: number;
  photoBrightness: number;
  decoBrightness: number;
  decoSize: number;
}

export interface GeminiResponse {
  message: string;
}
