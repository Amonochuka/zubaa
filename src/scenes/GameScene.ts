import Phaser from 'phaser';
import items from '../data/items.json';
import { GROUND_Y, GAME_HEIGHT, GAME_WIDTH, SIZE_MAX, WORLD_WIDTH } from '../config';
import { Player } from '../entities/Player';
import { SizeSystem } from '../systems/SizeSystem';

type ItemDefinition = { id: string; name: string; kind: string; politician: number; citizen: number; color: string; symbol: string };

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private sizes = new SizeSystem();
  private hudText!: Phaser.GameObjects.Text;
  private bars!: Phaser.GameObjects.Graphics;
  private collected = 0;
  private totalPickups = 0;
  private burstCooldown = 0;
  private checkpointActive = false;
  private checkpointResolved = false;
  private checkpointUi?: Phaser.GameObjects.Container;
  private bribeKey!: Phaser.Input.Keyboard.Key;
  private refuseKey!: Phaser.Input.Keyboard.Key;

  constructor() { super('GameScene'); }

  create(): void {
    this.sizes.reset();
    this.collected = 0;
    this.burstCooldown = 0;
    this.checkpointActive = false;
    this.checkpointResolved = false;
    this.checkpointUi = undefined;
    this.bribeKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.B);
    this.refuseKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT);
    this.drawWorld();
    this.player = new Player(this, 90, GROUND_Y);
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(250, 100);
    const platforms = this.physics.add.staticGroup();
    for (const [x, y, width] of [[300, 380, 150], [570, 330, 170], [880, 385, 180], [1190, 325, 160], [1470, 380, 180]]) {
      const platform = this.add.rectangle(x, y, width, 18, 0x526e70).setStrokeStyle(2, 0x75928a);
      platforms.add(platform);
    }
    // Leave a real gap in the street for the sinkhole trap.
    for (const [x, width] of [[495, 990], [1440, 720]]) {
      const ground = this.add.rectangle(x, GROUND_Y + 30, width, 60, 0x30443f);
      platforms.add(ground);
    }
    this.physics.add.collider(this.player, platforms);

    const pickups = this.physics.add.group({ allowGravity: false, immovable: true });
    const itemById = new Map((items as ItemDefinition[]).map((item) => [item.id, item]));
    const placements: Array<[number, number, string]> = [
      [190, 420, 'envelope'], [350, 337, 'lunch'], [485, 430, 'tender'], [640, 285, 'water'],
      [825, 425, 'fake_receipt'], [910, 345, 'hospital_budget'], [1100, 425, 'facilitation_fee'],
      [1175, 425, 'ghost_worker'], [1260, 280, 'borehole'], [1320, 425, 'lunch'],
      [1510, 335, 'donor_delivery'], [1600, 425, 'donor_diversion'], [1700, 425, 'road_tarmac'],
      [1760, 425, 'water'],
    ];
    this.totalPickups = placements.length;
    placements.forEach(([x, y, itemId]) => {
      const definition = itemById.get(itemId);
      if (!definition) return;
      const color = Number(definition.color.replace('#', '0x'));
      const pickup = this.add.rectangle(x, y, 28, 28, color).setStrokeStyle(2, 0xffffff).setRotation(Math.PI / 4);
      this.add.text(x, y - 1, definition.symbol, { fontFamily: 'Arial, sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#101b24' }).setOrigin(0.5);
      const body = pickups.create(x, y, 'player-0') as Phaser.Physics.Arcade.Image;
      body.setVisible(false).setAlpha(0).setImmovable(true);
      body.setSize(34, 34);
      body.setData('definition', definition);
      pickup.setData('body', body);
      this.tweens.add({ targets: pickup, y: y - 7, duration: 850, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });
    this.physics.add.overlap(this.player, pickups, (_player, object) => {
      const pickup = object as Phaser.Physics.Arcade.Image;
      const definition = pickup.getData('definition') as ItemDefinition;
      this.sizes.consume(definition.politician, definition.citizen);
      pickup.disableBody(true, true);
      this.collected += 1;
      this.updatePlayerSize();
      this.updateHud();
      this.add.text(this.player.x, this.player.y - 54, definition.kind === 'illegal' ? `+${definition.politician} POWER` : `+${definition.citizen} PEOPLE`, { fontFamily: 'Arial, sans-serif', fontSize: '13px', fontStyle: 'bold', color: definition.color, stroke: '#101b24', strokeThickness: 3 }).setOrigin(0.5).setDepth(10);
    });

    this.createHazards();

    this.hudText = this.add.text(22, 18, '', { fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#e9e6dc', lineSpacing: 8 }).setScrollFactor(0).setDepth(20);
    this.bars = this.add.graphics().setScrollFactor(0).setDepth(20);
    this.add.text(22, 112, 'TIP: BIG CITIZENS CAN HELP YOU REACH HIGHER PLATFORMS', { fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#a8b5bc' }).setScrollFactor(0).setDepth(20);
    this.updateHud();
    this.add.text(WORLD_WIDTH - 30, 415, 'THE NEIGHBOURHOOD', { fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#a8b5bc' }).setOrigin(1).setDepth(1);
  }

  update(_time: number, delta: number): void {
    if (this.checkpointActive) {
      if (Phaser.Input.Keyboard.JustDown(this.bribeKey)) this.offerBribe();
      if (Phaser.Input.Keyboard.JustDown(this.refuseKey)) this.refuseInspection();
      return;
    }
    this.player.update();
    this.burstCooldown = Math.max(0, this.burstCooldown - delta);
    if (this.player.x > WORLD_WIDTH - 30) this.scene.start('EndScene', { sizes: this.sizes.values });
    if (this.player.y > GAME_HEIGHT + 150) {
      this.player.setPosition(80, GROUND_Y - 2);
      this.player.setVelocity(0, 0);
    }
  }

  private createHazards(): void {
    const hazards = this.physics.add.group({ allowGravity: false, immovable: true });
    const definitions = [
      { x: 550, y: GROUND_Y - 28, width: 54, height: 56, kind: 'flash' },
      { x: 750, y: GROUND_Y - 13, width: 58, height: 26, kind: 'burst' },
      { x: 1035, y: GAME_HEIGHT - 7, width: 96, height: 70, kind: 'sinkhole' },
      { x: 1170, y: GROUND_Y - 23, width: 38, height: 46, kind: 'auditor' },
      // A full-height sensor makes the ordinary-looking service booth unavoidable.
      { x: 1370, y: GAME_HEIGHT / 2, width: 58, height: GAME_HEIGHT, kind: 'checkpoint' },
    ];

    for (const hazard of definitions) {
      const isAuditor = hazard.kind === 'auditor';
      const sensor = hazards.create(hazard.x, hazard.y, isAuditor ? 'auditor' : 'player-0') as Phaser.Physics.Arcade.Image;
      sensor.setVisible(isAuditor).setAlpha(isAuditor ? 1 : 0).setImmovable(true).setSize(hazard.width, hazard.height);
      sensor.setData('kind', hazard.kind);

      if (hazard.kind === 'flash') {
        this.add.ellipse(hazard.x, GROUND_Y - 8, 38, 25, 0x455d5c).setDepth(3);
        this.add.rectangle(hazard.x, GROUND_Y - 34, 34, 25, 0x526e70).setStrokeStyle(2, 0xc8c49f).setDepth(4);
        this.add.rectangle(hazard.x + 23, GROUND_Y - 39, 12, 10, 0xf5bb45).setDepth(5);
        this.add.circle(hazard.x - 17, GROUND_Y - 51, 5, 0xf0c497).setDepth(5);
        this.add.text(hazard.x, GROUND_Y - 69, 'PRESS', { fontFamily: 'Arial, sans-serif', fontSize: '9px', color: '#c8c49f' }).setOrigin(0.5);
      } else if (hazard.kind === 'burst') {
        this.add.rectangle(hazard.x, GROUND_Y - 4, hazard.width + 12, 12, 0x26343b).setDepth(3);
        const spikes = this.add.graphics().setDepth(4);
        spikes.fillStyle(0xed6a5a);
        for (let x = hazard.x - 26; x <= hazard.x + 26; x += 13) {
          spikes.fillTriangle(x - 7, GROUND_Y - 8, x + 7, GROUND_Y - 8, x, GROUND_Y - 28);
        }
        this.add.text(hazard.x, GROUND_Y - 43, 'BURST', { fontFamily: 'Arial, sans-serif', fontSize: '10px', fontStyle: 'bold', color: '#ed6a5a' }).setOrigin(0.5);
      } else if (hazard.kind === 'sinkhole') {
        this.add.ellipse(hazard.x, GROUND_Y + 12, hazard.width, 38, 0x131b20).setStrokeStyle(3, 0x657276).setDepth(3);
        this.add.ellipse(hazard.x, GROUND_Y + 18, 58, 17, 0x080d11).setDepth(4);
        this.add.text(hazard.x, GROUND_Y - 17, 'OPEN DRAIN', { fontFamily: 'Arial, sans-serif', fontSize: '9px', fontStyle: 'bold', color: '#c8c49f' }).setOrigin(0.5);
      } else if (isAuditor) {
        this.add.text(hazard.x, hazard.y - 37, 'AUDITOR', { fontFamily: 'Arial, sans-serif', fontSize: '9px', fontStyle: 'bold', color: '#b8d4bd' }).setOrigin(0.5);
        this.tweens.add({ targets: sensor, x: hazard.x + 70, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      } else {
        // Disguise the raid trigger as a routine public service kiosk.
        this.add.rectangle(hazard.x, GROUND_Y - 38, 64, 76, 0x899886).setStrokeStyle(2, 0xc8c49f).setDepth(4);
        this.add.rectangle(hazard.x, GROUND_Y - 65, 78, 12, 0x526e70).setDepth(5);
        this.add.rectangle(hazard.x, GROUND_Y - 47, 38, 23, 0xb7c2a2).setStrokeStyle(2, 0x445852).setDepth(5);
        this.add.rectangle(hazard.x, GROUND_Y - 13, 86, 4, 0xc8c49f).setDepth(4);
        this.add.text(hazard.x, GROUND_Y - 39, 'CIVIC\nDESK', { fontFamily: 'Arial, sans-serif', fontSize: '9px', fontStyle: 'bold', color: '#263944', align: 'center', lineSpacing: 1 }).setOrigin(0.5).setDepth(6);
        this.add.text(hazard.x, GROUND_Y - 90, 'PUBLIC SERVICES', { fontFamily: 'Arial, sans-serif', fontSize: '8px', color: '#c8c49f' }).setOrigin(0.5);
      }
    }

    this.physics.add.overlap(this.player, hazards, (_player, object) => {
      const hazard = object as Phaser.Physics.Arcade.Image;
      const kind = hazard.getData('kind') as string;
      if (kind === 'checkpoint') {
        if (!this.checkpointResolved && !this.checkpointActive) this.beginCheckpoint();
        return;
      }
      if (kind === 'flash') {
        if (hazard.getData('spent')) return;
        hazard.setData('spent', true).disableBody(true, true);
        this.sizes.spendPolitician(2);
        this.updatePlayerSize();
        this.updateHud();
        const flash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 0.78).setScrollFactor(0).setDepth(90);
        this.tweens.add({ targets: flash, alpha: 0, duration: 240, onComplete: () => flash.destroy() });
        this.showHazardMessage('FLASH!  −2 POWER', '#f5bb45');
        return;
      }
      if (this.burstCooldown > 0) return;
      this.burstCooldown = 1300;
      const penalty = kind === 'auditor' || kind === 'sinkhole' ? 2 : 3;
      this.sizes.burst(penalty);
      this.updatePlayerSize();
      this.updateHud();
      if (kind === 'sinkhole') {
        this.player.setPosition(915, GROUND_Y);
        this.player.setVelocity(0, 0);
        hazard.disableBody(true, true);
        this.showHazardMessage('SINKHOLE!  −2 SIZE', '#ed6a5a');
        return;
      }
      this.player.setVelocityY(-300);
      this.player.setTint(0xffffff);
      this.time.delayedCall(160, () => this.player.clearTint());
      const pop = this.add.circle(this.player.x, this.player.y - 32, 12, 0xed6a5a, 0.85).setDepth(12);
      this.tweens.add({ targets: pop, scale: 4, alpha: 0, duration: 320, onComplete: () => pop.destroy() });
      const message = kind === 'auditor' ? `AUDITED!  −${penalty} SIZE` : `BURST!  −${penalty} SIZE`;
      const loss = this.add.text(this.player.x, this.player.y - 72, message, { fontFamily: 'Arial, sans-serif', fontSize: '14px', fontStyle: 'bold', color: '#ed6a5a', stroke: '#101b24', strokeThickness: 4 }).setOrigin(0.5).setDepth(13);
      this.tweens.add({ targets: loss, y: loss.y - 35, alpha: 0, duration: 900, onComplete: () => loss.destroy() });
    });
  }

  private showHazardMessage(message: string, color: string): void {
    const loss = this.add.text(this.player.x, this.player.y - 72, message, { fontFamily: 'Arial, sans-serif', fontSize: '14px', fontStyle: 'bold', color, stroke: '#101b24', strokeThickness: 4 }).setOrigin(0.5).setDepth(13);
    this.tweens.add({ targets: loss, y: loss.y - 35, alpha: 0, duration: 900, onComplete: () => loss.destroy() });
  }

  private beginCheckpoint(): void {
    this.checkpointActive = true;
    this.player.setInputEnabled(false);
    this.player.setVelocity(0, 0);
    this.cameras.main.shake(180, 0.006);

    const panel = this.add.rectangle(480, 270, 620, 250, 0x101b24, 0.97).setStrokeStyle(2, 0xc8c49f);
    const title = this.add.text(480, 187, 'ROUTINE CHECK', { fontFamily: 'Georgia, serif', fontSize: '28px', fontStyle: 'bold', color: '#f5bb45' }).setOrigin(0.5);
    const message = this.add.text(480, 243, 'The inspector notices your pockets are heavy.\nAn envelope costs 1 POWER. It might get you through—or become evidence.', { fontFamily: 'Arial, sans-serif', fontSize: '15px', color: '#e9e6dc', align: 'center', lineSpacing: 8 }).setOrigin(0.5);
    const canBribe = this.sizes.values.politician > 0;
    const offer = this.add.text(350, 330, canBribe ? 'OFFER ENVELOPE  (B)' : 'NO ENVELOPE  (B)', {
      fontFamily: 'Arial, sans-serif', fontSize: '14px', fontStyle: 'bold',
      color: canBribe ? '#101b24' : '#829096',
      backgroundColor: canBribe ? '#f5bb45' : '#35434a',
      padding: { x: 16, y: 12 },
    }).setOrigin(0.5);
    const refuse = this.add.text(610, 330, 'COME CLEAN  (R)', {
      fontFamily: 'Arial, sans-serif', fontSize: '14px', fontStyle: 'bold', color: '#101b24',
      backgroundColor: '#63c7a2', padding: { x: 16, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    if (canBribe) offer.setInteractive({ useHandCursor: true });
    if (canBribe) offer.on('pointerdown', () => this.offerBribe());
    refuse.on('pointerdown', () => this.refuseInspection());
    this.checkpointUi = this.add.container(0, 0, [panel, title, message, offer, refuse]).setScrollFactor(0).setDepth(100);
  }

  private offerBribe(): void {
    if (!this.checkpointActive || this.sizes.values.politician < 1) return;
    this.sizes.spendPolitician(1);
    this.updatePlayerSize();
    this.updateHud();
    if (Phaser.Math.Between(1, 100) <= 55) {
      this.passCheckpoint('The envelope worked this time. You slip through.');
      return;
    }
    this.finishCheckpoint('The envelope was logged as evidence. The EACC raid catches you.', 'BRIBE BACKFIRED');
  }

  private refuseInspection(): void {
    if (!this.checkpointActive) return;
    if (this.sizes.values.politician > 0) {
      this.finishCheckpoint('The inspection finds the money you kept. The EACC raid catches you.', 'CAUGHT IN THE RAID');
      return;
    }
    this.passCheckpoint('Nothing to hide. You pass the inspection clean.');
  }

  private passCheckpoint(message: string): void {
    this.checkpointUi?.destroy(true);
    this.checkpointUi = undefined;
    this.checkpointActive = false;
    this.checkpointResolved = true;
    this.player.setInputEnabled(true);
    const toast = this.add.text(480, 100, message, { fontFamily: 'Arial, sans-serif', fontSize: '17px', fontStyle: 'bold', color: '#63c7a2', backgroundColor: '#101b24', padding: { x: 14, y: 10 }, align: 'center' }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    this.time.delayedCall(2600, () => toast.destroy());
  }

  private finishCheckpoint(message: string, title: string): void {
    this.checkpointUi?.destroy(true);
    this.checkpointUi = undefined;
    this.checkpointResolved = true;
    this.scene.start('EndScene', {
      sizes: this.sizes.values,
      ending: { title, message, color: '#ed6a5a' },
    });
  }

  private updatePlayerSize(): void {
    const { politician, citizen } = this.sizes.values;
    this.player.setSizeFactor(1 + (politician + citizen) / (SIZE_MAX * 2) * 0.8);
  }

  private updateHud(): void {
    const { politician, citizen } = this.sizes.values;
    this.hudText.setText(`MTA A • PUBLIC MONEY, PUBLIC CHOICES\nPOWER ${politician}/${SIZE_MAX}          PEOPLE ${citizen}/${SIZE_MAX}\nPICKUPS ${this.collected} / ${this.totalPickups}`);
    this.bars.clear();
    this.bars.fillStyle(0x263944).fillRoundedRect(22, 82, 180, 12, 6);
    this.bars.fillStyle(0xe78c48).fillRoundedRect(22, 82, 180 * politician / SIZE_MAX, 12, 6);
    this.bars.fillStyle(0x263944).fillRoundedRect(220, 82, 180, 12, 6);
    this.bars.fillStyle(0x63c7a2).fillRoundedRect(220, 82, 180 * citizen / SIZE_MAX, 12, 6);
  }

  private drawWorld(): void {
    const background = this.add.graphics();
    background.fillGradientStyle(0x192c38, 0x192c38, 0x344d55, 0x344d55, 1);
    background.fillRect(0, 0, WORLD_WIDTH, GAME_HEIGHT);
    for (let i = 0; i < 14; i += 1) {
      const x = i * 145 + 35;
      const h = 90 + (i * 37) % 115;
      background.fillStyle(i % 2 ? 0x263d46 : 0x2a4148, 1).fillRect(x, GROUND_Y - h, 100, h);
      for (let row = 0; row < 4; row += 1) background.fillStyle(0x496269, 0.7).fillRect(x + 13 + row % 2 * 9, GROUND_Y - h + 18 + row * 22, 8, 8);
    }
    this.add.rectangle(495, GROUND_Y, 990, 4, 0x9cbd8d).setDepth(2);
    this.add.rectangle(1440, GROUND_Y, 720, 4, 0x9cbd8d).setDepth(2);
    this.add.ellipse(1035, GROUND_Y + 12, 96, 38, 0x131b20).setDepth(1);
    this.add.text(36, 104, 'M T A A', { fontFamily: 'Georgia, serif', fontSize: '30px', fontStyle: 'bold', color: '#e9e6dc' }).setAlpha(0.13);
    this.add.text(WORLD_WIDTH - 250, 115, 'A better ending is in reach.', { fontFamily: 'Georgia, serif', fontSize: '19px', fontStyle: 'italic', color: '#e9e6dc' }).setAlpha(0.8);
    this.add.text(25, 438, 'START', { fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#a8b5bc' });
    this.add.text(GAME_WIDTH - 80, 18, '← → MOVE   SPACE JUMP', { fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#a8b5bc' }).setScrollFactor(0).setOrigin(1, 0).setDepth(20);
  }
}
