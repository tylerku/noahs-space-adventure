/**
 * Mars Defense Mission (Mission 3)
 * Defend Hannah and James from aliens while Dad repairs the rocket
 */

import { GAME, PLAYER, COLORS, CAMERA, TERRAIN } from '../core/constants.js';
import { noah, marsState, terrain, addRepairProgress, damageHannah } from '../core/state.js';
import {
    drawNoah, drawHannahAndJames, drawDad, drawAlien
} from '../entities/characters.js';
import { getPoolManager } from '../utils/pools.js';
import { updateRepairBar, updateHealth } from '../ui/dialogs.js';

// ============ TERRAIN GENERATION ============

/**
 * Generate Mars terrain features
 */
export function generateTerrain(p) {
    terrain.rocks = [];
    terrain.craters = [];
    terrain.dunes = [];
    terrain.pebbles = [];

    // Rocks
    for (let i = 0; i < TERRAIN.ROCKS_COUNT; i++) {
        const angle = p.random(p.TWO_PI);
        const dist = p.random(TERRAIN.ROCKS_MIN_DIST, TERRAIN.ROCKS_MAX_DIST);
        terrain.rocks.push({
            x: Math.cos(angle) * dist,
            z: Math.sin(angle) * dist,
            size: p.random(TERRAIN.ROCKS_MIN_SIZE, TERRAIN.ROCKS_MAX_SIZE),
            height: p.random(10, 40),
            rotation: p.random(p.TWO_PI),
            tilt: p.random(-0.2, 0.2),
            color: COLORS.MARS_ROCK_VARIANTS[Math.floor(p.random(COLORS.MARS_ROCK_VARIANTS.length))],
        });
    }

    // Craters
    for (let i = 0; i < TERRAIN.CRATERS_COUNT; i++) {
        const angle = p.random(p.TWO_PI);
        const dist = p.random(TERRAIN.CRATERS_MIN_DIST, TERRAIN.CRATERS_MAX_DIST);
        terrain.craters.push({
            x: Math.cos(angle) * dist,
            z: Math.sin(angle) * dist,
            radius: p.random(TERRAIN.CRATERS_MIN_RADIUS, TERRAIN.CRATERS_MAX_RADIUS),
            depth: p.random(3, 8),
        });
    }

    // Dunes
    for (let i = 0; i < TERRAIN.DUNES_COUNT; i++) {
        const angle = p.random(p.TWO_PI);
        const dist = p.random(TERRAIN.DUNES_MIN_DIST, TERRAIN.DUNES_MAX_DIST);
        terrain.dunes.push({
            x: Math.cos(angle) * dist,
            z: Math.sin(angle) * dist,
            width: p.random(60, 150),
            height: p.random(5, 20),
            length: p.random(80, 200),
            rotation: p.random(p.TWO_PI),
        });
    }

    // Pebbles
    for (let i = 0; i < TERRAIN.PEBBLES_COUNT; i++) {
        const angle = p.random(p.TWO_PI);
        const dist = p.random(TERRAIN.PEBBLES_MIN_DIST, TERRAIN.PEBBLES_MAX_DIST);
        terrain.pebbles.push({
            x: Math.cos(angle) * dist,
            z: Math.sin(angle) * dist,
            size: p.random(2, 6),
            color: COLORS.MARS_ROCK_VARIANTS[Math.floor(p.random(COLORS.MARS_ROCK_VARIANTS.length))],
        });
    }
}

// ============ UPDATE LOOP ============

/**
 * Main Mars Defense update
 */
export function updateMarsDefense(p) {
    const pools = getPoolManager();

    // Repair progress
    if (addRepairProgress(GAME.REPAIR_SPEED)) {
        return 'won';
    }
    updateRepairBar(marsState.repairProgress);

    // Player movement
    handleMovement(p);

    // Sword timer
    if (noah.swingTimer > 0) noah.swingTimer--;

    // Spawn aliens
    if (p.frameCount % GAME.ALIEN_SPAWN_INTERVAL === 0) {
        spawnAlien(p, pools);
    }

    // Update bullets
    pools.updateBullets(GAME.BULLET_SPEED);

    // Update aliens and check collisions
    const result = updateAliens(p, pools);
    if (result === 'lost') return 'lost';

    // Update particles
    pools.updateParticles();

    return null;
}

/**
 * Handle player movement
 */
function handleMovement(p) {
    if (p.keyIsDown(87)) noah.z -= PLAYER.MOVE_SPEED; // W
    if (p.keyIsDown(83)) noah.z += PLAYER.MOVE_SPEED; // S
    if (p.keyIsDown(65)) noah.x -= PLAYER.MOVE_SPEED; // A
    if (p.keyIsDown(68)) noah.x += PLAYER.MOVE_SPEED; // D

    // Look at mouse
    const dx = p.mouseX - p.width / 2;
    const dy = p.mouseY - p.height / 2;
    noah.angle = Math.atan2(dy, dx) + p.HALF_PI;
}

/**
 * Spawn a new alien
 */
function spawnAlien(p, pools) {
    const angle = p.random(p.TWO_PI);
    pools.spawnAlien(
        Math.cos(angle) * GAME.ALIEN_SPAWN_RADIUS,
        Math.sin(angle) * GAME.ALIEN_SPAWN_RADIUS,
        GAME.ALIEN_BASE_SPEED + (marsState.repairProgress / GAME.ALIEN_SPEED_SCALE),
        p.random(p.TWO_PI)
    );
}

/**
 * Update aliens and check collisions
 */
function updateAliens(p, pools) {
    const aliens = pools.getActiveAliens();
    const bullets = pools.getActiveBullets();

    for (let i = aliens.length - 1; i >= 0; i--) {
        const alien = aliens[i];

        // Move toward center
        const angleToCenter = Math.atan2(-alien.x, -alien.z);
        alien.x += Math.sin(angleToCenter) * alien.speed;
        alien.z += Math.cos(angleToCenter) * alien.speed;

        // Bullet collision
        for (let j = bullets.length - 1; j >= 0; j--) {
            const bullet = bullets[j];
            if (p.dist(alien.x, alien.z, bullet.x, bullet.z) < GAME.BULLET_COLLISION_RADIUS) {
                pools.spawnExplosion(alien.x, alien.z, 'green');
                pools.releaseAlien(alien);
                pools.releaseBullet(bullet);
                break;
            }
        }

        // Skip if already released
        if (!alien._poolActive) continue;

        // Sword collision
        if (noah.swingTimer > 0 &&
            p.dist(noah.x, noah.z, alien.x, alien.z) < GAME.SWORD_COLLISION_RADIUS) {
            pools.spawnExplosion(alien.x, alien.z, 'orange');
            pools.releaseAlien(alien);
            continue;
        }

        // Reached Hannah
        if (p.dist(alien.x, alien.z, 0, 0) < GAME.HANNAH_COLLISION_RADIUS) {
            pools.spawnExplosion(0, 0, 'red');
            pools.releaseAlien(alien);
            if (damageHannah(PLAYER.ALIEN_DAMAGE)) {
                return 'lost';
            }
            updateHealth(marsState.hannahHealth);
        }
    }

    return null;
}

/**
 * Shoot blaster
 */
export function shootBlaster() {
    const pools = getPoolManager();
    pools.spawnBullet(
        noah.x,
        noah.z,
        -noah.angle + Math.PI,
        GAME.BULLET_LIFETIME
    );
}

/**
 * Swing sword
 */
export function swingSword() {
    noah.swingTimer = GAME.SWORD_ACTIVE_FRAMES;
}

// ============ RENDERING ============

/**
 * Draw Mars Defense scene
 */
export function drawMarsDefense(p) {
    p.background(...COLORS.MARS_SKY);

    // Camera
    p.camera(noah.x, -CAMERA.MARS_HEIGHT, noah.z + CAMERA.MARS_DISTANCE,
             noah.x, 0, noah.z, 0, 1, 0);

    // Lighting
    p.ambientLight(80);
    p.directionalLight(255, 200, 150, 0.5, 1, -0.5);
    p.pointLight(0, 255, 255, noah.x, -50, noah.z);

    // Draw scene
    drawMarsTerrain(p);
    drawRocket(p);
    drawHannahAndJames(p, { x: 10, z: 10, hannahHealth: marsState.hannahHealth });
    drawDad(p, { x: -40, z: -60 });
    drawNoah(p, { x: noah.x, z: noah.z, angle: noah.angle, swingTimer: noah.swingTimer });
    drawBullets(p);
    drawAliens(p);
    drawParticles(p);
}

/**
 * Draw Mars terrain
 */
function drawMarsTerrain(p) {
    // Ground
    p.push();
    p.rotateX(p.HALF_PI);
    p.fill(...COLORS.MARS_GROUND);
    p.plane(3000, 3000);
    p.pop();

    // Ground patches
    for (let i = 0; i < 8; i++) {
        p.push();
        const px = (i % 4 - 1.5) * 400;
        const pz = (Math.floor(i / 4) - 0.5) * 400;
        p.translate(px, -3, pz);
        p.rotateX(p.HALF_PI);
        p.fill(160, 50, 35, 150);
        p.ellipse(0, 0, 300, 250);
        p.pop();
    }

    // Dunes
    terrain.dunes.forEach(d => {
        p.push();
        p.translate(d.x, -d.height / 2, d.z);
        p.rotateY(d.rotation);
        p.fill(190, 70, 50);
        p.scale(1, 0.4, 1);
        p.sphere(d.width / 2);
        p.pop();
    });

    // Craters
    terrain.craters.forEach(c => {
        p.push();
        p.translate(c.x, 0, c.z);
        p.fill(90, 28, 18);
        p.push();
        p.translate(0, c.depth, 0);
        p.scale(1, 0.15, 1);
        p.sphere(c.radius * 0.9);
        p.pop();
        p.fill(170, 55, 38);
        p.translate(0, -c.depth - 2, 0);
        p.rotateX(p.HALF_PI);
        p.torus(c.radius, c.depth + 2);
        p.pop();
    });

    // Rocks
    terrain.rocks.forEach(r => {
        p.push();
        p.translate(r.x, -r.height / 2, r.z);
        p.rotateY(r.rotation);
        p.rotateX(r.tilt);
        p.fill(...r.color);
        p.scale(1, r.height / r.size, 1);
        p.sphere(r.size);
        if (r.size > 20) {
            p.translate(r.size * 0.3, -r.size * 0.6, 0);
            p.scale(0.5);
            p.fill(r.color[0] - 20, r.color[1] - 10, r.color[2] - 10);
            p.sphere(r.size * 0.6);
        }
        p.pop();
    });

    // Pebbles
    terrain.pebbles.forEach(pb => {
        p.push();
        p.translate(pb.x, -pb.size / 2, pb.z);
        p.fill(...pb.color);
        p.sphere(pb.size);
        p.pop();
    });

    // Dust ripples
    for (let i = 0; i < 12; i++) {
        p.push();
        const angle = (i / 12) * p.TWO_PI;
        const dist = 200 + (i % 3) * 150;
        p.translate(Math.cos(angle) * dist, -4, Math.sin(angle) * dist);
        p.rotateX(p.HALF_PI);
        p.rotateZ(angle + p.HALF_PI);
        p.noFill();
        p.stroke(200, 80, 55, 100);
        p.strokeWeight(2);
        p.arc(0, 0, 80, 40, 0, p.PI);
        p.noStroke();
        p.pop();
    }
}

/**
 * Draw the rocket ship
 */
function drawRocket(p) {
    p.push();
    p.translate(0, -150, -80);

    // Main body
    p.fill(240, 240, 245);
    p.cylinder(35, 180);

    // Red stripes
    p.fill(200, 30, 30);
    p.push();
    p.translate(0, -60, 0);
    p.cylinder(36, 10);
    p.pop();
    p.push();
    p.translate(0, 30, 0);
    p.cylinder(36, 10);
    p.pop();

    // Upper section
    p.push();
    p.translate(0, -100, 0);
    p.fill(240, 240, 245);
    p.cylinder(30, 40);
    p.pop();

    // Nose cone
    p.push();
    p.translate(0, -130, 0);
    p.fill(200, 30, 30);
    p.cone(30, 50);
    p.translate(0, -30, 0);
    p.fill(80);
    p.cone(8, 20);
    p.pop();

    // Window
    p.push();
    p.translate(0, -50, 36);
    p.fill(50, 150, 255);
    p.sphere(12);
    p.fill(80);
    p.torus(12, 2);
    p.pop();

    // Engine section
    p.push();
    p.translate(0, 95, 0);
    p.fill(60);
    p.cylinder(38, 20);
    p.fill(40);
    p.translate(0, 15, 0);
    p.push();
    p.cone(15, 25);
    p.fill(255, 100, 0, 150);
    p.translate(0, 15, 0);
    p.cone(12, 20);
    p.pop();
    for (let i = 0; i < 3; i++) {
        p.push();
        p.rotateY(i * p.TWO_PI / 3);
        p.translate(22, 0, 0);
        p.fill(40);
        p.cone(8, 18);
        p.pop();
    }
    p.pop();

    // Fins
    for (let i = 0; i < 4; i++) {
        p.push();
        p.rotateY(i * p.HALF_PI + p.QUARTER_PI);
        p.translate(35, 70, 0);
        p.rotateZ(-0.3);
        p.fill(200, 30, 30);
        p.box(5, 60, 30);
        p.translate(0, -35, 0);
        p.rotateZ(0.3);
        p.box(5, 30, 20);
        p.pop();
    }

    // Landing legs
    for (let i = 0; i < 3; i++) {
        p.push();
        p.rotateY(i * p.TWO_PI / 3);
        p.translate(30, 90, 0);
        p.rotateZ(-0.5);
        p.fill(80);
        p.box(6, 50, 6);
        p.translate(0, 28, 0);
        p.rotateZ(0.5);
        p.fill(60);
        p.cylinder(10, 4);
        p.pop();
    }

    p.pop();
}

/**
 * Draw all bullets
 */
function drawBullets(p) {
    const pools = getPoolManager();
    p.fill(...COLORS.BULLET);

    for (const bullet of pools.getActiveBullets()) {
        p.push();
        p.translate(bullet.x, -30, bullet.z);
        p.sphere(3);
        p.pop();
    }
}

/**
 * Draw all aliens
 */
function drawAliens(p) {
    const pools = getPoolManager();
    for (const alien of pools.getActiveAliens()) {
        drawAlien(p, alien);
    }
}

/**
 * Draw all particles
 */
function drawParticles(p) {
    const pools = getPoolManager();
    for (const particle of pools.getActiveParticles()) {
        p.push();
        p.translate(particle.x, particle.y, particle.z);
        p.fill(particle.color);
        p.box(5);
        p.pop();
    }
}

// ============ CUTSCENES ============

/**
 * Draw Mars cutscene
 */
export function drawMarsCutscene(p) {
    p.background(50, 20, 10);

    const camTime = p.frameCount * 0.01;
    p.camera(Math.sin(camTime * 0.3) * 30, -120, 250, 0, -40, 0, 0, 1, 0);
    p.ambientLight(60);
    p.directionalLight(255, 180, 120, 0.5, 1, -0.5);

    // Ground
    p.push();
    p.rotateX(p.HALF_PI);
    p.fill(180, 80, 50);
    p.ellipse(0, 0, 600, 400);
    p.pop();

    // Rocks
    for (let i = 0; i < 8; i++) {
        p.push();
        p.translate(Math.cos((i / 8) * p.TWO_PI) * 150, 0, Math.sin((i / 8) * p.TWO_PI) * 100 - 50);
        p.fill(120, 60, 40);
        p.scale(1, 0.6, 1);
        p.sphere(10 + (i % 3) * 5);
        p.pop();
    }

    // Damaged rocket (tilted)
    p.push();
    p.translate(-80, -60, -60);
    p.rotateZ(0.15); // Slight tilt to show it's damaged

    // Main body
    p.fill(240, 240, 245);
    p.cylinder(20, 100);

    // Red stripes
    p.fill(200, 30, 30);
    p.push();
    p.translate(0, -30, 0);
    p.cylinder(21, 6);
    p.pop();
    p.push();
    p.translate(0, 20, 0);
    p.cylinder(21, 6);
    p.pop();

    // Nose cone
    p.push();
    p.translate(0, -60, 0);
    p.fill(200, 30, 30);
    p.cone(20, 35);
    p.pop();

    // Window
    p.push();
    p.translate(0, -25, 21);
    p.fill(50, 150, 255);
    p.sphere(8);
    p.fill(80);
    p.torus(8, 1.5);
    p.pop();

    // Engine section
    p.push();
    p.translate(0, 55, 0);
    p.fill(60);
    p.cylinder(22, 12);
    p.pop();

    // Fins
    for (let i = 0; i < 4; i++) {
        p.push();
        p.rotateY(i * p.HALF_PI + p.QUARTER_PI);
        p.translate(20, 40, 0);
        p.rotateZ(-0.3);
        p.fill(200, 30, 30);
        p.box(3, 35, 18);
        p.pop();
    }

    p.pop();

    // Hannah with breathing animation
    const breathe = Math.sin(p.frameCount * 0.05) * 2;
    p.push();
    p.translate(0, breathe, 0);
    drawCutsceneHannah(p);
    p.pop();

    // Stars
    for (let i = 0; i < 50; i++) {
        p.push();
        p.translate(
            (Math.sin(i * 1234.5) * 0.5 + 0.5) * 400 - 200,
            -100 - (Math.sin(i * 567.8) * 0.5 + 0.5) * 150,
            (Math.cos(i * 891.2) * 0.5 + 0.5) * 200 - 300
        );
        p.fill(255, 255, 255, (Math.sin(p.frameCount * 0.1 + i) * 0.3 + 0.7) * 255);
        p.sphere(1 + (i % 3) * 0.5);
        p.pop();
    }
}

function drawCutsceneHannah(p) {
    // Legs
    p.fill(255, 180, 200);
    p.push();
    p.translate(-6, -8, 0);
    p.box(5, 16, 5);
    p.pop();
    p.push();
    p.translate(6, -8, 0);
    p.box(5, 16, 5);
    p.pop();

    // Body
    p.fill(255, 100, 150);
    p.push();
    p.translate(0, -28, 0);
    p.box(18, 28, 12);
    p.translate(0, 10, 0);
    p.fill(255, 120, 170);
    p.box(22, 10, 14);
    p.pop();

    // Arms
    p.fill(255, 220, 180);
    p.push();
    p.translate(-12, -32, 4);
    p.rotateZ(0.5);
    p.rotateX(-0.3);
    p.box(4, 18, 4);
    p.pop();
    p.push();
    p.translate(12, -28, 6);
    p.rotateZ(-0.6);
    p.rotateX(-0.4);
    p.box(4, 16, 4);
    p.pop();

    // Head
    p.push();
    p.translate(0, -52, 0);
    p.fill(255, 220, 180);
    p.sphere(10);

    // Eyes
    p.fill(80, 50, 30);
    p.push();
    p.translate(-3, -2, 9);
    p.sphere(1.5);
    p.pop();
    p.push();
    p.translate(3, -2, 9);
    p.sphere(1.5);
    p.pop();

    // Smile
    p.push();
    p.translate(0, 2, 9);
    p.fill(200, 100, 100);
    p.scale(1, 0.5, 0.3);
    p.sphere(3);
    p.pop();

    // Hair
    p.fill(139, 69, 19);
    p.push();
    p.translate(0, -5, -2);
    p.scale(1.1, 0.8, 1);
    p.sphere(11);
    p.pop();
    p.push();
    p.translate(-8, 0, -2);
    p.scale(0.6, 1.5, 0.6);
    p.sphere(8);
    p.pop();
    p.push();
    p.translate(8, 0, -2);
    p.scale(0.6, 1.5, 0.6);
    p.sphere(8);
    p.pop();

    // Hair bow
    p.fill(255, 150, 200);
    p.push();
    p.translate(6, -8, 2);
    p.scale(1, 0.5, 0.3);
    p.sphere(4);
    p.pop();
    p.pop();

    // Baby James
    p.push();
    p.translate(0, -26, 10);
    p.fill(135, 206, 250);
    p.push();
    p.scale(1.2, 0.8, 1);
    p.sphere(10);
    p.pop();
    p.push();
    p.translate(0, -6, 5);
    p.fill(255, 220, 180);
    p.sphere(6);
    // Baby eyes
    p.fill(80, 50, 30);
    p.push();
    p.translate(-2, -1, 5);
    p.scale(1, 0.3, 0.5);
    p.sphere(1);
    p.pop();
    p.push();
    p.translate(2, -1, 5);
    p.scale(1, 0.3, 0.5);
    p.sphere(1);
    p.pop();
    // Baby hair
    p.fill(200, 180, 100);
    p.push();
    p.translate(0, -5, 0);
    p.scale(1, 0.4, 1);
    p.sphere(4);
    p.pop();
    p.pop();
    p.pop();
}
