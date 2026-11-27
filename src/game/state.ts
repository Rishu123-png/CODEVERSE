import { SPAWN } from './movement';
export interface GameState {
  x: number;
  z: number;
  speed: number;
  near: boolean;
  interacting: boolean;
  paused: boolean;
  motion: string;
}
export const INITIAL_GAME_STATE: GameState = {
  ...SPAWN,
  speed: 0,
  near: false,
  interacting: false,
  paused: false,
  motion: 'Idle',
};
