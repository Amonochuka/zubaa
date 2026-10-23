import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { getEnding } from '../systems/EndingSystem';
import type { Ending } from '../systems/EndingSystem';
import type { SizeState } from '../systems/SizeSystem';

export class EndScene extends Phaser.Scene {
  constructor() { super('EndScene'); }

  create(data: { sizes?: SizeState; ending?: Ending }): void {
    const sizes = data.sizes ?? { politician: 0, citizen: 0 };
    const ending = data.ending ?? getEnding(sizes);
    this.cameras.main.setBackgroundColor('#101b24');
    this.add.text(GAME_WIDTH / 2, 110, 'THE NEIGHBOURHOOD REMEMBERS', { fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#a8b5bc', letterSpacing: 3 }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 205, ending.title, { fontFamily: 'Georgia, serif', fontSize: '42px', fontStyle: 'bold', color: ending.color, align: 'center', wordWrap: { width: 800 } }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 275, ending.message, { fontFamily: 'Arial, sans-serif', fontSize: '18px', color: '#e9e6dc', align: 'center', wordWrap: { width: 680 }, lineSpacing: 8 }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 350, `POWER ${sizes.politician}     •     PEOPLE ${sizes.citizen}`, { fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#a8b5bc' }).setOrigin(0.5);
    const again = this.add.text(GAME_WIDTH / 2, 425, 'PLAY AGAIN', { fontFamily: 'Arial, sans-serif', fontSize: '16px', fontStyle: 'bold', color: '#101b24', backgroundColor: '#63c7a2', padding: { x: 22, y: 12 } }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    again.on('pointerdown', () => this.scene.start('GameScene'));
    this.input.keyboard?.on('keydown-ENTER', () => this.scene.start('GameScene'));
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 28, 'FICTIONAL PEOPLE • FICTIONAL POLITICS • REAL CHOICES', { fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#62727c' }).setOrigin(0.5);
  }
}
