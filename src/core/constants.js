/**
 * Game Constants - All magic numbers and configuration values
 */

// ============ TIME SYSTEM ============
export const TIME = {
    SUNRISE_HOUR: 6,
    SUNSET_HOUR: 20,          // 8 PM
    MINUTES_PER_ACTIVITY: {
        MOWING: 60,            // 1 hour
        READING: 240,          // 4 hours
        TUTORING: 120,         // 2 hours
        RUNNING_LAP: 180,      // 3 hours per lap
        CODING: 120,           // 2 hours
        HOUSE_FLIPPING: 720,   // 12 hours (must start early!)
        ROCKET_ASSEMBLY: 120,  // 2 hours
    },
};

// ============ STATS SYSTEM ============
export const STATS = {
    MAX_LEVEL: 10,
    // XP required to reach each level (index 0 = level 2, etc.)
    XP_PER_LEVEL: [50, 75, 100, 150, 200, 275, 350, 450, 550],

    STAMINA: {
        XP_PER_LAP: 50,
        SPEED_BONUS_PER_LEVEL: 0.5,  // +0.5 speed per level
    },

    INTELLIGENCE: {
        XP_READING: 25,
        XP_TUTORING: 200,
        XP_CODING: 15,
        XP_HOUSE_FLIP: 150,
        UNLOCK_HOUSE_FLIP: 3,
        UNLOCK_CODING: 4,
        UNLOCK_ROCKET_PARTS: 8,
    },
};

// ============ COMPUTER PARTS ============
export const COMPUTER_PARTS = {
    monitor: { price: 30, name: "Monitor", icon: "🖥️", desc: "See your code!" },
    tower: { price: 35, name: "Tower", icon: "🗄️", desc: "The computer brain box" },
    keyboard: { price: 20, name: "Keyboard", icon: "⌨️", desc: "Type your code" },
    mouse: { price: 15, name: "Mouse", icon: "🖱️", desc: "Click and drag" },
    desk: { price: 40, name: "Desk", icon: "🪑", desc: "A place to work" },
    motherboard: { price: 35, name: "Motherboard", icon: "🔧", desc: "Connects everything" },
    ram: { price: 30, name: "RAM", icon: "💾", desc: "Fast memory" },
    gpu: { price: 25, name: "GPU", icon: "🎮", desc: "Graphics power!" },
    cpu: { price: 20, name: "CPU", icon: "🧠", desc: "The thinking chip" },
};

// ============ LOCATIONS ============
export const LOCATIONS = {
    LIBRARY: {
        X: -270,  // West side of the perpendicular road
        Z: -100,  // In front of houses (south of main road)
        INTERACT_DIST: 60,
        READING_COST: 0,
        TUTORING_COST: 25,
    },
    RUNNING_TRACK: {
        X: -350,   // West of the perpendicular road, not overlapping
        Z: -280,   // At the end of the library road
        INTERACT_DIST: 80,
        LAP_RADIUS: 80,
    },
    DAD: {
        X: 130,         // Right side of the car (opposite from Mommy)
        Z: 40,          // South side of the road
        INTERACT_DIST: 50,
    },
    SEDAN: {
        X: 70,
        Z: 30,          // South side of the road
    },
};

// ============ HOUSE FLIPPING ============
export const HOUSE_FLIPPING = {
    SUCCESS_RATE: 0.8,        // 80% success
    PROFIT_MIN: 20,
    PROFIT_MAX: 100,
    LOSS_MIN: 10,
    LOSS_MAX: 50,
};

// ============ CODING ============
export const CODING = {
    PAY_MIN: 25,
    PAY_MAX: 50,
    MIN_INTELLIGENCE: 4,
};

// ============ CODING JOBS ============
export const JOBS = {
    TIME_REQUIRED: 480,     // 8 hours per job
    XP_REWARD: 15,          // INT XP per job
    MIN_INTELLIGENCE: 4,    // Required INT level to take jobs
};

// ============ CRYPTO ============
export const CRYPTO = {
    SPACECOIN: {
        START_PRICE: 100,
        VOLATILITY: 0.15,     // 15% daily swing
        TREND_UP: 0.02,       // 2% upward bias
    },
    DOGECOIN: {
        START_PRICE: 10,
        VOLATILITY: 0.40,     // 40% daily swing
        TREND_DOWN: -0.05,    // 5% downward bias
        MOON_CHANCE: 0.05,    // 5% chance to 5x
    },
};

// ============ GAME SETTINGS ============
export const GAME = {
    REPAIR_SPEED: 0.06,           // How fast the rocket repairs
    ALIEN_SPAWN_INTERVAL: 60,     // Frames between alien spawns
    INTRO_DURATION: 3000,         // Intro screen duration (ms)
    SWORD_ACTIVE_FRAMES: 15,      // Frames sword swing is active
    BULLET_LIFETIME: 60,          // Frames before bullet expires
    BULLET_SPEED: 15,
    ALIEN_BASE_SPEED: 1.5,
    ALIEN_SPEED_SCALE: 50,        // Divides repairProgress to add to speed
    ALIEN_SPAWN_RADIUS: 500,
    HANNAH_COLLISION_RADIUS: 60,
    SWORD_COLLISION_RADIUS: 80,
    BULLET_COLLISION_RADIUS: 30,
};

// ============ PLAYER SETTINGS ============
export const PLAYER = {
    MOVE_SPEED: 6,
    M1_MOVE_SPEED: 5,
    M1_MOWER_SPEED: 3,
    INITIAL_HEALTH: 100,
    ALIEN_DAMAGE: 10,
};

// ============ CAMERA SETTINGS ============
export const CAMERA = {
    MARS_HEIGHT: 600,
    MARS_DISTANCE: 500,
    M1_HEIGHT: 400,
    M1_DISTANCE: 350,
    M1_MOWING_HEIGHT: 280,
    CONVERSATION_HEIGHT: 200,
    CUTSCENE_HEIGHT: 120,
    CUTSCENE_DISTANCE: 250,
};

// ============ MISSION 1 SETTINGS ============
export const MISSION1 = {
    // Map bounds (extended for library and running track)
    BOUNDS: {
        MIN_X: -500,
        MAX_X: 600,   // Reduced since track moved left
        MIN_Z: -380,  // Extended south for running track at end of library road
        MAX_Z: 500,
    },

    // Lemonade stand (at far left end of road)
    LEMONADE_STAND: {
        X: -400,
        Z: 60,
        PRICE: 5,
        DRINK_TIME: 180,  // frames
    },

    // Rocket shop (far right, away from houses)
    ROCKET_SHOP: {
        X: 520,
        Z: 100,
    },

    // Lake (positioned behind middle house - The Rudys at X:0)
    LAKE: {
        X: 0,
        Z: 350,
        WIDTH: 250,
        HEIGHT: 120,
    },

    // Mowing mini-game
    MOWING: {
        LAWN_WIDTH: 10,
        LAWN_HEIGHT: 8,
        TILE_SIZE: 20,
        MIN_GRASS_HEIGHT: 8,
        MAX_GRASS_HEIGHT: 14,
    },

    // Niam (friend character)
    NIAM: {
        APPROACH_COOLDOWN: 1800,  // 30 seconds at 60fps
        APPROACH_CHANCE: 0.002,
        APPROACH_DISTANCE: 40,
        WALK_SPEED: 2,
        PLAY_COST: 5,
    },

    // Mommy (sells lemonade materials)
    MOMMY: {
        X: -50,         // To the left of Noah's house
        Z: 40,          // South side of the road
        INTERACT_DIST: 50,
        MATERIALS_COST: 10,
        MATERIALS_AMOUNT: 7,  // 7-8 lemonades worth (we'll randomize to 7 or 8)
    },

    // Neighbor walking
    NEIGHBOR_WALK_SPEED: 2.5,
    MOOD_RESTORE_RATE: 3,
    MOOD_RESTORE_INTERVAL: 300,  // 5 seconds at 60fps
    MOW_MOOD_COST: 10,
    LEMONADE_MOOD_COST: 15,
    LEMONADE_MOOD_BOOST: 10,

    // Interaction distances
    NEIGHBOR_INTERACT_DIST: 50,
    HOUSE_INTERACT_DIST: 70,
    SHOP_INTERACT_DIST: 80,
    STAND_INTERACT_DIST: 60,
};

// ============ ROCKET PARTS ($500 total, locked until INT 8) ============
export const ROCKET_PARTS = {
    engine: { price: 140, name: "Engine", icon: "🔥", desc: "Powers the rocket!" },
    body: { price: 110, name: "Body", icon: "🛢️", desc: "Main rocket structure" },
    nose: { price: 85, name: "Nose Cone", icon: "🔺", desc: "Aerodynamic tip" },
    fins: { price: 70, name: "Fins", icon: "🔧", desc: "Stabilize flight" },
    seat: { price: 95, name: "Captain's Seat", icon: "💺", desc: "A comfy seat for Noah" },
};

// ============ NEIGHBOR CONFIGS ============
export const NEIGHBORS = [
    {
        name: "Mrs. Smith",
        homeX: -340, homeZ: 180,
        hairColor: [139, 69, 19],
        shirtColor: [200, 100, 150],
        pantsColor: [80, 80, 120],
        mowPay: 12,
        houseColor: [200, 200, 190],
        roofColor: [80, 80, 85],
    },
    {
        name: "Mr. Johnson",
        homeX: -170, homeZ: 200,
        hairColor: [80, 80, 80],
        shirtColor: [50, 100, 50],
        pantsColor: [60, 60, 80],
        mowPay: 15,
        houseColor: [220, 200, 180],
        roofColor: [80, 80, 90],
    },
    {
        name: "Noah's House",
        homeX: 0, homeZ: 210,
        hairColor: [139, 90, 43],
        shirtColor: [65, 105, 225],
        pantsColor: [50, 50, 70],
        mowPay: 20,
        houseColor: [210, 200, 185],
        roofColor: [85, 85, 95],
        isPinned: true,
        isNoahsHouse: true,  // Special flag for Noah's house
    },
    {
        name: "Grandma Rose",
        homeX: 170, homeZ: 200,
        hairColor: [200, 200, 200],
        shirtColor: [180, 100, 180],
        pantsColor: [100, 80, 100],
        mowPay: 22,
        houseColor: [205, 195, 180],
        roofColor: [90, 85, 80],
    },
    {
        name: "Dr. Patel",
        homeX: 340, homeZ: 180,
        hairColor: [30, 30, 30],
        shirtColor: [255, 255, 255],
        pantsColor: [40, 40, 50],
        mowPay: 19,
        houseColor: [215, 205, 190],
        roofColor: [70, 70, 80],
    },
];

// ============ COLORS ============
export const COLORS = {
    // Characters
    SKIN: [255, 220, 180],
    SKIN_BROWN: [139, 90, 60],
    BLONDE_HAIR: [255, 220, 0],
    BROWN_HAIR: [139, 69, 19],

    // Noah
    NOAH_SHIRT: [0, 100, 255],
    NOAH_PANTS: [50, 50, 150],

    // Hannah
    HANNAH_DRESS: [255, 100, 150],
    HANNAH_DRESS_PINK: [255, 105, 180],

    // Niam
    NIAM_SHIRT: [50, 180, 80],
    NIAM_SHORTS: [180, 160, 120],

    // Mars terrain
    MARS_SKY: [50, 20, 10],
    MARS_GROUND: [180, 60, 40],
    MARS_ROCK_VARIANTS: [
        [160, 50, 35],
        [140, 45, 30],
        [180, 65, 45],
        [120, 40, 25],
        [100, 35, 20],
    ],

    // Aliens
    ALIEN_BODY: [0, 220, 0],
    ALIEN_DARK: [0, 180, 0],
    ALIEN_BRIGHT: [0, 255, 0],
    ALIEN_EYE: [200, 255, 200],
    ALIEN_ANTENNA: [255, 50, 255],

    // Effects
    BULLET: [0, 255, 255],
    DIAMOND_SWORD: [0, 255, 255],

    // Mission 1
    M1_SKY: [135, 206, 235],
    M1_GRASS: [34, 139, 34],
    M1_ROAD: [80, 80, 80],
    M1_WATER: [30, 100, 180],

    // Flowers (random selection)
    FLOWER_VARIANTS: [
        [255, 100, 100],
        [255, 255, 100],
        [255, 150, 200],
        [150, 150, 255],
        [255, 200, 100],
    ],
};

// ============ TERRAIN GENERATION ============
export const TERRAIN = {
    ROCKS_COUNT: 60,
    ROCKS_MIN_DIST: 150,
    ROCKS_MAX_DIST: 800,
    ROCKS_MIN_SIZE: 8,
    ROCKS_MAX_SIZE: 35,

    CRATERS_COUNT: 15,
    CRATERS_MIN_DIST: 200,
    CRATERS_MAX_DIST: 700,
    CRATERS_MIN_RADIUS: 30,
    CRATERS_MAX_RADIUS: 80,

    DUNES_COUNT: 25,
    DUNES_MIN_DIST: 100,
    DUNES_MAX_DIST: 900,

    PEBBLES_COUNT: 200,
    PEBBLES_MIN_DIST: 50,
    PEBBLES_MAX_DIST: 900,

    M1_TREES_COUNT: 12,
    M1_FLOWERS_COUNT: 20,
};

// ============ UI ELEMENT IDS ============
export const UI_ELEMENTS = {
    MAIN_MENU: 'main-menu',
    MISSION_INTRO: 'mission-intro',
    CUTSCENE: 'cutscene',
    UI_LAYER: 'ui-layer',
    OVERLAY: 'overlay',
    VICTORY_CUTSCENE: 'victory-cutscene',
    REPAIR_BAR: 'repair-bar',
    HP_VAL: 'hp-val',

    // Mission 1
    M1_INTRO: 'mission1-intro',
    M1_CUTSCENE: 'mission1-cutscene',
    M1_HUD: 'mission1-hud',
    M1_VICTORY: 'mission1-victory',
    M1_MONEY: 'm1-money',
    M1_LEMONADE_EARNINGS: 'm1-lemonade-earnings',
    M1_CUSTOMERS: 'm1-customers',
    M1_TOOLTIP: 'm1-tooltip',
    M1_CONVERSATION: 'm1-conversation',
    M1_NOTIFICATION: 'm1-notification',
    M1_SHOP: 'm1-shop',
    M1_PROMPT: 'm1-prompt',
    M1_SLEEP_OVERLAY: 'm1-sleep-overlay',

    // Mission 2
    M2_INTRO: 'mission2-intro',
    M2_CUTSCENE: 'mission2-cutscene',
    M2_HUD: 'mission2-hud',
    M2_VICTORY: 'mission2-victory',
    M2_TOOLTIP: 'm2-tooltip',
};

// ============ GAME STATES ============
export const GAME_STATES = {
    MENU: 'menu',
    INTRO: 'intro',
    CUTSCENE: 'cutscene',
    PLAYING: 'playing',
    WON: 'won',
    LOST: 'lost',
    M1_INTRO: 'm1_intro',
    M1_CUTSCENE: 'm1_cutscene',
    M1_PLAYING: 'm1_playing',
    M1_SLEEP: 'm1_sleep',
    M1_WON: 'm1_won',
    M2_INTRO: 'm2_intro',
    M2_CUTSCENE: 'm2_cutscene',
    M2_PLAYING: 'm2_playing',
    M2_WON: 'm2_won',
    M2_LOST: 'm2_lost',
};

// ============ ANIMATION SPEEDS ============
export const ANIMATION = {
    WALK_CYCLE: 0.3,
    ARM_SWING: 0.2,
    LEG_SWING: 0.3,
    BREATHING: 0.05,
    WAVE: 0.15,
    MOWER_GRASS_SWAY: 0.08,
    DRINK_CYCLE: 0.1,
};

// ============ STORAGE KEYS ============
export const STORAGE = {
    PROGRESS_KEY: 'noahSpaceAdventure',
};
