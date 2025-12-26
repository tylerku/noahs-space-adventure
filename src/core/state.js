/**
 * State Management - Centralized game state
 */

import {
    GAME_STATES, PLAYER, MISSION1, ROCKET_PARTS, NEIGHBORS,
    TIME, STATS, COMPUTER_PARTS, LOCATIONS, CRYPTO
} from './constants.js';

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

    // Mommy state (stands beside Noah's house)
    mommy: {
        x: MISSION1.MOMMY.X,       // To the left of Noah's house
        z: MISSION1.MOMMY.Z,       // Beside the house
        showingDialog: false,
    },

    // ============ NEW: Time System ============
    gameTime: {
        hour: TIME.SUNRISE_HOUR,
        minute: 0,
        dayNumber: 1,
        isSleeping: false,
    },

    // ============ Sleep Cutscene State ============
    sleepCutscene: {
        isActive: false,
        phase: 0,           // 0=walking to bed, 1=climbing, 2=sleeping, 3=waking
        startTime: 0,
        noahX: 0,
        noahY: 0,
        noahZ: 0,
    },

    // ============ NEW: Stats System ============
    stats: {
        stamina: {
            level: 1,
            xp: 0,
        },
        intelligence: {
            level: 1,
            xp: 0,
        },
    },

    // ============ NEW: Computer System ============
    computer: {
        parts: Object.fromEntries(
            Object.entries(COMPUTER_PARTS).map(([key, part]) => [
                key,
                { ...part, owned: false }
            ])
        ),
        isBuilt: false,
        isInteracting: false,
        showingDialog: false,
    },

    // ============ NEW: Crypto System ============
    crypto: {
        spaceCoin: {
            price: CRYPTO.SPACECOIN.START_PRICE,
            owned: 0,
        },
        dogeCoin: {
            price: CRYPTO.DOGECOIN.START_PRICE,
            owned: 0,
        },
        showingDialog: false,
    },

    // ============ NEW: Coding System ============
    coding: {
        isActive: false,
        progress: 0,
        currentJob: null,
    },

    // ============ NEW: Library ============
    library: {
        x: LOCATIONS.LIBRARY.X,
        z: LOCATIONS.LIBRARY.Z,
        interactDist: LOCATIONS.LIBRARY.INTERACT_DIST,
        showingDialog: false,
        isReading: false,
        // Interior state
        isInside: false,
        hoveredObject: null,
        exitPosition: { x: 0, z: 0 },
    },

    // ============ NEW: Running Track ============
    runningTrack: {
        x: LOCATIONS.RUNNING_TRACK.X,
        z: LOCATIONS.RUNNING_TRACK.Z,
        interactDist: LOCATIONS.RUNNING_TRACK.INTERACT_DIST,
        lapRadius: LOCATIONS.RUNNING_TRACK.LAP_RADIUS,
        isRunning: false,
        lapProgress: 0,
        currentLapAngle: 0,
    },

    // ============ NEW: Dad & Sedan (House Flipping) ============
    dad: {
        x: LOCATIONS.DAD.X,
        z: LOCATIONS.DAD.Z,
        interactDist: LOCATIONS.DAD.INTERACT_DIST,
        showingDialog: false,
        isFlippingHouse: false,
    },

    sedan: {
        x: LOCATIONS.SEDAN.X,
        z: LOCATIONS.SEDAN.Z,
    },

    // ============ NEW: Rocket Assembly ============
    rocket: {
        isAssembled: false,
        isAssembling: false,
        assemblyProgress: 0,
    },

    // ============ NEW: Launch Pad ============
    launchPad: {
        x: 450,
        z: -220,
        interactDist: 60,
    },

    // ============ NEW: House Interior ============
    house: {
        isInside: false,
        hoveredObject: null,
        exitPosition: { x: 0, z: 0 },
    },

    // ============ NEW: Coding Jobs ============
    codingJobs: [
        { id: 1, title: "Build iOS App", client: "StartupX", pay: 50, description: "Create a simple todo app", difficulty: "Medium" },
        { id: 2, title: "Fix Website Bugs", client: "LocalBiz", pay: 25, description: "Debug login form issues", difficulty: "Easy" },
        { id: 3, title: "Build REST API", client: "TechCorp", pay: 75, description: "Create backend endpoints", difficulty: "Hard" },
        { id: 4, title: "React Dashboard", client: "DataViz Inc", pay: 60, description: "Build analytics dashboard", difficulty: "Medium" },
        { id: 5, title: "Database Migration", client: "OldSchool LLC", pay: 40, description: "Migrate MySQL to PostgreSQL", difficulty: "Medium" },
        { id: 6, title: "Mobile Game UI", client: "GameStudio", pay: 55, description: "Design game interface", difficulty: "Medium" },
        { id: 7, title: "E-commerce Cart", client: "ShopNow", pay: 45, description: "Build shopping cart feature", difficulty: "Easy" },
        { id: 8, title: "Chat Bot", client: "SupportCo", pay: 70, description: "Create customer service bot", difficulty: "Hard" },
    ],
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
        // NEW: Save stats
        stats: {
            stamina: { ...m1.stats.stamina },
            intelligence: { ...m1.stats.intelligence },
        },
        // NEW: Save time
        gameTime: { ...m1.gameTime },
        // NEW: Save computer parts
        computerParts: Object.fromEntries(
            Object.entries(m1.computer.parts).map(([key, part]) => [key, part.owned])
        ),
        computerBuilt: m1.computer.isBuilt,
        // NEW: Save crypto
        crypto: {
            spaceCoin: { ...m1.crypto.spaceCoin },
            dogeCoin: { ...m1.crypto.dogeCoin },
        },
        // NEW: Save rocket assembly
        rocketAssembled: m1.rocket.isAssembled,
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

        // NEW: Restore stats
        if (saveData.stats) {
            if (saveData.stats.stamina) {
                m1.stats.stamina.level = saveData.stats.stamina.level || 1;
                m1.stats.stamina.xp = saveData.stats.stamina.xp || 0;
            }
            if (saveData.stats.intelligence) {
                m1.stats.intelligence.level = saveData.stats.intelligence.level || 1;
                m1.stats.intelligence.xp = saveData.stats.intelligence.xp || 0;
            }
        }

        // NEW: Restore time
        if (saveData.gameTime) {
            m1.gameTime.hour = saveData.gameTime.hour || TIME.SUNRISE_HOUR;
            m1.gameTime.minute = saveData.gameTime.minute || 0;
            m1.gameTime.dayNumber = saveData.gameTime.dayNumber || 1;
        }

        // NEW: Restore computer parts
        if (saveData.computerParts) {
            for (const key in saveData.computerParts) {
                if (m1.computer.parts[key]) {
                    m1.computer.parts[key].owned = saveData.computerParts[key];
                }
            }
        }
        m1.computer.isBuilt = saveData.computerBuilt || false;

        // NEW: Restore crypto
        if (saveData.crypto) {
            if (saveData.crypto.spaceCoin) {
                m1.crypto.spaceCoin.price = saveData.crypto.spaceCoin.price || CRYPTO.SPACECOIN.START_PRICE;
                m1.crypto.spaceCoin.owned = saveData.crypto.spaceCoin.owned || 0;
            }
            if (saveData.crypto.dogeCoin) {
                m1.crypto.dogeCoin.price = saveData.crypto.dogeCoin.price || CRYPTO.DOGECOIN.START_PRICE;
                m1.crypto.dogeCoin.owned = saveData.crypto.dogeCoin.owned || 0;
            }
        }

        // NEW: Restore rocket assembly
        m1.rocket.isAssembled = saveData.rocketAssembled || false;

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
 * Check if any rocket parts are owned
 */
export function anyRocketPartsOwned() {
    return Object.values(mission1State.rocketParts).some(part => part.owned);
}

/**
 * Get count of owned rocket parts
 */
export function getOwnedRocketPartsCount() {
    return Object.values(mission1State.rocketParts).filter(part => part.owned).length;
}

/**
 * Check if rocket is assembled
 */
export function isRocketAssembled() {
    return mission1State.rocket.isAssembled;
}

/**
 * Check if ready to launch (all requirements met)
 */
export function isReadyToLaunch() {
    const m1 = mission1State;
    return (
        m1.stats.stamina.level >= 10 &&
        m1.stats.intelligence.level >= 10 &&
        allRocketPartsOwned() &&
        m1.rocket.isAssembled
    );
}

/**
 * Assemble the rocket
 */
export function assembleRocket() {
    mission1State.rocket.isAssembled = true;
    saveMission1Progress();
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

// ============ NEW: TIME SYSTEM FUNCTIONS ============

/**
 * Get XP required for next level (same for both stats)
 */
export function getXPForNextLevel(currentLevel) {
    if (currentLevel >= STATS.MAX_LEVEL) return Infinity;
    return STATS.XP_PER_LEVEL[currentLevel - 1] || 50;
}

/**
 * Advance game time by minutes
 */
export function advanceTime(minutes) {
    const m1 = mission1State;
    m1.gameTime.minute += minutes;

    // Handle hour overflow
    while (m1.gameTime.minute >= 60) {
        m1.gameTime.minute -= 60;
        m1.gameTime.hour++;
    }

    // Check for night time
    if (m1.gameTime.hour >= TIME.SUNSET_HOUR) {
        // Time to sleep!
        return true; // Signal that it's night
    }

    saveMission1Progress();
    return false;
}

/**
 * Check if it's night time
 */
export function isNightTime() {
    return mission1State.gameTime.hour >= TIME.SUNSET_HOUR;
}

/**
 * Check if it's getting dark (warning time - 7 PM)
 */
export function isGettingDark() {
    return mission1State.gameTime.hour >= 19 && mission1State.gameTime.hour < TIME.SUNSET_HOUR;
}

/**
 * Start a new day
 */
export function startNewDay() {
    const m1 = mission1State;
    m1.gameTime.hour = TIME.SUNRISE_HOUR;
    m1.gameTime.minute = 0;
    m1.gameTime.dayNumber++;
    m1.gameTime.isSleeping = false;

    // Update crypto prices for new day
    updateCryptoPrices();

    saveMission1Progress();
}

/**
 * Get formatted time string (e.g., "2:30 PM")
 */
export function getFormattedTime() {
    const m1 = mission1State;
    const hour = m1.gameTime.hour;
    const minute = m1.gameTime.minute;
    const isPM = hour >= 12;
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${isPM ? 'PM' : 'AM'}`;
}

// ============ NEW: STATS SYSTEM FUNCTIONS ============

/**
 * Add Stamina XP and handle level up
 * @returns {boolean} true if leveled up
 */
export function addStaminaXP(amount) {
    const m1 = mission1State;
    const stamina = m1.stats.stamina;

    if (stamina.level >= STATS.MAX_LEVEL) return false;

    stamina.xp += amount;
    const xpNeeded = getXPForNextLevel(stamina.level);

    if (stamina.xp >= xpNeeded) {
        stamina.xp -= xpNeeded;
        stamina.level++;
        saveMission1Progress();
        return true; // Leveled up!
    }

    saveMission1Progress();
    return false;
}

/**
 * Add Intelligence XP and handle level up
 * @returns {boolean} true if leveled up
 */
export function addIntelligenceXP(amount) {
    const m1 = mission1State;
    const intel = m1.stats.intelligence;

    if (intel.level >= STATS.MAX_LEVEL) return false;

    intel.xp += amount;
    const xpNeeded = getXPForNextLevel(intel.level);

    if (intel.xp >= xpNeeded) {
        intel.xp -= xpNeeded;
        intel.level++;
        saveMission1Progress();
        return true; // Leveled up!
    }

    saveMission1Progress();
    return false;
}

/**
 * Get current stamina level
 */
export function getStaminaLevel() {
    return mission1State.stats.stamina.level;
}

/**
 * Get current intelligence level
 */
export function getIntelligenceLevel() {
    return mission1State.stats.intelligence.level;
}

/**
 * Get Noah's movement speed (base + stamina bonus)
 */
export function getNoahSpeed() {
    const staminaLevel = mission1State.stats.stamina.level;
    return PLAYER.M1_MOVE_SPEED + (staminaLevel - 1) * STATS.STAMINA.SPEED_BONUS_PER_LEVEL;
}

// ============ NEW: COMPUTER SYSTEM FUNCTIONS ============

/**
 * Check if all computer parts are owned
 */
export function allComputerPartsOwned() {
    return Object.values(mission1State.computer.parts).every(part => part.owned);
}

/**
 * Check if computer is built
 */
export function isComputerBuilt() {
    return mission1State.computer.isBuilt;
}

/**
 * Buy a computer part
 */
export function buyComputerPart(partKey) {
    const part = mission1State.computer.parts[partKey];
    if (part && !part.owned && spendMoney(part.price)) {
        part.owned = true;
        saveMission1Progress();
        return true;
    }
    return false;
}

/**
 * Get count of owned computer parts
 */
export function getOwnedPartsCount() {
    return Object.values(mission1State.computer.parts).filter(part => part.owned).length;
}

/**
 * Build the computer (requires all parts, must be done in Noah's room)
 */
export function buildComputer() {
    if (allComputerPartsOwned() && !mission1State.computer.isBuilt) {
        mission1State.computer.isBuilt = true;
        saveMission1Progress();
        return true;
    }
    return false;
}

// ============ NEW: CRYPTO FUNCTIONS ============

/**
 * Update crypto prices (called on new day)
 */
export function updateCryptoPrices() {
    const m1 = mission1State;

    // BitCoin: Volatile with upward trend
    const spaceChange = (Math.random() - 0.5) * 2 * CRYPTO.SPACECOIN.VOLATILITY + CRYPTO.SPACECOIN.TREND_UP;
    m1.crypto.spaceCoin.price = Math.max(10, m1.crypto.spaceCoin.price * (1 + spaceChange));
    m1.crypto.spaceCoin.price = Math.round(m1.crypto.spaceCoin.price * 100) / 100;

    // DogeCoin: Very volatile, usually down, chance to moon
    if (Math.random() < CRYPTO.DOGECOIN.MOON_CHANCE) {
        // MOON! 5x the price
        m1.crypto.dogeCoin.price *= 5;
    } else {
        const dogeChange = (Math.random() - 0.5) * 2 * CRYPTO.DOGECOIN.VOLATILITY + CRYPTO.DOGECOIN.TREND_DOWN;
        m1.crypto.dogeCoin.price = Math.max(0.01, m1.crypto.dogeCoin.price * (1 + dogeChange));
    }
    m1.crypto.dogeCoin.price = Math.round(m1.crypto.dogeCoin.price * 100) / 100;

    saveMission1Progress();
}

/**
 * Buy crypto
 */
export function buyCrypto(coinType, dollarAmount) {
    const m1 = mission1State;
    if (dollarAmount > m1.money) return false;

    const coin = coinType === 'spaceCoin' ? m1.crypto.spaceCoin : m1.crypto.dogeCoin;
    const amountToBuy = dollarAmount / coin.price;

    m1.money -= dollarAmount;
    coin.owned += amountToBuy;

    saveMission1Progress();
    return true;
}

/**
 * Sell crypto
 */
export function sellCrypto(coinType, coinAmount) {
    const m1 = mission1State;
    const coin = coinType === 'spaceCoin' ? m1.crypto.spaceCoin : m1.crypto.dogeCoin;

    if (coinAmount > coin.owned) return false;

    const dollarValue = coinAmount * coin.price;
    coin.owned -= coinAmount;
    m1.money += Math.floor(dollarValue);

    saveMission1Progress();
    return true;
}

/**
 * Get crypto portfolio value
 */
export function getCryptoPortfolioValue() {
    const m1 = mission1State;
    const spaceValue = m1.crypto.spaceCoin.owned * m1.crypto.spaceCoin.price;
    const dogeValue = m1.crypto.dogeCoin.owned * m1.crypto.dogeCoin.price;
    return Math.floor(spaceValue + dogeValue);
}

// ============ NEW: VICTORY CONDITIONS ============

/**
 * Check if all victory conditions are met
 */
export function checkVictoryConditions() {
    const m1 = mission1State;
    return (
        m1.stats.stamina.level >= STATS.MAX_LEVEL &&
        m1.stats.intelligence.level >= STATS.MAX_LEVEL &&
        allRocketPartsOwned() &&
        m1.rocket.isAssembled
    );
}

/**
 * Check if rocket parts are unlocked (INT level 8+)
 */
export function areRocketPartsUnlocked() {
    return mission1State.stats.intelligence.level >= STATS.INTELLIGENCE.UNLOCK_ROCKET_PARTS;
}

/**
 * Check if house flipping is unlocked (INT level 3+)
 */
export function isHouseFlippingUnlocked() {
    return mission1State.stats.intelligence.level >= STATS.INTELLIGENCE.UNLOCK_HOUSE_FLIP;
}

/**
 * Check if coding is unlocked (INT level 4+ and computer built)
 */
export function isCodingUnlocked() {
    return (
        mission1State.stats.intelligence.level >= STATS.INTELLIGENCE.UNLOCK_CODING &&
        mission1State.computer.isBuilt
    );
}
