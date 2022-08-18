import React, { useState, useEffect, useRef } from "react";
import ReactGA from "react-ga";
import { useTranslation } from "react-i18next";
import { Grid, Button, Typography, Tooltip, Paper, Divider, TextField } from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";

import { runCastSequence as evokerSequence } from "Retail/Engine/EffectFormulas/Evoker/PresEvokerRamps";
import { runCastSequence as discSequence } from "General/Modules/Player/DiscPriest/DiscPriestRamps";
import { runCastSequence as shamanSequence } from "Retail/Engine/EffectFormulas/Shaman/RestoShamanRamps";

import { EVOKERSPELLDB, baseTalents } from "Retail/Engine/EffectFormulas/Evoker/PresEvokerSpellDB";
import { DISCSPELLS, baseTalents as discTalents } from "General/Modules/Player/DiscPriest/DiscSpellDB";
import { SHAMANSPELLDB } from "Retail/Engine/EffectFormulas/Shaman/RestoShamanSpellDB";
import { buildRamp } from "General/Modules/Player/DiscPriest/DiscRampGen";

import LooksOneIcon from "@mui/icons-material/LooksOne";
import { SpellIcon } from "./SpellIcon";
import "./Sequence.css";

const useStyles = makeStyles((theme) => ({
  root: {
    [theme.breakpoints.down("md")]: {
      margin: "auto",
      width: "100%",
      justifyContent: "center",
      display: "block",
      marginTop: 140,
    },
    [theme.breakpoints.up("sm")]: {
      margin: "auto",
      width: "80%",
      justifyContent: "center",
      display: "block",
      marginTop: 120,
    },
    [theme.breakpoints.up("md")]: {
      margin: "auto",
      width: "65%",
      justifyContent: "center",
      display: "block",
    },
    [theme.breakpoints.up("lg")]: {
      margin: "auto",
      width: "44%",
      justifyContent: "center",
      display: "block",
    },
  },
}));

const getSpellDB = (spec) => {
  if (spec === "Preservation Evoker") return EVOKERSPELLDB;
  if (spec === "Discipline Priest") return DISCSPELLS;
  if (spec === "Restoration Shaman") return SHAMANSPELLDB;
};

const getSequence = (spec) => {
  if (spec === "Preservation Evoker") return evokerSequence;
  if (spec === "Discipline Priest") return discSequence;
  if (spec === "Restoration Shaman") return shamanSequence;
};

const dpsSpells = Object.keys(EVOKERSPELLDB).filter((spell) => EVOKERSPELLDB[spell][0].type === "damage");
const healSpells = Object.keys(EVOKERSPELLDB).filter((spell) => EVOKERSPELLDB[spell][0].type === "heal" || spell === "Reversion");

export default function SequenceGenerator(props) {
  const selectedSpec = "Preservation Evoker";
  const spellDB = getSpellDB(selectedSpec);

  const spellCategories = ["Healing", "Damage", "Cooldowns & Other"];

  const classes = useStyles();
  const [seq, setSeq] = useState([]);
  const [talents, settalents] = useState({ ...baseTalents });
  const [result, setResult] = useState({ totalDamage: 0, totalHealing: 0, hpm: 0 });

  const spellList = {
    Damage: Object.keys(spellDB).filter((spell) => spellDB[spell][0].spellData?.cat === "damage"),
    Healing: Object.keys(spellDB).filter((spell) => spellDB[spell][0].spellData?.cat === "heal"),
    "Cooldowns & Other": Object.keys(spellDB).filter((spell) => spellDB[spell][0].spellData?.cat === "cooldown"),
  };

  const stats = {
    intellect: 2000,
    haste: 600,
    crit: 600,
    mastery: 600,
    versatility: 600,
    stamina: 2800,

    critMult: 1,
  };

  const updateSequence = (sequence) => {
    const simFunc = getSequence(selectedSpec);
    const sim = simFunc(sequence, stats, {}, {});

    // multiple state updates get bundled by react into one update
    setSeq(sequence);
    setResult(sim);
  }

  const addSpell = (spell) => {
    updateSequence([...seq, spell]);
  };

  const removeSpellAtIndex = (index, e = null) => {
    if (!!e) {
      e.preventDefault();
    }

    const editSeq = [...seq];
    editSeq.splice(index, 1);
    updateSequence(editSeq);
  }

  const insertSpellAtIndex = (spell, index) => {
    const editSeq = [
      ...seq.slice(0, index),
      spell,
      ...seq.slice(index)
    ];
    updateSequence(editSeq);
  };

  const moveSpell = (indexOld, indexNew) => {
    const editSeq = [...seq];
    const dragItemContent = editSeq[indexOld];
    editSeq.splice(indexOld, 1);
    editSeq.splice(indexNew, 0, dragItemContent);
    updateSequence(editSeq);
  };

  const clearSeq = () => {
    updateSequence([]);
  };

  const runSeq = () => {
    const simFunc = getSequence(selectedSpec);
    const sim = simFunc(seq, stats, {}, {});
    setResult(sim);
    console.log(sim);
  };

  const autoGen = () => {
    updateSequence(buildRamp("Primary", 10, [], stats.haste, "", discTalents));
  };

  //#region Drag and Drop Functions
  const dragSpell = useRef();
  const dragOverSpell = useRef();
  /**
   * Drag and Drop inside of the Sequence.
   * Moves the drag target to the location of a different spell
   * using their indexes.
   *  
   * @param {*} e
   */
  const dropMove = e => {
    if (dragSpell.current === null || dragOverSpell.current === null)
      return;

    if (Number.isInteger(dragSpell.current)) {
      moveSpell(dragSpell.current, dragOverSpell.current);
    }

    dragSpell.current = null;
    dragOverSpell.current = null;
  };

  /**
   * Drag and Drop from outside into the Sequence.
   * Inserts a spell using the spell name into the list
   * at the location of your cursor.
   *  
   * @param {*} e
   */
  const dropInsertion = e => {
    if (dragSpell.current === null || Number.isInteger(dragSpell.current))
      return;

    const spell = dragSpell.current;
    // The dropping behavior is a bit weird, dropping an item on top of a spell will trigger both the spell drop & background drop so we have to circumvent double insertions
    if (e.target.className.includes("backgroundDropTarget"))
      addSpell(spell);
    else if (dragOverSpell.current !== null)
      insertSpellAtIndex(spell, dragOverSpell.current);

    dragSpell.current = null;
    dragOverSpell.current = null;
  }

  /**
   * Saves the picked up spell in a reference so we can use it
   * whenever we drop the item.
   * 
   * @param {*} e 
   * @param {*} value Either the index or the spell name
   */
  const dragStart = (e, value) => {
    dragSpell.current = value;
    $WowheadPower.clearTouchTooltip();
  };

  /**
   * @param {*} e 
   * @param {*} position Index of the spell location we're hovering over.
   */
  const dragEnter = (e, position) => {
    dragOverSpell.current = position;
  };

  const onDragOver = e => {
    // required for dnd to work
    e.preventDefault();
  }
  //#endregion

  return (
    <div style={{ backgroundColor: "#313131" }}>
      <div className={classes.root}>
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <Paper padding={0} elevation={0} style={{ padding: "10px 5px 10px 10px", opacity: 100, backgroundColor: "transparent" }}>
              <Grid container spacing={1}>
                <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
                  <Typography variant="h6" align="left" style={{ width: "100%" }} color="primary">
                    {"Sequences"}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
                  <Paper style={{ padding: "8px 8px 4px 8px", minHeight: 40 }} elevation={0}>
                    <Grid container spacing={1} alignItems="center" className="backgroundDropTarget" onDragOver={onDragOver} onDrop={dropInsertion}>
                      {/*<Grid item xs="auto">
                            <LooksOneIcon fontSize="large" />
                            </Grid> */}

                      {seq.map((spell, index) => (
                        <Grid item xs="auto" key={index} onDragOver={onDragOver} onDragEnd={dropMove} onDrop={dropInsertion} onDragEnter={(e) => { dragEnter(e, index) }}>
                          <SpellIcon
                            spell={spellDB[spell][0]}
                            draggable
                            onDragStart={(e) => { dragStart(e, index) }}
                            onContextMenu={(e) => removeSpellAtIndex(index, e)}
                            style={{ display: "flex" }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
                  <Divider />
                </Grid>

                {spellCategories.map((cat, index) => (
                  <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
                    <Grid container>
                      <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
                        <Typography variant="h6" align="left" style={{ width: "100%" }} color="primary">
                          {cat + " Spells"}
                        </Typography>
                      </Grid>
                      <Grid container spacing={1}>
                        {spellList[cat].map((spell, i) => (
                          <Grid item xs="auto" key={spellDB[spell][0].spellData.id}>
                            <SpellIcon
                              spell={spellDB[spell][0]}
                              draggable
                              onDragStart={(e) => { dragStart(e, spell) }}
                              onClick={(e) => addSpell(spell, e)}
                              style={{ display: "flex" }}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Grid>
                  </Grid>
                ))}

                <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
                  <Typography variant="h6" align="left" style={{ width: "100%" }} color="primary">
                    {"Talents"}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Button
                    key={321}
                    variant="contained"
                    onClick={() => runSeq()}
                    color="secondary"
                    style={{
                      width: "100%",
                      height: "35px",
                      whiteSpace: "nowrap",
                      justifyContent: "center",
                      textTransform: "none",
                      paddingLeft: "32px",
                      color: "#F2BF59",
                    }}
                  >
                    {"Run Sequence"}
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    key={321}
                    variant="contained"
                    onClick={() => clearSeq()}
                    color="secondary"
                    style={{
                      width: "100%",
                      height: "35px",
                      whiteSpace: "nowrap",
                      justifyContent: "center",
                      textTransform: "none",
                      paddingLeft: "32px",
                      color: "#F2BF59",
                    }}
                  >
                    {"Clear"}
                  </Button>
                </Grid>

                <Grid item xs={12}>
                  <Button
                    key={322}
                    variant="contained"
                    onClick={() => autoGen()}
                    color="secondary"
                    style={{
                      width: "100%",
                      height: "35px",
                      whiteSpace: "nowrap",
                      justifyContent: "center",
                      textTransform: "none",
                      paddingLeft: "32px",
                      color: "#F2BF59",
                    }}
                  >
                    {"Auto-Generate Sequence"}
                  </Button>
                </Grid>

                <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
                  <Typography variant="h6" align="left" style={{ width: "100%" }} color="primary">
                    {"Results"}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Paper style={{ backgroundColor: "#525252", padding: 16 }} elevation={0}>
                    <p style={{ color: "whitesmoke", paddingTop: "10px" }}>
                      {"Damage: " + result.totalDamage.toLocaleString("en-US") + ". Healing: " + result.totalHealing.toLocaleString("en-US") + ". HPM: " + Math.round(100 * result.hpm) / 100}
                    </p>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                    <TextField value={`Combat Log Coming Soon`} variant="outlined" multiline minRows={4} fullWidth disabled style={{whiteSpace: 'pre-line'}} />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </div>
    </div>
  );
}
