/**
 * SchoolVerse MainCampusScene 2.0
 * Fully playable 2D top-down pixel-art RPG campus powered by Phaser 3.
 * Features responsive viewport scaling, 7 distinct African academy zones,
 * custom student avatars, tile collisions, camera follow, and live multiplayer.
 */

import * as Phaser from 'phaser';
import { generatePixelArtTextures, generateCustomStudentTexture } from './textures.ts';
import { CampusBuilding, CampusPlayer, CampusMoveEvent } from '../types/index.ts';

export interface SceneConfig {
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  mapWidth: number; // in tiles
  mapHeight: number;
  tileSize: number;
  spawnX: number;
  spawnY: number;
  buildings: CampusBuilding[];
  currentStudent: any;
  onNearbyBuildingChange?: (building: CampusBuilding | null) => void;
  onNearbyPlayerChange?: (player: CampusPlayer | null) => void;
  onEnterBuilding?: (building: CampusBuilding) => void;
  onLocationChange?: (locationName: string) => void;
  onZoneDiscovered?: (zoneName: string) => void;
  onPlayerMoveBroadcast?: (x: number, y: number, dir: 'up' | 'down' | 'left' | 'right', isMoving: boolean, zone: string) => void;
}

export class MainCampusScene extends Phaser.Scene {
  private configData: SceneConfig;
  public player!: Phaser.Physics.Arcade.Sprite;
  private playerNameTag!: Phaser.GameObjects.Container;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key; E: Phaser.Input.Keyboard.Key; SPACE: Phaser.Input.Keyboard.Key };

  private buildingsGroup!: Phaser.Physics.Arcade.StaticGroup;
  private obstaclesGroup!: Phaser.Physics.Arcade.StaticGroup;
  private doorSensors!: Phaser.Physics.Arcade.StaticGroup;

  private currentNearbyBuilding: CampusBuilding | null = null;
  private currentNearbyPlayer: CampusPlayer | null = null;
  private currentZone: string = 'Security Gate & Campus Entrance';

  // Remote players dictionary: studentId -> RemotePlayerObject
  private remotePlayers = new Map<string, {
    sprite: Phaser.Physics.Arcade.Sprite;
    nameTag: Phaser.GameObjects.Container;
    speechBubble?: Phaser.GameObjects.Container;
    targetX: number;
    targetY: number;
    direction: 'up' | 'down' | 'left' | 'right';
    isMoving: boolean;
    data: CampusPlayer;
  }>();

  // Mobile virtual joystick input vector
  private mobileJoystickVector = { x: 0, y: 0 };
  private playerSpeed = 195;
  private lastMoveBroadcast = 0;
  private currentDirection: 'up' | 'down' | 'left' | 'right' = 'down';
  private playerSpriteSheetKey: string = 'student_0_sheet';
  private playerAnimPrefix: string = 'student_0';

  constructor(configData: SceneConfig) {
    super({ key: 'MainCampusScene' });
    this.configData = configData;
  }

  public updateConfig(newConfig: SceneConfig) {
    this.configData = newConfig;
  }

  preload() {
    // Generate all pixel art textures dynamically
    generatePixelArtTextures(this);

    // Generate custom student avatar spritesheet for current student
    const student = this.configData.currentStudent;
    if (student) {
      this.playerSpriteSheetKey = generateCustomStudentTexture(
        this,
        student.id || 'local',
        student.customization || { skin_tone: 1, hair_style: 'fade', uniform_style: 'school' }
      );
      this.playerAnimPrefix = `custom_${student.id || 'local'}`;
    }
  }

  create() {
    const { mapWidth, mapHeight, tileSize, spawnX, spawnY, buildings } = this.configData;
    const mapWidthPx = mapWidth * tileSize;
    const mapHeightPx = mapHeight * tileSize;

    // Set world physics bounds
    this.physics.world.setBounds(0, 0, mapWidthPx, mapHeightPx);

    // Initialize collision and trigger groups
    this.buildingsGroup = this.physics.add.staticGroup();
    this.obstaclesGroup = this.physics.add.staticGroup();
    this.doorSensors = this.physics.add.staticGroup();

    // 1. Render Ground Terrain (Grass, Paths, Courtyard, Track, Field, Hedges)
    this.buildCampusTerrain(mapWidth, mapHeight, tileSize);

    // 2. Render Campus Buildings & Collision Boxes
    this.buildCampusBuildings(buildings);

    // 3. Render Decorative Environmental Scenery (Trees, Palms, Benches, Fountain, Signs, Posts)
    this.buildCampusScenery(mapWidth, mapHeight, tileSize);

    // 4. Create Player Animations
    this.createPlayerAnimations();

    // 5. Create Local Player Avatar
    this.player = this.physics.add.sprite(spawnX, spawnY, this.playerSpriteSheetKey, 0);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(20);

    // Tightly tune physics hitbox to character's feet for natural top-down RPG depth
    this.player.setSize(18, 14);
    this.player.setOffset(7, 34);

    // Add Player Name Tag above head
    this.playerNameTag = this.createNameTag(
      this.configData.currentStudent.displayName || 'You',
      this.configData.currentStudent.level || 1,
      this.configData.schoolCode || 'BGS',
      true
    );

    // Collide player with building walls and obstacles
    this.physics.add.collider(this.player, this.buildingsGroup);
    this.physics.add.collider(this.player, this.obstaclesGroup);

    // Setup Building Entrance Overlap Detection
    this.physics.add.overlap(
      this.player,
      this.doorSensors,
      (_, sensor) => {
        const building = (sensor as any).buildingData as CampusBuilding;
        if (building && this.currentNearbyBuilding?.id !== building.id) {
          this.currentNearbyBuilding = building;
          this.configData.onNearbyBuildingChange?.(building);
        }
      },
      undefined,
      this
    );

    // Setup Camera Viewport with Responsive Scale & Bounds
    const initialZoom = this.calculateResponsiveZoom(this.scale.width);
    this.cameras.main.setBounds(0, 0, mapWidthPx, mapHeightPx);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(30, 30);
    this.cameras.main.setZoom(initialZoom);

    // Setup Keyboard Controls
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasdKeys = this.input.keyboard.addKeys({
        W: Phaser.Input.Keyboard.KeyCodes.W,
        A: Phaser.Input.Keyboard.KeyCodes.A,
        S: Phaser.Input.Keyboard.KeyCodes.S,
        D: Phaser.Input.Keyboard.KeyCodes.D,
        E: Phaser.Input.Keyboard.KeyCodes.E,
        SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
      }) as any;

      this.input.keyboard.on('keydown-E', () => this.handleActionTrigger());
      this.input.keyboard.on('keydown-SPACE', () => this.handleActionTrigger());
    }

    // Responsive Canvas Resize Listener
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      const newZoom = this.calculateResponsiveZoom(gameSize.width);
      this.cameras.main.setZoom(newZoom);
    });
  }

  private calculateResponsiveZoom(width: number): number {
    if (width < 640) return 1.5;
    if (width < 1024) return 1.75;
    return 1.95;
  }

  /**
   * Dynamically update player customization in real time (e.g. from Wardrobe modal)
   */
  public updatePlayerCustomization(customization: any) {
    const student = this.configData.currentStudent;
    this.playerSpriteSheetKey = generateCustomStudentTexture(this, student.id || 'local', customization);
    this.playerAnimPrefix = `custom_${student.id || 'local'}`;
    this.createCustomAnimation(this.playerAnimPrefix, this.playerSpriteSheetKey);
    this.player.setTexture(this.playerSpriteSheetKey, 0);
  }

  private buildCampusTerrain(mapWidth: number, mapHeight: number, tileSize: number) {
    // 1. Fill ground with rich grass & occasional wildflower patches
    for (let x = 0; x < mapWidth; x++) {
      for (let y = 0; y < mapHeight; y++) {
        const isFlower = (x * 7 + y * 13) % 9 === 0;
        this.add.image(x * tileSize + 16, y * tileSize + 16, isFlower ? 'tile_grass_flower' : 'tile_grass').setDepth(0);
      }
    }

    // 2. Central Courtyard Quadrangle (x: 22 to 38, y: 22 to 34)
    for (let x = 22; x <= 38; x++) {
      for (let y = 22; y <= 34; y++) {
        const isPattern = (x === 22 || x === 38 || y === 22 || y === 34) || ((x + y) % 4 === 0);
        this.add.image(
          x * tileSize + 16,
          y * tileSize + 16,
          isPattern ? 'tile_stone_pattern' : 'tile_courtyard'
        ).setDepth(1);
      }
    }

    // Flowerbed borders lining the Courtyard
    for (let x = 24; x <= 36; x++) {
      if (x < 28 || x > 32) {
        this.add.image(x * tileSize + 16, 23 * tileSize + 16, 'tile_flowerbed').setDepth(2);
        this.add.image(x * tileSize + 16, 33 * tileSize + 16, 'tile_flowerbed').setDepth(2);
      }
    }

    // 3. Central Shimmering Fountain Monument in Courtyard Center
    this.add.image(30 * tileSize + 16, 28 * tileSize + 16, 'obj_fountain').setDepth(3);
    const fountainCollider = this.obstaclesGroup.create(30 * tileSize + 16, 28 * tileSize + 16, undefined);
    fountainCollider.setSize(52, 40).setVisible(false);

    // 4. North Athletic Sports Track & Field (x: 23 to 45, y: 12 to 21)
    // Running track outer boundary
    for (let x = 23; x <= 45; x++) {
      this.add.image(x * tileSize + 16, 12 * tileSize + 16, 'tile_track').setDepth(1);
      this.add.image(x * tileSize + 16, 21 * tileSize + 16, 'tile_track').setDepth(1);
    }
    for (let y = 12; y <= 21; y++) {
      this.add.image(23 * tileSize + 16, y * tileSize + 16, 'tile_track').setDepth(1);
      this.add.image(45 * tileSize + 16, y * tileSize + 16, 'tile_track').setDepth(1);
    }

    // Green athletic field interior (Football pitch & court)
    for (let x = 24; x <= 44; x++) {
      for (let y = 13; y <= 20; y++) {
        this.add.image(x * tileSize + 16, y * tileSize + 16, 'tile_court').setDepth(1);
      }
    }

    // Goalposts at both ends of football pitch
    this.add.image(25 * tileSize + 16, 16 * tileSize + 16, 'obj_goalpost').setDepth(3);
    this.add.image(43 * tileSize + 16, 16 * tileSize + 16, 'obj_goalpost').setDepth(3).setFlipX(true);
    // Basketball hoop on court side
    this.add.image(34 * tileSize + 16, 14 * tileSize + 16, 'obj_basketball_hoop').setDepth(4);

    // 5. Interconnecting Stone Walkways
    // Main North-South thoroughfare from Security Entrance (y: 38..44) to Admin HQ (y: 4..11)
    for (let y = 11; y <= 43; y++) {
      for (let x = 29; x <= 31; x++) {
        this.add.image(x * tileSize + 16, y * tileSize + 16, 'tile_path').setDepth(1);
      }
    }

    // Hedges lining the Entrance Boulevard
    for (let y = 35; y <= 42; y++) {
      this.add.image(28 * tileSize + 16, y * tileSize + 16, 'tile_hedge').setDepth(2);
      this.add.image(32 * tileSize + 16, y * tileSize + 16, 'tile_hedge').setDepth(2);
    }

    // West walkway wings (Math, Literature, Library)
    for (let x = 5; x <= 29; x++) {
      this.add.image(x * tileSize + 16, 28 * tileSize + 16, 'tile_path').setDepth(1);
      this.add.image(x * tileSize + 16, 13 * tileSize + 16, 'tile_path').setDepth(1);
      this.add.image(x * tileSize + 16, 23 * tileSize + 16, 'tile_path').setDepth(1);
      this.add.image(x * tileSize + 16, 33 * tileSize + 16, 'tile_path').setDepth(1);
    }

    // East walkway wings (Science, CS, Exam Hall)
    for (let x = 31; x <= 55; x++) {
      this.add.image(x * tileSize + 16, 28 * tileSize + 16, 'tile_path').setDepth(1);
      this.add.image(x * tileSize + 16, 13 * tileSize + 16, 'tile_path').setDepth(1);
      this.add.image(x * tileSize + 16, 23 * tileSize + 16, 'tile_path').setDepth(1);
      this.add.image(x * tileSize + 16, 33 * tileSize + 16, 'tile_path').setDepth(1);
    }

    // Southwest walkway to Cafeteria (y: 35-41, x: 19-21)
    for (let y = 35; y <= 41; y++) {
      for (let x = 19; x <= 21; x++) {
        this.add.image(x * tileSize + 16, y * tileSize + 16, 'tile_path').setDepth(1);
      }
    }

    // Southeast walkway to Lounge (y: 35-41, x: 39-41)
    for (let y = 35; y <= 41; y++) {
      for (let x = 39; x <= 41; x++) {
        this.add.image(x * tileSize + 16, y * tileSize + 16, 'tile_path').setDepth(1);
      }
    }

    // Garden hedges along courtyard borders
    for (let x = 14; x <= 21; x++) {
      this.add.image(x * tileSize + 16, 27 * tileSize + 16, 'tile_hedge').setDepth(2);
      this.add.image(x * tileSize + 16, 29 * tileSize + 16, 'tile_hedge').setDepth(2);
    }
    for (let x = 39; x <= 46; x++) {
      this.add.image(x * tileSize + 16, 27 * tileSize + 16, 'tile_hedge').setDepth(2);
      this.add.image(x * tileSize + 16, 29 * tileSize + 16, 'tile_hedge').setDepth(2);
    }

    // Perimeter Academy Wall Boundary
    for (let x = 0; x < mapWidth; x++) {
      const topWall = this.buildingsGroup.create(x * tileSize + 16, 16, 'tile_wall');
      topWall.setDepth(3);
      if (x < 26 || x > 34) {
        const botWall = this.buildingsGroup.create(x * tileSize + 16, (mapHeight - 1) * tileSize + 16, 'tile_wall');
        botWall.setDepth(3);
      }
    }
    for (let y = 0; y < mapHeight; y++) {
      const leftWall = this.buildingsGroup.create(16, y * tileSize + 16, 'tile_wall');
      leftWall.setDepth(3);
      const rightWall = this.buildingsGroup.create((mapWidth - 1) * tileSize + 16, y * tileSize + 16, 'tile_wall');
      rightWall.setDepth(3);
    }
  }

  private buildCampusBuildings(buildings: CampusBuilding[]) {
    const tileSize = 32;

    for (const b of buildings) {
      const startTileX = Math.round(b.x / tileSize);
      const startTileY = Math.round(b.y / tileSize);
      const widthTiles = Math.round(b.width / tileSize);
      const heightTiles = Math.round(b.height / tileSize);

      // Render building structure
      for (let tx = startTileX; tx < startTileX + widthTiles; tx++) {
        for (let ty = startTileY; ty < startTileY + heightTiles; ty++) {
          const px = tx * tileSize + 16;
          const py = ty * tileSize + 16;

          // Top half: Roof shingles
          if (ty < startTileY + Math.floor(heightTiles / 2)) {
            this.add.image(px, py, 'tile_roof').setDepth(5);
          } else {
            // Lower half: Sturdy brick walls and glass windows
            if (tx > startTileX + 1 && tx < startTileX + widthTiles - 2 && ty === startTileY + Math.floor(heightTiles / 2)) {
              this.add.image(px, py, 'tile_window').setDepth(5);
            } else {
              this.add.image(px, py, 'tile_wall').setDepth(5);
            }
          }
        }
      }

      // Add solid physics collision block over building mass
      const collider = this.buildingsGroup.create(
        b.x + b.width / 2,
        b.y + b.height / 2,
        undefined
      );
      collider.setSize(b.width, b.height);
      collider.setVisible(false);

      // Render building entrance door
      this.add.image(b.entranceX, b.entranceY - 16, 'tile_door').setDepth(6);

      // Building Door Sign Banner (pixel-styled banner)
      const labelBg = this.add.graphics();
      labelBg.fillStyle(0x0f172a, 0.92);
      const boxW = Math.max(100, (b.doorLabel || b.name).length * 6.5 + 24);
      labelBg.fillRoundedRect(b.entranceX - boxW / 2, b.entranceY - 42, boxW, 20, 4);
      labelBg.lineStyle(1, 0xf59e0b, 0.9);
      labelBg.strokeRoundedRect(b.entranceX - boxW / 2, b.entranceY - 42, boxW, 20, 4);
      labelBg.setDepth(7);

      this.add.text(b.entranceX, b.entranceY - 32, b.doorLabel || b.name, {
        fontSize: '9px',
        color: '#f8fafc',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(8);

      // Door Sensor for entering the building
      const sensor = this.doorSensors.create(b.entranceX, b.entranceY, undefined);
      sensor.setSize(40, 28);
      sensor.setVisible(false);
      (sensor as any).buildingData = b;
    }
  }

  private buildCampusScenery(mapWidth: number, mapHeight: number, tileSize: number) {
    // School Entrance Security Gate at bottom center (x: 30, y: 41)
    this.add.image(30 * tileSize + 16, 41 * tileSize + 16, 'obj_gate').setDepth(6);

    // Grand Entrance Royal Palm Avenue (lining x: 27 and x: 33)
    const palmPositions = [
      { x: 26, y: 40 },
      { x: 34, y: 40 },
      { x: 26, y: 36 },
      { x: 34, y: 36 },
      { x: 26, y: 32 },
      { x: 34, y: 32 },
    ];
    for (const pos of palmPositions) {
      this.add.image(pos.x * tileSize + 16, pos.y * tileSize + 16, 'obj_palm_tree').setDepth(pos.y * tileSize + 30);
      const pCol = this.obstaclesGroup.create(pos.x * tileSize + 16, pos.y * tileSize + 32, undefined);
      pCol.setSize(12, 12).setVisible(false);
    }

    // Flagpoles at Academy Entrance & Administration
    this.add.image(28 * tileSize + 16, 42 * tileSize + 16, 'obj_flagpole').setDepth(15);
    this.add.image(32 * tileSize + 16, 42 * tileSize + 16, 'obj_flagpole').setDepth(15);
    this.add.image(30 * tileSize + 16, 12 * tileSize + 16, 'obj_flagpole').setDepth(15);

    // Directional Signposts
    this.add.image(27 * tileSize + 16, 35 * tileSize + 16, 'obj_signpost').setDepth(4);
    this.add.image(33 * tileSize + 16, 21 * tileSize + 16, 'obj_signpost').setDepth(4);

    // Outdoor Study Tables in Library Gardens and Cafeteria Terrace
    const tablePositions = [
      { x: 14, y: 30 },
      { x: 17, y: 30 },
      { x: 15, y: 38 },
      { x: 44, y: 38 },
    ];
    for (const pos of tablePositions) {
      this.add.image(pos.x * tileSize + 16, pos.y * tileSize + 16, 'obj_study_table').setDepth(pos.y * tileSize);
      const tCol = this.obstaclesGroup.create(pos.x * tileSize + 16, pos.y * tileSize + 10, undefined);
      tCol.setSize(36, 18).setVisible(false);
    }

    // Flowering Bougainvillea Bushes
    const flowerBushPositions = [
      { x: 23, y: 24 },
      { x: 37, y: 24 },
      { x: 23, y: 32 },
      { x: 37, y: 32 },
      { x: 16, y: 24 },
      { x: 44, y: 24 },
      { x: 27, y: 13 },
      { x: 33, y: 13 },
    ];
    for (const pos of flowerBushPositions) {
      this.add.image(pos.x * tileSize + 16, pos.y * tileSize + 16, 'obj_flower_bush').setDepth(3);
    }

    // Benches along courtyard and paths
    const benchPositions = [
      { x: 26, y: 26 },
      { x: 34, y: 26 },
      { x: 26, y: 30 },
      { x: 34, y: 30 },
      { x: 21, y: 38 },
      { x: 38, y: 38 },
      { x: 18, y: 13 },
      { x: 42, y: 13 },
    ];
    for (const pos of benchPositions) {
      this.add.image(pos.x * tileSize + 16, pos.y * tileSize + 16, 'obj_bench').setDepth(3);
      const bCol = this.obstaclesGroup.create(pos.x * tileSize + 16, pos.y * tileSize + 16, undefined);
      bCol.setSize(24, 14).setVisible(false);
    }

    // Street Lamps along pathways
    const lampPositions = [
      { x: 28, y: 37 },
      { x: 32, y: 37 },
      { x: 28, y: 20 },
      { x: 32, y: 20 },
      { x: 24, y: 28 },
      { x: 36, y: 28 },
      { x: 18, y: 28 },
      { x: 42, y: 28 },
    ];
    for (const pos of lampPositions) {
      this.add.image(pos.x * tileSize + 16, pos.y * tileSize + 16, 'obj_lamp').setDepth(15);
      const lCol = this.obstaclesGroup.create(pos.x * tileSize + 16, pos.y * tileSize + 20, undefined);
      lCol.setSize(8, 8).setVisible(false);
    }

    // Noticeboards near Entrance and Administration
    const boardPositions = [
      { x: 27, y: 37 },
      { x: 25, y: 11 },
    ];
    for (const pos of boardPositions) {
      this.add.image(pos.x * tileSize + 16, pos.y * tileSize + 16, 'obj_noticeboard').setDepth(3);
      const nCol = this.obstaclesGroup.create(pos.x * tileSize + 16, pos.y * tileSize + 16, undefined);
      nCol.setSize(26, 16).setVisible(false);
    }

    // Canopy Trees in academy groves
    const treePositions = [
      { x: 14, y: 8 },
      { x: 14, y: 19 },
      { x: 46, y: 8 },
      { x: 46, y: 19 },
      { x: 15, y: 42 },
      { x: 44, y: 42 },
      { x: 8, y: 39 },
      { x: 52, y: 39 },
    ];
    for (const pos of treePositions) {
      this.add.image(pos.x * tileSize + 16, pos.y * tileSize + 16, 'obj_tree').setDepth(pos.y * tileSize + 40);
      const tCol = this.obstaclesGroup.create(pos.x * tileSize + 16, pos.y * tileSize + 26, undefined);
      tCol.setSize(18, 12).setVisible(false);
    }
  }

  private createPlayerAnimations() {
    const variations = ['student_0', 'student_1', 'student_2', 'student_3'];
    for (const key of variations) {
      this.createCustomAnimation(key, key + '_sheet');
    }
    // Also create for custom local player prefix
    this.createCustomAnimation(this.playerAnimPrefix, this.playerSpriteSheetKey);
  }

  private createCustomAnimation(prefix: string, sheetKey: string) {
    if (!this.anims.exists(prefix + '_walk_down')) {
      this.anims.create({
        key: prefix + '_walk_down',
        frames: this.anims.generateFrameNumbers(sheetKey, { frames: [0, 1, 0, 2] }),
        frameRate: 8,
        repeat: -1,
      });
    }
    if (!this.anims.exists(prefix + '_walk_left')) {
      this.anims.create({
        key: prefix + '_walk_left',
        frames: this.anims.generateFrameNumbers(sheetKey, { frames: [3, 4, 3, 5] }),
        frameRate: 8,
        repeat: -1,
      });
    }
    if (!this.anims.exists(prefix + '_walk_right')) {
      this.anims.create({
        key: prefix + '_walk_right',
        frames: this.anims.generateFrameNumbers(sheetKey, { frames: [6, 7, 6, 8] }),
        frameRate: 8,
        repeat: -1,
      });
    }
    if (!this.anims.exists(prefix + '_walk_up')) {
      this.anims.create({
        key: prefix + '_walk_up',
        frames: this.anims.generateFrameNumbers(sheetKey, { frames: [9, 10, 9, 11] }),
        frameRate: 8,
        repeat: -1,
      });
    }
    if (!this.anims.exists(prefix + '_idle_down')) {
      this.anims.create({ key: prefix + '_idle_down', frames: [{ key: sheetKey, frame: 0 }] });
    }
    if (!this.anims.exists(prefix + '_idle_left')) {
      this.anims.create({ key: prefix + '_idle_left', frames: [{ key: sheetKey, frame: 3 }] });
    }
    if (!this.anims.exists(prefix + '_idle_right')) {
      this.anims.create({ key: prefix + '_idle_right', frames: [{ key: sheetKey, frame: 6 }] });
    }
    if (!this.anims.exists(prefix + '_idle_up')) {
      this.anims.create({ key: prefix + '_idle_up', frames: [{ key: sheetKey, frame: 9 }] });
    }
  }

  private createNameTag(displayName: string, level: number, schoolCode: string, isSelf: boolean) {
    const container = this.add.container(0, 0);
    container.setDepth(25);

    const bg = this.add.graphics();
    bg.fillStyle(0x030712, 0.88);
    const boxW = Math.max(76, displayName.length * 7 + 36);
    bg.fillRoundedRect(-boxW / 2, -18, boxW, 16, 4);
    bg.lineStyle(1, isSelf ? 0xf59e0b : 0x38bdf8, 0.9);
    bg.strokeRoundedRect(-boxW / 2, -18, boxW, 16, 4);

    const text = this.add.text(0, -10, `${displayName} · Lv${level}`, {
      fontSize: '9px',
      color: isSelf ? '#fef08a' : '#f8fafc',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([bg, text]);
    return container;
  }

  public setMobileJoystick(x: number, y: number) {
    this.mobileJoystickVector = { x, y };
  }

  public handleActionTrigger() {
    if (this.currentNearbyBuilding) {
      this.configData.onEnterBuilding?.(this.currentNearbyBuilding);
    } else if (this.currentNearbyPlayer) {
      this.configData.onNearbyPlayerChange?.(this.currentNearbyPlayer);
    }
  }

  update() {
    if (!this.player || !this.player.body) return;

    // 1. Calculate Velocity from Keyboard or Mobile Joystick
    let vx = 0;
    let vy = 0;

    if (this.cursors || this.wasdKeys) {
      const left = this.cursors.left.isDown || this.wasdKeys?.A.isDown;
      const right = this.cursors.right.isDown || this.wasdKeys?.D.isDown;
      const up = this.cursors.up.isDown || this.wasdKeys?.W.isDown;
      const down = this.cursors.down.isDown || this.wasdKeys?.S.isDown;

      if (left) vx -= 1;
      if (right) vx += 1;
      if (up) vy -= 1;
      if (down) vy += 1;
    }

    if (Math.abs(this.mobileJoystickVector.x) > 0.1 || Math.abs(this.mobileJoystickVector.y) > 0.1) {
      vx = this.mobileJoystickVector.x;
      vy = this.mobileJoystickVector.y;
    }

    const isMoving = vx !== 0 || vy !== 0;
    if (isMoving) {
      const len = Math.sqrt(vx * vx + vy * vy);
      vx = (vx / len) * this.playerSpeed;
      vy = (vy / len) * this.playerSpeed;
    }

    this.player.setVelocity(vx, vy);

    // 2. Play Walking / Idle Animations
    const animPrefix = this.playerAnimPrefix;
    if (isMoving) {
      if (Math.abs(vx) > Math.abs(vy)) {
        if (vx > 0) {
          this.currentDirection = 'right';
          this.player.anims.play(animPrefix + '_walk_right', true);
        } else {
          this.currentDirection = 'left';
          this.player.anims.play(animPrefix + '_walk_left', true);
        }
      } else {
        if (vy > 0) {
          this.currentDirection = 'down';
          this.player.anims.play(animPrefix + '_walk_down', true);
        } else {
          this.currentDirection = 'up';
          this.player.anims.play(animPrefix + '_walk_up', true);
        }
      }
    } else {
      this.player.anims.play(animPrefix + '_idle_' + this.currentDirection, true);
    }

    // 3. Keep local Name Tag centered above Player's head with dynamic Y-depth
    this.playerNameTag.setPosition(this.player.x, this.player.y - 30);
    this.player.setDepth(this.player.y);

    // 4. Update Current Campus Zone & Trigger Discovery
    this.evaluateCurrentZone(this.player.x, this.player.y);

    // 5. Broadcast movement to peers in same school (~11 updates/sec)
    const now = Date.now();
    if (isMoving || now - this.lastMoveBroadcast > 1000) {
      this.configData.onPlayerMoveBroadcast?.(
        this.player.x,
        this.player.y,
        this.currentDirection,
        isMoving,
        this.currentZone
      );
      this.lastMoveBroadcast = now;
    }

    // 6. Smoothly Interpolate Remote Players (Lerping)
    this.updateRemotePlayers();

    // 7. Check Proximity to Remote Players for [ INTERACT ] Prompt
    this.checkNearbyStudents();

    // 8. Reset Building Overlap if player stepped away
    if (this.currentNearbyBuilding) {
      const dist = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.currentNearbyBuilding.entranceX,
        this.currentNearbyBuilding.entranceY
      );
      if (dist > 54) {
        this.currentNearbyBuilding = null;
        this.configData.onNearbyBuildingChange?.(null);
      }
    }
  }

  private evaluateCurrentZone(x: number, y: number) {
    let zone = 'Central Courtyard & Monument';
    if (y > 38 * 32) zone = 'Security Gate & Campus Entrance';
    else if (x >= 22 * 32 && x <= 38 * 32 && y >= 22 * 32 && y <= 34 * 32) zone = 'Central Courtyard & Monument';
    else if (y < 12 * 32 && x >= 24 * 32 && x <= 36 * 32) zone = 'Administrative Honors Pavilion';
    else if (x < 16 * 32 && y < 15 * 32) zone = 'Mathematics Lecture Hall';
    else if (x < 16 * 32 && y >= 15 * 32 && y < 25 * 32) zone = 'English & Literature Wing';
    else if (x < 16 * 32 && y >= 25 * 32) zone = 'Central Library Gardens';
    else if (x > 44 * 32 && y < 15 * 32) zone = 'Natural Sciences Laboratory Wing';
    else if (x > 44 * 32 && y >= 15 * 32 && y < 25 * 32) zone = 'Computer Science & Tech Station';
    else if (x > 44 * 32 && y >= 25 * 32) zone = 'Grand Examination Arena';
    else if (x >= 23 * 32 && x <= 45 * 32 && y >= 12 * 32 && y <= 21 * 32) zone = 'Athletic Field & Track';
    else if (x >= 14 * 32 && x <= 23 * 32 && y >= 34 * 32) zone = 'Student Dining Hall & Terrace';
    else if (x >= 37 * 32 && x <= 46 * 32 && y >= 34 * 32) zone = 'Student Common Lounge & Gazebo';

    if (zone !== this.currentZone) {
      this.currentZone = zone;
      this.configData.onLocationChange?.(zone);
      this.configData.onZoneDiscovered?.(zone);
    }
  }

  // --- Realtime Remote Players Management ---

  public syncRemotePlayerMove(moveEvent: CampusMoveEvent) {
    const remote = this.remotePlayers.get(moveEvent.studentId);
    if (remote) {
      remote.targetX = moveEvent.x;
      remote.targetY = moveEvent.y;
      remote.direction = moveEvent.direction;
      remote.isMoving = moveEvent.isMoving;
    }
  }

  public addRemotePlayer(player: CampusPlayer) {
    if (player.studentId === this.configData.currentStudent.id) return;
    if (this.remotePlayers.has(player.studentId)) return;

    const spriteIdx = (player.level % 4);
    const spriteKey = `student_${spriteIdx}`;

    const sprite = this.physics.add.sprite(player.x, player.y, spriteKey + '_sheet', 0);
    sprite.setDepth(player.y);
    sprite.setSize(18, 14);
    sprite.setOffset(7, 34);

    const nameTag = this.createNameTag(
      player.displayName || player.username,
      player.level || 1,
      player.schoolCode || this.configData.schoolCode,
      false
    );

    this.remotePlayers.set(player.studentId, {
      sprite,
      nameTag,
      targetX: player.x,
      targetY: player.y,
      direction: player.direction || 'down',
      isMoving: false,
      data: player,
    });
  }

  public removeRemotePlayer(studentId: string) {
    const remote = this.remotePlayers.get(studentId);
    if (remote) {
      remote.sprite.destroy();
      remote.nameTag.destroy();
      remote.speechBubble?.destroy();
      this.remotePlayers.delete(studentId);
    }
  }

  public syncAllRemotePlayers(players: CampusPlayer[]) {
    const incomingIds = new Set(players.map((p) => p.studentId));
    for (const [id] of this.remotePlayers) {
      if (!incomingIds.has(id)) {
        this.removeRemotePlayer(id);
      }
    }
    for (const p of players) {
      if (p.studentId !== this.configData.currentStudent.id) {
        if (!this.remotePlayers.has(p.studentId)) {
          this.addRemotePlayer(p);
        } else {
          const r = this.remotePlayers.get(p.studentId)!;
          r.targetX = p.x;
          r.targetY = p.y;
        }
      }
    }
  }

  public displaySpeechBubble(studentId: string, message: string) {
    const isSelf = studentId === this.configData.currentStudent.id;
    const targetObj = isSelf ? { x: this.player.x, y: this.player.y } : this.remotePlayers.get(studentId)?.sprite;

    if (!targetObj) return;

    const bubble = this.add.container(targetObj.x, targetObj.y - 50);
    bubble.setDepth(35);

    const text = this.add.text(0, 0, message, {
      fontSize: '10px',
      color: '#0f172a',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontStyle: 'bold',
      wordWrap: { width: 140 },
    }).setOrigin(0.5);

    const bounds = text.getBounds();
    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 0.95);
    bg.fillRoundedRect(bounds.x - 8, bounds.y - 6, bounds.width + 16, bounds.height + 12, 6);
    bg.lineStyle(1, 0xf59e0b, 1);
    bg.strokeRoundedRect(bounds.x - 8, bounds.y - 6, bounds.width + 16, bounds.height + 12, 6);

    bubble.add([bg, text]);

    this.tweens.add({
      targets: bubble,
      alpha: { from: 0, to: 1 },
      y: '-=8',
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(4000, () => {
          this.tweens.add({
            targets: bubble,
            alpha: 0,
            y: '-=10',
            duration: 300,
            onComplete: () => bubble.destroy(),
          });
        });
      },
    });
  }

  private updateRemotePlayers() {
    for (const [_, remote] of this.remotePlayers) {
      const { sprite, nameTag, targetX, targetY, direction, isMoving } = remote;
      const spriteIdx = (remote.data.level % 4);
      const spriteKey = `student_${spriteIdx}`;

      sprite.x += (targetX - sprite.x) * 0.22;
      sprite.y += (targetY - sprite.y) * 0.22;

      nameTag.setPosition(sprite.x, sprite.y - 30);
      sprite.setDepth(sprite.y);

      if (isMoving) {
        sprite.anims.play(spriteKey + '_walk_' + direction, true);
      } else {
        sprite.anims.play(spriteKey + '_idle_' + direction, true);
      }
    }
  }

  private checkNearbyStudents() {
    let closestPeer: CampusPlayer | null = null;
    let minDistance = 50;

    for (const [_, remote] of this.remotePlayers) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, remote.sprite.x, remote.sprite.y);
      if (dist < minDistance) {
        minDistance = dist;
        closestPeer = remote.data;
      }
    }

    if (closestPeer?.studentId !== this.currentNearbyPlayer?.studentId) {
      this.currentNearbyPlayer = closestPeer;
      this.configData.onNearbyPlayerChange?.(closestPeer);
    }
  }
}
