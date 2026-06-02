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
  mode: 'full-frame';
  sourceWidth: number;
  sourceHeight: number;
  cells: AvatarAsciiCell[];
}
