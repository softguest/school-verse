/**
 * SchoolVerse 2D Pixel-Art Texture Generator
 * Programmatically creates crisp, retro top-down pixel-art tiles, buildings, trees, and character spritesheets.
 * Guarantees zero broken external image links and instant loading in any environment.
 */

import * as Phaser from 'phaser';

export function generatePixelArtTextures(scene: Phaser.Scene) {
  // 1. Ground & Environment Tiles (32x32 each)
  createTileTextures(scene);

  // 2. Decorative Objects (Trees, Benches, Fountain, Signs, Lamp posts, Sports, Palms)
  createObjectTextures(scene);

  // 3. Multi-directional Character Spritesheets (4 preset colorways + custom player support)
  createStudentSpriteTextures(scene);
}

function createTileTextures(scene: Phaser.Scene) {
  // Grass Tile (Deep emerald academy lawn with subtle blade texture)
  if (!scene.textures.exists('tile_grass')) {
    const canvas = scene.textures.createCanvas('tile_grass', 32, 32);
    if (canvas) {
      const ctx = canvas.context;
      ctx.fillStyle = '#1e3a29'; // Base dark grass
      ctx.fillRect(0, 0, 32, 32);

      ctx.fillStyle = '#2d5a3e'; // Grass texture blades
      ctx.fillRect(4, 4, 3, 4);
      ctx.fillRect(16, 12, 3, 5);
      ctx.fillRect(24, 20, 4, 4);
      ctx.fillRect(8, 22, 3, 4);
      ctx.fillRect(20, 4, 3, 3);

      ctx.fillStyle = '#152b1e'; // Grass shadow accents
      ctx.fillRect(7, 8, 2, 2);
      ctx.fillRect(19, 17, 2, 2);
      ctx.fillRect(27, 24, 2, 2);
      canvas.refresh();
    }
  }

  // Grass with Wildflowers (32x32)
  if (!scene.textures.exists('tile_grass_flower')) {
    const canvas = scene.textures.createCanvas('tile_grass_flower', 32, 32);
    if (canvas) {
      const ctx = canvas.context;
      ctx.fillStyle = '#1e3a29';
      ctx.fillRect(0, 0, 32, 32);

      ctx.fillStyle = '#2d5a3e';
      ctx.fillRect(4, 8, 3, 4);
      ctx.fillRect(18, 16, 4, 4);

      // Tiny yellow buttercups & white daisies
      ctx.fillStyle = '#fde047';
      ctx.fillRect(8, 6, 2, 2);
      ctx.fillRect(22, 12, 2, 2);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(14, 22, 2, 2);
      ctx.fillRect(26, 24, 2, 2);
      canvas.refresh();
    }
  }

  // Clipped Garden Hedge Tile (32x32)
  if (!scene.textures.exists('tile_hedge')) {
    const canvas = scene.textures.createCanvas('tile_hedge', 32, 32);
    if (canvas) {
      const ctx = canvas.context;
      ctx.fillStyle = '#0f291e'; // Shadowed base
      ctx.fillRect(0, 0, 32, 32);

      ctx.fillStyle = '#166534'; // Lush green hedge leaves
      ctx.fillRect(2, 2, 28, 28);

      ctx.fillStyle = '#22c55e'; // Sunlit leaf glints
      ctx.fillRect(4, 4, 10, 4);
      ctx.fillRect(18, 6, 8, 4);
      ctx.fillRect(6, 14, 12, 4);
      ctx.fillRect(14, 20, 10, 4);

      ctx.fillStyle = '#14532d'; // Depth shading
      ctx.fillRect(2, 24, 28, 6);
      canvas.refresh();
    }
  }

  // Stone Pathway Tile (Cobblestone paver)
  if (!scene.textures.exists('tile_path')) {
    const canvas = scene.textures.createCanvas('tile_path', 32, 32);
    if (canvas) {
      const ctx = canvas.context;
      ctx.fillStyle = '#475569'; // Mortar dark
      ctx.fillRect(0, 0, 32, 32);

      // Stone blocks
      ctx.fillStyle = '#64748b';
      ctx.fillRect(2, 2, 13, 13);
      ctx.fillRect(17, 2, 13, 13);
      ctx.fillRect(2, 17, 13, 13);
      ctx.fillRect(17, 17, 13, 13);

      // Stone highlights
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(3, 3, 11, 2);
      ctx.fillRect(18, 3, 11, 2);
      ctx.fillRect(3, 18, 11, 2);
      ctx.fillRect(18, 18, 11, 2);
      canvas.refresh();
    }
  }

  // Courtyard Paver Tile (Earthy terracotta & slate)
  if (!scene.textures.exists('tile_courtyard')) {
    const canvas = scene.textures.createCanvas('tile_courtyard', 32, 32);
    if (canvas) {
      const ctx = canvas.context;
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 0, 32, 32);

      ctx.fillStyle = '#78350f'; // Terracotta brick
      ctx.fillRect(2, 2, 28, 13);
      ctx.fillRect(2, 17, 28, 13);

      ctx.fillStyle = '#92400e'; // Highlight
      ctx.fillRect(3, 3, 26, 2);
      ctx.fillRect(3, 18, 26, 2);
      canvas.refresh();
    }
  }

  // Geometric Pattern Courtyard Paver (32x32)
  if (!scene.textures.exists('tile_stone_pattern')) {
    const canvas = scene.textures.createCanvas('tile_stone_pattern', 32, 32);
    if (canvas) {
      const ctx = canvas.context;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 32, 32);

      ctx.fillStyle = '#334155';
      ctx.fillRect(2, 2, 28, 28);

      // Golden geometric star/diamond inlay
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.moveTo(16, 4);
      ctx.lineTo(28, 16);
      ctx.lineTo(16, 28);
      ctx.lineTo(4, 16);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#d97706';
      ctx.fillRect(13, 13, 6, 6);
      canvas.refresh();
    }
  }

  // Flowerbed Border Tile (32x32)
  if (!scene.textures.exists('tile_flowerbed')) {
    const canvas = scene.textures.createCanvas('tile_flowerbed', 32, 32);
    if (canvas) {
      const ctx = canvas.context;
      // Dark fertile garden soil
      ctx.fillStyle = '#291807';
      ctx.fillRect(0, 0, 32, 32);

      // Brick paver curb
      ctx.fillStyle = '#b45309';
      ctx.fillRect(0, 0, 32, 3);
      ctx.fillRect(0, 29, 32, 3);

      // Blooming tropical flowers (magenta, marigold, cream)
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.arc(8, 12, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(24, 18, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(16, 20, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Flower centers
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(7, 11, 2, 2);
      ctx.fillRect(23, 17, 2, 2);
      ctx.fillRect(15, 19, 2, 2);
      canvas.refresh();
    }
  }

  // Running Track Tile (Athletic terra-cotta red with white lane stripe)
  if (!scene.textures.exists('tile_track')) {
    const canvas = scene.textures.createCanvas('tile_track', 32, 32);
    if (canvas) {
      const ctx = canvas.context;
      ctx.fillStyle = '#991b1b'; // Track surface
      ctx.fillRect(0, 0, 32, 32);

      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(0, 4, 32, 24);

      ctx.fillStyle = '#f8fafc'; // White lane marking
      ctx.fillRect(0, 15, 32, 2);
      canvas.refresh();
    }
  }

  // Sports Court Green (Smooth acrylic field with white boundary)
  if (!scene.textures.exists('tile_court')) {
    const canvas = scene.textures.createCanvas('tile_court', 32, 32);
    if (canvas) {
      const ctx = canvas.context;
      ctx.fillStyle = '#065f46';
      ctx.fillRect(0, 0, 32, 32);

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 32, 1);
      ctx.fillRect(0, 0, 1, 32);
      canvas.refresh();
    }
  }

  // Wall Tile (Modern Academic Brick)
  if (!scene.textures.exists('tile_wall')) {
    const canvas = scene.textures.createCanvas('tile_wall', 32, 32);
    if (canvas) {
      const ctx = canvas.context;
      ctx.fillStyle = '#1e293b'; // Slate foundation
      ctx.fillRect(0, 0, 32, 32);

      ctx.fillStyle = '#334155';
      ctx.fillRect(2, 2, 28, 13);
      ctx.fillRect(2, 17, 28, 13);

      ctx.fillStyle = '#475569';
      ctx.fillRect(2, 2, 28, 3);
      ctx.fillRect(2, 17, 28, 3);
      canvas.refresh();
    }
  }

  // Roof Tile (Slate navy shingles with solar reflections)
  if (!scene.textures.exists('tile_roof')) {
    const canvas = scene.textures.createCanvas('tile_roof', 32, 32);
    if (canvas) {
      const ctx = canvas.context;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 32, 32);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 4, 32, 12);
      ctx.fillRect(0, 20, 32, 12);

      ctx.fillStyle = '#38bdf8'; // Solar panel shimmer or glass reflection
      ctx.fillRect(4, 6, 24, 2);
      ctx.fillRect(4, 22, 24, 2);
      canvas.refresh();
    }
  }

  // Building Window Tile (Reflective blue with white pane highlight)
  if (!scene.textures.exists('tile_window')) {
    const canvas = scene.textures.createCanvas('tile_window', 32, 32);
    if (canvas) {
      const ctx = canvas.context;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 32, 32);

      ctx.fillStyle = '#0284c7';
      ctx.fillRect(4, 4, 24, 24);

      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(6, 6, 8, 20);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(15, 4, 2, 24);
      ctx.fillRect(4, 15, 24, 2);
      canvas.refresh();
    }
  }

  // Door Tile (Mahogany wood door with brass handle)
  if (!scene.textures.exists('tile_door')) {
    const canvas = scene.textures.createCanvas('tile_door', 32, 32);
    if (canvas) {
      const ctx = canvas.context;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 32, 32);

      ctx.fillStyle = '#78350f'; // Wood
      ctx.fillRect(4, 0, 24, 32);

      ctx.fillStyle = '#92400e';
      ctx.fillRect(6, 4, 20, 10);
      ctx.fillRect(6, 18, 20, 10);

      ctx.fillStyle = '#f59e0b'; // Brass doorknob
      ctx.fillRect(22, 15, 3, 3);
      canvas.refresh();
    }
  }
}

function createObjectTextures(scene: Phaser.Scene) {
  // 1. Lush Academy Canopy Tree (64x64)
  if (!scene.textures.exists('obj_tree')) {
    const canvas = scene.textures.createCanvas('obj_tree', 64, 64);
    if (canvas) {
      const ctx = canvas.context;

      // Tree trunk
      ctx.fillStyle = '#451a03';
      ctx.fillRect(28, 44, 8, 16);

      // Base shadow under tree
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(32, 58, 24, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Canopy foliage layers
      ctx.fillStyle = '#14532d'; // Deep green shadow
      ctx.beginPath();
      ctx.arc(32, 28, 26, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#15803d'; // Mid green
      ctx.beginPath();
      ctx.arc(30, 25, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#22c55e'; // Highlight green canopy
      ctx.beginPath();
      ctx.arc(26, 21, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#86efac'; // Sunlit leaf glints
      ctx.fillRect(22, 14, 4, 3);
      ctx.fillRect(36, 18, 4, 3);
      ctx.fillRect(28, 26, 4, 3);
      canvas.refresh();
    }
  }

  // 2. Majestic Royal Palm Tree (64x96)
  if (!scene.textures.exists('obj_palm_tree')) {
    const canvas = scene.textures.createCanvas('obj_palm_tree', 64, 96);
    if (canvas) {
      const ctx = canvas.context;

      // Base shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(32, 90, 16, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Slender segmented trunk
      ctx.fillStyle = '#78716c';
      ctx.fillRect(30, 35, 5, 56);
      ctx.fillStyle = '#a8a29e';
      for (let y = 38; y < 90; y += 6) {
        ctx.fillRect(29, y, 7, 2);
      }

      // Palm Crown fronds
      ctx.fillStyle = '#15803d';
      // Left sweep
      ctx.beginPath();
      ctx.ellipse(18, 30, 22, 10, -0.4, 0, Math.PI * 2);
      ctx.fill();
      // Right sweep
      ctx.beginPath();
      ctx.ellipse(46, 30, 22, 10, 0.4, 0, Math.PI * 2);
      ctx.fill();
      // Top crest
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(32, 20, 14, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      // Coconuts cluster
      ctx.fillStyle = '#713f12';
      ctx.beginPath();
      ctx.arc(30, 36, 4, 0, Math.PI * 2);
      ctx.arc(35, 36, 4, 0, Math.PI * 2);
      ctx.arc(33, 39, 3.5, 0, Math.PI * 2);
      ctx.fill();

      canvas.refresh();
    }
  }

  // 3. Blooming Bougainvillea Bush (32x32)
  if (!scene.textures.exists('obj_flower_bush')) {
    const canvas = scene.textures.createCanvas('obj_flower_bush', 32, 32);
    if (canvas) {
      const ctx = canvas.context;
      // Deep foliage
      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.arc(16, 16, 14, 0, Math.PI * 2);
      ctx.fill();

      // Bright magenta flowers cluster
      ctx.fillStyle = '#db2777';
      ctx.fillRect(8, 8, 5, 5);
      ctx.fillRect(19, 10, 6, 5);
      ctx.fillRect(12, 18, 6, 6);
      ctx.fillRect(20, 20, 4, 4);

      ctx.fillStyle = '#f472b6'; // Blossom highlights
      ctx.fillRect(9, 9, 2, 2);
      ctx.fillRect(20, 11, 2, 2);
      ctx.fillRect(13, 19, 2, 2);
      canvas.refresh();
    }
  }

  // 4. Wooden Campus Bench (32x32)
  if (!scene.textures.exists('obj_bench')) {
    const canvas = scene.textures.createCanvas('obj_bench', 32, 32);
    if (canvas) {
      const ctx = canvas.context;
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(4, 24, 24, 4);

      // Legs
      ctx.fillStyle = '#334155';
      ctx.fillRect(5, 16, 3, 10);
      ctx.fillRect(24, 16, 3, 10);

      // Wooden slats
      ctx.fillStyle = '#b45309';
      ctx.fillRect(2, 14, 28, 4);
      ctx.fillRect(2, 19, 28, 4);

      ctx.fillStyle = '#d97706';
      ctx.fillRect(2, 14, 28, 1);
      ctx.fillRect(2, 19, 28, 1);
      canvas.refresh();
    }
  }

  // 5. Campus Fountain / Water Monument (64x64)
  if (!scene.textures.exists('obj_fountain')) {
    const canvas = scene.textures.createCanvas('obj_fountain', 64, 64);
    if (canvas) {
      const ctx = canvas.context;
      // Outer stone basin
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.ellipse(32, 32, 30, 24, 0, 0, Math.PI * 2);
      ctx.fill();

      // Inner basin
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.ellipse(32, 32, 26, 20, 0, 0, Math.PI * 2);
      ctx.fill();

      // Shimmering Water
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.ellipse(32, 32, 24, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.ellipse(30, 30, 16, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Center jet & droplets
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(31, 20, 2, 12);
      ctx.fillRect(28, 22, 2, 2);
      ctx.fillRect(34, 23, 2, 2);
      ctx.fillRect(30, 18, 4, 3);
      canvas.refresh();
    }
  }

  // 6. Campus Street Lamp (16x32)
  if (!scene.textures.exists('obj_lamp')) {
    const canvas = scene.textures.createCanvas('obj_lamp', 16, 32);
    if (canvas) {
      const ctx = canvas.context;
      // Post
      ctx.fillStyle = '#334155';
      ctx.fillRect(7, 8, 2, 22);
      ctx.fillRect(5, 29, 6, 3); // base

      // Lantern head
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(4, 4, 8, 6);

      // Glowing light
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(5, 5, 6, 4);
      canvas.refresh();
    }
  }

  // 7. Noticeboard / Bulletin (32x32)
  if (!scene.textures.exists('obj_noticeboard')) {
    const canvas = scene.textures.createCanvas('obj_noticeboard', 32, 32);
    if (canvas) {
      const ctx = canvas.context;
      // Posts
      ctx.fillStyle = '#451a03';
      ctx.fillRect(6, 12, 3, 18);
      ctx.fillRect(23, 12, 3, 18);

      // Cork board
      ctx.fillStyle = '#92400e';
      ctx.fillRect(4, 4, 24, 16);

      ctx.fillStyle = '#d97706';
      ctx.fillRect(6, 6, 20, 12);

      // Papers pinned
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(8, 8, 5, 7);
      ctx.fillRect(16, 8, 7, 5);
      canvas.refresh();
    }
  }

  // 8. Security Gate Barrier (64x32)
  if (!scene.textures.exists('obj_gate')) {
    const canvas = scene.textures.createCanvas('obj_gate', 64, 32);
    if (canvas) {
      const ctx = canvas.context;
      // Stone pillars on sides
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 0, 10, 32);
      ctx.fillRect(54, 0, 10, 32);

      // Iron gate bars
      ctx.fillStyle = '#0f172a';
      for (let x = 12; x <= 50; x += 4) {
        ctx.fillRect(x, 4, 2, 24);
      }
      ctx.fillRect(10, 8, 44, 2);
      ctx.fillRect(10, 22, 44, 2);

      // Golden school crest in center
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(32, 15, 5, 0, Math.PI * 2);
      ctx.fill();
      canvas.refresh();
    }
  }

  // 9. Football / Soccer Goalpost (48x32)
  if (!scene.textures.exists('obj_goalpost')) {
    const canvas = scene.textures.createCanvas('obj_goalpost', 48, 32);
    if (canvas) {
      const ctx = canvas.context;
      // Net backing shadow
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(4, 6, 40, 24);

      // White posts
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(4, 6, 3, 26); // left post
      ctx.fillRect(41, 6, 3, 26); // right post
      ctx.fillRect(4, 4, 40, 3); // crossbar
      canvas.refresh();
    }
  }

  // 10. Basketball Hoop & Backboard (32x48)
  if (!scene.textures.exists('obj_basketball_hoop')) {
    const canvas = scene.textures.createCanvas('obj_basketball_hoop', 32, 48);
    if (canvas) {
      const ctx = canvas.context;
      // Post
      ctx.fillStyle = '#475569';
      ctx.fillRect(15, 18, 3, 28);
      ctx.fillRect(12, 44, 9, 3);

      // Backboard (white acrylic with red inner square)
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(6, 6, 20, 14);
      ctx.fillStyle = '#ef4444';
      ctx.strokeRect(10, 9, 12, 8);

      // Orange Rim & net
      ctx.fillStyle = '#f97316';
      ctx.fillRect(11, 19, 10, 2);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(13, 21, 6, 6);
      canvas.refresh();
    }
  }

  // 11. Outdoor Study Table with Parasol (48x48)
  if (!scene.textures.exists('obj_study_table')) {
    const canvas = scene.textures.createCanvas('obj_study_table', 48, 48);
    if (canvas) {
      const ctx = canvas.context;
      // Ground shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(6, 22, 36, 20);

      // Benches & Table wood
      ctx.fillStyle = '#78350f';
      ctx.fillRect(8, 24, 32, 6); // top bench
      ctx.fillRect(8, 36, 32, 6); // bottom bench
      ctx.fillRect(12, 28, 24, 10); // table surface

      // Parasol pole
      ctx.fillStyle = '#334155';
      ctx.fillRect(23, 10, 2, 24);

      // Parasol canopy umbrella (Sky blue & amber stripes)
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(24, 14, 16, Math.PI, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(24, 0);
      ctx.lineTo(28, 14);
      ctx.lineTo(20, 14);
      ctx.closePath();
      ctx.fill();
      canvas.refresh();
    }
  }

  // 12. Tall Flagpole (16x64)
  if (!scene.textures.exists('obj_flagpole')) {
    const canvas = scene.textures.createCanvas('obj_flagpole', 16, 64);
    if (canvas) {
      const ctx = canvas.context;
      // Base
      ctx.fillStyle = '#334155';
      ctx.fillRect(4, 58, 8, 6);

      // Silver pole
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(7, 4, 2, 54);

      // Golden sphere top
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(8, 4, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Waving flag (Green-Gold-Red school banner)
      ctx.fillStyle = '#15803d';
      ctx.fillRect(9, 6, 7, 4);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(9, 10, 7, 4);
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(9, 14, 7, 4);
      canvas.refresh();
    }
  }

  // 13. Fingerpost Directional Sign (32x32)
  if (!scene.textures.exists('obj_signpost')) {
    const canvas = scene.textures.createCanvas('obj_signpost', 32, 32);
    if (canvas) {
      const ctx = canvas.context;
      // Wood post
      ctx.fillStyle = '#451a03';
      ctx.fillRect(14, 10, 3, 20);

      // Top sign pointing left
      ctx.fillStyle = '#b45309';
      ctx.fillRect(4, 8, 16, 5);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(6, 10, 10, 1);

      // Lower sign pointing right
      ctx.fillStyle = '#92400e';
      ctx.fillRect(12, 16, 16, 5);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(14, 18, 10, 1);
      canvas.refresh();
    }
  }
}

function createStudentSpriteTextures(scene: Phaser.Scene) {
  // Preset uniform variations for remote peers and quick fallbacks:
  const variations = [
    { key: 'student_0', uniform: '#1e3a8a', hair: '#171717', hairStyle: 'fade', skin: '#8d5524', pants: '#1e293b' }, // Navy uniform (Sarah style)
    { key: 'student_1', uniform: '#065f46', hair: '#262626', hairStyle: 'puff', skin: '#5c3818', pants: '#334155' }, // Emerald blazer (Emmanuel)
    { key: 'student_2', uniform: '#831843', hair: '#1c1917', hairStyle: 'locs', skin: '#c68642', pants: '#0f172a' }, // Maroon blazer (Grace)
    { key: 'student_3', uniform: '#b45309', hair: '#292524', hairStyle: 'parted', skin: '#a36c42', pants: '#1e293b' }, // Gold/Amber blazer (Michael)
  ];

  for (const v of variations) {
    if (!scene.textures.exists(v.key)) {
      const canvas = scene.textures.createCanvas(v.key, 96, 192);
      if (canvas) {
        const ctx = canvas.context;
        for (let row = 0; row < 4; row++) {
          for (let col = 0; col < 3; col++) {
            const ox = col * 32;
            const oy = row * 48;
            drawStudentFrame(ctx, ox, oy, row, col, v);
          }
        }
        canvas.refresh();

        scene.textures.addSpriteSheet(v.key + '_sheet', canvas.getSourceImage() as HTMLImageElement, {
          frameWidth: 32,
          frameHeight: 48,
        });
      }
    }
  }
}

/**
 * Generate a personalized dynamic spritesheet for a student based on their custom avatar choices
 */
export function generateCustomStudentTexture(
  scene: Phaser.Scene,
  studentId: string,
  custom: {
    skin_tone?: number;
    hair_style?: string;
    hair_color?: string;
    uniform_style?: string;
    accessory?: string;
  }
) {
  const textureKey = `student_custom_${studentId}`;
  const sheetKey = `${textureKey}_sheet`;

  // Remove existing texture if student refreshed their wardrobe
  if (scene.textures.exists(textureKey)) {
    scene.textures.remove(textureKey);
  }
  if (scene.textures.exists(sheetKey)) {
    scene.textures.remove(sheetKey);
  }

  const skinTones = ['#3e2723', '#5c3818', '#8d5524', '#c68642'];
  const skin = skinTones[custom?.skin_tone ?? 1] || '#8d5524';
  const hairStyle = custom?.hair_style || 'fade';
  const hair = custom?.hair_color || '#171717';

  let uniform = '#065f46'; // default BGS Buea green
  if (custom?.uniform_style === 'navy') uniform = '#1e3a8a';
  else if (custom?.uniform_style === 'crimson') uniform = '#831843';
  else if (custom?.uniform_style === 'amber') uniform = '#b45309';

  const config = {
    uniform,
    hair,
    hairStyle,
    skin,
    pants: '#1e293b',
    accessory: custom?.accessory || 'none',
  };

  const canvas = scene.textures.createCanvas(textureKey, 96, 192);
  if (canvas) {
    const ctx = canvas.context;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 3; col++) {
        const ox = col * 32;
        const oy = row * 48;
        drawStudentFrame(ctx, ox, oy, row, col, config);
      }
    }
    canvas.refresh();

    scene.textures.addSpriteSheet(sheetKey, canvas.getSourceImage() as HTMLImageElement, {
      frameWidth: 32,
      frameHeight: 48,
    });
  }

  return sheetKey;
}

function drawStudentFrame(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  dirRow: number, // 0: down, 1: left, 2: right, 3: up
  frameIndex: number, // 0: idle/step1, 1: walk2, 2: walk3
  colors: {
    uniform: string;
    hair: string;
    hairStyle?: string;
    skin: string;
    pants: string;
    accessory?: string;
  }
) {
  // Feet / shadow offset based on walking cycle
  const legOffset = frameIndex === 1 ? -2 : frameIndex === 2 ? 2 : 0;

  // Ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(ox + 16, oy + 44, 9, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head (center at ox + 16, oy + 12)
  ctx.fillStyle = colors.skin;
  ctx.beginPath();
  ctx.arc(ox + 16, oy + 12, 7, 0, Math.PI * 2);
  ctx.fill();

  // Hair Styling
  ctx.fillStyle = colors.hair;
  const style = colors.hairStyle || 'fade';

  if (dirRow === 3) {
    // Up: Hair covers back of head
    if (style === 'puff') {
      ctx.beginPath();
      ctx.arc(ox + 16, oy + 10, 9, 0, Math.PI * 2);
      ctx.fill();
    } else if (style === 'locs') {
      ctx.beginPath();
      ctx.arc(ox + 16, oy + 11, 8, 0, Math.PI * 2);
      ctx.fill();
      // Locs falling down neck
      ctx.fillRect(ox + 11, oy + 14, 3, 6);
      ctx.fillRect(ox + 18, oy + 14, 3, 6);
    } else {
      // Fade / clean cut
      ctx.beginPath();
      ctx.arc(ox + 16, oy + 11, 7.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Down, Left, Right
    if (style === 'puff') {
      ctx.beginPath();
      ctx.arc(ox + 16, oy + 8, 8.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (style === 'locs') {
      ctx.beginPath();
      ctx.arc(ox + 16, oy + 9, 8, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(ox + 9, oy + 8, 3, 8);
      ctx.fillRect(ox + 20, oy + 8, 3, 8);
    } else {
      // Fade / parted
      ctx.beginPath();
      ctx.arc(ox + 16, oy + 9, 7.5, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(ox + 9, oy + 8, 4, 5);
      ctx.fillRect(ox + 19, oy + 8, 4, 5);
    }

    // Face features (Eyes)
    if (dirRow === 0) {
      // Facing Down
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(ox + 13, oy + 12, 2, 2);
      ctx.fillRect(ox + 17, oy + 12, 2, 2);

      // Glasses accessory
      if (colors.accessory === 'glasses') {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1;
        ctx.strokeRect(ox + 11.5, oy + 11, 4, 3.5);
        ctx.strokeRect(ox + 16.5, oy + 11, 4, 3.5);
        ctx.beginPath();
        ctx.moveTo(ox + 15.5, oy + 12.5);
        ctx.lineTo(ox + 16.5, oy + 12.5);
        ctx.stroke();
      }
    } else if (dirRow === 1) {
      // Facing Left
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(ox + 12, oy + 12, 2, 2);
      if (colors.accessory === 'glasses') {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1;
        ctx.strokeRect(ox + 11, oy + 11, 3.5, 3.5);
      }
    } else if (dirRow === 2) {
      // Facing Right
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(ox + 18, oy + 12, 2, 2);
      if (colors.accessory === 'glasses') {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1;
        ctx.strokeRect(ox + 17.5, oy + 11, 3.5, 3.5);
      }
    }
  }

  // Torso / School Uniform Jacket
  ctx.fillStyle = colors.uniform;
  ctx.fillRect(ox + 10, oy + 19, 12, 14);

  // White shirt collar in center front
  if (dirRow === 0) {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(ox + 14, oy + 19, 4, 4);
    // School necktie
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(ox + 15, oy + 21, 2, 6);
  }

  // Arms / Sleeves
  ctx.fillStyle = colors.uniform;
  if (dirRow === 1) {
    // Left profile arm
    ctx.fillRect(ox + 13 - legOffset, oy + 21, 5, 9);
    ctx.fillStyle = colors.skin;
    ctx.fillRect(ox + 13 - legOffset, oy + 30, 4, 3);
  } else if (dirRow === 2) {
    // Right profile arm
    ctx.fillRect(ox + 14 + legOffset, oy + 21, 5, 9);
    ctx.fillStyle = colors.skin;
    ctx.fillRect(ox + 15 + legOffset, oy + 30, 4, 3);
  } else {
    // Front or Back
    ctx.fillRect(ox + 7, oy + 20 + legOffset, 3, 9);
    ctx.fillRect(ox + 22, oy + 20 - legOffset, 3, 9);
    ctx.fillStyle = colors.skin;
    ctx.fillRect(ox + 7, oy + 29 + legOffset, 3, 3);
    ctx.fillRect(ox + 22, oy + 29 - legOffset, 3, 3);

    // Watch accessory
    if (colors.accessory === 'watch') {
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(ox + 6.5, oy + 28 + legOffset, 3.5, 2);
    }
  }

  // Pants / Skirt
  ctx.fillStyle = colors.pants;
  ctx.fillRect(ox + 11, oy + 33, 10, 6);

  // Legs / Shoes
  ctx.fillStyle = colors.pants;
  ctx.fillRect(ox + 11, oy + 38, 4, 4 + legOffset);
  ctx.fillRect(ox + 17, oy + 38, 4, 4 - legOffset);

  // Dark Leather School Shoes
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(ox + 10, oy + 42 + legOffset, 5, 3);
  ctx.fillRect(ox + 17, oy + 42 - legOffset, 5, 3);
}
