export default interface Spell {
    id: number;
    name: string;
    icon: string;
    category: SpellCategory;
    type: SpellType;
    castTime: number;
    onGCD?: boolean;
    cooldown?: number;
    hastedCooldown?: boolean;
    cost: number;
    coeff: number;
    targets: number;
    expectedOverheal?: number;
    tags?: string[];
    secondaries: SecondaryStat[]; //enums
    //Evoker
    essenceCost?: number;
    school?: string;
    //Paladin
    holyPowerCost?: number;

}

export interface Buff {
    name: string;
    buffDuration: number;
    coeff: number;
    buffType: BuffType;
    tickRate?: number;
    initialTick?: boolean;
    canPartialTick?: boolean;
    expectedOverheal?: number;
    secondaries: SecondaryStat[];
}

export interface SpellList<T extends Spell = Spell> {
    [key: string]: T[];
  }

export enum SpellType {
    Heal,
    Damage,
    Buff,
    Function,
}

export enum BuffType {
    Heal,
    Damage,
    Special,
}

export enum SpellCategory {
    Heal,
    Damage,
    Cooldown,
}

export enum SecondaryStat {
    Crit = "crit",
    Versatility = "vers",
    Mastery = "mastery",
    Haste = "haste",
}
