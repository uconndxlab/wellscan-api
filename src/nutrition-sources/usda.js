import axios from "axios";
import env from "../env";
let np = require("nested-property");


export default class USDA {
    constructor() {
        this.appKey = env.usda_key || process.env.usda_key;
        this.fdcidEndpoint = env.usda_fdcid_endpoint || process.env.usda_fdcid_endpoint;
        this.upcEndpoint = env.usda_upc_endpoint || process.env.usda_upc_endpoint;
        this.source = "usda";
    }

    getNutritionByUPC(options, success, notfound, fail) {
        //get nutrition, need to do a search for food id (fdcid) and get nutrition info for that fdcid
        const upc = options.barcode;
        if (isNaN(upc)) {
            fail(new Error("Not a UPC barcde"))
            return;
        }
        const key = options.appId && options.appKey || this.appKey;
        const url = this.fdcidEndpoint + key;
        // post request to get food id
        axios.post(url, { "generalSearchInput": upc })
            .then(response => {
                if (response.totalHits < 1) {
                    notfound(response);
                    // if not found move on
                    return;
                }
                else {
                    let fdcid = response.data.foods[0].fdcId
                    // with fdcid let's use it to get the nutrition info for that food
                    let fdcidUrl = this.upcEndpoint + fdcid +"?api_key=" + key;
                    axios.get(fdcidUrl)
                    .then(response2 => {
                        success(this.convertFoodDataToSchema(response2.data));
                    })
                    .catch( err => fail(err))
                }
            })
            .catch( err => fail(err))
    }

    convertFat(g) {
        //help convert
        return isNaN(g) ? undefined : Math.round(g * 9);
    }
    convertSaturatedFat(sat_fat, fat) {
        //help convert
        if (isNaN(sat_fat)) {
            if ( fat === 0) {
                return 0;
            }
            else {
                return undefined;
            }
        }
        else {
            return sat_fat;
        }
    }
    
    convertFoodDataToSchema(old_data) {
        //converting food info to our nutrition object
        let saturatedFat = this.convertSaturatedFat(np.get(old_data, "labelNutrients.saturatedFat.value"), np.get(old_data, "labelNutrients.fat.value"));
        
        let nut = {
            "item_name": np.get(old_data, "description"),
            "nf_ingredient_statement": np.get(old_data, "ingredients"),
            "nf_water_grams": undefined,
            "nf_calories": np.get(old_data, "labelNutrients.calories.value"),
            "nf_calories_from_fat": this.convertFat(np.get(old_data, "labelNutrients.fat.value")),
            "nf_total_fat": np.get(old_data, "labelNutrients.fat.value"),
            "nf_saturated_fat": saturatedFat,
            "nf_trans_fatty_acid": np.get(old_data, "labelNutrients.transFat.value"),
            "nf_cholesterol": np.get(old_data, "labelNutrients.cholesterol.value"),
            "nf_sodium": np.get(old_data, "labelNutrients.sodium.value"),
            "nf_total_carbohydrate": np.get(old_data, "labelNutrients.carbohydrates.value"),
            "nf_dietary_fiber": np.get(old_data, "labelNutrients.fiber.value"),
            "nf_sugars": np.get(old_data, "labelNutrients.sugars.value"),
            "nf_protein": np.get(old_data, "labelNutrients.protein.value"),
            "nf_vitamin_a_dv": undefined,
            "nf_vitamin_c_dv": undefined,
            "nf_calcium_dv": np.get(old_data, "labelNutrients.calcium.value"),
            "nf_iron_dv": np.get(old_data, "labelNutrients.iron.value")
          }
        
        Object.keys(nut).forEach(key => {
            if (nut[key] === undefined) {
                // check for null
                nut[key] = null;
            } else if (!isNaN(nut[key])) {
                // round all numbers
                nut[key] = Math.round(nut[key])
            }
        });
        return nut;
    }
    express_router(req, res, next) {
        // our prime router
        if (!res.locals.nutrition) {
            let opt = {
                barcode: req.params.barcode,
                key: req.params.appKey
            }
            this.getNutritionByUPC(opt,
                nutrition => {
                    res.locals.nutrition = nutrition;
                    res.locals.nutrition_source = this.source;
                    next();
                },
                response => {
                    next(); // move onto next source in list if not found
                },
                err => {
                    next();
                 }
            );
        }
        else {
            next();
        }
    }
}
