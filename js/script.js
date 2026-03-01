// Dungeon Loot Splitter
// Author: Your Name
// Description: Event-driven application to split loot among party members

// ========== ARRAY DECLARATION ==========
// Main array to store loot items - each item is an object with name and value
let lootArray = [];

// ========== DOM ELEMENT REFERENCES ==========
// Using ONLY getElementById as required
const partySizeInput = document.getElementById('partySize');
const lootNameInput = document.getElementById('lootName');
const lootValueInput = document.getElementById('lootValue');
const addLootBtn = document.getElementById('addLootBtn');
const splitLootBtn = document.getElementById('splitLootBtn');
const lootListContainer = document.getElementById('lootListContainer');
const runningTotalSpan = document.getElementById('runningTotal');
const finalTotalSpan = document.getElementById('finalTotal');
const perMemberSpan = document.getElementById('perMember');
const errorMessagesDiv = document.getElementById('errorMessages');

// ========== HELPER FUNCTIONS ==========

/**
 * Clears all error messages from the display
 */
function clearErrors() {
    errorMessagesDiv.innerHTML = '';
}

/**
 * Displays an error message in the error container
 * @param {string} message - The error message to display
 */
function showError(message) {
    errorMessagesDiv.innerHTML = `<p>⚠️ ${message}</p>`;
}

/**
 * Validates loot input before adding to array
 * @returns {boolean} - True if validation passes, false otherwise
 */
function validateLootInput() {
    const name = lootNameInput.value.trim();
    const value = parseFloat(lootValueInput.value);
    
    // Conditional logic for validation
    if (name === '') {
        showError('Loot name cannot be empty');
        return false;
    }
    
    if (isNaN(value)) {
        showError('Please enter a valid number for loot value');
        return false;
    }
    
    if (value < 0) {
        showError('Loot value cannot be negative');
        return false;
    }
    
    return true;
}

/**
 * Validates party size before splitting
 * @returns {boolean} - True if validation passes, false otherwise
 */
function validatePartySize() {
    const partySize = parseInt(partySizeInput.value);
    
    if (isNaN(partySize) || partySize < 1) {
        showError('Party size must be at least 1');
        return false;
    }
    
    return true;
}

// ========== CORE FUNCTIONS ==========

/**
 * Calculates total value of all loot in the array
 * Uses TRADITIONAL FOR LOOP as required
 * @returns {number} - Total value of all loot
 */
function calculateTotal() {
    let total = 0;
    // Traditional for loop to calculate total
    for (let i = 0; i < lootArray.length; i++) {
        total += lootArray[i].value;
    }
    return total;
}

/**
 * Renders the loot list to the DOM
 * Uses TRADITIONAL FOR LOOP as required
 */
function renderLoot() {
    // Clear current display
    lootListContainer.innerHTML = '';
    
    // Check if array is empty (conditional logic)
    if (lootArray.length === 0) {
        lootListContainer.innerHTML = '<p class="empty-message">No loot added yet.</p>';
        runningTotalSpan.textContent = '0.00';
        return;
    }
    
    // Traditional for loop to render each loot item
    for (let i = 0; i < lootArray.length; i++) {
        const lootItem = lootArray[i];
        
        // Create loot item element
        const itemDiv = document.createElement('div');
        itemDiv.className = 'loot-item';
        
        // Add content
        itemDiv.innerHTML = `
            <span class="loot-name">${escapeHTML(lootItem.name)}</span>
            <span class="loot-value">$${lootItem.value.toFixed(2)}</span>
        `;
        
        lootListContainer.appendChild(itemDiv);
    }
    
    // Update running total
    const total = calculateTotal();
    runningTotalSpan.textContent = total.toFixed(2);
}

/**
 * Simple HTML escape to prevent XSS
 * @param {string} unsafe - Unsafe string
 * @returns {string} - Safe string
 */
function escapeHTML(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Adds a new loot item to the array
 * Triggered by Add Loot button
 */
function addLoot() {
    // Clear previous errors
    clearErrors();
    
    // Validate input (conditional logic)
    if (!validateLootInput()) {
        return;
    }
    
    // Get values
    const name = lootNameInput.value.trim();
    const value = parseFloat(lootValueInput.value);
    
    // Create loot object and push to array
    const lootItem = {
        name: name,
        value: value
    };
    
    lootArray.push(lootItem);
    
    // Clear input fields
    lootNameInput.value = '';
    lootValueInput.value = '';
    
    // Re-render the loot list
    renderLoot();
    
    // Extra credit: Auto-update split if we want to be fancy
    // But we'll keep it separate for now
}

/**
 * Splits loot among party members
 * Triggered by Split Loot button
 */
function splitLoot() {
    // Clear previous errors
    clearErrors();
    
    // Validate party size (conditional logic)
    if (!validatePartySize()) {
        return;
    }
    
    // Check if there's any loot (conditional logic)
    if (lootArray.length === 0) {
        showError('No loot to split! Add some loot first.');
        return;
    }
    
    // Get values
    const partySize = parseInt(partySizeInput.value);
    const totalLoot = calculateTotal();
    
    // Calculate per member share
    const perMember = totalLoot / partySize;
    
    // Update display with formatted values
    finalTotalSpan.textContent = totalLoot.toFixed(2);
    perMemberSpan.textContent = perMember.toFixed(2);
}

// ========== EVENT LISTENERS ==========
// Register event listeners for buttons
addLootBtn.addEventListener('click', addLoot);
splitLootBtn.addEventListener('click', splitLoot);

// Optional: Allow Enter key in inputs
lootNameInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        addLoot();
    }
});

lootValueInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        addLoot();
    }
});

partySizeInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        splitLoot();
    }
});

// ========== INITIALIZATION ==========
// Clear any default values and set initial state
clearErrors();
renderLoot();

// Log for debugging (not used for output)
console.log('Dungeon Loot Splitter initialized');
