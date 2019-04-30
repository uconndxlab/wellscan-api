import axios from "axios";
import env from "../env";

export default class Nutritionix {
    constructor({nix_appId, nix_appKey, nix_endpoint}={}) {
        this.appId = nix_appId || env.nix_appId || process.env.nix_appId;
        this.appKey = nix_appKey || env.nix_appKey || process.env.nix_appKey;
        this.upcEndpoint = nix_endpoint || env.nix_endpoint || process.env.nix_endpoint;
    }

    getNutritionByUPC(options, success, fail) {
        const upc = options.barcode;
        const id = options.appKey && options.appId || this.appId;
        const key = options.appId && options.appKey || this.appKey;
        const url = this.upcEndpoint + upc + "&appId=" + id + "&appKey=" + key;
        axios.get(url)
            .then(response => success(response))
            .catch( err => fail(err))
    }
}
