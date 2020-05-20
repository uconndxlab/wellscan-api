import axios from "axios";
let np = require("nested-property");

export default class OpenFoodFacts {
    constructor() {
        
        this.source = "open-food-facts";
        this.upcEndpoint = "https://world.openfoodfacts.org/api/v0/product/"
    }

    getNutritionByUPC(options, success, notfound, fail) {
        //get json from url. no auth needed
        const upc = options.barcode;
        const url = this.upcEndpoint + upc + ".json";
    
        axios.get(url)
            .then(response => {
                if (response.data.status < 1) {
                    notfound(response.data)
                }
                else {
                    success(this.convertFoodDataToSchema(response.data))
                }
            })
            .catch( err => fail(err))
    }
    convertKCal(kJ) {
        //help convert
        return isNaN(kJ) ? undefined : Math.round(kJ / 4.184)
    }
    convertCalcium(g) {
        //help convert
        return isNaN(g) ? undefined : Math.round(g * 1000)
    }
    convertFat(g) {
        //help convert
        return isNaN(g) ? undefined : Math.round(g * 9);
    }
    convertSaturatedFat(sat_fat, fat) {
        //help convert
        if (isNaN(sat_fat)) {
            if (fat === 0) {
                return 0;
            }
            else {
                return undefined;
            }
        }
        else {
            return sat_fat
        }
    }
    convertSodium(sv, sod) {
        //help convert
        if (isNaN(sod)) {
            return undefined;
        }
        return sv == "mg" ? sod : sv == "g" ? sod * 1000 : undefined;
    }
    convertFoodDataToSchema(old_data) {
        // convert current nutrition info to our parameters
        const sv = np.get(old_data, "product.nutriments.sodium_unit")
        let nut = {
            "item_name": np.get(old_data, "product.product_name"),
            "nf_ingredient_statement": np.get(old_data, "product.ingredients_text"),
            "nf_water_grams": undefined,
            "nf_calories": this.convertKCal(np.get(old_data, "product.nutriments.energy_serving")),
            "nf_calories_from_fat": this.convertFat(np.get(old_data, "product.nutriments.fat_serving")),
            "nf_total_fat": np.get(old_data, "product.nutriments.fat_serving"),
            "nf_saturated_fat": this.convertSaturatedFat(np.get(old_data, "product.nutriments.saturated-fat_serving"), np.get(old_data, "product.nutriments.fat_serving")),
            "nf_trans_fatty_acid": np.get(old_data, "product.nutriments.trans-fat_serving"),
            "nf_cholesterol": np.get(old_data, "product.nutriments.cholesterol_serving"),
            "nf_sodium": this.convertSodium(sv, np.get(old_data, "product.nutriments.sodium_serving")),
            "nf_total_carbohydrate": np.get(old_data, "product.nutriments.carbohydrates_serving"),
            "nf_dietary_fiber": np.get(old_data, "product.nutriments.fiber_serving"),
            "nf_sugars": np.get(old_data, "product.nutriments.sugars_serving"),
            "nf_protein": np.get(old_data, "product.nutriments.proteins_serving"),
            "nf_vitamin_a_dv": np.get(old_data, "product.nutriments.vitamin-a_serving"),
            "nf_vitamin_c_dv": np.get(old_data, "product.nutriments.vitamin-c_serving"),
            "nf_calcium_dv": this.convertCalcium(np.get(old_data, "product.nutriments.calcium_serving")),
            "nf_iron_dv": np.get(old_data, "product.nutriments.iron_serving")
        }

        Object.keys(nut).forEach(key => {
            if (nut[key] === undefined || nut[key] === null) {
                nut[key] = null;
            } else if (!isNaN(nut[key])) {
                // round all numbers
                nut[key] = Math.round(nut[key])
            }
        });
        return nut;
    }
    express_router(req, res, next) {
        //the acutal router
        if (!res.locals.nutrition) {
            let opt = {
                barcode: req.params.barcode
            }
            // if we do not have nutrition yet, then we try this route to find nutrition
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
                    res
                    .status(401)
                    .send("Failed to get nutrition data: " + err.message);
                    return;
                 }
            );
        }
        else {
            next();
        }
    }
}
