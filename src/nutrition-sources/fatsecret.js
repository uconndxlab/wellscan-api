import axios from "axios";
const request = require("request");
import env from "../env";
let np = require("nested-property");


export default class FatSecret {
    constructor() {
        this.client_id = env.fs_id;
        this.client_secret = env.fs_secret;
        this.acccessTokenEndpoint = 'https://oauth.fatsecret.com/connect/token';
        this.fidEndpoint = "https://platform.fatsecret.com/rest/server.api";
        this.upcEndpoint = "https://platform.fatsecret.com/rest/server.api";
        this.source = "fat-secret";
        this.access_token = false;
        
        this.refreshAccessToken()
    }
    refreshAccessToken(success, fail) {
        let opt = { 
            method: 'POST',
            url: this.acccessTokenEndpoint,
            auth : {
                user : this.client_id,
                password : this.client_secret
            },
            headers: { 'content-type': 'application/json'},
            form: {
                'grant_type': 'client_credentials',
                'scope' : 'barcode'
            },
            json: true 
        };
        
        request(opt, (error, response) => {
            if (error) {
                this.access_token = null;
                if (fail) {
                    fail(error);
                }
                return;
            }
            this.access_token = response.body.access_token;
            if (success) {
                success(response)
            }
        });
    }
    getNutritionByUPC(options, success, notfound, fail) {
        const upc = options.barcode;
        const access_token = this.access_token;
        let context = this;

        let fid_opts = { method: 'POST',
        url: 'https://platform.fatsecret.com/rest/server.api',
        qs: {   method: 'food.find_id_for_barcode',
                barcode: upc,
                format: 'json' 
            },
        headers: {
                Authorization: 'Bearer ' + access_token,
                'Content-Type': 'application/json' 
            } 
        };

        request(fid_opts, function (error, response, body) {
            //console.log(response)
            if (error) throw new Error(error);

            let fid_json = JSON.parse(body)
            if (!fid_json.food_id) {
                notfound();
                return;
            }
            let fid = fid_json.food_id.value;

            let options = { method: 'POST',
            url: 'https://platform.fatsecret.com/rest/server.api',
            qs: { 
                method: 'food.get', food_id: fid, format: 'json' 
            },
            headers: { 
                    Authorization: 'Bearer ' + access_token,
                    'Content-Type': 'application/json' 
                }
            };

            request(options, (error2, response2, body2) => {
                if (error2) throw new Error(error2);

                let nutrition = context.convertFoodDataToSchema(JSON.parse(body2));
                success(nutrition);
            })

        })
        

    }
    convertFoodDataToSchema(old_data) {
        let nut = {
            "item_name": np.get(old_data, "food.food_name"),
            "nf_ingredient_statement": null,
            "nf_water_grams": null,
            "nf_calories": np.get(old_data, "food.servings.serving.calories"),
            "nf_calories_from_fat": np.get(old_data, "food.servings.serving.fat") * 9,
            "nf_total_fat": np.get(old_data, "food.servings.serving.fat"),
            "nf_saturated_fat": np.get(old_data, "food.servings.serving.saturated_fat"),
            "nf_trans_fatty_acid": np.get(old_data, "food.servings.serving.trans_fat"),
            "nf_cholesterol": np.get(old_data, "food.servings.serving.cholesterol"),
            "nf_sodium": np.get(old_data, "food.servings.serving.sodium"),
            "nf_total_carbohydrate": np.get(old_data, "food.servings.serving.carbohydrate"),
            "nf_dietary_fiber": np.get(old_data, "food.servings.serving.fiber"),
            "nf_sugars": np.get(old_data, "food.servings.serving.sugar"),
            "nf_protein": np.get(old_data, "food.servings.serving.protein"),
            "nf_vitamin_a_dv": np.get(old_data, "food.servings.serving.vitamin_a"),
            "nf_vitamin_c_dv": np.get(old_data, "food.servings.serving.vitamin_c"),
            "nf_calcium_dv": np.get(old_data, "food.servings.serving.calcium"),
            "nf_iron_dv": np.get(old_data, "food.servings.serving.iron")
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
        if (!res.locals.nutrition) {
            let opt = {
                barcode: req.params.barcode,
            }
            this.getNutritionByUPC(opt,
            nutrition => {
                res.locals.nutrition = nutrition;
                res.locals.nutrition_source = this.source;
                next();
            },
            response => next(), //do nothing if not found in db
            err => {
                res
                .status(401)
                .send("Failed to get nutrition data: " + err.message);
                return;
             }
            );
        } else {
            next();
        }
    }
}
