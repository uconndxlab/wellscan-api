
import express from "express";

const app = express();

import Nutritionix from "./nutritionix";
const nix = new Nutritionix();

app.get('/', (req, res) => {
    res.send("Hello World!");
})

app.get("/api/:system/:category/:barcode", (req, res) => {
    const params = req.params;
    nix.getNutritionByUPC(params.barcode, nutrition => {
        res.send(JSON.stringify(nutrition.data));
    });

});


const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Listening to localhost:${PORT}...`);
    console.log('Ctrl+C to quit.');
})
