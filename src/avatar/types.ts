export interface AvatarAsciiCell {
  x: number;
  y: number;
  char: string;
  color: string;
  intensity: number;
}

export interface AvatarAsciiArt {
  columns: number;
  rows: number;
  sourceWidth: number;
  sourceHeight: number;
  transparentBackground: {
    luminance: number;
    saturation: number;
  };
  cells: AvatarAsciiCell[];
}
