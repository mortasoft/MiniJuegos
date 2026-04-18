import * as Phaser from 'phaser';
import moveSound from '../assets/sounds/move.mp3';
import musicSound from '../assets/sounds/music.mp3';
import goodSound from '../assets/sounds/good.mp3';
import wrongSound from '../assets/sounds/wrong.mp3';
import gameOverSound from '../assets/sounds/gameover.mp3';

const DATA_TYPES = [
    // --- ACCESO IRRESTRICTO (Público) ---
    { text: "Nombre\nCompleto", classification: "publico" },
    { text: "Estado\nCivil", classification: "publico" },
    { text: "Fecha\nNacimiento", classification: "publico" },
    { text: "Filiación\n(Padres)", classification: "publico" },
    { text: "Bienes\nInmuebles", classification: "publico" },
    { text: "Gravámenes\nVehiculares", classification: "publico" },
    { text: "Representación\nLegal", classification: "publico" },
    { text: "Títulos\nAcadémicos", classification: "publico" },
    { text: "Defunciones\nRegistradas", classification: "publico" },
    { text: "Concesiones\nPúblicas", classification: "publico" },

    // --- ACCESO RESTRINGIDO / PERSONALES (Confidencial) ---
    { text: "Dirección\nHabitación", classification: "confidencial", color: 0x00E676 },
    { text: "Teléfono\nPersonal", classification: "confidencial", color: 0x00E676 },
    { text: "Correo\nElectrónico", classification: "confidencial", color: 0x00E676 },
    { text: "Salario\nBruto", classification: "confidencial", color: 0x00E676 },
    { text: "Historial\nCrediticio", classification: "confidencial", color: 0x00E676 },
    { text: "Récord de\nCotizaciones", classification: "confidencial", color: 0x00E676 },
    { text: "Número de\nPasaporte", classification: "confidencial", color: 0x00E676 },
    { text: "Firma\nHológrafa", classification: "confidencial", color: 0x00E676 },
    { text: "Placa de\nVehículo", classification: "confidencial", color: 0x00E676 },
    { text: "Hábitos de\nConsumo", classification: "confidencial", color: 0x00E676 },

    // --- DATOS SENSIBLES (Restringido) ---
    { text: "Expediente\nMédico", classification: "restringido", color: 0xFF1744 },
    { text: "Preferencia\nSexual", classification: "restringido", color: 0xFF1744 },
    { text: "Opinión\nPolítica", classification: "restringido", color: 0xFF1744 },
    { text: "Creencia\nReligiosa", classification: "restringido", color: 0xFF1744 },
    { text: "Origen\nRacial", classification: "restringido", color: 0xFF1744 },
    { text: "Huella\nDactilar", classification: "restringido", color: 0xFF1744 },
    { text: "Información\nGenética", classification: "restringido", color: 0xFF1744 },
    { text: "Afiliación\nSindical", classification: "restringido", color: 0xFF1744 },
    { text: "Vida\nSexual", classification: "restringido", color: 0xFF1744 },
    { text: "Convicciones\nFilosóficas", classification: "restringido", color: 0xFF1744 }
];

const COLUMNS = [0, 1, 2];
const COLUMN_WIDTH = 300; // Total Board Width
const GRID_OFFSET = (800 - COLUMN_WIDTH) / 2; // Center the 300px board in the 800px canvas

const TETROMINOS = [
    { name: 'I', color: 0x00FFFF, blocks: [[-1.5, -0.5], [-0.5, -0.5], [0.5, -0.5], [1.5, -0.5]] },
    { name: 'J', color: 0x0000FF, blocks: [[-1.5, -0.5], [-1.5, 0.5], [-0.5, 0.5], [0.5, 0.5]] },
    { name: 'L', color: 0xFFA500, blocks: [[0.5, -0.5], [-1.5, 0.5], [-0.5, 0.5], [0.5, 0.5]] },
    { name: 'O', color: 0xFFFF00, blocks: [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]] },
    { name: 'S', color: 0x00FF00, blocks: [[-0.5, -0.5], [0.5, -0.5], [-1.5, 0.5], [-0.5, 0.5]] },
    { name: 'T', color: 0x800080, blocks: [[-0.5, -0.5], [-1.5, 0.5], [-0.5, 0.5], [0.5, 0.5]] },
    { name: 'Z', color: 0xFF0000, blocks: [[-1.5, -0.5], [-0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]] }
];

const T_SIZE = 30; // Standard size for 20 rows to fit in 600px height

export default class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
        this.score = 0;
        this.combo = 0;
        this.currentBlock = null;
        this.currentColumn = 1;
        this.isLocked = false;

        this.fallSpeed = 1;
        this.baseFallSpeed = 1;
        this.fastFallSpeed = 15;
        this.isGameOver = false;
        this.bgMusic = null;
    }

    init(data) {
        // Fallback to registry if data is missing (Phaser auto-start scenario)
        const difficulty = data.difficulty || this.game.registry.get('difficulty') || 'medium';

        // Set base speed based on difficulty
        const speeds = {
            easy: 0.5,
            medium: 0.8,
            hard: 1.5
        };
        this.baseFallSpeed = speeds[difficulty] || 1.5;
        this.fallSpeed = this.baseFallSpeed;

        // Reset game state
        this.integrity = 100;
        this.score = 0;
        this.combo = 0;
        this.isGameOver = false;
        this.columnPixels = [0, 0, 0];
        this.allLandedSquares = [];
        this.currentBlock = null;
        this.activeFeedback = null;
        this.totalLinesCleared = 0;

        // DAS Movement system
        this.dasTimer = 0;
        this.lastDasDirection = 0;
        this.DAS_DELAY = 180;
        this.DAS_REPEAT = 40;

        this.colors = {
            publico: 0x00FF00,       // Verde
            confidencial: 0xFFA500,  // Anaranjado
            restringido: 0x00E5FF    // Celeste
        };

        this.labels = {
            publico: 'Irrestricto (Público)',
            confidencial: 'Restringido',
            restringido: 'Datos Sensibles'
        };
    }

    preload() {
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.lineStyle(2, 0x1A1A3A, 0.4);
        graphics.strokeRect(0, 0, 30, 30);
        graphics.generateTexture('grid', 30, 30);

        const pGraphic = this.make.graphics({ x: 0, y: 0, add: false });
        pGraphic.fillStyle(0xffffff, 1);
        pGraphic.fillCircle(4, 4, 4);
        pGraphic.generateTexture('particle', 8, 8);

        // Frame block texture (Gray beveled metallic)
        const frameG = this.make.graphics({ x: 0, y: 0, add: false });
        frameG.fillStyle(0x888888, 1);
        frameG.fillRect(0, 0, 30, 30);
        frameG.lineStyle(2, 0xaaaaaa, 1);
        frameG.strokeRect(2, 2, 26, 26);
        frameG.lineStyle(2, 0x444444, 1);
        frameG.strokeRect(0, 0, 30, 30);
        frameG.generateTexture('frameBlock', 30, 30);

        // Load sound effects
        this.load.audio('move', moveSound);
        this.load.audio('bgMusic', musicSound);
        this.load.audio('good', goodSound);
        this.load.audio('wrong', wrongSound);
        this.load.audio('gameover', gameOverSound);
    }

    create() {
        this.cursors = this.input.keyboard.createCursorKeys();

        // Add SPACE key listening
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.bgGrid = this.add.tileSprite(400, 300, 800, 600, 'grid');
        this.bgGrid.setTint(0x4A6984);

        this.createFloatingData();

        this.particles = this.add.particles(0, 0, 'particle', {
            lifespan: 600, speed: { min: 200, max: 400 },
            scale: { start: 1, end: 0 }, blendMode: 'ADD', emitting: false
        });

        this.createFrame();
        this.addPlatform();
        this.trailGroup = this.add.group();
        this.lastTrailSpawn = 0;
        this.spawnBlock();

        // Start background music
        this.bgMusic = this.sound.add('bgMusic', { loop: true, volume: 0.4 });
        this.bgMusic.play();

        // Start background music
        this.bgMusic = this.sound.add('bgMusic', { loop: true, volume: 0.4 });
        this.bgMusic.play();

        this.input.keyboard.on('keydown-UP', () => {
            if (this.currentBlock) {
                this.rotateTetromino();
            }
        });

        this.trailEmitter = this.add.particles(0, 0, 'particle', {
            speed: 50, scale: { start: 0.5, end: 0 },
            alpha: { start: 0.5, end: 0 }, blendMode: 'ADD',
            lifespan: 300, frequency: -1
        });
    }

    createFloatingData() {
        for (let i = 0; i < 20; i++) {
            const txt = this.add.text(
                Phaser.Math.Between(0, 800), Phaser.Math.Between(0, 600),
                Math.random() > 0.5 ? '1' : '0',
                { fill: '#1d2345', fontSize: '24px' }
            );
            txt.speedY = Phaser.Math.Between(1, 3);
            this.events.on('update', () => {
                txt.y += txt.speedY;
                if (txt.y > 600) {
                    txt.y = -20;
                    txt.x = Phaser.Math.Between(0, 800);
                }
            });
        }
    }

    createFrame() {
        const leftX = GRID_OFFSET - 15;
        const rightX = GRID_OFFSET + COLUMN_WIDTH + 15;
        const topY = 15;
        const bottomY = 585;

        // Vertical columns
        for (let y = 15; y <= 585; y += 30) {
            this.add.image(leftX, y, 'frameBlock').setTint(0x888888);
            this.add.image(rightX, y, 'frameBlock').setTint(0x888888);
        }

        // Horizontal rows
        for (let x = leftX; x <= rightX; x += 30) {
            this.add.image(x, topY, 'frameBlock').setTint(0xaaaaaa);
            this.add.image(x, 585, 'frameBlock').setTint(0x666666);
        }
    }

    addPlatform() {
        // Platform visual removed as per user request (frame is enough)
        // Collision floor remains at 580 in update()
    }

    spawnBlock() {
        if (this.isGameOver) return;

        this.currentColumn = 1;
        this.isLocked = true; // Always locked movement in single platform
        const speedMultiplier = this.baseFallSpeed < 0.2 ? 0.02 : 0.1;
        this.fallSpeed = this.baseFallSpeed + (this.combo * speedMultiplier);
        this.events.emit('speed-changed', this.fallSpeed);

        const data = Phaser.Utils.Array.GetRandom(DATA_TYPES);
        const x = 400; // Start at center
        const y = 45; // NEW: Aligned with grid (1.5 * 30)

        this.currentBlock = this.add.container(x, y);
        this.currentBlock.classification = data.classification;
        this.currentBlock.selectedClassification = null; // Default: No classification

        const squaresContainer = this.add.container(0, 0);
        const shapeDef = Phaser.Utils.Array.GetRandom(TETROMINOS);

        shapeDef.blocks.forEach(coord => {
            const sqX = coord[0] * T_SIZE;
            const sqY = coord[1] * T_SIZE;

            // Main square body - ALWAYS WHITE AT SPAWN
            const sq = this.add.rectangle(sqX, sqY, T_SIZE - 2, T_SIZE - 2, 0xFFFFFF, 0.7);
            sq.isMain = true; // Mark as primary logical block

            // Outer technical border (sharp 1px)
            sq.setStrokeStyle(1, 0xFFFFFF, 1);

            // Inner technical bevel/detailing
            const bevel = this.add.rectangle(sqX, sqY, T_SIZE - 8, T_SIZE - 8, 0xFFFFFF, 0.1)
                .setStrokeStyle(1, 0xFFFFFF, 0.2);

            squaresContainer.add([sq, bevel]);
        });

        const textBg = this.add.rectangle(0, 75, 160, 44, 0x000000, 0.4)
            .setStrokeStyle(2, 0xFFFFFF, 0.6);

        const blockText = this.add.text(0, 75, data.text, {
            fontFamily: 'Inter', fontSize: '12px', fontWeight: 'bold',
            color: '#ffffff', align: 'center', wordWrap: { width: 140 },
            shadow: { offsetX: 0, offsetY: 0, color: '#ffffff', blur: 8, fill: true }
        }).setOrigin(0.5);

        this.currentBlock.add([squaresContainer, textBg, blockText]);
        this.currentBlock.squaresContainer = squaresContainer;
        this.currentBlock.textBg = textBg;
        this.currentBlock.textElements = [textBg, blockText];
        this.currentBlock.originalColor = shapeDef.color;

        this.currentBlock.setScale(0);
        this.tweens.add({
            targets: this.currentBlock, scale: 1, duration: 250, ease: 'Bounce.easeOut',
            onComplete: () => {
                if (this.currentBlock) {
                    this.currentBlock.x = Math.round(this.currentBlock.x);
                    this.currentBlock.y = Math.round(this.currentBlock.y);
                }
            }
        });
    }

    getAllLandedRects() {
        const rects = [];
        this.allLandedSquares.forEach(sq => {
            if (sq && sq.active) {
                rects.push(sq.getBounds());
            }
        });
        return rects;
    }

    // Returns WORLD-SPACE axis-aligned bounds for the current block's main squares
    // Uses the world transform matrix so rotation is correctly accounted for
    getActiveBlockWorldRects() {
        if (!this.currentBlock) return [];
        const matrix = this.currentBlock.squaresContainer.getWorldTransformMatrix();
        return this.currentBlock.squaresContainer.list
            .filter(s => s.isMain)
            .map(sq => {
                const p = matrix.transformPoint(sq.x, sq.y);
                const hw = (sq.width || T_SIZE - 2) / 2;
                const hh = (sq.height || T_SIZE - 2) / 2;
                return new Phaser.Geom.Rectangle(p.x - hw, p.y - hh, hw * 2, hh * 2);
            });
    }

    spawnBinaryTrail() {
        if (!this.currentBlock) return;

        const squares = this.currentBlock.squaresContainer.list;
        squares.forEach(sq => {
            // Calculate world position
            const worldX = this.currentBlock.x + sq.x;
            const worldY = this.currentBlock.y + sq.y;

            const bit = this.add.text(worldX, worldY - 20, Math.random() > 0.5 ? '1' : '0', {
                fontFamily: 'monospace',
                fontSize: '14px',
                color: '#4A6984',
                alpha: 0.6
            }).setOrigin(0.5);

            this.trailGroup.add(bit);

            this.tweens.add({
                targets: bit,
                y: worldY - 80,
                alpha: 0,
                duration: 800,
                onComplete: () => bit.destroy()
            });
        });
    }

    moveLateral(dir) {
        if (!this.currentBlock) return;
        const previousX = this.currentBlock.x;
        this.currentBlock.x += dir * T_SIZE;

        const colLeft = GRID_OFFSET;
        const colRight = GRID_OFFSET + COLUMN_WIDTH;

        let valid = true;
        const myRects = this.getActiveBlockWorldRects();
        const allLanded = this.getAllLandedRects();

        for (let r of myRects) {
            if (r.left < colLeft || r.right > colRight) {
                valid = false;
                break;
            }
            for (let lr of allLanded) {
                if (Phaser.Geom.Intersects.RectangleToRectangle(r, lr)) {
                    valid = false;
                    break;
                }
            }
            if (!valid) break;
        }

        if (!valid) {
            this.currentBlock.x = previousX;
        } else {
            this.currentBlock.x = Math.round(this.currentBlock.x);
            this.cameras.main.shake(20, 0.001);
            this.sound.play('move', { volume: 0.5 });
        }
    }

    isValidPosition(x, y, angle) {
        if (!this.currentBlock) return false;

        const colLeft = GRID_OFFSET;
        const colRight = GRID_OFFSET + COLUMN_WIDTH;

        // Temporarily set position and angle to check
        const oldX = this.currentBlock.x;
        const oldY = this.currentBlock.y;
        const oldAngle = this.currentBlock.squaresContainer.angle;

        this.currentBlock.x = x;
        this.currentBlock.y = y;
        this.currentBlock.squaresContainer.angle = angle;

        this.currentBlock.squaresContainer.list.forEach(sq => sq.updateDisplayOrigin());

        let valid = true;
        // Use world-space rects after temporarily applying the new transform
        const myRects = this.getActiveBlockWorldRects();
        const allLanded = this.getAllLandedRects();


        for (let r of myRects) {
            // Walls
            if (r.left < colLeft || r.right > colRight) {
                valid = false;
                break;
            }
            // Floor (570 is the top edge of the floor frame)
            if (r.bottom > 570) {
                valid = false;
                break;
            }
            // Other blocks
            for (let lr of allLanded) {
                if (Phaser.Geom.Intersects.RectangleToRectangle(r, lr)) {
                    valid = false;
                    break;
                }
            }
            if (!valid) break;
        }

        // Restore
        this.currentBlock.x = oldX;
        this.currentBlock.y = oldY;
        this.currentBlock.squaresContainer.angle = oldAngle;

        return valid;
    }

    rotateTetromino() {
        if (!this.currentBlock) return;

        const previousAngle = this.currentBlock.squaresContainer.angle;
        const newAngle = previousAngle + 90;

        // Wall Kick offsets to try (in order: none, left 1, right 1, left 2, right 2)
        const kicks = [0, -T_SIZE, T_SIZE, -T_SIZE * 2, T_SIZE * 2];
        let success = false;

        for (let kickX of kicks) {
            if (this.isValidPosition(this.currentBlock.x + kickX, this.currentBlock.y, newAngle)) {
                this.currentBlock.x += kickX;
                this.currentBlock.squaresContainer.angle = newAngle;
                success = true;
                break;
            }
        }

        if (success) {
            this.currentBlock.x = Math.round(this.currentBlock.x);
            // Snap Y to grid after potential rotation adjustments
            this.currentBlock.y = Math.floor(this.currentBlock.y / T_SIZE) * T_SIZE + 15;
            this.cameras.main.shake(30, 0.001);
            this.sound.play('move', { volume: 0.5 });
        }
    }

    update(time, delta) {
        if (this.isGameOver || !this.currentBlock) {
            this.trailEmitter.stop();
            return;
        }

        // DAS (Delayed Auto Shift) Movement
        let currentDir = 0;
        if (this.cursors.left.isDown) currentDir = -1;
        else if (this.cursors.right.isDown) currentDir = 1;

        if (currentDir !== 0) {
            if (this.lastDasDirection !== currentDir) {
                // New direction: Move immediately
                this.moveLateral(currentDir);
                this.dasTimer = 0;
                this.lastDasDirection = currentDir;
            } else {
                // Same direction: Increment timer
                this.dasTimer += delta;
                if (this.dasTimer >= this.DAS_DELAY) {
                    this.moveLateral(currentDir);
                    // Reset to repeat point (after delay)
                    this.dasTimer = this.DAS_DELAY - this.DAS_REPEAT;
                }
            }
        } else {
            // No keys down
            this.lastDasDirection = 0;
            this.dasTimer = 0;
        }

        // Binary Trail Spawning
        if (time > this.lastTrailSpawn + 100) {
            this.spawnBinaryTrail();
            this.lastTrailSpawn = time;
        }

        this.bgGrid.tilePositionY -= 2;

        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            const types = ['publico', 'confidencial', 'restringido'];
            let idx = -1;

            if (this.currentBlock.selectedClassification) {
                idx = types.indexOf(this.currentBlock.selectedClassification);
            }

            idx = (idx + 1) % types.length;
            const newTypeKey = types[idx];
            this.currentBlock.selectedClassification = newTypeKey;

            const color = this.colors[newTypeKey];
            const labelText = this.labels[newTypeKey];

            // Highlight squares and background
            this.currentBlock.squaresContainer.list.forEach(child => {
                if (child.type === 'Rectangle' && child.isMain) {
                    // Update stroke
                    child.setStrokeStyle(2, color, 1);
                    // Update fill to classification color (more solid than before)
                    child.setFillStyle(color, 0.6);
                }
            });
            this.currentBlock.textBg.setStrokeStyle(2, color, 0.8);
            this.currentBlock.textBg.setFillStyle(color, 0.2);

            // Floating feedback (Remove previous if exists)
            if (this.activeFeedback) {
                this.activeFeedback.destroy();
            }

            const feedback = this.add.text(this.currentBlock.x, this.currentBlock.y - 40, labelText, {
                fontFamily: 'Outfit',
                fontSize: '28px',
                fontWeight: '900',
                color: '#' + color.toString(16).padStart(6, '0'),
                stroke: '#000000',
                strokeThickness: 6
            }).setOrigin(0.5);

            this.activeFeedback = feedback;

            this.tweens.add({
                targets: feedback,
                y: feedback.y - 80,
                alpha: 0,
                scale: 1.3,
                duration: 500,
                onComplete: () => {
                    if (this.activeFeedback === feedback) {
                        this.activeFeedback = null;
                    }
                    feedback.destroy();
                }
            });

            this.sound.play('move', { volume: 0.3 });
        }

        const isHardDrop = this.cursors.down.isDown;
        const speed = isHardDrop ? this.fastFallSpeed : this.fallSpeed;

        if (isHardDrop) {
            this.trailEmitter.start();
            this.trailEmitter.setPosition(this.currentBlock.x, this.currentBlock.y - 40);
        } else {
            this.trailEmitter.stop();
        }

        // Apply gravity
        this.currentBlock.y += speed;

        // Check realistic block-by-block collision
        let landed = false;
        let finalSnapY = 0;

        // Use world-space rects (accounts for container hierarchy and rotation)
        const myRects = this.getActiveBlockWorldRects();
        const allLanded = this.getAllLandedRects();


        for (let r of myRects) {
            // Check floor (570 is the top edge of the 585 frame block)
            if (r.bottom >= 570) {
                landed = true;
                finalSnapY = Math.max(finalSnapY, r.bottom - 570);
            } else {
                // Check blocks
                for (let lr of allLanded) {
                    // Check if aligned horizontally
                    if (r.right > lr.left + 1 && r.left < lr.right - 1) {
                        // Check if about to hit or hitting (1px tolerance)
                        if (r.bottom >= lr.top - 1 && r.top < lr.top) {
                            landed = true;
                            finalSnapY = Math.max(finalSnapY, r.bottom - lr.top);
                        }
                    }
                }
            }
        }

        if (landed) {
            // Only apply the exact snap correction - no extra rounding
            this.currentBlock.y -= finalSnapY;
            this.handleCollision();
        }
    }

    handleCollision() {
        const block = this.currentBlock;
        this.currentBlock = null;
        this.trailEmitter.stop();

        const isCorrect = block.classification === block.selectedClassification;

        if (isCorrect) {
            this.handleSuccess(block);
        } else {
            this.handleError(block);
        }

        // Check if any part of the landed block is too high (above y=100)
        let hitTop = false;
        block.squaresContainer.list.forEach(sq => {
            if (sq.getBounds().top < 100) hitTop = true;
        });

        if (hitTop) {
            this.integrity = Math.max(0, this.integrity - 20);
            this.events.emit('integrity-changed', this.integrity);
            this.clearBoard();

            if (this.integrity <= 0) {
                this.gameOver();
            }
        }
    }

    gameOver() {
        this.isGameOver = true;
        if (this.bgMusic) {
            this.bgMusic.stop();
        }
        
        // Notify React to change screens
        this.events.on('destroy', () => {}); // Placeholder
        this.events.emit('game-over', this.score);
        
        this.showFloatingText(400, 300, "¡SISTEMA COMPROMETIDO!", "#FF0000");
    }

    clearBoard() {
        this.cameras.main.shake(300, 0.01);
        this.showFloatingText(400, 300, "¡TABLERO LIMPIADO!", "#FFFFFF");
        this.allLandedSquares.forEach(sq => {
            if (sq) {
                this.tweens.add({
                    targets: sq, y: 650, alpha: 0,
                    duration: 500, ease: 'Power2',
                    onComplete: () => sq.destroy()
                });
            }
        });
        this.allLandedSquares = [];
        this.columnPixels = [0, 0, 0];
    }

    snapAllToGrid() {
        const GRID_O = GRID_OFFSET;
        this.allLandedSquares.forEach(sq => {
            if (sq && sq.active) {
                this.tweens.killTweensOf(sq);
                sq.x = Math.round((sq.x - GRID_O - 15) / T_SIZE) * T_SIZE + GRID_O + 15;
                sq.y = Math.round((sq.y - 15) / T_SIZE) * T_SIZE + 15;
            }
        });
    }

    finalizeLand(block) {
        // Use a matrix to account for rotation and scale accurately
        const matrix = block.squaresContainer.getWorldTransformMatrix();
        const squares = block.squaresContainer.list.filter(c => c.type === 'Rectangle');

        squares.forEach(sq => {
            const worldPos = matrix.transformPoint(sq.x, sq.y);

            // Snap X to nearest column center (GRID_OFFSET + 15, +45, +75...)
            const worldX = Math.round((worldPos.x - GRID_OFFSET - 15) / T_SIZE) * T_SIZE + GRID_OFFSET + 15;
            // Snap Y to nearest row center (15, 45, 75...)
            const worldY = Math.round((worldPos.y - 15) / T_SIZE) * T_SIZE + 15;

            // Create a new independent square at world position
            const landedSq = this.add.rectangle(worldX, worldY, sq.width, sq.height, sq.fillColor, sq.fillAlpha);
            landedSq.setStrokeStyle(sq.lineWidth, sq.strokeColor, sq.strokeAlpha);
            landedSq.isBrecha = (sq.fillColor === 0xFF0000);
            landedSq.isMain = sq.isMain;

            this.allLandedSquares.push(landedSq);
        });

        block.destroy();
        this.snapAllToGrid(); // Ensure absolute alignment before logic
        this.checkAndClearLines();
    }

    checkAndClearLines() {
        const gridW = 10;
        const startY = 555; // Center of bottom-most playable row
        const rows = 20;
        let rowsToClear = [];
        let totalPoints = 0;

        // 1. Identify all complete rows
        for (let r = 0; r < rows; r++) {
            const targetY = startY - (r * T_SIZE);
            const rowSquares = this.allLandedSquares.filter(sq =>
                sq && sq.active && Math.abs(sq.y - targetY) < 5
            );

            if (rowSquares.filter(s => s.isMain).length >= gridW) {
                rowsToClear.push({ y: targetY, squares: rowSquares });
            }
        }

        if (rowsToClear.length > 0) {
            // 2. Process all cleared rows
            let squaresToRemove = new Set();
            rowsToClear.forEach(row => {
                row.squares.forEach(sq => {
                    squaresToRemove.add(sq);
                    
                    // Flash and Destroy
                    this.tweens.add({
                        targets: sq, fillColor: 0xFFFFFF, duration: 100, repeat: 2, yoyo: true,
                        onComplete: () => sq.destroy()
                    });
                });
                
                const rowPoints = row.squares.reduce((sum, sq) => sum + (sq.isBrecha ? -100 : 50), 0);
                totalPoints += rowPoints;
            });

            // Logical removal happens INSTANTLY so gravity sees the space
            this.allLandedSquares = this.allLandedSquares.filter(s => !squaresToRemove.has(s));
            
            // 3. Apply gravity: shift rows above cleared rows down
            this.applyGravity(rowsToClear);

            // 4. Final scoring and spawning
            const linesCleared = rowsToClear.length;
            this.totalLinesCleared += linesCleared;
            // Bonus por lineas completadas basado en la velocidad
            const finalScore = Math.round(totalPoints * this.combo * this.fallSpeed);
            this.score = Math.max(0, this.score + finalScore);
            this.events.emit('score-changed', this.score, this.combo);
            this.events.emit('lines-changed', this.totalLinesCleared);

            const msg = totalPoints >= 0 ? "¡SISTEMA SANEADO!" : "¡BRECHA REMOVIDA!";
            const color = totalPoints >= 0 ? 0x00FF00 : 0xFF0000;
            this.showFloatingText(400, 300, `${msg}\n${finalScore > 0 ? '+' : ''}${finalScore} pts`, color);

            this.time.delayedCall(600, () => this.spawnBlock());
        } else {
            this.spawnBlock();
        }
    }

    applyGravity(rowsToClear) {
        // Classic Tetris approach: for each cleared row (sorted bottom->top),
        // shift every remaining block that is strictly ABOVE that row down by T_SIZE.
        // Sort rows bottom-to-top (highest Y value first) so shifts don't interfere.
        const sortedRows = [...rowsToClear].sort((a, b) => b.y - a.y);

        sortedRows.forEach(row => {
            this.allLandedSquares.forEach(sq => {
                if (sq && sq.active && sq.y < row.y - 2) {
                    sq.y += T_SIZE;
                    this.tweens.add({
                        targets: sq,
                        y: { from: sq.y - T_SIZE, to: sq.y },
                        duration: 250,
                        ease: 'Power2.easeOut'
                    });
                }
            });
        });
    }

    handleSuccess(block) {
        this.combo++;
        // Bonus de puntuacion basado en la velocidad actual
        const points = Math.round(100 * this.combo * this.fallSpeed);
        this.score += points;
        this.events.emit('score-changed', this.score, this.combo);

        this.sound.play('good', { volume: 0.6 });

        const color = this.colors[block.classification];

        block.textElements.forEach(el => el.destroy());

        block.squaresContainer.list.forEach(child => {
            if (child.type === 'Rectangle') {
                child.setFillStyle(color, 0.9);
                child.setStrokeStyle(2, color, 1);
            }
        });

        this.particles.setParticleTint(color);
        this.particles.explode(30, block.x, block.y);

        this.tweens.add({
            targets: block.squaresContainer, scaleX: 1.1, scaleY: 1.1,
            yoyo: true, duration: 100,
            onComplete: () => {
                this.finalizeLand(block);
            }
        });

        this.showFloatingText(block.x, block.y - 85, `+${points}`, color);
        this.cameras.main.shake(150, 0.005);
    }

    handleError(block) {
        this.combo = 0;
        this.integrity = Math.max(0, this.integrity - 10);
        this.events.emit('integrity-changed', this.integrity);
        this.events.emit('score-changed', this.score, this.combo);

        this.sound.play('wrong', { volume: 0.6 });

        if (this.integrity <= 0) {
            this.gameOver();
        }

        block.textElements.forEach(el => el.destroy());

        block.squaresContainer.list.forEach(child => {
            if (child.type === 'Rectangle') {
                child.setFillStyle(0xFF0000, 0.8);
                child.setStrokeStyle(2, 0xFF0000, 1);
            }
        });

        this.particles.setParticleTint(0xFF0000);
        this.particles.explode(40, block.x, block.y);

        this.cameras.main.shake(400, 0.02);

        this.tweens.add({
            targets: block.squaresContainer, x: block.squaresContainer.x + 8,
            yoyo: true, repeat: 3, duration: 40,
            onComplete: () => {
                block.squaresContainer.x = 0; // NEW: Reset residual offset
                this.score = Math.max(0, this.score - 50);
                this.events.emit('score-changed', this.score, this.combo);
                this.finalizeLand(block);
            }
        });

        this.showFloatingText(block.x, block.y - 60, '¡BRECHA!', 0xFF0000);
    }

    showFloatingText(x, y, message, color) {
        const text = this.add.text(x, y, message, {
            fontFamily: 'Outfit', fontSize: '28px', fontWeight: '900',
            color: '#fff', stroke: '#000', strokeThickness: 4,
            shadow: { blur: 15, color: '#fff', fill: true }
        }).setOrigin(0.5);
        text.setTint(color);

        this.tweens.add({
            targets: text, y: y - 80, alpha: 0, scale: 1.5,
            duration: 1200, ease: 'Power3',
            onComplete: () => text.destroy()
        });
    }
}
