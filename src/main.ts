import Phaser from 'phaser';
import { gameConfig } from './game/config/gameConfig';

const game = new Phaser.Game(gameConfig);

// Prevent the browser context menu while the cursor is over the game canvas
// so right-click (slow-mo aim) doesn't trigger "Save image as…" etc.
game.events.once('ready', () => {
  game.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
});
