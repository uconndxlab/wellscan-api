import env from "../env";
const firebase = require("firebase");
// Required for side-effects
require("firebase/firestore");

export default class WellScanGlobal {
    constructor() {
        firebase.initializeApp(env.firebaseOpts);
        this.db = firebase.firestore();
    }

    checkFoodExists(upc,success,err) {
        var docRef = this.db.collection("foods").doc(upc);
        docRef.get().then(function(doc) {
            if (doc.exists) {
                var ret = {
                    found:true,
                    data : doc
                }
            } else {
                var ret = {
                    found:false
                }
            }
            success(ret);
        }).catch(function(error) {
            err(error);
        });

    }

    addRecord(opts) {
        this.db.collection("foods").doc(opts.upc).set(opts, {merge: true});
    }
}
