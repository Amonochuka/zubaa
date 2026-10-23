import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

export class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create(): void {
    this.cameras.main.setBackgroundColor('#101b24');
    this.add.text(GAME_WIDTH / 2, 150, 'A SATIRICAL PLATFORMER', { fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#63c7a2', letterSpacing: 3 }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 205, 'MHESHIWEMA', { fontFamily: 'Georgia, serif', fontSize: '58px', fontStyle: 'bold', color: '#f5bb45' }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 270, 'A platformer about who gets a share.', { fontFamily: 'Arial, sans-serif', fontSize: '20px', color: '#e9e6dc' }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 360, 'MOVE  A / D  or  ← / →     JUMP  SPACE / W / ↑', { fontFamily: 'Arial, sans-serif', fontSize: '15px', color: '#a8b5bc' }).setOrigin(0.5);
    const start = this.add.text(GAME_WIDTH / 2, 425, 'CLICK OR PRESS ENTER TO START', { fontFamily: 'Arial, sans-serif', fontSize: '16px', fontStyle: 'bold', color: '#101b24', backgroundColor: '#63c7a2', padding: { x: 20, y: 12 } }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    start.on('pointerdown', () => this.scene.start('GameScene'));
    this.input.keyboard?.on('keydown-ENTER', () => this.scene.start('GameScene'));
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 35, 'FICTIONAL PEOPLE • FICTIONAL POLITICS • REAL CHOICES', { fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#62727c' }).setOrigin(0.5);
  }
}
