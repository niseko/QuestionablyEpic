// 
import { applyDiminishingReturns } from "General/Engine/ItemUtilities";
import { SHAMANSPELLDB } from "./RestoShamanSpellDB";
import { reportError } from "General/SystemTools/ErrorLogging/ErrorReporting";
import { checkBuffActive, removeBuffStack, getCurrentStats, getHaste, getSpellRaw, getStatMult } from "../Generic/RampBase";
import { ABILITIES_FEEDING_INTO_CBT, DPS_AURA, HEALING_AURA } from "./constants";

// Any settings included in this object are immutable during any given runtime. Think of them as hard-locked settings.
const Settings = {
}

const SHAMANCONSTANTS = {
  masteryMod: 3,
  masteryEfficiency: 0.25,
  baseMana: 10000,

  // TODO move to spell definitions?
  CBT: { transferRate: 0.2, expectedOverhealing: 0.25 },
  AG: { transferRate: 0.75, expectedOverhealing: 0.2 },
  ASC: { transferRate: 1, expectedOverhealing: 0.6 },
}

function formatMilliseconds(milliseconds) {
  const totalSeconds = milliseconds / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  let result = '';
  if (minutes < 10) {
    result += '0';
  }
  result += minutes;
  result += ':';
  if (seconds < 10) {
    result += '0';
  }
  return result += seconds.toFixed(3);
}

const LOGGING = true;

/**
 * This function handles all of our effects that might change our spell database before the ramps begin.
 * It includes conduits, legendaries, and some trinket effects.
 * 
 * @param {*} spells Our spell database
 * @param {*} settings Settings including legendaries, trinkets, soulbinds and anything that falls out of any other category.
 * @param {*} talents The talents run in the current set.
 * @returns An updated spell database with any of the above changes made.
 */
const applyLoadoutEffects = (spells, settings, talents, state) => {

  // ==== Default Loadout ====
  // While Top Gear can automatically include everything at once, individual modules like Trinket Analysis require a baseline loadout
  // since if we compare trinkets like Bell against an empty loadout it would be very undervalued. This gives a fair appraisal when
  // we don't have full information about a character.
  // As always, Top Gear is able to provide a more complete picture. 
  if (settings['DefaultLoadout']) {

  }

  // ==== Talents ====
  // Not all talents just make base modifications to spells, but those that do can be handled here.

  // Class talents.


  // Spec talents.
  //if (talents.deluge)

  if (talents.overflowingShores) {
    //spells['Healing Rain'].push(spells['Overflowing Shores']);
    // missing an "ON CAST"?
  }

  if (talents.ancestralReach) {
    spells['Chain Heal'][0].targets += 1;
    spells['Chain Heal'][0].coeff *= 1.08;
  }

  if (talents.flowOfTheTides) {
    // 30% to chain heal
    // removes a riptide
  }

  if (talents.cloudburstTotem) {
    // activate cbt (should be generalized)
    // remove HST
  }

  if (talents.livingStream) {
    // increase each tick by 10%
  }

  if (talents.wavespeakersBlessing) {
    spells['Riptide'][1].buffDuration += 3;
  }

  if (talents.torrent) {
    spells['Riptide'][0].coeff *= (1 + (talents.torrent / 10))
  }

  if (talents.undulation) {
    // buff every 3rd hw hs
  }

  if (talents.ancestralAwakening) {
    // attach extra heals to rt, hs, hw
  }

  if (talents.earthenHarmony) {
    // buff ES, ES lasts longer
  }

  if (talents.undercurrent) {
    // global heal buff
    // probably put the multiplier in state and calculate it in getHealingMult
    // or model as a buff
  }

  if (talents.improvedPrimordialWave) {
    // increase cleave %
  }

  if (talents.naturesFocus) {
    // idk this is disgusting
  }

  if (talents.everRisingTide) {
    // model this as an actual spell, remove from here
  }

  

  return spells;
}

/** A healing spells healing multiplier. It's base healing is directly multiplied by whatever the function returns.
 */
const getHealingMult = (state, spellName, spell) => {
  let mult = HEALING_AURA;

  let unleashMult = 1;
  if (["Chain Heal", "Riptide", "Riptide (hot)", "Healing Wave", "Healing Surge"].includes(spellName) && unleashLifeCheck(state, spellName, spell)) {
    unleashMult = SHAMANSPELLDB["Unleash Life"][1].effects[spellName];
  }

  LOGGING && (unleashMult !== 1) && console.log("getHealingMult Unleash Active");

  return mult * unleashMult;
}

/** A spells damage multiplier. It's base damage is directly multiplied by anything the function returns.
 */
const getDamMult = (state, buffs, t, spellName, talents) => {
  let mult = DPS_AURA;

  return mult;
}

const getTargetMult = (state, spellName, spell) => {
  let targets = spell.targets || 1;

  if (["Healing Rain", "Downpour"].includes(spellName) && unleashLifeCheck(state, spellName, spell)) {
    targets += SHAMANSPELLDB["Unleash Life"][1].effects[spellName];
  }

  return (('tags' in spell && spell.tags.includes('sqrt')) ? getSqrt(targets) : targets);
}

// TODO WELLSPRING
export const unleashLifeCheck = (state, spellName, spell) => {
  if (SHAMANSPELLDB["Unleash Life"][1].effects[spellName] === undefined)
    return false;

  if (spell.unleashed !== undefined)
    return spell.unleashed;

  const unleashActive = checkBuffActive(state.activeBuffs, "Unleash Life");
  const recentUnleash = (state.time - state.unleashTimestamp) < 0.05;
  if (unleashActive || recentUnleash) {
    state.activeBuffs = state.activeBuffs.filter((buff) => buff.name !== "Unleash Life");
    state.unleashTimestamp = state.time;
  }
  return unleashActive || recentUnleash;
}

const getSqrt = (targets) => {
  return Math.sqrt(targets);
}

// separate this into sub functions to debloat
export const runHeal = (state, spell, spellName, compile = true) => {

  // Pre-heal processing
  const cloudburstActive = checkBuffActive(state.activeBuffs, "Cloudburst Totem");
  let cloudburstHealing = 0;
  const ancestralGuidanceActive = checkBuffActive(state.activeBuffs, "Ancestral Guidance");
  let ancestralGuidanceHealing = 0;
  const ascendanceActive = checkBuffActive(state.activeBuffs, "Ascendance");
  let ascendanceHealing = 0;

  const currentStats = state.currentStats;
  const healingMult = getHealingMult(state, spellName, spell);
  const targetMult = getTargetMult(state, spellName, spell);
  const healingVal = getSpellRaw(spell, currentStats, SHAMANCONSTANTS) * (1 - spell.expectedOverheal) * healingMult * targetMult;

  if (cloudburstActive && ABILITIES_FEEDING_INTO_CBT.includes(spellName)) {
    cloudburstHealing = healingVal * SHAMANCONSTANTS.CBT.transferRate * (1 - SHAMANCONSTANTS.CBT.expectedOverhealing);
    LOGGING && console.log("CBT: " + cloudburstHealing);
  }

  // TODO check what feeds AG forreal
  if (ancestralGuidanceActive && ABILITIES_FEEDING_INTO_CBT.includes(spellName)) {
    ancestralGuidanceHealing = healingVal * SHAMANCONSTANTS.AG.transferRate * (1 - SHAMANCONSTANTS.AG.expectedOverhealing);
    LOGGING && console.log("AG: " + ancestralGuidanceHealing);
  }

  // TODO check what feeds ASC forreal
  if (ascendanceActive && ABILITIES_FEEDING_INTO_CBT.includes(spellName)) {
    ascendanceHealing = healingVal * SHAMANCONSTANTS.ASC.transferRate * (1 - SHAMANCONSTANTS.ASC.expectedOverhealing);
    LOGGING && console.log("ASC: " + ascendanceHealing);
  }

  if (compile) {
    state.healingDone[spellName] = (state.healingDone[spellName] || 0) + healingVal;
    cloudburstHealing && (state.healingDone['Cloudburst Totem'] = (state.healingDone['Cloudburst Totem'] || 0) + cloudburstHealing);
    ancestralGuidanceHealing && (state.healingDone['Ancestral Guidance'] = (state.healingDone['Ancestral Guidance'] || 0) + ancestralGuidanceHealing);
    ascendanceHealing && (state.healingDone['Ascendance Feeding'] = (state.healingDone['Ascendance Feeding'] || 0) + ascendanceHealing);
  }

  LOGGING && console.log(
    formatMilliseconds(state.time * 1000) + "\n" +
    "Heal: " + spellName + "\n" +
    "Mu: " + healingMult.toFixed(3) + "\n" +
    "SpellRaw " + getSpellRaw(spell, currentStats, SHAMANCONSTANTS).toFixed(2) + "\n" +
    "Targets: " + targetMult + "\n" +
    "Heal: " + healingVal.toFixed(2)
  );

  return healingVal;
}

export const runDamage = (state, spell, spellName, compile = true) => {

  const damMultiplier = getDamMult(state, state.activeBuffs, state.time, spellName, state.talents);
  const damageVal = getSpellRaw(spell, state.currentStats, SHAMANCONSTANTS) * damMultiplier;
  // target multiplier?

  // This is stat tracking, the atonement healing will be returned as part of our result.
  if (compile) state.damageDone[spellName] = (state.damageDone[spellName] || 0) + damageVal; // This is just for stat tracking.

  LOGGING && console.log((state.time) + " " + spellName + ": " + damageVal + ". Buffs: " + JSON.stringify(state.activeBuffs));
  return damageVal;
}

const canCastSpell = (state, spellDB, spellName) => {

  const spell = spellDB[spellName][0];
  let miscReq = true;
  const cooldownReq = (state.time > spell.activeCooldown) || !spell.cooldown;

  LOGGING && console.log("Checking if can cast: " + spellName + ": " + cooldownReq)
  return cooldownReq && miscReq;
}

const getSpellHPM = (state, spellDB, spellName) => {
  const spell = spellDB[spellName][0];
  const spellHealing = runHeal(state, spell, spellName, false)

  return spellHealing / spell.cost || 0;
}

const buffApplication = (state, buff) => {
  let modifiedBuff = buff;

  modifiedBuff.sourceSpell.unleashed = unleashLifeCheck(state, modifiedBuff.sourceSpell.name, modifiedBuff.sourceSpell);

  LOGGING && console.log(
    formatMilliseconds(state.time * 1000) + "\n" +
    "Buff Applied: " + modifiedBuff.sourceSpell.name + "\n" +
    "Unleashed: " + (modifiedBuff.sourceSpell.unleashed)
  );

  return modifiedBuff;
}

export const genSpell = (state, spells) => {
  let spellName = ""

  const usableSpells = [...apl].filter(spell => canCastSpell(state, spells, spell));

  return usableSpells[0];

}


const apl = ["Riptide", "Rest"]

/**
 * Run a full cast sequence. This is where most of the work happens. It runs through a short ramp cycle in order to compare the impact of different trinkets, soulbinds, stat loadouts,
 * talent configurations and more. Any effects missing can be easily included where necessary or desired.
 * @param {} sequence A sequence of spells representing a ramp. Note that in two ramp cycles like alternating Fiend / Boon this function will cover one of the two (and can be run a second
 * time for the other).
 * @param {*} stats A players base stats that are found on their gear. This doesn't include any effects which we'll apply in this function.
 * @param {*} settings Any special settings. We can include soulbinds, legendaries and more here. Trinkets should be included in the cast sequence itself and conduits are handled below.
 * @param {object} conduits Any conduits we want to include. The conduits object is made up of {ConduitName: ConduitLevel} pairs where the conduit level is an item level rather than a rank.
 * @returns The expected healing of the full ramp.
 */
export const runCastSequence = (sequence, stats, settings = {}, talents = {}) => {
  LOGGING && console.log("Running cast sequence");
  const state =
  {
    time: 0.01,
    activeBuffs: [],
    healingDone: {},
    damageDone: {},
    manaSpent: 0,
    settings: settings,
    talents: talents,
    reporting: true,
    unleashTimestamp: -1,
  };

  const sequenceLength = 500; // The length of any given sequence. Note that each ramp is calculated separately and then summed so this only has to cover a single ramp.
  const seqType = "Manual" // Auto / Manual.
  let nextSpell = 0;

  // Note that any talents that permanently modify spells will be done so in this loadoutEffects function. 
  // Ideally we'll cover as much as we can in here.
  const shamanSpells = applyLoadoutEffects(deepCopyFunction(SHAMANSPELLDB), settings, talents, state);

  // Setup mana costs & cooldowns.
  for (const [key, value] of Object.entries(shamanSpells)) {
    let spell = value[0];

    if (!spell.targets) spell.targets = 1;
    if (spell.cooldown) spell.activeCooldown = 0;
    if (spell.cost) spell.cost = spell.cost * SHAMANCONSTANTS.baseMana;
  }

  const seq = [...sequence];

  for (; state.time < sequenceLength; state.time += 0.01) {
    // ---- Heal over time and Damage over time effects ----
    // When we add buffs, we'll also attach a spell to them. The spell should have coefficient information, secondary scaling and so on. 
    // When it's time for a HoT or DoT to tick (state.time > buff.nextTick) we'll run the attached spell.
    // Note that while we refer to DoTs and HoTs, this can be used to map any spell that's effect happens over a period of time. 
    // This includes stuff like Shadow Fiend which effectively *acts* like a DoT even though it is technically not one.
    // You can also call a function from the buff if you'd like to do something particularly special. You can define the function in the specs SpellDB.
    const healBuffs = state.activeBuffs.filter((buff) => { return (buff.buffType === "heal" || buff.buffType === "damage" || buff.buffType === "function") && state.time >= buff.next })
    if (healBuffs.length > 0) {
      healBuffs.forEach((buff) => {
        let currentStats = { ...stats };
        state.currentStats = getCurrentStats(currentStats, state.activeBuffs)

        if (buff.buffType === "heal") {
          const spell = buff.sourceSpell;
          runHeal(state, spell, buff.name)
        }
        else if (buff.buffType === "damage") {
          const spell = buff.sourceSpell;
          runDamage(state, spell, buff.name)
        }
        else if (buff.buffType === "function") {
          const func = buff.attFunction;
          func(state, spell);
        }
        buff.next = buff.next + (buff.tickRate / getHaste(state.currentStats));
      });
    }

    // -- Partial Ticks --
    // When DoTs / HoTs expire, they usually have a partial tick. The size of this depends on how close you are to your next full tick.
    // If your DoT ticks every 1.5 seconds and it expires 0.75s away from it's next tick then you will get a partial tick at 50% of the size of a full tick.
    // Note that some effects do not partially tick (like Fiend), so we'll use the canPartialTick flag to designate which do and don't. 
    const expiringHots = state.activeBuffs.filter((buff) => (buff.buffType === "heal" || buff.buffType === "damage") && state.time >= buff.expiration && buff.canPartialTick)
    expiringHots.forEach(buff => {
      const tickRate = buff.tickRate / getHaste(state.currentStats)
      const partialTickPercentage = (buff.next - state.time) / tickRate;
      const spell = buff.sourceSpell;
      spell.coeff = spell.coeff * partialTickPercentage;

      LOGGING && console.log("Resolving Partial tick from: " + spell.name);

      if (buff.buffType === "damage")
        runDamage(state, spell, buff.name);
      else if (buff.buffType === "heal")
        runHeal(state, spell, buff.name);
    })

    // Remove any buffs that have expired. Note that we call this after we handle partial ticks. 
    state.activeBuffs = state.activeBuffs.filter((buff) => buff.expiration > state.time);

    // This is a check of the current time stamp against the tick our GCD ends and we can begin our queued spell.
    // It'll also auto-cast Ascended Eruption if Boon expired.
    if ((state.time > nextSpell && seq.length > 0)) {

      // Update current stats for this combat tick.
      // Effectively base stats + any current stat buffs.
      let currentStats = { ...stats };
      state.currentStats = getCurrentStats(currentStats, state.activeBuffs);


      let spellName = "";
      if (seqType === "Manual") spellName = seq.shift();
      else spellName = genSpell(state, shamanSpells);

      const fullSpell = shamanSpells[spellName];

      // We'll iterate through the different effects the spell has.
      // Smite for example would just trigger damage (and resulting atonement healing), whereas something like Mind Blast would trigger two effects (damage,
      // and the absorb effect).
      state.manaSpent += fullSpell[0].cost || 0;
      fullSpell.forEach(spell => {

        // The spell has a healing component. Add it's effective healing.
        if (spell.type === 'heal') {
          runHeal(state, spell, spellName)
        }

        // The spell has a damage component. Add it to our damage meter.
        else if (spell.type === 'damage') {
          runDamage(state, spell, spellName)
        }
        // The spell has a function component.
        else if (spell.type === 'function') {
          spell.runFunc(state, spell);
        }

        // The spell adds a buff to our player.
        // We'll track what kind of buff, and when it expires.
        else if (spell.type === "buff") {
          if (spell.buffType === "stats") {
            state.activeBuffs.push({ name: spellName, expiration: state.time + spell.buffDuration, buffType: "stats", value: spell.value, stat: spell.stat });
          }
          else if (spell.buffType === "statsMult") {
            state.activeBuffs.push({ name: spellName, expiration: state.time + spell.buffDuration, buffType: "statsMult", value: spell.value, stat: spell.stat });
          }
          else if (spell.buffType === "damage" || spell.buffType === "heal") {
            let newBuff = {
              name: spell.name || spellName,
              buffType: spell.buffType,
              sourceSpell: structuredClone(spell),
              tickRate: spell.tickRate,
              canPartialTick: spell.canPartialTick,
              next: state.time + (spell.tickRate / getHaste(state.currentStats)),
              activeSpellMultiplier: 1,
            }

            if (spell.hastedDuration)
              newBuff.expiration = state.time + (spell.buffDuration / getHaste(currentStats));
            else
              newBuff.expiration = state.time + spell.buffDuration;

            newBuff = buffApplication(state, newBuff);

            state.activeBuffs.push(newBuff);

            if (spell.initialTick) {
              runHeal(state, newBuff.sourceSpell, spellName);
            }
          }
          else if (spell.buffType === "special") {
            // Check if buff already exists, if it does add a stack.
            const buff = state.activeBuffs.find(buff => buff.name === spell.name);

            if (buff) {
              const oldstacks = buff.stacks;
              if (buff.canStack) {
                buff.stacks = Math.min(buff.maxStacks || Infinity, buff.stacks + (spell.stacks || 1));
              }
              LOGGING && console.log(
                formatMilliseconds(state.time * 1000) + "\n" +
                "Buff Stack Delta: " + (buff.stacks - oldstacks)
              );
            } else {
              state.activeBuffs.push({
                ...spell,
                expiration: (state.time + spell.castTime + spell.buffDuration) || 999,
                stacks: spell.stacks || 1,
              });
              LOGGING && console.log(
                formatMilliseconds(state.time * 1000) + "\n" +
                "Buff Applied: " + spell.name + "\n" +
                "Stacks: " + spell.stacks || 1
              );
            }
          }
          else {
            state.activeBuffs.push({ name: spellName, expiration: state.time + spell.castTime + spell.buffDuration });
          }
        }

        // These are special exceptions where we need to write something special that can't be as easily generalized.

        if (spell.cooldown)
          spell.activeCooldown = state.time + (spell.cooldown / getHaste(currentStats));

        // Grab the next timestamp we are able to cast our next spell. This is equal to whatever is higher of a spells cast time or the GCD.
      });

      if (fullSpell[0].castTime)
        nextSpell += (fullSpell[0].castTime / getHaste(currentStats));
      else
        console.log("CAST TIME ERROR. Spell: " + spellName);

    }
  }


  // Add up our healing values (including atonement) and return it.
  const sumValues = obj => Object.values(obj).reduce((a, b) => a + b);
  state.activeBuffs = [];
  state.totalDamage = Object.keys(state.damageDone).length > 0 ? Math.round(sumValues(state.damageDone)) : 0;
  state.totalHealing = Object.keys(state.healingDone).length > 0 ? Math.round(sumValues(state.healingDone)) : 0;
  state.hps = (state.totalHealing / sequenceLength);
  state.dps = (state.totalDamage / sequenceLength);
  state.hpm = (state.totalHealing / state.manaSpent) || 0;

  return state;

}

// This is a boilerplate function that'll let us clone our spell database to avoid making permanent changes.
// We need this to ensure we're always running a clean DB, free from any changes made on previous runs.
const deepCopyFunction = (inObject) => {
  let outObject, value, key;

  if (typeof inObject !== "object" || inObject === null) {
    return inObject; // Return the value if inObject is not an object
  }

  // Create an array or object to hold the values
  outObject = Array.isArray(inObject) ? [] : {};

  for (key in inObject) {
    value = inObject[key];

    // Recursively (deep) copy for nested objects, including arrays
    outObject[key] = deepCopyFunction(value);
  }

  return outObject;
};

