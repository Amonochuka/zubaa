import Phaser from 'phaser';
import { JUMP_VELOCITY, PLAYER_MAX_SCALE, PLAYER_MIN_SCALE, WALK_SPEED } from '../config';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private readonly keys: { left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key; jump: Phaser.Input.Keyboard.Key; a: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key; w: Phaser.Input.Keyboard.Key; up: Phaser.Input.Keyboard.Key };
  private scaleFactor = 1;
  private inputEnabled = true;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player-0');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.setSizeFactor(1);
    this.setDepth(5);
    this.setCollideWorldBounds(true);
    const keyboard = scene.input.keyboard;
    if (!keyboard) throw new Error('Keyboard input is unavailable');
    this.keys = {
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      jump: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      a: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      d: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      w: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
    };
  }

  setSizeFactor(factor: number): void {
    this.scaleFactor = Phaser.Math.Clamp(factor, PLAYER_MIN_SCALE, PLAYER_MAX_SCALE);
    const progress = Phaser.Math.Clamp((this.scaleFactor - 1) / (PLAYER_MAX_SCALE - 1), 0, 1);
    const stage = Math.round(progress * 8);
    this.setTexture(`player-${stage}`);
    // Belly width carries most of the growth; height changes only a little.
    this.setScale(1 + progress * 0.12);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(27 + progress * 24, 68, true);
  }

  setInputEnabled(enabled: boolean): void {
    this.inputEnabled = enabled;
    if (!enabled) this.setVelocityX(0);
  }

  update(): void {
    if (!this.inputEnabled) {
      this.setVelocityX(0);
      return;
    }
    const left = this.keys.left.isDown || this.keys.a.isDown;
    const right = this.keys.right.isDown || this.keys.d.isDown;
    const jump = Phaser.Input.Keyboard.JustDown(this.keys.jump)
      || Phaser.Input.Keyboard.JustDown(this.keys.w)
      || Phaser.Input.Keyboard.JustDown(this.keys.up);
    const progress = Phaser.Math.Clamp((this.scaleFactor - 1) / (PLAYER_MAX_SCALE - 1), 0, 1);
    const speed = WALK_SPEED * (1 - progress * 0.32);
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (left) this.setVelocityX(-speed);
    else if (right) this.setVelocityX(speed);
    else this.setVelocityX(0);
    if (left) this.setFlipX(true);
    if (right) this.setFlipX(false);
    if (jump && body.blocked.down) this.setVelocityY(JUMP_VELOCITY);
  }
}
