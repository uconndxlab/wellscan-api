
const firebase = require("firebase");
// Required for side-effects
require("firebase/firestore");


export default class WellScanGlobal {
    constructor() {
        var firebaseOpts = {
            apiKey: process.env.firebaseApiKey || "AIzaSyCeZsQqloriPNrPUaVsEYtvAGmgdYPiA1Q",
            authDomain: process.env.firebaseAuthDomain || "wellscan.firebaseapp.com",
            databaseURL: process.env.firebaseDatabaseURL || "https://wellscan.firebaseio.com",
            projectId: process.env.firebaseProjectId || "wellscan",
            storageBucket: process.env.firebaseStorageBucket || "wellscan.appspot.com",
            messagingSenderId: "477728865423"
        }

        firebase.initializeApp(firebaseOpts);
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
