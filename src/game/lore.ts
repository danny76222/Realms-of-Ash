import type { FactionId } from "./types";

export interface LoreEntry {
  year: string;
  title: string;
  text: string;
}

/** The long history of the realm, told the way a tavern chronicler would tell it. */
export const REALM_HISTORY: LoreEntry[] = [
  {
    year: "Ash Reckoning 0",
    title: "The Burning of the Old Crown",
    text: "The last High King, Aeloch the Twice-Crowned, died in a hall fire nobody has ever satisfactorily explained. His line ended with him; the realm began counting years from the smoke. Every house present that night swears it was elsewhere.",
  },
  {
    year: "AR 4",
    title: "The Charter of Six Seals",
    text: "Rather than fight, six powers signed a charter: Ravensfell to keep the crown's laws, Goldmere to keep its accounts, Sunmarch to keep its roads, Thornwold to keep its woods, the Iron Pact to keep its mines, and the Free Holds to keep quiet. Only one of those promises was kept.",
  },
  {
    year: "AR 19",
    title: "The Toll Wars",
    text: "A dispute over the Old Toll Bridge became eleven years of small, spiteful campaigns. Nobody won. Sunmarch lost its cavalry reputation, Thornwold gained one, and Goldmere quietly bought the debts of both.",
  },
  {
    year: "AR 33",
    title: "The Hollow Mine Rush",
    text: "Iron and silver were struck beneath the eastern hills. The mining oath-brotherhoods grew rich, then armed, then organised. House Draeven, once a family of pit-captains, was suddenly the only house with a standing army that trained all year round.",
  },
  {
    year: "AR 38",
    title: "The Winter of Bad Grain",
    text: "Two harvests failed. Villages emptied westward. The roads filled with people who had been farmers in autumn and were bandits by spring — a problem no house has yet solved, and several quietly profit from.",
  },
  {
    year: "AR 41",
    title: "The Council That Agreed On Nothing",
    text: "The houses met at Cassock Town to appoint a regent and restore a crown. Twelve days of argument produced one signed document: the bill for the food. Corvus Draeven attended, said almost nothing, and left with a list of everyone's weaknesses.",
  },
  {
    year: "AR 42 — now",
    title: "Ashes on the Road",
    text: "Villages burn on the Oakhollow road and no lord claims the torches. Companies of masterless soldiers ride under an ash-grey banner. And you arrive in the middle of it with a sword, a name, and no particular plan.",
  },
];

/** How the usurper got where he is — a deliberately unflattering account. */
export const USURPER_RISE: LoreEntry[] = [
  {
    year: "The Pit-Captain",
    title: "A useful man",
    text: "Corvus Draeven began as a mine overseer with a talent for making impossible quotas and keeping his crews alive. Both facts made him beloved below ground and underestimated above it.",
  },
  {
    year: "The Debt",
    title: "Buying the ledger",
    text: "When Goldmere bought up the Toll War debts, Draeven bought the debts of the debtors: farm loans, garrison wages, widow's pensions. He rarely collects. He simply remembers.",
  },
  {
    year: "The Ash Company",
    title: "An army that never disbands",
    text: "He gathered masterless soldiers into the Ash Company under Captain Maud Kell, paid them through winter, and made desertion pointless. It is the only force in the realm that has never gone home for the harvest.",
  },
  {
    year: "The Whisper",
    title: "Quiet arrangements",
    text: "The Fen Widow began appearing where inconvenient people had recently stopped being inconvenient. No house can prove anything. Every house has changed its habits.",
  },
  {
    year: "The Claim",
    title: "A crown by argument",
    text: "Draeven does not claim descent from Aeloch. He claims something more dangerous: that descent is irrelevant, the charter has failed, and the realm should belong to whoever can actually make the roads safe. Alarming numbers of ordinary people agree with him.",
  },
  {
    year: "The Fires",
    title: "The proof he needs",
    text: "Burnt villages make his argument for him. Whether he orders the torches, tolerates them, or merely arrives afterwards with grain and soldiers is the question the whole campaign turns on — and the one you will be asked to answer.",
  },
];

export interface CourtFigure {
  name: string;
  role: string;
  note: string;
}

export interface FactionLore {
  motto: string;
  history: string;
  /** The ruling line, told as succession rather than a family tree. */
  lineage: string;
  /** Who actually holds power at court, and what they are quarrelling about. */
  court: CourtFigure[];
  /** The quarrel that will decide how the house acts when you ask it to. */
  faultline: string;
  goal: string;
  wants: string;
  fears: string;
  stance: string;
}

/** What each house actually wants, so choosing a side means something. */
export const FACTION_LORE: Record<FactionId, FactionLore> = {
  ravensfell: {
    motto: "\"The law outlives the lawgiver.\"",
    history:
      "The oldest sworn house, keepers of the crown's records since before the fire. Their moors are poor and their archives are immaculate, which tells you most of what you need to know about them.",
    lineage:
      "House Corvane has held the moors for eleven generations, since Corvane the Reeve was given the crown's records to keep because nobody else could read them. Aldric is the fourth Corvane to be called \"the Patient\" and the first to be called it unkindly. His heir died at the Toll Bridge; the claim now falls to his niece Seren, which half the household refuses to say aloud.",
    court: [
      { name: "Lady Seren Corvane", role: "Heir presumptive", note: "Runs the archive and, quietly, the house. Wants the coalition built now, while there is still a realm to crown." },
      { name: "Chancellor Elber Vayne", role: "Keeper of Seals", note: "Has ruled every proposal since AR 33 procedurally out of order. Believes the charter cannot fail, only be misapplied." },
      { name: "Ser Anselm Rook", role: "Master of the Moor Guard", note: "Three hundred spears and a grudge about their wages. Loyal to Aldric personally, not to the archive." },
    ],
    faultline:
      "Aldric wants proof before he moves; Seren thinks proof arrives after the war, not before it. Whichever of them you convince, the other remembers.",
    goal: "Restore a lawful crown — even a weak one — before the charter collapses entirely.",
    wants: "Proof. Witnesses, ledgers, sealed confessions. Aldric Corvane will not move on rumour, however loudly the roads burn.",
    fears: "That the realm decides legitimacy is a luxury and hands the crown to whoever feeds it.",
    stance: "The loyalist claim. Backing Ravensfell means coalition-building, slow diplomacy, and asking five proud houses to take orders.",
  },
  goldmere: {
    motto: "\"Everything is a rate of interest.\"",
    history:
      "House Vantry started as toll-farmers and ended up owning the tolls, the roads, and most of the people who complain about both. They have never lost a war, having never fought one.",
    lineage:
      "House Vantry are toll-farmers who married upward four times in eighty years and never once fought for a title they could purchase. Hollis is the third Vantry to run the counting-house and the first to inherit it without a lawsuit — his elder sister Ottiline signed away her claim for a river and two ports, and is still ahead on the deal.",
    court: [
      { name: "Ottiline Vantry", role: "Mistress of the River Ports", note: "Holds the northern trade on her own account. Sells to whoever Hollis refuses, out of habit." },
      { name: "Factor Meech", role: "Chief of the Ledger", note: "Owns copies of every debt in the realm. Has never taken a side and has never been on the losing one." },
      { name: "The Caravan Masters' Table", role: "Twelve voting merchants", note: "Pay Goldmere's soldiers. Will unseat any Vantry who lets the roads close for a season." },
    ],
    faultline:
      "Hollis wants a crown in his debt; the Caravan Masters want the roads open this month. A long war serves one and ruins the other.",
    goal: "Keep the trade routes open and end up creditor to whoever wins.",
    wants: "Returns. Hollis Vantry pays generously for stability, escorted caravans, and information before anyone else has it.",
    fears: "A victor with no debts — a crown that owes Goldmere nothing has no reason to listen to it.",
    stance: "Funds both sides. Goldmere gold can arm a coalition overnight, or bankroll a usurper who promises better terms.",
  },
  ironpact: {
    motto: "\"A realm is a tool. Tools are reforged.\"",
    history:
      "Mining oath-brotherhoods who swore to each other before they ever swore to a crown. Wealth from the deep seams turned pit-crews into companies and companies into the only year-round army in the realm.",
    lineage:
      "The Pact has no lineage and says so loudly — oath-brotherhoods elect their captains and bury them without monuments. Corvus Draeven is the first man to hold all seven brotherhoods at once, and he did it by paying off their debts, not by winning a vote. His son died in the Hollow Mine collapse of AR 36. He has never named another heir, which is either humility or a threat.",
    court: [
      { name: "Captain Maud Kell", role: "Commander, Ash Company", note: "The army's real owner. Follows Draeven's plan, not his person, and has said so to his face." },
      { name: "The Fen Widow", role: "Whatever is required", note: "Answers to Draeven alone. The brotherhoods pretend she is a rumour." },
      { name: "Foreman Halgi Stone", role: "Speaker of the Seven", note: "Won his seat by arguing that a crown is just a very large contract. Will hold Draeven to it." },
    ],
    faultline:
      "Draeven wants a throne by consent; Maud and the Widow have different ideas about what to do when consent runs short. That gap is where the burnt villages sit.",
    goal: "Sweep away the charter and put Corvus Draeven on a rebuilt throne, by consent if possible.",
    wants: "Competence and quiet. Draeven rewards people who solve problems and does not ask how.",
    fears: "That the fires are traced to his hand before he is crowned — his whole claim rests on being the cure, not the disease.",
    stance: "The usurper's power base. Siding with the Pact is fast, well-paid and genuinely effective, and costs you the people who trusted you.",
  },
  sunmarch: {
    motto: "\"Manners are a kind of armour.\"",
    history:
      "Vineyards, white walls, and the finest heavy horse in the realm, ruined once at the Toll Bridge and rebuilt out of sheer embarrassment. House Aleyne has an opinion about how everything should be done, including this.",
    lineage:
      "House Aleyne descends from the last High King's horse-marshal, a fact recited at every dinner since AR 0. Lady Verity Aleyne took the seat at twenty-six when her father rode into the Toll Bridge disaster and only his banner came back. She has rebuilt the heavy horse from ninety riders to nine hundred and refuses to spend them on anything small.",
    court: [
      { name: "Ser Perrin Aleyne", role: "Her brother, Master of Horse", note: "Adored by the riders, tolerated by his sister. Would charge for any cause with a good speech attached." },
      { name: "Dame Ottoline Verre", role: "Mistress of Protocol", note: "Decides who is insulted and how badly. More dangerous than the cavalry." },
      { name: "The Vineyard Houses", role: "Six lesser families", note: "Pay for the horses. Increasingly loud about what they are getting for it." },
    ],
    faultline:
      "Verity will not ride until the cause flatters Sunmarch; Perrin would ride tomorrow. Court every duel and oath and the house follows — press it and Ottoline finds you unforgivably rude.",
    goal: "Be recognised as first among the houses — and let a crown happen around that fact.",
    wants: "Honour observed. Lady Aleyne notices duels answered, oaths kept and insults returned promptly.",
    fears: "Irrelevance. Being remembered as the house that had the best cavalry and never used it.",
    stance: "The swing vote. Sunmarch riders can break a field, but only for a cause that flatters them.",
  },
  thornwold: {
    motto: "\"The wood remembers who cut it.\"",
    history:
      "Thirty forest clans hammered into one banner by Lord Brannoc, who spends more effort holding his own moot together than fighting anyone else. Their archers are the finest in the realm and would rather be at home.",
    lineage:
      "Thornwold has no royal line, only Brannoc, who hammered thirty clans into a banner and has spent twenty years keeping them there. Clan Ashroot and Clan Fennick have each murdered the other's chief within living memory. Brannoc's authority is a truce that has been renewed thirty-one times and could fail at any moot.",
    court: [
      { name: "Hana of the Glen", role: "Voice of the young clans", note: "Wants the wood defended forward, on the roads, not behind the treeline. Half the moot agrees; Brannoc does not." },
      { name: "Old Fennick", role: "Clan chief, eldest seat", note: "Remembers the Toll Wars and votes against everything that resembles them." },
      { name: "The Charcoal Petition", role: "A standing grievance", note: "Three clans already sell to Iron Pact forges. Brannoc pretends not to know their names." },
    ],
    faultline:
      "Brannoc's truce holds only while nobody makes the clans choose. Rally Thornwold and you gain the finest archers alive — and you make them choose.",
    goal: "Keep the woods unowned, untaxed and unrecorded by anyone's clerk.",
    wants: "To be left alone, and failing that, to be asked properly. Favours to individual clans matter more than treaties.",
    fears: "Iron Pact charcoal crews and Goldmere surveyors — both of which arrive with paperwork and leave with the forest.",
    stance: "Reluctant allies, ferocious defenders. Rally them and you gain the best skirmishers alive; press them and they simply vanish.",
  },
  freeholds: {
    motto: "\"No lord, no ledger, no thank you.\"",
    history:
      "Charter towns that bought their freedoms during the Toll Wars and have argued about them nightly ever since. The Reeve's Council governs by exhausting all opposition.",
    lineage:
      "The Holds have no lords and an extremely long memory of the ones they bought out. Cassock Town's charter is signed by 214 households and amended nightly. Reeve Ilsa Marrow is in her third elected term, which is two more than anyone considers healthy, and her opposition says so at every session.",
    court: [
      { name: "Reeve Ilsa Marrow", role: "Elected head of the Council", note: "Practical to the point of rudeness. Will trade with anyone and trust no one." },
      { name: "Osrick Quill", role: "Clerk of the Charter", note: "Knows which clauses can be stretched. Is terrified of the day someone reads them properly." },
      { name: "The Levy Faction", role: "Council minority", note: "Wants a standing militia and a wall. Argues, correctly, that charters do not stop cavalry." },
    ],
    faultline:
      "Ilsa's arbitration keeps the Holds neutral and undefended; the Levy Faction wants them armed and therefore worth conquering. Your help decides which argument wins.",
    goal: "Survive the war with their charters intact and, if the realm fractures, become something new.",
    wants: "Practical help — safe roads, cleared bandit camps, honest arbitration — and no promises they can't audit.",
    fears: "Any strong crown at all. Winners tend to notice how rich Cassock Town is.",
    stance: "The independence path. With the Holds behind you, the realm need not be united at all — only free of its lords.",
  },
};

/** Terms the campaign uses that a new player will meet in dialogue. */
export const LORE_TERMS: { term: string; text: string }[] = [
  { term: "Ash Reckoning", text: "The calendar, counted from the hall fire that killed the last High King." },
  { term: "The Charter of Six Seals", text: "The agreement that replaced the crown with six houses. Nobody has read it recently." },
  { term: "The Ash Company", text: "Draeven's standing army of masterless soldiers, under Captain Maud Kell." },
  { term: "Oath-brotherhood", text: "An Iron Pact mining crew sworn to one another for life. Their loyalty is not to a lord but to the crew." },
  { term: "Moot", text: "A Thornwold clan assembly. Every clan speaks. Every clan disagrees. Eventually someone brings food." },
  { term: "Reeve", text: "An elected magistrate of a Free Hold charter town, chosen for a term and blamed for a lifetime." },
  { term: "Renown", text: "What the realm thinks you are worth. It opens doors, raises prices, and attracts assassins." },
];
