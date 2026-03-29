export type FilterType = 'none' | 'vintage' | 'bw' | 'cinematic' | 'warm' | 'cool' | 'dramatic';

export type LayerType = 'image' | 'text' | 'drawing' | 'effect';

export type BrushMode = 'normal' | 'rotoscopia';

export interface Path {
  points: { x: number; y: number }[];
  color: string;
  width: number;
  mode?: BrushMode;
}

export interface ImageState {
  brightness: number;
  contrast: number;
  saturation: number;
  exposure: number;
  shadows: number;
  highlights: number;
  warmth: number;
  tint?: number;
  sharpness?: number;
  clarity?: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  filter: FilterType;
  opacity: number;
  visible: boolean;
  x: number;
  y: number;
  scale: number;
  text?: string;
  fontSize?: number;
  fontColor?: string;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: 'left' | 'center' | 'right';
  paths?: Path[];
  brushMode?: BrushMode;
  brushRadius?: number;
  brushInvert?: boolean;
  brushColor?: string;
  brushWidth?: number;
  vignette?: number;
  chromaticAberration?: number;
  blur?: number;
  noise?: number;
  ripple?: number;
  swirl?: number;
  pixelate?: number;
  fisheye?: number;
  glitch?: number;
}

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  image?: string; // Data URL for image layers
  state: ImageState;
  zIndex: number;
}

export const INITIAL_IMAGE_STATE: ImageState = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  exposure: 100,
  shadows: 0,
  highlights: 0,
  warmth: 0,
  tint: 0,
  sharpness: 0,
  clarity: 0,
  rotation: 0,
  flipX: false,
  flipY: false,
  filter: 'none',
  opacity: 100,
  visible: true,
  x: 0,
  y: 0,
  scale: 1,
  brushMode: 'normal',
  brushRadius: 15,
  brushInvert: false,
  brushColor: '#ffffff',
  brushWidth: 5,
  fontWeight: 'normal',
  fontStyle: 'normal',
  textAlign: 'center',
  vignette: 0,
  chromaticAberration: 0,
  blur: 0,
  noise: 0,
  ripple: 0,
  swirl: 0,
  pixelate: 0,
  fisheye: 0,
  glitch: 0
};

export function getFilterString(state: ImageState) {
  const { brightness, contrast, saturation, exposure, filter, warmth, tint } = state;
  
  let filterString = `brightness(${(brightness * (exposure / 100))}%) contrast(${contrast}%) saturate(${saturation}%)`;
  
  // Apply Warmth (Temperature) and Tint
  if (warmth && warmth !== 0) {
    if (warmth > 0) {
      // Warm: more yellow/red
      filterString += ` sepia(${warmth / 2}%) hue-rotate(${-warmth / 4}deg)`;
    } else {
      // Cool: more blue
      filterString += ` hue-rotate(${Math.abs(warmth)}deg) saturate(${100 + Math.abs(warmth) / 2}%)`;
    }
  }

  if (tint && tint !== 0) {
    filterString += ` hue-rotate(${tint}deg)`;
  }

  switch (filter) {
    case 'vintage':
      filterString += ' sepia(50%) hue-rotate(-30deg)';
      break;
    case 'bw':
      filterString += ' grayscale(100%)';
      break;
    case 'cinematic':
      filterString += ' contrast(120%) saturate(80%) sepia(10%)';
      break;
    case 'warm':
      filterString += ' sepia(30%)';
      break;
    case 'cool':
      filterString += ' hue-rotate(180deg) saturate(80%)';
      break;
    case 'dramatic':
      filterString += ' contrast(150%) brightness(90%)';
      break;
  }
  
  return filterString;
}
