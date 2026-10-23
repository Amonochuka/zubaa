import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create(): void {
    for (let stage = 0; stage <= 8; stage += 1) {
      const graphics = this.make.graphics({ x: 0, y: 0 });
      const bellyWidth = 25 + stage * 3.25;

      // Build a recognizable little politician whose belly grows wider with each stage.
      graphics.fillStyle(0x17232d).fillRoundedRect(21, 59, 8, 12, 3);
      graphics.fillStyle(0x17232d).fillRoundedRect(36, 59, 8, 12, 3);
      graphics.fillStyle(0x334a56).fillEllipse(32, 47, bellyWidth, 38);
      graphics.fillStyle(0xe9e6dc).fillTriangle(26, 31, 38, 31, 32, 48);
      graphics.fillStyle(0xe78c48).fillTriangle(30, 32, 34, 32, 32, 49);
      graphics.fillStyle(0xf0c497).fillCircle(32, 16, 12);
      graphics.fillStyle(0x253039).fillEllipse(32, 7, 25, 8);
      graphics.fillStyle(0x253039).fillRoundedRect(23, 7, 18, 5, 2);
      graphics.fillStyle(0x253039).fillCircle(28, 17, 1.4);
      graphics.fillStyle(0x253039).fillCircle(36, 17, 1.4);
      graphics.lineStyle(1.5, 0x8e584e).beginPath().arc(32, 20, 4, 0.2, Math.PI - 0.2).strokePath();
      graphics.generateTexture(`player-${stage}`, 64, 72);
      graphics.destroy();
    }
    const auditor = this.make.graphics({ x: 0, y: 0 });
    auditor.fillStyle(0x355a4b).fillRoundedRect(6, 15, 26, 28, 6);
    auditor.fillStyle(0xf0c497).fillCircle(19, 11, 10);
    auditor.fillStyle(0x253039).fillRoundedRect(8, 2, 22, 6, 2);
    auditor.fillStyle(0xe9e6dc).fillRoundedRect(22, 24, 13, 16, 2);
    auditor.fillStyle(0x263944).fillCircle(16, 12, 1.2);
    auditor.fillStyle(0x263944).fillCircle(23, 12, 1.2);
    auditor.generateTexture('auditor', 38, 46);
    auditor.destroy();
    this.scene.start('MenuScene');
  }
}
