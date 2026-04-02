import Phaser from 'phaser';

// Key bindings — update these to retarget controls without touching scene code
export const INPUT = {
  MOVE_LEFT: Phaser.Input.Keyboard.KeyCodes.A,
  MOVE_RIGHT: Phaser.Input.Keyboard.KeyCodes.D,
  JUMP: Phaser.Input.Keyboard.KeyCodes.SPACE,
  DASH: Phaser.Input.Keyboard.KeyCodes.SHIFT,
  CLAW: Phaser.Input.Keyboard.KeyCodes.J,
  SUPER: Phaser.Input.Keyboard.KeyCodes.Q,
  FRENZY: Phaser.Input.Keyboard.KeyCodes.E,
  PAUSE: Phaser.Input.Keyboard.KeyCodes.ESC,
} as const;
