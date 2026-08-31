import type { Faction, FactionId, Npc, WorldLocation } from "./types";

export const FACTIONS: Record<FactionId, Faction> = {
  ravensfell: {
    id: "ravensfell",
    name: "Ravensfell",
    house: "House Corvane",
    color: "#6b6f9c",
    banner: "house-ravensfell",
    capital: "corvane_keep",
    lordId: "lord_corvane",
    blurb: "Old blood, older debts. Holds the northern moors and the loyalist claim.",
    strength: 62,
    treasury: 1400,
  },
  goldmere: {
    id: "goldmere",
    name: "Goldmere",
    house: "House Vantry",
    color: "#c9a227",
    banner: "house-goldmere",
    capital: "vantry_hall",
    lordId: "lord_vantry",
    blurb: "Bankers with a banner. Buys wars it never fights.",
    strength: 48,
    treasury: 4200,
  },
  ironpact: {
    id: "ironpact",
    name: "The Iron Pact",
    house: "House Draeven",
    color: "#8a5b4d",
    banner: "house-ironpact",
    capital: "draeven_hold",
    lordId: "lord_draeven",
    blurb: "Mining oath-brotherhoods turned standing army. The usurper's power base.",
    strength: 88,
    treasury: 2100,
  },
  sunmarch: {
    id: "sunmarch",
    name: "Sunmarch",
    house: "House Aleyne",
    color: "#d98032",
    banner: "house-sunmarch",
    capital: "aleyne_citadel",
    lordId: "lady_aleyne",
    blurb: "Vineyards, cavalry, and an unshakeable belief in their own manners.",
    strength: 70,
    treasury: 2600,
  },
  thornwold: {
    id: "thornwold",
    name: "Thornwold",
    house: "House Brannoc",
    color: "#4d7c52",
    banner: "house-thornwold",
    capital: "brannoc_stockade",
    lordId: "lord_brannoc",
    blurb: "Forest clans under one grudging banner. Excellent archers, terrible diplomats.",
    strength: 55,
    treasury: 900,
  },
  freeholds: {
    id: "freeholds",
    name: "The Free Holds",
    house: "The Reeve's Council",
    color: "#7a8b99",
    banner: "house-freeholds",
    capital: "cassock_town",
    lordId: "reeve_ilsa",
    blurb: "Charter towns with no lord and a great many opinions.",
    strength: 34,
    treasury: 1800,
  },
};

export const FACTION_IDS = Object.keys(FACTIONS) as FactionId[];

const L = (l: WorldLocation) => l;

export const LOCATIONS: Record<string, WorldLocation> = Object.fromEntries(
  [
    /* ---- Ravensfell (north-west) ---- */
    L({ id: "corvane_keep", name: "Corvane Keep", kind: "castle", faction: "ravensfell", x: 18, y: 14, links: ["oakhollow", "greyfen", "moorwatch", "cairn_road"], blurb: "Black stone on a black hill. The ravens are real and unionised.", shop: ["arming_sword", "mail_shirt", "strong_tonic", "silver_ring"], npcs: ["lord_corvane", "lady_seren"], recruits: ["squire", "warrior"] }),
    L({ id: "oakhollow", name: "Oakhollow", kind: "village", faction: "ravensfell", x: 26, y: 22, links: ["corvane_keep", "greyfen", "millford", "barrow_wood"], blurb: "Where you arrived, broke. The innkeeper remembers.", shop: ["poultice", "gambeson", "rusty_sword", "poem_scroll"], npcs: ["bram_carter", "sister_dulcie"], recruits: ["scout"] }),
    L({ id: "greyfen", name: "Greyfen", kind: "village", faction: "ravensfell", x: 12, y: 26, links: ["corvane_keep", "oakhollow", "drowned_chapel"], blurb: "Half marsh, half village, entirely damp.", shop: ["poultice", "hunting_bow"], recruits: ["archer"] }),
    L({ id: "moorwatch", name: "Moorwatch", kind: "village", faction: "ravensfell", x: 24, y: 6, links: ["corvane_keep", "north_barrows"], blurb: "A beacon tower and forty people who resent lighting it." }),
    L({ id: "millford", name: "Millford", kind: "village", faction: "ravensfell", x: 34, y: 30, links: ["oakhollow", "cassock_town", "bandit_stones"], blurb: "Grain, gossip, and a mill wheel that screams." }),

    /* ---- Goldmere (centre-east) ---- */
    L({ id: "vantry_hall", name: "Vantry Hall", kind: "castle", faction: "goldmere", x: 66, y: 26, links: ["silverbrook", "coinmoor", "cassock_town", "counting_ruin"], blurb: "Less a fortress, more a very defensible bank.", shop: ["plate_harness", "oath_blade", "falcon_hood", "strong_tonic"], npcs: ["lord_vantry", "ser_isolde"], recruits: ["warrior", "healer"] }),
    L({ id: "silverbrook", name: "Silverbrook", kind: "village", faction: "goldmere", x: 74, y: 18, links: ["vantry_hall", "east_shrine"], blurb: "Trout, tolls, and a suspicious number of goldsmiths.", shop: ["silver_ring", "luck_charm", "poultice"] }),
    L({ id: "coinmoor", name: "Coinmoor", kind: "village", faction: "goldmere", x: 72, y: 36, links: ["vantry_hall", "hollow_mine", "aleyne_citadel"], blurb: "Named optimistically. Mostly heather.", shop: ["poultice", "gambeson"] }),
    L({ id: "cassock_town", name: "Cassock Town", kind: "castle", faction: "freeholds", x: 50, y: 32, links: ["millford", "vantry_hall", "briar_cross", "brannoc_stockade", "old_toll_bridge"], blurb: "Charter town, walled and smug. The Reeve's Council argues here nightly.", shop: ["arming_sword", "ranger_cloak", "strong_tonic", "poem_scroll"], npcs: ["reeve_ilsa", "osrick_quill"], recruits: ["scout", "archer", "healer"] }),

    /* ---- Iron Pact (south-east) ---- */
    L({ id: "draeven_hold", name: "Draeven Hold", kind: "castle", faction: "ironpact", x: 74, y: 66, links: ["slagfoot", "emberdown", "hollow_mine", "black_stair"], blurb: "Smoke, hammers, and a lord who calls his throne a workbench.", shop: ["war_axe", "plate_harness", "strong_tonic"], npcs: ["lord_draeven", "captain_maud", "the_fen_widow"], recruits: ["warrior", "squire"] }),
    L({ id: "slagfoot", name: "Slagfoot", kind: "village", faction: "ironpact", x: 84, y: 58, links: ["draeven_hold", "cinder_pits"], blurb: "The air tastes of coins. Nobody here is paid in coins.", shop: ["mail_shirt", "poultice"] }),
    L({ id: "emberdown", name: "Emberdown", kind: "village", faction: "ironpact", x: 66, y: 76, links: ["draeven_hold", "south_marsh", "sunken_fort"], blurb: "Charcoal burners with strong opinions on taxation." }),
    L({ id: "hollow_mine", name: "The Hollow Mine", kind: "dungeon", faction: "ironpact", x: 80, y: 46, links: ["coinmoor", "draeven_hold"], blurb: "Dug too deep, too fast, for a war nobody declared.", danger: 3, depth: 4 }),
    L({ id: "cinder_pits", name: "Cinder Pits", kind: "dungeon", faction: "ironpact", x: 92, y: 66, links: ["slagfoot"], blurb: "Where the Pact buries what it melts.", danger: 5, depth: 5 }),

    /* ---- Sunmarch (south-centre) ---- */
    L({ id: "aleyne_citadel", name: "Aleyne Citadel", kind: "castle", faction: "sunmarch", x: 60, y: 50, links: ["coinmoor", "vinehill", "roseford", "briar_cross"], blurb: "White walls, better wine, a lady who duels for sport.", shop: ["oath_blade", "ranger_cloak", "falcon_hood", "strong_tonic"], npcs: ["lady_aleyne", "ser_perrin"], recruits: ["warrior", "archer"] }),
    L({ id: "vinehill", name: "Vinehill", kind: "village", faction: "sunmarch", x: 54, y: 60, links: ["aleyne_citadel", "south_marsh"], blurb: "Terraces of vines and a festival for absolutely any reason.", shop: ["poultice", "poem_scroll", "silver_ring"] }),
    L({ id: "roseford", name: "Roseford", kind: "village", faction: "sunmarch", x: 68, y: 56, links: ["aleyne_citadel", "sunken_fort"], blurb: "Famous for its bridge, its roses, and one very old grudge." }),
    L({ id: "briar_cross", name: "Briar Cross", kind: "village", faction: "sunmarch", x: 50, y: 44, links: ["cassock_town", "aleyne_citadel", "gallows_oak"], blurb: "Four roads, one inn, endless rumours.", shop: ["poultice", "luck_charm"], recruits: ["scout"] }),

    /* ---- Thornwold (south-west) ---- */
    L({ id: "brannoc_stockade", name: "Brannoc Stockade", kind: "castle", faction: "thornwold", x: 30, y: 52, links: ["cassock_town", "elmswatch", "harrow_glen", "green_shrine"], blurb: "Timber walls, thirty clan banners, one exhausted chieftain.", shop: ["hunting_bow", "ranger_cloak", "poultice"], npcs: ["lord_brannoc", "hana_of_the_glen"], recruits: ["archer", "scout"] }),
    L({ id: "elmswatch", name: "Elmswatch", kind: "village", faction: "thornwold", x: 22, y: 44, links: ["brannoc_stockade", "barrow_wood"], blurb: "Treehouse granaries. Surprisingly practical." }),
    L({ id: "harrow_glen", name: "Harrow Glen", kind: "village", faction: "thornwold", x: 34, y: 64, links: ["brannoc_stockade", "wolfden", "south_marsh"], blurb: "The glen where the clans still hold the moot.", shop: ["poultice", "hunting_bow"] }),
    L({ id: "wolfden", name: "Wolfden", kind: "dungeon", faction: "thornwold", x: 26, y: 74, links: ["harrow_glen"], blurb: "A cave system, a wolf cult, and a great deal of gnawed furniture.", danger: 2, depth: 3 }),

    /* ---- Free Holds & neutral roads ---- */
    L({ id: "old_toll_bridge", name: "Old Toll Bridge", kind: "landmark", faction: "freeholds", x: 44, y: 26, links: ["cassock_town", "barrow_wood", "counting_ruin"], blurb: "Three separate parties claim the toll. All of them are armed." }),
    L({ id: "gallows_oak", name: "Gallows Oak", kind: "landmark", faction: null, x: 44, y: 52, links: ["briar_cross", "south_marsh", "green_shrine"], blurb: "A tree with a career. Travellers leave coins in the roots." }),
    L({ id: "cairn_road", name: "Cairn Road", kind: "landmark", faction: null, x: 10, y: 8, links: ["corvane_keep", "north_barrows"], blurb: "Stone piles marking older dead than anyone's grievance." }),

    /* ---- Dungeons / POI ---- */
    L({ id: "barrow_wood", name: "Barrow Wood", kind: "dungeon", faction: null, x: 34, y: 40, links: ["oakhollow", "elmswatch", "old_toll_bridge"], blurb: "Grave-mounds under old oaks. Something down there counts visitors.", danger: 1, depth: 3 }),
    L({ id: "north_barrows", name: "The North Barrows", kind: "dungeon", faction: null, x: 16, y: 2, links: ["moorwatch", "cairn_road"], blurb: "Frost, kings, and the poor manners of both.", danger: 4, depth: 4 }),
    L({ id: "drowned_chapel", name: "Drowned Chapel", kind: "ruin", faction: null, x: 4, y: 34, links: ["greyfen"], blurb: "A spire in the fen. The bell still rings at the wrong hours.", danger: 3, depth: 3 }),
    L({ id: "bandit_stones", name: "Standing Stones Camp", kind: "camp", faction: null, x: 40, y: 18, links: ["millford"], blurb: "Brigands squatting in a monument they can't pronounce.", danger: 2, depth: 2 }),
    L({ id: "counting_ruin", name: "The Counting Ruin", kind: "ruin", faction: null, x: 58, y: 20, links: ["vantry_hall", "old_toll_bridge"], blurb: "A burned tax house. Someone kept the ledgers anyway.", danger: 2, depth: 3 }),
    L({ id: "east_shrine", name: "Shrine of the Still Water", kind: "shrine", faction: null, x: 86, y: 12, links: ["silverbrook"], blurb: "Leave a coin, take a blessing, ask no questions." }),
    L({ id: "green_shrine", name: "Green Shrine", kind: "shrine", faction: null, x: 38, y: 56, links: ["brannoc_stockade", "gallows_oak"], blurb: "Moss, antlers, and a keeper who talks to the moss." }),
    L({ id: "sunken_fort", name: "Sunken Fort", kind: "dungeon", faction: null, x: 76, y: 78, links: ["emberdown", "roseford"], blurb: "A border fort the marsh ate. The garrison never marched out.", danger: 4, depth: 4 }),
    L({ id: "south_marsh", name: "Ashen Marsh", kind: "landmark", faction: null, x: 48, y: 68, links: ["vinehill", "emberdown", "harrow_glen", "gallows_oak"], blurb: "Flat, grey, and full of things that were once soldiers." }),
    L({ id: "black_stair", name: "The Black Stair", kind: "dungeon", faction: "ironpact", x: 88, y: 84, links: ["draeven_hold"], blurb: "Steps cut down into the rock by no recorded hand.", danger: 6, depth: 6 }),
  ].map((l) => [l.id, l]),
);

export const LOCATION_IDS = Object.keys(LOCATIONS);

export const NPCS: Record<string, Npc> = Object.fromEntries(
  (
    [
      { id: "lord_corvane", name: "Aldric Corvane", title: "Lord of Ravensfell", role: "lord", faction: "ravensfell", portrait: "device-1", personality: "Weary, principled, allergic to flattery.", home: "corvane_keep", blurb: "Holds the loyalist claim and knows exactly what it costs." },
      { id: "lady_seren", name: "Seren Corvane", title: "Heir of Ravensfell", role: "heir", faction: "ravensfell", portrait: "device-2", personality: "Dry wit, ruthless strategist, terrible at small talk.", eligible: true, home: "corvane_keep", blurb: "Would run the war better than her father and everyone knows it." },
      { id: "lord_vantry", name: "Hollis Vantry", title: "Lord Treasurer of Goldmere", role: "lord", faction: "goldmere", portrait: "device-3", personality: "Genial, transactional, never says no directly.", home: "vantry_hall", blurb: "Funds both sides and calls it prudence." },
      { id: "ser_isolde", name: "Ser Isolde Marr", title: "Sword of Goldmere", role: "retainer", faction: "goldmere", portrait: "device-4", personality: "Blunt, loyal to contracts, secretly sentimental.", eligible: true, home: "vantry_hall", blurb: "Paid to fight, stays for the reasons." },
      { id: "lord_draeven", name: "Corvus Draeven", title: "Hammer of the Iron Pact", role: "usurper", faction: "ironpact", portrait: "device-5", personality: "Charming, patient, absolutely certain he is the cure.", home: "draeven_hold", blurb: "The usurper. Believes the realm is a broken tool he can reforge." },
      { id: "captain_maud", name: "Maud Kell", title: "Captain of the Ash Company", role: "retainer", faction: "ironpact", portrait: "device-6", personality: "Professional, grim, funnier than she intends.", home: "draeven_hold", blurb: "Draeven's lieutenant. Follows orders until the day she doesn't." },
      { id: "the_fen_widow", name: "The Fen Widow", title: "Draeven's Whisper", role: "rogue", faction: "ironpact", portrait: "device-7", personality: "Soft-spoken, poisonous, oddly polite.", home: "draeven_hold", blurb: "Nobody agrees on her real name. Everyone agrees on her results." },
      { id: "lady_aleyne", name: "Ysolt Aleyne", title: "Lady of Sunmarch", role: "lord", faction: "sunmarch", portrait: "device-8", personality: "Immaculate manners, duelling scars, zero patience.", eligible: true, home: "aleyne_citadel", blurb: "Rides at the front and expects you to keep up." },
      { id: "ser_perrin", name: "Ser Perrin Hale", title: "Master of Horse", role: "retainer", faction: "sunmarch", portrait: "device-1", personality: "Cheerful, gossipy, deadly with a lance.", home: "aleyne_citadel", blurb: "Knows every scandal in the realm and shares most of them." },
      { id: "lord_brannoc", name: "Gwyth Brannoc", title: "Chieftain of Thornwold", role: "lord", faction: "thornwold", portrait: "device-2", personality: "Suspicious of walls, roads, and promises.", home: "brannoc_stockade", blurb: "Speaks for thirty clans who agree on nothing." },
      { id: "hana_of_the_glen", name: "Hana of the Glen", title: "Bow of Thornwold", role: "retainer", faction: "thornwold", portrait: "device-3", personality: "Quiet, wry, watches everything.", eligible: true, home: "brannoc_stockade", blurb: "Could end the war with one arrow and won't, on principle." },
      { id: "reeve_ilsa", name: "Ilsa Farr", title: "First Reeve of the Free Holds", role: "lord", faction: "freeholds", portrait: "device-4", personality: "Pragmatic, sardonic, allergic to titles.", home: "cassock_town", blurb: "Runs the charter towns by exhausting everyone else in the room." },
      { id: "osrick_quill", name: "Osrick Quill", title: "Disgraced Clerk", role: "commoner", faction: "freeholds", portrait: "device-5", personality: "Nervous, precise, hoards receipts like relics.", home: "cassock_town", blurb: "Kept copies of the ledgers that could hang a lord." },
      { id: "bram_carter", name: "Bram Carter", title: "Carter of Oakhollow", role: "commoner", faction: "ravensfell", portrait: "device-6", personality: "Relentlessly cheerful, dreadful singer.", home: "oakhollow", blurb: "The first person in the realm to do you a favour." },
      { id: "sister_dulcie", name: "Sister Dulcie", title: "Keeper of the Oakhollow Shrine", role: "cleric", faction: null, portrait: "device-7", personality: "Kind, blunt, keeps a knife under the altar cloth.", home: "oakhollow", blurb: "Mends bodies, then tells them exactly what they did wrong." },
    ] as Npc[]
  ).map((n) => [n.id, n]),
);

export function relKey(a: FactionId, b: FactionId): string {
  return [a, b].sort().join("|");
}

export function locationsOf(faction: FactionId): WorldLocation[] {
  return Object.values(LOCATIONS).filter((l) => l.faction === faction);
}
