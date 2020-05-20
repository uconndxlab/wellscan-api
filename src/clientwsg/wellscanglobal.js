
const firebase = require("firebase");
// Required for side-effects
require("firebase/firestore");


export default class WellScanGlobal {
    constructor() {
        // setting up firebase options
        const firebaseOpts = {
            apiKey: process.env.firebaseApiKey || "AIzaSyCeZsQqloriPNrPUaVsEYtvAGmgdYPiA1Q",
            authDomain: process.env.firebaseAuthDomain || "wellscan.firebaseapp.com",
            databaseURL: process.env.firebaseDatabaseURL || "https://wellscan.firebaseio.com",
            projectId: process.env.firebaseProjectId || "wellscan",
            storageBucket: process.env.firebaseStorageBucket || "wellscan.appspot.com",
            messagingSenderId: "477728865423"
        }

        firebase.initializeApp(firebaseOpts);
        //setting collection strings
        this.db = firebase.firestore();
        this.foodColl = "WellScanGlobal"
        this.unidentifiedBarcodeColl = "WellScanGlobal_unidentifiedBarcodes"
        this.mainColl = "foods";
    }

    checkFoodExists(upc,success,err) {
        let coll = this.foodColl;
        var docRef = this.db.collection(coll).doc(upc);
        //call to WSG
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

    updateFoodRecord(opts) {
        //simple update based on opts
        //opts MUST contain a upc
        let coll = this.foodColl;
        this.db.collection(coll).doc(opts.upc).set(opts, {merge: true});
    }
    addUnidentifiedBarcode(opts) {
        //adding an unidentified barcode

        //first we need to find what went wrong. If a parameter is set to null, then it might point the why this is unidentified
        let coll = this.unidentifiedBarcodeColl;
        let upc = opts.barcode;
        let msg = opts.msg ? opts.msg : null;
        let nutrition =  opts.nutrition ? opts.nutrition : null;
        let nutrition_source = opts.nutrition_source ? opts.nutrition_source : null;
        let fbRecord = {
            upc,
            msg,
            nutrition,
            nutrition_source
        }
        //creating and call the ref
        let currRef = this.db.collection(coll).doc(upc);
        currRef.get().then(doc => {
            if (doc.exists) {
                fbRecord.lastDate = (new Date()).toString();
                fbRecord.numberOfCalls = (doc.data.numberOfCalls ? doc.data.numberOfCalls : 0) + 1;
            }
            else {
                let date = new Date();
                fbRecord.lastDate = date.toString();
                fbRecord.firstDate = date.toString();
                fbRecord.numberOfCalls = 1
            }
            this.db.collection(coll).doc(upc).set(fbRecord, {merge: true});
        })
    }
    getAllFoods(success, err, limit) {
        //helper to scan all foods in WSG
        let coll = "foods";

        let collRef = this.db.collection(coll);

        let foodDocs = collRef.orderBy('upc')
        let handle = foodDocs.get().then( docs => {
            success(docs)
        },
        e => err(e)
        );

    }
}
