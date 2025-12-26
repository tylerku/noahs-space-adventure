/**
 * Noah's Space Adventure - Main Entry Point
 * Modular p5.js game with Mission 1 (Neighborhood), Mission 2 (Space Flight), and Mission 3 (Mars Defense)
 */

import { GAME_STATES, STORAGE, UI_ELEMENTS, JOBS } from './core/constants.js';
import {
    gameState, noah, marsState, setGameState, getGameState,
    resetGameState, mission1State, saveMission1Progress, clearMission1SaveData,
    isNightTime, isGettingDark, isComputerBuilt, addMoney, addIntelligenceXP,
    advanceTime, getIntelligenceLevel, allComputerPartsOwned, buildComputer, getOwnedPartsCount
} from './core/state.js';
import {
    initMission1, updateMission1, drawMission1Scene, drawMowingMiniGame,
    checkInteractions, startConversation, conversationMow, conversationLemonade,
    endConversation, openRocketShop, closeRocketShop, buyPartAction, buyComputerPart,
    showMommyConversation, buyLemonadeMaterials, closeMommyDialog, goToSleep,
    refreshHUD, openLibrary, closeLibrary, libraryRead, libraryTutor,
    openTrack, closeTrack, startRunning, openDadDialog, closeDadDialog, dadFlipHouse,
    openComputer, closeComputer, startCoding, openCrypto, closeCrypto, buyCrypto, sellCrypto,
    assembleRocketAction, showRocketStatus, launchToMars,
    openHome, closeHome, openComputerFromHome, goToSleepFromHome,
    updateSleepCutscene, drawSleepCutscene
} from './missions/mission1.js';
import {
    enterLibraryInterior, exitLibraryInterior, drawLibraryInterior,
    handleLibraryClick, handleLibraryHover
} from './missions/libraryInterior.js';
import {
    enterHouseInterior, exitHouseInterior, drawHouseInterior,
    handleHouseClick, handleHouseHover, openComputerScreen, closeComputerScreen,
    showComputerMainMenu, openJobBrowser, openScreenCrypto, updateScreenCryptoUI,
    renderJobListings
} from './missions/houseInterior.js';
import {
    initMission2, updateMission2, drawMission2, drawM2Cutscene,
    mission2State, getM2Interaction, resetMission2State
} from './missions/mission2.js';
import {
    generateTerrain, updateMarsDefense, drawMarsDefense, drawMarsCutscene,
    shootBlaster, swingSword
} from './missions/marsDefense.js';
import { resetPoolManager } from './utils/pools.js';
import {
    showScreen, hideScreen, setOpacity, showMainMenu, showGameOver,
    showVictory, showNotification, updateHealth, hidePrompt
} from './ui/dialogs.js';

// ============ GLOBAL P5 INSTANCE ============
let p5Instance = null;
let isSetupComplete = false;

// ============ MAIN MENU FUNCTIONS ============

function continueGame() {
    // Don't allow starting game before p5.js setup is complete
    if (!isSetupComplete) return;

    // Set state FIRST to prevent any Mars rendering during transition
    setGameState(GAME_STATES.M1_PLAYING);
    gameState.currentMission = 1;

    hideScreen(UI_ELEMENTS.MAIN_MENU);
    initMission1();  // This will load saved progress
    showScreen(UI_ELEMENTS.M1_HUD);
}

function startNewGame() {
    // Don't allow starting game before p5.js setup is complete
    if (!isSetupComplete) return;

    if (confirm('Start a new game? All progress will be lost!')) {
        // Clear all saved progress
        try {
            localStorage.removeItem(STORAGE.PROGRESS_KEY);
            clearMission1SaveData();  // Clear mission 1 specific save data
        } catch (e) {
            console.log('Could not clear progress');
        }

        // Set state FIRST to prevent any Mars rendering during transition
        setGameState(GAME_STATES.M1_PLAYING);
        gameState.currentMission = 1;

        hideScreen(UI_ELEMENTS.MAIN_MENU);
        initMission1();  // Will start fresh with no saved data
        showScreen(UI_ELEMENTS.M1_HUD);
        refreshHUD();
    }
}

// Add event listeners for menu buttons (modules run after DOM is ready)
const continueBtn = document.getElementById('continue-game-btn');
const newGameBtn = document.getElementById('new-game-btn');

if (continueBtn) {
    continueBtn.addEventListener('click', continueGame);
}
if (newGameBtn) {
    newGameBtn.addEventListener('click', startNewGame);
}

// ============ P5.JS SETUP ============

window.setup = function() {
    createCanvas(window.innerWidth, window.innerHeight, WEBGL);
    noStroke();
    generateTerrain(window);
    p5Instance = window;

    // Hide all screens initially
    hideScreen(UI_ELEMENTS.MISSION_INTRO);
    hideScreen(UI_ELEMENTS.M1_INTRO);
    hideScreen(UI_ELEMENTS.M1_CUTSCENE);
    hideScreen(UI_ELEMENTS.M1_VICTORY);
    hideScreen(UI_ELEMENTS.M2_INTRO);
    hideScreen(UI_ELEMENTS.M2_CUTSCENE);
    hideScreen(UI_ELEMENTS.M2_HUD);
    hideScreen(UI_ELEMENTS.M2_VICTORY);
    hideScreen(UI_ELEMENTS.M1_HUD);
    setOpacity(UI_ELEMENTS.UI_LAYER, '0');

    // Show main menu on startup
    showScreen(UI_ELEMENTS.MAIN_MENU);
    setGameState(GAME_STATES.MENU);
    updateBestDaysDisplay();

    // Mark setup as complete and enable menu buttons
    isSetupComplete = true;
    enableMenuButtons();
};

// ============ MENU BUTTON FUNCTIONS ============

function enableMenuButtons() {
    const continueBtn = document.getElementById('continue-game-btn');
    const newGameBtn = document.getElementById('new-game-btn');

    if (continueBtn) {
        continueBtn.disabled = false;
        continueBtn.querySelector('.btn-icon').textContent = '🚀';
        continueBtn.querySelector('.btn-text').textContent = 'Continue Game';
    }
    if (newGameBtn) {
        newGameBtn.disabled = false;
        newGameBtn.querySelector('.btn-icon').textContent = '✨';
        newGameBtn.querySelector('.btn-text').textContent = 'New Game';
    }
}

// ============ BEST DAYS RECORD FUNCTIONS ============

function updateBestDaysDisplay() {
    const bestDays = getBestDays();
    const display = document.getElementById('menu-best-days');
    if (display) {
        if (bestDays !== null) {
            display.textContent = `${bestDays} day${bestDays === 1 ? '' : 's'}`;
        } else {
            display.textContent = 'No record yet';
        }
    }
}

function getBestDays() {
    try {
        const saved = localStorage.getItem('noahBestDays');
        return saved ? parseInt(saved) : null;
    } catch (e) {
        return null;
    }
}

function saveBestDays(days) {
    try {
        const current = getBestDays();
        if (current === null || days < current) {
            localStorage.setItem('noahBestDays', days.toString());
            return true;  // New record!
        }
        return false;
    } catch (e) {
        return false;
    }
}

// ============ P5.JS DRAW LOOP ============

window.draw = function() {
    const state = getGameState();

    // Menu state - show black background (don't show Mars)
    if (state === GAME_STATES.MENU) {
        background(0, 0, 0);
        return;
    }

    // Mission 1
    if (state === GAME_STATES.M1_PLAYING) {
        updateMission1(window);
        if (mission1State.mowingMiniGame) {
            drawMowingMiniGame(window);
        } else if (mission1State.library.isInside) {
            drawLibraryInterior(window);
        } else if (mission1State.house.isInside) {
            drawHouseInterior(window);
        } else {
            drawMission1Scene(window);
        }
        return;
    }

    // Mission 1 Sleep Cutscene
    if (state === GAME_STATES.M1_SLEEP) {
        updateSleepCutscene(window);
        drawSleepCutscene(window);
        return;
    }

    // Mission 2
    if (state === GAME_STATES.M2_PLAYING) {
        const result = updateMission2(window);
        if (result === 'won') {
            winMission2();
        } else if (result === 'lost_ship') {
            loseMission2("The ship fell apart!");
        } else if (result === 'lost_stress') {
            loseMission2("Hannah and James were too stressed!");
        }
        drawMission2(window);
        updateM2HUD();
        updateM2Tooltip(window);
        return;
    }

    // Mars Defense
    if (state === GAME_STATES.PLAYING) {
        const result = updateMarsDefense(window);
        if (result === 'won') {
            winGame();
        } else if (result === 'lost') {
            loseGame();
        }
    }

    // Cutscenes
    if (state === GAME_STATES.CUTSCENE) {
        drawMarsCutscene(window);
        return;
    }
    if (state === GAME_STATES.M1_CUTSCENE) {
        drawM1Cutscene();
        return;
    }
    if (state === GAME_STATES.M2_CUTSCENE) {
        drawM2Cutscene(window);
        return;
    }

    // Non-Mars states (M1_WON, M1_INTRO, M2_WON, M2_LOST, etc.) - show black background
    if (state !== GAME_STATES.PLAYING && state !== GAME_STATES.WON && state !== GAME_STATES.LOST) {
        background(0, 0, 0);
        return;
    }

    // Main Mars Defense rendering
    drawMarsDefense(window);
};

// ============ INPUT HANDLERS ============

window.mousePressed = function() {
    const state = getGameState();

    // Library interior click handling
    if (state === GAME_STATES.M1_PLAYING && mission1State.library.isInside) {
        const result = handleLibraryClick(mouseX, mouseY, width, height);
        if (result) {
            switch (result.action) {
                case 'tutor':
                    showTutorDialog();
                    break;
                case 'read':
                    showReadingDialog();
                    break;
                case 'exit':
                    exitLibraryInterior();
                    break;
            }
        }
        return;
    }

    // House interior click handling
    if (state === GAME_STATES.M1_PLAYING && mission1State.house.isInside) {
        const result = handleHouseClick(mouseX, mouseY, width, height);
        if (result) {
            switch (result.action) {
                case 'bed':
                    attemptSleep();
                    break;
                case 'computer':
                    attemptUseComputer();
                    break;
                case 'exit':
                    exitHouseInterior();
                    break;
            }
        }
        return;
    }

    // Shoot blaster
    if (state === GAME_STATES.PLAYING) {
        shootBlaster();
    }
};

window.mouseMoved = function() {
    const state = getGameState();

    // Library interior hover handling
    if (state === GAME_STATES.M1_PLAYING && mission1State.library.isInside) {
        const hoveredObject = handleLibraryHover(mouseX, mouseY, width, height);
        // Change cursor based on hover
        if (hoveredObject) {
            cursor('pointer');
        } else {
            cursor('default');
        }
    }

    // House interior hover handling
    if (state === GAME_STATES.M1_PLAYING && mission1State.house.isInside) {
        const hoveredObject = handleHouseHover(mouseX, mouseY, width, height);
        // Change cursor based on hover
        if (hoveredObject) {
            cursor('pointer');
        } else {
            cursor('default');
        }
    }
};

window.keyPressed = function() {
    const state = getGameState();

    // Swing sword
    if (key === ' ' && state === GAME_STATES.PLAYING) {
        swingSword();
    }

    // Mission 1 keys
    if (state === GAME_STATES.M1_PLAYING) {
        // E to interact
        if (key === 'e' || key === 'E') {
            handleM1Interaction();
        }

        // ESC to close
        if (keyCode === ESCAPE) {
            // Check if computer screen is open first
            const computerScreen = document.getElementById('computer-screen-overlay');
            if (computerScreen && computerScreen.classList.contains('show')) {
                closeComputerScreen();
            }
            // Check if tutor dialog is open
            else if (document.getElementById('m1-tutor-dialog')?.classList.contains('show')) {
                closeTutorDialog();
            }
            // Check if reading dialog is open
            else if (document.getElementById('m1-reading-dialog')?.classList.contains('show')) {
                closeReadingDialog();
            }
            // Check if build computer dialog is open
            else if (document.getElementById('m1-build-computer-dialog')?.classList.contains('show')) {
                closeBuildComputerDialog();
            } else if (mission1State.house.isInside) {
                exitHouseInterior();
            } else if (mission1State.library.isInside) {
                exitLibraryInterior();
            } else if (mission1State.isShopOpen) {
                closeRocketShop();
            } else if (mission1State.showingPrompt) {
                hidePrompt();
                mission1State.showingPrompt = false;
            }
        }
    }
};

function handleM1Interaction() {
    const interaction = checkInteractions();
    if (!interaction) return;

    switch (interaction.type) {
        case 'neighbor':
        case 'house':
            startConversation(interaction.data);
            break;
        case 'house_empty':
            showNotification(UI_ELEMENTS.M1_NOTIFICATION,
                `${interaction.data.name} is at the lemonade stand!`, 2000);
            break;
        case 'house_angry':
            showNotification(UI_ELEMENTS.M1_NOTIFICATION,
                `${interaction.data.name} won't answer... they're too annoyed!`, 2000);
            break;
        case 'shop':
            openRocketShop();
            break;
        case 'lemonade_stand':
            const count = mission1State.customersWaiting;
            if (mission1State.lemonadeMaterials <= 0) {
                showNotification(UI_ELEMENTS.M1_NOTIFICATION,
                    `Hannah: "We're out of lemonade! Ask Mommy for more supplies!"`, 2500);
            } else if (count > 0) {
                showNotification(UI_ELEMENTS.M1_NOTIFICATION,
                    `Hannah: "I'm busy serving ${count} customer${count > 1 ? 's' : ''}! (${mission1State.lemonadeMaterials} lemonades left)"`, 2000);
            } else {
                showNotification(UI_ELEMENTS.M1_NOTIFICATION,
                    `Hannah: "Send me some customers, Noah! (${mission1State.lemonadeMaterials} lemonades left)"`, 2000);
            }
            break;
        case 'mommy':
            showMommyConversation();
            break;
        case 'home':
            enterHouseInterior();
            break;
        case 'library':
            enterLibraryInterior();
            break;
        case 'running_track':
            openTrack();
            break;
        case 'dad':
            openDadDialog();
            break;
        case 'assemble_rocket':
            assembleRocketAction();
            break;
        case 'rocket_status':
            showRocketStatus();
            break;
        case 'launch':
            triggerLaunchSequence();
            break;
        case 'rocket_progress':
            showNotification(UI_ELEMENTS.M1_NOTIFICATION,
                `🚀 Keep buying rocket parts at the Tech Shop!`, 2500);
            break;
        case 'launch_pad_empty':
            showNotification(UI_ELEMENTS.M1_NOTIFICATION,
                `🚀 This is where your rocket will launch! Buy parts at the Tech Shop.`, 3000);
            break;
        case 'closed':
            showNotification(UI_ELEMENTS.M1_NOTIFICATION,
                `🌙 ${interaction.tooltip}`, 2500);
            break;
    }
}

function triggerLaunchSequence() {
    if (launchToMars()) {
        // Show the victory screen after a short delay
        setTimeout(() => {
            setGameState(GAME_STATES.M1_WON);
            hideScreen(UI_ELEMENTS.M1_HUD);
            showScreen(UI_ELEMENTS.M1_VICTORY);
            saveProgress(1);

            // Save best days record
            const days = mission1State.gameTime.dayNumber;
            const isNewRecord = saveBestDays(days);
            if (isNewRecord) {
                showNotification(UI_ELEMENTS.M1_NOTIFICATION,
                    `NEW RECORD! Completed in ${days} day${days === 1 ? '' : 's'}!`, 4000);
            }
        }, 2500);
    }
}

window.windowResized = function() {
    resizeCanvas(windowWidth, windowHeight);
};

// ============ GAME STATE MANAGEMENT ============

function winGame() {
    setGameState(GAME_STATES.WON);
    setOpacity(UI_ELEMENTS.UI_LAYER, '0');
    showVictory();
    saveProgress(3);
}

function loseGame() {
    setGameState(GAME_STATES.LOST);
    showGameOver("GAME OVER", "The aliens captured Hannah and James.");
}

window.resetGame = function() {
    if (gameState.introTimeout) clearTimeout(gameState.introTimeout);

    setGameState(GAME_STATES.INTRO);
    marsState.repairProgress = 0;
    marsState.hannahHealth = 100;
    noah.x = 0;
    noah.z = 0;
    resetPoolManager();

    hideScreen(UI_ELEMENTS.OVERLAY);
    hideScreen(UI_ELEMENTS.VICTORY_CUTSCENE);
    updateHealth(100);
    setOpacity(UI_ELEMENTS.UI_LAYER, '0');
    hideScreen(UI_ELEMENTS.MAIN_MENU);
    showScreen(UI_ELEMENTS.MISSION_INTRO);
    hideScreen(UI_ELEMENTS.CUTSCENE);

    gameState.introTimeout = setTimeout(() => {
        if (getGameState() === GAME_STATES.INTRO) {
            hideScreen(UI_ELEMENTS.MISSION_INTRO);
            showScreen(UI_ELEMENTS.CUTSCENE);
            setGameState(GAME_STATES.CUTSCENE);
        }
    }, 3000);
};

window.returnToMenu = function() {
    // Save Mission 1 progress before leaving
    if (gameState.currentMission === 1) {
        saveMission1Progress();
    }

    setGameState(GAME_STATES.MENU);
    gameState.currentMission = 0;
    marsState.repairProgress = 0;
    marsState.hannahHealth = 100;
    noah.x = 0;
    noah.z = 0;
    resetPoolManager();

    // Hide mission-specific UI
    hideScreen(UI_ELEMENTS.M1_HUD);
    hideScreen(UI_ELEMENTS.M1_VICTORY);
    hideScreen(UI_ELEMENTS.M2_HUD);
    hideScreen(UI_ELEMENTS.M2_VICTORY);
    const m2Tooltip = document.getElementById(UI_ELEMENTS.M2_TOOLTIP);
    if (m2Tooltip) m2Tooltip.classList.remove('show');
    const niamDialog = document.getElementById('m1-niam-dialog');
    if (niamDialog) niamDialog.classList.remove('show');

    showMainMenu();
    updateBestDaysDisplay();
};

// ============ MISSION MANAGEMENT ============

window.startMission = function(missionNumber) {
    gameState.currentMission = missionNumber;

    if (missionNumber === 1) {
        hideScreen(UI_ELEMENTS.MAIN_MENU);
        showScreen(UI_ELEMENTS.M1_INTRO);
        setGameState(GAME_STATES.M1_INTRO);
        initMission1();

        gameState.introTimeout = setTimeout(() => {
            if (getGameState() === GAME_STATES.M1_INTRO) {
                hideScreen(UI_ELEMENTS.M1_INTRO);
                showScreen(UI_ELEMENTS.M1_CUTSCENE);
                setGameState(GAME_STATES.M1_CUTSCENE);
            }
        }, 3000);
    } else if (missionNumber === 2) {
        hideScreen(UI_ELEMENTS.MAIN_MENU);
        showScreen(UI_ELEMENTS.M2_INTRO);
        setGameState(GAME_STATES.M2_INTRO);
        initMission2(window);

        gameState.introTimeout = setTimeout(() => {
            if (getGameState() === GAME_STATES.M2_INTRO) {
                hideScreen(UI_ELEMENTS.M2_INTRO);
                showScreen(UI_ELEMENTS.M2_CUTSCENE);
                setGameState(GAME_STATES.M2_CUTSCENE);
            }
        }, 3000);
    } else if (missionNumber === 3) {
        hideScreen(UI_ELEMENTS.MAIN_MENU);
        showScreen(UI_ELEMENTS.MISSION_INTRO);
        setGameState(GAME_STATES.INTRO);

        gameState.introTimeout = setTimeout(() => {
            if (getGameState() === GAME_STATES.INTRO) {
                hideScreen(UI_ELEMENTS.MISSION_INTRO);
                showScreen(UI_ELEMENTS.CUTSCENE);
                setGameState(GAME_STATES.CUTSCENE);
            }
        }, 3000);
    }
};

// ============ CLICK HANDLERS FOR INTRO/CUTSCENE ============

document.addEventListener('click', function(e) {
    const state = getGameState();

    // Mission 1 transitions
    if (state === GAME_STATES.M1_INTRO) {
        if (gameState.introTimeout) clearTimeout(gameState.introTimeout);
        hideScreen(UI_ELEMENTS.M1_INTRO);
        showScreen(UI_ELEMENTS.M1_CUTSCENE);
        setGameState(GAME_STATES.M1_CUTSCENE);
    } else if (state === GAME_STATES.M1_CUTSCENE) {
        hideScreen(UI_ELEMENTS.M1_CUTSCENE);
        showScreen(UI_ELEMENTS.M1_HUD);
        setGameState(GAME_STATES.M1_PLAYING);
    }

    // Mission 2 transitions
    else if (state === GAME_STATES.M2_INTRO) {
        if (gameState.introTimeout) clearTimeout(gameState.introTimeout);
        hideScreen(UI_ELEMENTS.M2_INTRO);
        showScreen(UI_ELEMENTS.M2_CUTSCENE);
        setGameState(GAME_STATES.M2_CUTSCENE);
    } else if (state === GAME_STATES.M2_CUTSCENE) {
        hideScreen(UI_ELEMENTS.M2_CUTSCENE);
        showScreen(UI_ELEMENTS.M2_HUD);
        setGameState(GAME_STATES.M2_PLAYING);
    }

    // Mission 3 transitions
    else if (state === GAME_STATES.INTRO) {
        if (gameState.introTimeout) clearTimeout(gameState.introTimeout);
        hideScreen(UI_ELEMENTS.MISSION_INTRO);
        showScreen(UI_ELEMENTS.CUTSCENE);
        setGameState(GAME_STATES.CUTSCENE);
    } else if (state === GAME_STATES.CUTSCENE) {
        hideScreen(UI_ELEMENTS.CUTSCENE);
        setOpacity(UI_ELEMENTS.UI_LAYER, '1');
        setGameState(GAME_STATES.PLAYING);
    }
}, { capture: true });

// ============ SHOP PROMPT ============

function showShopPrompt() {
    mission1State.showingPrompt = true;
    const prompt = document.getElementById(UI_ELEMENTS.M1_PROMPT);
    const title = document.getElementById('m1-prompt-title');
    const text = document.getElementById('m1-prompt-text');
    const buttons = document.getElementById('m1-prompt-buttons');

    if (title) title.textContent = "🛒 Tech Shop";
    if (text) text.textContent = "Welcome to the Tech Shop! Want to buy some parts?";
    if (buttons) {
        buttons.innerHTML = `
            <button class="m1-prompt-btn shop" onclick="openShop()">Open Shop</button>
            <button class="m1-prompt-btn cancel" onclick="hidePrompt()">Leave</button>
        `;
    }
    if (prompt) prompt.classList.add('show');
}

// ============ GLOBAL FUNCTION EXPORTS ============

window.openShop = function() {
    hidePrompt();
    mission1State.showingPrompt = false;
    openRocketShop();
};

window.closeShop = closeRocketShop;

window.buyPart = function(partKey) {
    buyPartAction(partKey);
};

window.buyComputerPart = buyComputerPart;

window.conversationMow = conversationMow;
window.conversationLemonade = conversationLemonade;
window.endConversation = endConversation;

window.hidePrompt = function() {
    const prompt = document.getElementById(UI_ELEMENTS.M1_PROMPT);
    if (prompt) prompt.classList.remove('show');
    mission1State.showingPrompt = false;
    mission1State.interactingNeighbor = null;
};

// Niam dialog handlers
window.niamPlay = function() {
    mission1State.money = Math.max(0, mission1State.money - 5);
    mission1State.niam.showingDialog = false;
    mission1State.niam.lastApproachTime = frameCount;
    const niamDialog = document.getElementById('m1-niam-dialog');
    if (niamDialog) niamDialog.classList.remove('show');
    refreshHUD();
    showNotification(UI_ELEMENTS.M1_NOTIFICATION, "You played with Niam! (-$5)", 2000);
};

window.niamDecline = function() {
    mission1State.niam.showingDialog = false;
    mission1State.niam.lastApproachTime = frameCount;
    const niamDialog = document.getElementById('m1-niam-dialog');
    if (niamDialog) niamDialog.classList.remove('show');
};

// Mommy dialog handlers
window.buyMaterials = function() {
    buyLemonadeMaterials();
    closeMommyDialog();
};

window.closeMommyDialog = function() {
    closeMommyDialog();
};

// Library dialog handlers
window.libraryRead = libraryRead;
window.libraryTutor = libraryTutor;
window.closeLibrary = closeLibrary;

// Library interior tutor dialog
function showTutorDialog() {
    // Tutor goes home after 6 PM
    if (mission1State.gameTime.hour >= 18) {
        showNotification(UI_ELEMENTS.M1_NOTIFICATION,
            "The tutor has gone home for the day. Come back before 6 PM!", 2500);
        return;
    }
    const dialog = document.getElementById('m1-tutor-dialog');
    if (dialog) dialog.classList.add('show');
}

function closeTutorDialog() {
    const dialog = document.getElementById('m1-tutor-dialog');
    if (dialog) dialog.classList.remove('show');
}

function confirmTutor() {
    closeTutorDialog();
    libraryTutor();
}

window.showTutorDialog = showTutorDialog;
window.closeTutorDialog = closeTutorDialog;
window.confirmTutor = confirmTutor;

// Reading dialog handlers
function showReadingDialog() {
    const dialog = document.getElementById('m1-reading-dialog');
    if (dialog) dialog.classList.add('show');
}

function closeReadingDialog() {
    const dialog = document.getElementById('m1-reading-dialog');
    if (dialog) dialog.classList.remove('show');
}

function confirmReading() {
    closeReadingDialog();
    libraryRead();
    exitLibraryInterior();  // Exit the interior view after reading
}

window.showReadingDialog = showReadingDialog;
window.closeReadingDialog = closeReadingDialog;
window.confirmReading = confirmReading;

// Running track dialog handlers
window.startRunning = startRunning;
window.closeTrack = closeTrack;

// Dad dialog handlers
window.dadFlipHouse = dadFlipHouse;
window.closeDadDialog = closeDadDialog;

// Computer dialog handlers
window.openComputer = openComputer;
window.closeComputer = closeComputer;
window.startCoding = startCoding;

// Crypto dialog handlers
window.openCrypto = openCrypto;
window.closeCrypto = closeCrypto;
window.buyCrypto = buyCrypto;
window.sellCrypto = sellCrypto;

// Home dialog handlers
window.openHome = openHome;
window.closeHome = closeHome;
window.openComputerFromHome = openComputerFromHome;
window.goToSleepFromHome = goToSleepFromHome;

// House interior helpers
function attemptSleep() {
    if (!isNightTime() && !isGettingDark()) {
        showNotification(UI_ELEMENTS.M1_NOTIFICATION,
            "It's not time for bed yet! Come back when it's getting dark.", 2500);
        return;
    }
    exitHouseInterior();
    goToSleep();
}

function attemptUseComputer() {
    if (!isComputerBuilt()) {
        if (allComputerPartsOwned()) {
            // All parts ready - show build dialog
            showBuildComputerDialog();
        } else {
            // Still need more parts
            const partsOwned = getOwnedPartsCount();
            showNotification(UI_ELEMENTS.M1_NOTIFICATION,
                `Computer parts: ${partsOwned}/9. Buy more at the shop!`, 3000);
        }
        return;
    }
    openComputerScreen();
}

function showBuildComputerDialog() {
    const dialog = document.getElementById('m1-build-computer-dialog');
    if (dialog) dialog.classList.add('show');
}

function closeBuildComputerDialog() {
    const dialog = document.getElementById('m1-build-computer-dialog');
    if (dialog) dialog.classList.remove('show');
}

function confirmBuildComputer() {
    closeBuildComputerDialog();
    if (buildComputer()) {
        showNotification(UI_ELEMENTS.M1_NOTIFICATION,
            "🎉 Computer built! You can now take coding jobs!", 3500);
        // Open computer screen after a short delay
        setTimeout(() => openComputerScreen(), 500);
    }
}

window.closeBuildComputerDialog = closeBuildComputerDialog;
window.confirmBuildComputer = confirmBuildComputer;

// Computer screen handlers
window.openJobBrowser = openJobBrowser;
window.openScreenCrypto = openScreenCrypto;
window.showComputerMainMenu = showComputerMainMenu;
window.closeComputerScreen = closeComputerScreen;

// Accept a job from the job browser
window.acceptJob = function(jobId) {
    const m1 = mission1State;
    const job = m1.codingJobs.find(j => j.id === jobId);
    if (!job) return;

    // Check INT requirement
    if (getIntelligenceLevel() < JOBS.MIN_INTELLIGENCE) {
        showNotification(UI_ELEMENTS.M1_NOTIFICATION,
            `Need Intelligence level ${JOBS.MIN_INTELLIGENCE} to take coding jobs!`, 2500);
        return;
    }

    // Complete the job
    closeComputerScreen();
    exitHouseInterior();
    addMoney(job.pay);
    addIntelligenceXP(JOBS.XP_REWARD);
    const isNight = advanceTime(JOBS.TIME_REQUIRED);

    showNotification(UI_ELEMENTS.M1_NOTIFICATION,
        `Completed "${job.title}" - Earned $${job.pay}!`, 3000);

    // Check if night triggered sleep
    if (isNight) {
        setTimeout(() => goToSleep(), 1500);
    }

    refreshHUD();
};

// Screen crypto buy/sell handlers
window.screenBuyCrypto = function(coinType) {
    const amount = 10;  // Buy $10 worth
    if (mission1State.money < amount) {
        showNotification(UI_ELEMENTS.M1_NOTIFICATION, "Not enough money! Need $10.", 2000);
        return;
    }

    // Buy $10 worth of the coin (fractional)
    const coinKey = coinType === 'spaceCoin' ? 'spaceCoin' : 'dogeCoin';
    const crypto = mission1State.crypto[coinKey];
    const coinsBought = amount / crypto.price;

    mission1State.money -= amount;
    crypto.owned += coinsBought;

    const coinName = coinType === 'spaceCoin' ? '₿ BitCoin' : '🐕 DogeCoin';
    showNotification(UI_ELEMENTS.M1_NOTIFICATION,
        `Bought ${coinsBought.toFixed(4)} ${coinName} for $${amount}!`, 1500);

    saveMission1Progress();
    updateScreenCryptoUI();
    refreshHUD();
};

window.screenSellCrypto = function(coinType) {
    // Sell all of this coin type
    const coinKey = coinType === 'spaceCoin' ? 'spaceCoin' : 'dogeCoin';
    const crypto = mission1State.crypto[coinKey];

    if (crypto.owned <= 0) {
        const coinName = coinType === 'spaceCoin' ? 'BitCoin' : 'DogeCoin';
        showNotification(UI_ELEMENTS.M1_NOTIFICATION,
            `You don't own any ${coinName}!`, 2000);
        return;
    }

    const saleValue = Math.floor(crypto.owned * crypto.price);
    const coinsSold = crypto.owned;

    mission1State.money += saleValue;
    crypto.owned = 0;

    const coinName = coinType === 'spaceCoin' ? '₿ BitCoin' : '🐕 DogeCoin';
    showNotification(UI_ELEMENTS.M1_NOTIFICATION,
        `Sold ${coinsSold.toFixed(4)} ${coinName} for $${saleValue}!`, 1500);

    saveMission1Progress();
    updateScreenCryptoUI();
    refreshHUD();
};

// New Game handler
window.confirmNewGame = function() {
    if (confirm('Start a new game? All progress will be lost!')) {
        startNewGameAction();
    }
};

function startNewGameAction() {
    // Clear all saved progress
    try {
        localStorage.removeItem(STORAGE.PROGRESS_KEY);
        clearMission1SaveData();  // Clear mission 1 specific save data
    } catch (e) {
        console.log('Could not clear progress');
    }

    // Reset and reinitialize
    initMission1();
    refreshHUD();
}

// ============ PROGRESS MANAGEMENT ============

function loadProgress() {
    try {
        const saved = localStorage.getItem(STORAGE.PROGRESS_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.log('Could not load progress');
    }
    return { completedMissions: [] };
}

function saveProgress(missionNumber) {
    try {
        const progress = loadProgress();
        if (!progress.completedMissions.includes(missionNumber)) {
            progress.completedMissions.push(missionNumber);
        }
        localStorage.setItem(STORAGE.PROGRESS_KEY, JSON.stringify(progress));
        updateMenuDisplay();
    } catch (e) {
        console.log('Could not save progress');
    }
}

function updateMenuDisplay() {
    const progress = loadProgress();
    document.querySelectorAll('.mission-card').forEach(card => {
        const missionNum = parseInt(card.dataset.mission);
        if (progress.completedMissions.includes(missionNum)) {
            card.classList.add('completed');
            const status = card.querySelector('.mission-card-status');
            if (status && missionNum === 3) {
                status.textContent = 'Completed!';
            }
        }
    });
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', updateMenuDisplay);

// Save Mission 1 progress on page unload (browser close/reload)
window.addEventListener('beforeunload', function() {
    if (gameState.currentMission === 1) {
        saveMission1Progress();
    }
});

// ============ M1 CUTSCENE ============

function drawM1Cutscene() {
    background(135, 206, 235);
    camera(sin(frameCount * 0.008) * 20 + 50, -100, 200, 0, -30, 0, 0, 1, 0);
    ambientLight(100);
    directionalLight(255, 250, 220, -0.3, 1, -0.5);

    // Sun
    push();
    translate(150, -180, -100);
    fill(255, 255, 150);
    sphere(30);
    fill(255, 255, 200, 100);
    sphere(40);
    pop();

    // Ground
    push();
    rotateX(HALF_PI);
    fill(80, 180, 80);
    ellipse(0, 0, 600, 400);
    pop();

    // House
    push();
    translate(-60, 0, -80);
    fill(255, 240, 220);
    push();
    translate(0, -40, 0);
    box(100, 80, 80);
    pop();
    fill(139, 90, 60);
    push();
    translate(-30, -95, 0);
    rotateZ(-0.6);
    box(60, 8, 85);
    pop();
    push();
    translate(30, -95, 0);
    rotateZ(0.6);
    box(60, 8, 85);
    pop();
    fill(139, 69, 19);
    push();
    translate(0, -25, 41);
    box(20, 40, 2);
    pop();
    fill(180, 220, 255);
    push();
    translate(-30, -50, 41);
    box(20, 20, 2);
    pop();
    push();
    translate(30, -50, 41);
    box(20, 20, 2);
    pop();
    pop();

    // Noah jumping
    push();
    translate(40, 0, 60);
    translate(0, -abs(sin(frameCount * 0.08)) * 10, 0);
    fill(50, 50, 150);
    const legSwing = sin(frameCount * 0.15) * 0.3;
    push();
    translate(-4, -8, 0);
    rotateX(legSwing);
    box(4, 16, 4);
    pop();
    push();
    translate(4, -8, 0);
    rotateX(-legSwing);
    box(4, 16, 4);
    pop();
    fill(0, 100, 255);
    push();
    translate(0, -26, 0);
    box(14, 22, 10);
    pop();
    fill(255, 220, 180);
    const armWave = sin(frameCount * 0.2) * 0.5;
    push();
    translate(-10, -28, 0);
    rotateZ(0.8 + armWave);
    box(4, 14, 4);
    pop();
    push();
    translate(10, -28, 0);
    rotateZ(-0.8 - armWave);
    box(4, 14, 4);
    pop();
    push();
    translate(0, -44, 0);
    fill(255, 220, 180);
    sphere(8);
    fill(80, 50, 30);
    push();
    translate(-2.5, -1, 7);
    sphere(1.2);
    pop();
    push();
    translate(2.5, -1, 7);
    sphere(1.2);
    pop();
    push();
    translate(0, 2, 7);
    fill(200, 100, 100);
    scale(1, 0.6, 0.3);
    sphere(2.5);
    pop();
    fill(255, 220, 100);
    push();
    translate(0, -5, 0);
    scale(1, 0.6, 1);
    sphere(9);
    pop();
    pop();
    pop();

    // Clouds
    for (let i = 0; i < 4; i++) {
        push();
        translate(-100 + i * 80, -150, -50 - i * 20);
        fill(255, 255, 255, 200);
        sphere(20);
        translate(15, 5, 0);
        sphere(15);
        translate(-30, 3, 0);
        sphere(18);
        pop();
    }

    // Flowers
    for (let i = 0; i < 12; i++) {
        push();
        translate(sin(i * 45) * 100, 0, cos(i * 67) * 80 + 40);
        fill(50, 150, 50);
        push();
        translate(0, -5, 0);
        box(1, 10, 1);
        pop();
        fill(255, 100 + (i * 30) % 155, 150);
        push();
        translate(0, -12, 0);
        sphere(4);
        pop();
        pop();
    }
}

// ============ MISSION 2 FUNCTIONS ============

function hideM2Tooltip() {
    const tooltip = document.getElementById(UI_ELEMENTS.M2_TOOLTIP);
    if (tooltip) tooltip.classList.remove('show');
}

function winMission2() {
    setGameState(GAME_STATES.M2_WON);
    hideScreen(UI_ELEMENTS.M2_HUD);
    hideM2Tooltip();
    showScreen(UI_ELEMENTS.M2_VICTORY);
    saveProgress(2);
}

function loseMission2(reason) {
    setGameState(GAME_STATES.M2_LOST);
    hideScreen(UI_ELEMENTS.M2_HUD);
    hideM2Tooltip();
    showGameOver("MISSION FAILED", reason);
}

function updateM2HUD() {
    const m2 = mission2State;
    const journeyPercent = (m2.journeyProgress / 3600) * 100;
    const shipHealthPercent = m2.shipHealth;
    const hannahStressPercent = m2.hannahStress;
    const jamesStressPercent = m2.jamesStress;

    const journeyBar = document.getElementById('m2-journey-bar');
    const shipBar = document.getElementById('m2-ship-health');
    const hannahBar = document.getElementById('m2-hannah-stress');
    const jamesBar = document.getElementById('m2-james-stress');

    if (journeyBar) journeyBar.style.width = `${journeyPercent}%`;
    if (shipBar) shipBar.style.width = `${shipHealthPercent}%`;
    if (hannahBar) hannahBar.style.width = `${hannahStressPercent}%`;
    if (jamesBar) jamesBar.style.width = `${jamesStressPercent}%`;
}

function updateM2Tooltip(p) {
    const tooltip = document.getElementById(UI_ELEMENTS.M2_TOOLTIP);
    if (!tooltip) return;

    const interaction = getM2Interaction(p);
    if (interaction) {
        if (interaction.type === 'repair') {
            tooltip.innerHTML = `<span class="key">Hold E</span> Repair damage`;
            tooltip.classList.add('show');
        } else if (interaction.type === 'comfort') {
            const name = interaction.target === 'hannah' ? 'Hannah' : 'James';
            tooltip.innerHTML = `<span class="key">Hold E</span> Comfort ${name}`;
            tooltip.classList.add('show');
        }
    } else {
        tooltip.classList.remove('show');
    }
}
