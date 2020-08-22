import React from "react";
import HolyPaladinIcon from '../../../Images/HolyPaladin.jpg'
import DiscPriestIcon from '../../../Images/DisciplinePriest.jpg'
import HolyPriestIcon from '../../../Images/HolyPriest.jpg'
import MistweaverIcon from '../../../Images/MistWeaverMonk.jpg'
import RestorationDruidIcon from '../../../Images/RestorationDruid.jpg'
import RestorationShamanIcon from '../../../Images/RestorationShaman.jpg'

export default function classicons(props) {
  // Paladin Cooldowns 
  if (props === 'Holy Paladin') {
    return (
      <img
        style={{
          height: 20,
          width: 20,
          padding: '0px 5px 0px 5px',
          verticalAlign: 'middle'
        }}
        src={HolyPaladinIcon}
        alt='Holy Paladin'
      />
    )
  }

  // Restoration Druid
  if (props === 'Restoration Druid') {
    return (
      <img
        style={{
          height: 20,
          width: 20,
          padding: '0px 5px 0px 5px',
          verticalAlign: 'middle'
        }}
        src={RestorationDruidIcon}
        alt='Restoration Druid'
      />
    )
  }

  // Holy Priest
  if (props === 'Holy Priest') {
    return (
      <img
        style={{
          height: 20,
          width: 20,
          padding: '0px 5px 0px 5px',
          verticalAlign: 'middle'
        }}
        src={HolyPriestIcon}
        alt='Holy Priest'
      />
    )
  }

  // Discipline Priest
  if (props === 'Discispline Priest') {
    return (
      <img
        style={{
          height: 20,
          width: 20,
          padding: '0px 5px 0px 5px',
          verticalAlign: 'middle'
        }}
        src={DiscPriestIcon}
        alt='Discispline Priest'
      />
    )
  }

  // Restoration Shaman
  if (props === 'Restoration Shaman') {
    return (
      <img
        style={{
          height: 20,
          width: 20,
          padding: '0px 5px 0px 5px',
          verticalAlign: 'middle'
        }}
        src={RestorationShamanIcon}
        alt='Restoration Shaman'
      />
    )
  }

  // Mistweaver Monk
  if (props === 'Mistweaver Monk') {
    return (
      <img
        style={{
          height: 20,
          width: 20,
          padding: '0px 5px 0px 5px',
          verticalAlign: 'middle'
        }}
        src={MistweaverIcon}
        alt='Mistweaver Monk'
      />
    )
  }
}