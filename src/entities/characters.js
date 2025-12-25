/**
 * Character Drawing Factory - Reduces duplicate character drawing code
 */

import { COLORS, ANIMATION } from '../core/constants.js';

/**
 * Draw a humanoid character with configurable options
 * @param {object} p - p5.js instance
 * @param {object} options - Character configuration
 */
export function drawCharacter(p, options) {
    const {
        x = 0,
        z = 0,
        rotation = 0,
        bodyColor = COLORS.NOAH_SHIRT,
        pantsColor = COLORS.NOAH_PANTS,
        skinColor = COLORS.SKIN,
        hairColor = COLORS.BLONDE_HAIR,
        isWalking = false,
        walkPhase = 0,
        armPose = 'normal', // 'normal', 'waving', 'raised', 'reaching'
        scale = 1,
    } = options;

    const walkCycle = isWalking ? Math.sin(walkPhase) : 0;
    const legSwing = walkCycle * 0.5;
    const armSwing = walkCycle * 0.3;

    p.push();
    p.translate(x, 0, z);
    p.rotateY(rotation);
    p.scale(scale);

    // Legs
    p.fill(...pantsColor);
    p.push();
    p.translate(-4, -5, 0);
    if (isWalking) p.rotateX(legSwing);
    p.box(5, 14, 5);
    p.pop();
    p.push();
    p.translate(4, -5, 0);
    if (isWalking) p.rotateX(-legSwing);
    p.box(5, 14, 5);
    p.pop();

    // Body
    p.fill(...bodyColor);
    p.push();
    p.translate(0, -18, 0);
    p.box(14, 22, 10);
    p.pop();

    // Arms
    p.fill(...skinColor);
    drawArms(p, { armPose, armSwing, isWalking, walkPhase, skinColor });

    // Head
    p.push();
    p.translate(0, -35, 0);
    p.fill(...skinColor);
    p.sphere(8);

    // Hair
    p.fill(...hairColor);
    p.translate(0, -4, 0);
    p.box(17, 6, 16);
    p.pop();

    p.pop();
}

/**
 * Draw arms with different poses
 */
function drawArms(p, { armPose, armSwing, isWalking, walkPhase, skinColor }) {
    switch (armPose) {
        case 'waving':
            // Left arm normal
            p.push();
            p.translate(-10, -20, 0);
            p.rotateZ(0.3);
            p.box(4, 14, 4);
            p.pop();
            // Right arm waving
            p.push();
            p.translate(10, -25, 0);
            p.rotateZ(-0.8 - Math.sin(walkPhase) * 0.4);
            p.box(4, 14, 4);
            p.pop();
            break;

        case 'raised':
            // Both arms raised
            p.push();
            p.translate(-10, -28, 0);
            p.rotateZ(0.8);
            p.box(4, 14, 4);
            p.pop();
            p.push();
            p.translate(10, -28, 0);
            p.rotateZ(-0.8);
            p.box(4, 14, 4);
            p.pop();
            break;

        case 'reaching':
            // Arms reaching forward (for mowing)
            p.push();
            p.translate(-10, -28, -10);
            p.rotateX(-0.6);
            p.box(4, 18, 4);
            p.pop();
            p.push();
            p.translate(10, -28, -10);
            p.rotateX(-0.6);
            p.box(4, 18, 4);
            p.pop();
            break;

        default:
            // Normal walking/standing arms
            p.push();
            p.translate(-10, -20, 0);
            if (isWalking) p.rotateX(armSwing);
            p.rotateZ(0.2);
            p.box(4, 14, 4);
            p.pop();
            p.push();
            p.translate(10, -20, 0);
            if (isWalking) p.rotateX(-armSwing);
            p.rotateZ(-0.2);
            p.box(4, 14, 4);
            p.pop();
    }
}

/**
 * Draw Noah (the player character)
 */
export function drawNoah(p, { x, z, angle, swingTimer, isM1 = false }) {
    p.push();
    p.translate(x, -25, z);
    p.rotateY(-angle + p.PI);

    // Body
    p.fill(0, 0, 255);
    p.box(20, 30, 10);

    // Head
    p.push();
    p.translate(0, -20, 0);
    p.fill(255, 220, 180);
    p.box(14);
    p.translate(0, -8, 0);
    p.fill(255, 255, 0);
    p.box(16, 6, 16);
    p.pop();

    if (!isM1) {
        // Right Arm with Sword
        p.push();
        p.translate(12, -5, 10);
        if (swingTimer > 0) {
            p.rotateX(p.map(swingTimer, 0, 15, 0, -2));
        }
        p.fill(0, 0, 200);
        p.box(6, 20, 6);
        p.translate(0, 10, 5);
        p.rotateX(p.PI / 2);
        drawMinecraftSword(p);
        p.pop();

        // Left Arm with Blaster
        p.push();
        p.translate(-12, -5, 10);
        p.rotateX(-1.5);
        p.fill(0, 0, 200);
        p.box(6, 20, 6);
        p.translate(0, 15, 0);
        p.fill(50);
        p.cylinder(3, 15);
        p.pop();
    } else {
        // Mission 1 Noah - normal walking arms
        const legSwing = Math.sin(p.frameCount * ANIMATION.WALK_CYCLE) * 0.3;
        p.fill(255, 220, 180);
        p.push();
        p.translate(-10, -20, 0);
        p.rotateX(legSwing);
        p.box(4, 14, 4);
        p.pop();
        p.push();
        p.translate(10, -20, 0);
        p.rotateX(-legSwing);
        p.box(4, 14, 4);
        p.pop();

        // Legs for M1
        p.fill(50, 50, 150);
        p.push();
        p.translate(-4, 15, 0);
        p.rotateX(legSwing);
        p.box(5, 14, 5);
        p.pop();
        p.push();
        p.translate(4, 15, 0);
        p.rotateX(-legSwing);
        p.box(5, 14, 5);
        p.pop();
    }

    p.pop();
}

/**
 * Draw Minecraft-style diamond sword
 */
export function drawMinecraftSword(p) {
    p.fill(0, 255, 255);
    p.push();
    // Blade segments
    for (let i = 0; i < 5; i++) {
        p.translate(0, -4, 0);
        p.box(4);
    }
    // Guard
    p.translate(0, 20, 0);
    p.fill(100, 50, 0);
    p.box(12, 4, 2);
    // Handle
    p.translate(0, 4, 0);
    p.box(4, 8, 2);
    p.pop();
}

/**
 * Draw Hannah (pink dress girl)
 */
export function drawHannah(p, { x = 0, z = 0, scale = 1, isWaving = false }) {
    p.push();
    p.translate(x, 0, z);
    p.scale(scale);

    // Pink dress body
    p.fill(255, 105, 180);
    p.push();
    p.translate(0, -18, 0);
    p.box(14, 24, 12);
    p.pop();

    // Head
    p.push();
    p.translate(0, -38, 0);
    p.fill(255, 220, 180);
    p.sphere(8);

    // Brown hair
    p.fill(139, 69, 19);
    p.push();
    p.translate(0, -2, -2);
    p.sphere(9);
    p.translate(0, 5, -3);
    p.box(16, 12, 4);
    p.pop();

    // Eyes
    p.fill(50, 50, 50);
    p.push();
    p.translate(-3, 0, 7);
    p.sphere(1.5);
    p.translate(6, 0, 0);
    p.sphere(1.5);
    p.pop();

    // Smile
    p.fill(200, 100, 100);
    p.push();
    p.translate(0, 3, 7);
    p.box(4, 1, 1);
    p.pop();
    p.pop();

    // Arms
    p.fill(255, 220, 180);
    p.push();
    p.translate(-12, -25, 0);
    if (isWaving) {
        p.rotateZ(0.8 + Math.sin(p.frameCount * ANIMATION.WAVE) * 0.4);
    } else {
        p.rotateZ(0.3);
    }
    p.box(4, 14, 4);
    p.pop();
    p.push();
    p.translate(12, -20, 0);
    p.rotateZ(-0.5);
    p.box(4, 12, 4);
    p.pop();

    // Legs
    p.fill(255, 200, 180);
    p.push();
    p.translate(-4, -4, 0);
    p.box(5, 10, 5);
    p.pop();
    p.push();
    p.translate(4, -4, 0);
    p.box(5, 10, 5);
    p.pop();

    p.pop();
}

/**
 * Draw Mommy (Noah's mom) - stands in front of Noah's house
 */
export function drawMommy(p, { x = 0, z = 0 }) {
    p.push();
    p.translate(x, 0, z);
    p.rotateY(p.PI);  // Face south toward street/camera

    // Dress body (light blue)
    p.fill(135, 180, 220);
    p.push();
    p.translate(0, -22, 0);
    p.box(16, 28, 12);
    // Dress skirt
    p.translate(0, 16, 0);
    p.box(20, 12, 14);
    p.pop();

    // Head
    p.push();
    p.translate(0, -42, 0);
    p.fill(255, 220, 180);
    p.sphere(9);

    // Blonde hair (styled)
    p.fill(255, 220, 100);
    p.push();
    p.translate(0, -3, -2);
    p.sphere(10);
    // Hair sides
    p.translate(-5, 4, 2);
    p.sphere(4);
    p.translate(10, 0, 0);
    p.sphere(4);
    p.pop();

    // Eyes
    p.fill(50, 50, 50);
    p.push();
    p.translate(-3, 0, 8);
    p.sphere(1.5);
    p.translate(6, 0, 0);
    p.sphere(1.5);
    p.pop();

    // Smile
    p.fill(180, 100, 100);
    p.push();
    p.translate(0, 4, 8);
    p.box(5, 1.5, 1);
    p.pop();
    p.pop();

    // Arms
    p.fill(255, 220, 180);
    p.push();
    p.translate(-12, -28, 0);
    p.rotateZ(0.3);
    p.box(4, 14, 4);
    p.pop();
    p.push();
    p.translate(12, -28, 0);
    p.rotateZ(-0.3);
    p.box(4, 14, 4);
    p.pop();

    // Legs
    p.fill(255, 200, 180);
    p.push();
    p.translate(-4, -4, 0);
    p.box(5, 10, 5);
    p.pop();
    p.push();
    p.translate(4, -4, 0);
    p.box(5, 10, 5);
    p.pop();

    p.pop();
}

/**
 * Draw Hannah holding baby James
 */
export function drawHannahAndJames(p, { x = 0, z = 0, hannahHealth = 100 }) {
    p.push();
    p.translate(x, -15, z);

    // Hannah
    p.fill(255, 100, 150);
    p.box(12, 24, 12);

    // Head
    p.translate(0, -15, 0);
    p.fill(255, 220, 180);
    p.sphere(6);

    // Hair
    p.push();
    p.translate(0, -4, 0);
    p.fill(139, 69, 19);
    p.scale(1, 0.6, 1);
    p.sphere(7);
    p.pop();

    // Baby James
    p.push();
    p.translate(8, 10, 5);
    p.fill(135, 206, 250);
    p.sphere(6);
    p.translate(0, -2, 4);
    p.fill(255, 220, 180);
    p.sphere(3);
    p.pop();

    // Health bar
    drawHealthBar(p, { health: hannahHealth, y: -30 });

    p.pop();
}

/**
 * Draw health bar above entity
 */
export function drawHealthBar(p, { health, y = -30, width = 44 }) {
    p.push();
    p.translate(-5, y, 0);
    p.rotateX(-0.3);

    // Background
    p.fill(40, 40, 40);
    p.box(width, 5, 1);

    // Border
    p.push();
    p.fill(100, 100, 100);
    p.translate(0, 0, -0.5);
    p.box(width + 2, 7, 0.5);
    p.pop();

    // Health fill
    const healthWidth = (health / 100) * (width - 2);
    const r = health < 50 ? 255 : p.map(health, 50, 100, 255, 0);
    const g = health > 50 ? 255 : p.map(health, 0, 50, 0, 255);
    p.fill(r, g, 0);

    p.push();
    p.translate(-((width - 2) / 2) + healthWidth / 2, 0, 0.5);
    p.box(healthWidth, 4, 1);
    p.pop();

    p.pop();
}

/**
 * Draw a neighbor NPC
 */
export function drawNeighbor(p, neighbor) {
    const { currentX, currentZ, x, z, isWalking, isDrinking, doorOpen,
            shirtColor, pantsColor, hairColor, homeX, homeZ, drinkTimer } = neighbor;

    let posX, posZ;
    if (doorOpen) {
        posX = homeX;
        posZ = homeZ - 45;  // In front of door (facing south)
    } else if (isWalking || isDrinking) {
        posX = currentX;
        posZ = currentZ;
    } else {
        posX = x;
        posZ = z;
    }

    const walkCycle = isWalking ? Math.sin(p.frameCount * ANIMATION.WALK_CYCLE) : 0;
    const legSwing = walkCycle * 0.5;

    p.push();
    p.translate(posX, 0, posZ);

    // Face south (toward street/camera) when at home, otherwise face walking direction
    if (!isWalking) {
        p.rotateY(p.PI);  // Face south toward camera
    }

    // Body
    p.fill(...shirtColor);
    p.push();
    p.translate(0, -20, 0);
    p.box(15, 25, 12);
    p.pop();

    // Pants/Legs
    p.fill(...(pantsColor || [60, 60, 80]));
    p.push();
    p.translate(-4, -5, 0);
    if (isWalking) p.rotateX(legSwing);
    p.box(6, 12, 6);
    p.pop();
    p.push();
    p.translate(4, -5, 0);
    if (isWalking) p.rotateX(-legSwing);
    p.box(6, 12, 6);
    p.pop();

    // Head
    p.push();
    p.translate(0, -40, 0);
    p.fill(255, 220, 180);
    p.sphere(8);

    // Hair
    p.fill(...hairColor);
    p.push();
    p.translate(0, -4, -1);
    p.scale(1, 0.5, 1);
    p.sphere(9);
    p.pop();
    p.pop();

    // Arms
    p.fill(255, 220, 180);
    if (isDrinking) {
        const drinkCycle = Math.sin(drinkTimer * ANIMATION.DRINK_CYCLE) * 0.3;
        // Left arm normal
        p.push();
        p.translate(-10, -25, 0);
        p.rotateZ(0.3);
        p.box(4, 12, 4);
        p.pop();
        // Right arm holding cup
        p.push();
        p.translate(10, -30, 5);
        p.rotateZ(-1.2 + drinkCycle);
        p.rotateX(-0.5);
        p.box(4, 12, 4);
        // Cup
        p.fill(255, 255, 200);
        p.translate(0, -8, 0);
        p.cylinder(3, 6);
        // Lemonade
        p.fill(255, 255, 100);
        p.translate(0, 1, 0);
        p.cylinder(2.5, 4);
        p.pop();
    } else {
        // Normal arms
        const armSwing = isWalking ? Math.sin(p.frameCount * ANIMATION.ARM_SWING + p.PI) * 0.3 : 0;
        p.push();
        p.translate(-10, -22, 0);
        p.rotateZ(0.2);
        if (isWalking) p.rotateX(armSwing);
        p.box(4, 12, 4);
        p.pop();
        p.push();
        p.translate(10, -22, 0);
        p.rotateZ(-0.2);
        if (isWalking) p.rotateX(-armSwing);
        p.box(4, 12, 4);
        p.pop();
    }

    p.pop();
}

/**
 * Draw Niam (neighborhood friend)
 */
export function drawNiam(p, { x, z, isApproaching, noahX, noahZ }) {
    p.push();
    p.translate(x, 0, z);

    // Face toward Noah
    const angleToNoah = Math.atan2(noahX - x, noahZ - z);
    p.rotateY(angleToNoah);

    const walkCycle = isApproaching ? p.frameCount * ANIMATION.WALK_CYCLE : 0;
    const legSwing = isApproaching ? Math.sin(walkCycle) * 0.5 : 0;
    const armSwing = isApproaching ? Math.sin(walkCycle + p.PI) * 0.3 : 0;

    // Body (green shirt)
    p.fill(50, 180, 80);
    p.push();
    p.translate(0, -18, 0);
    p.box(12, 20, 10);
    p.pop();

    // Pants (khaki shorts)
    p.fill(180, 160, 120);
    p.push();
    p.translate(-3, -5, 0);
    p.rotateX(legSwing);
    p.box(5, 10, 5);
    p.pop();
    p.push();
    p.translate(3, -5, 0);
    p.rotateX(-legSwing);
    p.box(5, 10, 5);
    p.pop();

    // Head - brown skin
    p.push();
    p.translate(0, -33, 0);
    p.fill(139, 90, 60);
    p.sphere(7);

    // Hair (short black curly)
    p.fill(30, 25, 20);
    p.push();
    p.translate(0, -3, 0);
    p.scale(1.1, 0.6, 1);
    p.sphere(7);
    p.pop();

    // Smile
    p.push();
    p.translate(0, 2, 6);
    p.fill(80, 40, 30);
    p.ellipse(0, 0, 3, 1.5);
    p.pop();
    p.pop();

    // Arms - brown skin
    p.fill(139, 90, 60);
    p.push();
    p.translate(-8, -20, 0);
    p.rotateZ(0.3 + armSwing);
    p.box(3, 10, 3);
    p.pop();
    p.push();
    p.translate(8, -20, 0);
    p.rotateZ(-0.3 - armSwing);
    p.box(3, 10, 3);
    p.pop();

    p.pop();
}

/**
 * Draw Dad character
 */
export function drawDad(p, { x, z, isAnimating = true }) {
    p.push();
    p.translate(x, -25, z);

    // Animation
    if (isAnimating && p.frameCount % 20 < 10) {
        p.translate(0, -2, 0);
    }

    // Body
    p.fill(50, 50, 200);
    p.box(20, 50, 20);

    // Head
    p.translate(0, -30, 0);
    p.fill(255, 200, 150);
    p.sphere(10);

    // Speech bubble
    p.translate(0, -30, 0);
    p.rotateY(p.PI);
    p.fill(255);
    p.textSize(12);
    p.textAlign(p.CENTER);
    if (p.frameCount % 120 < 60) {
        p.text("Almost fixed!", 0, 0);
    }

    p.pop();
}

/**
 * Draw an alien
 */
export function drawAlien(p, alien) {
    const { x, z, walkOffset = 0 } = alien;

    p.push();
    p.translate(x, 0, z);

    // Face toward center
    const angleToCenter = Math.atan2(-x, -z);
    p.rotateY(angleToCenter);

    const walkCycle = p.frameCount * 0.15 + walkOffset;
    const bounce = Math.abs(Math.sin(walkCycle)) * 4;
    p.translate(0, -bounce, 0);
    p.rotateZ(Math.sin(walkCycle) * 0.08);

    const legSwing = Math.sin(walkCycle) * 0.5;
    const armSwing = Math.sin(walkCycle + p.PI) * 0.4;

    // Legs
    drawAlienLegs(p, legSwing);

    // Body
    p.push();
    p.translate(0, -12, 0);
    p.fill(0, 220, 0);
    p.scale(1, 1.1, 0.8);
    p.sphere(8);
    p.pop();

    // Arms
    drawAlienArms(p, armSwing);

    // Head
    drawAlienHead(p);

    p.pop();
}

function drawAlienLegs(p, legSwing) {
    // Left leg
    p.push();
    p.translate(-5, -3, 0);
    p.rotateX(legSwing);
    p.fill(0, 180, 0);
    p.push();
    p.translate(0, 6, 0);
    p.box(4, 12, 4);
    p.translate(0, 9, 0);
    p.rotateX(-Math.abs(legSwing) * 0.4);
    p.fill(0, 160, 0);
    p.box(3, 10, 3);
    p.translate(0, 7, 2);
    p.fill(0, 140, 0);
    p.box(4, 2, 7);
    p.pop();
    p.pop();

    // Right leg
    p.push();
    p.translate(5, -3, 0);
    p.rotateX(-legSwing);
    p.fill(0, 180, 0);
    p.push();
    p.translate(0, 6, 0);
    p.box(4, 12, 4);
    p.translate(0, 9, 0);
    p.rotateX(-Math.abs(-legSwing) * 0.4);
    p.fill(0, 160, 0);
    p.box(3, 10, 3);
    p.translate(0, 7, 2);
    p.fill(0, 140, 0);
    p.box(4, 2, 7);
    p.pop();
    p.pop();
}

function drawAlienArms(p, armSwing) {
    // Left arm
    p.push();
    p.translate(-10, -14, 0);
    p.rotateX(armSwing);
    p.rotateZ(0.2);
    p.fill(0, 180, 0);
    p.box(3, 12, 3);
    p.translate(0, 8, 0);
    p.fill(0, 140, 0);
    p.sphere(2.5);
    // Fingers
    for (let f = -1; f <= 1; f++) {
        p.push();
        p.rotateZ(f * 0.3);
        p.translate(0, 3, 0);
        p.box(1, 4, 1);
        p.pop();
    }
    p.pop();

    // Right arm
    p.push();
    p.translate(10, -14, 0);
    p.rotateX(-armSwing);
    p.rotateZ(-0.2);
    p.fill(0, 180, 0);
    p.box(3, 12, 3);
    p.translate(0, 8, 0);
    p.fill(0, 140, 0);
    p.sphere(2.5);
    for (let f = -1; f <= 1; f++) {
        p.push();
        p.rotateZ(f * 0.3);
        p.translate(0, 3, 0);
        p.box(1, 4, 1);
        p.pop();
    }
    p.pop();
}

function drawAlienHead(p) {
    p.push();
    p.translate(0, -32, 0);

    // Neck
    p.push();
    p.translate(0, 8, 0);
    p.fill(0, 180, 0);
    p.cylinder(2.5, 6);
    p.pop();

    // Main head
    p.fill(0, 255, 0);
    p.push();
    p.scale(1.2, 1, 1);
    p.sphere(14);
    p.pop();

    // Forehead bulge
    p.push();
    p.translate(0, -5, 2);
    p.fill(0, 240, 0);
    p.scale(1, 0.6, 0.7);
    p.sphere(12);
    p.pop();

    // Eyes
    p.push();
    p.translate(0, 2, 10);
    // Left eye
    p.push();
    p.translate(-5, 0, 0);
    p.fill(200, 255, 200);
    p.scale(1.2, 1.4, 0.6);
    p.sphere(4);
    p.pop();
    p.push();
    p.translate(-5, 0, 4);
    p.fill(0, 0, 0);
    p.sphere(2);
    p.translate(0.5, -0.5, 1);
    p.fill(255);
    p.sphere(0.7);
    p.pop();
    // Right eye
    p.push();
    p.translate(5, 0, 0);
    p.fill(200, 255, 200);
    p.scale(1.2, 1.4, 0.6);
    p.sphere(4);
    p.pop();
    p.push();
    p.translate(5, 0, 4);
    p.fill(0, 0, 0);
    p.sphere(2);
    p.translate(-0.5, -0.5, 1);
    p.fill(255);
    p.sphere(0.7);
    p.pop();
    p.pop();

    // Mouth
    p.push();
    p.translate(0, 8, 12);
    p.fill(0, 100, 0);
    p.scale(1.5, 0.4, 0.3);
    p.sphere(4);
    p.pop();

    // Antennas
    for (let side = -1; side <= 1; side += 2) {
        p.push();
        p.translate(side * 6, -12, 0);
        p.rotateZ(side * 0.3);
        p.rotateX(-0.2);
        p.fill(0, 160, 0);
        p.cylinder(1, 12);
        p.translate(0, -7, 0);
        p.fill(255, 50, 255);
        p.sphere(2.5);
        p.fill(255, 100, 255, 100);
        p.sphere(4);
        p.pop();
    }

    p.pop();
}
