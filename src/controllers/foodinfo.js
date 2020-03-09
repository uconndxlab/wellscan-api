import express from "express";
const router = express.Router();


import nutrition_routes from "../nutrition-sources";
import wsg_actions from "../clientwsg/wellscanroutes.js";


router.get("/api/getFoodInfo/:barcode", wsg_actions.fe);


router.get("/api/nutrition/:barcode", (req, res, next) => {
  //Check if valid parameters
  res.set("Access-Control-Allow-Origin", "*")

  if (isNaN(req.params.barcode)) {
    res.status(401).send({
      status: 401,
      msg: "Not a valid barcode"
    });
    return;
  }

  next();

});

router.get("/api/nutrition/:barcode", wsg_actions.gn)

nutrition_routes.forEach( r => {
  router.get("/api/nutrition/:barcode", r)
})
router.get("/api/nutrition/:barcode", (req,res,next) => {
  let nutrition = res.locals.nutrition;
  let nutrition_source = res.locals.inwsg ? "wsg" : res.locals.nutrition_source
  let rankings = res.locals.rankings;

  if (nutrition) {
    wsg_actions.uf(req,res,next);
    res.status(200);
    res.send({
      nutrition,
      nutrition_source,
      rankings
    })
  }
  else {
    wsg_actions.ub(req,res,next);
    res.status(404).send({
      status: 404,
      msg: "No nutrition information",
      barcode: req.params.barcode
    });
  }
  next();
});


export default router;