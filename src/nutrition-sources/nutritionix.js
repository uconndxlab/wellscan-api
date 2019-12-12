import axios from "axios";
import env from "../env";

export default class Nutritionix {
    constructor({nix_appId, nix_appKey, nix_endpoint}={}) {
        this.appId = nix_appId || env.nix_appId;
        this.appKey = nix_appKey || env.nix_appKey;
        this.upcEndpoint = nix_endpoint || env.nix_endpoint;
        this.source = "nutritionix";
    }

    getNutritionByUPC(options, success, notfound, fail) {
        const upc = options.barcode;
        const id = options.appKey && options.appId || this.appId;
        const key = options.appId && options.appKey || this.appKey;
        const url = this.upcEndpoint + upc + "&appId=" + id + "&appKey=" + key;
        axios.get(url)
            .then(response => success(response.data))
            .catch( err => fail(err))
    }

    express_router(req, res, next) {
  
        //get nutritionix data from barcode
        if (!res.locals.nutrition) {
            let opt = {
            barcode: req.params.barcode,
            id: req.headers.nixId,
            key: req.headers.nixKey
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
