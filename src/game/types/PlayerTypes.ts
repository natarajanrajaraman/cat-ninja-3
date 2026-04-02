export enum PlayerState {
  IDLE = 'IDLE',
  RUN = 'RUN',
  JUMP = 'JUMP',
  FALL = 'FALL',
  DOUBLE_JUMP = 'DOUBLE_JUMP',
  WALL_SLIDE = 'WALL_SLIDE',
  WALL_JUMP = 'WALL_JUMP',
  DASH = 'DASH',
  HURT = 'HURT',
  DEAD = 'DEAD',
}

// Input keys passed from scene into Player constructor.
// Player does not own the keyboard manager — scene does.
export interface PlayerKeys {
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  jump: Phaser.Input.Keyboard.Key;
  dash: Phaser.Input.Keyboard.Key;
  attack: Phaser.Input.Keyboard.Key;
}
