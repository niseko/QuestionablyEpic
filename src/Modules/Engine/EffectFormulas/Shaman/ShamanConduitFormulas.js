// Conduit Spell IDs
const EMBRACE_OF_EARTH = 338329;
const NATURES_FOCUS = 338346;
const HEAVY_RAINFALL = 338343;
const SWIRLING_CURRENTS = 338339;
const ELYSIAN_DIRGE = 339182;
const LAVISH_HARVEST = 339185;
const TUMBLING_WAVES = 339186;
const ESSENTIAL_EXTRACTION = 339183;
const ASTRAL_PROTECTION = 337964;
const REFRESHING_WATERS = 337974;
const VITAL_ACCRETION = 337981;

// Conduit Ranks
const SWIRLING_CURRENTS_RANKS = [20, 21, 23, 24, 26, 28, 29, 30, 31, 33, 34, 36, 37, 39, 40];
const HEAVY_RAINFALL_RANKS = [75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145];
const EMBRACE_OF_EARTH_RANKS = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12];
const NATURES_FOCUS_RANKS = [10, 10.66, 11.33, 12, 12.66, 13.33, 14, 15, 16, 16.66, 17.33, 18, 18.66, 19.33, 20];
const TUMBLING_WAVES_RANKS = [200, 210, 230, 240, 260, 270, 290, 300, 310, 330, 340, 360, 370, 390, 400];
const ELYSIAN_DIRGE_RANKS = [40, 43, 46, 49, 52, 55, 58, 61, 64, 67, 70, 73, 76, 79, 82];
const LAVISH_HARVEST_RANKS = [10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 15, 15.5, 16, 16.5, 17];
const ESSENTIAL_EXTRACTION_RANKS = [-25000, -26000, -27000, -28000, -29000, -30000, -31000, -33000, -34000, -35000, -36000, -37000, -38000, -39000, -40000];

// Helper Functions
const HEALING_WAVE_COPY_SP = 1.8;
const PRIMORDIAL_WAVE_SP = 0.65;
const RIPTIDE_INITIAL_SP = 1.7; // Check for Torrent
const RIPTIDE_HOT_SP = 1.32;

function tumblingWaves(player) {
  const avgWavesPerCast = 4.4; // aka riptides / placeholder
  return (RIPTIDE_INITIAL_SP + PRIMORDIAL_WAVE_SP + (HEALING_WAVE_COPY_SP * avgWavesPerCast)) * player.getStatMultiplier("NOHASTE") + RIPTIDE_HOT_SP * player.getStatMultiplier("ALL");
}

export const getShamanConduit = (conduitID, player, contentType, conduitRank) => {
  const bonusStats = {};

  if (conduitID === EMBRACE_OF_EARTH) {
    /**
     * Increases the healing on your Earth Shield target by x%.
     * Ideally I can get some value of how much healing the player did on that target,
     * for generic values probably need to go through logs.
     */
    const traitBonus = EMBRACE_OF_EARTH_RANKS[conduitRank] / 100;
    const esHPS = player.getSpellHPS("Healing on Earth Shield", contentType);
    bonusStats.HPS = esHPS * traitBonus;
  } else if (conduitID === HEAVY_RAINFALL) {
    /**
     * Increases the healing of your Healing Rain by x% for 20s after using Healing Tide.
     */
    const traitBonus = HEAVY_RAINFALL_RANKS[conduitRank] / 100;
    const hrHPS = player.getSpellHPS("Healing Rain", contentType);
    const hrCasts = player.getSpellCasts("Healing Rain", contentType);
    const httCasts = player.getSpellCasts("Healing Tide Totem", contentType);
    const buffedCasts = httCasts * 1.8;
    const avgHRCast = hrHPS / hrCasts;
    bonusStats.HPS = (buffedCasts * avgHRCast) * traitBonus;
  } else if (conduitID === NATURES_FOCUS) {
    /**
     * Increases the initial healing of Chain Heal by x%.
     */
    const traitBonus = NATURES_FOCUS_RANKS[conduitRank] / 100;
    const chHPS = player.getSpellHPS("Chain Heal", contentType);
    const roughInitial = chHPS * 0.4; // 40% is about what the initial hit of the chain heal is doing, could probably use something better
    bonusStats.HPS = roughInitial * traitBonus;
  } else if (conduitID === SWIRLING_CURRENTS) {
    /**
     * After using CBT/HST it increases the healing of your next 3 RT/HW/HS casts.
     */
    const traitBonus = SWIRLING_CURRENTS_RANKS[conduitRank] / 100;
    const rtHPS = player.getSpellHPS("Riptide", contentType);
    const rtCasts = player.getSpellCasts("Riptide", contentType);
    const cbtCasts = player.getSpellCasts("Cloudburst Totem", contentType);
    const avgRTCast = rtHPS / rtCasts;
    const buffedCasts = cbtCasts * 3;
    // add overhealing, efficiency
    bonusStats.HPS = (buffedCasts * avgRTCast) * traitBonus;
  } else if (conduitID === ELYSIAN_DIRGE) {
    /**
     * Vesper does some more healing to the closest target
     */
    const traitBonus = ELYSIAN_DIRGE_RANKS[conduitRank] / 100;
    const vesperSpellpower = 2.19;
    bonusStats.HPS = (vesperSpellpower * traitBonus * player.getStatMultiplier("NOHASTE")) / 60;
  } else if (conduitID === LAVISH_HARVEST) {
    /**
     * increases crit chance of RCH
     * doubled for the cdr
     */
    const traitBonus = LAVISH_HARVEST_RANKS[conduitRank] / 100;
    const rchSpellpower = 3.15 * 5;
    bonusStats.HPS = (rchSpellpower * traitBonus * 2 * player.getStatMultiplier("NOHASTE")) / 60;
  } else if (conduitID === TUMBLING_WAVES) {
    /**
     * Chance to reset pwave, needs some lower efficiency
     */
    const traitBonus = TUMBLING_WAVES_RANKS[conduitRank] / 1000; // careful, extra 0
    const cast = tumblingWaves(player);
    bonusStats.HPS = (cast * traitBonus) / 60;
  } else if (conduitID === ESSENTIAL_EXTRACTION) {
    /**
     * Reduces the cd of fae transfusion by x seconds
     */
    const traitBonus = ESSENTIAL_EXTRACTION_RANKS[conduitRank] / 1000; // careful, extra 0
    const faeSpellpower = (.94 * 7) * .4;
    const faeCooldown = 180;
    const gain = faeCooldown / (faeCooldown - traitBonus);
    bonusStats.HPS = (faeSpellpower * (1 - gain) * player.getStatMultiplier("NOHASTE")) / 60;
  } else if (conduitID === ASTRAL_PROTECTION) {
    bonusStats.HPS = 0;
  } else if (conduitID === REFRESHING_WATERS) {
    /**
     * Increases healing surge on yourself by x%
     * ideally needs some way of telling how much you healed yourself with it
     * great for dungeons
     */
    // TODO
    bonusStats.HPS = 1;
  } else if (conduitID === VITAL_ACCRETION) {
    bonusStats.HPS = 0;
  }

  // some real dirty overheal & efficiency adjustment, gotta do it individually soon
  bonusStats.HPS *= 0.7;
  return bonusStats;
};