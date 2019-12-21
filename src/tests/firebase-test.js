import sync_request from "sync-request";
import sleep from "sleep";

import WellScanGlobal from "../clientwsg/wellscanglobal";
const wsg = new WellScanGlobal();
let g = 0;
let m = 0;
let f = 0;
wsg.getAllFoods(docs => {
        docs.forEach(function(doc) {
            let fbdata = doc.data();
            let system = "swap"
            let category = fbdata.rankings[system].category === "grain" ? "grain-whole" : fbdata.rankings[system].category
            if (!category) { return; }
            let rank = fbdata.rankings[system].rank
            let barcode = fbdata.upc;
            let url = `http://localhost:8080/api/${system}/${category}/${barcode}`;
            let result = sync_request("GET", url, {
                json: true
            });
            console.log(url);
            if (result.statusCode < 300) {
                console.log("SUCCESS")
                g++;
            }
            else {
                console.log(JSON.parse(result.body).msg);
                f++;
            }
            console.log(g,m,f)
            sleep.sleep(10)
            //console.log(JSON.parse(result.getBody()))
            // axios.get(url).then( res => {
            //     console.log(url);
            //     if (res.data.rank == rank) {

            //         console.log("    SUCCESS:", barcode, rank)
            //         g++;
            //     }
            //     else {
            //         console.log("    MEHHHH:", barcode, "Expected", rank, "and got", res.data.rank)
            //         wsg.updateFoodRecord({
            //             upc: barcode,
            //             different_swap_rank: true,
            //             original_swap_rank: rank,
            //             now_swap_rank: res.data.rank
            //         })
            //         m++;
            //     }
            //     console.log(g,m,f)
                
            // }).catch( err => {
            //     console.log(url);
            //     if (err.response) {
            //         console.log("    FAIL:", barcode, err.response.data.status, err.response.data.msg);
            //     }
            //     else {
            //         console.log("    UNKNOWN ERROR");
            //     }
            //     f++;
            //     console.log(g,m,f)
            // })
        })  
    },
    e => {
        console.log(e);
    },
    300
)
