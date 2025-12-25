/**
 * Mission 2: Moon Base (Space Flight)
 * Dad flies the rocket while Noah repairs damage and comforts Hannah & James
 */

import { COLORS } from '../core/constants.js';

// Mission 2 Constants
const M2 = {
    SHIP_HEALTH: 100,
    JOURNEY_DURATION: 3600, // frames to reach moon (~60 seconds at 60fps)
    IMPACT_INTERVAL_MIN: 120, // min frames between impacts
    IMPACT_INTERVAL_MAX: 300, // max frames between impacts
    REPAIR_SPEED: 2,
    COMFORT_SPEED: 1.5,
    STRESS_INCREASE: 25,
    STRESS_DECAY: 0.05,
    DAMAGE_PER_HIT: 15,
    DAMAGE_DECAY: 0.02, // ship slowly loses health if not repaired
    NOAH_SPEED: 4,
    INTERACT_DISTANCE: 50,
};

// Mission 2 State
export const mission2State = {
    shipHealth: M2.SHIP_HEALTH,
    journeyProgress: 0,
    hannahStress: 0,
    jamesStress: 0,
    nextImpactFrame: 0,
    damagePoints: [],
    noah: { x: 0, z: 50, angle: 0 },
    isRepairing: false,
    isComforting: null, // 'hannah' or 'james' or null
    screenShake: 0,
    impactFlash: 0,
};

// Character positions in the ship
const POSITIONS = {
    dad: { x: 0, z: -120 },      // Piloting at front
    hannah: { x: -80, z: 20 },   // Left side seat
    james: { x: 80, z: 20 },     // Right side (in carrier)
    noah: { x: 0, z: 50 },       // Starting position
};

/**
 * Initialize Mission 2
 */
export function initMission2(p) {
    mission2State.shipHealth = M2.SHIP_HEALTH;
    mission2State.journeyProgress = 0;
    mission2State.hannahStress = 0;
    mission2State.jamesStress = 0;
    mission2State.nextImpactFrame = p.frameCount + p.random(M2.IMPACT_INTERVAL_MIN, M2.IMPACT_INTERVAL_MAX);
    mission2State.damagePoints = [];
    mission2State.noah = { x: 0, z: 50, angle: 0 };
    mission2State.isRepairing = false;
    mission2State.isComforting = null;
    mission2State.screenShake = 0;
    mission2State.impactFlash = 0;
}

/**
 * Reset Mission 2 state
 */
export function resetMission2State() {
    mission2State.shipHealth = M2.SHIP_HEALTH;
    mission2State.journeyProgress = 0;
    mission2State.hannahStress = 0;
    mission2State.jamesStress = 0;
    mission2State.damagePoints = [];
    mission2State.noah = { x: 0, z: 50, angle: 0 };
    mission2State.isRepairing = false;
    mission2State.isComforting = null;
    mission2State.screenShake = 0;
    mission2State.impactFlash = 0;
}

/**
 * Main Mission 2 update
 */
export function updateMission2(p) {
    const m2 = mission2State;

    // Progress journey
    m2.journeyProgress += 1;
    if (m2.journeyProgress >= M2.JOURNEY_DURATION) {
        return 'won';
    }

    // Check for impacts
    if (p.frameCount >= m2.nextImpactFrame) {
        createImpact(p);
        m2.nextImpactFrame = p.frameCount + p.random(M2.IMPACT_INTERVAL_MIN, M2.IMPACT_INTERVAL_MAX);
    }

    // Handle movement
    handleM2Movement(p);

    // Handle interactions
    handleM2Interactions(p);

    // Decay stress naturally (very slow)
    m2.hannahStress = Math.max(0, m2.hannahStress - M2.STRESS_DECAY);
    m2.jamesStress = Math.max(0, m2.jamesStress - M2.STRESS_DECAY);

    // Unrepaired damage slowly hurts ship
    if (m2.damagePoints.length > 0) {
        m2.shipHealth -= M2.DAMAGE_DECAY * m2.damagePoints.length;
    }

    // Check lose conditions
    if (m2.shipHealth <= 0) {
        return 'lost_ship';
    }
    if (m2.hannahStress >= 100 || m2.jamesStress >= 100) {
        return 'lost_stress';
    }

    // Decay screen effects
    if (m2.screenShake > 0) m2.screenShake *= 0.9;
    if (m2.impactFlash > 0) m2.impactFlash -= 5;

    return null;
}

/**
 * Create an impact event
 */
function createImpact(p) {
    const m2 = mission2State;

    // Screen shake and flash
    m2.screenShake = 15;
    m2.impactFlash = 100;

    // Damage ship
    m2.shipHealth = Math.max(0, m2.shipHealth - M2.DAMAGE_PER_HIT);

    // Increase stress
    m2.hannahStress = Math.min(100, m2.hannahStress + M2.STRESS_INCREASE);
    m2.jamesStress = Math.min(100, m2.jamesStress + M2.STRESS_INCREASE + 5); // Baby gets more scared

    // Create damage point at random location on ship walls
    const side = Math.floor(p.random(4));
    let dx, dz;
    if (side === 0) { dx = -100; dz = p.random(-80, 60); }      // Left wall
    else if (side === 1) { dx = 100; dz = p.random(-80, 60); }  // Right wall
    else if (side === 2) { dx = p.random(-80, 80); dz = -100; } // Front
    else { dx = p.random(-80, 80); dz = 80; }                   // Back

    m2.damagePoints.push({
        x: dx,
        z: dz,
        severity: p.random(0.5, 1),
        sparkTimer: 0,
    });
}

/**
 * Handle Noah's movement
 */
function handleM2Movement(p) {
    const m2 = mission2State;
    const noah = m2.noah;

    // Can't move while interacting
    if (m2.isRepairing || m2.isComforting) return;

    let dx = 0, dz = 0;
    if (p.keyIsDown(87)) dz = -1; // W
    if (p.keyIsDown(83)) dz = 1;  // S
    if (p.keyIsDown(65)) dx = -1; // A
    if (p.keyIsDown(68)) dx = 1;  // D

    if (dx !== 0 || dz !== 0) {
        noah.angle = Math.atan2(dx, dz);
        noah.x += dx * M2.NOAH_SPEED;
        noah.z += dz * M2.NOAH_SPEED;

        // Constrain to ship interior
        noah.x = p.constrain(noah.x, -90, 90);
        noah.z = p.constrain(noah.z, -80, 70);
    }
}

/**
 * Handle interactions (repair and comfort)
 */
function handleM2Interactions(p) {
    const m2 = mission2State;
    const noah = m2.noah;

    // Check if near damage point
    for (let i = m2.damagePoints.length - 1; i >= 0; i--) {
        const dmg = m2.damagePoints[i];
        const dist = p.dist(noah.x, noah.z, dmg.x, dmg.z);
        if (dist < M2.INTERACT_DISTANCE && p.keyIsDown(69)) { // E key
            m2.isRepairing = true;
            dmg.severity -= M2.REPAIR_SPEED / 60;
            m2.shipHealth = Math.min(M2.SHIP_HEALTH, m2.shipHealth + M2.REPAIR_SPEED / 30);
            if (dmg.severity <= 0) {
                m2.damagePoints.splice(i, 1);
                m2.isRepairing = false;
            }
            return;
        }
    }

    // Check if near Hannah
    const hannahDist = p.dist(noah.x, noah.z, POSITIONS.hannah.x, POSITIONS.hannah.z);
    if (hannahDist < M2.INTERACT_DISTANCE && p.keyIsDown(69)) {
        m2.isComforting = 'hannah';
        m2.hannahStress = Math.max(0, m2.hannahStress - M2.COMFORT_SPEED);
        return;
    }

    // Check if near James
    const jamesDist = p.dist(noah.x, noah.z, POSITIONS.james.x, POSITIONS.james.z);
    if (jamesDist < M2.INTERACT_DISTANCE && p.keyIsDown(69)) {
        m2.isComforting = 'james';
        m2.jamesStress = Math.max(0, m2.jamesStress - M2.COMFORT_SPEED);
        return;
    }

    m2.isRepairing = false;
    m2.isComforting = null;
}

/**
 * Check what Noah can interact with
 */
export function getM2Interaction(p) {
    const m2 = mission2State;
    const noah = m2.noah;

    // Check damage points
    for (const dmg of m2.damagePoints) {
        const dist = p.dist(noah.x, noah.z, dmg.x, dmg.z);
        if (dist < M2.INTERACT_DISTANCE) {
            return { type: 'repair', data: dmg };
        }
    }

    // Check Hannah
    const hannahDist = p.dist(noah.x, noah.z, POSITIONS.hannah.x, POSITIONS.hannah.z);
    if (hannahDist < M2.INTERACT_DISTANCE) {
        return { type: 'comfort', target: 'hannah', stress: m2.hannahStress };
    }

    // Check James
    const jamesDist = p.dist(noah.x, noah.z, POSITIONS.james.x, POSITIONS.james.z);
    if (jamesDist < M2.INTERACT_DISTANCE) {
        return { type: 'comfort', target: 'james', stress: m2.jamesStress };
    }

    return null;
}

// ============ RENDERING ============

/**
 * Draw Mission 2 scene
 */
export function drawMission2(p) {
    const m2 = mission2State;

    // Space background
    p.background(5, 5, 20);

    // Apply screen shake
    const shakeX = m2.screenShake * (Math.random() - 0.5);
    const shakeY = m2.screenShake * (Math.random() - 0.5);

    // Camera inside ship looking forward
    p.camera(
        m2.noah.x * 0.3 + shakeX, -100 + shakeY, m2.noah.z + 150,
        0, -50, -50,
        0, 1, 0
    );

    // Lighting
    p.ambientLight(60);
    p.directionalLight(255, 255, 255, 0, -1, -1);

    // Red alert lighting during impacts
    if (m2.impactFlash > 0) {
        p.pointLight(255, 0, 0, 0, -80, 0);
    }

    // Draw space outside windows
    drawSpaceBackground(p);

    // Draw ship interior
    drawShipInterior(p);

    // Draw characters
    drawM2Dad(p);
    drawM2Hannah(p);
    drawM2James(p);
    drawM2Noah(p);

    // Draw damage points
    drawDamagePoints(p);

    // Impact flash overlay
    if (m2.impactFlash > 0) {
        p.push();
        p.resetMatrix();
        p.camera();
        p.ortho();
        p.fill(255, 100, 50, m2.impactFlash);
        p.noStroke();
        p.rectMode(p.CENTER);
        p.rect(0, 0, p.width * 2, p.height * 2);
        p.pop();
    }
}

/**
 * Draw space background with stars and asteroids
 */
function drawSpaceBackground(p) {
    const m2 = mission2State;

    // Stars through windows
    p.push();
    for (let i = 0; i < 100; i++) {
        const starX = (Math.sin(i * 567.8 + m2.journeyProgress * 0.001) * 500);
        const starY = -150 + (Math.cos(i * 123.4) * 100);
        const starZ = -300 - (i % 5) * 50;
        p.push();
        p.translate(starX, starY, starZ);
        p.fill(255, 255, 255, 150 + Math.sin(p.frameCount * 0.1 + i) * 100);
        p.sphere(1 + (i % 3) * 0.5);
        p.pop();
    }

    // Moon getting closer
    const moonSize = 20 + (m2.journeyProgress / M2.JOURNEY_DURATION) * 80;
    p.push();
    p.translate(0, -120, -400);
    p.fill(200, 200, 210);
    p.sphere(moonSize);
    // Moon craters
    p.fill(170, 170, 180);
    p.push();
    p.translate(-moonSize * 0.3, -moonSize * 0.2, moonSize * 0.8);
    p.sphere(moonSize * 0.15);
    p.pop();
    p.push();
    p.translate(moonSize * 0.2, moonSize * 0.3, moonSize * 0.85);
    p.sphere(moonSize * 0.1);
    p.pop();
    p.pop();

    // Passing asteroids
    for (let i = 0; i < 5; i++) {
        const asteroidPhase = (m2.journeyProgress * 0.02 + i * 100) % 400;
        if (asteroidPhase < 200) {
            p.push();
            p.translate(
                Math.sin(i * 789) * 300 - 150,
                -100 + Math.cos(i * 456) * 50,
                -200 - asteroidPhase
            );
            p.fill(100, 80, 70);
            p.rotateX(p.frameCount * 0.02 + i);
            p.rotateY(p.frameCount * 0.03 + i);
            p.box(15 + (i % 3) * 10);
            p.pop();
        }
    }
    p.pop();
}

/**
 * Draw ship interior - detailed rocket cabin
 */
function drawShipInterior(p) {
    // === FLOOR ===
    // Main floor - dark metal grating
    p.push();
    p.translate(0, 0, -20);
    p.rotateX(p.HALF_PI);
    p.fill(45, 50, 55);
    p.plane(220, 200);
    p.pop();

    // Floor grid lines (horizontal)
    for (let i = -4; i <= 4; i++) {
        p.push();
        p.translate(i * 25, -1, -20);
        p.rotateX(p.HALF_PI);
        p.fill(35, 40, 45);
        p.plane(3, 200);
        p.pop();
    }
    // Floor grid lines (vertical)
    for (let i = -4; i <= 4; i++) {
        p.push();
        p.translate(0, -1, -20 + i * 25);
        p.rotateX(p.HALF_PI);
        p.fill(35, 40, 45);
        p.plane(220, 3);
        p.pop();
    }

    // Center aisle - lighter color
    p.push();
    p.translate(0, -0.5, -20);
    p.rotateX(p.HALF_PI);
    p.fill(70, 75, 80);
    p.plane(60, 180);
    p.pop();

    // === LEFT WALL - Blue accent ===
    p.push();
    p.translate(-110, -60, -20);
    p.rotateY(p.HALF_PI);
    p.fill(50, 60, 90);
    p.plane(200, 120);
    p.pop();

    // Left wall panels
    for (let i = -2; i <= 2; i++) {
        p.push();
        p.translate(-108, -60, -20 + i * 45);
        p.rotateY(p.HALF_PI);
        p.fill(60, 75, 110);
        p.box(35, 50, 4);
        // Panel border
        p.fill(40, 50, 70);
        p.box(38, 53, 2);
        p.pop();
    }

    // Left wall - red warning stripe
    p.push();
    p.translate(-109, -15, -20);
    p.rotateY(p.HALF_PI);
    p.fill(180, 50, 50);
    p.plane(200, 8);
    p.pop();

    // === RIGHT WALL - Green accent ===
    p.push();
    p.translate(110, -60, -20);
    p.rotateY(p.HALF_PI);
    p.fill(50, 80, 60);
    p.plane(200, 120);
    p.pop();

    // Right wall panels
    for (let i = -2; i <= 2; i++) {
        p.push();
        p.translate(108, -60, -20 + i * 45);
        p.rotateY(p.HALF_PI);
        p.fill(65, 100, 75);
        p.box(35, 50, 4);
        // Panel border
        p.fill(40, 60, 45);
        p.box(38, 53, 2);
        p.pop();
    }

    // Right wall - red warning stripe
    p.push();
    p.translate(109, -15, -20);
    p.rotateY(p.HALF_PI);
    p.fill(180, 50, 50);
    p.plane(200, 8);
    p.pop();

    // === FRONT WALL - Cockpit ===
    p.push();
    p.translate(0, -60, -120);
    p.fill(40, 45, 55);
    p.plane(220, 120);
    p.pop();

    // Main viewport window
    p.push();
    p.translate(0, -70, -118);
    p.fill(15, 25, 45);
    p.box(160, 50, 3);
    // Window frame
    p.fill(80, 85, 95);
    p.push();
    p.translate(0, -28, 0);
    p.box(165, 5, 5);
    p.pop();
    p.push();
    p.translate(0, 28, 0);
    p.box(165, 5, 5);
    p.pop();
    p.push();
    p.translate(-82, 0, 0);
    p.box(5, 55, 5);
    p.pop();
    p.push();
    p.translate(82, 0, 0);
    p.box(5, 55, 5);
    p.pop();
    // Window dividers
    p.push();
    p.translate(-40, 0, 1);
    p.box(3, 50, 3);
    p.pop();
    p.push();
    p.translate(40, 0, 1);
    p.box(3, 50, 3);
    p.pop();
    p.pop();

    // === BACK WALL ===
    p.push();
    p.translate(0, -60, 80);
    p.fill(55, 50, 50);
    p.plane(220, 120);
    p.pop();

    // Back wall - airlock door
    p.push();
    p.translate(0, -55, 78);
    p.fill(70, 70, 80);
    p.box(60, 90, 4);
    // Door frame
    p.fill(100, 100, 110);
    p.push();
    p.translate(0, -48, 0);
    p.box(70, 6, 6);
    p.pop();
    p.push();
    p.translate(-33, 0, 0);
    p.box(6, 95, 6);
    p.pop();
    p.push();
    p.translate(33, 0, 0);
    p.box(6, 95, 6);
    p.pop();
    // Door handle
    p.fill(200, 180, 50);
    p.push();
    p.translate(20, -20, 4);
    p.box(8, 15, 3);
    p.pop();
    p.pop();

    // === CEILING ===
    p.push();
    p.translate(0, -120, -20);
    p.rotateX(p.HALF_PI);
    p.fill(70, 70, 80);
    p.plane(220, 200);
    p.pop();

    // Ceiling lights
    for (let i = -1; i <= 1; i++) {
        p.push();
        p.translate(0, -118, -20 + i * 60);
        p.fill(255, 255, 230);
        p.box(80, 4, 15);
        // Light glow effect
        p.fill(255, 255, 200, 100);
        p.box(85, 2, 18);
        p.pop();
    }

    // Ceiling support beams
    for (let i = -2; i <= 2; i++) {
        p.push();
        p.translate(i * 50, -115, -20);
        p.fill(60, 60, 70);
        p.box(8, 10, 200);
        p.pop();
    }

    // === CONTROL PANEL - Detailed ===
    p.push();
    p.translate(0, -25, -105);
    // Main console body
    p.fill(35, 35, 45);
    p.box(140, 50, 35);

    // Console top surface (angled)
    p.push();
    p.translate(0, -20, 10);
    p.rotateX(-0.3);
    p.fill(30, 30, 40);
    p.box(135, 5, 30);
    p.pop();

    // Left screen
    p.push();
    p.translate(-45, -15, 18);
    p.fill(20, 80, 120);
    p.box(35, 25, 2);
    // Screen content - navigation
    p.fill(40, 150, 200);
    p.translate(0, 0, 2);
    p.box(30, 20, 1);
    p.pop();

    // Center screen - main display
    p.push();
    p.translate(0, -15, 18);
    p.fill(30, 100, 50);
    p.box(40, 25, 2);
    // Screen content
    p.fill(50, 180, 80);
    p.translate(0, 0, 2);
    p.box(35, 20, 1);
    p.pop();

    // Right screen
    p.push();
    p.translate(45, -15, 18);
    p.fill(120, 80, 20);
    p.box(35, 25, 2);
    // Screen content
    p.fill(200, 150, 40);
    p.translate(0, 0, 2);
    p.box(30, 20, 1);
    p.pop();

    // Buttons and switches
    for (let i = -3; i <= 3; i++) {
        p.push();
        p.translate(i * 18, 5, 18);
        p.fill(i % 2 === 0 ? [200, 50, 50] : [50, 200, 50]);
        p.box(8, 8, 4);
        p.pop();
    }

    // Joystick/control yoke
    p.push();
    p.translate(0, 10, 5);
    p.fill(60, 60, 60);
    p.cylinder(5, 25);
    p.translate(0, -15, 0);
    p.fill(50, 50, 50);
    p.box(30, 8, 8);
    p.pop();

    p.pop();

    // === PILOT SEAT ===
    p.push();
    p.translate(0, -15, -75);
    // Seat base
    p.fill(80, 40, 40);
    p.box(35, 30, 30);
    // Seat back
    p.push();
    p.translate(0, -30, -12);
    p.fill(90, 45, 45);
    p.box(35, 40, 8);
    p.pop();
    // Headrest
    p.push();
    p.translate(0, -55, -12);
    p.fill(100, 50, 50);
    p.box(25, 15, 8);
    p.pop();
    // Armrests
    p.fill(70, 35, 35);
    p.push();
    p.translate(-20, -15, -5);
    p.box(8, 10, 25);
    p.pop();
    p.push();
    p.translate(20, -15, -5);
    p.box(8, 10, 25);
    p.pop();
    p.pop();

    // === PASSENGER SEATS ===
    for (const side of [-1, 1]) {
        p.push();
        p.translate(side * 75, -12, 20);
        // Seat base
        p.fill(60, 70, 100);
        p.box(40, 25, 35);
        // Seat back
        p.push();
        p.translate(0, -25, -15);
        p.fill(70, 80, 110);
        p.box(40, 35, 8);
        p.pop();
        // Safety harness
        p.fill(180, 150, 50);
        p.push();
        p.translate(side * -10, -20, 0);
        p.rotateZ(side * 0.3);
        p.box(5, 40, 3);
        p.pop();
        p.push();
        p.translate(side * 10, -20, 0);
        p.rotateZ(side * -0.3);
        p.box(5, 40, 3);
        p.pop();
        p.pop();
    }

    // === SIDE LOCKERS/STORAGE ===
    // Left side storage
    p.push();
    p.translate(-100, -50, -70);
    p.fill(70, 75, 100);
    p.box(15, 60, 40);
    // Locker door lines
    p.fill(50, 55, 75);
    p.push();
    p.translate(8, 0, 0);
    p.box(1, 55, 38);
    p.pop();
    p.pop();

    // Right side storage
    p.push();
    p.translate(100, -50, -70);
    p.fill(75, 100, 80);
    p.box(15, 60, 40);
    p.fill(55, 75, 60);
    p.push();
    p.translate(-8, 0, 0);
    p.box(1, 55, 38);
    p.pop();
    p.pop();

    // === PIPES AND DETAILS ===
    // Overhead pipes
    p.fill(120, 120, 130);
    p.push();
    p.translate(-90, -110, -20);
    p.rotateX(p.HALF_PI);
    p.cylinder(4, 180);
    p.pop();
    p.push();
    p.translate(90, -110, -20);
    p.rotateX(p.HALF_PI);
    p.cylinder(4, 180);
    p.pop();

    // Corner structural supports
    const corners = [[-105, -115], [105, -115], [-105, 75], [105, 75]];
    for (const [cx, cz] of corners) {
        p.push();
        p.translate(cx, -60, cz);
        p.fill(90, 90, 100);
        p.box(10, 120, 10);
        p.pop();
    }
}

/**
 * Draw Dad piloting
 */
function drawM2Dad(p) {
    p.push();
    p.translate(POSITIONS.dad.x, 0, POSITIONS.dad.z);
    p.rotateY(p.PI); // Facing forward

    // Legs (sitting)
    p.fill(50, 50, 100);
    p.push();
    p.translate(-6, -15, 10);
    p.rotateX(-1.2);
    p.box(6, 20, 6);
    p.pop();
    p.push();
    p.translate(6, -15, 10);
    p.rotateX(-1.2);
    p.box(6, 20, 6);
    p.pop();

    // Body
    p.fill(100, 60, 40);
    p.push();
    p.translate(0, -45, 0);
    p.box(22, 30, 14);
    p.pop();

    // Arms reaching to controls
    p.fill(255, 200, 160);
    p.push();
    p.translate(-14, -45, 10);
    p.rotateX(-0.8);
    p.box(5, 20, 5);
    p.pop();
    p.push();
    p.translate(14, -45, 10);
    p.rotateX(-0.8);
    p.box(5, 20, 5);
    p.pop();

    // Head
    p.push();
    p.translate(0, -68, 0);
    p.fill(255, 200, 160);
    p.sphere(10);
    // Hair
    p.fill(60, 40, 20);
    p.translate(0, -6, -2);
    p.scale(1, 0.6, 1);
    p.sphere(10);
    p.pop();

    p.pop();
}

/**
 * Draw Hannah (stressed based on state)
 */
function drawM2Hannah(p) {
    const m2 = mission2State;
    const stress = m2.hannahStress;
    const shiver = stress > 50 ? Math.sin(p.frameCount * 0.3) * (stress / 100) * 3 : 0;

    p.push();
    p.translate(POSITIONS.hannah.x + shiver, 0, POSITIONS.hannah.z);

    // Sitting legs
    p.fill(255, 180, 200);
    p.push();
    p.translate(-5, -12, 8);
    p.rotateX(-1.3);
    p.box(5, 14, 5);
    p.pop();
    p.push();
    p.translate(5, -12, 8);
    p.rotateX(-1.3);
    p.box(5, 14, 5);
    p.pop();

    // Body
    p.fill(255, 100, 150);
    p.push();
    p.translate(0, -35, 0);
    p.box(16, 24, 12);
    p.pop();

    // Arms (hugging self if stressed)
    p.fill(255, 220, 180);
    const armAngle = stress > 30 ? 0.8 : 0.2;
    p.push();
    p.translate(-10, -35, 5);
    p.rotateZ(armAngle);
    p.rotateX(-0.3);
    p.box(4, 16, 4);
    p.pop();
    p.push();
    p.translate(10, -35, 5);
    p.rotateZ(-armAngle);
    p.rotateX(-0.3);
    p.box(4, 16, 4);
    p.pop();

    // Head
    p.push();
    p.translate(0, -52, 0);
    p.fill(255, 220, 180);
    p.sphere(9);

    // Eyes - wider if stressed
    const eyeSize = 1.2 + (stress / 100) * 0.8;
    p.fill(80, 50, 30);
    p.push();
    p.translate(-3, -1, 8);
    p.sphere(eyeSize);
    p.pop();
    p.push();
    p.translate(3, -1, 8);
    p.sphere(eyeSize);
    p.pop();

    // Mouth - frown if stressed
    if (stress > 30) {
        p.push();
        p.translate(0, 3, 8);
        p.fill(200, 100, 100);
        p.scale(1, 0.3, 0.3);
        p.sphere(2);
        p.pop();
    } else {
        p.push();
        p.translate(0, 2, 8);
        p.fill(200, 100, 100);
        p.scale(1, 0.5, 0.3);
        p.sphere(2);
        p.pop();
    }

    // Hair
    p.fill(139, 69, 19);
    p.push();
    p.translate(0, -5, -2);
    p.scale(1.1, 0.8, 1);
    p.sphere(10);
    p.pop();
    // Pigtails
    p.push();
    p.translate(-8, 0, -2);
    p.scale(0.5, 1.2, 0.5);
    p.sphere(7);
    p.pop();
    p.push();
    p.translate(8, 0, -2);
    p.scale(0.5, 1.2, 0.5);
    p.sphere(7);
    p.pop();
    p.pop();

    // Stress indicator
    if (stress > 20) {
        p.push();
        p.translate(0, -70, 0);
        p.fill(255, 200, 0, 150);
        for (let i = 0; i < Math.floor(stress / 25); i++) {
            p.push();
            p.translate(Math.sin(p.frameCount * 0.2 + i) * 5, -i * 8, 0);
            p.text("!", 0, 0);
            p.pop();
        }
        p.pop();
    }

    p.pop();
}

/**
 * Draw baby James in carrier
 */
function drawM2James(p) {
    const m2 = mission2State;
    const stress = m2.jamesStress;
    const wiggle = stress > 40 ? Math.sin(p.frameCount * 0.4) * (stress / 100) * 4 : 0;

    p.push();
    p.translate(POSITIONS.james.x, 0, POSITIONS.james.z);

    // Baby carrier
    p.fill(100, 150, 200);
    p.push();
    p.translate(0, -15, 0);
    p.box(30, 25, 25);
    p.pop();
    // Carrier rim
    p.fill(80, 120, 170);
    p.push();
    p.translate(0, -30, 0);
    p.box(32, 5, 27);
    p.pop();

    // Baby James
    p.push();
    p.translate(wiggle, -25, 5);

    // Blanket/body
    p.fill(135, 206, 250);
    p.push();
    p.scale(1.2, 0.8, 1);
    p.sphere(10);
    p.pop();

    // Head
    p.push();
    p.translate(0, -8, 5);
    p.fill(255, 220, 180);
    p.sphere(7);

    // Eyes - crying if stressed
    if (stress > 50) {
        // Crying eyes (closed, tears)
        p.fill(80, 50, 30);
        p.push();
        p.translate(-2, 0, 6);
        p.scale(1, 0.3, 0.5);
        p.sphere(1);
        p.pop();
        p.push();
        p.translate(2, 0, 6);
        p.scale(1, 0.3, 0.5);
        p.sphere(1);
        p.pop();
        // Tears
        p.fill(100, 150, 255, 200);
        p.push();
        p.translate(-2, 2, 6);
        p.sphere(0.8);
        p.pop();
        p.push();
        p.translate(2, 2, 6);
        p.sphere(0.8);
        p.pop();
        // Open mouth crying
        p.fill(200, 80, 80);
        p.push();
        p.translate(0, 3, 6);
        p.sphere(2);
        p.pop();
    } else {
        // Normal eyes
        p.fill(80, 50, 30);
        p.push();
        p.translate(-2, 0, 6);
        p.sphere(0.8);
        p.pop();
        p.push();
        p.translate(2, 0, 6);
        p.sphere(0.8);
        p.pop();
    }

    // Baby hair tuft
    p.fill(200, 180, 100);
    p.push();
    p.translate(0, -6, 0);
    p.scale(1, 0.4, 1);
    p.sphere(4);
    p.pop();
    p.pop();

    p.pop();

    p.pop();
}

/**
 * Draw Noah (player)
 */
function drawM2Noah(p) {
    const m2 = mission2State;
    const noah = m2.noah;

    p.push();
    p.translate(noah.x, 0, noah.z);
    p.rotateY(noah.angle);

    // Legs
    const legSwing = Math.sin(p.frameCount * 0.15) * 0.3;
    p.fill(50, 50, 150);
    p.push();
    p.translate(-4, -8, 0);
    p.rotateX(legSwing);
    p.box(5, 16, 5);
    p.pop();
    p.push();
    p.translate(4, -8, 0);
    p.rotateX(-legSwing);
    p.box(5, 16, 5);
    p.pop();

    // Body
    p.fill(0, 100, 255);
    p.push();
    p.translate(0, -25, 0);
    p.box(14, 22, 10);
    p.pop();

    // Arms
    p.fill(255, 220, 180);
    if (m2.isRepairing) {
        // Arms forward for repairing
        p.push();
        p.translate(-8, -28, 8);
        p.rotateX(-0.8);
        p.box(4, 14, 4);
        p.pop();
        p.push();
        p.translate(8, -28, 8);
        p.rotateX(-0.8);
        p.box(4, 14, 4);
        p.pop();
        // Tool
        p.fill(200, 200, 50);
        p.push();
        p.translate(0, -30, 18);
        p.box(8, 3, 3);
        p.pop();
    } else if (m2.isComforting) {
        // Arms out for hugging
        p.push();
        p.translate(-10, -26, 5);
        p.rotateZ(0.5);
        p.rotateX(-0.3);
        p.box(4, 14, 4);
        p.pop();
        p.push();
        p.translate(10, -26, 5);
        p.rotateZ(-0.5);
        p.rotateX(-0.3);
        p.box(4, 14, 4);
        p.pop();
    } else {
        // Normal arms
        const armSwing = Math.sin(p.frameCount * 0.15 + p.PI) * 0.4;
        p.push();
        p.translate(-10, -26, 0);
        p.rotateX(armSwing);
        p.box(4, 14, 4);
        p.pop();
        p.push();
        p.translate(10, -26, 0);
        p.rotateX(-armSwing);
        p.box(4, 14, 4);
        p.pop();
    }

    // Head
    p.push();
    p.translate(0, -42, 0);
    p.fill(255, 220, 180);
    p.sphere(8);

    // Eyes
    p.fill(80, 50, 30);
    p.push();
    p.translate(-2.5, -1, 7);
    p.sphere(1);
    p.pop();
    p.push();
    p.translate(2.5, -1, 7);
    p.sphere(1);
    p.pop();

    // Smile
    p.push();
    p.translate(0, 2, 7);
    p.fill(200, 100, 100);
    p.scale(1, 0.5, 0.3);
    p.sphere(2);
    p.pop();

    // Hair
    p.fill(255, 220, 100);
    p.push();
    p.translate(0, -5, 0);
    p.box(17, 6, 15);
    p.pop();
    p.pop();

    p.pop();
}

/**
 * Draw damage points with sparks
 */
function drawDamagePoints(p) {
    const m2 = mission2State;

    for (const dmg of m2.damagePoints) {
        p.push();
        p.translate(dmg.x, -50, dmg.z);

        // Damage hole
        p.fill(20, 20, 30);
        p.sphere(8 * dmg.severity);

        // Sparks
        p.fill(255, 200, 50);
        for (let i = 0; i < 3; i++) {
            if (Math.random() > 0.5) {
                p.push();
                p.translate(
                    Math.sin(p.frameCount * 0.5 + i * 2) * 10,
                    Math.cos(p.frameCount * 0.7 + i * 3) * 10,
                    Math.sin(p.frameCount * 0.3 + i) * 5
                );
                p.fill(255, 200 + Math.random() * 55, 0);
                p.sphere(2);
                p.pop();
            }
        }

        // Smoke
        p.fill(100, 100, 100, 100);
        p.push();
        p.translate(0, -15 - Math.sin(p.frameCount * 0.1) * 5, 0);
        p.sphere(5 * dmg.severity);
        p.pop();

        p.pop();
    }
}

// ============ CUTSCENE ============

/**
 * Draw Mission 2 cutscene
 */
export function drawM2Cutscene(p) {
    p.background(5, 5, 20);

    const camTime = p.frameCount * 0.005;
    p.camera(Math.sin(camTime) * 50 + 100, -80, 200, 0, -50, 0, 0, 1, 0);
    p.ambientLight(80);
    p.directionalLight(255, 255, 255, -0.5, 1, -0.5);

    // Stars
    for (let i = 0; i < 80; i++) {
        p.push();
        p.translate(
            Math.sin(i * 123.4) * 300,
            -100 + Math.cos(i * 567.8) * 100,
            -200 + Math.sin(i * 891.2) * 100
        );
        p.fill(255, 255, 255, 150 + Math.sin(p.frameCount * 0.1 + i) * 100);
        p.sphere(1 + (i % 3) * 0.5);
        p.pop();
    }

    // Earth in background
    p.push();
    p.translate(-150, -50, -300);
    p.fill(50, 100, 200);
    p.sphere(80);
    p.fill(50, 150, 50, 200);
    p.push();
    p.translate(20, -20, 70);
    p.sphere(30);
    p.pop();
    p.fill(255, 255, 255, 150);
    p.push();
    p.translate(-30, -40, 60);
    p.sphere(25);
    p.pop();
    p.pop();

    // The rocket flying
    p.push();
    const rocketBob = Math.sin(p.frameCount * 0.05) * 3;
    p.translate(0, -50 + rocketBob, 0);
    p.rotateZ(0.1);
    p.rotateX(-0.2);

    // Main body - WHITE with color
    p.fill(240, 240, 245);
    p.push();
    p.cylinder(25, 120);
    p.pop();

    // Red stripes
    p.fill(200, 30, 30);
    p.push();
    p.translate(0, -40, 0);
    p.cylinder(26, 8);
    p.pop();
    p.push();
    p.translate(0, 20, 0);
    p.cylinder(26, 8);
    p.pop();

    // Nose cone - RED
    p.push();
    p.translate(0, -70, 0);
    p.fill(200, 30, 30);
    p.cone(25, 40);
    p.pop();

    // Window - BLUE
    p.push();
    p.translate(0, -30, 26);
    p.fill(50, 150, 255);
    p.sphere(10);
    p.fill(80);
    p.torus(10, 1.5);
    p.pop();

    // Engine
    p.push();
    p.translate(0, 65, 0);
    p.fill(60);
    p.cylinder(28, 15);
    // Flame
    p.fill(255, 150, 50, 200);
    p.translate(0, 20, 0);
    p.cone(20, 40);
    p.fill(255, 255, 100, 200);
    p.translate(0, 10, 0);
    p.cone(12, 25);
    p.pop();

    // Fins - RED
    for (let i = 0; i < 4; i++) {
        p.push();
        p.rotateY(i * p.HALF_PI + p.QUARTER_PI);
        p.translate(25, 50, 0);
        p.rotateZ(-0.3);
        p.fill(200, 30, 30);
        p.box(4, 45, 22);
        p.pop();
    }

    p.pop();

    // Moon ahead
    p.push();
    p.translate(100, -80, -250);
    p.fill(200, 200, 210);
    p.sphere(60);
    p.fill(170, 170, 180);
    p.push();
    p.translate(-15, -10, 50);
    p.sphere(10);
    p.pop();
    p.push();
    p.translate(20, 15, 55);
    p.sphere(8);
    p.pop();
    p.pop();
}
