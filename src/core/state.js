/**
 * State Management - Centralized game state
 */

import { GAME_STATES, PLAYER, MISSION1, ROCKET_PARTS, NEIGHBORS } from './constants.js';

// ============ CORE GAME STATE ============
export const gameState = {
    current: GAME_STATES.MENU,
    currentMission: 0,
    introTimeout: null,
};

// ============ MARS DEFENSE STATE ============
export const marsState = {
    repairProgress: 0,
    hannahHealth: PLAYER.INITIAL_HEALTH,
};

// ============ PLAYER STATE ============
export const noah = {
    x: 0,
    z: 0,
    angle: 0,
    swingTimer: 0,
};

// ============ ENTITY POOLS ============
export const entities = {
    bullets: [],
    aliens: [],
    particles: [],
};

// ============ TERRAIN STATE ============
export const terrain = {
    rocks: [],
    craters: [],
    dunes: [],
    pebbles: [],
};

// ============ MISSION 1 STATE ============
export const mission1State = {
    money: 0,
    lemonadeEarnings: 0,
    customersWaiting: 0,
    lemonadeMaterials: 2,  // Starts with enough for 2 lemonades
    isShopOpen: false,
    isMowing: false,
    mowingProgress: 0,
    currentMowingNeighbor: null,

    // Mowing mini-game
    mowingMiniGame: false,
    mowingLawn: {
        grassTiles: [],
        mowerX: 0,
        mowerZ: 0,
        mowerAngle: 0,
        totalTiles: 0,
        cutTiles: 0,
        lawnWidth: MISSION1.MOWING.LAWN_WIDTH,
        lawnHeight: MISSION1.MOWING.LAWN_HEIGHT,
        tileSize: MISSION1.MOWING.TILE_SIZE,
        originalNoahPos: { x: 0, z: 0 },
        houseX: 0,
        houseZ: 0,
    },

    // Interaction state
    interactingNeighbor: null,
    showingPrompt: false,

    // Conversation state
    inConversation: false,
    conversationNeighbor: null,
    conversationPhase: 0,
    conversationTimer: 0,
    cameraTarget: { x: 0, y: 0, z: 0 },
    cameraPos: { x: 0, y: 0, z: 0 },

    // Neighbor animations
    walkingNeighbors: [],
    drinkingNeighbors: [],

    // Rocket parts ownership
    rocketParts: Object.fromEntries(
        Object.entries(ROCKET_PARTS).map(([key, part]) => [
            key,
            { ...part, owned: false }
        ])
    ),

    // Entities
    neighbors: [],
    houses: [],
    trees: [],
    flowers: [],
    roads: [],
    lake: {
        x: MISSION1.LAKE.X,
        z: MISSION1.LAKE.Z,
        width: MISSION1.LAKE.WIDTH,
        height: MISSION1.LAKE.HEIGHT,
    },
    lemonadeStand: {
        x: MISSION1.LEMONADE_STAND.X,
        z: MISSION1.LEMONADE_STAND.Z,
        customers: [],
    },
    rocketShop: {
        x: MISSION1.ROCKET_SHOP.X,
        z: MISSION1.ROCKET_SHOP.Z,
    },

    // Niam state
    niam: {
        x: -300,
        z: 50,
        isApproaching: false,
        showingDialog: false,
        lastApproachTime: 0,
        approachCooldown: MISSION1.NIAM.APPROACH_COOLDOWN,
    },

    // Mommy state (stands in front of Noah's house)
    mommy: {
        x: 0,       // Same X as Noah's house (middle house)
        z: 160,     // In front of the house
        showingDialog: false,
    },
};

// ============ SAVE/LOAD CONSTANTS ============
const MISSION1_SAVE_KEY = 'noahsSpaceAdventure_mission1';

// ============ STATE MANAGEMENT FUNCTIONS ============

/**
 * Save Mission 1 progress to localStorage
 */
export function saveMission1Progress() {
    const m1 = mission1State;
    const saveData = {
        money: m1.money,
        lemonadeEarnings: m1.lemonadeEarnings,
        rocketParts: Object.fromEntries(
            Object.entries(m1.rocketParts).map(([key, part]) => [key, part.owned])
        ),
        savedAt: Date.now(),
    };

    try {
        localStorage.setItem(MISSION1_SAVE_KEY, JSON.stringify(saveData));
    } catch (e) {
        console.warn('Failed to save Mission 1 progress:', e);
    }
}

/**
 * Load Mission 1 progress from localStorage
 * @returns {boolean} true if save was loaded, false if no save exists
 */
export function loadMission1Progress() {
    try {
        const savedJson = localStorage.getItem(MISSION1_SAVE_KEY);
        if (!savedJson) return false;

        const saveData = JSON.parse(savedJson);
        const m1 = mission1State;

        // Restore money and earnings
        m1.money = saveData.money || 0;
        m1.lemonadeEarnings = saveData.lemonadeEarnings || 0;

        // Restore rocket parts ownership
        if (saveData.rocketParts) {
            for (const key in saveData.rocketParts) {
                if (m1.rocketParts[key]) {
                    m1.rocketParts[key].owned = saveData.rocketParts[key];
                }
            }
        }

        return true;
    } catch (e) {
        console.warn('Failed to load Mission 1 progress:', e);
        return false;
    }
}

/**
 * Check if Mission 1 has saved progress
 */
export function hasMission1SaveData() {
    return localStorage.getItem(MISSION1_SAVE_KEY) !== null;
}

/**
 * Clear Mission 1 saved progress
 */
export function clearMission1SaveData() {
    localStorage.removeItem(MISSION1_SAVE_KEY);
}

/**
 * Reset all game state to initial values
 */
export function resetGameState() {
    gameState.current = GAME_STATES.MENU;
    gameState.currentMission = 0;

    marsState.repairProgress = 0;
    marsState.hannahHealth = PLAYER.INITIAL_HEALTH;

    noah.x = 0;
    noah.z = 0;
    noah.angle = 0;
    noah.swingTimer = 0;

    entities.bullets = [];
    entities.aliens = [];
    entities.particles = [];
}

/**
 * Reset Mission 1 state
 */
export function resetMission1State() {
    const m1 = mission1State;

    m1.money = 0;
    m1.lemonadeEarnings = 0;
    m1.customersWaiting = 0;
    m1.lemonadeMaterials = 2;  // Start with enough for 2 lemonades
    m1.isMowing = false;
    m1.mowingMiniGame = false;
    m1.mowingProgress = 0;
    m1.isShopOpen = false;
    m1.showingPrompt = false;
    m1.interactingNeighbor = null;
    m1.inConversation = false;
    m1.conversationNeighbor = null;
    m1.conversationPhase = 0;
    m1.conversationTimer = 0;
    m1.walkingNeighbors = [];
    m1.drinkingNeighbors = [];

    // Reset rocket parts
    for (const key in m1.rocketParts) {
        m1.rocketParts[key].owned = false;
    }

    // Reset Niam
    m1.niam.isApproaching = false;
    m1.niam.showingDialog = false;
    m1.niam.lastApproachTime = 0;
    m1.niam.x = -300;
    m1.niam.z = 50;

    // Reset Noah's position
    noah.x = 0;
    noah.z = -80;
}

/**
 * Initialize neighbors from config
 */
export function initializeNeighbors() {
    // Filter out Noah's house - Mommy stands there instead of a regular neighbor
    mission1State.neighbors = NEIGHBORS
        .filter(config => !config.isNoahsHouse)
        .map(config => ({
            ...config,
            x: config.homeX,
            z: config.homeZ - 50,  // Position in front of house (toward street)
            currentX: config.homeX,
            currentZ: config.homeZ - 50,
            mood: 100,
            askCount: 0,
            isHome: true,
            atLemonade: false,
            isWalking: false,
            isDrinking: false,
            drinkTimer: 0,
            doorOpen: false,
            facingSouth: true,  // Face the street
        }));

    // Link houses to neighbors (include all houses, but Noah's house has no interactive owner)
    mission1State.houses = NEIGHBORS.map(config => ({
        x: config.homeX,
        z: config.homeZ,
        color: config.houseColor,
        roofColor: config.roofColor,
        owner: config.isNoahsHouse ? null : mission1State.neighbors.find(n => n.homeX === config.homeX),
        facingSouth: true,  // Front doors face the street
        isPinned: config.isPinned || false,
        isNoahsHouse: config.isNoahsHouse || false,
    }));
}

/**
 * Set game state
 */
export function setGameState(state) {
    gameState.current = state;
}

/**
 * Get current game state
 */
export function getGameState() {
    return gameState.current;
}

/**
 * Check if all rocket parts are owned
 */
export function allRocketPartsOwned() {
    return Object.values(mission1State.rocketParts).every(part => part.owned);
}

/**
 * Add money to Mission 1
 */
export function addMoney(amount) {
    mission1State.money += amount;
    saveMission1Progress();
}

/**
 * Spend money in Mission 1
 */
export function spendMoney(amount) {
    if (mission1State.money >= amount) {
        mission1State.money -= amount;
        return true;
    }
    return false;
}

/**
 * Buy a rocket part
 */
export function buyRocketPart(partKey) {
    const part = mission1State.rocketParts[partKey];
    if (part && !part.owned && spendMoney(part.price)) {
        part.owned = true;
        saveMission1Progress();
        return true;
    }
    return false;
}

/**
 * Damage Hannah/James
 */
export function damageHannah(amount) {
    marsState.hannahHealth -= amount;
    return marsState.hannahHealth <= 0;
}

/**
 * Add repair progress
 */
export function addRepairProgress(amount) {
    marsState.repairProgress += amount;
    return marsState.repairProgress >= 100;
}

/**
 * Add entity to pool
 */
export function addBullet(bullet) {
    entities.bullets.push(bullet);
}

export function addAlien(alien) {
    entities.aliens.push(alien);
}

export function addParticle(particle) {
    entities.particles.push(particle);
}

/**
 * Clear entities
 */
export function clearEntities() {
    entities.bullets = [];
    entities.aliens = [];
    entities.particles = [];
}
