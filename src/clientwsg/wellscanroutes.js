import WellScanGlobal from "./wellscanglobal";
const wsg = new WellScanGlobal();

const foodExists = (req, res) => {
  res.set("Access-Control-Allow-Origin", "*")

  // Check if we already have the food, in case we need to use this information later.
  wsg.checkFoodExists(req.params.barcode, 
    ret => {
      var d = {};
      if(ret.found) {
        d = ret.data.data();
        d.status = 200;
        d.msg = "Product found in WellSCAN Global";
      } else {
        d.status = 404;
        d.msg = "Product not found in WellSCAN Global";
      }
      res.status(200).send(d);
    },
    err => {
      res
        .status(401)
        .send("Failed to contact WellSCAN Global: " + err.message);
  });
}
const getFoodRanking = (req, res, next) => {
  wsg.checkFoodExists(req.params.barcode, 
   ret => {         
    if (!ret.found) {
      res.locals.inwsg = false;
      next(); 
      return;
    }
    res.locals.inwsg = true;
    let nutrition = ret.data.data();
    let sys = req.params.system;
    if (!nutrition.rankings[sys]) {
      next();
      return;
    }

    let rank = nutrition.rankings[sys].rank || null;
    let value = nutrition.rankings[sys].value || null;
    let nutrition_source = "wellscan_global";
    let data = {
      rank,
      value,
      nutrition_source,
      name: nutrition["item_name"],
      system: req.params.system,
      category: req.params.category,
      barcode: req.params.barcode,
      inwsg: true
    }
    res.status(200).send(data);

    return;

  },
  err => next())
}
const updateFood = (req,res,next) => {
  if (res.locals.fail) {
    next();
    return;
  }
  let fbrecord = {
    item_name:res.locals.name,
    upc: req.params.barcode,
    rankings:{},
    nutrition_facts: res.locals.nutrition,
    nutrition_source: res.locals.nutrition_source 
    
  }
  // more preppy stuffz
  fbrecord.rankings[req.params.system] = {
    rank: res.locals.rank,
    category:req.params.category,
    value: res.locals.value
  }
  
  wsg.updateFoodRecord(fbrecord);

}

const unidentifiedBarcode = (req, res, next) => {
    if (res.locals.fail) {
    let opt = {
      barcode: req.params.barcode,
      msg: res.locals.fail_msg,
      nutrition: res.locals.nutrition,
      nutrition_source: res.locals.nutrition_source
    }
    wsg.addUnidentifiedBarcode(opt)
    }
    next();

}
export default {
  fe: foodExists,
  gfr: getFoodRanking,
  uf: updateFood,
  ub: unidentifiedBarcode
}