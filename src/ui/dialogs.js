/**
 * Dialog System - Handles all UI dialogs and prompts
 */

import { UI_ELEMENTS } from '../core/constants.js';

// ============ DOM HELPERS ============

/**
 * Get element by ID with caching
 */
const elementCache = new Map();

export function getElement(id) {
    if (!elementCache.has(id)) {
        elementCache.set(id, document.getElementById(id));
    }
    return elementCache.get(id);
}

/**
 * Clear element cache (call on page changes)
 */
export function clearElementCache() {
    elementCache.clear();
}

// ============ SCREEN MANAGEMENT ============

/**
 * Show a screen element
 */
export function showScreen(elementId, displayType = 'flex') {
    const el = getElement(elementId);
    if (el) {
        el.style.display = displayType;
    }
}

/**
 * Hide a screen element
 */
export function hideScreen(elementId) {
    const el = getElement(elementId);
    if (el) {
        el.style.display = 'none';
    }
}

/**
 * Set opacity of an element
 */
export function setOpacity(elementId, opacity) {
    const el = getElement(elementId);
    if (el) {
        el.style.opacity = opacity;
    }
}

// ============ NOTIFICATION SYSTEM ============

let notificationTimeout = null;

/**
 * Show a notification popup
 */
export function showNotification(elementId, text, duration = 2000) {
    const notif = getElement(elementId);
    if (!notif) return;

    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
    }

    notif.textContent = text;
    notif.style.display = 'block';

    notificationTimeout = setTimeout(() => {
        notif.style.display = 'none';
    }, duration);
}

// ============ MISSION 1 DIALOG SYSTEM ============

/**
 * Show conversation dialog for Mission 1
 */
export function showConversationDialog(neighbor, options = {}) {
    const dialog = getElement(UI_ELEMENTS.M1_CONVERSATION);
    const nameEl = getElement('m1-conv-name');
    const textEl = getElement('m1-conv-text');
    const optionsEl = getElement('m1-conv-options');

    if (!dialog || !nameEl || !textEl || !optionsEl) return;

    nameEl.textContent = neighbor.name;
    nameEl.style.color = `rgb(${neighbor.shirtColor[0]}, ${neighbor.shirtColor[1]}, ${neighbor.shirtColor[2]})`;

    if (options.text) {
        textEl.textContent = options.text;
    }

    if (options.buttons) {
        optionsEl.innerHTML = options.buttons;
    }

    dialog.classList.add('show');
}

/**
 * Hide conversation dialog
 */
export function hideConversationDialog() {
    const dialog = getElement(UI_ELEMENTS.M1_CONVERSATION);
    if (dialog) {
        dialog.classList.remove('show');
    }
}

/**
 * Show tooltip
 */
let lastTooltipText = '';

export function showTooltip(elementId, text) {
    const tooltip = getElement(elementId);
    if (tooltip) {
        // Only update innerHTML when text changes to avoid expensive DOM updates every frame
        if (lastTooltipText !== text) {
            tooltip.innerHTML = text;
            lastTooltipText = text;
        }
        tooltip.classList.add('show');
    }
}

/**
 * Hide tooltip
 */
export function hideTooltip(elementId) {
    const tooltip = getElement(elementId);
    if (tooltip) {
        tooltip.classList.remove('show');
    }
    lastTooltipText = ''; // Reset so next tooltip updates properly
}

/**
 * Show interaction prompt
 */
export function showPrompt(title, text, buttons) {
    const prompt = getElement(UI_ELEMENTS.M1_PROMPT);
    const titleEl = getElement('m1-prompt-title');
    const textEl = getElement('m1-prompt-text');
    const buttonsEl = getElement('m1-prompt-buttons');

    if (!prompt) return;

    if (titleEl) titleEl.textContent = title;
    if (textEl) textEl.textContent = text;
    if (buttonsEl) buttonsEl.innerHTML = buttons;

    prompt.classList.add('show');
}

/**
 * Hide interaction prompt
 */
export function hidePrompt() {
    const prompt = getElement(UI_ELEMENTS.M1_PROMPT);
    if (prompt) {
        prompt.classList.remove('show');
    }
}

// ============ SHOP UI ============

/**
 * Render shop items - both computer parts and rocket parts
 */
export function renderShopItems(rocketParts, money, computerParts, rocketPartsUnlocked) {
    const items = getElement('m1-shop-items');
    if (!items) return;

    let html = '<div class="m1-shop-columns">';

    // Rocket Parts Column (left)
    const rocketLocked = !rocketPartsUnlocked;
    html += `<div class="m1-shop-column">
        <div class="m1-shop-section ${rocketLocked ? 'locked' : ''}">
        <div class="m1-shop-section-title">🚀 Rocket Parts ${rocketLocked ? '<span class="lock-msg">🔒 INT 8</span>' : ''}</div>`;

    for (const key in rocketParts) {
        const part = rocketParts[key];
        const canBuy = money >= part.price && !part.owned && !rocketLocked;
        const owned = part.owned;

        html += `
            <div class="m1-shop-item ${owned ? 'owned' : ''} ${rocketLocked ? 'locked' : ''}">
                <div class="m1-shop-item-info">
                    <div class="m1-shop-item-icon">${part.icon}</div>
                    <div>
                        <div class="m1-shop-item-name">${part.name}</div>
                        <div class="m1-shop-item-desc">${part.desc}</div>
                    </div>
                </div>
                <div class="m1-shop-item-price">$${part.price}</div>
                <button class="m1-shop-item-btn ${owned ? 'purchased' : ''}"
                        ${canBuy ? '' : 'disabled'}
                        onclick="window.buyPart && window.buyPart('${key}')">
                    ${owned ? '\u2713 Owned' : rocketLocked ? '🔒' : 'Buy'}
                </button>
            </div>
        `;
    }
    html += '</div></div>';

    // Computer Parts Column (right)
    html += '<div class="m1-shop-column"><div class="m1-shop-section"><div class="m1-shop-section-title">💻 Computer Parts</div>';
    for (const key in computerParts) {
        const part = computerParts[key];
        const canBuy = money >= part.price && !part.owned;
        const owned = part.owned;

        html += `
            <div class="m1-shop-item ${owned ? 'owned' : ''}">
                <div class="m1-shop-item-info">
                    <div class="m1-shop-item-icon">${part.icon}</div>
                    <div>
                        <div class="m1-shop-item-name">${part.name}</div>
                        <div class="m1-shop-item-desc">${part.desc}</div>
                    </div>
                </div>
                <div class="m1-shop-item-price">$${part.price}</div>
                <button class="m1-shop-item-btn ${owned ? 'purchased' : ''}"
                        ${canBuy ? '' : 'disabled'}
                        onclick="window.buyComputerPart && window.buyComputerPart('${key}')">
                    ${owned ? '\u2713 Owned' : 'Buy'}
                </button>
            </div>
        `;
    }
    html += '</div></div>';

    html += '</div>'; // Close m1-shop-columns

    items.innerHTML = html;
}

/**
 * Show shop panel
 */
export function showShop(rocketParts, money, computerParts, rocketPartsUnlocked) {
    const shop = getElement(UI_ELEMENTS.M1_SHOP);
    if (shop) {
        renderShopItems(rocketParts, money, computerParts, rocketPartsUnlocked);
        shop.style.display = 'block';
    }
}

/**
 * Hide shop panel
 */
export function hideShop() {
    const shop = getElement(UI_ELEMENTS.M1_SHOP);
    if (shop) {
        shop.style.display = 'none';
    }
}

// ============ HUD UPDATES ============

/**
 * Update Mission 1 HUD (legacy signature for compatibility)
 */
export function updateM1HUD(money, lemonadeEarnings, customersWaiting, rocketParts) {
    const moneyEl = getElement(UI_ELEMENTS.M1_MONEY);

    if (moneyEl) moneyEl.textContent = money;
}

/**
 * Update full Mission 1 HUD with all new elements
 */
export function updateM1FullHUD(state) {
    // Money
    const moneyEl = getElement(UI_ELEMENTS.M1_MONEY);
    if (moneyEl) moneyEl.textContent = state.money;

    // Time
    const timeEl = getElement('m1-time');
    const timeIconEl = getElement('m1-time-icon');
    const dayEl = getElement('m1-day');
    if (timeEl) timeEl.textContent = state.formattedTime;
    if (dayEl) dayEl.textContent = state.dayNumber;
    if (timeIconEl) {
        // Sun/moon icon based on time
        if (state.hour >= 20 || state.hour < 6) {
            timeIconEl.textContent = '🌙';
        } else if (state.hour >= 18) {
            timeIconEl.textContent = '🌅';
        } else if (state.hour >= 6 && state.hour < 8) {
            timeIconEl.textContent = '🌄';
        } else {
            timeIconEl.textContent = '☀️';
        }
    }

    // Stats
    const staminaLevelEl = getElement('m1-stamina-level');
    const staminaXpEl = getElement('m1-stamina-xp');
    const intelLevelEl = getElement('m1-intel-level');
    const intelXpEl = getElement('m1-intel-xp');

    if (staminaLevelEl) staminaLevelEl.textContent = state.staminaLevel;
    if (intelLevelEl) intelLevelEl.textContent = state.intelligenceLevel;

    // XP bars (percentage)
    if (staminaXpEl) staminaXpEl.style.width = `${state.staminaXpPercent}%`;
    if (intelXpEl) intelXpEl.style.width = `${state.intelligenceXpPercent}%`;

    // XP text (current/needed)
    const staminaXpTextEl = getElement('m1-stamina-xp-text');
    const intelXpTextEl = getElement('m1-intel-xp-text');
    if (staminaXpTextEl) {
        if (state.staminaLevel >= 10) {
            staminaXpTextEl.textContent = 'MAX';
        } else {
            staminaXpTextEl.textContent = `${state.staminaXp}/${state.staminaXpNeeded}`;
        }
    }
    if (intelXpTextEl) {
        if (state.intelligenceLevel >= 10) {
            intelXpTextEl.textContent = 'MAX';
        } else {
            intelXpTextEl.textContent = `${state.intelligenceXp}/${state.intelligenceXpNeeded}`;
        }
    }

    // Computer progress
    const computerProgressEl = getElement('m1-computer-progress');
    if (computerProgressEl) {
        computerProgressEl.textContent = `${state.computerPartsOwned}/9`;
    }

    // Rocket progress
    const rocketProgressEl = getElement('m1-rocket-progress');
    const rocketLockedEl = getElement('m1-rocket-locked');
    const rocketStatusEl = getElement('m1-rocket-status');

    if (rocketProgressEl) {
        if (state.rocketAssembled) {
            rocketProgressEl.textContent = 'READY!';
        } else {
            rocketProgressEl.textContent = `${state.rocketPartsOwned}/5`;
        }
    }
    if (rocketLockedEl) {
        if (state.rocketPartsUnlocked) {
            rocketLockedEl.style.display = 'none';
        } else {
            rocketLockedEl.style.display = 'inline';
        }
    }
    if (rocketStatusEl) {
        if (state.readyToLaunch) {
            rocketStatusEl.textContent = '🚀 LAUNCH READY!';
            rocketStatusEl.style.color = '#00ff00';
        } else if (state.rocketAssembled) {
            rocketStatusEl.textContent = 'Training needed...';
            rocketStatusEl.style.color = '#ffcc00';
        } else if (state.rocketPartsOwned === 5) {
            rocketStatusEl.textContent = 'Assemble in street!';
            rocketStatusEl.style.color = '#00ccff';
        } else {
            rocketStatusEl.textContent = '';
        }
    }
}

/**
 * Update repair bar
 */
export function updateRepairBar(progress) {
    const bar = getElement(UI_ELEMENTS.REPAIR_BAR);
    if (bar) {
        bar.style.width = Math.min(progress, 100) + '%';
    }
}

/**
 * Update health display
 */
export function updateHealth(health) {
    const el = getElement(UI_ELEMENTS.HP_VAL);
    if (el) {
        el.innerText = health;
    }
}

// ============ GAME STATE SCREENS ============

/**
 * Show game over screen
 */
export function showGameOver(title, description) {
    const overlay = getElement(UI_ELEMENTS.OVERLAY);
    const titleEl = getElement('ov-title');
    const descEl = getElement('ov-desc');

    if (overlay) {
        overlay.style.display = 'flex';
    }
    if (titleEl) {
        titleEl.innerText = title;
        titleEl.style.color = 'red';
    }
    if (descEl) {
        descEl.innerText = description;
    }
}

/**
 * Show victory screen
 */
export function showVictory() {
    hideScreen(UI_ELEMENTS.UI_LAYER);
    showScreen(UI_ELEMENTS.VICTORY_CUTSCENE);
}

/**
 * Show main menu
 */
export function showMainMenu() {
    hideScreen(UI_ELEMENTS.OVERLAY);
    hideScreen(UI_ELEMENTS.VICTORY_CUTSCENE);
    hideScreen(UI_ELEMENTS.MISSION_INTRO);
    hideScreen(UI_ELEMENTS.CUTSCENE);
    hideScreen(UI_ELEMENTS.M1_INTRO);
    hideScreen(UI_ELEMENTS.M1_CUTSCENE);
    hideScreen(UI_ELEMENTS.M1_HUD);
    hideScreen(UI_ELEMENTS.M1_VICTORY);
    setOpacity(UI_ELEMENTS.UI_LAYER, '0');
    showScreen(UI_ELEMENTS.MAIN_MENU);
}

// ============ MOOD HELPERS ============

/**
 * Get emoji for mood level
 */
export function getMoodEmoji(mood) {
    if (mood >= 80) return "\uD83D\uDE0A";
    if (mood >= 60) return "\uD83D\uDE10";
    if (mood >= 40) return "\uD83D\uDE15";
    if (mood >= 20) return "\uD83D\uDE20";
    return "\uD83D\uDE21";
}

/**
 * Get color for mood level
 */
export function getMoodColor(mood) {
    if (mood >= 80) return "#00ff00";
    if (mood >= 60) return "#88ff00";
    if (mood >= 40) return "#ffff00";
    if (mood >= 20) return "#ff8800";
    return "#ff0000";
}
