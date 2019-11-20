import express from "express";
const router = express.Router();


import operators from "../operators";
import db from "../db";
import nutrition_routes from "../nutrition-sources";
import wsg_actions from "../clientwsg/wellscanroutes.js";


router.get("/api/:system/:category/:barcode", wsg_actions.gfr);
router.get("/api/:system/:category/:barcode", (req, res, next) => {
  //Check if valid parameters
  res.set("Access-Control-Allow-Origin", "*")
  //check if system, category, and barcode are valid before comparing nutrition information
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

  if (isNaN(req.params.barcode)) {
    res.status(401).send("Not a valid barcode");
    return;
  }
  // else keeping going
  next();

});

nutrition_routes.forEach(n_route => {
  router.get("/api/:system/:category/:barcode", n_route);
})

router.get("/api/:system/:category/:barcode", (req, res, next) => {
    // analyzing nutrition information and providing a rank to the food

    let nutrition = res.locals.nutrition;
    //let category = res.locals.rankingInfo.category || req.query.category;
    if (!nutrition) {
      next();
      return;
    }
    let system = db[req.params.system]
    let category = system["categories"][req.params.category];

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
        res.locals.value = system["values"][check.rank];
        next();
      }
    })
    // if the food didn't meet any of the ranks, it belongs in the the default rank
    
    res.locals.rank = system["default-rank"];
    res.locals.value = system["values"][res.locals.rank]
    next();
   
});

router.get("/api/:system/:category/:barcode", (req, res, next) => {
  let {nutrition, value, rank, nutrition_source } = res.locals;
  if (!value || !rank) {
    next();
    return;
  }
  //console.log(res.locals)
  // the data sent back as response
  let data = {
    rank,
    value,
    nutrition_source,
    name: nutrition["item_name"],
    system: req.params.system,
    category: req.params.category,
    barcode: req.params.barcode,
    nutrition
  }
  
  //prepare the record that will get added to WellSCAN Global
  res.status(200).send(data);
});

router.get("/api/:system/:category/:barcode", wsg_actions.uf);
router.get("/api/:system/:category/:barcode", wsg_actions.ub);

router.get("/api/:system/:category/:barcode", (req, res, next) => {
  if (!res.locals.nutrition) {
    res.status(401).send("No nutrition information for that barcode");
  }
});

export default router;