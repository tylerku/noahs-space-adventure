/**
 * Mission 1: Belle Pond Avenue
 * Neighborhood simulator - mow lawns, sell lemonade, buy rocket parts
 */

import { MISSION1, COLORS, ANIMATION, TERRAIN, TIME, STATS, GAME_STATES } from '../core/constants.js';
import {
    mission1State, noah, resetMission1State, initializeNeighbors,
    addMoney, spendMoney, buyRocketPart, allRocketPartsOwned, anyRocketPartsOwned,
    getOwnedRocketPartsCount, loadMission1Progress, getFormattedTime, getXPForNextLevel,
    areRocketPartsUnlocked, isNightTime, isGettingDark, startNewDay,
    advanceTime, saveMission1Progress, getNoahSpeed,
    addStaminaXP, addIntelligenceXP, isHouseFlippingUnlocked,
    isRocketAssembled, isReadyToLaunch, assembleRocket,
    setGameState, isComputerBuilt
} from '../core/state.js';
import { drawHannah, drawNeighbor, drawNiam, drawMommy } from '../entities/characters.js';
import {
    showNotification, showConversationDialog, hideConversationDialog,
    showPrompt, hidePrompt, showShop, hideShop, updateM1HUD, updateM1FullHUD,
    showTooltip, hideTooltip, getElement
} from '../ui/dialogs.js';
import { UI_ELEMENTS } from '../core/constants.js';

// ============ INITIALIZATION ============

/**
 * Initialize Mission 1
 */
export function initMission1() {
    resetMission1State();
    initializeNeighbors();
    generateM1Trees();
    generateM1Flowers();
    generateGrassTexture();

    // Load saved progress (money, rocket parts, stats, time)
    loadMission1Progress();

    // Update the full HUD
    refreshHUD();
}

/**
 * Build HUD state object and update display
 */
export function refreshHUD() {
    const m1 = mission1State;

    // Count owned parts
    const computerPartsOwned = Object.values(m1.computer.parts).filter(p => p.owned).length;
    const rocketPartsOwned = Object.values(m1.rocketParts).filter(p => p.owned).length;

    // Calculate XP percentages
    const staminaXpNeeded = getXPForNextLevel(m1.stats.stamina.level);
    const intelligenceXpNeeded = getXPForNextLevel(m1.stats.intelligence.level);
    const staminaXpPercent = m1.stats.stamina.level >= STATS.MAX_LEVEL ? 100 :
        (m1.stats.stamina.xp / staminaXpNeeded) * 100;
    const intelligenceXpPercent = m1.stats.intelligence.level >= STATS.MAX_LEVEL ? 100 :
        (m1.stats.intelligence.xp / intelligenceXpNeeded) * 100;

    updateM1FullHUD({
        money: m1.money,
        formattedTime: getFormattedTime(),
        hour: m1.gameTime.hour,
        dayNumber: m1.gameTime.dayNumber,
        staminaLevel: m1.stats.stamina.level,
        intelligenceLevel: m1.stats.intelligence.level,
        staminaXp: m1.stats.stamina.xp,
        staminaXpNeeded,
        intelligenceXp: m1.stats.intelligence.xp,
        intelligenceXpNeeded,
        staminaXpPercent,
        intelligenceXpPercent,
        computerPartsOwned,
        rocketPartsOwned,
        rocketPartsUnlocked: areRocketPartsUnlocked(),
        rocketAssembled: m1.rocket.isAssembled,
        readyToLaunch: isReadyToLaunch(),
    });
}

/**
 * Generate decorative trees
 */
function generateM1Trees() {
    const m1 = mission1State;
    m1.trees = [];

    // Trees behind houses (spread wider to match new house spacing)
    for (let i = 0; i < 7; i++) {
        m1.trees.push({
            x: -360 + i * 120,
            z: 420 + (Math.random() - 0.5) * 40,
            height: 50 + Math.random() * 30,
            width: 30 + Math.random() * 15,
        });
    }

    // Trees around lake (centered at X:0, Z:350)
    for (let i = 0; i < 4; i++) {
        m1.trees.push({
            x: -90 + i * 60 + (Math.random() - 0.5) * 30,
            z: 380 + (Math.random() - 0.5) * 40,
            height: 45 + Math.random() * 25,
            width: 25 + Math.random() * 15,
        });
    }

    // Entrance trees (along the road, spread wider)
    m1.trees.push({ x: -450, z: 20, height: 60, width: 35 });
    m1.trees.push({ x: -450, z: 80, height: 65, width: 38 });
    m1.trees.push({ x: -250, z: -20, height: 55, width: 32 });
    m1.trees.push({ x: 50, z: -30, height: 60, width: 36 });
    m1.trees.push({ x: 250, z: -20, height: 55, width: 32 });
    // Removed tree at x:450, z:50 that was blocking the road in front of tech shop
}

/**
 * Check if a point is on the road
 */
function isOnRoad(x, z) {
    const roadHalfWidth = 30;

    // Main straight road (Belle Pond Ave - horizontal, Z around 80)
    if (x >= -450 && x <= 800 && z >= 80 - roadHalfWidth && z <= 80 + roadHalfWidth) {
        return true;
    }

    // Perpendicular road to library and track (going south from main road at X: -200)
    const libraryRoadHalfWidth = 25;
    if (x >= -200 - libraryRoadHalfWidth && x <= -200 + libraryRoadHalfWidth &&
        z >= -320 && z <= 80 + roadHalfWidth) {
        return true;
    }

    return false;
}

/**
 * Generate decorative flowers
 */
function generateM1Flowers() {
    const m1 = mission1State;
    m1.flowers = [];

    for (let i = 0; i < TERRAIN.M1_FLOWERS_COUNT; i++) {
        const fx = (Math.random() - 0.5) * 640;
        const fz = -100 + Math.random() * 450;

        // Skip road areas
        if (isOnRoad(fx, fz)) continue;

        // Skip lake area
        if (Math.hypot(fx - m1.lake.x, fz - m1.lake.z) < 80) continue;

        m1.flowers.push({
            x: fx,
            z: fz,
            color: COLORS.FLOWER_VARIANTS[Math.floor(Math.random() * COLORS.FLOWER_VARIANTS.length)],
        });
    }
}

/**
 * Generate grass texture elements (patches and dirt spots only - lightweight)
 */
function generateGrassTexture() {
    const m1 = mission1State;
    m1.grassTexture = {
        patches: [],
        dirtSpots: []
    };

    // Generate color variation patches (darker/lighter areas)
    for (let i = 0; i < 30; i++) {
        const x = (Math.random() - 0.5) * 1100;
        const z = -450 + Math.random() * 900;

        if (isOnRoad(x, z)) continue;
        if (Math.hypot(x - m1.lake.x, z - m1.lake.z) < 90) continue;

        m1.grassTexture.patches.push({
            x,
            z,
            size: 25 + Math.random() * 50,
            shade: Math.random() > 0.5 ? 12 : -12
        });
    }

    // Generate small dirt spots
    for (let i = 0; i < 15; i++) {
        const x = (Math.random() - 0.5) * 1000;
        const z = -400 + Math.random() * 800;

        if (isOnRoad(x, z)) continue;
        if (Math.hypot(x - m1.lake.x, z - m1.lake.z) < 100) continue;

        m1.grassTexture.dirtSpots.push({
            x,
            z,
            size: 6 + Math.random() * 12
        });
    }
}

// ============ UPDATE LOOP ============

/**
 * Main Mission 1 update
 */
export function updateMission1(p) {
    const m1 = mission1State;

    // Skip all updates when inside library interior
    if (m1.library.isInside) {
        return;
    }

    // Skip movement during dialogs
    if (!m1.isMowing && !m1.isShopOpen && !m1.showingPrompt &&
        !m1.inConversation && !m1.niam.showingDialog) {
        handleM1Movement(p);
    }

    // Handle rotation
    if (!m1.inConversation && !m1.niam.showingDialog) {
        updateNoahRotation(p);
    }

    // Mowing mini-game
    if (m1.mowingMiniGame && m1.currentMowingNeighbor) {
        updateMowingMiniGame(p);
    }

    // Update walking neighbors
    updateWalkingNeighbors();

    // Update drinking neighbors
    updateDrinkingNeighbors();

    // Restore moods over time
    if (p.frameCount % MISSION1.MOOD_RESTORE_INTERVAL === 0) {
        restoreNeighborMoods();
    }

    // Update Niam
    updateNiam(p);

    // Update tooltip
    if (!m1.inConversation) {
        updateTooltip();
    } else {
        hideTooltip(UI_ELEMENTS.M1_TOOLTIP);
    }
}

/**
 * Handle WASD movement
 */
function handleM1Movement(p) {
    // Save previous position for collision resolution
    const prevX = noah.x;
    const prevZ = noah.z;

    // Speed is based on stamina level (base + bonus per level)
    const speed = getNoahSpeed();
    if (p.keyIsDown(87)) noah.z += speed; // W - up (with flipped camera)
    if (p.keyIsDown(83)) noah.z -= speed; // S - down
    if (p.keyIsDown(65)) noah.x += speed; // A - left
    if (p.keyIsDown(68)) noah.x -= speed; // D - right

    // Clamp to bounds
    noah.x = p.constrain(noah.x, MISSION1.BOUNDS.MIN_X, MISSION1.BOUNDS.MAX_X);
    noah.z = p.constrain(noah.z, MISSION1.BOUNDS.MIN_Z, MISSION1.BOUNDS.MAX_Z);

    // Check collision and resolve (try sliding along walls)
    if (checkStructureCollision(noah.x, noah.z)) {
        // Try moving only in X direction
        if (!checkStructureCollision(noah.x, prevZ)) {
            noah.z = prevZ;
        }
        // Try moving only in Z direction
        else if (!checkStructureCollision(prevX, noah.z)) {
            noah.x = prevX;
        }
        // Can't move at all, revert completely
        else {
            noah.x = prevX;
            noah.z = prevZ;
        }
    }
}

/**
 * Check if a position collides with any structure
 */
function checkStructureCollision(x, z) {
    const m1 = mission1State;
    const noahRadius = 12;  // Noah's collision radius

    // Check houses (entrance on south side facing the street)
    for (const house of m1.houses) {
        const houseWidth = 35;   // Half-width
        const houseDepth = 30;   // Half-depth
        // Allow entrance on south side (front door area) - only when outside the house front wall
        const houseFront = house.z - houseDepth;
        const atHouseEntrance = z < houseFront && Math.abs(x - house.x) < 20;
        if (!atHouseEntrance &&
            x > house.x - houseWidth - noahRadius &&
            x < house.x + houseWidth + noahRadius &&
            z > house.z - houseDepth - noahRadius &&
            z < house.z + houseDepth + noahRadius) {
            return true;
        }
    }

    // Check library (rotated 90 degrees, entrance on east side)
    const lib = m1.library;
    const libWidth = 45;   // Half-width in X (building is 80 wide after rotation)
    const libDepth = 55;   // Half-depth in Z (building is 100 deep after rotation)
    // Allow entrance on east side (toward road) - don't block that area
    const atLibraryEntrance = x > lib.x + 30 && Math.abs(z - lib.z) < 25;
    if (!atLibraryEntrance &&
        x > lib.x - libWidth - noahRadius &&
        x < lib.x + libWidth + noahRadius &&
        z > lib.z - libDepth - noahRadius &&
        z < lib.z + libDepth + noahRadius) {
        return true;
    }

    // Check rocket shop (entrance on west side facing the road)
    const shop = m1.rocketShop;
    const shopWidth = 40;   // Half-width
    const shopDepth = 35;   // Half-depth
    // Allow entrance on west side (toward the road)
    const atShopEntrance = x < shop.x - 25 && Math.abs(z - shop.z) < 25;
    if (!atShopEntrance &&
        x > shop.x - shopWidth - noahRadius &&
        x < shop.x + shopWidth + noahRadius &&
        z > shop.z - shopDepth - noahRadius &&
        z < shop.z + shopDepth + noahRadius) {
        return true;
    }

    // Check lemonade stand (small, allow approaching from any side)
    const stand = m1.lemonadeStand;
    const standWidth = 15;   // Half-width (small stand)
    const standDepth = 12;   // Half-depth
    if (x > stand.x - standWidth - noahRadius &&
        x < stand.x + standWidth + noahRadius &&
        z > stand.z - standDepth - noahRadius &&
        z < stand.z + standDepth + noahRadius) {
        return true;
    }

    // Check lake (circular-ish collision)
    const lake = m1.lake;
    const lakeRadiusX = lake.width / 2 + noahRadius;
    const lakeRadiusZ = lake.height / 2 + noahRadius;
    const dx = (x - lake.x) / lakeRadiusX;
    const dz = (z - lake.z) / lakeRadiusZ;
    if (dx * dx + dz * dz < 1) {
        return true;
    }

    // Check sedan (Dad's car) - allow approaching Dad who stands nearby
    const sedan = m1.sedan;
    const sedanWidth = 25;   // Half-width
    const sedanDepth = 15;   // Half-depth
    // Allow approaching from the side where Dad stands
    const nearDad = Math.hypot(x - m1.dad.x, z - m1.dad.z) < 40;
    if (!nearDad &&
        x > sedan.x - sedanWidth - noahRadius &&
        x < sedan.x + sedanWidth + noahRadius &&
        z > sedan.z - sedanDepth - noahRadius &&
        z < sedan.z + sedanDepth + noahRadius) {
        return true;
    }

    return false;
}

/**
 * Update Noah's rotation based on movement
 */
function updateNoahRotation(p) {
    let dx = 0, dz = 0;
    if (p.keyIsDown(87)) dz = 1;  // W - up
    if (p.keyIsDown(83)) dz = -1; // S - down
    if (p.keyIsDown(65)) dx = 1;  // A - left
    if (p.keyIsDown(68)) dx = -1; // D - right
    if (dx !== 0 || dz !== 0) {
        noah.angle = Math.atan2(dx, dz);
    }
}

/**
 * Update mowing mini-game
 */
function updateMowingMiniGame(p) {
    const m1 = mission1State;
    const lawn = m1.mowingLawn;
    const speed = MISSION1.MOWING.TILE_SIZE / 6;
    let moving = false;

    if (p.keyIsDown(87)) { lawn.mowerZ += speed; lawn.mowerAngle = p.PI; moving = true; }        // W - up (toward house)
    if (p.keyIsDown(83)) { lawn.mowerZ -= speed; lawn.mowerAngle = 0; moving = true; }          // S - down (toward camera)
    if (p.keyIsDown(65)) { lawn.mowerX += speed; lawn.mowerAngle = -p.HALF_PI; moving = true; } // A - left (+X)
    if (p.keyIsDown(68)) { lawn.mowerX -= speed; lawn.mowerAngle = p.HALF_PI; moving = true; }  // D - right (-X)

    // Clamp mower to lawn boundaries (lawn plane has +60 padding for visual buffer)
    const halfWidth = (lawn.lawnWidth * lawn.tileSize) / 2;
    const lawnStartZ = lawn.houseZ - 70 - lawn.lawnHeight * lawn.tileSize;
    const lawnEndZ = lawn.houseZ - 70;
    // Small margin so mower stays on the green lawn plane (which has +30 padding on each side)
    lawn.mowerX = p.constrain(lawn.mowerX, lawn.houseX - halfWidth - 10, lawn.houseX + halfWidth + 10);
    lawn.mowerZ = p.constrain(lawn.mowerZ, lawnStartZ - 10, lawnEndZ + 10);

    // Cut grass
    if (moving) {
        for (const tile of lawn.grassTiles) {
            if (!tile.cut) {
                const dist = Math.hypot(lawn.mowerX - tile.x, lawn.mowerZ - tile.z);
                if (dist < lawn.tileSize * 0.9) {
                    tile.cut = true;
                    lawn.cutTiles++;
                    if (lawn.cutTiles >= lawn.totalTiles) {
                        completeMowing();
                    }
                }
            }
        }
    }

    m1.mowingProgress = (lawn.cutTiles / lawn.totalTiles) * 100;
}

/**
 * Complete mowing job
 */
function completeMowing() {
    const m1 = mission1State;
    const pay = m1.currentMowingNeighbor.mowPay;
    addMoney(pay);
    showNotification(UI_ELEMENTS.M1_NOTIFICATION, `Lawn complete! Earned $${pay}!`, 2500);

    m1.isMowing = false;
    m1.mowingMiniGame = false;
    m1.mowingProgress = 0;

    noah.x = m1.mowingLawn.originalNoahPos.x;
    noah.z = m1.mowingLawn.originalNoahPos.z;

    m1.currentMowingNeighbor = null;
    refreshHUD();
}

/**
 * Update neighbors walking to lemonade stand
 */
function updateWalkingNeighbors() {
    const m1 = mission1State;
    const targetX = m1.lemonadeStand.x + 50;  // Near Hannah (who is now at +50 after rotation)
    const targetZ = m1.lemonadeStand.z - 30;  // In front of stand (toward street/camera)

    for (let i = m1.walkingNeighbors.length - 1; i >= 0; i--) {
        const neighbor = m1.walkingNeighbors[i];
        const dx = targetX + (m1.drinkingNeighbors.length * 20) - neighbor.currentX;
        const dz = targetZ - neighbor.currentZ;
        const d = Math.sqrt(dx * dx + dz * dz);

        if (d > 5) {
            neighbor.currentX += (dx / d) * MISSION1.NEIGHBOR_WALK_SPEED;
            neighbor.currentZ += (dz / d) * MISSION1.NEIGHBOR_WALK_SPEED;
        } else {
            neighbor.isWalking = false;
            neighbor.isDrinking = true;
            neighbor.drinkTimer = 0;
            neighbor.atLemonade = true;
            m1.customersWaiting++;
            m1.walkingNeighbors.splice(i, 1);
            m1.drinkingNeighbors.push(neighbor);
            refreshHUD();
        }
    }
}

/**
 * Update neighbors drinking lemonade
 */
function updateDrinkingNeighbors() {
    const m1 = mission1State;

    for (let i = m1.drinkingNeighbors.length - 1; i >= 0; i--) {
        const neighbor = m1.drinkingNeighbors[i];
        neighbor.drinkTimer++;

        if (neighbor.drinkTimer >= MISSION1.LEMONADE_STAND.DRINK_TIME) {
            const earned = MISSION1.LEMONADE_STAND.PRICE;
            m1.lemonadeEarnings += earned;
            addMoney(earned);
            m1.customersWaiting--;

            // Consume one lemonade material
            m1.lemonadeMaterials = Math.max(0, m1.lemonadeMaterials - 1);

            neighbor.isDrinking = false;
            neighbor.atLemonade = false;
            neighbor.mood = Math.min(100, neighbor.mood + MISSION1.LEMONADE_MOOD_BOOST);

            m1.drinkingNeighbors.splice(i, 1);

            // Walk home
            startNeighborWalkHome(neighbor);

            refreshHUD();

            // Show notification with remaining materials
            if (m1.lemonadeMaterials <= 0) {
                showNotification(UI_ELEMENTS.M1_NOTIFICATION,
                    `+$${earned} from ${neighbor.name}! OUT OF LEMONADE - Ask Mommy!`, 2500);
            } else {
                showNotification(UI_ELEMENTS.M1_NOTIFICATION,
                    `+$${earned} from ${neighbor.name}! (${m1.lemonadeMaterials} lemonades left)`, 1500);
            }
        }
    }
}

/**
 * Start neighbor walking home
 */
function startNeighborWalkHome(neighbor) {
    neighbor.isWalking = true;
    const walkHomeInterval = setInterval(() => {
        const dx = neighbor.x - neighbor.currentX;
        const dz = neighbor.z - neighbor.currentZ;
        const d = Math.sqrt(dx * dx + dz * dz);

        if (d > 5) {
            neighbor.currentX += (dx / d) * MISSION1.NEIGHBOR_WALK_SPEED;
            neighbor.currentZ += (dz / d) * MISSION1.NEIGHBOR_WALK_SPEED;
        } else {
            neighbor.isWalking = false;
            neighbor.isHome = true;
            neighbor.currentX = neighbor.x;
            neighbor.currentZ = neighbor.z;
            clearInterval(walkHomeInterval);
        }
    }, 16);
}

/**
 * Restore neighbor moods over time
 */
function restoreNeighborMoods() {
    for (const neighbor of mission1State.neighbors) {
        if (neighbor.mood < 100 && neighbor.isHome && !neighbor.isWalking) {
            neighbor.mood = Math.min(100, neighbor.mood + MISSION1.MOOD_RESTORE_RATE);
        }
    }
}

/**
 * Update Niam behavior
 */
function updateNiam(p) {
    const m1 = mission1State;
    if (m1.inConversation || m1.isMowing || m1.niam.showingDialog) return;

    if (!m1.niam.isApproaching) {
        if (p.frameCount - m1.niam.lastApproachTime > m1.niam.approachCooldown) {
            if (Math.random() < MISSION1.NIAM.APPROACH_CHANCE) {
                m1.niam.isApproaching = true;
                // Start from random edge
                const side = Math.floor(Math.random() * 4);
                if (side === 0) { m1.niam.x = -350; m1.niam.z = Math.random() * 150; }
                else if (side === 1) { m1.niam.x = (Math.random() - 0.5) * 400; m1.niam.z = -100; }
                else if (side === 2) { m1.niam.x = 400; m1.niam.z = Math.random() * 150; }
                else { m1.niam.x = (Math.random() - 0.5) * 400; m1.niam.z = 300; }
            }
        }
    } else {
        // Move toward Noah
        const dx = noah.x - m1.niam.x;
        const dz = noah.z - m1.niam.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance < MISSION1.NIAM.APPROACH_DISTANCE) {
            m1.niam.showingDialog = true;
            m1.niam.isApproaching = false;
        } else {
            m1.niam.x += (dx / distance) * MISSION1.NIAM.WALK_SPEED;
            m1.niam.z += (dz / distance) * MISSION1.NIAM.WALK_SPEED;
        }
    }
}

/**
 * Update tooltip based on nearby interactions
 */
function updateTooltip() {
    const m1 = mission1State;
    if (m1.showingPrompt || m1.isShopOpen || m1.isMowing || m1.gameTime.isSleeping) {
        hideTooltip(UI_ELEMENTS.M1_TOOLTIP);
        return;
    }

    const interaction = checkInteractions();
    if (interaction && interaction.tooltip) {
        showTooltip(UI_ELEMENTS.M1_TOOLTIP,
            `Press <span class="key">E</span> to ${interaction.tooltip}`);
    } else {
        hideTooltip(UI_ELEMENTS.M1_TOOLTIP);
    }
}

// ============ INTERACTIONS ============

/**
 * Check for nearby interactable objects
 */
export function checkInteractions() {
    const m1 = mission1State;
    if (m1.showingPrompt || m1.isShopOpen || m1.isMowing || m1.inConversation) {
        return null;
    }

    const isCurfew = isNightTime();  // After 8 PM

    // Check Noah's house - always accessible (need to sleep!)
    const noahsHouse = m1.houses.find(h => h.isNoahsHouse);
    if (noahsHouse) {
        const noahHouseDist = Math.hypot(noah.x - noahsHouse.x, noah.z - (noahsHouse.z - 50));
        if (noahHouseDist < MISSION1.HOUSE_INTERACT_DIST) {
            return { type: 'home', tooltip: isCurfew ? 'go to bed' : 'enter your house' };
        }
    }

    // After 8 PM - everything else is closed
    if (isCurfew) {
        // Check if near any closed location and return closed message

        // Check neighbors/houses - no one answers after 8 PM
        for (const house of m1.houses) {
            if (house.isNoahsHouse) continue;
            const d = Math.hypot(noah.x - house.x, noah.z - (house.z - 50));
            if (d < MISSION1.HOUSE_INTERACT_DIST) {
                return { type: 'closed', tooltip: 'everyone is asleep - come back tomorrow' };
            }
        }

        // Check tech shop
        const shopDist = Math.hypot(noah.x - m1.rocketShop.x, noah.z - (m1.rocketShop.z - 40));
        if (shopDist < MISSION1.SHOP_INTERACT_DIST) {
            return { type: 'closed', tooltip: 'Tech Shop is closed - come back tomorrow' };
        }

        // Check lemonade stand
        const standDist = Math.hypot(noah.x - m1.lemonadeStand.x, noah.z - m1.lemonadeStand.z);
        if (standDist < MISSION1.STAND_INTERACT_DIST) {
            return { type: 'closed', tooltip: 'Hannah went inside - come back tomorrow' };
        }

        // Check Library
        if (m1.library) {
            const libraryDist = Math.hypot(noah.x - (m1.library.x + 60), noah.z - m1.library.z);
            if (libraryDist < m1.library.interactDist) {
                return { type: 'closed', tooltip: 'Library is closed - come back tomorrow' };
            }
        }

        // Check Running Track
        if (m1.runningTrack) {
            const trackDist = Math.hypot(noah.x - m1.runningTrack.x, noah.z - m1.runningTrack.z);
            if (trackDist < m1.runningTrack.interactDist) {
                return { type: 'closed', tooltip: 'too dark to run - go to bed!' };
            }
        }

        // Mommy, Dad are inside - no interaction
        return null;
    }

    // Daytime interactions (before 8 PM)

    // Check neighbors
    for (const neighbor of m1.neighbors) {
        if (neighbor.isHome && !neighbor.atLemonade) {
            const d = Math.hypot(noah.x - neighbor.x, noah.z - neighbor.z);
            if (d < MISSION1.NEIGHBOR_INTERACT_DIST) {
                return { type: 'neighbor', data: neighbor, tooltip: `talk to ${neighbor.name}` };
            }
        }
    }

    // Check houses
    for (const house of m1.houses) {
        const d = Math.hypot(noah.x - house.x, noah.z - (house.z - 50));
        if (d < MISSION1.HOUSE_INTERACT_DIST) {
            // Skip Noah's house - handled above
            if (house.isNoahsHouse) continue;

            const neighbor = house.owner;
            if (!neighbor) continue;

            if (neighbor.atLemonade) {
                return { type: 'house_empty', data: neighbor,
                    tooltip: `${neighbor.name}'s house (away at lemonade stand)` };
            } else if (neighbor.mood <= 20) {
                return { type: 'house_angry', data: neighbor,
                    tooltip: `knock on ${neighbor.name}'s door (they're annoyed!)` };
            }
            return { type: 'house', data: neighbor, tooltip: `knock on ${neighbor.name}'s door` };
        }
    }

    // Check tech shop
    const shopDist = Math.hypot(noah.x - m1.rocketShop.x, noah.z - (m1.rocketShop.z - 40));
    if (shopDist < MISSION1.SHOP_INTERACT_DIST) {
        return { type: 'shop', tooltip: 'enter Tech Shop' };
    }

    // Check lemonade stand
    const standDist = Math.hypot(noah.x - m1.lemonadeStand.x, noah.z - m1.lemonadeStand.z);
    if (standDist < MISSION1.STAND_INTERACT_DIST) {
        return { type: 'lemonade_stand',
            tooltip: `check on Hannah (Customers: ${m1.customersWaiting})` };
    }

    // Check Mommy
    const mommyDist = Math.hypot(noah.x - m1.mommy.x, noah.z - m1.mommy.z);
    if (mommyDist < MISSION1.MOMMY.INTERACT_DIST) {
        return { type: 'mommy', tooltip: 'talk to Mommy' };
    }

    // Check Library (entrance faces east toward the perpendicular road)
    if (m1.library) {
        const libraryDist = Math.hypot(noah.x - (m1.library.x + 60), noah.z - m1.library.z);
        if (libraryDist < m1.library.interactDist) {
            return { type: 'library', tooltip: 'enter the Library' };
        }
    }

    // Check Running Track
    if (m1.runningTrack) {
        const trackDist = Math.hypot(noah.x - m1.runningTrack.x, noah.z - m1.runningTrack.z);
        if (trackDist < m1.runningTrack.interactDist) {
            return { type: 'running_track', tooltip: 'start running laps' };
        }
    }

    // Check Dad (for house flipping)
    if (m1.dad) {
        const dadDist = Math.hypot(noah.x - m1.dad.x, noah.z - m1.dad.z);
        if (dadDist < m1.dad.interactDist) {
            return { type: 'dad', tooltip: 'talk to Dad' };
        }
    }

    // Check launch pad for rocket interactions
    const padX = m1.launchPad.x;
    const padZ = m1.launchPad.z;
    const padDist = Math.hypot(noah.x - padX, noah.z - padZ);

    if (padDist < m1.launchPad.interactDist) {
        if (allRocketPartsOwned()) {
            if (isRocketAssembled()) {
                if (isReadyToLaunch()) {
                    return { type: 'launch', tooltip: '🚀 LAUNCH TO MARS!' };
                } else {
                    return { type: 'rocket_status', tooltip: 'check rocket status' };
                }
            } else {
                const intLevel = mission1State.stats.intelligence.level;
                if (intLevel < 10) {
                    return { type: 'assemble_rocket', tooltip: `build rocket (need INT 10, have ${intLevel})` };
                }
                return { type: 'assemble_rocket', tooltip: 'build rocket (2 hours)' };
            }
        } else if (anyRocketPartsOwned()) {
            const count = getOwnedRocketPartsCount();
            return { type: 'rocket_progress', tooltip: `view rocket (${count}/5 parts)` };
        } else {
            return { type: 'launch_pad_empty', tooltip: 'launch pad (buy rocket parts!)' };
        }
    }

    return null;
}

/**
 * Start conversation with neighbor
 */
export function startConversation(neighbor) {
    const m1 = mission1State;
    m1.inConversation = true;
    m1.conversationNeighbor = neighbor;
    m1.conversationPhase = 0;
    m1.conversationTimer = 0;
    neighbor.doorOpen = true;

    m1.cameraTarget.x = neighbor.homeX;
    m1.cameraTarget.z = neighbor.homeZ - 80;

    setTimeout(() => {
        if (m1.inConversation) {
            m1.conversationPhase = 1;
            showNeighborConversation(neighbor);
        }
    }, 600);
}

/**
 * Show conversation dialog with options
 */
function showNeighborConversation(neighbor) {
    const m1 = mission1State;
    let text, buttons;

    if (neighbor.mood <= 20) {
        text = `"Go away, Noah! You've been bothering me too much today!"`;
        buttons = `<button class="m1-conv-option" onclick="window.endConversation()">
            "Sorry, I'll come back later..."
        </button>`;
    } else {
        if (neighbor.mood >= 80) {
            text = `"Well hello there, Noah! What can I do for you today?"`;
        } else if (neighbor.mood >= 50) {
            text = `"Oh, hi Noah. What do you need?"`;
        } else {
            text = `"Yes? What is it now?"`;
        }

        buttons = '';
        if (!m1.isMowing) {
            buttons += `<button class="m1-conv-option mow" onclick="window.conversationMow()">
                "Can I mow your lawn?" <span class="price">+$${neighbor.mowPay}</span>
            </button>`;
        }
        buttons += `
            <button class="m1-conv-option lemonade" onclick="window.conversationLemonade()">
                "Would you like to buy some lemonade? My sister Hannah is selling it!"
            </button>
            <button class="m1-conv-option" onclick="window.endConversation()">
                "Never mind, goodbye!"
            </button>
        `;
    }

    showConversationDialog(neighbor, { text, buttons });
}

/**
 * Handle mowing conversation option
 */
export function conversationMow() {
    const m1 = mission1State;
    if (!m1.conversationNeighbor) return;

    const neighbor = m1.conversationNeighbor;
    neighbor.mood -= MISSION1.MOW_MOOD_COST;
    neighbor.askCount++;
    if (neighbor.mood < 0) neighbor.mood = 0;

    hideConversationDialog();
    startMowingMiniGame(neighbor);
    endConversation();
    showNotification(UI_ELEMENTS.M1_NOTIFICATION,
        `Mow all the tall grass! Use WASD to move the mower.`, 3000);
}

/**
 * Handle lemonade conversation option
 */
export function conversationLemonade() {
    const m1 = mission1State;
    if (!m1.conversationNeighbor) return;

    const neighbor = m1.conversationNeighbor;

    // Check if we have lemonade materials
    if (m1.lemonadeMaterials <= 0) {
        hideConversationDialog();
        showNotification(UI_ELEMENTS.M1_NOTIFICATION,
            `Hannah: "We're out of lemonade! Ask Mommy for more supplies!"`, 3000);
        endConversation();
        return;
    }

    neighbor.mood -= MISSION1.LEMONADE_MOOD_COST;
    neighbor.askCount++;

    if (neighbor.mood <= 0) {
        neighbor.mood = 0;
        hideConversationDialog();
        showNotification(UI_ELEMENTS.M1_NOTIFICATION, `${neighbor.name} is too annoyed!`, 2000);
        endConversation();
        return;
    }

    hideConversationDialog();

    // Advance time by 1 hour for the conversation
    advanceTime(60);

    // Start walking to lemonade stand
    neighbor.isWalking = true;
    neighbor.isHome = false;
    neighbor.currentX = neighbor.homeX;
    neighbor.currentZ = neighbor.homeZ - 60;
    m1.walkingNeighbors.push(neighbor);

    endConversation();
    showNotification(UI_ELEMENTS.M1_NOTIFICATION,
        `${neighbor.name}: "Sure, I'd love some lemonade!"`, 2500);
}

/**
 * End conversation
 */
export function endConversation() {
    const m1 = mission1State;
    if (m1.conversationNeighbor) {
        m1.conversationNeighbor.doorOpen = false;
    }
    m1.inConversation = false;
    m1.conversationNeighbor = null;
    m1.conversationPhase = 0;
    hideConversationDialog();
}

/**
 * Show Mommy conversation dialog
 */
export function showMommyConversation() {
    const m1 = mission1State;
    m1.mommy.showingDialog = true;
}

/**
 * Handle buying lemonade materials from Mommy
 */
export function buyLemonadeMaterials() {
    const m1 = mission1State;
    const cost = MISSION1.MOMMY.MATERIALS_COST;

    if (m1.money < cost) {
        showNotification(UI_ELEMENTS.M1_NOTIFICATION,
            `Mommy: "You need $${cost} for more lemonade supplies, sweetie!"`, 2500);
        return false;
    }

    // Deduct money
    m1.money -= cost;

    // Add materials (7-8 lemonades)
    const materialsToAdd = MISSION1.MOMMY.MATERIALS_AMOUNT + (Math.random() < 0.5 ? 1 : 0);
    m1.lemonadeMaterials += materialsToAdd;

    showNotification(UI_ELEMENTS.M1_NOTIFICATION,
        `Mommy: "Here you go! That's enough for ${materialsToAdd} lemonades!" (-$${cost})`, 2500);
    refreshHUD();

    return true;
}

/**
 * Close Mommy dialog
 */
export function closeMommyDialog() {
    mission1State.mommy.showingDialog = false;
}

/**
 * Go to sleep - advance to next day
 */
export function goToSleep() {
    const m1 = mission1State;

    // Hide the tooltip immediately and prevent it from reappearing
    hideTooltip(UI_ELEMENTS.M1_TOOLTIP);
    m1.gameTime.isSleeping = true;

    // Show good night notification
    showNotification(UI_ELEMENTS.M1_NOTIFICATION,
        `Good night, Noah! Day ${m1.gameTime.dayNumber} complete. 🌙`, 2000);

    // Start the sleep cutscene after a brief delay
    setTimeout(() => {
        startSleepCutscene();
        setGameState(GAME_STATES.M1_SLEEP);
    }, 500);
}

/**
 * Update crypto prices when a new day starts
 */
function updateCryptoPricesOnNewDay() {
    const m1 = mission1State;

    // BitCoin: ~15% volatility, +2% trend up
    const spChange = (Math.random() - 0.5) * 0.3 + 0.02; // -15% to +17%
    m1.crypto.spaceCoin.price *= (1 + spChange);
    m1.crypto.spaceCoin.price = Math.max(10, m1.crypto.spaceCoin.price); // Min $10

    // DogeCoin: ~40% volatility, -5% trend down, 5% chance to moon
    if (Math.random() < 0.05) {
        // Moon! 5x value
        m1.crypto.dogeCoin.price *= 5;
        setTimeout(() => {
            showNotification(UI_ELEMENTS.M1_NOTIFICATION,
                "🌙 DOGECOIN TO THE MOON! 🚀 Price 5x!", 4000);
        }, 2800);
    } else {
        const dcChange = (Math.random() - 0.5) * 0.8 - 0.05; // -45% to +35%
        m1.crypto.dogeCoin.price *= (1 + dcChange);
    }
    m1.crypto.dogeCoin.price = Math.max(0.5, m1.crypto.dogeCoin.price); // Min $0.50
}

// ============ ROCKET ASSEMBLY & LAUNCH ============

/**
 * Assemble the rocket (takes 2 hours, requires INT level 10)
 */
export function assembleRocketAction() {
    const m1 = mission1State;

    // Check intelligence requirement (level 10)
    if (m1.stats.intelligence.level < 10) {
        showNotification(UI_ELEMENTS.M1_NOTIFICATION,
            `Need Intelligence Level 10 to build the rocket! (Currently level ${m1.stats.intelligence.level})`, 3000);
        return;
    }

    // Check time (2 hours)
    if (m1.gameTime.hour + 2 > 20) {
        showNotification(UI_ELEMENTS.M1_NOTIFICATION,
            "Not enough time to assemble the rocket! Come back earlier.", 2500);
        return;
    }

    // Advance time
    advanceTime(TIME.MINUTES_PER_ACTIVITY.ROCKET_ASSEMBLY);

    // Assemble the rocket
    assembleRocket();

    showNotification(UI_ELEMENTS.M1_NOTIFICATION,
        "🚀 ROCKET ASSEMBLED! Time to prepare for launch!", 3500);

    refreshHUD();
    saveMission1Progress();
}

/**
 * Show rocket status (not ready yet)
 */
export function showRocketStatus() {
    const m1 = mission1State;

    let missing = [];
    if (m1.stats.stamina.level < 10) {
        missing.push(`Stamina Level 10 (currently ${m1.stats.stamina.level})`);
    }
    if (m1.stats.intelligence.level < 10) {
        missing.push(`Intelligence Level 10 (currently ${m1.stats.intelligence.level})`);
    }

    if (missing.length > 0) {
        showNotification(UI_ELEMENTS.M1_NOTIFICATION,
            `Rocket ready! But you still need: ${missing.join(' and ')} to launch!`, 4000);
    }
}

/**
 * Launch to Mars - trigger victory!
 */
export function launchToMars() {
    showNotification(UI_ELEMENTS.M1_NOTIFICATION,
        "🚀 Calling the family for launch! 🎉", 2000);

    // Return true to indicate launch should happen (handled by main.js)
    return true;
}

// ============ HOME DIALOG ============

/**
 * Open home dialog
 */
export function openHome() {
    const m1 = mission1State;

    // Update button states based on conditions
    const computerBtn = document.getElementById('home-computer-btn');
    const sleepBtn = document.getElementById('home-sleep-btn');

    // Computer: locked if not built
    if (computerBtn) {
        if (m1.computer.isBuilt) {
            computerBtn.classList.remove('locked');
        } else {
            computerBtn.classList.add('locked');
        }
    }

    // Sleep: locked if not dark yet
    if (sleepBtn) {
        if (isGettingDark() || isNightTime()) {
            sleepBtn.classList.remove('locked');
        } else {
            sleepBtn.classList.add('locked');
        }
    }

    const dialog = document.getElementById('m1-home-dialog');
    if (dialog) dialog.classList.add('show');
    mission1State.isActivityOpen = true;
}

/**
 * Close home dialog
 */
export function closeHome() {
    const dialog = document.getElementById('m1-home-dialog');
    if (dialog) dialog.classList.remove('show');
    mission1State.isActivityOpen = false;
}

/**
 * Open computer from home dialog
 */
export function openComputerFromHome() {
    const m1 = mission1State;

    if (!m1.computer.isBuilt) {
        showNotification(UI_ELEMENTS.M1_NOTIFICATION,
            "You need to build a computer first! Buy all the parts from the shop.", 3000);
        return;
    }

    closeHome();
    openComputer();
}

/**
 * Go to sleep from home dialog
 */
export function goToSleepFromHome() {
    if (!isGettingDark() && !isNightTime()) {
        showNotification(UI_ELEMENTS.M1_NOTIFICATION,
            "It's too early to sleep! Come back when it's getting dark.", 2500);
        return;
    }

    closeHome();
    goToSleep();
}

// ============ ACTIVITY FUNCTIONS ============

/**
 * Open library dialog
 */
export function openLibrary() {
    const dialog = document.getElementById('m1-library-dialog');
    if (dialog) dialog.classList.add('show');
    mission1State.isActivityOpen = true;
}

/**
 * Close library dialog
 */
export function closeLibrary() {
    const dialog = document.getElementById('m1-library-dialog');
    if (dialog) dialog.classList.remove('show');
    mission1State.isActivityOpen = false;
}

/**
 * Read books at library (free, +25 INT XP, 2 hours)
 */
export function libraryRead() {
    const m1 = mission1State;

    // Check if enough time (2 hours)
    const hoursNeeded = 2;
    if (m1.gameTime.hour + hoursNeeded > 20) {
        showNotification(UI_ELEMENTS.M1_NOTIFICATION,
            "Not enough time before nightfall! Come back earlier.", 2500);
        return;
    }

    closeLibrary();

    // Advance time
    advanceTime(TIME.MINUTES_PER_ACTIVITY.READING);

    // Add XP
    const result = addIntelligenceXP(STATS.INTELLIGENCE.XP_READING);

    // Show result
    if (result.leveledUp) {
        showNotification(UI_ELEMENTS.M1_NOTIFICATION,
            `📚 +${STATS.INTELLIGENCE.XP_READING} INT XP! LEVEL UP! Intelligence is now ${result.level}!`, 3000);
    } else {
        showNotification(UI_ELEMENTS.M1_NOTIFICATION,
            `📚 You read for 4 hours! +${STATS.INTELLIGENCE.XP_READING} Intelligence XP`, 2500);
    }

    refreshHUD();
    saveMission1Progress();
}

/**
 * Hire a tutor at library ($25, +50 INT XP, 30 min)
 */
export function libraryTutor() {
    const m1 = mission1State;

    // Check if enough money
    if (m1.money < 25) {
        showNotification(UI_ELEMENTS.M1_NOTIFICATION,
            "You need $25 to hire a tutor!", 2500);
        return;
    }

    closeLibrary();

    // Deduct money
    m1.money -= 25;

    // Advance time
    advanceTime(TIME.MINUTES_PER_ACTIVITY.TUTORING);

    // Add XP
    const result = addIntelligenceXP(STATS.INTELLIGENCE.XP_TUTORING);

    // Show result
    if (result.leveledUp) {
        showNotification(UI_ELEMENTS.M1_NOTIFICATION,
            `👨‍🏫 Tutoring complete! +${STATS.INTELLIGENCE.XP_TUTORING} INT XP! LEVEL UP! Intelligence is now ${result.level}! (-$25)`, 3000);
    } else {
        showNotification(UI_ELEMENTS.M1_NOTIFICATION,
            `👨‍🏫 Great tutoring session! +${STATS.INTELLIGENCE.XP_TUTORING} Intelligence XP (-$25)`, 2500);
    }

    refreshHUD();
    saveMission1Progress();
}

/**
 * Open running track dialog
 */
export function openTrack() {
    const dialog = document.getElementById('m1-track-dialog');
    if (dialog) dialog.classList.add('show');
    mission1State.isActivityOpen = true;
}

/**
 * Close running track dialog
 */
export function closeTrack() {
    const dialog = document.getElementById('m1-track-dialog');
    if (dialog) dialog.classList.remove('show');
    mission1State.isActivityOpen = false;
}

/**
 * Start running laps (+50 Stamina XP per lap, 30 min each)
 */
export function startRunning() {
    const m1 = mission1State;

    // Check if enough time for at least one lap
    if (m1.gameTime.hour >= 19 && m1.gameTime.minute > 30) {
        showNotification(UI_ELEMENTS.M1_NOTIFICATION,
            "It's too late to run! Come back earlier.", 2500);
        closeTrack();
        return;
    }

    closeTrack();

    // Run one lap
    advanceTime(TIME.MINUTES_PER_ACTIVITY.RUNNING_LAP);

    // Add XP
    const result = addStaminaXP(STATS.STAMINA.XP_PER_LAP);

    // Show result
    if (result.leveledUp) {
        showNotification(UI_ELEMENTS.M1_NOTIFICATION,
            `🏃 Lap complete! +${STATS.STAMINA.XP_PER_LAP} Stamina XP! LEVEL UP! Stamina is now ${result.level}!`, 3000);
    } else {
        showNotification(UI_ELEMENTS.M1_NOTIFICATION,
            `🏃 Lap complete! +${STATS.STAMINA.XP_PER_LAP} Stamina XP`, 2500);
    }

    refreshHUD();
    saveMission1Progress();
}

/**
 * Open Dad dialog
 */
export function openDadDialog() {
    const m1 = mission1State;

    // Check if house flipping is unlocked (INT 3)
    if (!isHouseFlippingUnlocked()) {
        showNotification(UI_ELEMENTS.M1_NOTIFICATION,
            `Dad: "Want to flip houses with me? You'll need Intelligence level ${STATS.INTELLIGENCE.UNLOCK_HOUSE_FLIP} first. Hit the books, sport!"`, 3500);
        return;
    }

    const dialog = document.getElementById('m1-dad-dialog');
    if (dialog) dialog.classList.add('show');
    mission1State.isActivityOpen = true;
}

/**
 * Close Dad dialog
 */
export function closeDadDialog() {
    const dialog = document.getElementById('m1-dad-dialog');
    if (dialog) dialog.classList.remove('show');
    mission1State.isActivityOpen = false;
}

/**
 * Flip a house with Dad (80% success, +150 INT XP, 6 hours)
 */
export function dadFlipHouse() {
    const m1 = mission1State;

    // Check if enough time (6 hours)
    const hoursNeeded = 6;
    if (m1.gameTime.hour + hoursNeeded > 20) {
        showNotification(UI_ELEMENTS.M1_NOTIFICATION,
            "Not enough time for a house flip today! Come back earlier.", 2500);
        return;
    }

    closeDadDialog();

    // Advance time
    advanceTime(TIME.MINUTES_PER_ACTIVITY.HOUSE_FLIPPING);

    // Always add XP regardless of outcome
    const xpResult = addIntelligenceXP(STATS.INTELLIGENCE.XP_HOUSE_FLIP);

    // Roll for success (60% chance)
    const roll = Math.random();
    const success = roll < 0.6;
    console.log(`House flip roll: ${roll.toFixed(3)}, success: ${success}`);

    if (success) {
        // Random profit between $20 and $100
        const profit = Math.floor(Math.random() * 81) + 20;
        m1.money += profit;

        if (xpResult.leveledUp) {
            showNotification(UI_ELEMENTS.M1_NOTIFICATION,
                `🏠 House flip SUCCESS! +$${profit} +${STATS.INTELLIGENCE.XP_HOUSE_FLIP} INT XP! LEVEL UP to ${xpResult.level}!`, 3500);
        } else {
            showNotification(UI_ELEMENTS.M1_NOTIFICATION,
                `🏠 House flip SUCCESS! Dad's proud! +$${profit} +${STATS.INTELLIGENCE.XP_HOUSE_FLIP} INT XP`, 3000);
        }
    } else {
        // Random loss between $10 and $50
        const loss = Math.floor(Math.random() * 41) + 10;
        m1.money = Math.max(0, m1.money - loss);

        if (xpResult.leveledUp) {
            showNotification(UI_ELEMENTS.M1_NOTIFICATION,
                `🏠 House flip failed... Lost $${loss}, but gained experience! +${STATS.INTELLIGENCE.XP_HOUSE_FLIP} INT XP! LEVEL UP to ${xpResult.level}!`, 3500);
        } else {
            showNotification(UI_ELEMENTS.M1_NOTIFICATION,
                `🏠 House flip failed... Lost $${loss}. Dad: "That's real estate for you!" +${STATS.INTELLIGENCE.XP_HOUSE_FLIP} INT XP`, 3000);
        }
    }

    refreshHUD();
    saveMission1Progress();
}

// ============ COMPUTER & CRYPTO ============

/**
 * Open computer dialog (only if computer is built)
 */
export function openComputer() {
    const m1 = mission1State;

    if (!m1.computer.isBuilt) {
        showNotification(UI_ELEMENTS.M1_NOTIFICATION,
            "You need to build a computer first! Buy all the parts from the shop.", 3000);
        return;
    }

    // Update coding button state based on INT level
    const codingBtn = document.getElementById('coding-btn');
    const codingLock = document.getElementById('coding-lock');
    const canCode = m1.stats.intelligence.level >= STATS.INTELLIGENCE.UNLOCK_CODING;

    if (codingBtn) {
        if (canCode) {
            codingBtn.classList.remove('locked');
        } else {
            codingBtn.classList.add('locked');
        }
    }

    const dialog = document.getElementById('m1-computer-dialog');
    if (dialog) dialog.classList.add('show');
    mission1State.isActivityOpen = true;
}

/**
 * Close computer dialog
 */
export function closeComputer() {
    const dialog = document.getElementById('m1-computer-dialog');
    if (dialog) dialog.classList.remove('show');
    mission1State.isActivityOpen = false;
}

/**
 * Start a coding job (requires INT 4)
 */
export function startCoding() {
    const m1 = mission1State;

    // Check INT requirement
    if (m1.stats.intelligence.level < STATS.INTELLIGENCE.UNLOCK_CODING) {
        showNotification(UI_ELEMENTS.M1_NOTIFICATION,
            `You need Intelligence level ${STATS.INTELLIGENCE.UNLOCK_CODING} to take coding jobs!`, 2500);
        return;
    }

    // Check time (2 hours)
    if (m1.gameTime.hour + 2 > 20) {
        showNotification(UI_ELEMENTS.M1_NOTIFICATION,
            "Not enough time for a coding job! Come back earlier.", 2500);
        return;
    }

    closeComputer();

    // Advance time
    advanceTime(TIME.MINUTES_PER_ACTIVITY.CODING);

    // Random pay $25-50
    const pay = Math.floor(Math.random() * 26) + 25;
    m1.money += pay;

    // Add XP
    const result = addIntelligenceXP(STATS.INTELLIGENCE.XP_CODING);

    // Show result
    if (result.leveledUp) {
        showNotification(UI_ELEMENTS.M1_NOTIFICATION,
            `💻 Coding job complete! +$${pay} +${STATS.INTELLIGENCE.XP_CODING} INT XP! LEVEL UP to ${result.level}!`, 3000);
    } else {
        showNotification(UI_ELEMENTS.M1_NOTIFICATION,
            `💻 Coding job complete! Client happy! +$${pay} +${STATS.INTELLIGENCE.XP_CODING} INT XP`, 2500);
    }

    refreshHUD();
    saveMission1Progress();
}

/**
 * Open crypto trading dialog
 */
export function openCrypto() {
    closeComputer();
    updateCryptoUI();
    const dialog = document.getElementById('m1-crypto-dialog');
    if (dialog) dialog.classList.add('show');
    mission1State.isActivityOpen = true;
}

/**
 * Close crypto trading dialog
 */
export function closeCrypto() {
    const dialog = document.getElementById('m1-crypto-dialog');
    if (dialog) dialog.classList.remove('show');
    mission1State.isActivityOpen = false;
}

/**
 * Update crypto UI with current prices and holdings
 */
function updateCryptoUI() {
    const m1 = mission1State;

    // Balance
    const balanceEl = document.getElementById('crypto-balance');
    if (balanceEl) balanceEl.textContent = m1.money;

    // BitCoin
    const spPriceEl = document.getElementById('spacecoin-price');
    const spOwnedEl = document.getElementById('spacecoin-owned');
    if (spPriceEl) spPriceEl.textContent = m1.crypto.spaceCoin.price.toFixed(2);
    if (spOwnedEl) spOwnedEl.textContent = m1.crypto.spaceCoin.owned;

    // DogeCoin
    const dcPriceEl = document.getElementById('dogecoin-price');
    const dcOwnedEl = document.getElementById('dogecoin-owned');
    if (dcPriceEl) dcPriceEl.textContent = m1.crypto.dogeCoin.price.toFixed(2);
    if (dcOwnedEl) dcOwnedEl.textContent = m1.crypto.dogeCoin.owned;
}

/**
 * Buy crypto
 */
export function buyCrypto(coin) {
    const m1 = mission1State;
    // Map lowercase input to camelCase state keys
    const coinKey = coin === 'spacecoin' ? 'spaceCoin' : 'dogeCoin';
    const crypto = m1.crypto[coinKey];

    if (!crypto) return;

    const price = Math.floor(crypto.price);
    if (m1.money < price) {
        showNotification(UI_ELEMENTS.M1_NOTIFICATION,
            `Not enough money! ${coin === 'spacecoin' ? 'BitCoin' : 'DogeCoin'} costs $${price}`, 2000);
        return;
    }

    m1.money -= price;
    crypto.owned++;
    updateCryptoUI();
    refreshHUD();
    saveMission1Progress();

    const coinName = coin === 'spacecoin' ? '₿ BitCoin' : '🐕 DogeCoin';
    showNotification(UI_ELEMENTS.M1_NOTIFICATION,
        `Bought 1 ${coinName} for $${price}!`, 1500);
}

/**
 * Sell crypto
 */
export function sellCrypto(coin) {
    const m1 = mission1State;
    // Map lowercase input to camelCase state keys
    const coinKey = coin === 'spacecoin' ? 'spaceCoin' : 'dogeCoin';
    const crypto = m1.crypto[coinKey];

    if (!crypto || crypto.owned <= 0) {
        showNotification(UI_ELEMENTS.M1_NOTIFICATION,
            `You don't own any ${coin === 'spacecoin' ? 'BitCoin' : 'DogeCoin'}!`, 2000);
        return;
    }

    const price = Math.floor(crypto.price);
    crypto.owned--;
    m1.money += price;
    updateCryptoUI();
    refreshHUD();
    saveMission1Progress();

    const coinName = coin === 'spacecoin' ? '₿ BitCoin' : '🐕 DogeCoin';
    showNotification(UI_ELEMENTS.M1_NOTIFICATION,
        `Sold 1 ${coinName} for $${price}!`, 1500);
}

/**
 * Start mowing mini-game
 */
function startMowingMiniGame(neighbor) {
    const m1 = mission1State;
    const lawn = m1.mowingLawn;

    m1.isMowing = true;
    m1.mowingMiniGame = true;
    m1.mowingProgress = 0;
    m1.currentMowingNeighbor = neighbor;

    const house = m1.houses.find(h => h.owner === neighbor);
    lawn.originalNoahPos = { x: noah.x, z: noah.z };
    lawn.houseX = house ? house.x : neighbor.homeX;
    lawn.houseZ = house ? house.z : neighbor.homeZ;
    lawn.grassTiles = [];
    lawn.cutTiles = 0;

    const startX = lawn.houseX - (lawn.lawnWidth * lawn.tileSize) / 2;
    const startZ = lawn.houseZ - 70 - lawn.lawnHeight * lawn.tileSize;

    for (let row = 0; row < lawn.lawnHeight; row++) {
        for (let col = 0; col < lawn.lawnWidth; col++) {
            lawn.grassTiles.push({
                x: startX + col * lawn.tileSize,
                z: startZ + row * lawn.tileSize,
                cut: false,
                grassHeight: MISSION1.MOWING.MIN_GRASS_HEIGHT +
                    Math.random() * (MISSION1.MOWING.MAX_GRASS_HEIGHT - MISSION1.MOWING.MIN_GRASS_HEIGHT),
            });
        }
    }

    lawn.totalTiles = lawn.grassTiles.length;
    lawn.mowerX = startX;
    lawn.mowerZ = startZ;
    lawn.mowerAngle = 0;
}

/**
 * Handle Niam dialog click
 */
export function handleNiamClick(mouseX, mouseY, width, height) {
    const m1 = mission1State;
    if (!m1.niam.showingDialog) return false;

    const btn1Y = height / 2 + 20;
    const btn2Y = height / 2 + 75;

    // Play button
    if (mouseY > btn1Y - 20 && mouseY < btn1Y + 20 &&
        mouseX > width / 2 - 190 && mouseX < width / 2 + 190) {
        m1.money = Math.max(0, m1.money - MISSION1.NIAM.PLAY_COST);
        closeNiamDialog();
        refreshHUD();
        return true;
    }

    // Decline button
    if (mouseY > btn2Y - 20 && mouseY < btn2Y + 20 &&
        mouseX > width / 2 - 190 && mouseX < width / 2 + 190) {
        closeNiamDialog();
        return true;
    }

    return false;
}

function closeNiamDialog() {
    const m1 = mission1State;
    m1.niam.showingDialog = false;
    m1.niam.isApproaching = false;
    m1.niam.lastApproachTime = 0; // Use frameCount in caller
}

/**
 * Open tech shop (rocket parts and computer parts)
 */
export function openRocketShop() {
    const m1 = mission1State;
    m1.isShopOpen = true;
    hidePrompt();
    showShop(m1.rocketParts, m1.money, m1.computer.parts, areRocketPartsUnlocked());
}

/**
 * Close tech shop
 */
export function closeRocketShop() {
    mission1State.isShopOpen = false;
    hideShop();
}

/**
 * Buy rocket part
 */
export function buyPartAction(partKey) {
    const m1 = mission1State;
    if (buyRocketPart(partKey)) {
        const part = m1.rocketParts[partKey];
        showNotification(UI_ELEMENTS.M1_NOTIFICATION, `Bought ${part.name}! ${part.icon}`, 2000);
        refreshHUD();
        showShop(m1.rocketParts, m1.money, m1.computer.parts, areRocketPartsUnlocked()); // Refresh

        if (allRocketPartsOwned()) {
            return true; // Victory!
        }
    }
    return false;
}

/**
 * Buy computer part
 */
export function buyComputerPart(partKey) {
    const m1 = mission1State;
    const part = m1.computer.parts[partKey];

    if (!part || part.owned) return false;
    if (m1.money < part.price) {
        showNotification(UI_ELEMENTS.M1_NOTIFICATION, `Not enough money! Need $${part.price}`, 2000);
        return false;
    }

    // Purchase
    m1.money -= part.price;
    part.owned = true;

    showNotification(UI_ELEMENTS.M1_NOTIFICATION, `Bought ${part.name}! ${part.icon}`, 2000);
    refreshHUD();
    showShop(m1.rocketParts, m1.money, m1.computer.parts, areRocketPartsUnlocked()); // Refresh
    saveMission1Progress();

    // Check if all computer parts are owned
    const allOwned = Object.values(m1.computer.parts).every(p => p.owned);
    if (allOwned) {
        m1.computer.isBuilt = true;
        showNotification(UI_ELEMENTS.M1_NOTIFICATION,
            "Computer complete! You can now code and trade crypto at home!", 3500);
    }

    return true;
}

// ============ RENDERING ============

/**
 * Get sky color based on time of day
 */
function getSkyColor(hour, minute) {
    const timeInHours = hour + minute / 60;

    // Night (8 PM - 6 AM)
    if (timeInHours >= 20 || timeInHours < 6) {
        return [25, 25, 50]; // Dark blue night sky
    }
    // Sunrise (6 AM - 8 AM)
    else if (timeInHours >= 6 && timeInHours < 8) {
        const t = (timeInHours - 6) / 2; // 0 to 1 over 2 hours
        return [
            Math.floor(25 + t * 110),  // 25 -> 135
            Math.floor(25 + t * 181),  // 25 -> 206
            Math.floor(50 + t * 185),  // 50 -> 235
        ];
    }
    // Day (8 AM - 6 PM)
    else if (timeInHours >= 8 && timeInHours < 18) {
        return [135, 206, 235]; // Bright sky blue
    }
    // Sunset (6 PM - 8 PM)
    else {
        const t = (timeInHours - 18) / 2; // 0 to 1 over 2 hours
        return [
            Math.floor(135 + t * 85),   // 135 -> 220 (orange tint)
            Math.floor(206 - t * 106),  // 206 -> 100
            Math.floor(235 - t * 135),  // 235 -> 100
        ];
    }
}

/**
 * Get sun/moon position based on time
 * Returns {x, y, visible, isMoon}
 */
function getSunPosition(hour, minute) {
    const timeInHours = hour + minute / 60;

    // Sun rises at 6 AM, sets at 8 PM (14 hour arc)
    if (timeInHours >= 6 && timeInHours < 20) {
        const dayProgress = (timeInHours - 6) / 14; // 0 at 6 AM, 1 at 8 PM
        const angle = dayProgress * Math.PI; // 0 to PI for arc
        return {
            x: -400 + dayProgress * 800, // Moves from left to right
            y: -150 - Math.sin(angle) * 100, // Arc higher at noon
            visible: true,
            isMoon: false,
        };
    }
    // Moon at night
    else {
        // Moon rises at 8 PM, sets at 6 AM (10 hour arc)
        let nightProgress;
        if (timeInHours >= 20) {
            nightProgress = (timeInHours - 20) / 10;
        } else {
            nightProgress = (timeInHours + 4) / 10; // Continue from midnight
        }
        const angle = nightProgress * Math.PI;
        return {
            x: -300 + nightProgress * 600,
            y: -180 - Math.sin(angle) * 80,
            visible: true,
            isMoon: true,
        };
    }
}

/**
 * Get ambient light intensity based on time
 */
function getAmbientLight(hour) {
    if (hour >= 20 || hour < 6) return 40; // Night
    if (hour >= 6 && hour < 8) return 60 + (hour - 6) * 20; // Sunrise
    if (hour >= 18 && hour < 20) return 100 - (hour - 18) * 30; // Sunset
    return 100; // Day
}

/**
 * Draw Mission 1 scene
 */
export function drawMission1Scene(p) {
    const m1 = mission1State;

    // Dynamic sky based on time
    const skyColor = getSkyColor(m1.gameTime.hour, m1.gameTime.minute);
    p.background(...skyColor);

    // Camera - viewing from south, houses face south toward camera
    if (m1.inConversation && m1.conversationNeighbor) {
        const n = m1.conversationNeighbor;
        m1.cameraPos.x = p.lerp(m1.cameraPos.x, n.homeX, 0.1);
        m1.cameraPos.z = p.lerp(m1.cameraPos.z, n.homeZ - 150, 0.1);
        // Look at front of house (door facing south)
        p.camera(m1.cameraPos.x, -200, m1.cameraPos.z, n.homeX, -30, n.homeZ - 30, 0, 1, 0);
    } else {
        p.camera(noah.x, -400, noah.z - 350, noah.x, 0, noah.z, 0, 1, 0);
    }

    // Dynamic lighting based on time
    const ambientIntensity = getAmbientLight(m1.gameTime.hour);
    p.ambientLight(ambientIntensity);

    // Get sun/moon position
    const celestial = getSunPosition(m1.gameTime.hour, m1.gameTime.minute);

    if (celestial.isMoon) {
        // Moonlight - cooler, dimmer
        p.directionalLight(80, 80, 120, 0, 0.7, 0.5);
        p.directionalLight(30, 30, 50, 0, 0.8, -0.3);
    } else {
        // Sunlight - warm and bright
        const sunIntensity = ambientIntensity * 2;
        p.directionalLight(sunIntensity, sunIntensity * 0.95, sunIntensity * 0.85, 0, 0.7, 0.5);
        p.directionalLight(ambientIntensity * 0.8, ambientIntensity * 0.8, ambientIntensity, 0, 0.8, -0.3);
    }

    // Draw sun or moon
    if (celestial.visible) {
        p.push();
        p.translate(celestial.x, celestial.y, -200);
        if (celestial.isMoon) {
            // Moon - pale silver/yellow
            p.fill(255, 255, 220);
            p.sphere(25);
            p.fill(255, 255, 240, 80);
            p.sphere(35);
        } else {
            // Sun - bright yellow with glow
            p.fill(255, 255, 150);
            p.sphere(30);
            p.fill(255, 255, 200, 100);
            p.sphere(40);
            // Extra glow during sunrise/sunset
            if (m1.gameTime.hour < 8 || m1.gameTime.hour >= 18) {
                p.fill(255, 200, 100, 60);
                p.sphere(55);
            }
        }
        p.pop();
    }

    // Ground
    p.push();
    p.translate(0, 1, 0);  // Push ground down slightly to prevent z-fighting with track
    p.rotateX(p.HALF_PI);
    p.fill(...COLORS.M1_GRASS);
    p.plane(1200, 1000);
    p.pop();

    // Grass texture
    drawGrassTexture(p);

    // Draw scene elements
    drawM1Roads(p);
    drawM1Lake(p, m1.lake);
    m1.houses.forEach(house => drawM1House(p, house));
    m1.trees.forEach(tree => drawM1Tree(p, tree));
    m1.flowers.forEach(flower => drawM1Flower(p, flower));
    drawLemonadeStand(p, m1.lemonadeStand);
    drawRocketShop(p, m1.rocketShop);
    drawLaunchPad(p);

    // Draw new locations
    drawLibrary(p, m1.library);
    drawRunningTrack(p, m1.runningTrack);
    drawPark(p);

    // Draw Dad and Sedan (only during daytime - Dad goes inside at 8 PM)
    const isCurfew = isNightTime();
    if (!isCurfew) {
        drawDadAndSedan(p, m1.dad, m1.sedan);
    } else {
        // Just draw the sedan at night (Dad is inside)
        drawSedanOnly(p, m1.sedan);
    }

    // Draw NPCs (only show when door is open/talking, or walking to/at lemonade stand)
    // Hide all neighbors after 8 PM (they're inside)
    if (!isCurfew) {
        m1.neighbors.forEach(neighbor => {
            if (neighbor.doorOpen || neighbor.isWalking || neighbor.isDrinking || neighbor.atLemonade) {
                drawNeighbor(p, neighbor);
            }
        });
    }

    // Draw Noah
    drawM1Noah(p);

    // Draw Niam (only during daytime)
    if (!isCurfew && (m1.niam.isApproaching || m1.niam.showingDialog)) {
        drawNiam(p, {
            x: m1.niam.x,
            z: m1.niam.z,
            isApproaching: m1.niam.isApproaching,
            noahX: noah.x,
            noahZ: noah.z,
        });
    }

    // Draw Mommy (only during daytime - she goes inside at 8 PM)
    if (!isCurfew) {
        drawMommy(p, { x: m1.mommy.x, z: m1.mommy.z });
    }

    // Show/hide Mommy dialog (HTML-based)
    const mommyDialog = document.getElementById('m1-mommy-dialog');
    if (mommyDialog) {
        if (m1.mommy.showingDialog) {
            mommyDialog.classList.add('show');
        } else {
            mommyDialog.classList.remove('show');
        }
    }

    // Show/hide Niam dialog (HTML-based)
    const niamDialog = document.getElementById('m1-niam-dialog');
    if (niamDialog) {
        if (m1.niam.showingDialog) {
            niamDialog.classList.add('show');
        } else {
            niamDialog.classList.remove('show');
        }
    }
}

/**
 * Draw mowing mini-game
 */
export function drawMowingMiniGame(p) {
    const m1 = mission1State;
    const lawn = m1.mowingLawn;

    // Clear background to prevent smearing
    p.background(135, 206, 235);  // Sky blue

    // Camera looking at lawn from the front (flipped view)
    const lawnCenterZ = lawn.houseZ - 70 - (lawn.lawnHeight * lawn.tileSize) / 2;
    p.camera(lawn.houseX, -280, lawnCenterZ - 120, lawn.houseX, 0, lawnCenterZ, 0, 0, -1);

    // Lighting
    p.ambientLight(120);
    p.directionalLight(255, 255, 200, 0.5, 1, -0.3);

    // Lawn base
    p.push();
    p.translate(lawn.houseX, 0.5, lawnCenterZ);
    p.rotateX(p.HALF_PI);
    p.fill(80, 160, 80);
    p.plane(lawn.lawnWidth * lawn.tileSize + 60, lawn.lawnHeight * lawn.tileSize + 60);
    p.pop();

    // Grass tiles
    for (const tile of lawn.grassTiles) {
        if (!tile.cut) {
            drawGrassTile(p, tile);
        }
    }

    // Mower with Noah
    drawMower(p, lawn);

    // House background (at the top of the view now)
    p.push();
    p.translate(lawn.houseX, 0, lawn.houseZ + 20);
    p.rotateY(p.PI); // Face toward camera
    p.fill(220, 200, 180);
    p.push();
    p.translate(0, -30, 0);
    p.box(80, 60, 60);
    p.pop();
    p.fill(139, 69, 19);
    p.push();
    p.translate(-22, -75, 0);
    p.rotateZ(-0.6);
    p.box(50, 5, 68);
    p.pop();
    p.push();
    p.translate(22, -75, 0);
    p.rotateZ(0.6);
    p.box(50, 5, 68);
    p.pop();
    p.pop();

    // Progress bar
    drawMowingProgressBar(p, lawn);
}

function drawGrassTile(p, tile) {
    p.push();
    p.translate(tile.x, 0, tile.z);
    for (let i = 0; i < 5; i++) {
        p.push();
        p.translate((i % 3 - 1) * 5, -tile.grassHeight / 2, (Math.floor(i / 3) - 0.5) * 4);
        p.rotateZ(Math.sin(p.frameCount * ANIMATION.MOWER_GRASS_SWAY + i + tile.x * 0.05) * 0.12);
        p.fill(20 + i * 8, 100 + i * 15, 20);
        p.box(3, tile.grassHeight, 3);
        p.translate(0, -tile.grassHeight / 2 - 2, 0);
        p.fill(40, 130, 40);
        p.cone(2, 5);
        p.pop();
    }
    p.pop();
}

function drawMower(p, lawn) {
    // Draw mower (rotates with direction)
    p.push();
    p.translate(lawn.mowerX, 0, lawn.mowerZ);
    p.rotateY(lawn.mowerAngle);

    // Mower body
    p.fill(220, 50, 50);
    p.push();
    p.translate(0, -10, 0);
    p.box(24, 12, 30);
    p.pop();

    // Deck
    p.fill(60);
    p.push();
    p.translate(0, -3, 0);
    p.box(28, 4, 34);
    p.pop();

    // Wheels
    p.fill(30);
    for (const wx of [-12, 12]) {
        for (const wz of [-12, 12]) {
            p.push();
            p.translate(wx, -5, wz);
            p.rotateZ(p.HALF_PI);
            p.cylinder(5, 4);
            p.pop();
        }
    }

    // Handle (extends toward Noah)
    p.fill(100);
    p.push();
    p.translate(0, -18, 20);
    p.rotateX(-0.4);
    p.box(4, 25, 4);
    p.pop();
    p.fill(40);
    p.push();
    p.translate(0, -32, 28);
    p.box(30, 4, 4);
    p.pop();

    // Draw Noah holding the handle (relative to mower, so he rotates with it)
    p.push();
    p.translate(0, 0, 40);  // Position behind mower (in mower's local space)

    const legSwing = Math.sin(p.frameCount * ANIMATION.WALK_CYCLE) * 0.4;

    // Legs
    p.fill(50, 50, 150);
    p.push();
    p.translate(-5, -8, 0);
    p.rotateX(-legSwing);  // Reversed to walk forward
    p.box(5, 16, 5);
    p.pop();
    p.push();
    p.translate(5, -8, 0);
    p.rotateX(legSwing);
    p.box(5, 16, 5);
    p.pop();

    // Body
    p.fill(0, 100, 255);
    p.push();
    p.translate(0, -25, 0);
    p.box(16, 22, 12);
    p.pop();

    // Arms reaching forward to hold handle
    p.fill(255, 220, 180);
    p.push();
    p.translate(-10, -28, -10);
    p.rotateX(-0.6);  // Arms reaching forward
    p.box(4, 18, 4);
    p.pop();
    p.push();
    p.translate(10, -28, -10);
    p.rotateX(-0.6);
    p.box(4, 18, 4);
    p.pop();

    // Head
    p.push();
    p.translate(0, -42, 0);
    p.sphere(9);
    p.fill(255, 220, 0);
    p.translate(0, -5, 0);
    p.box(18, 7, 16);
    p.pop();

    p.pop();  // End Noah

    p.pop();  // End mower
}

function drawMowingProgressBar(p, lawn) {
    const lawnCenterZ = lawn.houseZ - 70 - (lawn.lawnHeight * lawn.tileSize) / 2;
    p.push();
    p.translate(lawn.houseX, -100, lawnCenterZ - 100);
    p.fill(50);
    p.box(160, 18, 4);
    const progressWidth = (lawn.cutTiles / lawn.totalTiles) * 155;
    p.fill(0, 220, 0);
    p.push();
    p.translate(-77.5 + progressWidth / 2, 0, 2);
    p.box(progressWidth, 14, 3);
    p.pop();
    p.pop();
}

function drawM1Noah(p) {
    const m1 = mission1State;

    p.push();
    if (m1.inConversation && m1.conversationNeighbor) {
        const n = m1.conversationNeighbor;
        p.translate(n.homeX, 0, n.homeZ - 90);
        // Face toward house (north, away from camera)
        p.rotateY(0);  // Default facing is +Z (north)
    } else {
        p.translate(noah.x, 0, noah.z);
        p.rotateY(noah.angle);
    }

    // Body
    p.fill(0, 100, 255);
    p.push();
    p.translate(0, -18, 0);
    p.box(14, 22, 10);
    p.pop();

    // Head
    p.push();
    p.translate(0, -35, 0);
    p.fill(255, 220, 180);
    p.sphere(8);
    p.fill(255, 220, 0);
    p.translate(0, -4, 0);
    p.box(17, 6, 16);
    p.pop();

    // Legs
    const legSwing = Math.sin(p.frameCount * ANIMATION.LEG_SWING) * 0.3;
    p.fill(50, 50, 150);
    p.push();
    p.translate(-4, -4, 0);
    p.rotateX(legSwing);
    p.box(5, 14, 5);
    p.pop();
    p.push();
    p.translate(4, -4, 0);
    p.rotateX(-legSwing);
    p.box(5, 14, 5);
    p.pop();

    // Arms
    const armSwing = Math.sin(p.frameCount * ANIMATION.ARM_SWING + p.PI) * 0.4;
    p.fill(255, 220, 180);
    p.push();
    p.translate(-10, -20, 0);
    p.rotateX(armSwing);
    p.box(4, 14, 4);
    p.pop();
    p.push();
    p.translate(10, -20, 0);
    p.rotateX(-armSwing);
    p.box(4, 14, 4);
    p.pop();

    p.pop();
}

function drawGrassTexture(p) {
    const m1 = mission1State;
    if (!m1.grassTexture) return;

    // Get track bounds to exclude patches from track area
    const track = m1.runningTrack;
    const trackRadiusX = track ? track.lapRadius * 1.3 : 0;
    const trackRadiusZ = track ? track.lapRadius * 1.05 : 0;

    // Draw color variation patches (simple flat ellipses)
    for (const patch of m1.grassTexture.patches) {
        // Skip patches in the track area
        if (track) {
            const dx = patch.x - track.x;
            const dz = patch.z - track.z;
            if ((dx * dx) / (trackRadiusX * trackRadiusX) + (dz * dz) / (trackRadiusZ * trackRadiusZ) < 1) {
                continue;  // Inside track ellipse, skip
            }
        }
        p.push();
        p.translate(patch.x, -0.2, patch.z);
        p.rotateX(p.HALF_PI);
        p.fill(
            COLORS.M1_GRASS[0] + patch.shade,
            COLORS.M1_GRASS[1] + patch.shade,
            COLORS.M1_GRASS[2] + patch.shade,
            100
        );
        p.noStroke();
        p.ellipse(0, 0, patch.size, patch.size * 0.7);
        p.pop();
    }

    // Draw dirt spots
    for (const dirt of m1.grassTexture.dirtSpots) {
        // Skip dirt in the track area
        if (track) {
            const dx = dirt.x - track.x;
            const dz = dirt.z - track.z;
            if ((dx * dx) / (trackRadiusX * trackRadiusX) + (dz * dz) / (trackRadiusZ * trackRadiusZ) < 1) {
                continue;  // Inside track ellipse, skip
            }
        }
        p.push();
        p.translate(dirt.x, -0.15, dirt.z);
        p.rotateX(p.HALF_PI);
        p.fill(139, 119, 101, 150);
        p.noStroke();
        p.ellipse(0, 0, dirt.size, dirt.size * 0.8);
        p.pop();
    }
}

function drawM1Roads(p) {
    const roadWidth = 50;
    const roadY = -0.3;
    const roadLength = 970;   // From west end (-450) to tech shop (520)
    const roadCenterX = 35;   // Centered between -450 and 520
    const roadZ = 80;

    // Main straight road (Belle Pond Avenue)
    p.push();
    p.translate(roadCenterX, roadY, roadZ);
    p.rotateX(p.HALF_PI);

    // Road base (dark asphalt edge)
    p.fill(40, 40, 45);
    p.box(roadLength + 8, roadWidth + 8, 1);

    // Road surface (asphalt)
    p.fill(60, 60, 65);
    p.translate(0, 0, -0.3);
    p.box(roadLength, roadWidth, 0.5);

    // Subtle surface variation
    p.fill(55, 55, 60);
    p.translate(0, 0, -0.2);
    p.box(roadLength - 10, roadWidth - 10, 0.3);

    // White edge lines (both sides)
    p.fill(240, 240, 240);
    p.translate(0, -roadWidth / 2 + 3, -0.3);
    p.box(roadLength - 4, 2.5, 0.3);
    p.translate(0, roadWidth - 6, 0);
    p.box(roadLength - 4, 2.5, 0.3);

    // Yellow center dashed line
    p.fill(255, 210, 50);
    const dashLength = 20;
    const dashGap = 15;
    const numDashes = Math.floor(roadLength / (dashLength + dashGap));
    const startX = -roadLength / 2 + dashLength / 2 + 10;
    for (let d = 0; d < numDashes; d++) {
        p.push();
        p.translate(startX + d * (dashLength + dashGap), -roadWidth / 2 + 3, -0.1);
        p.box(dashLength, 3, 0.3);
        p.pop();
    }

    p.pop();

    // Perpendicular road to library and track (from main road going south/front)
    const libraryRoadWidth = 40;
    const libraryRoadLength = 400;  // Extended: from main road (Z:80) past library to track (Z:-320)
    p.push();
    p.translate(-200, roadY, 80 - libraryRoadLength / 2 - roadWidth / 2);
    p.rotateX(p.HALF_PI);

    // Road base (dark asphalt edge)
    p.fill(40, 40, 45);
    p.box(libraryRoadWidth + 6, libraryRoadLength + 6, 1);

    // Road surface (asphalt)
    p.fill(60, 60, 65);
    p.translate(0, 0, -0.3);
    p.box(libraryRoadWidth, libraryRoadLength, 0.5);

    // Subtle surface variation
    p.fill(55, 55, 60);
    p.translate(0, 0, -0.2);
    p.box(libraryRoadWidth - 8, libraryRoadLength - 8, 0.3);

    // White edge lines
    p.fill(240, 240, 240);
    p.translate(-libraryRoadWidth / 2 + 3, 0, -0.3);
    p.box(2.5, libraryRoadLength - 4, 0.3);
    p.translate(libraryRoadWidth - 6, 0, 0);
    p.box(2.5, libraryRoadLength - 4, 0.3);

    // Yellow center dashes
    p.fill(255, 200, 0);
    const libDashLen = 10;
    const libDashGap = 8;
    const libNumDashes = Math.floor(libraryRoadLength / (libDashLen + libDashGap));
    p.translate(-libraryRoadWidth / 2 + 3, -libraryRoadLength / 2 + libDashLen, -0.1);
    for (let i = 0; i < libNumDashes; i++) {
        p.push();
        p.translate(0, i * (libDashLen + libDashGap), 0);
        p.box(2, libDashLen, 0.3);
        p.pop();
    }

    p.pop();

    // ============ Launch Pad Road (east side, near tech shop) ============
    const launchRoadWidth = 40;
    const launchRoadLength = 235;  // From main road (Z:80) to edge of launch pad (stops at pad edge)
    const launchRoadX = 450;
    p.push();
    p.translate(launchRoadX, roadY, 80 - launchRoadLength / 2 - roadWidth / 2);
    p.rotateX(p.HALF_PI);

    // Road base (dark asphalt edge)
    p.fill(40, 40, 45);
    p.box(launchRoadWidth + 6, launchRoadLength + 6, 1);

    // Road surface (asphalt)
    p.fill(60, 60, 65);
    p.translate(0, 0, -0.3);
    p.box(launchRoadWidth, launchRoadLength, 0.5);

    // Subtle surface variation
    p.fill(55, 55, 60);
    p.translate(0, 0, -0.2);
    p.box(launchRoadWidth - 8, launchRoadLength - 8, 0.3);

    // White edge lines
    p.fill(240, 240, 240);
    p.translate(-launchRoadWidth / 2 + 3, 0, -0.3);
    p.box(2.5, launchRoadLength - 4, 0.3);
    p.translate(launchRoadWidth - 6, 0, 0);
    p.box(2.5, launchRoadLength - 4, 0.3);

    // Yellow center dashes
    p.fill(255, 200, 0);
    const padDashLen = 10;
    const padDashGap = 8;
    const padNumDashes = Math.floor(launchRoadLength / (padDashLen + padDashGap));
    p.translate(-launchRoadWidth / 2 + 3, -launchRoadLength / 2 + padDashLen, -0.1);
    for (let i = 0; i < padNumDashes; i++) {
        p.push();
        p.translate(0, i * (padDashLen + padDashGap), 0);
        p.box(2, padDashLen, 0.3);
        p.pop();
    }

    p.pop();
}

function drawM1Lake(p, lake) {
    p.push();
    p.translate(lake.x, -1, lake.z);
    p.fill(30, 100, 180, 200);
    p.rotateX(p.HALF_PI);
    p.ellipse(0, 0, lake.width, lake.height);
    p.fill(60, 140, 210, 180);
    p.ellipse(0, 10, lake.width * 0.6, lake.height * 0.5);
    p.pop();

    // Shore
    p.push();
    p.translate(lake.x, -0.3, lake.z - 30);
    p.fill(210, 180, 140);
    p.rotateX(p.HALF_PI);
    p.ellipse(0, 0, lake.width + 40, 60);
    p.pop();
}

/**
 * Draw the Launch Pad area
 */
function drawLaunchPad(p) {
    const m1 = mission1State;
    const padX = m1.launchPad.x;
    const padZ = m1.launchPad.z;
    const padRadius = 50;
    const padY = -2;  // Raise pad well above road level to fully overlay and hide road

    p.push();
    p.translate(padX, padY, padZ);

    // ============ Concrete Base Platform ============
    // Outer ring (dark concrete edge)
    p.fill(70, 70, 75);
    p.push();
    p.translate(0, -0.3, 0);
    p.rotateX(p.HALF_PI);
    p.ellipse(0, 0, padRadius * 2 + 10, padRadius * 2 + 10, 32);
    p.pop();

    // Main concrete pad
    p.fill(100, 100, 105);
    p.push();
    p.translate(0, -0.2, 0);
    p.rotateX(p.HALF_PI);
    p.ellipse(0, 0, padRadius * 2, padRadius * 2, 32);
    p.pop();

    // Inner darker circle (rocket placement area)
    p.fill(60, 60, 65);
    p.push();
    p.translate(0, -0.1, 0);
    p.rotateX(p.HALF_PI);
    p.ellipse(0, 0, 40, 40, 24);
    p.pop();

    // ============ Yellow/Black Hazard Stripes ============
    const stripeCount = 16;
    for (let i = 0; i < stripeCount; i++) {
        if (i % 2 === 0) {
            p.fill(255, 200, 0);
        } else {
            p.fill(30, 30, 30);
        }
        p.push();
        const angle = (i / stripeCount) * p.TWO_PI;
        const stripeX = Math.cos(angle) * (padRadius - 5);
        const stripeZ = Math.sin(angle) * (padRadius - 5);
        p.translate(stripeX, -0.05, stripeZ);
        p.rotateY(-angle + p.HALF_PI);
        p.box(8, 2, 3);
        p.pop();
    }

    // ============ Launch Pad Sign ============
    // Sign post
    p.fill(80, 80, 85);
    p.push();
    p.translate(0, 20, padRadius + 30);
    p.box(4, 40, 4);
    p.pop();

    // Sign board
    p.fill(40, 60, 100);
    p.push();
    p.translate(0, 35, padRadius + 30);
    p.box(60, 20, 3);
    p.pop();

    // Sign text backing (orange/yellow)
    p.fill(255, 140, 0);
    p.push();
    p.translate(0, 35, padRadius + 28);
    p.box(55, 15, 1);
    p.pop();

    // ============ Fence/Barrier Posts ============
    p.fill(100, 100, 100);
    const fenceRadius = padRadius + 15;
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * p.TWO_PI;
        // Skip front area for road access
        if (Math.abs(angle - p.HALF_PI) < 0.5) continue;

        const fenceX = Math.cos(angle) * fenceRadius;
        const fenceZ = Math.sin(angle) * fenceRadius;
        p.push();
        p.translate(fenceX, 8, fenceZ);
        p.box(3, 16, 3);
        // Red warning light on top
        p.fill(255, 50, 50);
        p.translate(0, 10, 0);
        p.sphere(2);
        p.fill(100, 100, 100);
        p.pop();
    }

    // ============ Flood Lights (corners) ============
    const lightPositions = [
        { x: -fenceRadius, z: -fenceRadius },
        { x: fenceRadius, z: -fenceRadius },
    ];
    for (const pos of lightPositions) {
        p.push();
        p.translate(pos.x, 0, pos.z);
        // Light pole
        p.fill(60, 60, 65);
        p.push();
        p.translate(0, 25, 0);
        p.box(4, 50, 4);
        p.pop();
        // Light fixture
        p.fill(255, 250, 200);
        p.push();
        p.translate(0, 52, 0);
        p.rotateX(p.PI / 6);
        p.box(12, 6, 8);
        p.pop();
        p.pop();
    }

    // ============ Rocket Visualization Based on State ============
    drawRocketOnPad(p);

    p.pop();
}

/**
 * Draw the rocket on the launch pad based on current state
 */
function drawRocketOnPad(p) {
    const hasAnyParts = anyRocketPartsOwned();
    const hasAllParts = allRocketPartsOwned();
    const isAssembled = isRocketAssembled();
    const isReady = isReadyToLaunch();
    const partsCount = getOwnedRocketPartsCount();

    if (!hasAnyParts) {
        // Empty pad - show ghost outline of rocket
        drawRocketGhostOutline(p);
    } else if (!hasAllParts) {
        // Partial parts - show scattered parts
        drawPartialRocketParts(p, partsCount);
    } else if (!isAssembled) {
        // All parts ready to assemble - show parts with assembly indicator
        drawUnassembledRocket(p);
    } else {
        // Rocket assembled - show full rocket
        drawAssembledRocket(p, isReady);
    }
}

/**
 * Draw a faint ghost outline of where the rocket will be
 */
function drawRocketGhostOutline(p) {
    p.push();
    p.stroke(100, 120, 150, 80);
    p.strokeWeight(2);
    p.noFill();

    // Ghost body outline
    p.translate(0, 40, 0);
    p.box(20, 60, 20);

    // Ghost nose cone
    p.translate(0, 40, 0);
    p.cone(12, 25, 8);

    p.noStroke();
    p.pop();
}

/**
 * Draw partial rocket parts scattered on pad
 */
function drawPartialRocketParts(p, partsCount) {
    const m1 = mission1State;
    const parts = m1.rocketParts;

    // Engine
    if (parts.engine?.owned) {
        p.push();
        p.translate(-15, 10, -10);
        p.fill(80, 80, 85);
        p.cylinder(8, 20, 12);
        p.fill(255, 100, 50);
        p.translate(0, -12, 0);
        p.cone(10, 8, 8);
        p.pop();
    }

    // Body
    if (parts.body?.owned) {
        p.push();
        p.translate(15, 20, 10);
        p.fill(220, 220, 230);
        p.cylinder(12, 40, 16);
        p.pop();
    }

    // Nose Cone
    if (parts.nose?.owned) {
        p.push();
        p.translate(-20, 15, 15);
        p.fill(200, 50, 50);
        p.cone(10, 25, 12);
        p.pop();
    }

    // Fins
    if (parts.fins?.owned) {
        p.push();
        p.translate(20, 5, -15);
        p.fill(200, 50, 50);
        for (let i = 0; i < 3; i++) {
            p.push();
            p.rotateY((i / 3) * p.TWO_PI);
            p.translate(8, 0, 0);
            p.box(2, 15, 10);
            p.pop();
        }
        p.pop();
    }

    // Captain's Seat
    if (parts.seat?.owned) {
        p.push();
        p.translate(0, 8, 20);
        p.fill(60, 60, 70);
        p.box(10, 12, 8);
        p.fill(200, 150, 100);
        p.translate(0, 8, -2);
        p.box(8, 4, 6);
        p.pop();
    }

    // Progress indicator
    p.fill(255, 255, 100);
    p.push();
    p.translate(0, 60, 0);
    p.sphere(5);
    p.pop();
}

/**
 * Draw unassembled rocket (all parts ready)
 */
function drawUnassembledRocket(p) {
    // Draw parts arranged but not assembled
    p.push();

    // Body (main piece, laid on side)
    p.fill(220, 220, 230);
    p.push();
    p.translate(0, 15, 0);
    p.rotateZ(p.HALF_PI * 0.1);
    p.cylinder(12, 50, 16);
    p.pop();

    // Engine nearby
    p.fill(80, 80, 85);
    p.push();
    p.translate(-25, 10, 10);
    p.cylinder(8, 20, 12);
    p.pop();

    // Nose cone
    p.fill(200, 50, 50);
    p.push();
    p.translate(25, 15, -10);
    p.rotateZ(-p.HALF_PI * 0.3);
    p.cone(10, 25, 12);
    p.pop();

    // Fins stacked
    p.fill(200, 50, 50);
    p.push();
    p.translate(-20, 5, -20);
    p.box(4, 15, 12);
    p.translate(5, 0, 0);
    p.box(4, 15, 12);
    p.translate(5, 0, 0);
    p.box(4, 15, 12);
    p.pop();

    // Captain's seat
    p.fill(60, 60, 70);
    p.push();
    p.translate(20, 5, 20);
    p.box(10, 12, 8);
    p.pop();

    p.pop();

    // Glowing "ready to build" indicator
    const pulse = (Math.sin(Date.now() / 300) + 1) / 2;
    p.fill(0, 255, 100, 100 + pulse * 100);
    p.push();
    p.translate(0, 50, 0);
    p.sphere(8 + pulse * 3);
    p.pop();

    // Tool icons
    p.fill(150, 150, 160);
    p.push();
    p.translate(0, 60, 0);
    p.box(6, 2, 20);  // Wrench-like shape
    p.pop();
}

/**
 * Draw fully assembled rocket on the pad
 */
function drawAssembledRocket(p, isReady) {
    p.push();
    p.translate(0, 0, 0);

    // Engine section
    p.fill(80, 80, 85);
    p.push();
    p.translate(0, 15, 0);
    p.cylinder(10, 25, 16);
    // Engine nozzle
    p.fill(50, 50, 55);
    p.translate(0, -15, 0);
    p.cone(12, 10, 12);
    p.pop();

    // Main body
    p.fill(220, 220, 230);
    p.push();
    p.translate(0, 50, 0);
    p.cylinder(12, 50, 16);
    // Window
    p.fill(100, 150, 200);
    p.translate(12, 10, 0);
    p.sphere(5);
    p.pop();

    // Nose cone
    p.fill(200, 50, 50);
    p.push();
    p.translate(0, 90, 0);
    p.cone(12, 30, 12);
    p.pop();

    // Fins (3 around base)
    p.fill(200, 50, 50);
    for (let i = 0; i < 3; i++) {
        p.push();
        p.rotateY((i / 3) * p.TWO_PI);
        p.translate(14, 10, 0);
        p.box(4, 20, 12);
        p.pop();
    }

    // Gantry/Service Tower
    drawGantryTower(p);

    // If ready to launch, add effects
    if (isReady) {
        // Glowing engine
        const pulse = (Math.sin(Date.now() / 200) + 1) / 2;
        p.fill(255, 150 + pulse * 100, 0, 150);
        p.push();
        p.translate(0, 2, 0);
        p.sphere(15 + pulse * 5);
        p.pop();

        // Steam/vapor effects
        p.fill(200, 200, 200, 100);
        for (let i = 0; i < 5; i++) {
            const offsetX = Math.sin(Date.now() / 500 + i) * 10;
            const offsetZ = Math.cos(Date.now() / 400 + i) * 10;
            p.push();
            p.translate(offsetX, -5 - i * 3, offsetZ);
            p.sphere(8 + i * 2);
            p.pop();
        }
    }

    p.pop();
}

/**
 * Draw the gantry/service tower next to the rocket
 */
function drawGantryTower(p) {
    p.push();
    p.translate(35, 0, 0);

    // Main tower structure
    p.fill(120, 80, 50);

    // Vertical beams
    for (const xOff of [-8, 8]) {
        for (const zOff of [-8, 8]) {
            p.push();
            p.translate(xOff, 50, zOff);
            p.box(3, 100, 3);
            p.pop();
        }
    }

    // Horizontal cross beams
    for (let y = 20; y <= 80; y += 20) {
        p.push();
        p.translate(0, y, 0);
        p.box(20, 2, 20);
        p.pop();
    }

    // Service arm (extends toward rocket)
    p.fill(100, 100, 105);
    p.push();
    p.translate(-15, 70, 0);
    p.box(25, 4, 6);
    p.pop();

    // Red warning light on top
    const blink = Math.sin(Date.now() / 300) > 0;
    p.fill(blink ? 255 : 100, 0, 0);
    p.push();
    p.translate(0, 105, 0);
    p.sphere(4);
    p.pop();

    // Ladder
    p.fill(80, 80, 85);
    p.push();
    p.translate(-8, 50, -10);
    p.box(2, 100, 2);
    p.translate(6, 0, 0);
    p.box(2, 100, 2);
    // Rungs
    for (let y = -40; y <= 40; y += 10) {
        p.push();
        p.translate(-3, y, 0);
        p.box(8, 1, 2);
        p.pop();
    }
    p.pop();

    p.pop();
}

function drawM1House(p, house) {
    p.push();
    p.translate(house.x, 0, house.z);
    if (house.facingSouth) p.rotateY(p.PI);

    // Base
    p.fill(...house.color);
    p.push();
    p.translate(0, -30, 0);
    p.box(80, 60, 60);
    p.pop();

    // Roof
    p.fill(...house.roofColor);
    p.push();
    p.translate(-22, -75, 0);
    p.rotateZ(-0.6);
    p.box(50, 5, 68);
    p.pop();
    p.push();
    p.translate(22, -75, 0);
    p.rotateZ(0.6);
    p.box(50, 5, 68);
    p.pop();

    // Door
    const isDoorOpen = house.owner && house.owner.doorOpen;
    p.fill(101, 67, 33);
    p.push();
    if (isDoorOpen) {
        p.fill(30, 20, 15);
        p.translate(0, -15, 31);  // Door frame slightly in front
        p.box(15, 30, 2);
        p.fill(101, 67, 33);
        p.push();
        p.translate(-8, 0, 5);
        p.rotateY(1.2);
        p.box(15, 30, 2);
        p.pop();
    } else {
        p.translate(0, -15, 32);  // Moved forward to avoid z-fighting
        p.box(15, 30, 2);
    }
    p.pop();

    // Windows
    p.fill(135, 206, 250);
    for (const wx of [-20, 20]) {
        p.push();
        p.translate(wx, -35, 32);  // Moved forward to avoid z-fighting
        p.box(12, 12, 2);
        p.pop();
    }

    p.pop();
}

function drawM1Tree(p, tree) {
    p.push();
    p.translate(tree.x, 0, tree.z);
    p.fill(101, 67, 33);
    p.push();
    p.translate(0, -tree.height / 4, 0);
    p.cylinder(5, tree.height / 2);
    p.pop();
    p.fill(34, 120, 34);
    p.push();
    p.translate(0, -tree.height * 0.6, 0);
    p.sphere(tree.width / 2);
    p.translate(0, -tree.width / 4, 0);
    p.sphere(tree.width / 3);
    p.pop();
    p.pop();
}

function drawM1Flower(p, flower) {
    p.push();
    p.translate(flower.x, 0, flower.z);

    // Stem - thicker and taller
    p.fill(34, 139, 34);
    p.push();
    p.translate(0, -6, 0);
    p.cylinder(1, 12);
    p.pop();

    // Leaves on stem
    p.fill(50, 160, 50);
    p.push();
    p.translate(-2, -4, 0);
    p.rotateZ(0.5);
    p.scale(1, 0.3, 1);
    p.sphere(3);
    p.pop();
    p.push();
    p.translate(2, -7, 0);
    p.rotateZ(-0.5);
    p.scale(1, 0.3, 1);
    p.sphere(2.5);
    p.pop();

    // Flower head position
    p.translate(0, -13, 0);

    // Petals - arranged in a circle
    p.fill(...flower.color);
    const petalCount = 5;
    for (let i = 0; i < petalCount; i++) {
        p.push();
        const angle = (i / petalCount) * p.TWO_PI;
        p.rotateY(angle);
        p.translate(0, 0, 3);
        p.scale(1, 0.5, 1.5);
        p.sphere(2.5);
        p.pop();
    }

    // Center of flower (yellow)
    p.fill(255, 220, 50);
    p.sphere(2);

    p.pop();
}

function drawLemonadeStand(p, stand) {
    p.push();
    p.translate(stand.x, 0, stand.z);
    p.rotateY(p.PI);  // Face the street (south toward camera)

    // Table
    p.fill(139, 90, 43);
    p.push();
    p.translate(0, -25, 0);
    p.box(60, 5, 30);
    p.pop();

    // Legs
    p.fill(101, 67, 33);
    for (const lx of [-25, 25]) {
        for (const lz of [-10, 10]) {
            p.push();
            p.translate(lx, -12, lz);
            p.box(4, 25, 4);
            p.pop();
        }
    }

    // Pitcher
    p.fill(255, 255, 100);
    p.push();
    p.translate(-10, -35, 0);
    p.cylinder(8, 15);
    p.pop();

    // Cups
    p.fill(255, 255, 220);
    for (let c = 0; c < 3; c++) {
        p.push();
        p.translate(5 + c * 12, -32, 0);
        p.cylinder(4, 8);
        p.pop();
    }

    // Sign
    p.fill(101, 67, 33);
    p.push();
    p.translate(0, -45, -15);
    p.box(4, 40, 4);
    p.pop();
    p.fill(255, 255, 200);
    p.push();
    p.translate(0, -70, -15);
    p.box(70, 25, 3);
    p.pop();
    p.fill(255, 220, 0);
    p.push();
    p.translate(0, -70, -12);  // Moved forward to avoid z-fighting
    p.box(60, 15, 1);
    p.pop();

    // Hannah (only during daytime - she goes inside at 8 PM)
    if (!isNightTime()) {
        p.push();
        p.translate(-50, 0, 10);
        drawHannah(p, { isWaving: true });
        p.pop();
    }

    p.pop();
}

function drawPark(p) {
    const parkX = 100;
    const parkZ = -180;
    const parkWidth = 200;
    const parkDepth = 160;

    p.push();
    p.translate(parkX, 0, parkZ);
    p.rotateY(p.PI);  // Rotate to face same direction as houses (south)

    // Walking path (curved through park)
    p.fill(180, 160, 130);
    p.push();
    p.translate(0, -0.4, 0);
    p.rotateX(p.HALF_PI);
    p.ellipse(0, 0, 160, 40);
    p.pop();

    // Swing set
    p.push();
    p.translate(-80, 0, -50);
    // Frame (A-frame)
    p.fill(150, 50, 50);
    // Left A
    p.push();
    p.translate(-25, -40, 0);
    p.rotateZ(0.2);
    p.box(5, 80, 5);
    p.pop();
    p.push();
    p.translate(-15, -40, 0);
    p.rotateZ(-0.2);
    p.box(5, 80, 5);
    p.pop();
    // Right A
    p.push();
    p.translate(25, -40, 0);
    p.rotateZ(-0.2);
    p.box(5, 80, 5);
    p.pop();
    p.push();
    p.translate(15, -40, 0);
    p.rotateZ(0.2);
    p.box(5, 80, 5);
    p.pop();
    // Top bar
    p.push();
    p.translate(0, -75, 0);
    p.fill(150, 50, 50);
    p.box(60, 5, 5);
    p.pop();
    // Swing chains and seat
    p.fill(80, 80, 80);
    p.push();
    p.translate(0, -45, 0);
    p.box(2, 60, 2);
    p.pop();
    p.fill(100, 60, 30);
    p.push();
    p.translate(0, -15, 0);
    p.box(20, 3, 10);
    p.pop();
    p.pop();

    // Slide
    p.push();
    p.translate(80, 0, -40);
    // Ladder
    p.fill(100, 100, 200);
    p.push();
    p.translate(-5, -30, -15);
    p.box(5, 60, 5);
    p.pop();
    p.push();
    p.translate(5, -30, -15);
    p.box(5, 60, 5);
    p.pop();
    // Ladder rungs
    for (let i = 0; i < 5; i++) {
        p.push();
        p.translate(0, -10 - i * 12, -15);
        p.fill(80, 80, 80);
        p.box(15, 3, 3);
        p.pop();
    }
    // Platform
    p.fill(100, 100, 200);
    p.push();
    p.translate(0, -60, -5);
    p.box(25, 5, 25);
    p.pop();
    // Slide surface
    p.fill(255, 200, 50);
    p.push();
    p.translate(0, -30, 20);
    p.rotateX(-0.5);
    p.box(20, 3, 70);
    p.pop();
    p.pop();

    // Benches (2 benches)
    for (let b = 0; b < 2; b++) {
        p.push();
        p.translate(b === 0 ? -95 : 95, 0, 50);
        p.rotateY(b === 0 ? 0.3 : -0.3);
        // Bench legs
        p.fill(80, 50, 30);
        p.push();
        p.translate(-15, -10, 0);
        p.box(5, 20, 12);
        p.pop();
        p.push();
        p.translate(15, -10, 0);
        p.box(5, 20, 12);
        p.pop();
        // Bench seat
        p.fill(120, 80, 40);
        p.push();
        p.translate(0, -22, 0);
        p.box(40, 4, 15);
        p.pop();
        // Bench back
        p.push();
        p.translate(0, -35, -6);
        p.box(40, 20, 3);
        p.pop();
        p.pop();
    }

    // Flowers around park edges (matching map flower style)
    const flowerColors = [
        [255, 100, 100],
        [255, 255, 100],
        [255, 150, 200],
        [150, 150, 255],
        [255, 200, 100],
    ];
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * p.TWO_PI;
        const fx = Math.cos(angle) * 110;
        const fz = Math.sin(angle) * 90;
        p.push();
        p.translate(fx, 0, fz);

        // Stem
        p.fill(34, 139, 34);
        p.push();
        p.translate(0, -6, 0);
        p.cylinder(1, 12);
        p.pop();

        // Leaves on stem
        p.fill(50, 160, 50);
        p.push();
        p.translate(-2, -4, 0);
        p.rotateZ(0.5);
        p.scale(1, 0.3, 1);
        p.sphere(3);
        p.pop();
        p.push();
        p.translate(2, -7, 0);
        p.rotateZ(-0.5);
        p.scale(1, 0.3, 1);
        p.sphere(2.5);
        p.pop();

        // Flower head with petals
        p.translate(0, -13, 0);
        const fc = flowerColors[i % flowerColors.length];
        p.fill(...fc);
        for (let j = 0; j < 5; j++) {
            p.push();
            const petalAngle = (j / 5) * p.TWO_PI;
            p.rotateY(petalAngle);
            p.translate(3, 0, 0);
            p.scale(1, 0.5, 0.6);
            p.sphere(3);
            p.pop();
        }
        // Center
        p.fill(255, 220, 50);
        p.sphere(2);
        p.pop();
    }

    // Trash can
    p.push();
    p.translate(40, 0, 60);
    p.fill(60, 60, 60);
    p.push();
    p.translate(0, -20, 0);
    p.cylinder(10, 40);
    p.pop();
    // Lid
    p.fill(80, 80, 80);
    p.push();
    p.translate(0, -42, 0);
    p.cylinder(12, 5);
    p.pop();
    p.pop();

    p.pop();
}

function drawRocketShop(p, shop) {
    p.push();
    p.translate(shop.x, 0, shop.z);
    // No rotation - door faces west (-X direction toward lemonade stand)

    // Building (swapped width/depth so front faces west)
    p.fill(60, 60, 80);
    p.push();
    p.translate(0, -40, 0);
    p.box(80, 78, 100);  // Width is now Z, depth is X
    p.pop();

    // Roof
    p.fill(40, 40, 60);
    p.push();
    p.translate(0, -84, 0);
    p.box(90, 10, 110);
    p.pop();

    // Door (on west side, facing -X toward lemonade stand)
    p.fill(100, 150, 255);
    p.push();
    p.translate(-42, -25, 0);
    p.box(2, 50, 25);
    p.pop();

    // Windows on each side of door (on west wall)
    p.fill(135, 206, 250);
    p.push();
    p.translate(-42, -40, -30);
    p.box(2, 20, 20);
    p.pop();
    p.push();
    p.translate(-42, -40, 30);
    p.box(2, 20, 20);
    p.pop();

    // Big Rocket Sign on top!
    p.push();
    p.translate(0, -89, 0);

    // Rocket body (white/silver)
    p.fill(230, 230, 240);
    p.push();
    p.translate(0, -25, 0);
    p.cylinder(12, 50);
    p.pop();

    // Red stripes on rocket
    p.fill(255, 50, 50);
    p.push();
    p.translate(0, -10, 0);
    p.cylinder(13, 8);
    p.pop();
    p.push();
    p.translate(0, -40, 0);
    p.cylinder(13, 8);
    p.pop();

    // Nose cone (red) - rotated so tip points up
    p.fill(255, 50, 50);
    p.push();
    p.translate(0, -55, 0);
    p.rotateX(p.PI);
    p.cone(12, 25);
    p.pop();

    // Fins (red)
    p.fill(255, 50, 50);
    for (let i = 0; i < 4; i++) {
        p.push();
        p.rotateY(i * p.HALF_PI);
        p.translate(0, 0, 12);
        p.rotateX(0.3);
        p.box(3, 25, 15);
        p.pop();
    }

    // Window on rocket (facing west)
    p.fill(135, 206, 250);
    p.push();
    p.translate(-12, -25, 0);
    p.sphere(6);
    p.pop();

    // Flame underneath (animated)
    p.push();
    p.translate(0, 2, 0);
    const flameSize = 1 + Math.sin(p.frameCount * 0.3) * 0.2;
    p.fill(255, 150, 0);
    p.scale(flameSize);
    p.cone(10, 20);
    p.fill(255, 255, 0);
    p.translate(0, 5, 0);
    p.cone(6, 12);
    p.pop();

    p.pop();

    // TECH SHOP sign at road edge, rotated 180 to face south
    p.push();
    p.translate(0, -50, -70);  // Move to south edge near road
    p.rotateY(p.PI);  // Rotate 180 degrees to face south

    // Sign post
    p.fill(101, 67, 33);
    p.push();
    p.translate(0, 25, 0);
    p.box(6, 50, 6);
    p.pop();

    // Sign background (orange)
    p.fill(255, 100, 0);
    p.push();
    p.translate(0, 0, 2);
    p.box(85, 22, 2);
    p.pop();

    // Sign foreground (yellow)
    p.fill(255, 255, 0);
    p.push();
    p.translate(0, 0, 3);
    p.box(80, 18, 2);
    p.pop();

    // "TECH SHOP" text using 3D boxes - uniform spacing
    p.fill(0);  // Black letters
    const lh = 10;  // letter height
    const ld = 1;   // letter depth
    const sp = 7;   // spacing between letters
    const sx = -30; // start X position

    // T (centered)
    p.push();
    p.translate(sx, 0, 4);
    p.push(); p.translate(0, -4, 0); p.box(5, 2, ld); p.pop();  // Top bar
    p.box(2, lh, ld);  // Stem
    p.pop();

    // E (centered)
    p.push();
    p.translate(sx + sp, 0, 4);
    p.push(); p.translate(-1, 0, 0); p.box(2, lh, ld); p.pop();  // Stem
    p.push(); p.translate(1, -4, 0); p.box(4, 2, ld); p.pop();   // Top
    p.push(); p.translate(1, 0, 0); p.box(4, 2, ld); p.pop();    // Middle
    p.push(); p.translate(1, 4, 0); p.box(4, 2, ld); p.pop();    // Bottom
    p.pop();

    // C (centered)
    p.push();
    p.translate(sx + sp * 2, 0, 4);
    p.push(); p.translate(-1, 0, 0); p.box(2, lh, ld); p.pop();  // Stem
    p.push(); p.translate(1, -4, 0); p.box(4, 2, ld); p.pop();   // Top
    p.push(); p.translate(1, 4, 0); p.box(4, 2, ld); p.pop();    // Bottom
    p.pop();

    // H (centered)
    p.push();
    p.translate(sx + sp * 3, 0, 4);
    p.push(); p.translate(-2, 0, 0); p.box(2, lh, ld); p.pop();  // Left stem
    p.push(); p.translate(2, 0, 0); p.box(2, lh, ld); p.pop();   // Right stem
    p.box(4, 2, ld);  // Middle bar
    p.pop();

    // (space at index 4)

    // S (centered)
    p.push();
    p.translate(sx + sp * 5, 0, 4);
    p.push(); p.translate(0, -4, 0); p.box(5, 2, ld); p.pop();    // Top
    p.push(); p.translate(-1.5, -2, 0); p.box(2, 3, ld); p.pop(); // Upper left
    p.box(5, 2, ld);  // Middle
    p.push(); p.translate(1.5, 2, 0); p.box(2, 3, ld); p.pop();   // Lower right
    p.push(); p.translate(0, 4, 0); p.box(5, 2, ld); p.pop();     // Bottom
    p.pop();

    // H (centered)
    p.push();
    p.translate(sx + sp * 6, 0, 4);
    p.push(); p.translate(-2, 0, 0); p.box(2, lh, ld); p.pop();  // Left stem
    p.push(); p.translate(2, 0, 0); p.box(2, lh, ld); p.pop();   // Right stem
    p.box(4, 2, ld);  // Middle bar
    p.pop();

    // O (centered)
    p.push();
    p.translate(sx + sp * 7, 0, 4);
    p.push(); p.translate(-2, 0, 0); p.box(2, lh, ld); p.pop();  // Left
    p.push(); p.translate(2, 0, 0); p.box(2, lh, ld); p.pop();   // Right
    p.push(); p.translate(0, -4, 0); p.box(4, 2, ld); p.pop();   // Top
    p.push(); p.translate(0, 4, 0); p.box(4, 2, ld); p.pop();    // Bottom
    p.pop();

    // P (centered)
    p.push();
    p.translate(sx + sp * 8, 0, 4);
    p.push(); p.translate(-1, 0, 0); p.box(2, lh, ld); p.pop();   // Stem
    p.push(); p.translate(1, -4, 0); p.box(4, 2, ld); p.pop();    // Top
    p.push(); p.translate(2.5, -2, 0); p.box(2, 3, ld); p.pop();  // Right upper
    p.push(); p.translate(1, 0, 0); p.box(4, 2, ld); p.pop();     // Middle
    p.pop();

    p.pop();

    p.pop();
}

function drawNiamDialog(p) {
    p.push();
    p.resetMatrix();
    p.camera();
    p.ortho();

    // Background
    p.fill(0, 0, 0, 180);
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(0, 0, 500, 250, 15);

    // Border
    p.stroke(255, 200, 50);
    p.strokeWeight(3);
    p.noFill();
    p.rect(0, 0, 500, 250, 15);

    // Message
    p.noStroke();
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    p.text("Hey Noah! Wanna come play?", 0, -70);
    p.textSize(16);
    p.fill(200, 200, 200);
    p.text("- Niam", 0, -40);

    // Buttons
    const btn1Y = 20;
    const btn2Y = 75;
    const btn1Hover = p.mouseY > p.height / 2 + btn1Y - 20 && p.mouseY < p.height / 2 + btn1Y + 20 &&
                      p.mouseX > p.width / 2 - 200 && p.mouseX < p.width / 2 + 200;
    const btn2Hover = p.mouseY > p.height / 2 + btn2Y - 20 && p.mouseY < p.height / 2 + btn2Y + 20 &&
                      p.mouseX > p.width / 2 - 200 && p.mouseX < p.width / 2 + 200;

    p.fill(btn1Hover ? p.color(255, 100, 100) : p.color(180, 60, 60));
    p.rect(0, btn1Y, 380, 40, 8);
    p.fill(255);
    p.textSize(16);
    p.text("Sure, let's play! (Lose $5)", 0, btn1Y);

    p.fill(btn2Hover ? p.color(100, 180, 100) : p.color(60, 140, 60));
    p.rect(0, btn2Y, 380, 40, 8);
    p.fill(255);
    p.text("Not right now, I'm saving for my rocket!", 0, btn2Y);

    p.pop();
}

// ============ NEW LOCATIONS ============

/**
 * Draw the library building
 */
function drawLibrary(p, library) {
    if (!library) return;

    p.push();
    p.translate(library.x, 0, library.z);
    p.rotateY(-p.HALF_PI);  // Rotate to face east (toward the perpendicular road)

    // Main building - brick red
    p.fill(140, 80, 70);
    p.push();
    p.translate(0, -40, 0);
    p.box(100, 80, 80);
    p.pop();

    // Roof - dark brown
    p.fill(80, 60, 50);
    p.push();
    p.translate(0, -85, 0);
    p.box(110, 10, 90);
    p.pop();

    // Columns at entrance (facing south)
    p.fill(230, 220, 200);
    for (const colX of [-35, -15, 15, 35]) {
        p.push();
        p.translate(colX, -30, -45);
        p.cylinder(4, 60);
        p.pop();
    }

    // Entrance overhang
    p.fill(180, 160, 140);
    p.push();
    p.translate(0, -65, -50);
    p.box(90, 6, 20);
    p.pop();

    // Large front doors
    p.fill(101, 67, 33);
    p.push();
    p.translate(-12, -25, -42);
    p.box(18, 50, 2);
    p.pop();
    p.push();
    p.translate(12, -25, -42);
    p.box(18, 50, 2);
    p.pop();

    // Windows
    p.fill(135, 206, 250);
    for (const wx of [-35, 35]) {
        p.push();
        p.translate(wx, -40, -42);
        p.box(15, 25, 2);
        p.pop();
    }

    // Library sign
    p.fill(139, 90, 43);
    p.push();
    p.translate(0, -78, -48);
    p.box(60, 15, 2);
    p.pop();
    // LIBRARY text area (yellow)
    p.fill(255, 220, 100);
    p.push();
    p.translate(0, -78, -49);
    p.box(55, 12, 1);
    p.pop();

    // Book decorations on roof
    p.fill(200, 50, 50);
    p.push();
    p.translate(-25, -95, 0);
    p.box(15, 20, 10);
    p.pop();
    p.fill(50, 50, 200);
    p.push();
    p.translate(0, -95, 0);
    p.box(15, 20, 10);
    p.pop();
    p.fill(50, 180, 50);
    p.push();
    p.translate(25, -95, 0);
    p.box(15, 20, 10);
    p.pop();

    p.pop();
}

/**
 * Draw stadium oval shape (straight sides + curved ends)
 */
function drawStadiumOval(p, width, height, yOffset) {
    const straightLength = width - height;  // Length of straight sections
    const radius = height / 2;              // Radius of curved ends

    p.push();
    p.translate(0, 0, yOffset);
    p.beginShape();

    // Top straight edge (left to right)
    p.vertex(-straightLength / 2, -radius);
    p.vertex(straightLength / 2, -radius);

    // Right curved end (semicircle)
    for (let a = -p.HALF_PI; a <= p.HALF_PI; a += 0.2) {
        p.vertex(straightLength / 2 + Math.cos(a) * radius, Math.sin(a) * radius);
    }

    // Bottom straight edge (right to left)
    p.vertex(straightLength / 2, radius);
    p.vertex(-straightLength / 2, radius);

    // Left curved end (semicircle)
    for (let a = p.HALF_PI; a <= p.PI + p.HALF_PI; a += 0.2) {
        p.vertex(-straightLength / 2 + Math.cos(a) * radius, Math.sin(a) * radius);
    }

    p.endShape(p.CLOSE);
    p.pop();
}

/**
 * Draw stadium oval outline (for lane lines)
 */
function drawStadiumOvalOutline(p, width, height, yOffset) {
    const straightLength = width - height;
    const radius = height / 2;

    p.push();
    p.translate(0, 0, yOffset);
    p.beginShape();

    p.vertex(-straightLength / 2, -radius);
    p.vertex(straightLength / 2, -radius);

    for (let a = -p.HALF_PI; a <= p.HALF_PI; a += 0.15) {
        p.vertex(straightLength / 2 + Math.cos(a) * radius, Math.sin(a) * radius);
    }

    p.vertex(straightLength / 2, radius);
    p.vertex(-straightLength / 2, radius);

    for (let a = p.HALF_PI; a <= p.PI + p.HALF_PI; a += 0.15) {
        p.vertex(-straightLength / 2 + Math.cos(a) * radius, Math.sin(a) * radius);
    }

    p.endShape(p.CLOSE);
    p.pop();
}

/**
 * Draw the running track
 */
function drawRunningTrack(p, track) {
    if (!track) return;

    p.push();
    p.translate(track.x, -0.5, track.z);
    p.rotateX(p.HALF_PI);

    const trackWidth = track.lapRadius * 2.8;   // Overall width (longer dimension)
    const trackHeight = track.lapRadius * 1.6;  // Overall height (shorter dimension)
    const laneWidth = 18;                        // Width of each lane

    // Outer track surface (red/orange)
    p.fill(180, 80, 60);
    p.noStroke();
    drawStadiumOval(p, trackWidth, trackHeight, 0);

    // Inner grass area
    p.fill(60, 140, 60);
    drawStadiumOval(p, trackWidth - laneWidth * 2.5, trackHeight - laneWidth * 2.5, 1);

    // Lane lines (white)
    p.noFill();
    p.stroke(255);
    p.strokeWeight(2);
    drawStadiumOvalOutline(p, trackWidth - laneWidth * 0.8, trackHeight - laneWidth * 0.8, 1.5);
    drawStadiumOvalOutline(p, trackWidth - laneWidth * 1.6, trackHeight - laneWidth * 1.6, 1.5);
    p.noStroke();

    p.pop();

    // TRACK sign (between track and library, closer to track)
    p.push();
    p.translate(track.x + track.lapRadius * 1.15, 0, track.z + 50);
    p.rotateY(p.PI);  // Rotate to face south

    // Sign post
    p.fill(80, 60, 40);
    p.push();
    p.translate(0, -30, 0);
    p.box(8, 60, 8);
    p.pop();

    // Sign background (white)
    p.fill(255, 255, 255);
    p.push();
    p.translate(0, -65, 0);
    p.box(70, 28, 4);
    p.pop();

    // "TRACK" text using 3D boxes - black letters on front face
    p.fill(0);  // Black letters
    const lh = 12;  // letter height
    const ld = 2;   // letter depth
    const sp = 12;  // spacing between letters
    const sx = -24; // start X position
    const letterZ = 3;  // Position letters in front of sign

    // T
    p.push();
    p.translate(sx, -65, letterZ);
    p.push(); p.translate(0, -5, 0); p.box(7, 2, ld); p.pop();  // Top bar
    p.box(2, lh, ld);  // Stem
    p.pop();

    // R
    p.push();
    p.translate(sx + sp, -65, letterZ);
    p.push(); p.translate(-2, 0, 0); p.box(2, lh, ld); p.pop();   // Stem
    p.push(); p.translate(1, -5, 0); p.box(5, 2, ld); p.pop();    // Top
    p.push(); p.translate(3, -3, 0); p.box(2, 3, ld); p.pop();    // Right upper
    p.push(); p.translate(1, -1, 0); p.box(5, 2, ld); p.pop();    // Middle
    p.push(); p.translate(3, 3, 0); p.box(2, 5, ld); p.pop();     // Diagonal leg
    p.pop();

    // A
    p.push();
    p.translate(sx + sp * 2, -65, letterZ);
    p.push(); p.translate(-2.5, 0, 0); p.box(2, lh, ld); p.pop(); // Left leg
    p.push(); p.translate(2.5, 0, 0); p.box(2, lh, ld); p.pop();  // Right leg
    p.push(); p.translate(0, -5, 0); p.box(4, 2, ld); p.pop();    // Top
    p.push(); p.translate(0, -1, 0); p.box(4, 2, ld); p.pop();    // Middle bar
    p.pop();

    // C
    p.push();
    p.translate(sx + sp * 3, -65, letterZ);
    p.push(); p.translate(-1, 0, 0); p.box(2, lh, ld); p.pop();   // Stem
    p.push(); p.translate(1.5, -5, 0); p.box(5, 2, ld); p.pop();  // Top
    p.push(); p.translate(1.5, 5, 0); p.box(5, 2, ld); p.pop();   // Bottom
    p.pop();

    // K
    p.push();
    p.translate(sx + sp * 4, -65, letterZ);
    p.push(); p.translate(-2, 0, 0); p.box(2, lh, ld); p.pop();   // Stem
    p.push(); p.translate(1, -3, 0); p.box(5, 2, ld); p.pop();    // Upper diagonal
    p.push(); p.translate(1, 3, 0); p.box(5, 2, ld); p.pop();     // Lower diagonal
    p.push(); p.translate(0, 0, 0); p.box(3, 2, ld); p.pop();     // Middle
    p.pop();

    p.pop();

    // Bench near track (between track and road)
    p.push();
    p.translate(track.x + track.lapRadius * 1.15, 0, track.z - 40);
    drawBench(p);
    p.pop();
}

/**
 * Draw a simple bench
 */
function drawBench(p) {
    // Seat
    p.fill(139, 90, 43);
    p.push();
    p.translate(0, -10, 0);
    p.box(40, 4, 15);
    p.pop();

    // Legs
    p.fill(80, 60, 40);
    for (const lx of [-15, 15]) {
        p.push();
        p.translate(lx, -5, 0);
        p.box(4, 10, 12);
        p.pop();
    }
}

/**
 * Draw a directional sign post
 */
function drawDirectionalSign(p, x, z, text, rotY = 0) {
    p.push();
    p.translate(x, 0, z);
    p.rotateY(rotY);

    // Sign post (wooden pole)
    p.fill(100, 70, 40);
    p.push();
    p.translate(0, -30, 0);
    p.cylinder(3, 60);
    p.pop();

    // Sign board background (dark green)
    p.fill(30, 80, 50);
    p.push();
    p.translate(0, -55, 0);
    p.box(60, 20, 3);
    p.pop();

    // Sign border (white)
    p.fill(255);
    p.push();
    p.translate(0, -55, -1.5);
    p.box(56, 16, 0.5);
    p.pop();

    // Sign text (simulated with small boxes)
    // Arrow pointing right
    p.fill(255);
    p.push();
    p.translate(22, -55, -2);
    p.box(15, 3, 1);  // Arrow shaft
    p.pop();
    p.push();
    p.translate(27, -53, -2);
    p.rotateZ(p.PI / 4);
    p.box(8, 2, 1);  // Arrow head top
    p.pop();
    p.push();
    p.translate(27, -57, -2);
    p.rotateZ(-p.PI / 4);
    p.box(8, 2, 1);  // Arrow head bottom
    p.pop();

    p.pop();
}

/**
 * Draw Dad standing by the sedan
 */
function drawDadAndSedan(p, dad, sedan) {
    if (!dad || !sedan) return;

    // Draw the sedan
    p.push();
    p.translate(sedan.x, 0, sedan.z);

    // Car body - blue sedan
    p.fill(50, 80, 150);
    p.push();
    p.translate(0, -12, 0);
    p.box(50, 18, 25);
    p.pop();

    // Car top/cabin
    p.fill(60, 90, 160);
    p.push();
    p.translate(0, -26, 0);
    p.box(35, 14, 22);
    p.pop();

    // Windshield
    p.fill(180, 220, 255);
    p.push();
    p.translate(-15, -26, 0);
    p.box(2, 10, 18);
    p.pop();

    // Rear window
    p.push();
    p.translate(15, -26, 0);
    p.box(2, 10, 18);
    p.pop();

    // Side windows
    p.push();
    p.translate(0, -26, -12);
    p.box(30, 10, 2);
    p.pop();

    // Wheels
    p.fill(30);
    for (const wx of [-18, 18]) {
        for (const wz of [-12, 12]) {
            p.push();
            p.translate(wx, -5, wz);
            p.rotateX(p.HALF_PI);
            p.cylinder(6, 5);
            // Hubcap
            p.fill(180);
            p.cylinder(3, 6);
            p.fill(30);
            p.pop();
        }
    }

    // Headlights
    p.fill(255, 255, 200);
    p.push();
    p.translate(-26, -12, -8);
    p.sphere(3);
    p.pop();
    p.push();
    p.translate(-26, -12, 8);
    p.sphere(3);
    p.pop();

    // Taillights
    p.fill(255, 50, 50);
    p.push();
    p.translate(26, -12, -8);
    p.box(2, 4, 5);
    p.pop();
    p.push();
    p.translate(26, -12, 8);
    p.box(2, 4, 5);
    p.pop();

    p.pop();

    // Draw Dad standing nearby
    p.push();
    p.translate(dad.x, 0, dad.z);
    // Face toward Noah's house (south)
    p.rotateY(p.PI);

    // Legs
    p.fill(60, 60, 80);
    p.push();
    p.translate(-6, -12, 0);
    p.box(8, 24, 8);
    p.pop();
    p.push();
    p.translate(6, -12, 0);
    p.box(8, 24, 8);
    p.pop();

    // Body - business casual
    p.fill(80, 100, 140);
    p.push();
    p.translate(0, -35, 0);
    p.box(22, 30, 14);
    p.pop();

    // Collar
    p.fill(255);
    p.push();
    p.translate(0, -48, 5);
    p.box(10, 5, 4);
    p.pop();

    // Head
    p.fill(210, 170, 140);
    p.push();
    p.translate(0, -58, 0);
    p.sphere(12);
    p.pop();

    // Hair (short brown)
    p.fill(80, 60, 40);
    p.push();
    p.translate(0, -65, 0);
    p.box(22, 8, 20);
    p.pop();

    // Arms
    p.fill(80, 100, 140);
    p.push();
    p.translate(-14, -38, 0);
    p.box(6, 22, 8);
    p.pop();
    p.push();
    p.translate(14, -38, 0);
    p.box(6, 22, 8);
    p.pop();

    // Hands
    p.fill(210, 170, 140);
    p.push();
    p.translate(-14, -26, 0);
    p.sphere(4);
    p.pop();
    p.push();
    p.translate(14, -26, 0);
    p.sphere(4);
    p.pop();

    p.pop();
}

/**
 * Draw just the sedan (for nighttime when Dad is inside)
 */
function drawSedanOnly(p, sedan) {
    if (!sedan) return;

    p.push();
    p.translate(sedan.x, 0, sedan.z);

    // Car body - blue sedan
    p.fill(50, 80, 150);
    p.push();
    p.translate(0, -12, 0);
    p.box(50, 18, 25);
    p.pop();

    // Car top/cabin
    p.fill(60, 90, 160);
    p.push();
    p.translate(0, -26, 0);
    p.box(35, 14, 22);
    p.pop();

    // Windshield
    p.fill(180, 220, 255);
    p.push();
    p.translate(-15, -26, 0);
    p.box(2, 10, 18);
    p.pop();

    // Rear window
    p.push();
    p.translate(15, -26, 0);
    p.box(2, 10, 18);
    p.pop();

    // Side windows
    p.push();
    p.translate(0, -26, -12);
    p.box(30, 10, 2);
    p.pop();

    // Wheels
    p.fill(30);
    for (const wx of [-18, 18]) {
        for (const wz of [-12, 12]) {
            p.push();
            p.translate(wx, -5, wz);
            p.rotateX(p.HALF_PI);
            p.cylinder(6, 5);
            // Hubcap
            p.fill(180);
            p.cylinder(3, 6);
            p.fill(30);
            p.pop();
        }
    }

    // Headlights
    p.fill(255, 255, 200);
    p.push();
    p.translate(-26, -12, -8);
    p.sphere(3);
    p.pop();
    p.push();
    p.translate(-26, -12, 8);
    p.sphere(3);
    p.pop();

    // Taillights
    p.fill(255, 50, 50);
    p.push();
    p.translate(26, -12, -8);
    p.box(2, 4, 5);
    p.pop();
    p.push();
    p.translate(26, -12, 8);
    p.box(2, 4, 5);
    p.pop();

    p.pop();
}

// ============ SLEEP CUTSCENE ============

/**
 * Start the sleep cutscene
 */
export function startSleepCutscene() {
    const m1 = mission1State;
    m1.sleepCutscene.isActive = true;
    m1.sleepCutscene.phase = 0;
    m1.sleepCutscene.startTime = Date.now();
    // Start Noah at front-right of room (near door area in wider room)
    m1.sleepCutscene.noahX = 50;
    m1.sleepCutscene.noahY = 0;
    m1.sleepCutscene.noahZ = 100;
    m1.gameTime.isSleeping = true;
}

/**
 * Update sleep cutscene animation
 * Positions updated to match wider room with bed at left side (-100, -80)
 */
export function updateSleepCutscene(p) {
    const m1 = mission1State;
    const elapsed = Date.now() - m1.sleepCutscene.startTime;

    // Phase timings (in ms)
    const WALK_TO_BED = 2500;  // Slightly longer for longer walk in bigger room
    const CLIMB_UP = 4000;
    const SLEEPING = 6500;
    const WAKE_UP = 8500;
    const DONE = 10000;

    // Bed position constants (matches drawBunkBed)
    const bedX = -100;
    const bedZ = -80;
    const ladderX = bedX - 40;  // -140

    // Start position (front-right of room)
    const startX = 50;
    const startZ = 100;

    if (elapsed < WALK_TO_BED) {
        // Phase 0: Walking toward the ladder
        m1.sleepCutscene.phase = 0;
        const progress = elapsed / WALK_TO_BED;
        // Walk from start position to ladder
        m1.sleepCutscene.noahX = startX + (ladderX - startX) * progress;  // 50 to -140
        m1.sleepCutscene.noahZ = startZ + (bedZ - startZ) * progress;     // 100 to -80
    } else if (elapsed < CLIMB_UP) {
        // Phase 1: Climbing ladder
        m1.sleepCutscene.phase = 1;
        const progress = (elapsed - WALK_TO_BED) / (CLIMB_UP - WALK_TO_BED);
        m1.sleepCutscene.noahX = ladderX;  // Stay at ladder X=-140
        m1.sleepCutscene.noahZ = bedZ;     // Z=-80
        m1.sleepCutscene.noahY = progress * 80;  // Climb up
        // At the end of climbing, transition to bed position
        if (progress > 0.9) {
            // Move from ladder to center of bed (X moves from -140 to -95)
            m1.sleepCutscene.noahX = ladderX + ((bedX + 5) - ladderX) * ((progress - 0.9) / 0.1);
        }
    } else if (elapsed < SLEEPING) {
        // Phase 2: In bed sleeping (positioned above the blanket)
        m1.sleepCutscene.phase = 2;
        m1.sleepCutscene.noahX = bedX + 5;  // Slightly right of bed center (-95)
        m1.sleepCutscene.noahY = 97;        // Above the blanket level
        m1.sleepCutscene.noahZ = bedZ;      // Z=-80
    } else if (elapsed < WAKE_UP) {
        // Phase 3: Waking up
        m1.sleepCutscene.phase = 3;
        m1.sleepCutscene.noahY = 97;  // Keep same height
    } else if (elapsed >= DONE) {
        // End cutscene
        endSleepCutscene();
    }
}

/**
 * End sleep cutscene and start new day
 */
export function endSleepCutscene() {
    const m1 = mission1State;
    m1.sleepCutscene.isActive = false;
    m1.sleepCutscene.phase = 0;

    // Start new day
    startNewDay();
    updateCryptoPricesOnNewDay();

    // Position Noah outside house
    noah.x = 0;
    noah.z = 130;
    noah.angle = Math.PI;  // Face south (toward camera)

    // Return to playing state
    setGameState(GAME_STATES.M1_PLAYING);

    refreshHUD();
    showNotification(UI_ELEMENTS.M1_NOTIFICATION,
        `Good morning! Day ${m1.gameTime.dayNumber} begins! ☀️`, 2500);
}

/**
 * Draw the sleep cutscene (Noah's bedroom with bunkbed)
 * Room dimensions match the house interior (400x300)
 */
export function drawSleepCutscene(p) {
    const m1 = mission1State;
    const phase = m1.sleepCutscene.phase;

    // Dark blue night sky background
    p.background(15, 15, 40);

    // Camera - adjust based on phase to see Noah better
    if (phase === 2 || phase === 3) {
        // Sleeping/waking: move camera to focus on bed at left side
        p.camera(-60, -180, 150, -100, -97, -80, 0, 1, 0);
    } else {
        // Walking/climbing: wider view for larger room
        p.camera(0, -100, 280, 0, -50, 0, 0, 1, 0);
    }

    // Dim lighting for nighttime
    p.ambientLight(40);
    p.directionalLight(60, 60, 100, 0.5, 1, -0.5);  // Moonlight

    // Bedroom floor (matches house interior 400x300)
    p.push();
    p.rotateX(p.HALF_PI);
    p.fill(100, 110, 130);  // Blue-gray carpet (matches house interior)
    p.plane(400, 300);
    p.pop();

    // Back wall (matches house interior)
    p.push();
    p.translate(0, -80, -150);
    p.fill(170, 185, 210);  // Soft blue (matches house interior)
    p.box(400, 160, 5);
    p.pop();

    // Side walls (matches house interior)
    p.push();
    p.translate(-200, -80, 0);
    p.fill(160, 175, 200);
    p.box(5, 160, 300);
    p.pop();
    p.push();
    p.translate(200, -80, 0);
    p.fill(160, 175, 200);
    p.box(5, 160, 300);
    p.pop();

    // Ceiling
    p.push();
    p.translate(0, -160, 0);
    p.rotateX(p.HALF_PI);
    p.fill(240, 240, 245);
    p.plane(400, 300);
    p.pop();

    // Baseboard trim
    p.fill(250, 250, 250);
    p.push();
    p.translate(0, -5, -148);
    p.box(400, 10, 2);
    p.pop();

    // Window on left wall with moon (matches house interior position)
    p.push();
    p.translate(-197, -90, -50);
    p.rotateY(p.HALF_PI);
    // Window frame
    p.fill(250, 250, 250);
    p.box(70, 80, 4);
    // Night sky through window
    p.fill(20, 20, 50);
    p.push();
    p.translate(0, 0, 1);
    p.box(58, 68, 1);
    p.pop();
    // Window dividers
    p.fill(250, 250, 250);
    p.push();
    p.translate(0, 0, 2);
    p.box(2, 68, 2);
    p.pop();
    p.push();
    p.translate(0, 0, 2);
    p.box(58, 2, 2);
    p.pop();
    // Moon visible through window
    p.fill(255, 255, 220);
    p.push();
    p.translate(15, -15, -2);
    p.sphere(10);
    p.pop();
    // Curtains
    p.fill(150, 100, 100);
    p.push();
    p.translate(-35, 0, 5);
    p.box(12, 90, 3);
    p.pop();
    p.push();
    p.translate(35, 0, 5);
    p.box(12, 90, 3);
    p.pop();
    // Moonlight glow
    p.fill(100, 100, 150, 40);
    p.push();
    p.translate(0, 0, 10);
    p.box(80, 100, 2);
    p.pop();
    p.pop();

    // Draw bunkbed with slide (at left side)
    drawBunkBed(p);

    // Draw computer desk (at right side) - built or empty
    drawCutsceneComputerDesk(p);

    // Draw Noah based on phase
    drawSleepingNoah(p, m1.sleepCutscene);

    // Draw sleep overlay text
    drawSleepOverlay(p, m1.sleepCutscene);
}

/**
 * Draw the bunkbed with slide (positioned at left side to match house interior)
 */
function drawBunkBed(p) {
    // Position bed at left side of room (matches house interior)
    const bedX = -100;
    const bedZ = -80;

    p.push();
    p.translate(bedX, 0, bedZ);

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
    // Blue blanket (covers Noah when sleeping)
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

    // Slide base (curved would be ideal, but we'll use angled box)
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
 * Draw computer desk in sleep cutscene (at right side, matches house interior)
 * Shows built computer if owned, otherwise empty desk
 */
function drawCutsceneComputerDesk(p) {
    // Position desk at right side of room (matches house interior)
    const deskX = 100;
    const deskZ = -80;

    p.push();
    p.translate(deskX, 0, deskZ);

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

    if (isComputerBuilt()) {
        // Draw full computer setup

        // Monitor
        p.fill(30, 30, 35);  // Dark plastic
        p.push();
        p.translate(0, -65, -10);
        p.box(50, 35, 3);
        p.pop();

        // Monitor screen (dim for nighttime)
        p.fill(20, 30, 50);  // Dark screen
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

        // PC power light (dim green)
        p.fill(0, 100, 50);
        p.push();
        p.translate(38, -20, -5);
        p.sphere(2);
        p.pop();

        // Chair
        drawCutsceneChair(p);
    } else {
        // Empty desk - just the chair
        drawCutsceneChair(p);
    }

    p.pop();
}

/**
 * Draw desk chair for cutscene
 */
function drawCutsceneChair(p) {
    p.push();
    p.translate(0, 0, 35);

    // Seat
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

    // Chair base
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

    p.pop();
}

/**
 * Draw Noah in various sleep phases
 */
function drawSleepingNoah(p, cutscene) {
    p.push();
    p.translate(cutscene.noahX, -cutscene.noahY, cutscene.noahZ);

    if (cutscene.phase === 0) {
        // Walking - normal standing Noah facing bed
        p.rotateY(Math.PI);
        drawStandingNoah(p, true);
    } else if (cutscene.phase === 1) {
        // Climbing ladder
        p.rotateY(Math.PI / 2);
        drawClimbingNoah(p);
    } else if (cutscene.phase === 2 || cutscene.phase === 3) {
        // Sleeping in bed (lying down)
        drawLyingNoah(p, cutscene.phase === 2);
    }

    p.pop();
}

/**
 * Draw standing Noah (walking to bed)
 */
function drawStandingNoah(p, walking) {
    const legSwing = walking ? Math.sin(Date.now() * 0.01) * 0.3 : 0;

    // Pajamas (light blue)
    p.fill(150, 180, 220);

    // Body
    p.push();
    p.translate(0, -18, 0);
    p.box(14, 22, 10);
    p.pop();

    // Legs
    p.push();
    p.translate(-4, -4, 0);
    p.rotateX(legSwing);
    p.box(5, 14, 5);
    p.pop();
    p.push();
    p.translate(4, -4, 0);
    p.rotateX(-legSwing);
    p.box(5, 14, 5);
    p.pop();

    // Arms
    p.fill(255, 220, 180);  // Skin
    p.push();
    p.translate(-10, -20, 0);
    p.box(4, 14, 4);
    p.pop();
    p.push();
    p.translate(10, -20, 0);
    p.box(4, 14, 4);
    p.pop();

    // Head
    p.push();
    p.translate(0, -35, 0);
    p.fill(255, 220, 180);
    p.sphere(8);
    // Hair
    p.fill(255, 220, 0);
    p.translate(0, -4, 0);
    p.box(17, 6, 16);
    p.pop();
}

/**
 * Draw Noah climbing ladder
 */
function drawClimbingNoah(p) {
    const climbAnim = Math.sin(Date.now() * 0.008) * 0.3;

    // Pajamas (light blue)
    p.fill(150, 180, 220);

    // Body
    p.push();
    p.translate(0, -18, 0);
    p.box(14, 22, 10);
    p.pop();

    // Legs (climbing motion)
    p.push();
    p.translate(-4, -4, 0);
    p.rotateX(climbAnim);
    p.box(5, 14, 5);
    p.pop();
    p.push();
    p.translate(4, -4, 0);
    p.rotateX(-climbAnim);
    p.box(5, 14, 5);
    p.pop();

    // Arms reaching up
    p.fill(255, 220, 180);
    p.push();
    p.translate(-8, -28, -5);
    p.rotateX(-0.8 + climbAnim * 0.3);
    p.box(4, 14, 4);
    p.pop();
    p.push();
    p.translate(8, -28, -5);
    p.rotateX(-0.8 - climbAnim * 0.3);
    p.box(4, 14, 4);
    p.pop();

    // Head
    p.push();
    p.translate(0, -35, 0);
    p.fill(255, 220, 180);
    p.sphere(8);
    p.fill(255, 220, 0);
    p.translate(0, -4, 0);
    p.box(17, 6, 16);
    p.pop();
}

/**
 * Draw Noah lying in bed
 */
function drawLyingNoah(p, sleeping) {
    p.push();
    p.rotateZ(p.HALF_PI);  // Lying down
    p.rotateY(p.HALF_PI);

    // Pajamas visible above blanket
    p.fill(150, 180, 220);

    // Upper body (visible above blanket)
    p.push();
    p.translate(0, -5, 0);
    p.box(10, 14, 10);
    p.pop();

    // Arms at sides
    p.fill(255, 220, 180);
    p.push();
    p.translate(0, -5, -8);
    p.box(4, 10, 4);
    p.pop();
    p.push();
    p.translate(0, -5, 8);
    p.box(4, 10, 4);
    p.pop();

    // Head on pillow
    p.push();
    p.translate(0, 10, 0);
    p.fill(255, 220, 180);
    p.sphere(7);
    // Hair
    p.fill(255, 220, 0);
    p.translate(0, 0, -3);
    p.box(14, 14, 5);

    // Closed eyes (sleeping) or open eyes (waking)
    if (sleeping) {
        // Closed eyes - just lines
        p.fill(50, 50, 50);
        p.push();
        p.translate(3, -2, 5);
        p.box(3, 0.5, 0.5);
        p.pop();
        p.push();
        p.translate(-3, -2, 5);
        p.box(3, 0.5, 0.5);
        p.pop();
        // Zzz floating
        drawZzz(p);
    } else {
        // Open eyes
        p.fill(100, 100, 255);
        p.push();
        p.translate(3, -2, 6);
        p.sphere(1.5);
        p.pop();
        p.push();
        p.translate(-3, -2, 6);
        p.sphere(1.5);
        p.pop();
    }
    p.pop();

    p.pop();
}

/**
 * Draw floating Zzz above Noah
 */
function drawZzz(p) {
    const time = Date.now() * 0.002;
    const bobble = Math.sin(time) * 3;

    p.push();
    p.translate(15, -20 + bobble, 10);
    p.rotateY(-p.HALF_PI);

    // Draw "Z" shapes floating up
    p.fill(200, 200, 255, 200);
    for (let i = 0; i < 3; i++) {
        p.push();
        const offset = (time + i * 0.5) % 2;
        p.translate(i * 8, -offset * 15, 0);
        p.scale(0.8 + i * 0.2);
        // Simple Z shape using boxes
        p.box(6, 1, 1);
        p.translate(2, -3, 0);
        p.rotateZ(0.8);
        p.box(6, 1, 1);
        p.translate(2, -3, 0);
        p.rotateZ(-0.8);
        p.box(6, 1, 1);
        p.pop();
    }
    p.pop();
}

/**
 * Draw text overlay for sleep cutscene
 */
function drawSleepOverlay(p, cutscene) {
    // This will be handled by HTML overlay instead for better text rendering
}
