import express from "express";
const router = express.Router();

import Nutritionix from "../helpers/nutritionix";
const nix = new Nutritionix();

import WellScanGlobal from "../helpers/wellscanglobal";
const wsg = new WellScanGlobal();

import operators from "../operators";
import db from "../db";
import { red } from "ansi-colors";
import { deflateRawSync } from "zlib";

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

  // Check if we already have the food, in case we need to use this information later.
  // Note: This will matter when we want to avoid external calls to nutrition sources.
  wsg.checkFoodExists(req.params.barcode, 
    ret => {
      res.locals.alreadyFound = ret.found;

      res.locals.rankingInfo = {
        defaultRank: system["default-rank"],
        values: system.values,
        category: category
      }
      next();
    },
    err => {
      res
        .status(401)
        .send("Failed to contact WellSCAN Global: " + err.message);
    });
});

router.get("/api/:system/:category/:barcode", (req, res, next) => {

    //get nutritionix data from barcode
    let opt = {
      barcode: req.params.barcode,
      id: req.headers.nixId,
      key: req.headers.nixKey
    }
    nix.getNutritionByUPC(opt,
      nutrition => {
        res.locals.nutrition = nutrition.data;
        next();
      },
      err => {
        res
          .status(401)
          .send("Failed to get nutrition data: " + err.message);
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
    value:rankingInfo.values[rank],
    name: nutrition["item_name"],
    system: req.params.system,
    category: req.params.category,
    barcode: req.params.barcode,
  }
 
  // prepare the record that will get added to WellSCAN Global
  var fbrecord = {
    item_name:data.name,
    upc:data.barcode,
    rankings:{}
  }
  // more preppy stuffz
  fbrecord.rankings[data.system] = {
    rank:rank,
    category:req.params.category,
  }
  
  wsg.addRecord(fbrecord);

  if(res.locals.alreadyFound)
    data.msg = "Note: The food was already in WellSCAN Global. Updated as appropriate.";
  else {
    data.msg = "The food was not already in WellSCAN Global, but has been added."
  }
  res.status(200).send(data);
});

export default router;