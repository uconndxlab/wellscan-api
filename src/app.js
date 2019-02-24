
import express from "express";

const app = express();

import Nutritionix from "./nutritionix";
const nix = new Nutritionix();

import operators from "./operators";
import db from "./db";

app.get('/', (req, res) => {
    res.send("Hello World!");
})

app.get("/api/:system/:category/:barcode", (req, res, next) => {
    const params = req.params;
    nix.getNutritionByUPC(params.barcode,
      (nutrition) => {
        req.nut = nutrition;
        next();
      },
      (err) => {
        res.status(404).send("Could not find nutrition information for " + params.barcode);
      }
    );

});
app.get("/api/:system/:category/:barcode", (req, res) => {
    let rank = null;

    const rankSys = db[req.params.system];
    if (!rankSys) {
      res.status(400).send("ranking system not found");
    }

    const tests = rankSys["categories"][req.params.category];
    if (!tests) {
      res.status(400).send(req.params.category + " category not found in " + rankSys["name"] + " ranking system");
    }

    let nut = req.nut.data;
    for (let i = 0; i < tests.length && !rank; i++) {
      let current = tests[i];
      let requirements = current["requirements"];
      let pass = true;
      requirements.forEach(r => {
          let operator = operators[r.operator];
          pass = pass && operator(nut[r.property], r.value);
      })
      if (pass) {
        let rankName =  current.ranking;
        rank = {
          name: rankName,
          value: rankSys["values"][rankName]
        }
      }
    }

    if (!rank) {
      let rankName = rankSys.default;
      rank = rank = {
        name: rankName,
        value: rankSys["values"][rankName]
      }
    }

    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(JSON.stringify(rank));




});


const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Listening to localhost:${PORT}...`);
    console.log('Ctrl+C to quit.');
})

export default app;
