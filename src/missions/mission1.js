/**
 * Mission 1: Belle Pond Avenue
 * Neighborhood simulator - mow lawns, sell lemonade, buy rocket parts
 */

import { MISSION1, COLORS, ANIMATION, TERRAIN } from '../core/constants.js';
import {
    mission1State, noah, resetMission1State, initializeNeighbors,
    addMoney, spendMoney, buyRocketPart, allRocketPartsOwned,
    loadMission1Progress
} from '../core/state.js';
import { drawHannah, drawNeighbor, drawNiam, drawMommy } from '../entities/characters.js';
import {
    showNotification, showConversationDialog, hideConversationDialog,
    showPrompt, hidePrompt, showShop, hideShop, updateM1HUD,
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

    // Load saved progress (money, rocket parts)
    loadMission1Progress();

    updateM1HUD(
        mission1State.money,
        mission1State.lemonadeEarnings,
        mission1State.customersWaiting,
        mission1State.rocketParts
    );
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
    m1.trees.push({ x: 450, z: 50, height: 58, width: 34 });
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

        // Skip road area
        if (Math.abs(fx) < 80 && fz < 200 && fz > -150) continue;

        m1.flowers.push({
            x: fx,
            z: fz,
            color: COLORS.FLOWER_VARIANTS[Math.floor(Math.random() * COLORS.FLOWER_VARIANTS.length)],
        });
    }
}

// ============ UPDATE LOOP ============

/**
 * Main Mission 1 update
 */
export function updateMission1(p) {
    const m1 = mission1State;

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
    const speed = MISSION1.NEIGHBOR_WALK_SPEED * 2;
    if (p.keyIsDown(87)) noah.z += speed; // W - up (with flipped camera)
    if (p.keyIsDown(83)) noah.z -= speed; // S - down
    if (p.keyIsDown(65)) noah.x += speed; // A - left
    if (p.keyIsDown(68)) noah.x -= speed; // D - right

    // Clamp to bounds
    noah.x = p.constrain(noah.x, MISSION1.BOUNDS.MIN_X, MISSION1.BOUNDS.MAX_X);
    noah.z = p.constrain(noah.z, MISSION1.BOUNDS.MIN_Z, MISSION1.BOUNDS.MAX_Z);
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

    if (p.keyIsDown(87)) { lawn.mowerZ += speed; lawn.mowerAngle = p.PI; moving = true; }       // W - up
    if (p.keyIsDown(83)) { lawn.mowerZ -= speed; lawn.mowerAngle = 0; moving = true; }         // S - down
    if (p.keyIsDown(65)) { lawn.mowerX += speed; lawn.mowerAngle = p.HALF_PI; moving = true; } // A - left
    if (p.keyIsDown(68)) { lawn.mowerX -= speed; lawn.mowerAngle = -p.HALF_PI; moving = true; } // D - right

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
    updateM1HUD(m1.money, m1.lemonadeEarnings, m1.customersWaiting, m1.rocketParts);
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
            updateM1HUD(m1.money, m1.lemonadeEarnings, m1.customersWaiting, m1.rocketParts);
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

            updateM1HUD(m1.money, m1.lemonadeEarnings, m1.customersWaiting, m1.rocketParts);

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
    if (m1.showingPrompt || m1.isShopOpen || m1.isMowing) {
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
            // Skip Noah's house - Mommy is standing in front
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

    // Check rocket shop
    const shopDist = Math.hypot(noah.x - m1.rocketShop.x, noah.z - (m1.rocketShop.z - 40));
    if (shopDist < MISSION1.SHOP_INTERACT_DIST) {
        return { type: 'shop', tooltip: 'enter Rocket Shop' };
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
    updateM1HUD(m1.money, m1.lemonadeEarnings, m1.customersWaiting, m1.rocketParts);

    return true;
}

/**
 * Close Mommy dialog
 */
export function closeMommyDialog() {
    mission1State.mommy.showingDialog = false;
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
        updateM1HUD(m1.money, m1.lemonadeEarnings, m1.customersWaiting, m1.rocketParts);
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
 * Open rocket shop
 */
export function openRocketShop() {
    const m1 = mission1State;
    m1.isShopOpen = true;
    hidePrompt();
    showShop(m1.rocketParts, m1.money);
}

/**
 * Close rocket shop
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
        updateM1HUD(m1.money, m1.lemonadeEarnings, m1.customersWaiting, m1.rocketParts);
        showShop(m1.rocketParts, m1.money); // Refresh

        if (allRocketPartsOwned()) {
            return true; // Victory!
        }
    }
    return false;
}

// ============ RENDERING ============

/**
 * Draw Mission 1 scene
 */
export function drawMission1Scene(p) {
    const m1 = mission1State;

    // Sky
    p.background(...COLORS.M1_SKY);

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

    // Lighting - balanced illumination
    p.ambientLight(100);
    p.directionalLight(200, 200, 180, 0, 0.7, 0.5);    // Main light from above-front
    p.directionalLight(80, 80, 100, 0, 0.8, -0.3);     // Subtle fill from back

    // Ground
    p.push();
    p.rotateX(p.HALF_PI);
    p.fill(...COLORS.M1_GRASS);
    p.plane(1200, 1000);
    p.pop();

    // Draw scene elements
    drawM1Roads(p);
    drawM1Lake(p, m1.lake);
    m1.houses.forEach(house => drawM1House(p, house));
    m1.trees.forEach(tree => drawM1Tree(p, tree));
    m1.flowers.forEach(flower => drawM1Flower(p, flower));
    drawLemonadeStand(p, m1.lemonadeStand);
    drawRocketShop(p, m1.rocketShop);

    // Draw NPCs (only show when door is open/talking, or walking to/at lemonade stand)
    m1.neighbors.forEach(neighbor => {
        if (neighbor.doorOpen || neighbor.isWalking || neighbor.isDrinking || neighbor.atLemonade) {
            drawNeighbor(p, neighbor);
        }
    });

    // Draw Noah
    drawM1Noah(p);

    // Draw Niam
    if (m1.niam.isApproaching || m1.niam.showingDialog) {
        drawNiam(p, {
            x: m1.niam.x,
            z: m1.niam.z,
            isApproaching: m1.niam.isApproaching,
            noahX: noah.x,
            noahZ: noah.z,
        });
    }

    // Draw Mommy (always visible in front of Noah's house)
    drawMommy(p, { x: m1.mommy.x, z: m1.mommy.z });

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

    p.pop();  // End mower

    // Draw Noah separately (always behind mower from camera view)
    p.push();
    // Noah is always at -Z from mower (closer to camera)
    p.translate(lawn.mowerX, 0, lawn.mowerZ - 40);
    // Noah faces the mower (toward +Z)
    p.rotateY(p.PI);
    const legSwing = Math.sin(p.frameCount * ANIMATION.WALK_CYCLE) * 0.4;
    p.fill(50, 50, 150);
    p.push();
    p.translate(-5, -8, 0);
    p.rotateX(legSwing);
    p.box(5, 16, 5);
    p.pop();
    p.push();
    p.translate(5, -8, 0);
    p.rotateX(-legSwing);
    p.box(5, 16, 5);
    p.pop();
    p.fill(0, 100, 255);
    p.push();
    p.translate(0, -25, 0);
    p.box(16, 22, 12);
    p.pop();
    p.fill(255, 220, 180);
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
    p.push();
    p.translate(0, -42, 0);
    p.sphere(9);
    p.fill(255, 220, 0);
    p.translate(0, -5, 0);
    p.box(18, 7, 16);
    p.pop();

    p.pop();  // End Noah
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

function drawM1Roads(p) {
    p.fill(...COLORS.M1_ROAD);
    const roadWidth = 45;
    const roadY = -0.5;

    const segments = [
        { x: -200, z: 80, w: 150, rz: 0 },
        { x: -80, z: 95, w: 120, rz: 0.15 },
        { x: 30, z: 105, w: 130, rz: 0 },
        { x: 140, z: 95, w: 120, rz: -0.15 },
        { x: 260, z: 80, w: 150, rz: 0 },
        { x: -320, z: 50, w: 100, rz: 0 },
        { x: -260, z: 65, w: 60, rz: -0.4 },
    ];

    for (const seg of segments) {
        p.push();
        p.translate(seg.x, roadY, seg.z);
        p.rotateX(p.HALF_PI);
        if (seg.rz) p.rotateZ(seg.rz);
        p.box(seg.w, roadWidth, 1);
        p.pop();
    }

    // Cul-de-sac
    p.push();
    p.translate(350, roadY, 100);
    p.rotateX(p.HALF_PI);
    p.ellipse(0, 0, 80, 80);
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
    p.translate(flower.x, -3, flower.z);
    p.fill(...flower.color);
    p.sphere(3);
    p.fill(34, 139, 34);
    p.translate(0, 2, 0);
    p.cylinder(0.5, 4);
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

    // Hannah
    p.push();
    p.translate(-50, 0, 10);
    drawHannah(p, { isWaving: true });
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

    // Nose cone (red)
    p.fill(255, 50, 50);
    p.push();
    p.translate(0, -55, 0);
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

    // ROCKET SHOP sign on west wall (above door)
    p.fill(255, 100, 0);
    p.push();
    p.translate(-43, -70, 0);
    p.box(2, 22, 85);
    p.pop();
    p.fill(255, 255, 0);
    p.push();
    p.translate(-44, -70, 0);
    p.box(2, 18, 80);
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
