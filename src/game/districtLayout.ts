export interface CityBlock {
  id: string;
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  style:
    | 'arcade'
    | 'sawtooth'
    | 'terrace'
    | 'atrium'
    | 'library'
    | 'tower'
    | 'gable'
    | 'brick';
}
// Authored parcels, shared by visual construction and pedestrian collision.
export const CITY_BLOCKS: CityBlock[] = [
  { id: 'West Exchange', x: -43, z: -12, w: 18, d: 26, h: 21, style: 'arcade' },
  {
    id: 'Copper Arts Hall',
    x: 43,
    z: -12,
    w: 18,
    d: 26,
    h: 14,
    style: 'sawtooth',
  },
  {
    id: 'Garden Residences',
    x: -14,
    z: 53,
    w: 20,
    d: 20,
    h: 23,
    style: 'terrace',
  },
  {
    id: 'South Conservatory',
    x: 13,
    z: 53,
    w: 20,
    d: 20,
    h: 13,
    style: 'atrium',
  },
  {
    id: 'District Library',
    x: -43,
    z: -50,
    w: 18,
    d: 12,
    h: 12,
    style: 'library',
  },
  { id: 'North Lantern', x: 43, z: -50, w: 17, d: 12, h: 35, style: 'tower' },
  { id: 'Market Studios', x: -44, z: 52, w: 17, d: 22, h: 15, style: 'gable' },
  { id: 'Clay Court', x: 44, z: 53, w: 17, d: 22, h: 20, style: 'brick' },
];
export const DISTRICT_BOUNDS = { minX: -57, maxX: 57, minZ: -60, maxZ: 74 };
export const STREET_TREES = [
  [-33, 8],
  [-33, -10],
  [-33, -26],
  [-25, -20],
  [-25, 14],
  [-19, 34],
  [-7, 34],
  [8, 34],
  [20, 34],
  [33, 8],
  [33, -10],
  [33, -26],
  [25, -20],
  [25, 14],
  [-53, 13],
  [53, 13],
  [-21, 64],
  [23, 64],
  [-43, 36],
  [43, 36],
  [-17, -31],
  [-5, -31],
  [8, -31],
  [19, -31],
  [-24, -48],
  [24, -48],
];

export const STREET_BENCHES = [
  [-48, 16],
  [-39, 16],
  [39, 18],
  [49, 18],
  [-16, 37],
  [14, 37],
  [-20, -29],
  [18, -29],
  [-24, 63],
  [24, 63],
];

// Accent trees formerly placed in the road have been moved into garden/verge pockets.
// Kept separate from the regular street row so visual placement and collision agree.
export const ACCENT_TREES = [
  [-54, -23],
  [54, -23],
  [-38, 18],
  [38, 18],
  [-43, 17],
  [45, 17],
  [-23, 40],
  [25, 41],
  [-36, 42],
  [37, 43],
  [-37, 7],
  [38, 8],
];
