import express from "express";
const router = express.Router();


import operators from "../operators";
import db from "../db";
import nutrition_routes from "../nutrition-sources";
import wsg_actions from "../clientwsg/wellscanroutes.js";

router.get("/api/:system/:category/:barcode", (req, res, next) => {
  //Check if valid parameters
  res.set("Access-Control-Allow-Origin", "*")
  //check if system, category, and barcode are valid before comparing nutrition information
  const system = db[req.params.system];
  if (!system) {
    res.status(400).send({
      status: 400,
      msg: req.params.system + " ranking system not found"
    });
    return;
  }

  const category = system["categories"][req.params.category];
  if (!category) {
    res.status(400).send({
      status: 400,
      msg: req.params.category + " category not found in " + system
    });
    return;
  }

  if (isNaN(req.params.barcode)) {
    res.status(401).send({
      status: 401,
      msg: "Not a valid barcode"
    });
    return;
  }
  // else keeping going
  next();

});

//router.get("/api/:system/:category/:barcode", wsg_actions.gfr);

nutrition_routes.forEach(n_route => {
  router.get("/api/:system/:category/:barcode", n_route);
})

router.get("/api/:system/:category/:barcode", (req, res, next) => {
    // analyzing nutrition information and providing a rank to the food

    let nutrition = res.locals.nutrition;
    if (!nutrition) {
      res.locals.fail = true;
      res.locals.fail_msg = "Could not find nutrition information";
      next();
      return;
    }

    let system = db[req.params.system]
    let category = system["categories"][req.params.category];
    let pass = false;

    category.forEach((check, idx) => {
      if (!pass) {
      let requirements = check.requirements;
      let i = 0;
      pass = true;

      // loop through requirements to see if we can find one test that fails
      // if one test fails, then this is note the right rank for the the food; stop the loop
        while ( i < requirements.length && pass) {
          let r = requirements[i];
          let operator = operators[r.operator];
          if (nutrition[r.property] === null) {
            //if nutrition information missing
            res.locals.fail = true;
            res.locals.fail_msg = "No nutrition property: " + r.property;
            next();
            return;
          }
          pass = pass && operator(nutrition[r.property], r.value);
          //console.log(check.rank, r.property, nutrition[r.property],r.operator, r.value)
          i++;
        }

        // if food passed all the requirements
        // set it to ranking, which is the actual string name
        if (pass){
          res.locals.rank = check.rank;
          res.locals.value = system["values"][check.rank];
          next();
          return;
        }
      }
    })
    // if the food didn't meet any of the ranks, it belongs in the the default rank
    
    res.locals.rank = system["default-rank"];
    res.locals.value = system["values"][res.locals.rank]
    next();
   
});

router.get("/api/:system/:category/:barcode", (req, res, next) => {
  if (res.locals.fail) {
    next();
    return;
  }

  let {nutrition, value, rank, nutrition_source } = res.locals;
  
  let data = {
    rank,
    value,
    nutrition_source,
    name: nutrition["item_name"],
    system: req.params.system,
    category: req.params.category,
    barcode: req.params.barcode,
    nutrition: nutrition,
    nutrition_source
  }
  res.locals.name = nutrition["item_name"]

  res.status(200).send(data);
  next();
});

router.get("/api/:system/:category/:barcode", wsg_actions.uf);
router.get("/api/:system/:category/:barcode", wsg_actions.ub);

router.get("/api/:system/:category/:barcode", (req, res, next) => {
  if (res.locals.fail) {
    res.status(404).send({
      status: 404,
      msg: "Could not calculate rank for that barcode"
    });
  }
});

export default router;