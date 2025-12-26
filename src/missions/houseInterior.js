/**
 * House Interior - 3D Point-and-Click Scene
 * Renders the inside of Noah's house where players can click on objects
 * Uses color picking for pixel-perfect click detection
 */

import { mission1State, noah, isNightTime, isGettingDark, isComputerBuilt, getCryptoPortfolioValue, allComputerPartsOwned, getOwnedPartsCount, buildComputer } from '../core/state.js';
import { UI_ELEMENTS } from '../core/constants.js';

// ============================================================================
// COLOR PICKING SYSTEM
// ============================================================================

// Off-screen buffer for color picking
let pickingBuffer = null;

// Color-to-object mapping (unique colors for each clickable object)
const PICK_COLORS = {
    bed: [255, 0, 0],           // Red
    computer: [0, 255, 0],      // Green
    door: [0, 0, 255],          // Blue
};

// Reverse mapping: color string -> object name
const COLOR_TO_OBJECT = {};
for (const [name, color] of Object.entries(PICK_COLORS)) {
    COLOR_TO_OBJECT[`${color[0]},${color[1]},${color[2]}`] = name;
}

// ============================================================================
// HOUSE INTERIOR FUNCTIONS
// ============================================================================

/**
 * Enter the house interior
 */
export function enterHouseInterior() {
    const m1 = mission1State;
    // Store Noah's position to restore when exiting
    m1.house.exitPosition = { x: noah.x, z: noah.z };
    m1.house.isInside = true;
    m1.house.hoveredObject = null;

    // Hide any tooltips/prompts
    const tooltip = document.getElementById(UI_ELEMENTS.M1_TOOLTIP);
    if (tooltip) tooltip.classList.remove('show');
}

/**
 * Exit the house interior
 */
export function exitHouseInterior() {
    const m1 = mission1State;
    m1.house.isInside = false;
    m1.house.hoveredObject = null;

    // Close computer screen if open
    const computerScreen = document.getElementById('computer-screen-overlay');
    if (computerScreen) computerScreen.classList.remove('show');

    // Reset cursor
    document.body.style.cursor = 'default';

    // Clean up picking buffer to free memory
    if (pickingBuffer) {
        pickingBuffer.remove();
        pickingBuffer = null;
    }
}

/**
 * Draw the house interior scene (point-and-click style)
 */
export function drawHouseInterior(p) {
    const m1 = mission1State;

    // Clear background - soft bedroom colors
    p.background(60, 70, 90);

    // Fixed camera looking at the interior from the front
    p.camera(0, -100, 280, 0, -50, 0, 0, 1, 0);

    // Warm bedroom lighting
    p.ambientLight(120, 110, 100);
    p.directionalLight(200, 190, 170, 0.3, 0.5, -0.5);  // Soft key light
    p.directionalLight(100, 110, 130, -0.3, -0.3, 0.5); // Cool fill

    // Window light (if daytime)
    if (!isNightTime()) {
        p.pointLight(255, 250, 220, -150, -100, -100);  // Sunlight from window
    } else {
        p.pointLight(100, 100, 150, -150, -100, -100);  // Moonlight
    }

    // Draw all interior elements
    drawHouseFloor(p);
    drawHouseWalls(p);
    drawHouseWindow(p);
    drawBed(p);

    // Draw computer or placeholder
    if (isComputerBuilt()) {
        drawComputerDesk(p);
    } else {
        drawComputerPlaceholder(p);
    }

    drawHouseBookshelf(p);
    drawPosters(p);
    drawCeilingLight(p);
    drawHouseLamp(p);
    drawExitDoor(p);

    // Draw hover highlight if applicable
    if (m1.house.hoveredObject) {
        drawHouseHoverHighlight(p, m1.house.hoveredObject);
    }

    // Update picking buffer for click detection
    updatePickingBuffer(p);
}

/**
 * Update the off-screen picking buffer
 * Renders simplified shapes with unique colors for each clickable object
 */
function updatePickingBuffer(p) {
    // Initialize buffer if needed (or resize if window changed)
    if (!pickingBuffer || pickingBuffer.width !== p.width || pickingBuffer.height !== p.height) {
        if (pickingBuffer) pickingBuffer.remove();
        pickingBuffer = p.createGraphics(p.width, p.height, p.WEBGL);
    }

    const pg = pickingBuffer;
    pg.clear();

    // Same camera as main view
    pg.camera(0, -100, 280, 0, -50, 0, 0, 1, 0);

    // No lighting - we want flat colors
    pg.noLights();
    pg.noStroke();

    // Draw clickable objects with their pick colors

    // Bed (bunk bed with slide at left side)
    pg.push();
    pg.translate(-100, -50, -80);
    pg.fill(PICK_COLORS.bed[0], PICK_COLORS.bed[1], PICK_COLORS.bed[2]);
    pg.box(120, 110, 70);  // Large box covering the whole bunk bed
    pg.pop();

    // Computer desk area (right side)
    pg.push();
    pg.translate(100, -45, -55);
    pg.fill(PICK_COLORS.computer[0], PICK_COLORS.computer[1], PICK_COLORS.computer[2]);
    pg.box(85, 80, 90);  // Box covering desk, monitor, and chair
    pg.pop();

    // Door (on right wall, near desk)
    pg.push();
    pg.translate(197, -55, -20);
    pg.rotateY(pg.HALF_PI);
    pg.fill(PICK_COLORS.door[0], PICK_COLORS.door[1], PICK_COLORS.door[2]);
    pg.box(50, 115, 15);
    pg.pop();
}

/**
 * Draw the house floor (carpet/wood)
 */
function drawHouseFloor(p) {
    p.push();
    p.rotateX(p.HALF_PI);
    p.fill(100, 110, 130);  // Blue-gray carpet
    p.plane(400, 300);

    // Carpet texture lines
    p.stroke(90, 100, 120);
    p.strokeWeight(1);
    for (let i = -180; i < 200; i += 25) {
        p.line(i, -150, i + 5, 150);
    }
    p.noStroke();
    p.pop();
}

/**
 * Draw the house walls
 */
function drawHouseWalls(p) {
    // Back wall - soft blue
    p.push();
    p.translate(0, -80, -150);
    p.fill(170, 185, 210);
    p.box(400, 160, 5);
    p.pop();

    // Left wall - same blue
    p.push();
    p.translate(-200, -80, 0);
    p.rotateY(p.HALF_PI);
    p.fill(160, 175, 200);
    p.box(300, 160, 5);
    p.pop();

    // Right wall
    p.push();
    p.translate(200, -80, 0);
    p.rotateY(p.HALF_PI);
    p.fill(160, 175, 200);
    p.box(300, 160, 5);
    p.pop();

    // Ceiling - white
    p.push();
    p.translate(0, -160, 0);
    p.rotateX(p.HALF_PI);
    p.fill(240, 240, 245);
    p.plane(400, 300);
    p.pop();

    // Baseboard trim - white
    p.fill(250, 250, 250);
    p.push();
    p.translate(0, -5, -148);
    p.box(400, 10, 2);
    p.pop();
    p.push();
    p.translate(-198, -5, 0);
    p.box(2, 10, 300);
    p.pop();
    p.push();
    p.translate(198, -5, 0);
    p.box(2, 10, 300);
    p.pop();
}

/**
 * Draw window on the left wall
 */
function drawHouseWindow(p) {
    p.push();
    p.translate(-197, -90, -50);
    p.rotateY(p.HALF_PI);

    // Window frame (white)
    p.fill(250, 250, 250);
    p.box(70, 80, 4);

    // Window glass (sky color based on time)
    if (isNightTime()) {
        p.fill(30, 40, 70);  // Night sky
    } else if (isGettingDark()) {
        p.fill(100, 80, 120);  // Sunset
    } else {
        p.fill(180, 220, 255);  // Day sky
    }
    p.push();
    p.translate(0, 0, 1);
    p.box(58, 68, 1);
    p.pop();

    // Window dividers (white)
    p.fill(250, 250, 250);
    p.push();
    p.translate(0, 0, 2);
    p.box(2, 68, 2);
    p.pop();
    p.push();
    p.translate(0, 0, 2);
    p.box(58, 2, 2);
    p.pop();

    // Curtains
    p.fill(150, 100, 100);  // Maroon curtains
    p.push();
    p.translate(-35, 0, 5);
    p.box(12, 90, 3);
    p.pop();
    p.push();
    p.translate(35, 0, 5);
    p.box(12, 90, 3);
    p.pop();

    // Light coming through (if daytime)
    if (!isNightTime()) {
        p.fill(255, 250, 200, 40);
        p.push();
        p.translate(0, 0, 10);
        p.box(80, 100, 2);
        p.pop();
    }

    p.pop();
}

/**
 * Draw the bunk bed with slide (matches sleep cutscene)
 */
function drawBed(p) {
    p.push();
    p.translate(-100, 0, -80);

    // Bed frame posts (4 corners) - wooden
    p.fill(101, 67, 33);
    const postPositions = [
        [-35, -25], [-35, 25],
        [35, -25], [35, 25]
    ];
    for (const [px, pz] of postPositions) {
        p.push();
        p.translate(px, -55, pz);
        p.box(6, 110, 6);
        p.pop();
    }

    // Bottom bunk mattress
    p.push();
    p.translate(0, -15, 0);
    // Mattress base
    p.fill(80, 60, 40);
    p.box(65, 8, 45);
    // Mattress top (white sheets)
    p.fill(240, 240, 255);
    p.translate(0, -5, 0);
    p.box(60, 6, 42);
    // Pillow
    p.fill(255, 255, 255);
    p.translate(-20, -5, 0);
    p.box(15, 8, 30);
    // Blue blanket
    p.fill(100, 150, 220);
    p.translate(15, -2, 0);
    p.box(40, 4, 38);
    p.pop();

    // Top bunk mattress (where Noah sleeps)
    p.push();
    p.translate(0, -80, 0);
    // Mattress base
    p.fill(80, 60, 40);
    p.box(65, 8, 45);
    // Mattress top (white sheets)
    p.fill(240, 240, 255);
    p.translate(0, -5, 0);
    p.box(60, 6, 42);
    // Pillow
    p.fill(255, 255, 255);
    p.translate(-20, -5, 0);
    p.box(15, 8, 30);
    // Blue blanket
    p.fill(100, 150, 220);
    p.translate(15, -2, 0);
    p.box(40, 4, 38);
    p.pop();

    // Safety rail on top bunk
    p.fill(101, 67, 33);
    p.push();
    p.translate(0, -95, 25);
    p.box(65, 4, 3);
    p.pop();

    // Ladder on left side
    p.fill(101, 67, 33);
    // Ladder rails
    p.push();
    p.translate(-40, -50, -15);
    p.box(4, 80, 4);
    p.pop();
    p.push();
    p.translate(-40, -50, 15);
    p.box(4, 80, 4);
    p.pop();
    // Ladder rungs
    for (let i = 0; i < 5; i++) {
        p.push();
        p.translate(-40, -20 - i * 18, 0);
        p.box(4, 3, 26);
        p.pop();
    }

    // SLIDE on right side! (Red, going from top bunk to floor)
    p.push();
    p.translate(55, -45, 0);

    // Slide base
    p.fill(220, 50, 50);  // Red slide
    p.rotateZ(-0.6);  // Angle the slide
    p.box(15, 90, 25);

    // Slide sides (rails)
    p.fill(180, 40, 40);
    p.push();
    p.translate(0, 0, 14);
    p.box(12, 90, 3);
    p.pop();
    p.push();
    p.translate(0, 0, -14);
    p.box(12, 90, 3);
    p.pop();

    p.pop();

    // Slide platform at top
    p.fill(220, 50, 50);
    p.push();
    p.translate(38, -85, 0);
    p.box(15, 5, 25);
    p.pop();

    p.pop();
}

/**
 * Draw the computer desk with full setup
 */
function drawComputerDesk(p) {
    p.push();
    p.translate(100, 0, -80);

    // Desk - dark wood
    p.fill(80, 55, 35);

    // Desk top
    p.push();
    p.translate(0, -35, 0);
    p.box(80, 4, 50);
    p.pop();

    // Desk legs
    p.fill(70, 45, 30);
    for (const lx of [-35, 35]) {
        p.push();
        p.translate(lx, -17, 0);
        p.box(5, 35, 45);
        p.pop();
    }

    // Monitor
    p.fill(30, 30, 35);  // Dark plastic
    p.push();
    p.translate(0, -65, -10);
    p.box(50, 35, 3);
    p.pop();

    // Monitor screen
    p.fill(40, 60, 80);  // Blue screen glow when off
    p.push();
    p.translate(0, -65, -8);
    p.box(45, 30, 1);
    p.pop();

    // Monitor stand
    p.fill(30, 30, 35);
    p.push();
    p.translate(0, -43, -10);
    p.box(8, 10, 5);
    p.pop();
    p.push();
    p.translate(0, -38, -10);
    p.box(20, 2, 12);
    p.pop();

    // Keyboard
    p.fill(40, 40, 45);
    p.push();
    p.translate(0, -38, 10);
    p.box(35, 2, 12);
    p.pop();
    // Keys
    p.fill(60, 60, 65);
    p.push();
    p.translate(0, -39, 10);
    p.box(32, 1, 9);
    p.pop();

    // Mouse
    p.fill(40, 40, 45);
    p.push();
    p.translate(25, -38, 12);
    p.box(6, 2, 10);
    p.pop();

    // Tower PC under desk
    p.fill(35, 35, 40);
    p.push();
    p.translate(30, -15, -5);
    p.box(15, 30, 35);
    p.pop();
    // PC lights
    p.fill(0, 255, 100);
    p.push();
    p.translate(38, -20, -5);
    p.sphere(2);
    p.pop();

    // Chair
    drawDeskChair(p);

    p.pop();
}

/**
 * Draw a desk chair
 */
function drawDeskChair(p) {
    p.push();
    // Move chair to the side (right) and rotated, as if pushed out of the way
    p.translate(50, 0, 45);
    p.rotateY(-0.4);  // Angled slightly

    // Seat - black mesh look
    p.fill(50, 50, 55);
    p.push();
    p.translate(0, -22, 0);
    p.box(35, 5, 35);
    p.pop();

    // Back
    p.fill(50, 50, 55);
    p.push();
    p.translate(0, -45, -15);
    p.box(35, 45, 4);
    p.pop();

    // Armrests
    p.fill(40, 40, 45);
    p.push();
    p.translate(-17, -30, 0);
    p.box(3, 5, 25);
    p.pop();
    p.push();
    p.translate(17, -30, 0);
    p.box(3, 5, 25);
    p.pop();

    // Chair base (5 wheels)
    p.fill(40, 40, 45);
    p.push();
    p.translate(0, -10, 0);
    p.cylinder(3, 20);
    p.pop();

    // Star base
    p.fill(35, 35, 40);
    for (let i = 0; i < 5; i++) {
        p.push();
        p.rotateY(i * p.TWO_PI / 5);
        p.translate(0, -5, 15);
        p.box(4, 3, 20);
        p.pop();
    }

    // Wheels
    p.fill(30, 30, 35);
    for (let i = 0; i < 5; i++) {
        p.push();
        p.rotateY(i * p.TWO_PI / 5);
        p.translate(0, -3, 22);
        p.sphere(3);
        p.pop();
    }

    p.pop();
}

/**
 * Draw the computer placeholder (when not built)
 * Shows individual purchased parts laid out on the desk
 */
function drawComputerPlaceholder(p) {
    const allPartsReady = allComputerPartsOwned();
    const parts = mission1State.computer.parts;

    p.push();
    p.translate(100, 0, -80);

    // Check if desk part is owned - if not, show empty floor area
    if (!parts.desk.owned) {
        // Draw faint outline where desk would go
        p.stroke(80, 100, 120);
        p.strokeWeight(2);
        p.noFill();
        p.push();
        p.translate(0, -20, 0);
        p.box(80, 40, 50);
        p.pop();
        p.noStroke();

        // Small "?" floating above
        p.fill(100, 120, 150, 150);
        p.push();
        p.translate(0, -50, 0);
        p.sphere(8);
        p.pop();

        p.pop();
        return;
    }

    // Desk is owned - draw it
    p.fill(80, 55, 35);

    // Desk top
    p.push();
    p.translate(0, -35, 0);
    p.box(80, 4, 50);
    p.pop();

    // Desk legs
    p.fill(70, 45, 30);
    for (const lx of [-35, 35]) {
        p.push();
        p.translate(lx, -17, 0);
        p.box(5, 35, 45);
        p.pop();
    }

    // Chair
    drawDeskChair(p);

    // Draw each owned part laid out on desk
    drawOwnedParts(p, parts, allPartsReady);

    // If all parts ready, show pulsing "build" indicator
    if (allPartsReady) {
        const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
        p.fill(0, 255, 100, 80 * pulse);
        p.push();
        p.translate(0, -85, 0);
        p.sphere(12);
        p.pop();

        // Glowing highlight effect around parts
        p.fill(0, 255, 100, 25);
        p.push();
        p.translate(0, -55, 0);
        p.box(75, 55, 50);
        p.pop();
    }

    p.pop();
}

/**
 * Draw owned computer parts laid out on the desk
 */
function drawOwnedParts(p, parts, allPartsReady) {
    // Monitor - laying flat on desk (back of desk)
    if (parts.monitor.owned) {
        p.push();
        p.translate(-15, -42, -15);
        // Monitor laying on its back
        p.fill(30, 30, 35);
        p.box(40, 6, 28);
        // Screen (dark)
        p.fill(20, 25, 35);
        p.translate(0, -4, 0);
        p.box(36, 1, 24);
        p.pop();
    }

    // Tower/Case - standing on desk
    if (parts.tower.owned) {
        p.push();
        p.translate(30, -52, -10);
        p.fill(35, 35, 40);
        p.box(14, 28, 30);
        // Front panel detail
        p.fill(25, 25, 30);
        p.translate(8, 0, 0);
        p.box(1, 24, 26);
        p.pop();
    }

    // Keyboard - on front of desk
    if (parts.keyboard.owned) {
        p.push();
        p.translate(-5, -39, 15);
        p.fill(40, 40, 45);
        p.box(32, 3, 10);
        // Keys texture
        p.fill(55, 55, 60);
        p.translate(0, -2, 0);
        p.box(30, 1, 8);
        p.pop();
    }

    // Mouse - next to keyboard
    if (parts.mouse.owned) {
        p.push();
        p.translate(20, -39, 18);
        p.fill(40, 40, 45);
        p.box(5, 2, 8);
        // Mouse button area
        p.fill(50, 50, 55);
        p.translate(0, -1.5, -2);
        p.box(4, 1, 3);
        p.pop();
    }

    // Motherboard - in anti-static bag on desk
    if (parts.motherboard.owned) {
        p.push();
        p.translate(-28, -40, 0);
        // Anti-static bag (pinkish)
        p.fill(200, 150, 170, 200);
        p.box(22, 3, 18);
        // Board visible through bag
        p.fill(40, 100, 60);
        p.translate(0, -2, 0);
        p.box(18, 1, 14);
        p.pop();
    }

    // RAM sticks - small boxes
    if (parts.ram.owned) {
        p.push();
        p.translate(-25, -44, 15);
        // RAM packaging
        p.fill(50, 120, 180);
        p.box(8, 5, 3);
        p.pop();
    }

    // GPU - in box on desk
    if (parts.gpu.owned) {
        p.push();
        p.translate(10, -45, -5);
        // GPU box
        p.fill(60, 60, 70);
        p.box(20, 8, 12);
        // Red accent (gaming GPU style)
        p.fill(180, 50, 50);
        p.translate(0, -4, 0);
        p.box(18, 1, 10);
        p.pop();
    }

    // CPU - small box
    if (parts.cpu.owned) {
        p.push();
        p.translate(-10, -42, 8);
        // CPU box
        p.fill(30, 100, 180);
        p.box(8, 6, 8);
        // Intel/AMD style top
        p.fill(200, 200, 210);
        p.translate(0, -3.5, 0);
        p.box(6, 1, 6);
        p.pop();
    }
}

/**
 * Draw bookshelf in the room
 */
function drawHouseBookshelf(p) {
    p.push();
    p.translate(170, 0, -130);

    // Shelf frame
    p.fill(90, 60, 35);

    // Back panel
    p.push();
    p.translate(0, -60, 0);
    p.box(35, 120, 5);
    p.pop();

    // Sides
    p.push();
    p.translate(-16, -60, 8);
    p.box(3, 120, 20);
    p.pop();
    p.push();
    p.translate(16, -60, 8);
    p.box(3, 120, 20);
    p.pop();

    // Shelves (4 levels)
    for (let i = 0; i < 4; i++) {
        p.push();
        p.translate(0, -10 - i * 35, 8);
        p.fill(100, 70, 40);
        p.box(32, 3, 20);
        p.pop();
    }

    // Books and items on shelves
    // Shelf 1 - books
    p.fill(180, 50, 50);
    p.push();
    p.translate(-5, -25, 8);
    p.box(6, 20, 10);
    p.pop();
    p.fill(50, 50, 180);
    p.push();
    p.translate(3, -23, 8);
    p.box(5, 18, 10);
    p.pop();

    // Shelf 2 - trophy
    p.fill(255, 200, 50);
    p.push();
    p.translate(0, -55, 8);
    p.cylinder(5, 15);
    p.pop();

    // Shelf 3 - more books
    p.fill(50, 150, 50);
    p.push();
    p.translate(-3, -93, 8);
    p.box(7, 22, 10);
    p.pop();

    p.pop();
}

/**
 * Draw posters on the wall
 */
function drawPosters(p) {
    // Space poster on back wall
    p.push();
    p.translate(100, -100, -147);

    // Frame
    p.fill(40, 40, 45);
    p.box(45, 55, 2);

    // Poster content - space theme
    p.fill(20, 20, 50);
    p.push();
    p.translate(0, 0, 1.5);
    p.box(40, 50, 1);
    p.pop();

    // Stars on poster
    p.fill(255, 255, 200);
    p.push();
    p.translate(-10, -10, 2);
    p.sphere(2);
    p.pop();
    p.push();
    p.translate(15, 5, 2);
    p.sphere(1.5);
    p.pop();
    p.push();
    p.translate(-5, 15, 2);
    p.sphere(1);
    p.pop();

    // Planet on poster
    p.fill(200, 100, 50);
    p.push();
    p.translate(5, -5, 2);
    p.sphere(8);
    p.pop();

    p.pop();

    // Rocket poster
    p.push();
    p.translate(-60, -110, -147);

    // Frame
    p.fill(40, 40, 45);
    p.box(35, 45, 2);

    // Poster background
    p.fill(50, 80, 120);
    p.push();
    p.translate(0, 0, 1.5);
    p.box(30, 40, 1);
    p.pop();

    // Simple rocket shape
    p.fill(255, 255, 255);
    p.push();
    p.translate(0, 5, 2);
    p.box(8, 20, 1);
    p.pop();
    p.fill(255, 50, 50);
    p.push();
    p.translate(0, 18, 2);
    p.cone(6, 8);
    p.pop();

    p.pop();
}

/**
 * Draw ceiling light
 */
function drawCeilingLight(p) {
    p.push();
    p.translate(0, -160, 0);

    // Light fixture base
    p.fill(200, 200, 210);
    p.push();
    p.translate(0, 5, 0);
    p.cylinder(8, 5);
    p.pop();

    // Light shade
    p.fill(255, 255, 240);
    p.push();
    p.translate(0, 20, 0);
    p.cone(25, 20);
    p.pop();

    p.pop();
}

/**
 * Draw bedside lamp
 */
function drawHouseLamp(p) {
    p.push();
    p.translate(-150, 0, -120);

    // Small nightstand
    p.fill(70, 50, 30);
    p.push();
    p.translate(0, -20, 0);
    p.box(30, 25, 25);
    p.pop();

    // Lamp base
    p.fill(60, 60, 65);
    p.push();
    p.translate(0, -35, 0);
    p.cylinder(8, 5);
    p.pop();

    // Lamp stem
    p.push();
    p.translate(0, -45, 0);
    p.cylinder(3, 15);
    p.pop();

    // Lamp shade
    p.fill(220, 180, 140);
    p.push();
    p.translate(0, -58, 0);
    p.cone(15, 18);
    p.pop();

    // Light glow (if night time, lamp is on)
    if (isNightTime() || isGettingDark()) {
        p.fill(255, 230, 150, 180);
        p.push();
        p.translate(0, -55, 0);
        p.sphere(10);
        p.pop();
        p.fill(255, 200, 100, 60);
        p.push();
        p.translate(0, -50, 0);
        p.sphere(25);
        p.pop();
    }

    p.pop();
}

/**
 * Draw the exit door
 */
function drawExitDoor(p) {
    p.push();
    // Door on right wall, about 2 feet from desk area
    p.translate(197, 0, -20);
    p.rotateY(p.HALF_PI);  // Face into the room

    // Door frame - white
    p.fill(250, 250, 250);
    p.push();
    p.translate(0, -55, 0);
    p.box(45, 110, 8);
    p.pop();

    // Door - white with panels
    p.fill(245, 245, 250);
    p.push();
    p.translate(0, -55, -4);
    p.box(38, 100, 5);
    p.pop();

    // Door panels
    p.fill(235, 235, 240);
    p.push();
    p.translate(0, -35, -7);
    p.box(30, 35, 2);
    p.pop();
    p.push();
    p.translate(0, -80, -7);
    p.box(30, 30, 2);
    p.pop();

    // Door handle - gold (on left side when facing door)
    p.fill(200, 170, 80);
    p.push();
    p.translate(-14, -55, -8);
    p.sphere(3);
    p.pop();

    p.pop();
}

/**
 * Draw hover highlight on a clickable object
 */
function drawHouseHoverHighlight(p, objectName) {
    p.push();

    switch (objectName) {
        case 'bed':
            p.translate(-100, -50, -80);
            p.fill(255, 255, 100, 30);
            p.box(125, 115, 75);  // Match picking box
            break;
        case 'computer':
            p.translate(100, -45, -55);
            p.fill(255, 255, 100, 30);
            p.box(90, 85, 95);  // Match picking box
            break;
        case 'door':
            p.translate(197, -55, -20);
            p.rotateY(p.HALF_PI);
            p.fill(255, 255, 100, 30);
            p.box(55, 120, 20);  // Match picking box
            break;
    }

    p.pop();
}

/**
 * Handle mouse click in house interior
 * Returns the action to perform
 */
export function handleHouseClick(mouseX, mouseY, canvasWidth, canvasHeight) {
    const clickedObject = getHouseObjectAtPosition(mouseX, mouseY, canvasWidth, canvasHeight);

    if (!clickedObject) return null;

    switch (clickedObject) {
        case 'bed':
            return { action: 'bed' };
        case 'computer':
            return { action: 'computer' };
        case 'door':
            return { action: 'exit' };
        default:
            return null;
    }
}

/**
 * Handle mouse hover in house interior
 */
export function handleHouseHover(mouseX, mouseY, canvasWidth, canvasHeight) {
    const m1 = mission1State;
    const hoveredObject = getHouseObjectAtPosition(mouseX, mouseY, canvasWidth, canvasHeight);
    m1.house.hoveredObject = hoveredObject;
    return hoveredObject;
}

/**
 * Get the house object at screen position
 * Uses color picking for pixel-perfect detection
 */
function getHouseObjectAtPosition(mouseX, mouseY, canvasWidth, canvasHeight) {
    if (!pickingBuffer) return null;

    // Get pixel coordinates
    const x = Math.floor(mouseX);
    const y = Math.floor(mouseY);

    // Make sure we're within bounds
    if (x < 0 || x >= pickingBuffer.width || y < 0 || y >= pickingBuffer.height) {
        return null;
    }

    // Read the pixel color at mouse position
    // WEBGL buffers have Y=0 at bottom, screen has Y=0 at top, so flip Y
    pickingBuffer.loadPixels();
    const flippedY = pickingBuffer.height - 1 - y;
    const index = (flippedY * pickingBuffer.width + x) * 4;
    const r = pickingBuffer.pixels[index];
    const g = pickingBuffer.pixels[index + 1];
    const b = pickingBuffer.pixels[index + 2];
    const a = pickingBuffer.pixels[index + 3];

    // If transparent or black background, nothing clicked
    if (a === 0 || (r === 0 && g === 0 && b === 0)) {
        return null;
    }

    // Look up the object by color
    const colorKey = `${r},${g},${b}`;
    return COLOR_TO_OBJECT[colorKey] || null;
}

// ============================================================================
// COMPUTER SCREEN FUNCTIONS
// ============================================================================

/**
 * Open the computer screen overlay
 */
export function openComputerScreen() {
    const screen = document.getElementById('computer-screen-overlay');
    if (screen) {
        screen.classList.add('show');
        updateComputerScreenUI();
    }
}

/**
 * Close the computer screen overlay
 */
export function closeComputerScreen() {
    const screen = document.getElementById('computer-screen-overlay');
    if (screen) {
        screen.classList.remove('show');
    }
    // Return to main menu view
    showComputerMainMenu();
}

/**
 * Update the computer screen UI with current values
 */
export function updateComputerScreenUI() {
    const m1 = mission1State;

    // Update wallet balance display
    const walletEl = document.getElementById('screen-wallet');
    if (walletEl) {
        const cryptoValue = getCryptoPortfolioValue();
        walletEl.textContent = cryptoValue.toFixed(0);
    }

    // Update money display
    const balanceEl = document.getElementById('screen-balance');
    if (balanceEl) {
        balanceEl.textContent = m1.money;
    }
}

/**
 * Show the main menu on computer screen
 */
export function showComputerMainMenu() {
    const mainMenu = document.getElementById('computer-main-menu');
    const jobBrowser = document.getElementById('job-browser');
    const cryptoScreen = document.getElementById('screen-crypto');

    if (mainMenu) mainMenu.style.display = 'block';
    if (jobBrowser) jobBrowser.style.display = 'none';
    if (cryptoScreen) cryptoScreen.style.display = 'none';
}

/**
 * Open the job browser on computer screen
 */
export function openJobBrowser() {
    const mainMenu = document.getElementById('computer-main-menu');
    const jobBrowser = document.getElementById('job-browser');

    if (mainMenu) mainMenu.style.display = 'none';
    if (jobBrowser) {
        jobBrowser.style.display = 'block';
        renderJobListings();
    }
}

/**
 * Render job listings in the browser
 */
export function renderJobListings() {
    const m1 = mission1State;
    const container = document.getElementById('job-listings');
    if (!container) return;

    container.innerHTML = m1.codingJobs.map(job => `
        <div class="job-card" onclick="acceptJob(${job.id})">
            <div class="job-header-row">
                <span class="job-title">${job.title}</span>
                <span class="job-pay">$${job.pay}</span>
            </div>
            <div class="job-client">Client: ${job.client}</div>
            <div class="job-description">${job.description}</div>
            <div class="job-footer">
                <span class="job-difficulty ${job.difficulty.toLowerCase()}">${job.difficulty}</span>
                <span class="job-time">2 hours</span>
            </div>
        </div>
    `).join('');
}

/**
 * Open crypto trading on computer screen
 */
export function openScreenCrypto() {
    const mainMenu = document.getElementById('computer-main-menu');
    const cryptoScreen = document.getElementById('screen-crypto');

    if (mainMenu) mainMenu.style.display = 'none';
    if (cryptoScreen) {
        cryptoScreen.style.display = 'block';
        updateScreenCryptoUI();
    }
}

/**
 * Update crypto UI on computer screen
 */
export function updateScreenCryptoUI() {
    const m1 = mission1State;

    // BitCoin
    const spacePriceEl = document.getElementById('screen-spacecoin-price');
    const spaceOwnedEl = document.getElementById('screen-spacecoin-owned');
    const spaceValueEl = document.getElementById('screen-spacecoin-value');
    if (spacePriceEl) spacePriceEl.textContent = m1.crypto.spaceCoin.price.toFixed(2);
    if (spaceOwnedEl) spaceOwnedEl.textContent = m1.crypto.spaceCoin.owned.toFixed(4);
    if (spaceValueEl) {
        const spaceValue = m1.crypto.spaceCoin.owned * m1.crypto.spaceCoin.price;
        spaceValueEl.textContent = spaceValue.toFixed(2);
    }

    // DogeCoin
    const dogePriceEl = document.getElementById('screen-dogecoin-price');
    const dogeOwnedEl = document.getElementById('screen-dogecoin-owned');
    const dogeValueEl = document.getElementById('screen-dogecoin-value');
    if (dogePriceEl) dogePriceEl.textContent = m1.crypto.dogeCoin.price.toFixed(2);
    if (dogeOwnedEl) dogeOwnedEl.textContent = m1.crypto.dogeCoin.owned.toFixed(4);
    if (dogeValueEl) {
        const dogeValue = m1.crypto.dogeCoin.owned * m1.crypto.dogeCoin.price;
        dogeValueEl.textContent = dogeValue.toFixed(2);
    }

    // Balance
    const balanceEl = document.getElementById('screen-crypto-balance');
    if (balanceEl) balanceEl.textContent = m1.money;
}
