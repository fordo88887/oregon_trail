document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const MAX_PARTY_SIZE = 4;
    const NUM_DRAFTEES_TO_GENERATE = 3;
    const STARTING_MONEY = 800.00;
    const BASE_HEALTH = 100;
    const BASE_ENERGY = 100;
    const BASE_HYGIENE = 100;
    const MAX_POSITIVE_TRAITS = 2;
    const MAX_NEGATIVE_TRAITS = 2;
    const FOOD_PER_PERSON_PER_DAY = 1;
    const MILES_PER_DAY_NORMAL = 15;
    const ENERGY_COST_PER_TRAVEL_DAY = 10;
    const HYGIENE_LOSS_PER_DAY = 7; // Increased slightly
    const ENERGY_RECOVERY_PER_REST_DAY = 25;
    const HEALTH_RECOVERY_PER_REST_DAY = 8;

    // --- DATA POOLS ---
    const MALE_FIRST_NAMES = ["John", "William", "James", "Robert", "Michael", "David", "Richard", "Joseph", "Thomas", "Charles", "Daniel", "Matthew"];
    const FEMALE_FIRST_NAMES = ["Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Susan", "Jessica", "Sarah", "Karen", "Nancy", "Emily", "Margaret"];
    const LAST_NAMES = ["Smith", "Jones", "Miller", "Davis", "Garcia", "Wilson", "Martinez", "Anderson", "Taylor", "Thomas", "Brown", "Lee", "Walker", "Hall", "Allen", "Young"];
    const OCCUPATIONS = [
        { name: "Farmer", skill: "Farming", description: "Resilient and good with animals.", passiveEffect: "farming_bonus" }, // Better chance with oxen, small food bonus on rest
        { name: "Doctor", skill: "Medicine", description: "Can treat illnesses more effectively.", passiveEffect: "medical_bonus" }, // Better medicine use, slower sickness progression for party
        { name: "Carpenter", skill: "Repair", description: "Reduces wagon damage chance.", passiveEffect: "repair_bonus" }, // Wagon takes less damage
        { name: "Blacksmith", skill: "Crafting", description: "Can repair tools and wagon parts better at forts.", passiveEffect: "crafting_bonus" }, // Cheaper repairs at forts
        { name: "Teacher", skill: "Negotiation", description: "May get slightly better trade deals.", passiveEffect: "negotiation_bonus_occupation" }, // Similar to thrifty
        { name: "Banker", skill: "Finance", description: "Starts with more party money.", effect: (gameState) => { gameState.partyMoney += 150; } }, // Applied once per banker in party
        { name: "Hunter", skill: "Hunting", description: "Excellent at acquiring game.", passiveEffect: "hunting_bonus_occupation" },
        { name: "Merchant", skill: "Trading", description: "Gets better prices for goods (stack with Thrifty).", passiveEffect: "trade_bonus_occupation" },
        { name: "Tailor", skill: "Sewing", description: "Clothing lasts longer, minor protection.", passiveEffect: "sewing_bonus" } // Clothing degrades slower
    ];
    const GENDERS = ["Male", "Female"];
    const GAME_SUPPLIES = [
        { id: 'food', name: 'Food', price: 0.20, unit: 'lb', description: "Keeps your party fed." },
        { id: 'clothing', name: 'Clothing', price: 10.00, unit: 'set', description: "Protection against harsh weather." },
        { id: 'ammo', name: 'Ammunition', price: 2.00, unit: 'box (20 bullets)', description: "For hunting and defense." },
        { id: 'oxen', name: 'Oxen', price: 40.00, unit: 'yoke (2 oxen)', description: "Needed to pull the wagon." },
        { id: 'wheels', name: 'Wagon Wheels', price: 10.00, unit: 'wheel', description: "Spares for rough terrain." },
        { id: 'axles', name: 'Wagon Axles', price: 10.00, unit: 'axle', description: "Spares for potential breaks." },
        { id: 'medicine', name: 'Medicine Kits', price: 5.00, unit: 'kit', description: "Helps treat illness and injury." }
    ];
    const POSITIVE_TRAITS = [
        { id: "optimist", name: "Optimist", description: "Slightly higher base energy (+5). Less prone to morale loss.", effect: (person) => person.energy = Math.min(BASE_ENERGY + 5, person.energy + 5) },
        { id: "strong_stomach", name: "Strong Stomach", description: "30% less likely to get Dysentery from bad food/water.", passiveEffect: "disease_resistance_food" },
        { id: "eagle_eye", name: "Eagle Eye", description: "+15% hunting success. Small chance to find extra small items.", passiveEffect: "hunting_bonus_trait" },
        { id: "thrifty", name: "Thrifty", description: "Gets 5% better trade deals (stacks with Merchant).", passiveEffect: "trade_bonus_trait" },
        { id: "fast_healer", name: "Fast Healer", description: "+2 health on rest. Sickness duration reduced by 1 day (min 1).", passiveEffect: "healing_bonus" },
        { id: "tough", name: "Tough", description: "+10 max health. 10% damage reduction from physical events.", effect: (person) => { person.maxHealth = (person.maxHealth || BASE_HEALTH) + 10; person.health += 10; }, passiveEffect: "damage_reduction_physical" },
        { id: "resourceful", name: "Resourceful", description: "10% higher chance to find beneficial items during events.", passiveEffect: "find_items_bonus" },
        { id: "inspiring", name: "Inspiring", description: "Reduces party energy drain by 5% when present and healthy.", passiveEffect: "party_energy_save" },
        { id: "night_owl", name: "Night Owl", description: "Reduces chance of negative night events by 15%.", passiveEffect: "watch_duty_bonus" },
        { id: "animal_whisperer", name: "Animal Whisperer", description: "Oxen health degrades 10% slower. Small chance for oxen to avoid sickness.", passiveEffect: "oxen_care_bonus" }
    ];
    const NEGATIVE_TRAITS = [
        { id: "pessimist", name: "Pessimist", description: "Slightly lower base energy (-5). More prone to morale loss.", effect: (person) => person.energy -= 5 },
        { id: "weak_stomach", name: "Weak Stomach", description: "30% more likely to get Dysentery from bad food/water.", passiveEffect: "disease_vulnerability_food" },
        { id: "clumsy", name: "Clumsy", description: "5% chance per day to cause minor supply loss (1-2 food/ammo).", passiveEffect: "accident_prone" },
        { id: "spendthrift", name: "Spendthrift", description: "Gets 5% worse trade deals.", passiveEffect: "trade_penalty_trait" },
        { id: "slow_healer", name: "Slow Healer", description: "-2 health on rest. Sickness duration increased by 1 day.", passiveEffect: "healing_penalty" },
        { id: "frail", name: "Frail", description: "-10 max health. 10% increased damage from physical events.", effect: (person) => { person.maxHealth = (person.maxHealth || BASE_HEALTH) - 10; person.health -= 10; }, passiveEffect: "damage_vulnerability_physical" },
        { id: "wasteful", name: "Wasteful", description: "Consumes +0.2 lbs food per day.", passiveEffect: "food_consumption_increase" },
        { id: "grumpy", name: "Grumpy", description: "Increases party energy drain by 5% when present.", passiveEffect: "party_energy_drain" },
        { id: "heavy_sleeper", name: "Heavy Sleeper", description: "Increases chance of negative night events by 15%.", passiveEffect: "watch_duty_penalty" },
        { id: "allergies", name: "Allergies", description: "Hygiene drops 10% faster. Small chance for minor discomfort events.", effect: (person) => {person.hygieneRateModifier = (person.hygieneRateModifier || 1) * 1.1;}, passiveEffect: "allergy_prone" }
    ];
    const DISEASES = { /* ... same as before ... */ };
    const TRAIL_MAP = [ /* ... same as before (ensure services are there) ... */ ];
    const SHOP_INVENTORIES = { /* ... same as before ... */ };
    const RANDOM_EVENTS_POOL = [ /* ... same as before, can be expanded ... */ ];


    // --- GAME STATE ---
    let gamePhase = "setup";
    let availableDraftees = [];
    let party = [];
    let nextPersonId = 0;
    let partyMoney = STARTING_MONEY;
    let partyInventory = {};
    let currentDate = new Date(1848, 3, 1);
    let currentLocationIndex = 0;
    let distanceTraveledOnLeg = 0;
    let complaintCooldown = 0;
    let selectedCharacterId = null;
    let activeEvent = null;
    let bankerBonusAppliedCount = 0; // Track how many bankers have given bonus

    // --- DOM ELEMENTS ---
    // Header
    const currentDateHeaderEl = document.getElementById('current-date-header');
    const partyMoneyHeaderEl = document.getElementById('party-money-header');
    const partyMoneySetupDisplayEl = document.getElementById('party-money-setup-display'); // For setup tab
    const currentLocationHeaderEl = document.getElementById('current-location-header');
    // Left Panel
    const partyRosterCondensedEl = document.getElementById('party-roster-condensed');
    const characterDetailViewEl = document.getElementById('character-detail-view');
    // Tabs
    const tabsContainerEl = document.getElementById('tabs');
    const tabButtonSetupEl = document.getElementById('setup-tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    // Setup Tab
    const maxPartySizeDisplayEl = document.getElementById('max-party-size-display');
    const generateDrafteesButtonEl = document.getElementById('generate-draftees-button');
    const drafteePoolEl = document.getElementById('draftee-pool');
    const initialSupplyStoreEl = document.getElementById('initial-supply-store');
    const startJourneyButtonEl = document.getElementById('start-journey-button');
    // Status Tab
    const nextLandmarkNameEl = document.getElementById('next-landmark-name');
    const distanceToNextEl = document.getElementById('distance-to-next');
    const travelDayButtonEl = document.getElementById('travel-day-button');
    const restDayButtonEl = document.getElementById('rest-day-button');
    const landmarkSpecificActionsEl = document.getElementById('landmark-specific-actions');
    const visitStoreButtonEl = document.getElementById('visit-store-button');
    const eventChoicesAreaEl = document.getElementById('event-choices-area');
    const gameLogEl = document.getElementById('game-log');
    // Inventory Tab
    const partyInventoryDetailedEl = document.getElementById('party-inventory-detailed');
    // Map Tab
    const mapLandmarkListEl = document.getElementById('map-landmark-list');
    // Modal
    const modalOverlayEl = document.getElementById('modal-overlay');
    const modalCloseButtonEl = document.getElementById('modal-close-button');
    const modalTitleEl = document.getElementById('modal-title');
    const modalBodyEl = document.getElementById('modal-body');

    // --- HELPER FUNCTIONS ---
    function getRandomElement(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function shuffleArray(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[array[i], array[j]] = [array[j], array[i]]; } return array; }
    function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

    function addLogEntry(message, type = "info", isSetupLog = false) {
        // For now, all logs go to the main game log. Could differentiate later.
        const logEntry = document.createElement('p');
        const timestamp = gamePhase !== "setup" ? `[${currentDate.toLocaleDateString()}] ` : '[Setup] ';
        logEntry.textContent = `${timestamp}${message}`;
        logEntry.classList.add(type);
        if (gameLogEl.firstChild) {
            gameLogEl.insertBefore(logEntry, gameLogEl.firstChild);
        } else {
            gameLogEl.appendChild(logEntry);
        }
        if (gameLogEl.children.length > 70) { gameLogEl.removeChild(gameLogEl.lastChild); }
    }

    // --- UI MANAGEMENT ---
    function switchTab(tabId) {
        tabPanes.forEach(pane => pane.classList.remove('active'));
        const targetPane = document.getElementById(`tab-${tabId}`);
        if (targetPane) targetPane.classList.add('active');

        tabsContainerEl.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        if (gamePhase !== "setup" && tabId === "setup") { // Don't allow going back to setup tab after journey starts
             tabButtonSetupEl.classList.add('hidden');
             if (targetPane && targetPane.classList.contains('active')) { // If somehow setup tab was made active, switch to status
                switchTab('status');
             }
        } else if (tabId === "setup") {
            tabButtonSetupEl.classList.remove('hidden');
        }
    }

    function updateHeaderStatus() {
        currentDateHeaderEl.textContent = gamePhase === "setup" ? "Pre-Journey" : currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        partyMoneyHeaderEl.textContent = partyMoney.toFixed(2);
        partyMoneySetupDisplayEl.textContent = partyMoney.toFixed(2); // Keep setup tab money updated
        currentLocationHeaderEl.textContent = TRAIL_MAP[currentLocationIndex].name;
    }

    function formatTraitsList(traits, listClass) {
        if (!traits || traits.length === 0) return '<p style="font-size:0.8em; margin-left:5px;">None</p>';
        let listHtml = `<ul class="${listClass}">`;
        traits.forEach(trait => {
            listHtml += `<li title="${trait.description}">${trait.name}</li>`;
        });
        listHtml += `</ul>`;
        return listHtml;
    }

    function renderPartyRosterCondensed() {
        partyRosterCondensedEl.innerHTML = '';
        if (party.length === 0 && gamePhase === "setup") {
            partyRosterCondensedEl.innerHTML = "<p>Draft your party!</p>";
            return;
        }
        if (party.length === 0) {
             partyRosterCondensedEl.innerHTML = "<p>No one is in your party.</p>";
            return;
        }

        party.forEach(member => {
            const memberDiv = document.createElement('div');
            memberDiv.classList.add('party-member-summary');
            memberDiv.dataset.memberId = member.id;
            if (member.id === selectedCharacterId) memberDiv.classList.add('selected');

            let statusText = member.isAlive ? "Okay" : "Deceased";
            if (member.isAlive && member.sickness) statusText = member.sickness.name;
            else if (member.isAlive && member.health < 30) statusText = "Critical";
            else if (member.isAlive && member.energy < 20) statusText = "Exhausted";

            memberDiv.innerHTML = `
                <p class="name">${member.name} <span style="font-size:0.8em; color:#555;">(${member.occupation})</span></p>
                <p style="font-size:0.85em;">Status: ${statusText}</p>
                ${member.isAlive ? `
                    <div class="status-bar" title="Health: ${member.health}%"><div class="health-fill" style="width: ${member.health}%"></div></div>
                    <div class="status-bar" title="Energy: ${member.energy}%"><div class="energy-fill" style="width: ${member.energy}%"></div></div>
                    <div class="status-bar" title="Hygiene: ${member.hygiene}%"><div class="hygiene-fill" style="width: ${member.hygiene}%"></div></div>
                ` : ''}
            `;
            memberDiv.addEventListener('click', () => {
                selectedCharacterId = member.id;
                renderPartyRosterCondensed();
                renderCharacterDetailView();
            });
            partyRosterCondensedEl.appendChild(memberDiv);
        });
    }

    function renderCharacterDetailView() {
        if (party.length > 0 && selectedCharacterId === null) selectedCharacterId = party[0].id;

        const member = party.find(p => p.id === selectedCharacterId);
        if (!member) {
            characterDetailViewEl.innerHTML = "<p>No character selected or party is empty.</p>";
            return;
        }

        characterDetailViewEl.innerHTML = `
            <h4>${member.name}</h4>
            <p><strong>Occupation:</strong> ${member.occupation}</p>
            <p><strong>Gender:</strong> ${member.gender}</p>
            <p><strong>Status:</strong> ${member.isAlive ? (member.sickness ? member.sickness.name : (member.health < 30 ? "Critical" : (member.energy < 20 ? "Exhausted" : "Okay"))) : "Deceased"}</p>
            ${member.isAlive ? `
                <p><strong>Health:</strong> ${member.health} / ${member.maxHealth || BASE_HEALTH}</p>
                <p><strong>Energy:</strong> ${member.energy}%</p>
                <p><strong>Hygiene:</strong> ${member.hygiene}%</p>
                <p><strong>Bowel Need:</strong> ${member.bowelUrgency}%</p>
                <p><strong>Bladder Need:</strong> ${member.bladderUrgency}%</p>
            ` : ''}
            <h5>Positive Traits:</h5>
            ${formatTraitsList(member.positiveTraits, 'traits-list')}
            <h5>Negative Traits:</h5>
            ${formatTraitsList(member.negativeTraits, 'debuffs-list')}
            ${gamePhase === "setup" ? `<button class="remove-from-party-setup" data-id="${member.id}">Remove</button>` : ''}
        `;

        if (gamePhase === "setup") {
            const removeBtn = characterDetailViewEl.querySelector('.remove-from-party-setup');
            if (removeBtn) removeBtn.addEventListener('click', handleRemoveFromPartySetup);
        }
    }

    // --- CHARACTER GENERATION & TRAITS ---
    function generateRandomPerson() {
        const gender = getRandomElement(GENDERS);
        const firstName = gender === "Male" ? getRandomElement(MALE_FIRST_NAMES) : getRandomElement(FEMALE_FIRST_NAMES);
        const lastName = getRandomElement(LAST_NAMES);
        const occupationData = getRandomElement(OCCUPATIONS);

        let person = {
            id: nextPersonId++,
            name: `${firstName} ${lastName}`,
            gender: gender,
            occupation: occupationData.name,
            occupationData: occupationData, // Store full occupation data
            maxHealth: BASE_HEALTH, health: BASE_HEALTH,
            energy: BASE_ENERGY, hygiene: BASE_HYGIENE,
            bowelUrgency: 0, bladderUrgency: 0,
            positiveTraits: [], negativeTraits: [],
            isAlive: true, sickness: null,
            hygieneRateModifier: 1.0, // For allergies etc.
            foodConsumptionModifier: 0 // Additive to base food per day
        };

        // Apply initial trait effects that modify base stats
        let availablePositiveTraits = shuffleArray([...POSITIVE_TRAITS]);
        const numPositive = Math.floor(Math.random() * (MAX_POSITIVE_TRAITS + 1));
        for (let i = 0; i < numPositive && i < availablePositiveTraits.length; i++) {
            person.positiveTraits.push(availablePositiveTraits[i]);
            if (availablePositiveTraits[i].effect) availablePositiveTraits[i].effect(person);
        }

        let availableNegativeTraits = shuffleArray([...NEGATIVE_TRAITS]);
        const numNegative = Math.floor(Math.random() * (MAX_NEGATIVE_TRAITS + 1));
        for (let i = 0; i < numNegative && i < availableNegativeTraits.length; i++) {
            person.negativeTraits.push(availableNegativeTraits[i]);
            if (availableNegativeTraits[i].effect) availableNegativeTraits[i].effect(person);
        }
        // Ensure health is within bounds of potentially modified maxHealth
        person.health = Math.max(10, Math.min(person.maxHealth, person.health));
        person.energy = Math.max(0, Math.min(BASE_ENERGY + 10, person.energy)); // Cap energy slightly above base

        // Apply passive food consumption modifiers from traits
        if (person.negativeTraits.some(t => t.passiveEffect === "food_consumption_increase")) {
            person.foodConsumptionModifier += 0.2; // Example: wasteful trait
        }

        return person;
    }

    // --- SETUP PHASE ---
    function renderDraftees() {
        drafteePoolEl.innerHTML = '';
        availableDraftees.forEach(person => {
            const card = document.createElement('div');
            card.classList.add('character-card');
            card.innerHTML = `
                <p class="name">${person.name}</p>
                <p>Occupation: ${person.occupation}</p>
                <p>Health: ${person.health}% (Max: ${person.maxHealth}%) | Energy: ${person.energy}%</p>
                ${formatTraitsList(person.positiveTraits, 'traits-list')}
                ${formatTraitsList(person.negativeTraits, 'debuffs-list')}
                <button class="draft-button" data-id="${person.id}">Draft into Party</button>
            `;
            card.querySelector('.draft-button').addEventListener('click', handleDraftPerson);
            drafteePoolEl.appendChild(card);
        });
    }

    function renderInitialSupplies() {
        const setupSuppliesConfig = GAME_SUPPLIES.reduce((acc, s) => {
            acc[s.id] = { priceMultiplier: 1.0, stock: (s.id === 'oxen' ? 10 : Infinity) };
            return acc;
        }, {});
        renderSuppliesStoreUI(initialSupplyStoreEl, setupSuppliesConfig, false, 'setup');
    }

    function handleDraftPerson(event) {
        if (party.length >= MAX_PARTY_SIZE) {
            openModal("Party Full", "<p>Your party is full. Remove a member to draft another.</p>");
            return;
        }
        const personId = parseInt(event.target.dataset.id);
        const selectedPerson = availableDraftees.find(p => p.id === personId);
        if (selectedPerson) {
            party.push(selectedPerson);
            availableDraftees = availableDraftees.filter(p => p.id !== personId);

            if (selectedPerson.occupationData.effect) { // Apply one-time occupation effects like Banker
                 const gameStateForEffect = { partyMoney, party }; // Pass necessary state
                 selectedPerson.occupationData.effect(gameStateForEffect);
                 partyMoney = gameStateForEffect.partyMoney; // Update global partyMoney
                 addLogEntry(`${selectedPerson.name} (${selectedPerson.occupation}) used their skill, affecting party funds.`, "event_positive", true);
            }


            if (!selectedCharacterId && party.length === 1) selectedCharacterId = selectedPerson.id;
            updateSetupScreen();
        }
    }

    function handleRemoveFromPartySetup(event) {
        const personId = parseInt(event.target.dataset.id);
        const removedPersonIndex = party.findIndex(p => p.id === personId);
        if (removedPersonIndex > -1) {
            const [removedPerson] = party.splice(removedPersonIndex, 1);
            availableDraftees.push(removedPerson);

            // Reverse Banker effect if needed (this is a simple implementation)
            if (removedPerson.occupation === "Banker") {
                partyMoney -= 150 * bankerBonusAppliedCount; // Assuming each banker adds 150
                bankerBonusAppliedCount = Math.max(0, bankerBonusAppliedCount -1);
                addLogEntry(`Banker ${removedPerson.name} removed, funds adjusted.`, "event", true);
            }


            if (selectedCharacterId === personId) {
                selectedCharacterId = party.length > 0 ? party[0].id : null;
            }
            updateSetupScreen();
        }
    }

    function updateStartJourneyButtonState() {
        startJourneyButtonEl.disabled = party.length === 0;
    }

    function updateSetupScreen() {
        renderDraftees();
        renderPartyRosterCondensed();
        renderCharacterDetailView();
        updateHeaderStatus(); // To update money shown in header and setup tab
        updateStartJourneyButtonState();
    }

    // --- SUPPLY STORE (Generic) ---
    function getAdjustedPrice(basePrice, itemId, isFortStore) {
        let priceMultiplier = 1.0;

        // Apply occupation and trait bonuses/penalties
        let bestTradeBonus = 0; // e.g., -0.05 for 5% discount
        let worstTradePenalty = 0; // e.g., +0.05 for 5% markup

        party.forEach(p => {
            if (p.isAlive) {
                if (p.occupationData.passiveEffect === "negotiation_bonus_occupation" || p.occupationData.passiveEffect === "trade_bonus_occupation") {
                    bestTradeBonus = Math.min(bestTradeBonus, -0.05); // 5% discount from occupation
                }
                p.positiveTraits.forEach(trait => {
                    if (trait.passiveEffect === "trade_bonus_trait") bestTradeBonus = Math.min(bestTradeBonus, -0.05); // Thrifty
                });
                p.negativeTraits.forEach(trait => {
                    if (trait.passiveEffect === "trade_penalty_trait") worstTradePenalty = Math.max(worstTradePenalty, 0.05); // Spendthrift
                });
            }
        });
        priceMultiplier += (bestTradeBonus + worstTradePenalty); // They can offset

        // Apply fort-specific price multiplier if it's a fort store
        if (isFortStore) {
            const currentLoc = TRAIL_MAP[currentLocationIndex];
            const shopType = currentLoc.services?.find(s => s.startsWith("shop_"));
            if (shopType && SHOP_INVENTORIES[shopType] && SHOP_INVENTORIES[shopType][itemId]) {
                priceMultiplier *= SHOP_INVENTORIES[shopType][itemId].priceMultiplier;
            }
        }
        return basePrice * Math.max(0.5, priceMultiplier); // Ensure price doesn't go too low
    }


    function renderSuppliesStoreUI(storeElement, suppliesConfig, isFortStore, context) {
        storeElement.innerHTML = '';
        const itemsAvailable = Object.keys(suppliesConfig);
        if (itemsAvailable.length === 0) {
            storeElement.innerHTML = "<p>No supplies available here.</p>";
            return;
        }

        GAME_SUPPLIES.forEach(item => {
            if (!suppliesConfig[item.id] || suppliesConfig[item.id].stock === 0) return; // Not sold or out of stock

            const config = suppliesConfig[item.id];
            const adjustedPrice = getAdjustedPrice(item.price, item.id, isFortStore);
            const stockInfo = config.stock === Infinity ? "" : `(Stock: ${config.stock})`;
            const inputIdSuffix = context === 'setup' ? '-setup' : (isFortStore ? '-fort' : '');

            const itemEl = document.createElement('div');
            itemEl.classList.add('supply-item'); // Ensure CSS targets this
            itemEl.innerHTML = `
                <div class="supply-info">
                    <span class="name">${item.name}</span>
                    <span class="price">($${adjustedPrice.toFixed(2)} per ${item.unit}) ${stockInfo}</span>
                    <p class="description"><em>${item.description}</em></p>
                </div>
                <div class="supply-actions">
                    <label for="qty-${item.id}${inputIdSuffix}">Qty:</label>
                    <input type="number" id="qty-${item.id}${inputIdSuffix}" name="qty-${item.id}" min="0" value="0"
                           data-base-price="${item.price}" data-item-id="${item.id}" data-stock="${config.stock}"
                           ${config.stock !== Infinity ? `max="${config.stock}"` : ''}>
                    <button class="buy-supply-button" data-item-id="${item.id}"
                            data-is-fort-store="${isFortStore}" data-context="${context}">Buy</button>
                </div>
            `;
            storeElement.appendChild(itemEl);
        });
        addBuySupplyButtonListeners(isFortStore, context);
    }

    function addBuySupplyButtonListeners(isFortStore, context) {
        const selector = `.buy-supply-button[data-is-fort-store="${isFortStore}"][data-context="${context}"]`;
        document.querySelectorAll(selector).forEach(button => {
            // Clone and replace to remove old listeners if this function is called multiple times on same elements
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);

            newButton.addEventListener('click', (event) => {
                const itemId = event.target.dataset.itemId;
                const inputIdSuffix = context === 'setup' ? '-setup' : (isFortStore ? '-fort' : '');
                const quantityInputEl = document.getElementById(`qty-${itemId}${inputIdSuffix}`);
                let quantity = parseInt(quantityInputEl.value);
                const baseItemPrice = parseFloat(quantityInputEl.dataset.basePrice); // Base price from data attribute
                const stock = parseInt(quantityInputEl.dataset.stock);

                if (isNaN(quantity) || quantity <= 0) {
                    if (context === 'fort') modalBodyEl.querySelector('#fort-store-message').textContent = "Enter a positive quantity.";
                    else alert("Please enter a positive quantity.");
                    quantityInputEl.value = "0";
                    return;
                }
                if (stock !== Infinity && quantity > stock) {
                    if (context === 'fort') modalBodyEl.querySelector('#fort-store-message').textContent = `Only ${stock} available.`;
                    else alert(`Only ${stock} ${itemId} available.`);
                    quantityInputEl.value = stock; // Adjust to max available
                    quantity = stock;
                    if (quantity <= 0) return;
                }
                if (context === 'setup' && itemId === 'oxen' && (partyInventory.oxen || 0) + quantity > 10) {
                    alert("You can only have a maximum of 10 yokes of oxen for your initial setup.");
                    quantityInputEl.value = "0";
                    return;
                }

                const finalPricePerUnit = getAdjustedPrice(baseItemPrice, itemId, isFortStore); // Recalculate with traits
                const totalCost = quantity * finalPricePerUnit;

                if (partyMoney >= totalCost) {
                    partyMoney -= totalCost;
                    partyInventory[itemId] = (partyInventory[itemId] || 0) + quantity;

                    if (isFortStore && stock !== Infinity) {
                        const currentLoc = TRAIL_MAP[currentLocationIndex];
                        const shopType = currentLoc.services.find(s => s.startsWith("shop_"));
                        SHOP_INVENTORIES[shopType][itemId].stock -= quantity; // Reduce stock
                        renderSuppliesStoreUI(modalBodyEl, SHOP_INVENTORIES[shopType], true, 'fort'); // Re-render modal store
                         const messageEl = modalBodyEl.querySelector('#fort-store-message');
                         if (messageEl) messageEl.textContent = `Bought ${quantity} ${GAME_SUPPLIES.find(s=>s.id === itemId).name}.`;
                    }

                    updateHeaderStatus();
                    if (context === 'setup') renderPartyInventoryDetailed(); // Update main inventory display if setup
                    quantityInputEl.value = "0";
                } else {
                    if (context === 'fort') modalBodyEl.querySelector('#fort-store-message').textContent = "Not enough money!";
                    else alert("Not enough money!");
                }
            });
        });
    }

    // --- JOURNEY MANAGEMENT ---
    function embarkJourney() {
        if (party.length === 0) { openModal("Cannot Start", "<p>You need at least one party member!</p>"); return; }
        if (!partyInventory.oxen || partyInventory.oxen === 0) { openModal("Cannot Start", "<p>You need oxen to pull the wagon!</p>"); return; }
        if (!partyInventory.food || partyInventory.food < (party.length * 7) ) { // Check for at least a week of food
            if (!confirm("You have very little food. Are you sure you want to start?")) return;
        }
        // Finalize one-time banker bonuses
        let finalBankerBonus = 0;
        party.forEach(p => {
            if (p.occupation === "Banker" && !p.globalBonusApplied) {
                 finalBankerBonus += 150; // Assuming occupation effect already added to partyMoney during draft
                 p.globalBonusApplied = true; // Mark so it's not re-applied if re-drafted (though not typical)
            }
        });
        // partyMoney += finalBankerBonus; // This was the old way, now occupation.effect handles it


        gamePhase = "traveling";
        tabButtonSetupEl.classList.add('hidden');
        switchTab('status');
        addLogEntry(`The journey begins from ${TRAIL_MAP[currentLocationIndex].name}!`, "event_title");
        updateMainUI();
    }

    function updateCharacterStatsForDay(isResting = false) {
        party.forEach(member => {
            if (!member.isAlive) return;

            let energyChange = 0;
            let hygieneChange = 0;
            let healthChange = 0;

            if (isResting) {
                energyChange = ENERGY_RECOVERY_PER_REST_DAY;
                healthChange = HEALTH_RECOVERY_PER_REST_DAY;
                // Apply Fast Healer bonus
                if (member.positiveTraits.some(t => t.passiveEffect === "healing_bonus")) healthChange += 2;
                if (member.negativeTraits.some(t => t.passiveEffect === "healing_penalty")) healthChange -= 2;

                // Resting can improve hygiene if near water (not explicitly modeled yet, simple small bonus)
                hygieneChange = 5;
                member.bowelUrgency = Math.max(0, member.bowelUrgency - getRandomInt(40, 70));
                member.bladderUrgency = Math.max(0, member.bladderUrgency - getRandomInt(50, 80));

            } else { // Traveling day
                energyChange = -ENERGY_COST_PER_TRAVEL_DAY;
                // Apply Inspiring/Grumpy party energy modifiers
                if (party.some(p => p.isAlive && p.positiveTraits.some(t => t.passiveEffect === "party_energy_save"))) energyChange *= 0.95;
                if (party.some(p => p.isAlive && p.negativeTraits.some(t => t.passiveEffect === "party_energy_drain"))) energyChange *= 1.05;

                hygieneChange = -HYGIENE_LOSS_PER_DAY * member.hygieneRateModifier; // Apply allergy modifier

                // Natural urgency increase
                member.bowelUrgency = Math.min(100, member.bowelUrgency + getRandomInt(5, 10));
                member.bladderUrgency = Math.min(100, member.bladderUrgency + getRandomInt(8, 15));
            }

            member.energy = Math.max(0, Math.min(BASE_ENERGY + 10, member.energy + energyChange)); // Cap energy
            member.hygiene = Math.max(0, Math.min(BASE_HYGIENE, member.hygiene + hygieneChange));

            // Health effects from low stats
            if (member.energy === 0) healthChange -= 5; // Exhaustion
            if (member.hygiene < 15 && Math.random() < (0.05 * (member.negativeTraits.some(t => t.passiveEffect === "disease_vulnerability_food") ? 1.3 : 1) / (member.positiveTraits.some(t => t.passiveEffect === "disease_resistance_food") ? 1.3 : 1) ) ) {
                if (!member.sickness) { applyDisease(member, "Dysentery"); } // More likely Dysentery
            }

            // Starvation
            if ((partyInventory.food || 0) === 0) {
                healthChange -= 10; // Starvation penalty
            }
            member.health = Math.max(0, Math.min(member.maxHealth, member.health + healthChange));


            // Sickness Progression
            if (member.sickness) {
                member.sickness.daysSick++;
                member.sickness.definition.dailyEffects(member); // Apply daily disease effects (includes health loss, urgency)

                let actualDuration = member.sickness.duration;
                if (member.positiveTraits.some(t => t.passiveEffect === "healing_bonus")) actualDuration = Math.max(1, actualDuration -1);
                if (member.negativeTraits.some(t => t.passiveEffect === "healing_penalty")) actualDuration +=1;
                 // Doctor in party bonus for sickness
                if (party.some(p => p.isAlive && p.occupationData.passiveEffect === "medical_bonus")) {
                     // e.g., slightly reduce health impact of sickness or increase recovery chance
                     member.health = Math.min(member.maxHealth, member.health + 1); // Tiny bonus from doctor
                }


                if (member.sickness.daysSick >= actualDuration && member.isAlive) {
                    addLogEntry(`${member.name} has recovered from ${member.sickness.name}.`, "event_positive");
                    member.sickness = null;
                }
            }
             if (member.health === 0 && member.isAlive) { // Check for death after all health changes
                member.isAlive = false;
                addLogEntry(`${member.name} has died. (${member.sickness ? member.sickness.name : (partyInventory.food === 0 ? 'Starvation' : 'Poor Health')})`, "death");
            }
        });
    }

    function consumeResources() {
        let totalFoodConsumedToday = 0;
        party.forEach(member => {
            if (member.isAlive) {
                totalFoodConsumedToday += (FOOD_PER_PERSON_PER_DAY + member.foodConsumptionModifier);
            }
        });

        if ((partyInventory.food || 0) > 0) {
            if (partyInventory.food >= totalFoodConsumedToday) {
                partyInventory.food -= totalFoodConsumedToday;
            } else {
                partyInventory.food = 0;
                addLogEntry("You ate the last of your food rations!", "warning");
            }
        } else {
            // Starvation effects handled in updateCharacterStatsForDay
        }
        // Oxen food consumption (simplified)
        if (partyInventory.oxen > 0 && (partyInventory.food || 0) > 0) { // Oxen also need some food if you have it
            let oxenFoodPortion = Math.min(partyInventory.food, partyInventory.oxen * 0.5); // Simplified
             if (party.some(p => p.isAlive && p.occupationData.passiveEffect === "farming_bonus" || p.positiveTraits.some(t=>t.passiveEffect === "animal_whisperer"))) {
                oxenFoodPortion *= 0.9; // Farmer/Animal Whisperer makes oxen food go further
            }
            partyInventory.food = Math.max(0, partyInventory.food - oxenFoodPortion);
        }
    }

    function advanceDay(isResting = false) {
        if (gamePhase === "game_over") return;
        currentDate.setDate(currentDate.getDate() + 1);
        consumeResources();
        updateCharacterStatsForDay(isResting);

        // Daily accident prone check from Clumsy trait
        party.forEach(member => {
            if (member.isAlive && member.negativeTraits.some(t => t.passiveEffect === "accident_prone") && Math.random() < 0.05) {
                if (Math.random() < 0.5 && partyInventory.food > 5) {
                    const lost = getRandomInt(1,3); partyInventory.food = Math.max(0, partyInventory.food - lost);
                    addLogEntry(`${member.name}'s clumsiness caused ${lost} lbs of food to be lost!`, "event_negative");
                } else if (partyInventory.ammo > 0) {
                    partyInventory.ammo = Math.max(0, partyInventory.ammo -1); // Lose 1 bullet or part of a box
                    addLogEntry(`${member.name} fumbled and lost some ammunition!`, "event_negative");
                }
            }
        });


        // Random Event Trigger (if not resting and not already in an event)
        if (!isResting && gamePhase === "traveling" && !activeEvent && Math.random() < 0.15) { // Reduced chance slightly
            selectAndTriggerRandomEvent();
        }

        updateMainUI(); // Update all relevant UI parts
        checkGameOverConditions(); // Check after all updates
    }

    function travelOneDay() {
        if (gamePhase !== "traveling" || activeEvent) return;
        if (party.filter(p => p.isAlive).length === 0) { addLogEntry("Cannot travel, everyone is dead.", "info"); return; }
        if ((partyInventory.oxen || 0) <= 0) { addLogEntry("Cannot travel, no oxen.", "info"); return; }

        let milesToday = MILES_PER_DAY_NORMAL;
        const avgEnergy = party.filter(p=>p.isAlive).reduce((sum, p) => sum + p.energy, 0) / (party.filter(p=>p.isAlive).length || 1);
        if (avgEnergy < 30) milesToday = Math.round(milesToday * 0.75);
        if (avgEnergy < 15) milesToday = Math.round(milesToday * 0.5);
        // TODO: Wagon damage, weather could also affect miles

        distanceTraveledOnLeg += milesToday;
        addLogEntry(`Traveled ${milesToday} miles.`);

        const currentLeg = TRAIL_MAP[currentLocationIndex];
        if (distanceTraveledOnLeg >= currentLeg.distanceToNext) {
            arriveAtLandmark();
        } else {
             advanceDay(false);
        }
    }

    function restOneDay() {
        if (gamePhase !== "traveling" && gamePhase !== "at_landmark" || activeEvent) return;
        addLogEntry("Rested for a day.");
        advanceDay(true);
    }

    function arriveAtLandmark() {
        currentLocationIndex++;
        distanceTraveledOnLeg = 0;
        const newLoc = TRAIL_MAP[currentLocationIndex];
        addLogEntry(`Arrived at ${newLoc.name}. ${newLoc.description}`, "landmark");

        if (newLoc.type === "destination") {
            gameOver("Congratulations! You have reached Oregon City!", true);
            return;
        }
        gamePhase = "at_landmark";
        updateMainUI(); // This will show/hide landmark buttons
    }

    function handleContinueJourneyFromLandmark() {
        gamePhase = "traveling";
        addLogEntry("Continuing the journey...", "event");
        updateMainUI();
    }

    // --- RANDOM EVENTS (Example structure, expand RANDOM_EVENTS_POOL) ---
    function selectAndTriggerRandomEvent() { /* ... same as before, use openModal for choices if not confirm ... */ }
    function triggerDiseaseOutbreak(gameState) { /* ... integrate trait effects for resistance/vulnerability ... */ }
    // ... other event trigger functions

    // --- MODAL ---
    function openModal(title, contentHtml, isCancellable = true) {
        modalTitleEl.textContent = title;
        modalBodyEl.innerHTML = contentHtml;
        modalCloseButtonEl.style.display = isCancellable ? 'block' : 'none';
        modalOverlayEl.classList.remove('hidden');
    }
    function closeModal() {
        modalOverlayEl.classList.add('hidden');
        modalBodyEl.innerHTML = ''; // Clear for next use
        if (activeEvent && activeEvent.onClose) { // If event had specific close action
            activeEvent.onClose();
        }
        activeEvent = null; // Clear active event when modal closes
        updateMainUI(); // Refresh main UI in case event choice changed state
    }

    // --- INVENTORY & MAP TAB RENDERING ---
    function renderPartyInventoryDetailed() { /* ... same as before ... */ }
    function renderMapLandmarkList() { /* ... same as before ... */ }

    // --- GAME OVER ---
    function checkGameOverConditions() {
        if (gamePhase === "game_over") return;
        if (party.filter(p => p.isAlive).length === 0) {
            gameOver("All party members have perished.");
        } else if ((partyInventory.oxen || 0) <= 0 && TRAIL_MAP[currentLocationIndex + 1]) {
            gameOver("Your wagon cannot move without oxen.");
        }
    }
    function gameOver(message, isVictory = false) {
        if (gamePhase === "game_over") return;
        gamePhase = "game_over";
        addLogEntry(message, isVictory ? "victory" : "gameover");
        travelDayButtonEl.disabled = true;
        restDayButtonEl.disabled = true;
        landmarkSpecificActionsEl.classList.add('hidden');
        eventChoicesAreaEl.classList.add('hidden');
        openModal(isVictory ? "Victory!" : "Game Over", `<p>${message}</p><p>Refresh the page to play again.</p>`, false);
    }

    // --- MAIN UI UPDATE FUNCTION ---
    function updateMainUI() {
        if (gamePhase === "game_over") return;

        updateHeaderStatus();
        renderPartyRosterCondensed();
        renderCharacterDetailView();

        // Status Tab Updates
        const currentLoc = TRAIL_MAP[currentLocationIndex];
        const nextLoc = TRAIL_MAP[currentLocationIndex + 1];
        if (nextLoc) {
            nextLandmarkNameEl.textContent = nextLoc.name;
            distanceToNextEl.textContent = `${Math.max(0, currentLoc.distanceToNext - distanceTraveledOnLeg)} miles`;
        } else {
            nextLandmarkNameEl.textContent = "Journey's End!";
            distanceToNextEl.textContent = "0 miles";
        }

        const isAtLandmark = gamePhase === "at_landmark";
        const showTravelButtons = gamePhase === "traveling" && !activeEvent;
        travelDayButtonEl.classList.toggle('hidden', !showTravelButtons);
        travelDayButtonEl.disabled = !showTravelButtons;
        restDayButtonEl.classList.toggle('hidden', !showTravelButtons && !isAtLandmark); // Can rest at landmark too
        restDayButtonEl.disabled = (!showTravelButtons && !isAtLandmark) || activeEvent;


        landmarkSpecificActionsEl.classList.toggle('hidden', !isAtLandmark || activeEvent);
        if (isAtLandmark) {
            visitStoreButtonEl.classList.toggle('hidden', !(currentLoc.services?.some(s => s.startsWith("shop_"))));
             // Add other landmark buttons here if any
        }
        eventChoicesAreaEl.classList.toggle('hidden', !activeEvent);


        // Other Tabs (conditionally update if performance becomes an issue)
        renderPartyInventoryDetailed();
        renderMapLandmarkList();
        generateComplaints(); // Check for complaints after state updates
    }
    function generateComplaints() { /* ... same as before ... */ }
    function applyDisease(person, diseaseName) { /* ... same as before ... */ }


    // --- INITIALIZATION ---
    function init() {
        // Tab listeners
        tabsContainerEl.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                if (button.dataset.tab === "setup" && gamePhase !== "setup") return; // Prevent going back to setup
                switchTab(button.dataset.tab);
            });
        });

        // Setup phase buttons
        generateDrafteesButtonEl.addEventListener('click', () => {
            availableDraftees = [];
            for (let i = 0; i < NUM_DRAFTEES_TO_GENERATE; i++) availableDraftees.push(generateRandomPerson());
            updateSetupScreen();
        });
        startJourneyButtonEl.addEventListener('click', embarkJourney);

        // Travel phase buttons
        travelDayButtonEl.addEventListener('click', travelOneDay);
        restDayButtonEl.addEventListener('click', restOneDay);
        visitStoreButtonEl.addEventListener('click', () => {
            const currentLoc = TRAIL_MAP[currentLocationIndex];
            const shopType = currentLoc.services?.find(s => s.startsWith("shop_"));
            if (shopType && SHOP_INVENTORIES[shopType]) {
                openModal(`${currentLoc.name} Store`, `<div class="money-display">Your Money: $<span id="fort-store-money-display">${partyMoney.toFixed(2)}</span></div> <div id="fort-supply-list-modal"></div> <p id="fort-store-message"></p>`);
                renderSuppliesStoreUI(document.getElementById('fort-supply-list-modal'), SHOP_INVENTORIES[shopType], true, 'fort');
                // Update money display inside modal if needed
                const modalMoneyDisplay = document.getElementById('fort-store-money-display');
                if(modalMoneyDisplay) modalMoneyDisplay.textContent = partyMoney.toFixed(2);


            } else {
                openModal("Store Closed", "<p>No store available here or it's closed.</p>");
            }
        });
        // Add listener for a potential 'Continue Journey' button from landmark actions
        const continueJourneyBtn = document.createElement('button'); // Example if dynamically added
        continueJourneyBtn.id = 'continue-from-landmark-button';
        continueJourneyBtn.textContent = 'Continue Journey';
        continueJourneyBtn.addEventListener('click', handleContinueJourneyFromLandmark);
        // landmarkSpecificActionsEl.appendChild(continueJourneyBtn); // Append if this button is always there at landmarks

        // Modal close
        modalCloseButtonEl.addEventListener('click', closeModal);
        modalOverlayEl.addEventListener('click', (e) => { if (e.target === modalOverlayEl) closeModal(); });

        // Reset Game State for fresh start
        party = []; availableDraftees = []; nextPersonId = 0;
        partyMoney = STARTING_MONEY; bankerBonusAppliedCount = 0;
        GAME_SUPPLIES.forEach(supply => { partyInventory[supply.id] = 0; });
        currentDate = new Date(1848, 3, 1);
        currentLocationIndex = 0; distanceTraveledOnLeg = 0;
        complaintCooldown = 0; selectedCharacterId = null; activeEvent = null;
        gamePhase = "setup";
        gameLogEl.innerHTML = '<p>Welcome! Assemble your party and prepare for the journey.</p>';

        // Initial Render
        maxPartySizeDisplayEl.textContent = MAX_PARTY_SIZE;
        for (let i = 0; i < NUM_DRAFTEES_TO_GENERATE; i++) availableDraftees.push(generateRandomPerson());
        renderInitialSupplies(); // Call before updateSetupScreen if it relies on money display
        updateSetupScreen(); // This now calls renderDraftees, roster, detail, header, start button

        // Render other tabs initially (even if hidden)
        renderPartyInventoryDetailed();
        renderMapLandmarkList();

        switchTab('setup');
        tabButtonSetupEl.classList.remove('hidden');
        landmarkSpecificActionsEl.classList.add('hidden');
        eventChoicesAreaEl.classList.add('hidden');
        updateMainUI(); // Final comprehensive UI update
    }

    init();
});