import axios from "axios";
import env from "../env";

export default class Nutritionix {
    constructor({nix_appId, nix_appKey, nix_endpoint}={}) {
        this.appId = nix_appId || env.nix_appId;
        this.appKey = nix_appKey || env.nix_appKey;
        this.upcEndpoint = nix_endpoint || env.nix_endpoint;
    }
    getNutritionByUPC(upc, success, fail) {
        const url = this.upcEndpoint + upc + "&appId=" + this.appId + "&appKey=" + this.appKey;
        axios.get(url)
            .then(response => success(response))
            .catch( err => fail(err))
    }
}
