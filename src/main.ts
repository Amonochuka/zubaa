import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './config';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { EndScene } from './scenes/EndScene';
import './style.css';

const app = document.getElementById('app');
const fullscreenButton = document.createElement('button');
fullscreenButton.className = 'fullscreen-button';
fullscreenButton.type = 'button';
fullscreenButton.textContent = '⛶ FULL SCREEN';
fullscreenButton.setAttribute('aria-label', 'Expand the game to full screen');
app?.append(fullscreenButton);

fullscreenButton.addEventListener('click', async () => {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }

  try {
    await (app ?? document.documentElement).requestFullscreen();
  } catch {
    app?.classList.toggle('theater-mode');
  }
});

document.addEventListener('fullscreenchange', () => {
  fullscreenButton.textContent = document.fullscreenElement ? '× EXIT FULL SCREEN' : '⛶ FULL SCREEN';
});

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#101b24',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 900 }, debug: false },
  },
  scene: [BootScene, MenuScene, GameScene, EndScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
});
