import express from "express";
const router = express.Router();

import Nutritionix from "../helpers/nutritionix";
const nix = new Nutritionix();
import operators from "../operators";
import db from "../db";

router.get("/api/:system/:category/:barcode", (req, res, next) => {
  //check if system and category are valid before comparing nutrition information
  const system = db[req.params.system];
  if (!system) {
    res.status(400).send(req.params.system + " ranking system not found");
    return;
  }

  const category = system["categories"][req.params.category];
  if (!category) {
    res.status(400).send(req.params.category + " category not found in " + system);
    return;
  }

  res.locals.rankingInfo = {
    defaultRank: system["default-rank"],
    values: system.values,
    category: category
  }

  next();
});

router.get("/api/:system/:category/:barcode", (req, res, next) => {
  //get nutritionix data from barcode
  nix.getNutritionByUPC(req.params.barcode,
    nutrition => {
      res.locals.nutrition = nutrition.data;
      next();
    },
    err => {
      res
        .status(404)
        .send("Could not find nutrition information for " + req.params.barcode);
      return;
    }
  );
});



router.get("/api/:system/:category/:barcode", (req, res, next) => {
  // analyzing nutrition information and providing a rank to the food
  let nutrition = res.locals.nutrition;
  let category = res.locals.rankingInfo.category;

  category.forEach((check, idx) => {
    let requirements = check.requirements;
    let i = 0;
    let pass = true;

    // loop through requirements to see if we can find one test that fails
    // if one test fails, then this is note the right rank for the the food; stop the loop
    while ( i < requirements.length && pass) {
      let r = requirements[i];
      let operator = operators[r.operator];

      pass = pass && operator(nutrition[r.property], r.value);
      i++;
    }

    // if food passed all the requirements
    // set it to ranking, which is the actual string name
    if (pass){
      res.locals.rank = check.rank;
      next();
    }
  })
  // if the food didn't meet any of the ranks, it belongs in the the default rank
  res.locals.rank = res.locals.rankingInfo.defaultRank;
  next();
});

router.get("/api/:system/:category/:barcode", (req, res) => {
  let {nutrition, rankingInfo, rank } = res.locals;

  // the data sent back as response
  let data = {
    rank,
    value: rankingInfo.values[rank],
    name: nutrition["item_name"],
    system: req.params.system,
    category: req.params.category,
    barcode: req.params.barcode,
  }

  res.status(200).send(data);
});

export default router;
