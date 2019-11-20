import axios from "axios";
let np = require("nested-property");

export default class OpenFoodFacts {
    constructor() {
        
        this.source = "open-food-facts";
        this.upcEndpoint = "https://world.openfoodfacts.org/api/v0/product/"
    }

    getNutritionByUPC(options, success, notfound, fail) {
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
    convertFoodDataToSchema(old_data) {
        
        const sv = np.get(old_data, "product.nutriments.sodium_unit")
        return {
            "item_name": np.get(old_data, "product.product_name"),
            "nf_ingredient_statement": np.get(old_data, "product.ingredients_text"),
            "nf_water_grams": null,
            "nf_calories": np.get(old_data, "product.nutriments.energy"),
            "nf_calories_from_fat": np.get(old_data, "product.nutriments.fat_serving") * 9,
            "nf_total_fat": np.get(old_data, "product.nutriments.fat_serving"),
            "nf_saturated_fat": np.get(old_data, "product.nutriments.saturated-fat_serving"),
            "nf_trans_fatty_acid": np.get(old_data, "product.nutriments.trans-fat_serving"),
            "nf_cholesterol": np.get(old_data, "product.nutriments.cholesterol_serving"),
            "nf_sodium": sv == "mg" ? np.get(old_data, "product.nutriments.sodium_serving") : sv == "g" ? np.get(old_data, "product.nutriments.sodium_serving") * 1000 : null,
            "nf_total_carbohydrate": np.get(old_data, "product.nutriments.carbohydrates_serving"),
            "nf_dietary_fiber": np.get(old_data, "product.nutriments.fiber_serving"),
            "nf_sugars": np.get(old_data, "product.nutriments.sugars_serving"),
            "nf_protein": np.get(old_data, "product.nutriments.proteins_serving"),
            "nf_vitamin_a_dv": np.get(old_data, "product.nutriments.vitamin-a_serving"),
            "nf_vitamin_c_dv": np.get(old_data, "product.nutriments.vitamin-c_serving"),
            "nf_calcium_dv": np.get(old_data, "product.nutriments.calcium_serving"),
            "nf_iron_dv": np.get(old_data, "product.nutriments.iron_serving")
          }
    }
    express_router(req, res, next) {
        if (!res.locals.nutrition) {
            let opt = {
                barcode: req.params.barcode
            }
            this.getNutritionByUPC(opt,
                nutrition => {
                    res.locals.nutrition = nutrition;
                    //res.send(nutrition);
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
