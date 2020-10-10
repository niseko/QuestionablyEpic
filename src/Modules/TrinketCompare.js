import React, { Component } from "react";
// import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Autocomplete from "@material-ui/lab/Autocomplete";

// This is all shitty boilerplate code that'll be replaced. Do not copy.
// const useStyles = makeStyles((theme) => ({
//   root: {
//     flexGrow: 1,
//   },
//   menuButton: {
//     marginRight: theme.spacing(2),
//   },
//   title: {
//     flexGrow: 5,
//   },
// }));

// Demo list only.
const trinketList = [
  "Sea Star",
  "Music Box",
  "Conch",
  "Alchemist Stone",
  "Flat Stat Stick",
];

export default class QEMainMenu extends Component {
  render() {
    return (
      <div style={{ backgroundColor: "#353535" }}>
        <div
          style={{
            margin: "auto",
            width: "20%",
            justifyContent: "center",
            display: "block",
          }}
        >
          <p className="headers">Trinket Compare</p>
          <Autocomplete
            id="trinketSelection"
            options={trinketList}
            style={{ width: 250 }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select a Trinket"
                variant="outlined"
              />
            )}
          />

          <Button variant="contained">Add</Button>
        </div>
      </div>
    );
  }
}