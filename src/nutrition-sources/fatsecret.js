const request = require("request");
import env from "../env";
const np = require("nested-property");
const get = np.get;
np.get = function(json, key) {
    let val = get(json,key);
    if (isNaN(val)) {
        return val;
    }
    else {
        return parseInt(val);
    }
}

export default class FatSecret {
    constructor() {
        this.client_id = env.fs_id;
        this.client_secret = env.fs_secret;
        this.acccessTokenEndpoint = 'https://oauth.fatsecret.com/connect/token';
        this.fidEndpoint = "https://platform.fatsecret.com/rest/server.api";
        this.upcEndpoint = "https://platform.fatsecret.com/rest/server.api";
        this.source = "fat-secret";
        this.access_token = false;
        //keep getting access token or else we get locked out
        this.refreshAccessToken()
        setInterval(function() {
            this.refreshAccessToken();
        }.bind(this), 86402 * 1000);
    }
    refreshAccessToken(success, fail) {
        // getting an access token and putting it in this
        const context = this;
        //set up some options
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
        //make the request
        request(opt, (error, response) => {
            //if something happens
            if (error) {
                context.access_token = null;
                //use our callback
                if (fail) {
                    fail(error);
                }
                //then get out
                return;
            }
            //otherwise – yay we got the access token
            context.access_token = response.body.access_token;
            //then we call the success callback
            if (success) {
                success()
            }
        });
    }
    getNutritionByUPC(options, success, notfound, fail) {
        //main function to get a nutrition info (takes 2 calls)

        //some setting up w/ upc, tokens, and the first call
        const upc = options.barcode;
        const access_token = this.access_token;
        const context = this;
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
        // make the request
        request(fid_opts, function (error, response, body) {
            //look at what we got
            let json = JSON.parse(body);
            if (error || json.error) {
                
                if (json.error.code == 13) {
                    context.refreshAccessToken();
                }
                fail(error)
            }
            // we know we didn't find the food if there is no food_id or these is no food_id
            if (!json.food_id || json.food_id.value === '0' || !json.food_id.value) {
                notfound();
                return;
            }
            let fid = json.food_id.value;
            if (!fid) {
                notfound();
                return;
            }
            // set up for second call
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
            // make the call
            request(options, (error2, response2, body2) => {
                if (error2) {
                    fail(error2)
                }

                let nutrition = context.convertFoodDataToSchema(JSON.parse(body2));
                success(nutrition);
            })

        })
    }
    convertSaturatedFat(sat_fat, fat) {
        //helper
        if (isNaN(sat_fat)) {
            if (fat === 0) {
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
        let nut = {
            "item_name": np.get(old_data, "food.food_name"),
            "nf_ingredient_statement": null,
            "nf_water_grams": null,
            "nf_calories": np.get(old_data, "food.servings.serving.calories"),
            "nf_calories_from_fat": np.get(old_data, "food.servings.serving.fat") ? np.get(old_data, "food.servings.serving.fat") * 9 : undefined,
            "nf_total_fat": np.get(old_data, "food.servings.serving.fat"),
            "nf_saturated_fat": this.convertSaturatedFat(np.get(old_data, "food.servings.serving.saturated_fat"), np.get(old_data, "food.servings.serving.fat")),
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
        // the actual route 
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
                next();
             }
            );
        } else {
            next();
        }
    }
}
