import type { GameState } from "./types";
import type { VoiceProfile } from "./voice";
import { NPCS } from "./world";
import { npcMemoryLine } from "./progress";

/**
 * Character depth layer: backstory, traits, a written speech pattern and a
 * voice profile for every named NPC. Dialogue elsewhere in the game routes
 * through `characterLine()` so tone always matches the character AND their
 * current disposition toward the player.
 */

export type Disposition = "hostile" | "cold" | "neutral" | "warm" | "devoted";

export interface CharacterProfile {
  /** Two or three sentences of history the player can read in the codex. */
  backstory: string;
  /** Short trait tags shown under the portrait. */
  traits: string[];
  /** How they talk — used by writers and shown as a voice note. */
  speech: string;
  voice: VoiceProfile;
  /** One line per disposition band, written in that character's voice. */
  lines: Record<Disposition, string>;
  /** Optional extra colour when they are in your party. */
  companion?: string;
}

const C = (c: CharacterProfile) => c;

export const CHARACTERS: Record<string, CharacterProfile> = {
  /* ---------------- Ravensfell ---------------- */
  lord_corvane: C({
    backstory:
      "Aldric Corvane inherited the loyalist claim at nineteen, the same winter fever took his wife and both his brothers. He has spent thirty years paying the crown's debts out of moor-rents and stubbornness, and he has never once been thanked for it in writing.",
    traits: ["Principled", "Exhausted", "Allergic to flattery"],
    speech: "Short declarative sentences. Speaks in costs and ledgers, never in glory. Pauses before agreeing to anything.",
    voice: { pitch: 0.72, rate: 0.88, prefer: "male", hints: ["daniel", "arthur", "george"] },
    lines: {
      hostile: '"I have a list of people who cost me men. You are on it, and the list is not long."',
      cold: '"Say your piece standing. I have three hours of grain returns and none of them lie to me."',
      neutral: '"You want my banners. Everyone wants my banners. Tell me what they buy and I will consider it."',
      warm: '"Sit. There is bread. What I owe you is more than bread, but the treasury and I disagree about that."',
      devoted: '"When this is finished, Ravensfell will remember your name longer than mine. I have made arrangements."',
    },
  }),
  lady_seren: C({
    backstory:
      "Seren Corvane read her father's war-councils from a stairwell as a girl and corrected them by fourteen. She has drawn up three plans to end the usurpation and been ignored on all three, chiefly for being a daughter rather than a son.",
    traits: ["Ruthless strategist", "Dry wit", "Poor at small talk"],
    speech: "Clipped, precise, faintly amused. Answers questions with better questions. Compliments arrive disguised as logistics.",
    voice: { pitch: 1.12, rate: 1.06, prefer: "female", hints: ["serena", "victoria", "kate"] },
    lines: {
      hostile: '"You are a variable I have already discounted. Do try to be interesting about it."',
      cold: '"I have you on a chart. Presently you are an arrow pointing at nothing."',
      neutral: '"Two hundred spears, four days\' march, one bridge that will not hold them. Now — you were saying something about courage?"',
      warm: '"I have started planning around you rather than despite you. Take that as the flattery it is."',
      devoted: '"I do not say fond things well. So: I have moved my reserve to wherever you intend to be. Read into that."',
    },
  }),
  bram_carter: C({
    backstory:
      "Bram Carter has hauled turnips, timber and, on one memorable occasion, a dead abbot along the Oakhollow road for twenty-two years. He gave you a ride and half a pie on the day you arrived in the realm with nothing.",
    traits: ["Relentlessly cheerful", "Dreadful singer", "Notices everything"],
    speech: "Warm, rambling, self-interrupting. Country turns of phrase, jokes that land two sentences late.",
    voice: { pitch: 0.95, rate: 1.05, prefer: "male", hints: ["fred", "alex"] },
    lines: {
      hostile: '"I gave you a ride once. I have thought about that a fair bit since, and not fondly."',
      cold: '"Axle\'s gone again. So has my good opinion, near enough. Mind the ruts."',
      neutral: '"Roads are bad, tolls are worse, and there\'s a fellow at Millford selling cheese he calls Ravensfell. It isn\'t."',
      warm: '"There you are! I told the whole tap-room about you. Improved it a bit. Only a bit."',
      devoted: '"Anything on this cart is yours, and if it\'s not on the cart I\'ll go and get it. That\'s the whole speech, I practised it."',
    },
  }),
  sister_dulcie: C({
    backstory:
      "Sister Dulcie kept the Oakhollow shrine through two famines and one very bad lord. She trained as a field surgeon with a mercenary company and left it the day they burned a barn with people in it.",
    traits: ["Kind", "Blunt", "Keeps a knife under the altar cloth"],
    speech: "Motherly warmth wrapped around brutal frankness. Blesses you and criticises you in the same breath.",
    voice: { pitch: 1.0, rate: 0.92, prefer: "female", hints: ["moira", "fiona", "karen"] },
    lines: {
      hostile: '"I will mend you, because that is the vow. Do not mistake it for welcome."',
      cold: '"Sit down. Bleed on the outside stones, not the inside ones."',
      neutral: '"You are eating badly and sleeping worse. The gods notice, and so does your liver."',
      warm: '"Come in out of it. There is broth, and a lecture, and you are having both."',
      devoted: '"I light one for you every evening. Don\'t let it be wasted candle, child."',
    },
  }),

  /* ---------------- Goldmere ---------------- */
  lord_vantry: C({
    backstory:
      "Hollis Vantry's grandfather lent a king money and was made a lord to avoid repayment. Hollis has refined the family trade: he has financed every side of every war for thirty years and attended none of them.",
    traits: ["Genial", "Transactional", "Never refuses directly"],
    speech: "Silk and arithmetic. Turns every moral question into a price, and apologises charmingly while doing it.",
    voice: { pitch: 0.88, rate: 0.98, prefer: "male", hints: ["oliver", "daniel"] },
    lines: {
      hostile: '"I have closed your account. No hard feelings — hard feelings are expensive."',
      cold: '"Delightful to see you. Regrettably, everything you want is presently allocated elsewhere."',
      neutral: '"Loyalty, you see, is a subscription, not a purchase. Shall we discuss terms over something amber?"',
      warm: '"For you, favourable rates and no questions. Two favours, really, and the second is the rarer."',
      devoted: '"Goldmere\'s coffers answer to you before they answer to me. Do not tell my clerks; they are fragile people."',
    },
  }),
  ser_isolde: C({
    backstory:
      "Ser Isolde Marr was sold to a free company at eleven and bought her own contract back at twenty-six. Goldmere pays her to be its sword; she stays because the pay is honest and nobody there has ever asked her to burn a village.",
    traits: ["Blunt", "Contract-loyal", "Secretly sentimental"],
    speech: "Soldier's economy. Speaks in terms of duties and hours. Emotion leaks out sideways, then she changes the subject.",
    voice: { pitch: 0.94, rate: 0.95, prefer: "female", hints: ["tessa", "karen"] },
    lines: {
      hostile: '"My contract says protect the house. It says nothing at all about protecting you."',
      cold: '"State it plainly. I am on watch in an hour and I dislike being late more than I dislike you."',
      neutral: '"Nine years I have held this gate. Give me a reason to stand somewhere else and make it a good one."',
      warm: '"I kept the second flask for you. That is — the watch runs long. That is all that means."',
      devoted: '"I would tear up the contract for you. I have never said that to anyone, so kindly do not die."',
    },
  }),

  /* ---------------- The Iron Pact ---------------- */
  lord_draeven: C({
    backstory:
      "Corvus Draeven was a mining foreman who talked eleven oath-brotherhoods into one company, then talked that company into an army. He watched a lord's tax collectors hang his brother over four silver pieces, and he has been very calm about it ever since.",
    traits: ["Charming", "Patient", "Utterly certain"],
    speech: "Reasonable, unhurried, forge-metaphors. Never raises his voice; treats every objection as a design flaw to be corrected.",
    voice: { pitch: 0.62, rate: 0.84, prefer: "male", hints: ["daniel", "arthur"] },
    lines: {
      hostile: '"You have made yourself an obstacle. I do not hate obstacles. I schedule them."',
      cold: '"You keep the old men\'s company. Cold iron keeps its shape too, right until the fire."',
      neutral: '"They call this usurpation. A smith calls it refitting a handle to an axe that keeps flying off."',
      warm: '"You see it, don\'t you. Not the crown — the crack in it. Few people ever look that closely."',
      devoted: '"When they write this down they will need someone to blame. Stand beside me and we will make them spell both names right."',
    },
  }),
  captain_maud: C({
    backstory:
      "Maud Kell soldiered eighteen years for three different banners before Draeven offered her the Ash Company and, more importantly, back-pay. She keeps a private ledger of every order she has followed and what it cost the people on the other end.",
    traits: ["Professional", "Grim", "Funnier than intended"],
    speech: "Flat, procedural, gallows-dry. Reports rather than converses. Never swears; somehow this is worse.",
    voice: { pitch: 0.82, rate: 0.9, prefer: "female", hints: ["victoria", "tessa"] },
    lines: {
      hostile: '"Noted. Filed. When the order comes, it will not be personal, and it will not be slow."',
      cold: '"You are a line item. I have not decided yet in which column."',
      neutral: '"Ash Company holds what it is told to hold. That is the arrangement. Sentiment is not in the arrangement."',
      warm: '"I have written you into my ledger under \'exceptions\'. There are two names in that column."',
      devoted: '"I follow orders until the day I do not. Congratulations, you appear to be the day."',
    },
    companion: "Marches at the front, complains at the back, and does the sums nobody else will.",
  }),
  the_fen_widow: C({
    backstory:
      "Nobody agrees which drowned village the Fen Widow came from, and she encourages every version. She has removed nine people from the realm's politics without a single blade being drawn in public, and sends flowers to the funerals.",
    traits: ["Soft-spoken", "Poisonous", "Impeccably polite"],
    speech: "Gentle, courteous, hostess-warm. Threats phrased as hospitality. Uses your name a great deal.",
    voice: { pitch: 1.28, rate: 0.8, prefer: "female", hints: ["fiona", "serena"] },
    lines: {
      hostile: '"Oh, you poor thing. Do drink something. Not that one, obviously — I am fond of you today."',
      cold: '"You look tired, dear. Tired people make such untidy decisions. Do sit."',
      neutral: '"Everyone is somebody\'s remedy or somebody\'s dose. I only ever measure, dear."',
      warm: '"I have taken you off two lists this month. You may thank me by continuing to be useful."',
      devoted: '"If anyone ever moves against you, they will simply stop attending things. Don\'t ask, dear."',
    },
  }),

  /* ---------------- Sunmarch ---------------- */
  lady_aleyne: C({
    backstory:
      "Ysolt Aleyne took Sunmarch at twenty-two after her father died on a hunt that three separate people profited from. She has ridden in every charge her house has made since and duels twice a year to keep the habit.",
    traits: ["Immaculate manners", "Duelling scars", "No patience"],
    speech: "Courtly formality delivered at a gallop. Compliments are precise; insults are more precise. Hates hedging.",
    voice: { pitch: 1.15, rate: 1.12, prefer: "female", hints: ["serena", "victoria"] },
    lines: {
      hostile: '"You are welcome at my table. My table is outside, in the rain, and I shall be eating indoors."',
      cold: '"Be brief and be accurate. I have horses with better sense of occasion than most of my guests."',
      neutral: '"Sunmarch does not sell its cavalry. It spends them, on causes it can look at in daylight. Are you one?"',
      warm: '"Ride out with me at dawn. Bring the good cloak — I intend to be seen agreeing with you."',
      devoted: '"My house rides where you point. I have told them it is strategy. It is not entirely strategy."',
    },
  }),
  ser_perrin: C({
    backstory:
      "Ser Perrin Hale has been Master of Horse for three Aleynes and gossip-master for the entire realm for longer. He is genuinely the deadliest lance in Sunmarch and would much rather tell you about somebody's scandalous cousin.",
    traits: ["Cheerful", "Incorrigible gossip", "Deadly with a lance"],
    speech: "Breathless, delighted, digressive. Everything is a story about someone else, told in confidence, loudly.",
    voice: { pitch: 1.06, rate: 1.18, prefer: "male", hints: ["alex", "fred"] },
    lines: {
      hostile: '"I shall say nothing about you. That is the cruellest thing I can do to a person, and I mean it."',
      cold: '"Mm. No, I have nothing for you today. Frightful weather, isn\'t it. Frightful."',
      neutral: '"Vantry\'s clerk is courting Brannoc\'s cousin — no, listen, the cousin cannot read, so the letters are being read aloud by a priest."',
      warm: '"You get the good version, not the tap-room version. The good version has names in it."',
      devoted: '"I would ride into the Black Stair for you, and I would talk the whole way down. That is the deal, take it."',
    },
  }),

  /* ---------------- Thornwold ---------------- */
  lord_brannoc: C({
    backstory:
      "Gwyth Brannoc holds thirty clans together with marriages, grudges and one very long memory. He has burned two of his own bridges — literally — to keep armies out of the Thornwold, and would do it a third time before lunch.",
    traits: ["Suspicious of promises", "Clan-bound", "Immovable"],
    speech: "Slow, heavy, proverbial. Long silences. Refers to the forest as though it votes.",
    voice: { pitch: 0.66, rate: 0.78, prefer: "male", hints: ["arthur", "daniel"] },
    lines: {
      hostile: '"The wood remembers you now. It is not a kind memory. Go by the road."',
      cold: '"Words. Every lowlander brings words. I have a shed full and it keeps no rain off."',
      neutral: '"Thirty clans. Thirty opinions. I speak for them the way a river speaks for the rain — loudly, and late."',
      warm: '"You keep your word past the point it stops being profitable. That is rare enough that I noticed."',
      devoted: '"Thornwold marches. Not for a crown. For you, and I will say so in front of all thirty of them."',
    },
  }),
  hana_of_the_glen: C({
    backstory:
      "Hana of the Glen could have ended two feuds with one arrow and declined both times, which cost her a village's welcome. She hunts alone, sleeps in the open by preference, and has been quietly feeding three orphaned families all winter.",
    traits: ["Quiet", "Wry", "Watches everything"],
    speech: "Very few words, chosen with care. Long observational pauses. Humour that arrives flat and lands hard.",
    voice: { pitch: 1.04, rate: 0.86, prefer: "female", hints: ["moira", "tessa"] },
    lines: {
      hostile: '"I have a clear line on you from four places in this glen. Just so we both know."',
      cold: '"You talk a great deal for someone being watched."',
      neutral: '"Two riders on the ridge since midday. They think the gorse hides them. It does not."',
      warm: '"I saved you the good side of the fire. Say nothing about it and we can keep doing that."',
      devoted: '"Wherever you go — I will already be up the hill above it. That is what I have instead of a speech."',
    },
    companion: "Scouts a day ahead and reports in six words, four of which are place-names.",
  }),

  /* ---------------- The Free Holds ---------------- */
  reeve_ilsa: C({
    backstory:
      "Ilsa Farr was a wool-factor's daughter who out-argued a baron over a toll and never stopped. She runs the charter towns by staying in the room longer than anyone else and refuses, absolutely, to be called My Lady.",
    traits: ["Pragmatic", "Sardonic", "Allergic to titles"],
    speech: "Fast, procedural, deflating. Turns grand speeches into agenda items. Says 'right' a lot before doing something drastic.",
    voice: { pitch: 1.08, rate: 1.14, prefer: "female", hints: ["karen", "zira"] },
    lines: {
      hostile: '"Right. You are the fourth item and the shortest. The answer is no. Next."',
      cold: '"We voted on you. It was close, and not in the direction you would like."',
      neutral: '"No lords here, no titles, no bowing. Just eleven towns, one budget, and a great deal of shouting."',
      warm: '"You are the only titled-adjacent nuisance the Council actually looks forward to. Do not let it go to your head."',
      devoted: '"If the realm burns, the Holds hold — with you, and I will get that through the Council if it takes all night. It will take all night."',
    },
  }),
  osrick_quill: C({
    backstory:
      "Osrick Quill copied Iron Pact grain contracts for six years before he noticed the columns did not mean grain. He fled with three ledgers in a flour sack and has been sleeping badly, and in different beds, ever since.",
    traits: ["Nervous", "Precise", "Hoards receipts"],
    speech: "Anxious, over-qualified, parenthetical. Cites document numbers. Apologises for facts as he delivers them.",
    voice: { pitch: 1.22, rate: 1.2, prefer: "male", hints: ["fred", "alex"] },
    lines: {
      hostile: '"I — no. No. I have written down what you did, and the copy is not here, and that is all I will say."',
      cold: '"Please don\'t stand so close to the papers. Some of them are the only ones."',
      neutral: '"Entry forty-one. Two hundred bushels to a village with, ah, eleven households. Someone was being fed, but not with grain."',
      warm: '"I kept a second copy for you. That is — that is a very great deal of trust, from me, about paper."',
      devoted: '"Everything in the sack is yours. Hang someone with it. Preferably alphabetically."',
    },
  }),
};

export function dispositionOf(affinity: number): Disposition {
  if (affinity <= -30) return "hostile";
  if (affinity < 0) return "cold";
  if (affinity >= 70) return "devoted";
  if (affinity >= 30) return "warm";
  return "neutral";
}

export const DISPOSITION_LABEL: Record<Disposition, string> = {
  hostile: "Hostile",
  cold: "Cold",
  neutral: "Guarded",
  warm: "Warm",
  devoted: "Devoted",
};

export function characterOf(npcId: string): CharacterProfile | undefined {
  return CHARACTERS[npcId];
}

/** Voice profile for any speaker, including unnamed party hires. */
const STUDIO_FEMALE = ["coral", "nova", "shimmer", "sage", "alloy"];
const STUDIO_MALE = ["onyx", "ash", "echo", "fable", "ballad"];

function pick(list: string[], key: string): string {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return list[h % list.length] ?? list[0]!;
}

export function voiceOf(npcId: string | undefined, fallbackSeed = ""): VoiceProfile {
  const c = npcId ? CHARACTERS[npcId] : undefined;
  if (c) {
    // The studio engine takes direction in words; reuse the character's own
    // written speech pattern so both engines sound like the same person.
    return {
      ...c.voice,
      apiVoice: c.voice.apiVoice ?? pick(c.voice.prefer === "male" ? STUDIO_MALE : STUDIO_FEMALE, npcId ?? "x"),
      direction: c.voice.direction ?? `${c.speech} Medieval low-fantasy setting; stay in character as ${NPCS[npcId ?? ""]?.name ?? "this character"}.`,
    };
  }
  const seed = (npcId ?? fallbackSeed).split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
  return { pitch: 0.8 + ((seed % 9) * 0.06), rate: 0.88 + ((seed % 5) * 0.05), prefer: seed % 2 ? "male" : "female" };
}

/**
 * The line an NPC says when spoken to: choice/flag memories first (those are
 * the sharpest consequence writing), otherwise their disposition voice line,
 * warmed or soured by marriage and recruitment.
 */
export function characterLine(state: GameState, npcId: string): string {
  const memory = npcMemoryLine(state, npcId);
  if (memory) return memory;
  const npc = NPCS[npcId];
  const st = state.npcs[npcId];
  const c = CHARACTERS[npcId];
  if (!c || !npc || !st) return `"${npc?.blurb ?? "..."}"`;
  if (state.marriedTo === npcId) {
    return c.lines.devoted;
  }
  return c.lines[dispositionOf(st.affinity)];
}
