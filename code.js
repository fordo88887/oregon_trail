document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const MAX_PARTY_SIZE = 4;
    const NUM_DRAFTEES_TO_GENERATE = 3;
    const STARTING_MONEY = 800.00;
    const BASE_HEALTH = 100;
    const MAX_POSITIVE_TRAITS = 2;
    const MAX_NEGATIVE_TRAITS = 2;

    // --- DATA POOLS ---
    const MALE_FIRST_NAMES = ["John", "William", "James", "Robert", "Michael", "David", "Richard", "Joseph", "Thomas", "Charles"];
    const FEMALE_FIRST_NAMES = ["Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Susan", "Jessica", "Sarah", "Karen", "Nancy"];
    const LAST_NAMES = ["Smith", "Jones", "Miller", "Davis", "Garcia", "Wilson", "Martinez", "Anderson", "Taylor", "Thomas", "Brown", "Lee"];
    const OCCUPATIONS = [
        { name: "Farmer", skill: "Farming", description: "Good at finding food." },
        { name: "Doctor", skill: "Medicine", description: "Can heal party members." },
        { name: "Carpenter", skill: "Repair", description: "Better at fixing the wagon." },
        { name: "Blacksmith", skill: "Crafting", description: "Can repair tools and wagon parts." },
        { name: "Teacher", skill: "Negotiation", description: "May get better trade deals." },
        { name: "Banker", skill: "Finance", description: "Starts with slightly more money (effect applied to party total if chosen)." },
        { name: "Hunter", skill: "Hunting", description: "Excellent at acquiring game." },
        { name: "Merchant", skill: "Trading", description: "Gets better prices for goods." },
        { name: "Tailor", skill: "Sewing", description: "Can repair clothing." }
    ];
    const GENDERS = ["Male", "Female"];

    const GAME_SUPPLIES = [
        { id: 'food', name: 'Food', price: 0.20, unit: 'lb', description: "Keeps your party fed." },
        { id: 'clothing', name: 'Clothing', price: 10.00, unit: 'set', description: "Protection against harsh weather." },
        { id: 'ammo', name: 'Ammunition', price: 2.00, unit: 'box (20 bullets)', description: "For hunting and defense." },
        { id: 'oxen', name: 'Oxen', price: 40.00, unit: 'yoke (2 oxen)', description: "Needed to pull the wagon." },
        { id: 'wheels', name: 'Wagon Wheels (spare)', price: 10.00, unit: 'wheel', description: "Spares for rough terrain." },
        { id: 'axles', name: 'Wagon Axles (spare)', price: 10.00, unit: 'axle', description: "Spares for potential breaks." },
        { id: 'medicine', name: 'Medicine Kits', price: 5.00, unit: 'kit', description: "Helps treat illness and injury." }
    ];

    const POSITIVE_TRAITS = [
        { id: "optimist", name: "Optimist", description: "Less prone to morale loss." },
        { id: "strong_stomach", name: "Strong Stomach", description: "Less likely to get food poisoning." },
        { id: "eagle_eye", name: "Eagle Eye", description: "Better hunting success." },
        { id: "thrifty", name: "Thrifty", description: "Gets slightly better trade deals." },
        { id: "fast_healer", name: "Fast Healer", description: "Recovers from illness/injury faster." },
        { id: "tough", name: "Tough", description: "Starts with +10 max health.", effect: (person) => person.health += 10 },
        { id: "resourceful", name: "Resourceful", description: "May find extra items during events." },
        { id: "inspiring", name: "Inspiring", description: "Slightly boosts party morale." },
        { id: "night_owl", name: "Night Owl", description: "More effective on watch duty." },
        { id: "animal_whisperer", name: "Animal Whisperer", description: "Oxen are slightly more resilient." }
    ];

    const NEGATIVE_TRAITS = [
        { id: "pessimist", name: "Pessimist", description: "More prone to morale loss." },
        { id: "weak_stomach", name: "Weak Stomach", description: "More likely to get food poisoning." },
        { id: "clumsy", name: "Clumsy", description: "May cause minor accidents." },
        { id: "spendthrift", name: "Spendthrift", description: "Gets slightly worse trade deals." },
        { id: "slow_healer", name: "Slow Healer", description: "Recovers from illness/injury slower." },
        { id: "frail", name: "Frail", description: "Starts with -10 max health.", effect: (person) => person.health -= 10 },
        { id: "wasteful", name: "Wasteful", description: "Consumes slightly more food." },
        { id: "grumpy", name: "Grumpy", description: "Can slightly lower party morale." },
        { id: "heavy_sleeper", name: "Heavy Sleeper", description: "Less effective on watch duty." },
        { id: "allergies", name: "Allergies (Dust)", description: "Prone to minor sickness." }
    ];

    // --- GAME STATE ---
    let availableDraftees = [];
    let party = [];
    let nextPersonId = 0;
    let partyMoney = STARTING_MONEY;
    let partyInventory = {};

    // --- DOM ELEMENTS ---
    // (Same as before)
    const drafteePoolEl = document.getElementById('draftee-pool');
    const partyRosterEl = document.getElementById('party-roster');
    const generateDrafteesButton = document.getElementById('generate-draftees-button');
    const startJourneyButton = document.getElementById('start-journey-button');
    const maxPartySizeDisplay = document.getElementById('max-party-size-display');
    const maxPartySizeDisplay2 = document.getElementById('max-party-size-display-2');
    const currentPartySizeDisplay = document.getElementById('current-party-size-display');
    const partyMoneyDisplay = document.getElementById('party-money-display');
    const supplyStoreEl = document.getElementById('supply-store');
    const partyInventoryEl = document.getElementById('party-inventory');


    // --- HELPER FUNCTIONS ---
    function getRandomElement(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function shuffleArray(array) { // Fisher-Yates shuffle
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function generateRandomPerson() {
        const gender = getRandomElement(GENDERS);
        const firstName = gender === "Male" ? getRandomElement(MALE_FIRST_NAMES) : getRandomElement(FEMALE_FIRST_NAMES);
        const lastName = getRandomElement(LAST_NAMES);
        const occupation = getRandomElement(OCCUPATIONS);

        let person = {
            id: nextPersonId++,
            name: `${firstName} ${lastName}`,
            gender: gender,
            occupation: occupation.name,
            skill: occupation.skill,
            description: occupation.description, // Occupation description
            health: BASE_HEALTH,
            positiveTraits: [],
            negativeTraits: []
        };

        // Assign Positive Traits
        let availablePositiveTraits = [...POSITIVE_TRAITS];
        shuffleArray(availablePositiveTraits);
        const numPositive = Math.floor(Math.random() * (MAX_POSITIVE_TRAITS + 1)); // 0 to MAX_POSITIVE_TRAITS
        for (let i = 0; i < numPositive && i < availablePositiveTraits.length; i++) {
            person.positiveTraits.push(availablePositiveTraits[i]);
            if (availablePositiveTraits[i].effect) {
                availablePositiveTraits[i].effect(person);
            }
        }

        // Assign Negative Traits
        let availableNegativeTraits = [...NEGATIVE_TRAITS];
        shuffleArray(availableNegativeTraits);
        const numNegative = Math.floor(Math.random() * (MAX_NEGATIVE_TRAITS + 1)); // 0 to MAX_NEGATIVE_TRAITS
        for (let i = 0; i < numNegative && i < availableNegativeTraits.length; i++) {
            person.negativeTraits.push(availableNegativeTraits[i]);
            if (availableNegativeTraits[i].effect) {
                availableNegativeTraits[i].effect(person);
            }
        }
        // Ensure health doesn't go below a minimum (e.g., 50) or too high due to traits
        person.health = Math.max(50, Math.min(150, person.health));


        // Apply Banker bonus if they are the first banker drafted (or handle this when party is finalized)
        // For simplicity now, we'll handle this bonus when the journey starts or when they are drafted.
        // If person.occupation === "Banker", they add a bonus to party money.
        // This could be done once when they are added to the party roster.

        return person;
    }

    // --- UI UPDATE FUNCTIONS ---
    function updatePartySizeDisplay() {
        currentPartySizeDisplay.textContent = party.length;
    }

    function updateMoneyDisplay() {
        partyMoneyDisplay.textContent = partyMoney.toFixed(2);
    }

    function formatTraitsList(traits, listClass) {
        if (!traits || traits.length === 0) return '';
        let listHtml = `<ul class="${listClass}">`;
        traits.forEach(trait => {
            listHtml += `<li title="${trait.description}">${trait.name}</li>`;
        });
        listHtml += `</ul>`;
        return listHtml;
    }

    function renderDraftees() {
        drafteePoolEl.innerHTML = '';
        availableDraftees.forEach(person => {
            const card = document.createElement('div');
            card.classList.add('character-card');
            card.innerHTML = `
                <p class="name">${person.name}</p>
                <p>Gender: ${person.gender}</p>
                <p>Occupation: ${person.occupation} <em>(${person.description})</em></p>
                <p>Health: ${person.health}%</p>
                ${formatTraitsList(person.positiveTraits, 'traits-list')}
                ${formatTraitsList(person.negativeTraits, 'debuffs-list')}
                <button class="draft-button" data-id="${person.id}">Draft into Party</button>
            `;
            drafteePoolEl.appendChild(card);
        });
        addDraftButtonListeners();
    }

    function renderParty() {
        partyRosterEl.innerHTML = '';
        let initialMoneyBonusApplied = false; // To ensure banker bonus is applied only once if multiple bankers

        party.forEach(person => {
            // Apply banker bonus if not already applied for this drafting session
            // This is a simple way. A more robust way would be to track if *this specific* banker's bonus has been applied.
            if (person.occupation === "Banker" && !person.bankerBonusApplied) {
                 partyMoney += 100; // Example bonus
                 person.bankerBonusApplied = true; // Mark that this person's bonus is given
                 console.log(`${person.name} (Banker) added $100 to party funds.`);
                 updateMoneyDisplay();
            }

            const card = document.createElement('div');
            card.classList.add('character-card');
            card.innerHTML = `
                <p class="name">${person.name}</p>
                <p>Occupation: ${person.occupation}</p>
                <p>Health: ${person.health}%</p>
                ${formatTraitsList(person.positiveTraits, 'traits-list')}
                ${formatTraitsList(person.negativeTraits, 'debuffs-list')}
                <button class="remove-button" data-id="${person.id}">Remove from Party</button>
            `;
            partyRosterEl.appendChild(card);
        });
        addRemoveButtonListeners();
        updatePartySizeDisplay();
        checkCanStartJourney();
    }

    function renderSuppliesStore() {
        // (Same as before)
        supplyStoreEl.innerHTML = '<h3>Available at the Store:</h3>';
        GAME_SUPPLIES.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.classList.add('supply-item');
            itemEl.innerHTML = `
                <div class="supply-info">
                    <span class="name">${item.name}</span>
                    <span class="price">($${item.price.toFixed(2)} per ${item.unit})</span>
                    <p class="description"><em>${item.description}</em></p>
                </div>
                <div class="supply-actions">
                    <label for="qty-${item.id}">Qty:</label>
                    <input type="number" id="qty-${item.id}" name="qty-${item.id}" min="0" value="0" data-price="${item.price}" data-item-id="${item.id}">
                    <button class="buy-supply-button" data-item-id="${item.id}">Buy</button>
                </div>
            `;
            supplyStoreEl.appendChild(itemEl);
        });
        addBuySupplyButtonListeners();
    }

    function renderPartyInventory() {
        // (Same as before)
        partyInventoryEl.innerHTML = '';
        if (Object.keys(partyInventory).length === 0 || Object.values(partyInventory).every(v => v === 0)) {
            partyInventoryEl.innerHTML = "<p>You haven't bought any supplies yet.</p>";
            return;
        }
        const ul = document.createElement('ul');
        for (const itemId in partyInventory) {
            if (partyInventory[itemId] > 0) {
                const supplyDetails = GAME_SUPPLIES.find(s => s.id === itemId);
                const li = document.createElement('li');
                li.textContent = `${supplyDetails.name}: ${partyInventory[itemId]} ${supplyDetails.unit.split(' ')[0]}${partyInventory[itemId] > 1 && !supplyDetails.unit.includes('(') ? 's' : ''}`;
                ul.appendChild(li);
            }
        }
        partyInventoryEl.appendChild(ul);
    }


    // --- EVENT HANDLERS & LOGIC ---
    function handleGenerateDraftees() {
        availableDraftees = [];
        for (let i = 0; i < NUM_DRAFTEES_TO_GENERATE; i++) {
            availableDraftees.push(generateRandomPerson());
        }
        renderDraftees();
    }

    function addDraftButtonListeners() {
        const draftButtons = document.querySelectorAll('.draft-button');
        draftButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                if (party.length < MAX_PARTY_SIZE) {
                    const personId = parseInt(event.target.dataset.id);
                    const selectedPerson = availableDraftees.find(p => p.id === personId);
                    if (selectedPerson) {
                        party.push(selectedPerson);
                        availableDraftees = availableDraftees.filter(p => p.id !== personId);
                        renderDraftees();
                        renderParty(); // This will also handle banker bonus
                    }
                } else {
                    alert(`Party is full! Maximum ${MAX_PARTY_SIZE} members allowed.`);
                }
            });
        });
    }

    function addRemoveButtonListeners() {
        const removeButtons = document.querySelectorAll('.remove-button');
        removeButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const personId = parseInt(event.target.dataset.id);
                const removedPerson = party.find(p => p.id === personId);
                if (removedPerson) {
                    // If removing a banker whose bonus was applied, subtract it
                    if (removedPerson.occupation === "Banker" && removedPerson.bankerBonusApplied) {
                        partyMoney -= 100; // Example bonus
                        removedPerson.bankerBonusApplied = false; // Reset flag
                        console.log(`Removed Banker ${removedPerson.name}, $100 bonus retracted.`);
                        updateMoneyDisplay();
                    }
                    party = party.filter(p => p.id !== personId);
                    renderParty();
                }
            });
        });
    }

    function addBuySupplyButtonListeners() {
        // (Same as before)
        const buyButtons = document.querySelectorAll('.buy-supply-button');
        buyButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const itemId = event.target.dataset.itemId;
                const quantityInput = document.getElementById(`qty-${itemId}`);
                const quantity = parseInt(quantityInput.value);
                const itemPrice = parseFloat(quantityInput.dataset.price);

                if (isNaN(quantity) || quantity <= 0) {
                    alert("Please enter a positive quantity to buy.");
                    quantityInput.value = "0";
                    return;
                }

                const cost = quantity * itemPrice;

                if (partyMoney >= cost) {
                    partyMoney -= cost;
                    partyInventory[itemId] = (partyInventory[itemId] || 0) + quantity;

                    updateMoneyDisplay();
                    renderPartyInventory();
                    quantityInput.value = "0";
                    // alert(`Bought ${quantity} of ${itemId}.`); // Maybe too many alerts
                } else {
                    alert("Not enough money!");
                }
            });
        });
    }

    function checkCanStartJourney() {
        // (Same as before)
        startJourneyButton.disabled = party.length === 0;
    }

    // --- INITIALIZATION ---
    function init() {
        maxPartySizeDisplay.textContent = MAX_PARTY_SIZE;
        maxPartySizeDisplay2.textContent = MAX_PARTY_SIZE;
        generateDrafteesButton.textContent = `Generate New Draftees (${NUM_DRAFTEES_TO_GENERATE})`;

        GAME_SUPPLIES.forEach(supply => {
            partyInventory[supply.id] = 0;
        });

        generateDrafteesButton.addEventListener('click', handleGenerateDraftees);
        startJourneyButton.addEventListener('click', () => {
            if (party.length > 0) {
                if (!partyInventory.oxen || partyInventory.oxen === 0) {
                    alert("You cannot start your journey without any oxen to pull the wagon!");
                    return;
                }
                if (!partyInventory.food || partyInventory.food === 0) {
                    if(!confirm("Are you sure you want to start with no food? This will be a very short trip!")) {
                        return;
                    }
                }
                alert(`Starting journey with ${party.length} members!\n(Further game logic to be implemented here)`);
                console.log("Final Party:", party);
                console.log("Final Inventory:", partyInventory);
                console.log("Money Left:", partyMoney.toFixed(2));
            }
        });

        handleGenerateDraftees();
        updatePartySizeDisplay();
        updateMoneyDisplay();
        renderSuppliesStore();
        renderPartyInventory();
        checkCanStartJourney();
    }

    init();
});