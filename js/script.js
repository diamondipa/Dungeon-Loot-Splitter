/**
 * Dungeon Loot Splitter - Phase 2
 * Author: Your Name
 * Description: State-driven application with centralized UI updates
 * 
 * Architectural Principle: The loot array and party size are the source of truth.
 * The interface always reflects the current state. All updates go through updateUI().
 */

// ========== APPLICATION STATE (Single Source of Truth) ==========
// Main array to store all loot items - each item is an object with name, value, and quantity
let lootArray = [];

// ========== DOM ELEMENT REFERENCES ==========
// Using ONLY getElementById as required
const partySizeInput = document.getElementById('partySize');
const lootNameInput = document.getElementById('lootName');
const lootValueInput = document.getElementById('lootValue');
const lootQuantityInput = document.getElementById('lootQuantity');
const addLootBtn = document.getElementById('addLootBtn');
const splitLootBtn = document.getElementById('splitLootBtn');
const lootRows = document.getElementById('lootRows');
const noLootMessage = document.getElementById('noLootMessage');
const totalLootSpan = document.getElementById('totalLoot');
const finalTotalSpan = document.getElementById('finalTotal');
const perMemberSpan = document.getElementById('perMember');
const splitResultsDiv = document.getElementById('splitResults');
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
 * Prevents invalid state from entering the loot array
 * @returns {boolean} - True if validation passes, false otherwise
 */
function validateLootInput() {
    const name = lootNameInput.value.trim();
    const value = parseFloat(lootValueInput.value);
    const quantity = parseInt(lootQuantityInput.value);
    
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
    
    if (isNaN(quantity) || quantity < 1) {
        showError('Quantity must be at least 1');
        return false;
    }
    
    return true;
}

/**
 * Validates party size before calculations
 * @returns {boolean} - True if validation passes, false otherwise
 */
function isPartySizeValid() {
    const partySize = parseInt(partySizeInput.value);
    
    // Check if party size is valid number and at least 1
    if (isNaN(partySize) || partySize < 1) {
        return false;
    }
    
    return true;
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

// ========== CORE FUNCTIONS ==========

/**
 * Adds a new loot item to the array
 * Triggered by Add Loot button - modifies state then calls updateUI()
 */
function addLoot() {
    // Clear previous errors
    clearErrors();
    
    // Validate input before modifying state (prevents invalid data)
    if (!validateLootInput()) {
        return;
    }
    
    // Get values from inputs
    const name = lootNameInput.value.trim();
    const value = parseFloat(lootValueInput.value);
    const quantity = parseInt(lootQuantityInput.value);
    
    // Create loot object as plain object literal with name, value, and quantity
    const lootItem = {
        name: name,
        value: value,
        quantity: quantity
    };
    
    // Push to array (state modification)
    lootArray.push(lootItem);
    
    // Clear input fields for better UX
    lootNameInput.value = '';
    lootValueInput.value = '';
    lootQuantityInput.value = '1';
    
    // Update the entire UI to reflect new state
    updateUI();
}

/**
 * Removes a loot item from the array at specified index
 * Uses splice() to modify array - then calls updateUI()
 * @param {number} index - Index of item to remove
 */
function removeLoot(index) {
    // Use splice to remove the correct item by index
    lootArray.splice(index, 1);
    
    // Update UI after state change
    updateUI();
}

/**
 * Central function that performs all calculations and rendering
 * This is the ONLY place where UI updates happen
 * Called after every state change
 */
function updateUI() {
    // Clear any existing errors
    clearErrors();
    
    // ===== 1. CALCULATE TOTALS =====
    // Use traditional for loop to calculate total loot (value × quantity)
    let totalLootValue = 0;
    for (let i = 0; i < lootArray.length; i++) {
        totalLootValue += lootArray[i].value * lootArray[i].quantity;
    }
    
    // ===== 2. RENDER LOOT LIST =====
    // Clear the loot rows container
    lootRows.innerHTML = '';
    
    // Check if array is empty for empty state handling
    if (lootArray.length === 0) {
        // Show empty message, hide loot table rows
        noLootMessage.classList.remove('hidden');
    } else {
        // Hide empty message
        noLootMessage.classList.add('hidden');
        
        // Traditional for loop to render each loot item
        for (let i = 0; i < lootArray.length; i++) {
            const item = lootArray[i];
            
            // Create row container
            const row = document.createElement('div');
            row.className = 'loot-row';
            
            // Name cell
            const nameCell = document.createElement('div');
            nameCell.className = 'loot-cell';
            nameCell.innerText = escapeHTML(item.name);
            
            // Value cell (formatted to 2 decimals)
            const valueCell = document.createElement('div');
            valueCell.className = 'loot-cell';
            valueCell.innerText = '$' + item.value.toFixed(2);
            
            // Quantity cell
            const quantityCell = document.createElement('div');
            quantityCell.className = 'loot-cell';
            quantityCell.innerText = item.quantity;
            
            // Action cell with Remove button
            const actionCell = document.createElement('div');
            actionCell.className = 'loot-cell';
            
            const removeBtn = document.createElement('button');
            removeBtn.innerText = 'Remove';
            // Use closure to capture correct index
            removeBtn.addEventListener('click', (function(index) {
                return function() {
                    removeLoot(index);
                };
            })(i));
            
            actionCell.appendChild(removeBtn);
            
            // Assemble row
            row.appendChild(nameCell);
            row.appendChild(valueCell);
            row.appendChild(quantityCell);
            row.appendChild(actionCell);
            
            // Add row to container
            lootRows.appendChild(row);
        }
    }
    
    // ===== 3. UPDATE TOTAL LOOT DISPLAY =====
    totalLootSpan.textContent = totalLootValue.toFixed(2);
    
    // ===== 4. CHECK PARTY SIZE VALIDITY =====
    const partyValid = isPartySizeValid();
    const partySize = parseInt(partySizeInput.value);
    
    // ===== 5. CALCULATE SPLIT AND UPDATE RESULTS SECTION =====
    if (lootArray.length > 0 && partyValid) {
        // Valid state - show results and enable split button
        finalTotalSpan.textContent = totalLootValue.toFixed(2);
        
        // Calculate per member share (currency only, not items)
        const perMemberValue = totalLootValue / partySize;
        perMemberSpan.textContent = perMemberValue.toFixed(2);
        
        // Show results section
        splitResultsDiv.classList.remove('hidden');
        
        // Enable split button
        splitLootBtn.disabled = false;
    } else {
        // Invalid state - hide results and disable split button
        splitResultsDiv.classList.add('hidden');
        splitLootBtn.disabled = true;
        
        // Show specific error message if needed
        if (lootArray.length === 0 && partyValid) {
            showError('Add some loot before splitting');
        } else if (lootArray.length > 0 && !partyValid) {
            showError('Party size must be at least 1');
        } else if (lootArray.length === 0 && !partyValid) {
            showError('Add loot and set valid party size');
        }
    }
}

/**
 * Split Loot button handler
 * Now just validates state and calls updateUI (no calculation logic)
 * The button is disabled when state is invalid, so this only runs when valid
 */
function splitLoot() {
    // Clear previous errors
    clearErrors();
    
    // Party size is validated by button state, but double-check for safety
    if (!isPartySizeValid()) {
        showError('Party size must be at least 1');
        updateUI();
        return;
    }
    
    if (lootArray.length === 0) {
        showError('No loot to split');
        updateUI();
        return;
    }
    
    // All calculations are already done in updateUI
    // We just need to ensure results are visible (which they already are)
    // But we'll call updateUI to be safe and ensure everything is current
    updateUI();
    
    // Optional: Add a success message
    const partySize = parseInt(partySizeInput.value);
    showError(`Loot split ${partySize} ways!`); // Using error area for feedback
}

// ========== EVENT LISTENERS ==========
// All listeners registered in script.js - no inline handlers

// Add Loot button click
addLootBtn.addEventListener('click', addLoot);

// Split Loot button click
splitLootBtn.addEventListener('click', splitLoot);

// Party size input change - automatically trigger update
partySizeInput.addEventListener('input', function() {
    // When party size changes, update the UI (totals and split recalculated)
    updateUI();
});

// Optional: Allow Enter key in inputs for better UX
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

lootQuantityInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        addLoot();
    }
});

// ========== INITIALIZATION ==========
// Set initial UI state
updateUI();

// Log for debugging (not used for output)
console.log('Dungeon Loot Splitter Phase 2 initialized - State-driven architecture');
