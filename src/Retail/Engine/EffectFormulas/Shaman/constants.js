export const VESPER_SP = .9125; // Includes the 9.0.5 25% buff.
export const CHAIN_HARVEST_SP = 3.6225; // Includes the 9.0.5 15% buff.
export const PRIMORDIAL_WAVE_SP = .65;
export const HEALING_WAVE_COPY_SP = 1.8;
export const RIPTIDE_INITIAL_SP = 1.7; // Check for Torrent
export const RIPTIDE_HOT_SP = 1.32;
export const RESTO_SHAMAN_DPS_AURA = 1.4;
export const FAE_TRANSFUSION_SP = .94;
export const UNLEASH_LIFE_MULT = 1.35;

export const HEALING_AURA = 0.96
export const DPS_AURA = 1.15;
export const LAVA_BURST_AURA = 1.1;
export const CHAIN_LIGHTNING_AURA = 1.4;

export const ABILITIES_FEEDING_INTO_ASCENDANCE  = [
  "Healing Wave",
  "Chain Heal",
  "Healing Surge",
  "Riptide",
  "Healing Rain",
  "Overflowing Shores",
  "Wellspring",
  "Unleash Life",
  "Earth Shield",
  "Downpour",
  "Primordial Wave",
  "Nature's Guardian",
  //"Ancestral Awakening", Apparently doesn't work with CBT, need to confirm exact details
  "Earthliving Weapon", // unconfirmed
];

export const ABILITIES_FEEDING_INTO_CBT = [
  ...ABILITIES_FEEDING_INTO_ASCENDANCE,
  "Ascendance (cast)",
];

export const ABILITIES_FEEDING_INTO_AG = [
  ...ABILITIES_FEEDING_INTO_CBT,
  "Cloudburst Totem",
  "Ascendance",
];
