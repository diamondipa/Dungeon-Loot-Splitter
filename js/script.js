/**
 * Dungeon Loot Splitter - Phase 4
 * Author: Ian A
 * Description: Extends Phase 3 with external server synchronization.
 *
 * Phase 4 adds two server operations:
 *   syncToServer()    — POST full state to server. No mutation. No render.
 *   loadFromServer()  — GET state from server. Validate -> Assign -> Save -> updateUI().
 *
 * All Phase 3 architectural contracts remain fully in force.
 *
 * Lifecycles:
 *   Mutation   -> Save (local) -> updateUI()
 *   Page Load  -> Restore (local) -> updateUI()
 *   Sync       -> POST to server (read-only — no state change, no render)
 *   Load       -> Fetch -> Validate -> Assign -> Save (local) -> updateUI()
 */

// ========== CONSTANTS ==========
const STORAGE_KEY = "lootSplitterState";
const STUDENT_ID  = "ianA";
const SERVER_BASE = "http://goldtop.hopto.org";

// ========== APPLICATION STATE (Single Source of Truth) ==========
let lootArray = [];
let partySize  = 1;

// ========== DOM ELEMENT REFERENCES ==========
const partySizeInput    = document.getElementById('partySize');
const lootNameInput     = document.getElementById('lootName');
const lootValueInput    = document.getElementById('lootValue');
const lootQuantityInput = document.getElementById('lootQuantity');
const addLootBtn        = document.getElementById('addLootBtn');
const splitLootBtn      = document.getElementById('splitLootBtn');
const resetAllBtn       = document.getElementById('resetAllBtn');
const lootRows          = document.getElementById('lootRows');
const noLootMessage     = document.getElementById('noLootMessage');
const totalLootSpan     = document.getElementById('totalLoot');
const finalTotalSpan    = document.getElementById('finalTotal');
const perMemberSpan     = document.getElementById('perMember');
const splitResultsDiv   = document.getElementById('splitResults');
const errorMessagesDiv  = document.getElementById('errorMessages');

// Phase 4 DOM references
const syncToServerBtn   = document.getElementById('syncToServerBtn');
const loadFromServerBtn = document.getElementById('loadFromServerBtn');
const syncStatusDiv     = document.getElementById('syncStatus');

// ========== STORAGE FUNCTIONS (Phase 3 — unchanged) ==========

/**
 * Saves lootArray and partySize to localStorage.
 * Called after every mutation, before updateUI().
 */
function saveState() {
    const state = {
        loot: lootArray,
        partySize: partySize
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    console.log('Saved to localStorage:', state);
}

/**
 * Restores saved data from localStorage on page load.
 * Validates each field before assigning to in-memory state.
 */
function restoreState() {
    const savedState = localStorage.getItem(STORAGE_KEY);

    if (!savedState) {
        console.log('No saved state found — starting fresh');
        return;
    }

    try {
        const parsed = JSON.parse(savedState);

        if (typeof parsed !== 'object' || parsed === null) {
            console.error('Saved state is malformed — ignoring');
            return;
        }

        if (parsed.hasOwnProperty('partySize')) {
            const parsedPartySize = parseInt(parsed.partySize);
            if (!isNaN(parsedPartySize) && parsedPartySize >= 1) {
                partySize = parsedPartySize;
                partySizeInput.value = partySize;
            } else {
                console.error('Invalid saved partySize — using default');
            }
        }

        if (parsed.hasOwnProperty('loot') && Array.isArray(parsed.loot)) {
            lootArray = [];
            for (let i = 0; i < parsed.loot.length; i++) {
                const item = parsed.loot[i];
                const hasValidName     = item.hasOwnProperty('name')     && typeof item.name     === 'string' && item.name.trim() !== '';
                const hasValidValue    = item.hasOwnProperty('value')    && typeof item.value    === 'number' && !isNaN(item.value)    && item.value    >= 0;
                const hasValidQuantity = item.hasOwnProperty('quantity') && typeof item.quantity === 'number' && !isNaN(item.quantity) && item.quantity >= 1;

                if (hasValidName && hasValidValue && hasValidQuantity) {
                    lootArray.push({ name: item.name.trim(), value: item.value, quantity: item.quantity });
                    console.log('Restored loot item:', item.name);
                } else {
                    console.error('Skipped invalid loot item during restore:', item);
                }
            }
        }

        console.log('State restored from localStorage:', { loot: lootArray, partySize: partySize });

    } catch (e) {
        console.error('Failed to parse saved state:', e);
        partySizeInput.value = partySize;
    }
}

/**
 * Resets all state, clears localStorage, refreshes UI.
 */
function resetAll() {
    lootArray = [];
    partySize  = 1;
    partySizeInput.value  = partySize;
    lootNameInput.value   = '';
    lootValueInput.value  = '';
    lootQuantityInput.value = '1';
    localStorage.removeItem(STORAGE_KEY);
    updateUI();
    clearErrors();
    hideSyncStatus();
    console.log('State reset to defaults');
}

// ========== HELPER FUNCTIONS (Phase 3 — unchanged) ==========

function clearErrors() {
    errorMessagesDiv.innerHTML = '';
}

function showError(message) {
    errorMessagesDiv.innerHTML = `<p>⚠️ ${message}</p>`;
}

function validateLootInput() {
    const name     = lootNameInput.value.trim();
    const value    = parseFloat(lootValueInput.value);
    const quantity = parseInt(lootQuantityInput.value);

    if (name === '') {
        showError('Loot needs a name — what did you find?');
        return false;
    }
    if (isNaN(value)) {
        showError('Please enter a number for the loot value');
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

function isPartySizeValid() {
    const parsedPartySize = parseInt(partySizeInput.value);
    return !isNaN(parsedPartySize) && parsedPartySize >= 1;
}

function escapeHTML(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ========== PHASE 4 HELPERS: SYNC STATUS DISPLAY ==========

/**
 * Shows a status message in the sync status area.
 * @param {string} message - Text to display
 * @param {'success'|'error'|'loading'} type - Visual style
 */
function showSyncStatus(message, type) {
    syncStatusDiv.textContent = message;
    // Remove all state classes then apply the right one
    syncStatusDiv.classList.remove('hidden', 'success', 'error', 'loading');
    syncStatusDiv.classList.add(type);
}

/**
 * Hides the sync status area and clears its content.
 */
function hideSyncStatus() {
    syncStatusDiv.textContent = '';
    syncStatusDiv.classList.add('hidden');
    syncStatusDiv.classList.remove('success', 'error', 'loading');
}

// ========== CORE FUNCTIONS (Phase 3 — unchanged) ==========

function addLoot() {
    clearErrors();
    if (!validateLootInput()) { return; }

    const name     = lootNameInput.value.trim();
    const value    = parseFloat(lootValueInput.value);
    const quantity = parseInt(lootQuantityInput.value);

    lootArray.push({ name: name, value: value, quantity: quantity });

    lootNameInput.value     = '';
    lootValueInput.value    = '';
    lootQuantityInput.value = '1';

    // Lifecycle: Mutate -> Save -> updateUI()
    saveState();
    updateUI();
}

function removeLoot(index) {
    lootArray.splice(index, 1);
    // Lifecycle: Mutate -> Save -> updateUI()
    saveState();
    updateUI();
}

/**
 * Renders the entire UI from in-memory state.
 * The only function allowed to touch the DOM for display purposes.
 * Does NOT read from localStorage or the server.
 */
function updateUI() {
    clearErrors();

    // 1. Sync party size from input
    const inputPartySize = parseInt(partySizeInput.value);
    if (!isNaN(inputPartySize) && inputPartySize >= 1) {
        partySize = inputPartySize;
    }

    // 2. Calculate total loot value
    let totalLootValue = 0;
    for (let i = 0; i < lootArray.length; i++) {
        totalLootValue += lootArray[i].value * lootArray[i].quantity;
    }

    // 3. Render loot list
    lootRows.innerHTML = '';

    if (lootArray.length === 0) {
        noLootMessage.classList.remove('hidden');
    } else {
        noLootMessage.classList.add('hidden');

        for (let i = 0; i < lootArray.length; i++) {
            const item = lootArray[i];

            const row          = document.createElement('div');
            row.className      = 'loot-row';

            const nameCell     = document.createElement('div');
            nameCell.className = 'loot-cell';
            nameCell.innerText = escapeHTML(item.name);

            const valueCell     = document.createElement('div');
            valueCell.className = 'loot-cell';
            valueCell.innerText = '$' + item.value.toFixed(2);

            const quantityCell     = document.createElement('div');
            quantityCell.className = 'loot-cell';
            quantityCell.innerText = item.quantity;

            const actionCell     = document.createElement('div');
            actionCell.className = 'loot-cell';

            const removeBtn    = document.createElement('button');
            removeBtn.innerText = 'Remove';
            removeBtn.addEventListener('click', (function(index) {
                return function() { removeLoot(index); };
            })(i));

            actionCell.appendChild(removeBtn);
            row.appendChild(nameCell);
            row.appendChild(valueCell);
            row.appendChild(quantityCell);
            row.appendChild(actionCell);
            lootRows.appendChild(row);
        }
    }

    // 4. Update total display
    totalLootSpan.textContent = totalLootValue.toFixed(2);

    // 5. Handle split results
    const partyValid = isPartySizeValid();

    if (lootArray.length > 0 && partyValid) {
        finalTotalSpan.textContent = totalLootValue.toFixed(2);
        perMemberSpan.textContent  = (totalLootValue / partySize).toFixed(2);
        splitResultsDiv.classList.remove('hidden');
        splitLootBtn.disabled = false;
    } else {
        splitResultsDiv.classList.add('hidden');
        splitLootBtn.disabled = true;

        if (lootArray.length === 0 && partyValid) {
            showError('Add some loot before trying to split');
        } else if (lootArray.length > 0 && !partyValid) {
            showError('Party size needs to be at least 1');
        } else if (lootArray.length === 0 && !partyValid) {
            showError('Add some loot and set a valid party size');
        }
    }
}

function splitLoot() {
    clearErrors();

    if (!isPartySizeValid()) {
        showError('Party size must be at least 1');
        updateUI();
        return;
    }
    if (lootArray.length === 0) {
        showError('Nothing to split yet');
        updateUI();
        return;
    }

    updateUI();
    showError(`Split ${parseInt(partySizeInput.value)} ways!`);
}

function handlePartySizeChange() {
    const newPartySize = parseInt(partySizeInput.value);
    if (!isNaN(newPartySize) && newPartySize >= 1) {
        partySize = newPartySize;
        saveState();
    }
    updateUI();
}

// ========== PHASE 4: SERVER SYNC FUNCTIONS ==========

/**
 * Sends the current in-memory state to the server via POST.
 *
 * Architectural rules enforced:
 *   - Does NOT mutate lootArray or partySize.
 *   - Does NOT call updateUI() — sync is not a render event.
 *   - Does NOT write to localStorage — that is saveState()'s job.
 *   - Only responsibility: communicate state to the server and report result.
 *
 * Lifecycle: (none — this is a read-only outbound operation)
 */
function syncToServer() {
    // Build the required JSON payload exactly as specified
    const payload = {
        studentId: STUDENT_ID,
        state: {
            loot: lootArray,
            partySize: partySize
        }
    };

    console.log('Syncing to server — payload:', payload);
    showSyncStatus('Syncing to server...', 'loading');

    fetch(SERVER_BASE + '/save/' + STUDENT_ID, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(function(response) {
        // Treat non-200 responses as failures
        if (!response.ok) {
            console.error('Server returned non-200 status:', response.status);
            showSyncStatus('⚠️ Server error (HTTP ' + response.status + '). Sync failed.', 'error');
            return null;
        }
        return response.json();
    })
    .then(function(data) {
        if (data === null) { return; } // already handled above

        console.log('Server sync response:', data);

        // Only show success if the server explicitly confirms status: "saved"
        if (data.status === 'saved') {
            showSyncStatus('✓ Synced to server successfully! (ID: ' + data.studentId + ')', 'success');
        } else {
            showSyncStatus('⚠️ Server responded but did not confirm save. Check server.', 'error');
        }
    })
    .catch(function(error) {
        console.error('Sync to server failed:', error);
        showSyncStatus('⚠️ Could not reach the server. Check your connection.', 'error');
    });

    // IMPORTANT: syncToServer intentionally does not call updateUI() here.
    // Synchronization does not modify in-memory state and must not trigger a render cycle.
}

/**
 * Loads state from the server via GET.
 *
 * Lifecycle: Fetch -> Validate -> Assign -> Save (local) -> updateUI()
 *
 * Architectural rules enforced:
 *   - Returned data is never blindly assigned.
 *   - Each loot item is individually validated using the same rules as restoreState().
 *   - No partial writes: both lootArray and partySize are staged locally before any
 *     assignment occurs. If either fails validation, the existing in-memory state
 *     remains completely unchanged.
 *   - saveState() is called after assignment, before updateUI().
 *   - If the server returns status "empty", existing state is preserved.
 *   - Non-200 HTTP responses are treated as failures.
 */
function loadFromServer() {
    console.log('Requesting state from server for studentId:', STUDENT_ID);
    showSyncStatus('Loading from server...', 'loading');

    fetch(SERVER_BASE + '/load/' + STUDENT_ID)
    .then(function(response) {
        // Treat non-200 responses as failures per spec
        if (!response.ok) {
            console.error('Server returned non-200 status on load:', response.status);
            showSyncStatus('⚠️ Server error (HTTP ' + response.status + '). Load failed.', 'error');
            return null;
        }
        return response.json();
    })
    .then(function(data) {
        if (data === null) { return; } // already handled above

        console.log('Server load response:', data);

        // Handle empty case — no stored data for this studentId
        if (data.status === 'empty') {
            showSyncStatus('ℹ️ No saved state found on server for ' + STUDENT_ID + '.', 'error');
            return;
        }

        // We only proceed if status is explicitly "loaded"
        if (data.status !== 'loaded') {
            console.error('Unexpected server response status:', data.status);
            showSyncStatus('⚠️ Unexpected server response. Existing state preserved.', 'error');
            return;
        }

        // ===== VALIDATION PHASE =====
        // Validate the entire response before touching in-memory state.
        // If anything fails, we return early — lootArray and partySize are never modified.

        // 1. Top-level structure check
        if (typeof data !== 'object' || data === null) {
            console.error('Server response is not an object');
            showSyncStatus('⚠️ Invalid server response structure. Existing state preserved.', 'error');
            return;
        }

        // 2. studentId check — must match our identifier
        if (data.studentId !== STUDENT_ID) {
            console.error('studentId mismatch. Expected:', STUDENT_ID, 'Got:', data.studentId);
            showSyncStatus('⚠️ Student ID mismatch in server response. Load aborted.', 'error');
            return;
        }

        // 3. state object must exist
        if (!data.hasOwnProperty('state') || typeof data.state !== 'object' || data.state === null) {
            console.error('Server response missing valid state object');
            showSyncStatus('⚠️ Server response missing state object. Existing state preserved.', 'error');
            return;
        }

        // 4. loot must be an array
        if (!data.state.hasOwnProperty('loot') || !Array.isArray(data.state.loot)) {
            console.error('Server state.loot is not an array');
            showSyncStatus('⚠️ Server state has invalid loot data. Existing state preserved.', 'error');
            return;
        }

        // 5. partySize must be a valid number >= 1
        if (!data.state.hasOwnProperty('partySize')) {
            console.error('Server state missing partySize');
            showSyncStatus('⚠️ Server state missing partySize. Existing state preserved.', 'error');
            return;
        }
        const incomingPartySize = parseInt(data.state.partySize);
        if (isNaN(incomingPartySize) || incomingPartySize < 1) {
            console.error('Server state.partySize is invalid:', data.state.partySize);
            showSyncStatus('⚠️ Server state has invalid partySize. Existing state preserved.', 'error');
            return;
        }

        // 6. Validate each loot item individually
        // Stage into a temporary array — do not touch lootArray until all items pass
        const validatedLoot = [];
        for (let i = 0; i < data.state.loot.length; i++) {
            const item = data.state.loot[i];

            const hasValidName     = item.hasOwnProperty('name')     && typeof item.name     === 'string' && item.name.trim() !== '';
            const hasValidValue    = item.hasOwnProperty('value')    && typeof item.value    === 'number' && !isNaN(item.value)    && item.value    >= 0;
            const hasValidQuantity = item.hasOwnProperty('quantity') && typeof item.quantity === 'number' && !isNaN(item.quantity) && item.quantity >= 1;

            if (hasValidName && hasValidValue && hasValidQuantity) {
                validatedLoot.push({
                    name:     item.name.trim(),
                    value:    item.value,
                    quantity: item.quantity
                });
                console.log('Validated server loot item:', item.name);
            } else {
                // A single invalid item aborts the entire load to prevent partial state
                console.error('Invalid loot item in server response — load aborted:', item);
                showSyncStatus('⚠️ Server state contains an invalid loot item. Existing state preserved.', 'error');
                return;
            }
        }

        // ===== ALL VALIDATION PASSED =====
        // Only now do we assign to in-memory state variables.
        // This is the single assignment point — no partial writes can occur above.
        lootArray = validatedLoot;
        partySize = incomingPartySize;

        // Update the party size input to reflect loaded value
        partySizeInput.value = partySize;

        console.log('State loaded from server and assigned:', { loot: lootArray, partySize: partySize });

        // Lifecycle: Fetch -> Validate -> Assign -> Save (local) -> updateUI()
        saveState();
        updateUI();

        showSyncStatus('✓ State loaded from server successfully! (' + lootArray.length + ' item' + (lootArray.length !== 1 ? 's' : '') + ' restored)', 'success');
    })
    .catch(function(error) {
        console.error('Load from server failed:', error);
        showSyncStatus('⚠️ Could not reach the server. Existing state preserved.', 'error');
    });
}

// ========== EVENT LISTENERS ==========

addLootBtn.addEventListener('click', addLoot);
splitLootBtn.addEventListener('click', splitLoot);
resetAllBtn.addEventListener('click', resetAll);
partySizeInput.addEventListener('input', handlePartySizeChange);

// Phase 4 event listeners
syncToServerBtn.addEventListener('click', syncToServer);
loadFromServerBtn.addEventListener('click', loadFromServer);

// Enter key support
lootNameInput.addEventListener('keypress',     function(e) { if (e.key === 'Enter') { addLoot(); } });
lootValueInput.addEventListener('keypress',    function(e) { if (e.key === 'Enter') { addLoot(); } });
lootQuantityInput.addEventListener('keypress', function(e) { if (e.key === 'Enter') { addLoot(); } });

// ========== STARTUP ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded — restoring local state before render');

    // Lifecycle: Page Load -> Restore (local) -> updateUI()
    restoreState();
    partySizeInput.value = partySize;
    updateUI();

    console.log('Ready. Current state:', { loot: lootArray, partySize: partySize });
});

console.log('Dungeon Loot Splitter Phase 4 loaded — now with server sync!');
