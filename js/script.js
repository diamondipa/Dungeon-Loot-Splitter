/**
 * Dungeon Loot Splitter - Phase 3
 * Author: Your Name
 * Description: Now your loot actually sticks around after you refresh the page!
 * 
 * The big idea: The loot array and party size are still the source of truth,
 * but now we save everything to localStorage so you don't lose your data.
 * Lifecycle: Mutation -> Save -> updateUI() | Load -> Restore -> updateUI() | Reset -> Clear -> updateUI()
 */

// ========== CONSTANTS ==========
// Keeping this at the top so it's easy to find/change if needed
// Using a constant means we won't accidentally typo the key name somewhere else
const STORAGE_KEY = "lootSplitterState";

// ========== APPLICATION STATE (Single Source of Truth) ==========
// This is where all our data lives - the UI is just a reflection of these variables
let lootArray = []; // Each item is an object with name, value, and quantity
let partySize = 1;  // Default to 1, but restoreState() will override this if there's saved data

// ========== DOM ELEMENT REFERENCES ==========
// Grabbing all the HTML elements we need to interact with
const partySizeInput = document.getElementById('partySize');
const lootNameInput = document.getElementById('lootName');
const lootValueInput = document.getElementById('lootValue');
const lootQuantityInput = document.getElementById('lootQuantity');
const addLootBtn = document.getElementById('addLootBtn');
const splitLootBtn = document.getElementById('splitLootBtn');
const resetAllBtn = document.getElementById('resetAllBtn'); // The new kid on the block
const lootRows = document.getElementById('lootRows');
const noLootMessage = document.getElementById('noLootMessage');
const totalLootSpan = document.getElementById('totalLoot');
const finalTotalSpan = document.getElementById('finalTotal');
const perMemberSpan = document.getElementById('perMember');
const splitResultsDiv = document.getElementById('splitResults');
const errorMessagesDiv = document.getElementById('errorMessages');

// ========== STORAGE FUNCTIONS ==========

/**
 * Saves whatever's in lootArray and partySize to localStorage
 * Gets called right after we change anything - before updating the UI
 * Think of it like auto-saving in a game
 */
function saveState() {
    // Bundle everything into one object - makes it easier to manage
    const state = {
        loot: lootArray,
        partySize: partySize
    };
    
    // JSON.stringify turns our object into a string that can be stored
    // localStorage only speaks strings, so this step is crucial
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    
    // Helpful for debugging - we can see exactly what got saved
    console.log('Auto-saved to localStorage:', state);
}

/**
 * Loads previously saved data from localStorage when the page starts up
 * Kinda like loading a saved game - we gotta check if there's a save file first
 * Also does validation because we can't trust saved data to be perfect
 */
function restoreState() {
    // Try to grab whatever's stored under our key
    const savedState = localStorage.getItem(STORAGE_KEY);
    
    // Nothing saved? No problem, we'll just use defaults
    if (!savedState) {
        console.log('No saved game found, starting fresh');
        return;
    }
    
    try {
        // Turn the stored string back into a real JavaScript object
        const parsed = JSON.parse(savedState);
        
        // ===== SANITY CHECKS =====
        // First, make sure we actually got an object back
        if (typeof parsed !== 'object' || parsed === null) {
            console.error('Saved data is messed up - ignoring it');
            return;
        }
        
        // ===== RESTORE PARTY SIZE =====
        // But only if it's actually a valid number
        if (parsed.hasOwnProperty('partySize')) {
            const parsedPartySize = parseInt(parsed.partySize);
            // Party size has to be at least 1 - can't split loot among 0 people!
            if (!isNaN(parsedPartySize) && parsedPartySize >= 1) {
                partySize = parsedPartySize;
                // Update the input box so it matches what we just loaded
                partySizeInput.value = partySize;
            } else {
                console.error('Saved party size is invalid, sticking with default');
            }
        }
        
        // ===== RESTORE LOOT ARRAY =====
        // Only proceed if we actually have an array to work with
        if (parsed.hasOwnProperty('loot') && Array.isArray(parsed.loot)) {
            // Start fresh - we'll rebuild the array piece by piece
            lootArray = [];
            
            // Go through each saved item and check if it's still valid
            // This is like inspecting each piece of loot before accepting it
            for (let i = 0; i < parsed.loot.length; i++) {
                const item = parsed.loot[i];
                
                // Check that the item has all the right pieces
                const hasValidName = item.hasOwnProperty('name') && 
                                     typeof item.name === 'string' && 
                                     item.name.trim() !== '';
                
                const hasValidValue = item.hasOwnProperty('value') && 
                                      typeof item.value === 'number' && 
                                      !isNaN(item.value) && 
                                      item.value >= 0;
                
                const hasValidQuantity = item.hasOwnProperty('quantity') && 
                                         typeof item.quantity === 'number' && 
                                         !isNaN(item.quantity) && 
                                         item.quantity >= 1;
                
                // Only keep the items that pass inspection
                if (hasValidName && hasValidValue && hasValidQuantity) {
                    lootArray.push({
                        name: item.name.trim(),
                        value: item.value,
                        quantity: item.quantity
                    });
                    console.log('Restored valid loot:', item.name);
                } else {
                    console.error('Skipped corrupted loot:', item);
                }
            }
        } else {
            console.log('No loot found in saved data');
        }
        
        console.log('Game loaded successfully:', { loot: lootArray, partySize: partySize });
        
    } catch (e) {
        // If something goes terribly wrong with parsing, just give up and use defaults
        // Better to start fresh than to crash the whole app
        console.error('Failed to load saved data:', e);
        // Make sure the input field matches our default party size
        partySizeInput.value = partySize;
    }
}

/**
 * Wipes everything clean - both memory and storage
 * Like starting a new game and deleting the old save file
 * Called when the user clicks the Reset All button
 */
function resetAll() {
    // Clear out memory
    lootArray = [];
    partySize = 1;
    
    // Update the input field
    partySizeInput.value = partySize;
    
    // Clear the input fields so they're ready for new entries
    lootNameInput.value = '';
    lootValueInput.value = '';
    lootQuantityInput.value = '1';
    
    // Delete the saved data from localStorage
    localStorage.removeItem(STORAGE_KEY);
    
    // Refresh the UI to show empty state
    updateUI();
    
    // Get rid of any old error messages
    clearErrors();
    
    console.log('Reset everything to defaults');
}

// ========== HELPER FUNCTIONS ==========

/**
 * Clears out any error messages showing
 */
function clearErrors() {
    errorMessagesDiv.innerHTML = '';
}

/**
 * Shows an error message to the user
 * @param {string} message - What we want to tell the user went wrong
 */
function showError(message) {
    errorMessagesDiv.innerHTML = `<p>⚠️ ${message}</p>`;
}

/**
 * Checks if the loot the user is trying to add is actually valid
 * Can't have empty names, negative values, or quantities less than 1
 * @returns {boolean} - True if we can add this loot, false if something's wrong
 */
function validateLootInput() {
    const name = lootNameInput.value.trim();
    const value = parseFloat(lootValueInput.value);
    const quantity = parseInt(lootQuantityInput.value);
    
    // Empty name? That's not helpful
    if (name === '') {
        showError('Loot needs a name - what did you find?');
        return false;
    }
    
    // Make sure value is actually a number
    if (isNaN(value)) {
        showError('Please enter a number for the loot value');
        return false;
    }
    
    // No negative gold pieces allowed!
    if (value < 0) {
        showError('Loot value cannot be negative (unless you owe money?)');
        return false;
    }
    
    // Quantity has to be at least 1
    if (isNaN(quantity) || quantity < 1) {
        showError('Quantity must be at least 1');
        return false;
    }
    
    // Everything looks good!
    return true;
}

/**
 * Checks if the party size is valid (number and at least 1)
 * @returns {boolean} - True if party size is good to go
 */
function isPartySizeValid() {
    const parsedPartySize = parseInt(partySizeInput.value);
    
    // Can't split loot among zero or negative party members
    if (isNaN(parsedPartySize) || parsedPartySize < 1) {
        return false;
    }
    
    return true;
}

/**
 * Prevents nasty stuff from being injected into our page
 * Turns special characters into their safe HTML versions
 * @param {string} unsafe - Raw user input that might contain HTML
 * @returns {string} - Safe string that won't break anything
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
 * Adds a new piece of loot to the array
 * Triggered when someone clicks "Add Loot"
 * Flow: Add item -> Save to localStorage -> Update the screen
 */
function addLoot() {
    // Clear out old error messages first
    clearErrors();
    
    // Stop if the loot isn't valid
    if (!validateLootInput()) {
        return;
    }
    
    // Grab what the user typed
    const name = lootNameInput.value.trim();
    const value = parseFloat(lootValueInput.value);
    const quantity = parseInt(lootQuantityInput.value);
    
    // Create a new loot object
    const lootItem = {
        name: name,
        value: value,
        quantity: quantity
    };
    
    // Add it to our array
    lootArray.push(lootItem);
    
    // Clear the input fields so it's ready for the next item
    lootNameInput.value = '';
    lootValueInput.value = '';
    lootQuantityInput.value = '1';
    
    // ===== AUTO-SAVE =====
    // Save to localStorage before updating UI
    saveState();
    
    // Update everything on screen
    updateUI();
}

/**
 * Removes a loot item at the given position
 * Flow: Remove item -> Save to localStorage -> Update screen
 * @param {number} index - Which item to remove (starts at 0)
 */
function removeLoot(index) {
    // Splice removes the item at that position
    lootArray.splice(index, 1);
    
    // ===== AUTO-SAVE =====
    // Save the updated array
    saveState();
    
    // Refresh the display
    updateUI();
}

/**
 * The brains of the operation - handles all calculations and screen updates
 * This is the ONLY place that touches the UI
 * Gets called after any change to state
 * Never reads from localStorage directly - that's restoreState's job
 */
function updateUI() {
    // Start fresh with errors
    clearErrors();
    
    // ===== 1. SYNC PARTY SIZE =====
    // Grab what's in the input and update our state variable
    const inputPartySize = parseInt(partySizeInput.value);
    if (!isNaN(inputPartySize) && inputPartySize >= 1) {
        partySize = inputPartySize;
    }
    
    // ===== 2. CALCULATE TOTAL LOOT VALUE =====
    // Loop through all loot and add up (value × quantity)
    let totalLootValue = 0;
    for (let i = 0; i < lootArray.length; i++) {
        totalLootValue += lootArray[i].value * lootArray[i].quantity;
    }
    
    // ===== 3. DRAW THE LOOT LIST =====
    // Clear out the old list first
    lootRows.innerHTML = '';
    
    // Show empty message if there's no loot
    if (lootArray.length === 0) {
        noLootMessage.classList.remove('hidden');
    } else {
        // Hide empty message and draw each item
        noLootMessage.classList.add('hidden');
        
        // Loop through each item and create its row
        for (let i = 0; i < lootArray.length; i++) {
            const item = lootArray[i];
            
            // Create a container for this row
            const row = document.createElement('div');
            row.className = 'loot-row';
            
            // Item name (with HTML escaped for safety)
            const nameCell = document.createElement('div');
            nameCell.className = 'loot-cell';
            nameCell.innerText = escapeHTML(item.name);
            
            // Value (formatted nicely with 2 decimals)
            const valueCell = document.createElement('div');
            valueCell.className = 'loot-cell';
            valueCell.innerText = '$' + item.value.toFixed(2);
            
            // Quantity
            const quantityCell = document.createElement('div');
            quantityCell.className = 'loot-cell';
            quantityCell.innerText = item.quantity;
            
            // Remove button
            const actionCell = document.createElement('div');
            actionCell.className = 'loot-cell';
            
            const removeBtn = document.createElement('button');
            removeBtn.innerText = 'Remove';
            // This closure trick captures the correct index for each button
            removeBtn.addEventListener('click', (function(index) {
                return function() {
                    removeLoot(index);
                };
            })(i));
            
            actionCell.appendChild(removeBtn);
            
            // Assemble the row
            row.appendChild(nameCell);
            row.appendChild(valueCell);
            row.appendChild(quantityCell);
            row.appendChild(actionCell);
            
            // Add it to the page
            lootRows.appendChild(row);
        }
    }
    
    // ===== 4. UPDATE TOTAL DISPLAY =====
    totalLootSpan.textContent = totalLootValue.toFixed(2);
    
    // ===== 5. CHECK IF PARTY SIZE IS VALID =====
    const partyValid = isPartySizeValid();
    
    // ===== 6. HANDLE SPLIT RESULTS SECTION =====
    if (lootArray.length > 0 && partyValid) {
        // We have loot and a valid party - show the split
        finalTotalSpan.textContent = totalLootValue.toFixed(2);
        
        // Calculate each person's share
        const perMemberValue = totalLootValue / partySize;
        perMemberSpan.textContent = perMemberValue.toFixed(2);
        
        // Show the results box and enable the split button
        splitResultsDiv.classList.remove('hidden');
        splitLootBtn.disabled = false;
    } else {
        // Something's missing - hide results and disable button
        splitResultsDiv.classList.add('hidden');
        splitLootBtn.disabled = true;
        
        // Show helpful error messages based on what's wrong
        if (lootArray.length === 0 && partyValid) {
            showError('Add some loot before trying to split');
        } else if (lootArray.length > 0 && !partyValid) {
            showError('Party size needs to be at least 1');
        } else if (lootArray.length === 0 && !partyValid) {
            showError('Add some loot and set a valid party size');
        }
    }
}

/**
 * Handles the Split button click
 * Button is disabled when state is invalid, so this only runs when everything's good
 */
function splitLoot() {
    // Clear old errors
    clearErrors();
    
    // Double-check party size just in case
    if (!isPartySizeValid()) {
        showError('Party size must be at least 1');
        updateUI();
        return;
    }
    
    // Make sure there's actually loot to split
    if (lootArray.length === 0) {
        showError('Nothing to split yet');
        updateUI();
        return;
    }
    
    // All the calculations already happened in updateUI
    // Just refresh to be safe
    updateUI();
    
    // Let the user know it worked
    const currentPartySize = parseInt(partySizeInput.value);
    showError(`Split ${currentPartySize} ways!`); // Reusing error area for feedback
}

/**
 * Triggered whenever someone changes the party size input
 * Flow: Change party size -> Save to localStorage -> Update UI
 */
function handlePartySizeChange() {
    const newPartySize = parseInt(partySizeInput.value);
    
    // Only update if it's valid
    if (!isNaN(newPartySize) && newPartySize >= 1) {
        partySize = newPartySize;
        
        // ===== AUTO-SAVE =====
        saveState();
    }
    
    // Recalculate everything with the new party size
    updateUI();
}

// ========== EVENT LISTENERS ==========
// Hooking up our functions to what happens on the page

// Add loot button
addLootBtn.addEventListener('click', addLoot);

// Split button
splitLootBtn.addEventListener('click', splitLoot);

// New reset button for Phase 3
resetAllBtn.addEventListener('click', resetAll);

// Party size changes (as the user types)
partySizeInput.addEventListener('input', handlePartySizeChange);

// Let users press Enter instead of clicking buttons
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

// ========== STARTUP ==========
// Wait for the page to be fully loaded before trying to restore data
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded - time to restore saved data');
    
    // This is a great spot to set a breakpoint for debugging
    // You can inspect what gets loaded before it hits the screen
    
    // Flow: Load page -> Restore saved data -> Update screen
    
    // 1. Try to load any saved game data
    restoreState();
    
    // 2. Make sure the input box matches what we loaded
    partySizeInput.value = partySize;
    
    // 3. Draw everything on screen
    updateUI();
    
    console.log('Ready to go! Current state:', { loot: lootArray, partySize: partySize });
});

// Just for debugging - not used by the actual app
console.log('Dungeon Loot Splitter Phase 3 loaded - now with auto-save!');
