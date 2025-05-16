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
    const HYGIENE_LOSS_PER_DAY = 7;
    const ENERGY_RECOVERY_PER_REST_DAY = 25;
    const HEALTH_RECOVERY_PER_REST_DAY = 8;
    const COMPLAINT_BASE_CHANCE = 0.55;
    const TOILET_MATURITY_LEVELS = ["very_low", "low", "medium", "high"];

    // --- DATA POOLS ---
    const MALE_FIRST_NAMES = ["John", "William", "James", "Robert", "Michael", "David", "Richard", "Joseph", "Thomas", "Charles", "Daniel", "Matthew"];
    const FEMALE_FIRST_NAMES = ["Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Susan", "Jessica", "Sarah", "Karen", "Nancy", "Emily", "Margaret"];
    const LAST_NAMES = ["Smith", "Jones", "Miller", "Davis", "Garcia", "Wilson", "Martinez", "Anderson", "Taylor", "Thomas", "Brown", "Lee", "Walker", "Hall", "Allen", "Young"];
    const OCCUPATIONS = [
        { name: "Farmer", skill: "Farming", description: "Resilient and good with animals.", passiveEffect: "farming_bonus" },
        { name: "Doctor", skill: "Medicine", description: "Can treat illnesses more effectively.", passiveEffect: "medical_bonus" },
        { name: "Carpenter", skill: "Repair", description: "Reduces wagon damage chance.", passiveEffect: "repair_bonus" },
        { name: "Blacksmith", skill: "Crafting", description: "Can repair tools and wagon parts better at forts.", passiveEffect: "crafting_bonus" },
        { name: "Teacher", skill: "Negotiation", description: "May get slightly better trade deals.", passiveEffect: "negotiation_bonus_occupation" },
        { name: "Banker", skill: "Finance", description: "Starts with more party money.", effect: (gameState) => { gameState.partyMoney += 150; } },
        { name: "Hunter", skill: "Hunting", description: "Excellent at acquiring game.", passiveEffect: "hunting_bonus_occupation" },
        { name: "Merchant", skill: "Trading", description: "Gets better prices for goods (stack with Thrifty).", passiveEffect: "trade_bonus_occupation" },
        { name: "Tailor", skill: "Sewing", description: "Clothing lasts longer, minor protection.", passiveEffect: "sewing_bonus" }
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
    const DISEASES = {
        "Cholera": { name: "Cholera", dailyEffects: (person) => { person.health = Math.max(0, person.health - getRandomInt(15, 25)); person.hygiene = Math.max(0, person.hygiene - 20); person.energy = Math.max(0, person.energy - 10);}, duration: () => getRandomInt(3, 7), contagiousness: 0.2 },
        "Dysentery": { name: "Dysentery", dailyEffects: (person) => { person.health = Math.max(0, person.health - getRandomInt(5, 10)); person.hygiene = Math.max(0, person.hygiene - 15); person.bowelUrgency = Math.min(100, person.bowelUrgency + getRandomInt(25, 40));}, duration: () => getRandomInt(5, 10), contagiousness: 0.15 },
        "Bladder Infection": { name: "Bladder Infection", dailyEffects: (person) => { person.health = Math.max(0, person.health - getRandomInt(2, 6)); person.energy = Math.max(0, person.energy - 5); person.bladderUrgency = Math.min(100, person.bladderUrgency + getRandomInt(20, 35));}, duration: () => getRandomInt(4, 8), contagiousness: 0.05 }
    };
    const TOILET_COMPLAINTS = {
        bowel: { very_low: { moderate: ["My tummy hurts!", "I need to poopoo!", "When can we stop? I gotta go!"], high: ["I can't hold it! I'm gonna poop my pants!", "POOOOOP!", "It's coming out!!"], accident: ["Oopsie... I made a big stinky.", "My pants are all messy now..."]}, low: { moderate: ["My stomach feels funny.", "I really need to use the outhouse... or a bush.", "Can we stop soon? For... you know."], high: ["Seriously, I'm about to explode!", "This is an emergency! Find a spot!", "I'm not kidding, it's urgent!"], accident: ["Oh no... I couldn't make it. This is embarrassing.", "Well, that was unpleasant."]}, medium: { moderate: ["I'll need to find a private spot at the next break.", "Could use a latrine soon.", "Feeling a bit of pressure."], high: ["We need to make a stop for sanitation purposes, quite urgently.", "I require a moment of privacy, immediately.", "This is becoming critical."], accident: ["An unfortunate incident has occurred. I require a change.", "Regrettably, I had an accident."]}, high: { moderate: ["I shall require a brief recess at our next convenience.", "A comfort stop would be appreciated when possible.", "Nature calls, but I can manage for a while."], high: ["Excuse me, but a stop is now imperative for personal reasons.", "I must insist on a brief halt at the earliest opportunity.", "The situation has become rather pressing."], accident: ["A most inopportune moment... I shall deal with it discreetly.", "My apologies for this... bodily betrayal."]} },
        bladder: { very_low: { moderate: ["I need to go pee-pee!", "My bladder is full!", "Potty break!"], high: ["I'm gonna wet my pants!", "PEE-PEE NOW!", "It's leaking!"], accident: ["Uh oh... I made a puddle.", "My pants are wet..."]}, low: { moderate: ["I need to pee pretty badly.", "Is there a good spot to go soon?", "My bladder's getting full."], high: ["I really, really have to go!", "Can't hold it much longer!", "Emergency bathroom break!"], accident: ["Darn it! I wet myself.", "Well, this is awkward."]}, medium: { moderate: ["I'll need to relieve myself soon.", "A comfort stop for micturition is in order.", "Feeling the need to urinate."], high: ["A stop for urination is now quite necessary.", "I require facilities, urgently.", "This is becoming rather uncomfortable."], accident: ["An unfortunate spillage. My apologies.", "A moment of weakness, I'm afraid."]}, high: { moderate: ["I could use a moment to relieve my bladder.", "A brief stop for personal comfort would be welcome.", "I shall attend to my needs at the next opportunity."], high: ["Pardon me, but I must request an immediate stop.", "A halt is required for physiological reasons.", "The call of nature is rather insistent."], accident: ["A regrettable lapse. I shall manage.", "My apologies for this... slight inconvenience."]} }
    };
    const TRAIL_MAP = [
        { name: "Independence, Missouri", distanceToNext: 102, type: "town", services: ["shop_basic"], description: "The starting point!" },
        { name: "Kansas River Crossing", distanceToNext: 83, type: "river_crossing", depth: () => getRandomInt(2, 5), width: 600, ferryCost: 5.00, description: "A wide river, often tricky to cross." },
        { name: "Big Blue River Crossing", distanceToNext: 119, type: "river_crossing", depth: () => getRandomInt(3, 6), width: 400, ferryCost: 3.00, description: "Another significant water obstacle." },
        { name: "Fort Kearny", distanceToNext: 200, type: "fort", services: ["shop_limited", "rest"], description: "A key army post." },
        { name: "Chimney Rock", distanceToNext: 86, type: "natural_landmark", description: "A famous, needle-like rock formation." },
        { name: "Fort Laramie", distanceToNext: 190, type: "fort", services: ["shop_limited", "rest"], description: "An important fur trading post and later a military fort." },
        { name: "Independence Rock", distanceToNext: 100, type: "natural_landmark", description: "A massive granite rock where many pioneers carved their names." },
        { name: "South Pass", distanceToNext: 55, type: "mountain_pass", description: "A relatively easy passage through the Rocky Mountains." },
        { name: "Fort Bridger", distanceToNext: 150, type: "fort", services: ["shop_limited", "rest"], description: "A supply post established by mountain man Jim Bridger." },
        { name: "Soda Springs", distanceToNext: 140, type: "natural_landmark", description: "Known for its naturally carbonated water springs." },
        { name: "Fort Hall", distanceToNext: 57, type: "fort", services: ["shop_limited", "rest"], description: "A significant stop before the trail splits." },
        { name: "Snake River Crossing", distanceToNext: 180, type: "river_crossing", depth: () => getRandomInt(4, 8), width: 1000, ferryCost: 10.00, description: "A dangerous and difficult river to ford." },
        { name: "Fort Boise", distanceToNext: 113, type: "fort", services: ["shop_very_limited", "rest"], description: "A Hudson's Bay Company post in present-day Idaho." },
        { name: "Blue Mountains Crossing", distanceToNext: 160, type: "mountain_range", description: "A rugged mountain range to traverse." },
        { name: "The Dalles", distanceToNext: 100, type: "town", services: ["shop_basic", "rest"], description: "A key trading center on the Columbia River." },
        { name: "Oregon City (Willamette Valley)", distanceToNext: 0, type: "destination", description: "The end of the Oregon Trail! You've made it!" }
    ];
    const SHOP_INVENTORIES = {
        "shop_basic": { food: { priceMultiplier: 1.0, stock: Infinity }, clothing: { priceMultiplier: 1.0, stock: 10 }, ammo: { priceMultiplier: 1.0, stock: Infinity }, oxen: { priceMultiplier: 1.0, stock: 10 }, wheels: { priceMultiplier: 1.0, stock: 5 }, axles: { priceMultiplier: 1.0, stock: 5 }, medicine: { priceMultiplier: 1.0, stock: 20 }},
        "shop_limited": { food: { priceMultiplier: 1.2, stock: 200 }, ammo: { priceMultiplier: 1.1, stock: 50 }, oxen: { priceMultiplier: 1.3, stock: 4 }, medicine: { priceMultiplier: 1.2, stock: 10 }, wheels: { priceMultiplier: 1.5, stock: 2 }},
        "shop_very_limited": { food: { priceMultiplier: 1.5, stock: 100 }, ammo: { priceMultiplier: 1.3, stock: 20 }, medicine: { priceMultiplier: 1.5, stock: 5 }}
    };
    const RANDOM_EVENTS_POOL = [
        { id: "disease_outbreak", weight: 3, canOccur: (gs) => gs.party.length > 0, trigger: (gs) => triggerDiseaseOutbreak(gs), message: "There are reports of sickness spreading..." },
        { id: "hunting_ground", weight: 4, canOccur: (gs) => (gs.partyInventory.ammo || 0) > 0, trigger: (gs) => triggerHuntingOpportunity(gs), message: "You spot signs of game nearby." },
        { id: "pleasant_grove", weight: 3, canOccur: () => true, trigger: (gs) => triggerRestSpot(gs, "Pleasant Grove", { healthBonus: 5, energyBonus: 10, hygieneBonus: 5 }), message: "You find a pleasant grove, perfect for a short rest." },
        { id: "clear_spring", weight: 2, canOccur: () => true, trigger: (gs) => triggerRestSpot(gs, "Clear Spring", { healthBonus: 2, energyBonus: 5, hygieneBonus: 15 }), message: "A clear spring offers refreshing water." },
        { id: "minor_illness_food", weight: 2, canOccur: () => true, trigger: (gs) => { const aff = getRandomElement(gs.party.filter(p=>p.isAlive && !p.sickness)); if(aff){ if(Math.random()<0.6) applyDisease(aff,"Dysentery"); else applyDisease(aff,"Bladder Infection");} else addLogEntry("A strange illness passes, but everyone avoided it.", "event"); }, message: "Some food or water seems tainted." },
        { id: "lost_item_minor", weight: 1, canOccur: (gs) => (gs.partyInventory.food > 10 || gs.partyInventory.ammo > 2), trigger: (gs) => { if (Math.random()<0.5 && gs.partyInventory.food > 10) {const l=getRandomInt(5,15); gs.partyInventory.food=Math.max(0,gs.partyInventory.food-l); addLogEntry(`Lost ${l} lbs of food.`, "event_negative");} else if(gs.partyInventory.ammo>2){gs.partyInventory.ammo=Math.max(0,gs.partyInventory.ammo-1); addLogEntry(`Lost some ammo.`, "event_negative");}}, message: "Someone was careless."}
    ];

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
    let currentRiverCrossing = null;

    // --- DOM ELEMENTS ---
    const currentDateHeaderEl = document.getElementById('current-date-header');
    const partyMoneyHeaderEl = document.getElementById('party-money-header');
    const partyMoneySetupDisplayEl = document.getElementById('party-money-setup-display');
    const currentLocationHeaderEl = document.getElementById('current-location-header');
    const partyRosterCondensedEl = document.getElementById('party-roster-condensed');
    const characterDetailViewEl = document.getElementById('character-detail-view');
    const tabsContainerEl = document.getElementById('tabs');
    const tabButtonSetupEl = document.getElementById('setup-tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const maxPartySizeDisplayEl = document.getElementById('max-party-size-display');
    const generateDrafteesButtonEl = document.getElementById('generate-draftees-button');
    const drafteePoolEl = document.getElementById('draftee-pool');
    const initialSupplyStoreEl = document.getElementById('initial-supply-store');
    const startJourneyButtonEl = document.getElementById('start-journey-button');
    const nextLandmarkNameEl = document.getElementById('next-landmark-name');
    const distanceToNextEl = document.getElementById('distance-to-next');
    const travelDayButtonEl = document.getElementById('travel-day-button');
    const restDayButtonEl = document.getElementById('rest-day-button');
    const landmarkSpecificActionsEl = document.getElementById('landmark-specific-actions');
    const visitStoreButtonEl = document.getElementById('visit-store-button');
    const eventChoicesAreaEl = document.getElementById('event-choices-area');
    const gameLogEl = document.getElementById('game-log');
    const partyInventoryDetailedEl = document.getElementById('party-inventory-detailed');
    const mapLandmarkListEl = document.getElementById('map-landmark-list');
    const modalOverlayEl = document.getElementById('modal-overlay');
    const modalCloseButtonEl = document.getElementById('modal-close-button');
    const modalTitleEl = document.getElementById('modal-title');
    const modalBodyEl = document.getElementById('modal-body');
    const bathroomBreakButtonEl = document.createElement('button');

    // --- HELPER FUNCTIONS ---
    function getRandomElement(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function shuffleArray(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[array[i], array[j]] = [array[j], array[i]]; } return array; }
    function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

    function addLogEntry(message, type = "info", isSetupLog = false) {
        const logEntry = document.createElement('p');
        const timestamp = gamePhase !== "setup" ? `[${currentDate.toLocaleDateString()}] ` : '[Setup] ';
        logEntry.textContent = `${timestamp}${message}`;
        logEntry.classList.add(type);
        if (gameLogEl.firstChild) { gameLogEl.insertBefore(logEntry, gameLogEl.firstChild); }
        else { gameLogEl.appendChild(logEntry); }
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
        if (gamePhase !== "setup" && tabId === "setup") {
             tabButtonSetupEl.classList.add('hidden');
             if (targetPane && targetPane.classList.contains('active')) { switchTab('status'); }
        } else if (tabId === "setup") {
            tabButtonSetupEl.classList.remove('hidden');
        }
    }

    function updateHeaderStatus() {
        currentDateHeaderEl.textContent = gamePhase === "setup" ? "Pre-Journey" : currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        partyMoneyHeaderEl.textContent = partyMoney.toFixed(2);
        if (partyMoneySetupDisplayEl) partyMoneySetupDisplayEl.textContent = partyMoney.toFixed(2);
        currentLocationHeaderEl.textContent = TRAIL_MAP[currentLocationIndex].name;
    }

    function formatTraitsList(traits, listClass) {
        if (!traits || traits.length === 0) return '<p style="font-size:0.8em; margin-left:5px;">None</p>';
        let listHtml = `<ul class="${listClass}">`;
        traits.forEach(trait => { listHtml += `<li title="${trait.description}">${trait.name}</li>`; });
        listHtml += `</ul>`;
        return listHtml;
    }

    function renderPartyRosterCondensed() {
        partyRosterCondensedEl.innerHTML = '';
        if (party.length === 0) { partyRosterCondensedEl.innerHTML = gamePhase === "setup" ? "<p>Draft your party!</p>" : "<p>No one is in your party.</p>"; return; }
        party.forEach(member => {
            const memberDiv = document.createElement('div');
            memberDiv.classList.add('party-member-summary');
            memberDiv.dataset.memberId = member.id;
            if (member.id === selectedCharacterId) memberDiv.classList.add('selected');
            let statusText = member.isAlive ? "Okay" : "Deceased";
            if (member.isAlive && member.sickness) statusText = member.sickness.name;
            else if (member.isAlive && member.health < 30) statusText = "Critical";
            else if (member.isAlive && member.energy < 20) statusText = "Exhausted";
            memberDiv.innerHTML = `<p class="name">${member.name} <span style="font-size:0.8em; color:#555;">(${member.occupation})</span></p><p style="font-size:0.85em;">Status: ${statusText}</p>${member.isAlive ? `<div class="status-bar" title="Health: ${member.health}%"><div class="health-fill" style="width: ${member.health}%"></div></div><div class="status-bar" title="Energy: ${member.energy}%"><div class="energy-fill" style="width: ${member.energy}%"></div></div><div class="status-bar" title="Hygiene: ${member.hygiene}%"><div class="hygiene-fill" style="width: ${member.hygiene}%"></div></div>` : ''}`;
            memberDiv.addEventListener('click', () => { selectedCharacterId = member.id; renderPartyRosterCondensed(); renderCharacterDetailView(); });
            partyRosterCondensedEl.appendChild(memberDiv);
        });
    }

    function renderCharacterDetailView() {
        if (party.length > 0 && selectedCharacterId === null) selectedCharacterId = party[0].id;
        const member = party.find(p => p.id === selectedCharacterId);
        if (!member) { characterDetailViewEl.innerHTML = "<p>No character selected or party is empty.</p>"; return; }
        let bowelComplaint = "", bladderComplaint = "";
        if (member.isAlive) {
            if (member.bowelUrgency > 85) bowelComplaint = getRandomElement(TOILET_COMPLAINTS.bowel[member.toiletMaturity].high);
            else if (member.bowelUrgency > 50) bowelComplaint = getRandomElement(TOILET_COMPLAINTS.bowel[member.toiletMaturity].moderate);
            if (member.bladderUrgency > 85) bladderComplaint = getRandomElement(TOILET_COMPLAINTS.bladder[member.toiletMaturity].high);
            else if (member.bladderUrgency > 50) bladderComplaint = getRandomElement(TOILET_COMPLAINTS.bladder[member.toiletMaturity].moderate);
        }
        characterDetailViewEl.innerHTML = `<h4>${member.name}</h4><p><strong>Occupation:</strong> ${member.occupation}</p><p><strong>Gender:</strong> ${member.gender}</p><p><strong>Status:</strong> ${member.isAlive ? (member.sickness ? member.sickness.name : (member.health < 30 ? "Critical" : (member.energy < 20 ? "Exhausted" : "Okay"))) : "Deceased"}</p>${member.isAlive ? `<p><strong>Health:</strong> ${member.health} / ${member.maxHealth || BASE_HEALTH}</p><p><strong>Energy:</strong> ${member.energy}%</p><p><strong>Hygiene:</strong> ${member.hygiene}%</p><p><strong>Bowel Need:</strong> ${member.bowelUrgency}% ${bowelComplaint ? `<em>(${bowelComplaint})</em>` : ''}</p><p><strong>Bladder Need:</strong> ${member.bladderUrgency}% ${bladderComplaint ? `<em>(${bladderComplaint})</em>` : ''}</p>` : ''}<p><strong>Maturity:</strong> ${member.toiletMaturity.replace("_", " ")}</p><h5>Positive Traits:</h5>${formatTraitsList(member.positiveTraits, 'traits-list')}<h5>Negative Traits:</h5>${formatTraitsList(member.negativeTraits, 'debuffs-list')}${gamePhase === "setup" ? `<button class="remove-from-party-setup" data-id="${member.id}">Remove</button>` : ''}`;
        if (gamePhase === "setup") { const removeBtn = characterDetailViewEl.querySelector('.remove-from-party-setup'); if (removeBtn) removeBtn.addEventListener('click', handleRemoveFromPartySetup); }
    }

    // --- CHARACTER GENERATION & TRAITS ---
    function generateRandomPerson() {
        const gender = getRandomElement(GENDERS);
        const firstName = gender === "Male" ? getRandomElement(MALE_FIRST_NAMES) : getRandomElement(FEMALE_FIRST_NAMES);
        const lastName = getRandomElement(LAST_NAMES);
        const occupationData = getRandomElement(OCCUPATIONS);
        let person = { id: nextPersonId++, name: `${firstName} ${lastName}`, gender: gender, occupation: occupationData.name, occupationData: occupationData, maxHealth: BASE_HEALTH, health: BASE_HEALTH, energy: BASE_ENERGY, hygiene: BASE_HYGIENE, bowelUrgency: 0, bladderUrgency: 0, toiletMaturity: getRandomElement(TOILET_MATURITY_LEVELS), positiveTraits: [], negativeTraits: [], isAlive: true, sickness: null, hygieneRateModifier: 1.0, foodConsumptionModifier: 0 };
        let availablePositiveTraits = shuffleArray([...POSITIVE_TRAITS]);
        const numPositive = Math.floor(Math.random() * (MAX_POSITIVE_TRAITS + 1));
        for (let i = 0; i < numPositive && i < availablePositiveTraits.length; i++) { person.positiveTraits.push(availablePositiveTraits[i]); if (availablePositiveTraits[i].effect) availablePositiveTraits[i].effect(person); }
        let availableNegativeTraits = shuffleArray([...NEGATIVE_TRAITS]);
        const numNegative = Math.floor(Math.random() * (MAX_NEGATIVE_TRAITS + 1));
        for (let i = 0; i < numNegative && i < availableNegativeTraits.length; i++) { person.negativeTraits.push(availableNegativeTraits[i]); if (availableNegativeTraits[i].effect) availableNegativeTraits[i].effect(person); }
        person.health = Math.max(10, Math.min(person.maxHealth, person.health));
        person.energy = Math.max(0, Math.min(BASE_ENERGY + 10, person.energy));
        if (person.negativeTraits.some(t => t.passiveEffect === "food_consumption_increase")) { person.foodConsumptionModifier += 0.2; }
        return person;
    }

    // --- SETUP PHASE ---
    function renderDraftees() {
        drafteePoolEl.innerHTML = '';
        availableDraftees.forEach(person => {
            const card = document.createElement('div');
            card.classList.add('character-card');
            card.innerHTML = `<p class="name">${person.name}</p><p>Occupation: ${person.occupation}</p><p>Health: ${person.health}% (Max: ${person.maxHealth}%) | Energy: ${person.energy}%</p>${formatTraitsList(person.positiveTraits, 'traits-list')}${formatTraitsList(person.negativeTraits, 'debuffs-list')}<button class="draft-button" data-id="${person.id}">Draft</button>`;
            card.querySelector('.draft-button').addEventListener('click', handleDraftPerson);
            drafteePoolEl.appendChild(card);
        });
    }

    function renderInitialSupplies() {
        const setupSuppliesConfig = GAME_SUPPLIES.reduce((acc, s) => { acc[s.id] = { priceMultiplier: 1.0, stock: (s.id === 'oxen' ? 10 : Infinity) }; return acc; }, {});
        renderSuppliesStoreUI(initialSupplyStoreEl, setupSuppliesConfig, false, 'setup');
    }

    function handleDraftPerson(event) {
        if (party.length >= MAX_PARTY_SIZE) { openModal("Party Full", "<p>Your party is full.</p>"); return; }
        const personId = parseInt(event.target.dataset.id);
        const selectedPerson = availableDraftees.find(p => p.id === personId);
        if (selectedPerson) {
            party.push(selectedPerson);
            availableDraftees = availableDraftees.filter(p => p.id !== personId);
            if (selectedPerson.occupationData.effect) {
                 const gameStateForEffect = { partyMoney, party };
                 selectedPerson.occupationData.effect(gameStateForEffect);
                 partyMoney = gameStateForEffect.partyMoney;
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
            if (removedPerson.occupationData.effect && removedPerson.occupation === "Banker") {
                partyMoney -= 150;
                addLogEntry(`Banker ${removedPerson.name} removed, funds adjusted.`, "event", true);
            }
            if (selectedCharacterId === personId) { selectedCharacterId = party.length > 0 ? party[0].id : null; }
            updateSetupScreen();
        }
    }

    function updateStartJourneyButtonState() { if(startJourneyButtonEl) startJourneyButtonEl.disabled = party.length === 0; }

    function updateSetupScreen() {
        renderDraftees();
        renderPartyRosterCondensed();
        renderCharacterDetailView();
        updateHeaderStatus();
        updateStartJourneyButtonState();
    }

    // --- SUPPLY STORE (Generic) ---
    function getAdjustedPrice(basePrice, itemId, isFortStore) {
        let priceMultiplier = 1.0;
        let bestTradeBonus = 0;
        let worstTradePenalty = 0;
        party.forEach(p => {
            if (p.isAlive) {
                if (p.occupationData.passiveEffect === "negotiation_bonus_occupation" || p.occupationData.passiveEffect === "trade_bonus_occupation") { bestTradeBonus = Math.min(bestTradeBonus, -0.05); }
                p.positiveTraits.forEach(trait => { if (trait.passiveEffect === "trade_bonus_trait") bestTradeBonus = Math.min(bestTradeBonus, -0.05); });
                p.negativeTraits.forEach(trait => { if (trait.passiveEffect === "trade_penalty_trait") worstTradePenalty = Math.max(worstTradePenalty, 0.05); });
            }
        });
        priceMultiplier += (bestTradeBonus + worstTradePenalty);
        if (isFortStore) {
            const currentLoc = TRAIL_MAP[currentLocationIndex];
            const shopType = currentLoc.services?.find(s => s.startsWith("shop_"));
            if (shopType && SHOP_INVENTORIES[shopType] && SHOP_INVENTORIES[shopType][itemId]) { priceMultiplier *= SHOP_INVENTORIES[shopType][itemId].priceMultiplier; }
        }
        return basePrice * Math.max(0.5, priceMultiplier);
    }

    function renderSuppliesStoreUI(storeElement, suppliesConfig, isFortStore, context) {
        storeElement.innerHTML = '';
        const itemsAvailable = Object.keys(suppliesConfig);
        if (itemsAvailable.length === 0 || itemsAvailable.every(key => suppliesConfig[key].stock === 0)) { storeElement.innerHTML = "<p>No supplies available here or all out of stock.</p>"; return; }
        GAME_SUPPLIES.forEach(item => {
            if (!suppliesConfig[item.id] || suppliesConfig[item.id].stock === 0) return;
            const config = suppliesConfig[item.id];
            const adjustedPrice = getAdjustedPrice(item.price, item.id, isFortStore);
            const stockInfo = config.stock === Infinity ? "" : `(Stock: ${config.stock})`;
            const inputIdSuffix = context === 'setup' ? '-setup' : (isFortStore ? '-fort' : '');
            const itemEl = document.createElement('div');
            itemEl.classList.add('supply-item');
            itemEl.innerHTML = `<div class="supply-info"><span class="name">${item.name}</span><span class="price">($${adjustedPrice.toFixed(2)} per ${item.unit}) ${stockInfo}</span><p class="description"><em>${item.description}</em></p></div><div class="supply-actions"><label for="qty-${item.id}${inputIdSuffix}">Qty:</label><input type="number" id="qty-${item.id}${inputIdSuffix}" name="qty-${item.id}" min="0" value="0" data-base-price="${item.price}" data-item-id="${item.id}" data-stock="${config.stock}" ${config.stock !== Infinity ? `max="${config.stock}"` : ''}><button class="buy-supply-button" data-item-id="${item.id}" data-is-fort-store="${isFortStore}" data-context="${context}">Buy</button></div>`;
            storeElement.appendChild(itemEl);
        });
        addBuySupplyButtonListeners(isFortStore, context);
    }

    function addBuySupplyButtonListeners(isFortStore, context) {
        const selector = `.buy-supply-button[data-is-fort-store="${String(isFortStore)}"][data-context="${context}"]`;
        document.querySelectorAll(selector).forEach(button => {
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            newButton.addEventListener('click', (event) => {
                const currentButton = event.target;
                const itemId = currentButton.dataset.itemId;
                const inputIdSuffix = context === 'setup' ? '-setup' : (isFortStore ? '-fort' : '');
                const quantityInputEl = document.getElementById(`qty-${itemId}${inputIdSuffix}`);
                if (!quantityInputEl) { console.error("Quantity input not found for:", `qty-${itemId}${inputIdSuffix}`); return; }
                let quantity = parseInt(quantityInputEl.value);
                const baseItemPrice = parseFloat(quantityInputEl.dataset.basePrice);
                const stock = parseInt(quantityInputEl.dataset.stock);
                let messageElement = null;
                if (context === 'fort' && modalBodyEl) { messageElement = modalBodyEl.querySelector('#fort-store-message'); }
                if (isNaN(quantity) || quantity <= 0) { if (messageElement) messageElement.textContent = "Enter a positive quantity."; else alert("Please enter a positive quantity."); quantityInputEl.value = "0"; return; }
                if (stock !== Infinity && quantity > stock) { if (messageElement) messageElement.textContent = `Only ${stock} ${itemId} available.`; else alert(`Only ${stock} ${itemId} available.`); quantityInputEl.value = stock; quantity = stock; if (quantity <= 0) return; }
                if (context === 'setup' && itemId === 'oxen' && (partyInventory.oxen || 0) + quantity > 10) { alert("Max 10 yokes of oxen for initial setup."); quantityInputEl.value = "0"; return; }
                const finalPricePerUnit = getAdjustedPrice(baseItemPrice, itemId, isFortStore);
                const totalCost = quantity * finalPricePerUnit;
                if (partyMoney >= totalCost) {
                    partyMoney -= totalCost;
                    partyInventory[itemId] = (partyInventory[itemId] || 0) + quantity;
                    updateHeaderStatus();
                    if (isFortStore && stock !== Infinity) {
                        const currentLoc = TRAIL_MAP[currentLocationIndex];
                        const shopType = currentLoc.services.find(s => s.startsWith("shop_"));
                        if (SHOP_INVENTORIES[shopType] && SHOP_INVENTORIES[shopType][itemId]) { SHOP_INVENTORIES[shopType][itemId].stock -= quantity; }
                        if (modalBodyEl) { const fortSupplyListModalEl = modalBodyEl.querySelector('#fort-supply-list-modal'); if (fortSupplyListModalEl) { renderSuppliesStoreUI(fortSupplyListModalEl, SHOP_INVENTORIES[shopType], true, 'fort'); } }
                        if (messageElement) { messageElement.textContent = `Bought ${quantity} ${GAME_SUPPLIES.find(s=>s.id === itemId).name}.`; setTimeout(() => { if(messageElement) messageElement.textContent = ""; }, 3000); }
                    } else if (context === 'setup') {
                        renderPartyInventoryDetailed();
                    }
                    quantityInputEl.value = "0";
                } else {
                    if (messageElement) messageElement.textContent = "Not enough money!"; else alert("Not enough money!");
                }
            });
        });
    }

    // --- JOURNEY MANAGEMENT ---
    function embarkJourney() {
        if (party.length === 0) { openModal("Cannot Start", "<p>You need at least one party member!</p>"); return; }
        if (!partyInventory.oxen || partyInventory.oxen === 0) { openModal("Cannot Start", "<p>You need oxen to pull the wagon!</p>"); return; }
        if (!partyInventory.food || partyInventory.food < (party.length * 7) ) { if (!confirm("You have very little food. This will be a dangerous start. Are you sure?")) return; }
        gamePhase = "traveling";
        if(tabButtonSetupEl) tabButtonSetupEl.classList.add('hidden');
        switchTab('status');
        addLogEntry(`The journey begins from ${TRAIL_MAP[currentLocationIndex].name}!`, "event_title");
        updateMainUI();
    }

    function updateCharacterStatsForDay(isResting = false) {
        party.forEach(member => {
            if (!member.isAlive) return;
            let energyChange = 0, hygieneChange = 0, healthChange = 0;
            const livingPartyMembersCount = party.filter(p => p.isAlive).length;
            const hasAdequateClothing = (partyInventory.clothing || 0) >= livingPartyMembersCount;

            if (isResting) {
                energyChange = ENERGY_RECOVERY_PER_REST_DAY; healthChange = HEALTH_RECOVERY_PER_REST_DAY;
                if (member.positiveTraits.some(t => t.passiveEffect === "healing_bonus")) healthChange += 2;
                if (member.negativeTraits.some(t => t.passiveEffect === "healing_penalty")) healthChange -= 2;
                hygieneChange = 5;
                member.bowelUrgency = Math.max(0, member.bowelUrgency - getRandomInt(60, 100));
                member.bladderUrgency = Math.max(0, member.bladderUrgency - getRandomInt(70, 100));
                if (member.occupationData.passiveEffect === "farming_bonus" && Math.random() < 0.1) { const foundFood = getRandomInt(1,3); partyInventory.food = (partyInventory.food || 0) + foundFood; addLogEntry(`${member.name} found ${foundFood} lbs of edible plants while resting.`, "event_positive");}
            } else {
                energyChange = -ENERGY_COST_PER_TRAVEL_DAY;
                if (party.some(p => p.isAlive && p.positiveTraits.some(t => t.passiveEffect === "party_energy_save" && p.health > 50))) energyChange *= 0.95;
                if (party.some(p => p.isAlive && p.negativeTraits.some(t => t.passiveEffect === "party_energy_drain"))) energyChange *= 1.05;
                hygieneChange = -HYGIENE_LOSS_PER_DAY * member.hygieneRateModifier;
                if (!hasAdequateClothing) { hygieneChange *= 1.5; healthChange -= 2; energyChange -= 2; }
                member.bowelUrgency = Math.min(100, member.bowelUrgency + getRandomInt(10, 20));
                member.bladderUrgency = Math.min(100, member.bladderUrgency + getRandomInt(15, 25));
            }
            member.energy = Math.max(0, Math.min(BASE_ENERGY + 10, member.energy + energyChange));
            member.hygiene = Math.max(0, Math.min(BASE_HYGIENE, member.hygiene + hygieneChange));
            if (member.energy === 0) healthChange -= 5;
            let diseaseChanceMultiplier = 1.0;
            if (member.positiveTraits.some(t=>t.passiveEffect === "disease_resistance_food")) diseaseChanceMultiplier *= 0.7;
            if (member.negativeTraits.some(t=>t.passiveEffect === "disease_vulnerability_food")) diseaseChanceMultiplier *= 1.3;
            if (member.hygiene < 15 && Math.random() < (0.05 * diseaseChanceMultiplier) ) { if (!member.sickness) { applyDisease(member, "Dysentery"); } }
            if (member.bowelUrgency >= 90 || member.bladderUrgency >= 90) { healthChange -= 1; member.energy = Math.max(0, member.energy - 3); }
            if (member.bowelUrgency === 100) { const accComplaint = getRandomElement(TOILET_COMPLAINTS.bowel[member.toiletMaturity].accident); addLogEntry(`${member.name}: "${accComplaint}" (Had a bowel accident!)`, "event_negative"); member.hygiene = Math.max(0, member.hygiene - 40); member.health = Math.max(0, member.health - 5); member.bowelUrgency = 0; if (Math.random() < 0.1 && partyInventory.food > 1) { partyInventory.food = Math.max(0, partyInventory.food -1); addLogEntry("A small food item was soiled and lost.", "event_negative"); }}
            if (member.bladderUrgency === 100) { const accComplaint = getRandomElement(TOILET_COMPLAINTS.bladder[member.toiletMaturity].accident); addLogEntry(`${member.name}: "${accComplaint}" (Couldn't hold it!)`, "event_negative"); member.hygiene = Math.max(0, member.hygiene - 25); member.health = Math.max(0, member.health - 3); member.bladderUrgency = 0; }
            if ((partyInventory.food || 0) === 0) { healthChange -= 10; }
            member.health = Math.max(0, Math.min(member.maxHealth, member.health + healthChange));
            if (member.sickness) {
                member.sickness.daysSick++;
                member.sickness.definition.dailyEffects(member);
                let actualDuration = typeof member.sickness.definition.duration === 'function' ? member.sickness.definition.duration() : member.sickness.duration;
                if (member.positiveTraits.some(t => t.passiveEffect === "healing_bonus")) actualDuration = Math.max(1, actualDuration -1);
                if (member.negativeTraits.some(t => t.passiveEffect === "healing_penalty")) actualDuration +=1;
                if (party.some(p => p.isAlive && p.occupationData.passiveEffect === "medical_bonus")) { member.health = Math.min(member.maxHealth, member.health + 1); actualDuration = Math.max(1, parseFloat(actualDuration) - 0.5); }
                if (member.sickness.daysSick >= actualDuration && member.isAlive) { addLogEntry(`${member.name} recovered from ${member.sickness.name}.`, "event_positive"); member.sickness = null; }
            }
            if (member.health === 0 && member.isAlive) { member.isAlive = false; let causeOfDeath = "Poor Health"; if (member.sickness) causeOfDeath = member.sickness.name; else if ((partyInventory.food || 0) === 0 && healthChange <= -10) causeOfDeath = "Starvation"; else if (!hasAdequateClothing && healthChange <= -2) causeOfDeath = "Exposure"; addLogEntry(`${member.name} died. (${causeOfDeath})`, "death"); }
        });
    }

    function consumeResources() {
        let totalFoodConsumedToday = 0;
        party.forEach(member => { if (member.isAlive) { totalFoodConsumedToday += (FOOD_PER_PERSON_PER_DAY + member.foodConsumptionModifier); } });
        if ((partyInventory.food || 0) > 0) { if (partyInventory.food >= totalFoodConsumedToday) { partyInventory.food -= totalFoodConsumedToday; } else { partyInventory.food = 0; addLogEntry("Ate the last of food rations!", "warning"); } }
        if (partyInventory.oxen > 0 && (partyInventory.food || 0) > 0) { let oxenFoodPortion = Math.min(partyInventory.food, partyInventory.oxen * 0.5); if (party.some(p => p.isAlive && (p.occupationData.passiveEffect === "farming_bonus" || p.positiveTraits.some(t=>t.passiveEffect === "animal_whisperer")))) { oxenFoodPortion *= 0.9; } partyInventory.food = Math.max(0, partyInventory.food - oxenFoodPortion); }
    }

    function advanceDay(isResting = false) {
        if (gamePhase === "game_over") return;
        currentDate.setDate(currentDate.getDate() + 1);
        consumeResources();
        updateCharacterStatsForDay(isResting);
        party.forEach(member => { if (member.isAlive && member.negativeTraits.some(t => t.passiveEffect === "accident_prone") && Math.random() < 0.03) { if (Math.random() < 0.5 && partyInventory.food > 5) { const lost = getRandomInt(1,2); partyInventory.food = Math.max(0, partyInventory.food - lost); addLogEntry(`${member.name}'s clumsiness lost ${lost} lbs food!`, "event_negative"); } else if (partyInventory.ammo > 0) { partyInventory.ammo = Math.max(0, partyInventory.ammo -1); addLogEntry(`${member.name} fumbled some ammo!`, "event_negative"); } } });
        if (!isResting && gamePhase === "traveling" && !activeEvent && !currentRiverCrossing && Math.random() < 0.15) { selectAndTriggerRandomEvent(); }
        updateMainUI();
        checkGameOverConditions();
    }

    function travelOneDay() {
        if (gamePhase !== "traveling" || activeEvent || currentRiverCrossing) return;
        if (party.filter(p => p.isAlive).length === 0) { addLogEntry("Cannot travel, everyone is dead.", "info"); return; }
        if ((partyInventory.oxen || 0) <= 0) { addLogEntry("Cannot travel, no oxen.", "info"); return; }
        let milesToday = MILES_PER_DAY_NORMAL;
        const avgEnergy = party.filter(p=>p.isAlive).reduce((sum, p) => sum + p.energy, 0) / (party.filter(p=>p.isAlive).length || 1);
        if (avgEnergy < 30) milesToday = Math.round(milesToday * 0.75);
        if (avgEnergy < 15) milesToday = Math.round(milesToday * 0.5);
        distanceTraveledOnLeg += milesToday;
        addLogEntry(`Traveled ${milesToday} miles.`);
        const currentLeg = TRAIL_MAP[currentLocationIndex];
        if (distanceTraveledOnLeg >= currentLeg.distanceToNext) { arriveAtLandmark(); }
        else { advanceDay(false); }
    }

    function restOneDay() {
        if ((gamePhase !== "traveling" && gamePhase !== "at_landmark") || activeEvent || currentRiverCrossing) return;
        addLogEntry("Rested for a day.");
        advanceDay(true);
    }

    function arriveAtLandmark() {
        currentLocationIndex++;
        distanceTraveledOnLeg = 0;
        const newLoc = TRAIL_MAP[currentLocationIndex];
        addLogEntry(`Arrived at ${newLoc.name}. ${newLoc.description}`, "landmark");
        if (newLoc.type === "destination") { gameOver("Congratulations! You reached Oregon City!", true); return; }
        if (newLoc.type === "river_crossing") {
            gamePhase = "at_landmark";
            currentRiverCrossing = { ...newLoc, currentDepth: newLoc.depth() };
            addLogEntry(`Current river depth: ${currentRiverCrossing.currentDepth} feet. Width: ${newLoc.width} feet.`, "event");
        } else {
            gamePhase = "at_landmark";
            currentRiverCrossing = null;
            let continueBtn = document.getElementById('continue-from-landmark-button');
            if (continueBtn) continueBtn.classList.remove('hidden');
        }
        updateMainUI();
    }

    function handleContinueJourneyFromLandmark() {
        gamePhase = "traveling";
        addLogEntry("Continuing the journey...", "event");
        const continueBtn = document.getElementById('continue-from-landmark-button');
        if (continueBtn) continueBtn.classList.add('hidden');
        updateMainUI();
    }

    // --- RIVER CROSSING LOGIC ---
    function renderRiverCrossingOptions() {
        if (!currentRiverCrossing) return;
        eventChoicesAreaEl.innerHTML = `<h4>${currentRiverCrossing.name} (Depth: ${currentRiverCrossing.currentDepth} ft, Width: ${currentRiverCrossing.width} ft)</h4>`;
        const optionsDiv = document.createElement('div');
        const fordButton = document.createElement('button'); fordButton.textContent = `Attempt to Ford`; fordButton.addEventListener('click', () => resolveRiverCrossing('ford')); optionsDiv.appendChild(fordButton);
        const caulkButton = document.createElement('button'); caulkButton.textContent = "Caulk wagon and float"; caulkButton.addEventListener('click', () => resolveRiverCrossing('caulk')); optionsDiv.appendChild(caulkButton);
        if (currentRiverCrossing.ferryCost) { const ferryButton = document.createElement('button'); ferryButton.textContent = `Take Ferry ($${currentRiverCrossing.ferryCost.toFixed(2)})`; if (partyMoney < currentRiverCrossing.ferryCost) { ferryButton.disabled = true; ferryButton.title = "Not enough money."; } ferryButton.addEventListener('click', () => resolveRiverCrossing('ferry')); optionsDiv.appendChild(ferryButton); }
        const waitButton = document.createElement('button'); waitButton.textContent = "Wait a day"; waitButton.addEventListener('click', () => resolveRiverCrossing('wait')); optionsDiv.appendChild(waitButton);
        eventChoicesAreaEl.appendChild(optionsDiv);
        eventChoicesAreaEl.classList.remove('hidden');
    }

    function resolveRiverCrossing(choice) {
        if (!currentRiverCrossing) return;
        addLogEntry(`Chosen to ${choice} the ${currentRiverCrossing.name}.`, "event");
        eventChoicesAreaEl.innerHTML = ''; eventChoicesAreaEl.classList.add('hidden');
        let timeTakenDays = 0.2, success = true, itemsLost = [], peopleInjured = [];
        switch (choice) {
            case 'ford':
                timeTakenDays = 0.3 + (currentRiverCrossing.width / 2000);
                const fordDifficulty = currentRiverCrossing.currentDepth * (currentRiverCrossing.width / 500) + (partyInventory.oxen < 2 ? 10 : 0) - (party.some(p=>p.isAlive && p.occupationData.passiveEffect === "farming_bonus") ? 5 : 0);
                if (Math.random() * 100 < fordDifficulty) {
                    success = false; addLogEntry("Failed to ford! Wagon swamped!", "event_negative");
                    if (Math.random() < 0.5) {partyInventory.food = Math.max(0, partyInventory.food - getRandomInt(20, 50)); itemsLost.push("food");}
                    if (Math.random() < 0.3) {partyInventory.clothing = Math.max(0, partyInventory.clothing - 1); itemsLost.push("clothing");}
                    if (Math.random() < 0.2 && partyInventory.oxen > 0) {partyInventory.oxen--; itemsLost.push("an ox");}
                    party.forEach(p => { if (p.isAlive && Math.random() < 0.15) { p.health = Math.max(0, p.health - getRandomInt(10,30)); p.hygiene=Math.max(0, p.hygiene-20); peopleInjured.push(p.name);} });
                } else { addLogEntry("Successfully forded.", "event_positive"); party.forEach(p => p.hygiene = Math.max(0, p.hygiene - 10)); }
                break;
            case 'caulk':
                timeTakenDays = 0.5 + (currentRiverCrossing.width / 1500);
                const caulkSuccessChanceModifier = party.some(p=>p.isAlive && p.occupationData.passiveEffect === "repair_bonus") ? 0.15 : 0;
                if (currentRiverCrossing.currentDepth > 6 || Math.random() < (0.25 - caulkSuccessChanceModifier) ) {
                    success = false; addLogEntry("Wagon took on water or capsized!", "event_negative");
                    if (Math.random() < 0.7) {partyInventory.food = Math.max(0, partyInventory.food - getRandomInt(30, 80)); itemsLost.push("food");}
                    if (Math.random() < 0.5) {partyInventory.clothing = Math.max(0, partyInventory.clothing - getRandomInt(1,2)); itemsLost.push("clothing");}
                    if (Math.random() < 0.4) {partyInventory.ammo = Math.max(0, partyInventory.ammo - getRandomInt(1,3)); itemsLost.push("ammo");}
                    party.forEach(p => { if (p.isAlive && Math.random() < 0.25) { p.health = Math.max(0, p.health - getRandomInt(15,40)); p.hygiene=Math.max(0, p.hygiene-30); peopleInjured.push(p.name); if(Math.random() < 0.05 && !p.positiveTraits.some(t => t.id === "tough")) {p.isAlive=false; addLogEntry(`${p.name} drowned!`, "death");}} });
                } else { addLogEntry("Successfully floated across.", "event_positive"); }
                break;
            case 'ferry': 
                if (partyMoney >= currentRiverCrossing.ferryCost) {
                    partyMoney -= currentRiverCrossing.ferryCost;
                    timeTakenDays = 0.1 + (currentRiverCrossing.width / 3000); // Ferry is relatively quick
                    addLogEntry(`Paid $${currentRiverCrossing.ferryCost.toFixed(2)} for the ferry. Smooth crossing.`, "event_positive");
                    updateHeaderStatus(); // Update money in header
                } else {
                    addLogEntry("Cannot afford the ferry!", "warning");
                    success = false; // Didn't cross
                    timeTakenDays = 0; // No time spent if can't afford
                }
                break;
            case 'wait':
                timeTakenDays = 1.0; // Waiting costs a full day
                addLogEntry("Waited a day by the river.", "event");
                const oldDepth = currentRiverCrossing.currentDepth;
                currentRiverCrossing.currentDepth = Math.max(1, currentRiverCrossing.currentDepth - getRandomInt(0, (currentRiverCrossing.currentDepth > 3 ? 2 : 1) )); // Depth might decrease, less likely if already shallow
                if(currentRiverCrossing.currentDepth < oldDepth) addLogEntry(`The river seems a bit shallower: ${currentRiverCrossing.currentDepth} ft.`, "event_positive");
                else addLogEntry(`The river depth remains unchanged: ${currentRiverCrossing.currentDepth} ft.`, "event");
                success = false; // Did not attempt crossing, just waited
                break;
        }

        // Apply time cost for the day.
        // advanceDay handles resource consumption, stat updates, date increment.
        if (timeTakenDays > 0) {
            if (choice !== 'wait') {
                addLogEntry(`Crossing attempt took ~${Math.round(timeTakenDays * 24)} hours.`, "event");
            }
            // If waited, it's a "rest" day. If crossing (successful or not, unless ferry failed by money), it's an "activity" day.
            advanceDay(choice === 'wait' || (!success && choice !== 'ferry' && timeTakenDays > 0) );
        }


        if (itemsLost.length > 0) addLogEntry(`Lost: ${itemsLost.join(', ')}.`, "event_negative");
        if (peopleInjured.length > 0) addLogEntry(`Injured: ${peopleInjured.join(', ')}.`, "event_negative");

        if (success && choice !== 'wait') { // Successfully crossed (and didn't just wait)
            currentRiverCrossing = null; // Clear current river
            gamePhase = "traveling";    // Resume travel
            addLogEntry("You are now on the other side of the river.", "event_positive");
        } else if (choice !== 'wait' && !success) { // Failed to cross or couldn't afford ferry
            // Stay at river, options re-appear
            addLogEntry("You remain on this side of the river, facing the crossing again.", "event");
            // gamePhase is still "at_landmark" (river), currentRiverCrossing still set. UI will re-render options.
        }
        // If 'wait', currentRiverCrossing is updated (depth might change), gamePhase 'at_landmark'. UI re-renders.

        updateMainUI(); // Refresh UI
    }


    // --- BATHROOM BREAK INTERACTION ---
    function handleBathroomBreak() {
        if ((gamePhase !== "traveling" && !(gamePhase === "at_landmark" && !currentRiverCrossing)) || activeEvent ) {
            addLogEntry("Cannot take a break right now.", "info");
            return;
        }

        addLogEntry("Party takes a short break to relieve themselves.", "event");
        party.forEach(member => {
            if (member.isAlive) {
                member.bowelUrgency = Math.max(0, member.bowelUrgency - getRandomInt(60, 90));
                member.bladderUrgency = Math.max(0, member.bladderUrgency - getRandomInt(70, 100));
                member.hygiene = Math.max(0, member.hygiene + (member.hygiene < 50 ? -5 : 5)); // Slight hygiene change
                member.energy = Math.max(0, member.energy - 2); // Minor energy cost for the stop
            }
        });
        updateMainUI();
    }

    // --- RANDOM EVENTS ---
    function getAveragePartyHygiene() { const living = party.filter(p=>p.isAlive); if(living.length===0) return 50; return living.reduce((s,p)=>s+p.hygiene,0)/living.length; }
    function selectAndTriggerRandomEvent() {
        const gameState = { party, partyInventory, partyMoney, currentLocationIndex, currentDate, averageHygiene: getAveragePartyHygiene() };
        const possibleEvents = RANDOM_EVENTS_POOL.filter(event => event.canOccur(gameState));
        if (possibleEvents.length === 0) return;
        const totalWeight = possibleEvents.reduce((sum, event) => sum + event.weight, 0);
        let randomNum = Math.random() * totalWeight;
        for (const event of possibleEvents) {
            if (randomNum < event.weight) {
                addLogEntry(`Event: ${event.message}`, "event_title");
                activeEvent = { type: event.id }; // Mark an event is active
                gamePhase = "event_choice"; // Pause normal actions
                event.trigger(gameState); // This might populate eventChoicesAreaEl
                updateMainUI(); // Show event choices, hide travel buttons
                return;
            }
            randomNum -= event.weight;
        }
    }
    function triggerDiseaseOutbreak(gameState) {
        let affectedCount = 0;
        const avgHygiene = gameState.averageHygiene;
        const baseSickChance = avgHygiene < 30 ? 0.4 : (avgHygiene < 50 ? 0.25 : 0.1);
        gameState.party.forEach(member => {
            if (member.isAlive && !member.sickness && Math.random() < baseSickChance) {
                const outbreakDiseases = ["Cholera", "Dysentery"];
                const diseaseToContract = getRandomElement(outbreakDiseases);
                applyDisease(member, diseaseToContract);
                affectedCount++;
            }
        });
        if (affectedCount === 0) { addLogEntry("Party avoided widespread sickness.", "event"); }
        else { addLogEntry(`${affectedCount} member(s) fell ill.`, "event_negative"); }
        cleanupEventUI(); // Auto-resolve this event type
    }
    function triggerHuntingOpportunity(gameState) {
        activeEvent = { type: "hunting_ground", partyHasHunter: party.some(p => p.isAlive && (p.occupationData.passiveEffect === "hunting_bonus_occupation" || p.positiveTraits.some(t=>t.passiveEffect==="hunting_bonus_trait"))) };
        eventChoicesAreaEl.innerHTML = `<p>You've found a promising hunting ground.</p><button id="hunt-yes">Hunt (1 day, ammo)</button> <button id="hunt-no">Ignore</button>`;
        document.getElementById('hunt-yes').addEventListener('click', () => {resolveHunting(true, gameState); cleanupEventUI();});
        document.getElementById('hunt-no').addEventListener('click', () => {addLogEntry("Decided not to hunt.", "event"); cleanupEventUI();});
    }
    function resolveHunting(didHunt, gameState) {
        if (didHunt) {
            if ((gameState.partyInventory.ammo || 0) < 1) { addLogEntry("No ammo left to hunt!", "warning"); return; } // No cleanupEventUI if can't even try
            gameState.partyInventory.ammo--;
            // Simulate a day spent hunting (consume resources, advance date, affect stats)
            currentDate.setDate(currentDate.getDate() + 1);
            consumeResources();
            party.forEach(member => {
                if(member.isAlive) {
                    member.energy = Math.max(0, member.energy - ENERGY_COST_PER_TRAVEL_DAY * 1.2); // Hunting is tiring
                    member.hygiene = Math.max(0, member.hygiene - HYGIENE_LOSS_PER_DAY);
                    updateCharacterStatsForDay(false); // Apply other daily stat changes (not full rest)
                }
            });

            let successChance = 0.3;
            if (activeEvent.partyHasHunter) successChance += 0.3;
            party.forEach(p=>{if(p.isAlive && p.positiveTraits.some(t=>t.passiveEffect==="hunting_bonus_trait")) successChance+=0.15;});
            if (Math.random() < successChance) { const foodGained = getRandomInt(40, 120); gameState.partyInventory.food = (gameState.partyInventory.food || 0) + foodGained; addLogEntry(`Successful hunt! Gained ${foodGained} lbs food.`, "event_positive"); }
            else { addLogEntry("Hunt unsuccessful.", "event_negative"); }
        }
    }
    function triggerRestSpot(gameState, spotName, bonuses) {
        activeEvent = { type: "rest_spot", spotName, bonuses };
        eventChoicesAreaEl.innerHTML = `<p>You found ${spotName}.</p><button id="restspot-yes">Rest here (1 day)</button> <button id="restspot-no">Continue</button>`;
        document.getElementById('restspot-yes').addEventListener('click', () => {resolveRestSpot(true, gameState); cleanupEventUI();});
        document.getElementById('restspot-no').addEventListener('click', () => {addLogEntry(`Decided not to rest at ${spotName}.`, "event"); cleanupEventUI();});
    }
    function resolveRestSpot(didRest, gameState) {
        if (didRest) {
            addLogEntry(`Rested at ${activeEvent.spotName}.`, "event_positive");
            // Apply specific bonuses from the rest spot
            party.forEach(member => {
                if (member.isAlive) {
                    member.health = Math.min(member.maxHealth, member.health + (activeEvent.bonuses.healthBonus || 0));
                    member.energy = Math.min(BASE_ENERGY+10, member.energy + (activeEvent.bonuses.energyBonus || 0));
                    member.hygiene = Math.min(BASE_HYGIENE, member.hygiene + (activeEvent.bonuses.hygieneBonus || 0));
                }
            });
            advanceDay(true); // Then advance day as a normal rest day for other effects
        }
    }
    function cleanupEventUI() {
        activeEvent = null;
        gamePhase = currentRiverCrossing ? "at_landmark" : "traveling"; // Revert to appropriate phase
        eventChoicesAreaEl.innerHTML = '';
        eventChoicesAreaEl.classList.add('hidden');
        updateMainUI();
    }


    // --- MODAL ---
    function openModal(title, contentHtml, isCancellable = true) { modalTitleEl.textContent = title; modalBodyEl.innerHTML = contentHtml; modalCloseButtonEl.style.display = isCancellable ? 'block' : 'none'; modalOverlayEl.classList.remove('hidden'); }
    function closeModal() {
        modalOverlayEl.classList.add('hidden');
        modalBodyEl.innerHTML = '';
        if (activeEvent && activeEvent.onClose) { activeEvent.onClose(); }
        if(!currentRiverCrossing && gamePhase === "event_choice") { // If closed an event modal and not at a river
            cleanupEventUI(); // General cleanup to restore travel buttons etc.
        } else {
            updateMainUI(); // Just update if it was a store or non-event modal
        }
    }

    // --- INVENTORY & MAP ---
    function renderPartyInventoryDetailed() { partyInventoryDetailedEl.innerHTML = ''; const ul = document.createElement('ul'); let hasItems = false; for (const itemId in partyInventory) { if (partyInventory[itemId] > 0) { hasItems = true; const supplyDetails = GAME_SUPPLIES.find(s => s.id === itemId); if (supplyDetails) { const li = document.createElement('li'); li.textContent = `${supplyDetails.name}: ${partyInventory[itemId]} ${supplyDetails.unit.split(' ')[0]}${partyInventory[itemId] > 1 && !supplyDetails.unit.includes('(') ? 's' : ''}`; ul.appendChild(li); } } } if (!hasItems) { partyInventoryDetailedEl.innerHTML = "<p>Your wagon is empty.</p>"; } else { partyInventoryDetailedEl.appendChild(ul); } }
    function renderMapLandmarkList() { mapLandmarkListEl.innerHTML = ''; TRAIL_MAP.forEach((landmark, index) => { const li = document.createElement('li'); li.textContent = `${landmark.name} (${landmark.type})`; if (index === currentLocationIndex) li.classList.add('current-location'); else if (index < currentLocationIndex) li.classList.add('visited-location'); mapLandmarkListEl.appendChild(li); });}

    // --- GAME OVER & COMPLAINTS ---
    function checkGameOverConditions() { if (gamePhase === "game_over") return; if (party.filter(p => p.isAlive).length === 0) { gameOver("All party members have perished."); } else if ((partyInventory.oxen || 0) <= 0 && TRAIL_MAP[currentLocationIndex + 1]) { gameOver("Wagon cannot move without oxen."); } }
    function gameOver(message, isVictory = false) { if (gamePhase === "game_over") return; gamePhase = "game_over"; addLogEntry(message, isVictory ? "victory" : "gameover"); travelDayButtonEl.disabled = true; restDayButtonEl.disabled = true; landmarkSpecificActionsEl.classList.add('hidden'); eventChoicesAreaEl.classList.add('hidden'); bathroomBreakButtonEl.classList.add('hidden'); openModal(isVictory ? "Victory!" : "Game Over", `<p>${message}</p><p>Refresh page to play again.</p>`, false); }
    function generateComplaints() {
        if (complaintCooldown > 0 || activeEvent || currentRiverCrossing) return;
        let complaintMadeThisTurn = false;
        const livingPartyMembers = party.filter(p => p.isAlive); if (livingPartyMembers.length === 0) return;
        const partyHasAdequateClothing = (partyInventory.clothing || 0) >= livingPartyMembers.length;
        livingPartyMembers.forEach(member => {
            if (Math.random() > COMPLAINT_BASE_CHANCE) return;
            let complaint = null, priority = 0;
            if (member.sickness) { if (member.sickness.name === "Dysentery" && member.bowelUrgency > 40 && priority < 10) { complaint = `${member.name}: "This Dysentery... ${getRandomElement(TOILET_COMPLAINTS.bowel[member.toiletMaturity].high)}"`; priority = 10; } else if (member.sickness.name === "Bladder Infection" && member.bladderUrgency > 40 && priority < 10) { complaint = `${member.name}: "My bladder with this infection... ${getRandomElement(TOILET_COMPLAINTS.bladder[member.toiletMaturity].high)}"`; priority = 10; } else if (member.sickness.name === "Cholera" && member.health < 50 && priority < 9) { complaint = `${member.name}: "So weak... this Cholera is draining everything."`; priority = 9; } }
            if (!complaint) { if (member.bowelUrgency > 85 && priority < 8) { complaint = `${member.name}: ${getRandomElement(TOILET_COMPLAINTS.bowel[member.toiletMaturity].high)}`; priority = 8; } else if (member.bowelUrgency > 50 && priority < 5) { complaint = `${member.name}: ${getRandomElement(TOILET_COMPLAINTS.bowel[member.toiletMaturity].moderate)}`; priority = 5; } if (member.bladderUrgency > 85 && priority < 8) { complaint = `${member.name}: ${getRandomElement(TOILET_COMPLAINTS.bladder[member.toiletMaturity].high)}`; priority = 8; } else if (member.bladderUrgency > 50 && priority < 5) { complaint = `${member.name}: ${getRandomElement(TOILET_COMPLAINTS.bladder[member.toiletMaturity].moderate)}`; priority = 5; } }
            if (!complaint) { if (member.health < 25 && priority < 7) { complaint = `${member.name}: "I don't think I can go on much further..."`; priority = 7; } else if (member.energy < 15 && priority < 6) { complaint = `${member.name}: "Just... so... tired... Need to rest."`; priority = 6; } else if (member.hygiene < 20 && priority < 4) { complaint = `${member.name}: "I smell like something died. We all do!"`; priority = 4; } else if (!partyHasAdequateClothing && member.hygiene < 40 && priority < 3) { complaint = `${member.name}: "These clothes are falling apart! I'm covered in grime."`; priority = 3; } else if (!partyHasAdequateClothing && member.health < 60 && priority < 3) { complaint = `${member.name}: "This cold is seeping into my bones without proper clothes."`; priority = 3; } }
            if (distanceTraveledOnLeg < MILES_PER_DAY_NORMAL / 3 && Math.random() < 0.15 && priority < 2) { complaint = `${member.name}: "Are we making any progress at all? This pace is glacial."`; priority = 1; }
            else if (Math.random() < 0.08 && priority < 1) { complaint = `${member.name}: "Endless plains... endless dust. When does it change?"`; priority = 1; }
            else if (Math.random() < 0.05 && priority < 1 && partyInventory.food > livingPartyMembers.length * 10) { complaint = `${member.name}: "Could really go for something other than jerky and hardtack for a change."`; priority = 1;}
            if (complaint) { addLogEntry(complaint, "complaint"); complaintMadeThisTurn = true; }
        });
        if ((partyInventory.food || 0) < livingPartyMembers.length * 2 && Math.random() < 0.5) { const rm = getRandomElement(livingPartyMembers); if (rm) { addLogEntry(`${rm.name}: "If we don't get food, this is it for us!"`, "complaint"); complaintMadeThisTurn = true; } }
        if (!partyHasAdequateClothing && livingPartyMembers.length > 0 && Math.random() < 0.3) { const rm = getRandomElement(livingPartyMembers); if (rm) { addLogEntry(`${rm.name}: "We're all going to freeze or get sick without better clothes!"`, "complaint"); complaintMadeThisTurn = true; } }
        if (complaintMadeThisTurn) complaintCooldown = 1; else if (complaintCooldown > 0) complaintCooldown--;
    }
    function applyDisease(person, diseaseName) { if (person.sickness) return; const diseaseData = DISEASES[diseaseName]; if (diseaseData) { person.sickness = { name: diseaseName, daysSick: 0, duration: diseaseData.duration(), definition: diseaseData }; addLogEntry(`${person.name} contracted ${diseaseName}!`, "sickness"); } }

    // --- MAIN UI UPDATE FUNCTION ---
    function updateMainUI() {
        if (gamePhase === "game_over") return;
        updateHeaderStatus(); renderPartyRosterCondensed(); renderCharacterDetailView();
        const currentLoc = TRAIL_MAP[currentLocationIndex]; const nextLoc = TRAIL_MAP[currentLocationIndex + 1];
        if (nextLoc) { nextLandmarkNameEl.textContent = nextLoc.name; distanceToNextEl.textContent = `${Math.max(0, currentLoc.distanceToNext - distanceTraveledOnLeg)} miles`; }
        else { nextLandmarkNameEl.textContent = "Journey's End!"; distanceToNextEl.textContent = "0 miles"; }
        const isAtLandmark = gamePhase === "at_landmark";
        const showTravelButtons = gamePhase === "traveling" && !activeEvent && !currentRiverCrossing;

        travelDayButtonEl.classList.toggle('hidden', !showTravelButtons); travelDayButtonEl.disabled = !showTravelButtons;
        restDayButtonEl.classList.toggle('hidden', (!showTravelButtons && !isAtLandmark) || activeEvent || currentRiverCrossing); restDayButtonEl.disabled = (!showTravelButtons && !isAtLandmark) || activeEvent || currentRiverCrossing;

        const highUrgency = party.some(p => p.isAlive && (p.bowelUrgency > 70 || p.bladderUrgency > 70));
        const canTakeBreak = (gamePhase === "traveling" || (isAtLandmark && !currentRiverCrossing)) && !activeEvent;
        bathroomBreakButtonEl.classList.toggle('hidden', !canTakeBreak);
        // Enable bathroom break if high urgency, or if at a non-river landmark (can take break while deciding what to do),
        // or if just generally traveling. Disable during active events/river crossing.
        // The 'isResting' concept is tied to advanceDay, so not directly usable for button state here.
        bathroomBreakButtonEl.disabled = !canTakeBreak || (gamePhase === "traveling" && !highUrgency && !(isAtLandmark && !currentRiverCrossing) );


        landmarkSpecificActionsEl.classList.toggle('hidden', !isAtLandmark || activeEvent || currentRiverCrossing);
        if (isAtLandmark && !currentRiverCrossing) { visitStoreButtonEl.classList.toggle('hidden', !(currentLoc.services?.some(s => s.startsWith("shop_")))); const contBtn = document.getElementById('continue-from-landmark-button'); if (contBtn) contBtn.classList.remove('hidden');}
        else if (!currentRiverCrossing) { const contBtn = document.getElementById('continue-from-landmark-button'); if (contBtn) contBtn.classList.add('hidden'); }

        eventChoicesAreaEl.classList.toggle('hidden', !activeEvent && !currentRiverCrossing);
        if(currentRiverCrossing && !activeEvent && gamePhase === "at_landmark") { renderRiverCrossingOptions(); } // Show river options if at river and no other event

        renderPartyInventoryDetailed(); renderMapLandmarkList(); generateComplaints();
    }

    // --- INITIALIZATION ---
    function init() {
        tabsContainerEl.querySelectorAll('.tab-button').forEach(button => { button.addEventListener('click', () => { if (button.dataset.tab === "setup" && gamePhase !== "setup") return; switchTab(button.dataset.tab); }); });
        generateDrafteesButtonEl.addEventListener('click', () => { availableDraftees = []; for (let i = 0; i < NUM_DRAFTEES_TO_GENERATE; i++) availableDraftees.push(generateRandomPerson()); updateSetupScreen(); });
        startJourneyButtonEl.addEventListener('click', embarkJourney);
        travelDayButtonEl.addEventListener('click', travelOneDay);
        restDayButtonEl.addEventListener('click', restOneDay);
        visitStoreButtonEl.addEventListener('click', () => {
            const currentLoc = TRAIL_MAP[currentLocationIndex]; const shopType = currentLoc.services?.find(s => s.startsWith("shop_"));
            if (shopType && SHOP_INVENTORIES[shopType]) { const storeHtml = `<div class="money-display">Your Money: $<span id="fort-store-money-display">${partyMoney.toFixed(2)}</span></div><div id="fort-supply-list-modal"></div><p id="fort-store-message" style="text-align:center; color:green; margin-top:10px;"></p>`; openModal(`${currentLoc.name} Store`, storeHtml); const fortSupplyListModalEl = document.getElementById('fort-supply-list-modal'); if (fortSupplyListModalEl) { renderSuppliesStoreUI(fortSupplyListModalEl, SHOP_INVENTORIES[shopType], true, 'fort'); } else { console.error("#fort-supply-list-modal not found."); } }
            else { openModal("Store Closed", "<p>No store available here.</p>"); }
        });

        bathroomBreakButtonEl.id = 'bathroom-break-button'; bathroomBreakButtonEl.textContent = 'Take a Break'; bathroomBreakButtonEl.title = 'Allow party to relieve themselves.';
        const travelActionsDiv = document.getElementById('travel-actions'); if (travelActionsDiv) { travelActionsDiv.appendChild(bathroomBreakButtonEl); bathroomBreakButtonEl.addEventListener('click', handleBathroomBreak); }

        let continueBtn = document.getElementById('continue-from-landmark-button');
        if(!continueBtn && landmarkSpecificActionsEl) { continueBtn = document.createElement('button'); continueBtn.id = 'continue-from-landmark-button'; continueBtn.textContent = 'Continue Journey'; continueBtn.classList.add('hidden'); continueBtn.addEventListener('click', handleContinueJourneyFromLandmark); landmarkSpecificActionsEl.appendChild(continueBtn); }

        modalCloseButtonEl.addEventListener('click', closeModal); modalOverlayEl.addEventListener('click', (e) => { if (e.target === modalOverlayEl) closeModal(); });
        party = []; availableDraftees = []; nextPersonId = 0; partyMoney = STARTING_MONEY;
        GAME_SUPPLIES.forEach(supply => { partyInventory[supply.id] = 0; });
        currentDate = new Date(1848, 3, 1); currentLocationIndex = 0; distanceTraveledOnLeg = 0;
        complaintCooldown = 0; selectedCharacterId = null; activeEvent = null; currentRiverCrossing = null; gamePhase = "setup";
        if(gameLogEl) gameLogEl.innerHTML = '<p>Welcome! Assemble your party and prepare for the journey.</p>';
        if(maxPartySizeDisplayEl) maxPartySizeDisplayEl.textContent = MAX_PARTY_SIZE;
        for (let i = 0; i < NUM_DRAFTEES_TO_GENERATE; i++) availableDraftees.push(generateRandomPerson());
        renderInitialSupplies(); updateSetupScreen(); renderPartyInventoryDetailed(); renderMapLandmarkList();
        switchTab('setup'); if(tabButtonSetupEl) tabButtonSetupEl.classList.remove('hidden');
        if(landmarkSpecificActionsEl) landmarkSpecificActionsEl.classList.add('hidden');
        if(eventChoicesAreaEl) eventChoicesAreaEl.classList.add('hidden');
        updateMainUI();
    }
    init();
});
