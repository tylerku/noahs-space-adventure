/**
 * Library Interior - 3D Point-and-Click Scene
 * Renders the inside of the library where players can click on objects
 * Uses color picking for pixel-perfect click detection
 */

import { mission1State, noah } from '../core/state.js';
import { UI_ELEMENTS } from '../core/constants.js';

// ============================================================================
// COLOR PICKING SYSTEM
// ============================================================================

// Off-screen buffer for color picking
let pickingBuffer = null;

// Color-to-object mapping (unique colors for each clickable object)
const PICK_COLORS = {
    door: [255, 0, 0],           // Red
    tutor: [0, 255, 0],          // Green
    bookshelf_left: [0, 0, 255], // Blue
    bookshelf_right: [255, 255, 0], // Yellow
};

// Reverse mapping: color string -> object name
const COLOR_TO_OBJECT = {};
for (const [name, color] of Object.entries(PICK_COLORS)) {
    COLOR_TO_OBJECT[`${color[0]},${color[1]},${color[2]}`] = name;
}

// ============================================================================
// LIBRARY INTERIOR FUNCTIONS
// ============================================================================

/**
 * Enter the library interior
 */
export function enterLibraryInterior() {
    const m1 = mission1State;
    // Store Noah's position to restore when exiting
    m1.library.exitPosition = { x: noah.x, z: noah.z };
    m1.library.isInside = true;
    m1.library.hoveredObject = null;

    // Hide any tooltips/prompts
    const tooltip = document.getElementById(UI_ELEMENTS.M1_TOOLTIP);
    if (tooltip) tooltip.classList.remove('show');

    // Show library interior HUD
    const hud = document.getElementById('m1-library-interior-hud');
    if (hud) hud.classList.add('show');
}

/**
 * Exit the library interior
 */
export function exitLibraryInterior() {
    const m1 = mission1State;
    m1.library.isInside = false;
    m1.library.hoveredObject = null;

    // Hide library interior HUD
    const hud = document.getElementById('m1-library-interior-hud');
    if (hud) hud.classList.remove('show');

    // Reset cursor
    document.body.style.cursor = 'default';

    // Clean up picking buffer to free memory
    if (pickingBuffer) {
        pickingBuffer.remove();
        pickingBuffer = null;
    }
}

/**
 * Draw the library interior scene (point-and-click style)
 */
export function drawLibraryInterior(p) {
    const m1 = mission1State;

    // Clear background - warm, cozy library interior
    p.background(80, 60, 45);

    // Fixed camera looking at the interior from the front
    p.camera(0, -100, 250, 0, -50, 0, 0, 1, 0);

    // Warm, moody interior lighting - lower ambient for contrast
    p.ambientLight(100, 85, 70);
    p.directionalLight(200, 180, 140, 0, 0.5, -0.5);  // Warm key light
    p.directionalLight(80, 70, 60, 0, -0.3, 0.5);     // Soft fill
    p.pointLight(255, 220, 150, 0, -120, 50);         // Ceiling light glow

    // Draw all interior elements
    drawLibraryFloor(p);
    drawLibraryWalls(p);
    drawLibraryWindows(p);
    drawFrontDesk(p);
    drawBookshelves(p);
    drawReadingTables(p);
    drawCeilingLights(p);
    drawLibraryTutor(p);
    drawExitDoor(p);

    // Draw hover highlight if applicable
    if (m1.library.hoveredObject) {
        drawLibraryHoverHighlight(p, m1.library.hoveredObject);
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
    pg.camera(0, -100, 250, 0, -50, 0, 0, 1, 0);

    // No lighting - we want flat colors
    pg.noLights();
    pg.noStroke();

    // Draw clickable objects with their pick colors

    // Door (on left wall, rotated to match visual door)
    pg.push();
    pg.translate(-195, -55, 20);  // Match door position
    pg.rotateY(pg.HALF_PI);        // Match door rotation
    pg.fill(PICK_COLORS.door[0], PICK_COLORS.door[1], PICK_COLORS.door[2]);
    pg.box(70, 115, 10);           // Match door frame size
    pg.pop();

    // Tutor (sitting at left table)
    pg.push();
    pg.translate(-80, -40, -85);
    pg.fill(PICK_COLORS.tutor[0], PICK_COLORS.tutor[1], PICK_COLORS.tutor[2]);
    pg.box(35, 70, 35);
    pg.pop();

    // Left bookshelf
    pg.push();
    pg.translate(-170, -70, -130);
    pg.fill(PICK_COLORS.bookshelf_left[0], PICK_COLORS.bookshelf_left[1], PICK_COLORS.bookshelf_left[2]);
    pg.box(55, 145, 35);
    pg.pop();

    // Right bookshelf
    pg.push();
    pg.translate(170, -70, -130);
    pg.fill(PICK_COLORS.bookshelf_right[0], PICK_COLORS.bookshelf_right[1], PICK_COLORS.bookshelf_right[2]);
    pg.box(55, 145, 35);
    pg.pop();
}

/**
 * Draw the library floor (rich wood planks)
 */
function drawLibraryFloor(p) {
    p.push();
    p.rotateX(p.HALF_PI);
    p.fill(120, 75, 45);  // Rich dark wood
    p.plane(400, 300);

    // Wood grain lines - darker for contrast
    p.stroke(90, 55, 30);
    p.strokeWeight(2);
    for (let i = -180; i < 200; i += 20) {
        p.line(i, -150, i, 150);
    }
    p.noStroke();
    p.pop();
}

/**
 * Draw the library walls
 */
function drawLibraryWalls(p) {
    // Back wall - warm sage green
    p.push();
    p.translate(0, -80, -150);
    p.fill(160, 175, 140);
    p.box(400, 160, 5);
    p.pop();

    // Left wall - warm burgundy/maroon
    p.push();
    p.translate(-200, -80, 0);
    p.rotateY(p.HALF_PI);
    p.fill(140, 90, 85);
    p.box(300, 160, 5);
    p.pop();

    // Right wall - warm burgundy/maroon
    p.push();
    p.translate(200, -80, 0);
    p.rotateY(p.HALF_PI);
    p.fill(140, 90, 85);
    p.box(300, 160, 5);
    p.pop();

    // Ceiling - warm cream with wood tones
    p.push();
    p.translate(0, -160, 0);
    p.rotateX(p.HALF_PI);
    p.fill(180, 160, 130);
    p.plane(400, 300);
    p.pop();

    // Baseboard trim - dark wood
    p.fill(70, 45, 30);
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

    // Crown molding - decorative strip at ceiling
    p.fill(100, 70, 45);
    p.push();
    p.translate(0, -155, -148);
    p.box(400, 8, 3);
    p.pop();
}

/**
 * Draw windows on the back wall
 */
function drawLibraryWindows(p) {
    const windowPositions = [-100, 0, 100];

    for (const wx of windowPositions) {
        p.push();
        p.translate(wx, -90, -147);

        // Window frame (brown wood)
        p.fill(100, 70, 40);
        p.box(50, 70, 3);

        // Window glass (light blue sky color)
        p.fill(180, 220, 255);
        p.push();
        p.translate(0, 0, 1);
        p.box(42, 62, 1);
        p.pop();

        // Window dividers
        p.fill(100, 70, 40);
        p.push();
        p.translate(0, 0, 2);
        p.box(2, 62, 2);
        p.pop();
        p.push();
        p.translate(0, 0, 2);
        p.box(42, 2, 2);
        p.pop();

        // Sunlight glow
        p.fill(255, 250, 200, 50);
        p.push();
        p.translate(0, 0, 5);
        p.box(60, 80, 2);
        p.pop();

        p.pop();
    }
}

/**
 * Draw the front desk near entrance
 */
function drawFrontDesk(p) {
    p.push();
    p.translate(0, 0, 80);

    // Desk top
    p.fill(120, 80, 50);
    p.push();
    p.translate(0, -35, 0);
    p.box(100, 5, 40);
    p.pop();

    // Desk front panel
    p.fill(100, 65, 40);
    p.push();
    p.translate(0, -17, 20);
    p.box(100, 35, 3);
    p.pop();

    // Desk sides
    p.push();
    p.translate(-48, -17, 0);
    p.box(3, 35, 40);
    p.pop();
    p.push();
    p.translate(48, -17, 0);
    p.box(3, 35, 40);
    p.pop();

    // Books on desk
    p.fill(180, 50, 50);
    p.push();
    p.translate(-25, -42, 0);
    p.box(15, 10, 12);
    p.pop();
    p.fill(50, 50, 180);
    p.push();
    p.translate(-10, -40, 0);
    p.box(12, 8, 10);
    p.pop();

    p.pop();
}

/**
 * Draw bookshelves along the walls
 */
function drawBookshelves(p) {
    // Left bookshelf
    drawBookshelf(p, -170, -130);
    // Right bookshelf
    drawBookshelf(p, 170, -130);
}

/**
 * Draw a single bookshelf
 */
function drawBookshelf(p, x, z) {
    p.push();
    p.translate(x, 0, z);

    // Shelf frame (dark wood)
    p.fill(90, 60, 35);

    // Back panel
    p.push();
    p.translate(0, -70, 0);
    p.box(50, 140, 5);
    p.pop();

    // Sides
    p.push();
    p.translate(-24, -70, 10);
    p.box(3, 140, 25);
    p.pop();
    p.push();
    p.translate(24, -70, 10);
    p.box(3, 140, 25);
    p.pop();

    // Shelves (5 levels)
    for (let i = 0; i < 5; i++) {
        p.push();
        p.translate(0, -10 - i * 30, 10);
        p.fill(100, 70, 40);
        p.box(48, 3, 25);
        p.pop();

        // Books on each shelf
        if (i < 4) {
            drawBooksOnShelf(p, 0, -25 - i * 30, 10);
        }
    }

    // Top decorative piece
    p.fill(80, 55, 30);
    p.push();
    p.translate(0, -145, 10);
    p.box(55, 8, 28);
    p.pop();

    p.pop();
}

/**
 * Draw books on a shelf
 */
function drawBooksOnShelf(p, x, y, z) {
    const bookColors = [
        [180, 50, 50],   // Red
        [50, 50, 180],   // Blue
        [50, 150, 50],   // Green
        [180, 150, 50],  // Yellow
        [150, 50, 150],  // Purple
        [180, 100, 50],  // Orange
        [100, 80, 60],   // Brown
    ];

    // Fixed book sizes to prevent flickering (no Math.random in draw loop!)
    const bookWidths = [5, 6, 4, 7, 5, 6, 5];
    const bookHeights = [22, 20, 25, 18, 23, 21, 24];

    p.push();
    p.translate(x, y, z);

    let offsetX = -18;
    for (let i = 0; i < 7; i++) {
        const bookWidth = bookWidths[i];
        const bookHeight = bookHeights[i];
        const color = bookColors[i % bookColors.length];

        p.fill(color[0], color[1], color[2]);
        p.push();
        p.translate(offsetX + bookWidth / 2, bookHeight / 2 - 12, 0);
        p.box(bookWidth, bookHeight, 10);
        p.pop();

        offsetX += bookWidth + 1;
    }
    p.pop();
}

/**
 * Draw reading tables with chairs
 */
function drawReadingTables(p) {
    // Left table (for reading)
    p.push();
    p.translate(-80, 0, -50);
    drawReadingTable(p);
    drawLibraryChairs(p, 2);
    p.pop();

    // Right table (where tutor sits)
    p.push();
    p.translate(80, 0, -50);
    drawReadingTable(p);
    drawLibraryChairs(p, 2);
    p.pop();
}

/**
 * Draw a single reading table
 */
function drawReadingTable(p) {
    // Table top
    p.fill(140, 100, 60);
    p.push();
    p.translate(0, -30, 0);
    p.box(70, 4, 50);
    p.pop();

    // Table legs
    p.fill(100, 70, 45);
    for (const lx of [-30, 30]) {
        for (const lz of [-20, 20]) {
            p.push();
            p.translate(lx, -14, lz);
            p.box(5, 28, 5);
            p.pop();
        }
    }

    // Books on table
    p.fill(50, 100, 150);
    p.push();
    p.translate(-15, -35, 5);
    p.rotateY(0.1);
    p.box(20, 5, 15);
    p.pop();

    p.fill(150, 80, 80);
    p.push();
    p.translate(10, -35, -5);
    p.rotateY(-0.2);
    p.box(18, 4, 14);
    p.pop();
}

/**
 * Draw chairs around a table
 */
function drawLibraryChairs(p, count) {
    // Chairs on each side
    if (count >= 1) {
        p.push();
        p.translate(0, 0, 35);
        drawChair(p, p.PI);
        p.pop();
    }
    if (count >= 2) {
        p.push();
        p.translate(0, 0, -35);
        drawChair(p, 0);
        p.pop();
    }
}

/**
 * Draw a single chair
 */
function drawChair(p, rotation) {
    p.push();
    p.rotateY(rotation);

    // Seat
    p.fill(80, 50, 30);
    p.push();
    p.translate(0, -20, 0);
    p.box(25, 4, 25);
    p.pop();

    // Back
    p.push();
    p.translate(0, -40, -11);
    p.box(25, 40, 3);
    p.pop();

    // Legs
    p.fill(60, 40, 25);
    for (const lx of [-10, 10]) {
        for (const lz of [-10, 10]) {
            p.push();
            p.translate(lx, -9, lz);
            p.box(3, 18, 3);
            p.pop();
        }
    }

    p.pop();
}

/**
 * Draw ceiling lights
 */
function drawCeilingLights(p) {
    const lightPositions = [
        { x: -80, z: -50 },
        { x: 80, z: -50 },
        { x: 0, z: 50 },
    ];

    for (const pos of lightPositions) {
        p.push();
        p.translate(pos.x, -160, pos.z);

        // Chain - brass colored
        p.fill(160, 120, 60);
        p.push();
        p.translate(0, 10, 0);
        p.cylinder(2, 20);
        p.pop();

        // Light fixture (warm amber shade)
        p.fill(200, 140, 60);
        p.push();
        p.translate(0, 25, 0);
        p.cone(22, 28);
        p.pop();

        p.pop();
    }
}

/**
 * Draw the tutor NPC (older kid with glasses at the right table)
 */
function drawLibraryTutor(p) {
    p.push();
    p.translate(-80, 0, -85); // Sitting at left table, on the far side
    p.rotateY(0); // Facing toward camera/table

    // Legs (seated)
    p.fill(60, 60, 100);
    p.push();
    p.translate(-5, -15, 8);
    p.rotateX(-p.HALF_PI + 0.3);
    p.box(6, 20, 6);
    p.pop();
    p.push();
    p.translate(5, -15, 8);
    p.rotateX(-p.HALF_PI + 0.3);
    p.box(6, 20, 6);
    p.pop();

    // Body (torso)
    p.fill(100, 60, 60); // Maroon sweater
    p.push();
    p.translate(0, -35, 0);
    p.box(18, 25, 12);
    p.pop();

    // Arms (one resting on table, one holding book)
    p.fill(100, 60, 60);
    p.push();
    p.translate(-12, -32, 5);
    p.rotateX(-0.3);
    p.box(5, 18, 5);
    p.pop();
    p.push();
    p.translate(12, -32, 5);
    p.rotateX(-0.3);
    p.box(5, 18, 5);
    p.pop();

    // Hands
    p.fill(210, 170, 140);
    p.push();
    p.translate(-12, -42, 10);
    p.sphere(4);
    p.pop();
    p.push();
    p.translate(12, -42, 10);
    p.sphere(4);
    p.pop();

    // Head
    p.fill(210, 170, 140);
    p.push();
    p.translate(0, -55, 0);
    p.sphere(10);
    p.pop();

    // Hair (neat, short)
    p.fill(60, 40, 30);
    p.push();
    p.translate(0, -62, 0);
    p.box(18, 8, 16);
    p.pop();

    // Glasses
    p.fill(50, 50, 50);
    p.push();
    p.translate(0, -55, 8);
    // Left lens frame
    p.push();
    p.translate(-5, 0, 0);
    p.torus(4, 0.5);
    p.pop();
    // Right lens frame
    p.push();
    p.translate(5, 0, 0);
    p.torus(4, 0.5);
    p.pop();
    // Bridge
    p.push();
    p.translate(0, 0, 0);
    p.box(4, 1, 1);
    p.pop();
    p.pop();

    // Lens glass
    p.fill(200, 220, 255, 100);
    p.push();
    p.translate(-5, -55, 9);
    p.sphere(3);
    p.pop();
    p.push();
    p.translate(5, -55, 9);
    p.sphere(3);
    p.pop();

    // Book the tutor is reading
    p.fill(50, 80, 50);
    p.push();
    p.translate(0, -33, 15);
    p.rotateX(-0.8);
    p.box(14, 18, 2);
    p.pop();
    // Pages
    p.fill(255, 250, 240);
    p.push();
    p.translate(0, -33, 14);
    p.rotateX(-0.8);
    p.box(12, 16, 1);
    p.pop();

    p.pop();
}

/**
 * Draw the exit door (double glass doors on left wall)
 */
function drawExitDoor(p) {
    p.push();
    p.translate(-195, 0, 20);  // Left wall, moved away from bookshelf
    p.rotateY(p.HALF_PI);       // Rotate to face inward from left wall

    // Door frame (wide for double doors)
    p.fill(60, 60, 65);  // Dark metal frame
    p.push();
    p.translate(0, -55, 0);
    p.box(70, 115, 6);
    p.pop();

    // Left door
    p.push();
    p.translate(-17, -55, 3);
    // Metal frame around glass
    p.fill(70, 70, 75);
    p.box(30, 105, 4);
    // Glass panel
    p.fill(180, 220, 240, 120);  // Light blue transparent glass
    p.push();
    p.translate(0, 0, 2);
    p.box(24, 95, 2);
    p.pop();
    // Horizontal bar (push bar)
    p.fill(180, 180, 185);
    p.push();
    p.translate(0, 0, 4);
    p.box(22, 4, 3);
    p.pop();
    p.pop();

    // Right door
    p.push();
    p.translate(17, -55, 3);
    // Metal frame around glass
    p.fill(70, 70, 75);
    p.box(30, 105, 4);
    // Glass panel
    p.fill(180, 220, 240, 120);  // Light blue transparent glass
    p.push();
    p.translate(0, 0, 2);
    p.box(24, 95, 2);
    p.pop();
    // Horizontal bar (push bar)
    p.fill(180, 180, 185);
    p.push();
    p.translate(0, 0, 4);
    p.box(22, 4, 3);
    p.pop();
    p.pop();

    // Center divider between doors
    p.fill(60, 60, 65);
    p.push();
    p.translate(0, -55, 5);
    p.box(4, 105, 4);
    p.pop();

    // "EXIT" sign above (glowing)
    p.fill(200, 50, 50);
    p.push();
    p.translate(0, -115, 4);
    p.box(45, 14, 3);
    p.pop();
    // White text area
    p.fill(255, 255, 255);
    p.push();
    p.translate(0, -115, 6);
    p.box(38, 10, 1);
    p.pop();
    // Glow effect
    p.fill(255, 100, 100, 40);
    p.push();
    p.translate(0, -115, 8);
    p.box(55, 20, 2);
    p.pop();

    p.pop();
}

/**
 * Draw hover highlight on a clickable object
 */
function drawLibraryHoverHighlight(p, objectName) {
    p.push();

    // Position based on object
    switch (objectName) {
        case 'tutor':
            p.translate(-80, -50, -85);
            p.fill(255, 255, 100, 40);
            p.sphere(20);
            break;
        case 'bookshelf_left':
            p.translate(-170, -70, -130);
            p.fill(255, 255, 100, 30);
            p.box(60, 150, 35);
            break;
        case 'bookshelf_right':
            p.translate(170, -70, -130);
            p.fill(255, 255, 100, 30);
            p.box(60, 150, 35);
            break;
        case 'door':
            p.translate(-195, -55, 20);
            p.rotateY(p.HALF_PI);
            p.fill(255, 255, 100, 30);
            p.box(75, 120, 15);  // Match door frame
            break;
    }

    p.pop();
}

/**
 * Handle mouse click in library interior
 * Returns the action to perform
 */
export function handleLibraryClick(mouseX, mouseY, canvasWidth, canvasHeight) {
    const clickedObject = getLibraryObjectAtPosition(mouseX, mouseY, canvasWidth, canvasHeight);

    if (!clickedObject) return null;

    switch (clickedObject) {
        case 'tutor':
            return { action: 'tutor' };
        case 'bookshelf_left':
        case 'bookshelf_right':
            return { action: 'read' };
        case 'door':
            return { action: 'exit' };
        default:
            return null;
    }
}

/**
 * Handle mouse hover in library interior
 */
export function handleLibraryHover(mouseX, mouseY, canvasWidth, canvasHeight) {
    const m1 = mission1State;
    const hoveredObject = getLibraryObjectAtPosition(mouseX, mouseY, canvasWidth, canvasHeight);
    m1.library.hoveredObject = hoveredObject;
    return hoveredObject;
}

/**
 * Get the library object at screen position
 * Uses color picking for pixel-perfect detection
 */
function getLibraryObjectAtPosition(mouseX, mouseY, canvasWidth, canvasHeight) {
    if (!pickingBuffer) return null;

    // In WEBGL mode, we need to adjust coordinates
    // The picking buffer uses WEBGL which has origin at center
    // But mouseX/mouseY are in standard screen coords (origin top-left)
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
