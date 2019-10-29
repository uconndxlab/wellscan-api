import Nutritionix from "./nutritionix";
import OpenFoodFacts from "./openfoodfacts";
import express from "express";

const off = new OpenFoodFacts();
const nix = new Nutritionix();

let source_functions = [
    function(req, res, next) {
        if (!res.locals.nutrition) {
            let opt = {
                barcode: req.params.barcode
            }
            off.getNutritionByUPC(opt,
                nutrition => {
                    res.locals.nutrition = nutrition;
                    //res.send(nutrition)
                    res.locals.nutrition_source = off.source;
                    next();
                },
                response => {
                    next(); // move onto next source in list if not found
                },
                err => {
                    res
                    .status(401)
                    .send("Failed to get nutrition data: " + err.message);
                    return;
                 }
            );
        }
        else {
            next();
        }
    },
    function(req, res, next) {
  
        //get nutritionix data from barcode
        if (!res.locals.nutrition) {
            let opt = {
            barcode: req.params.barcode,
            id: req.headers.nixId,
            key: req.headers.nixKey
            }
            nix.getNutritionByUPC(opt,
            nutrition => {
                res.locals.nutrition = nutrition;
                res.locals.nutrition_source = nix.source;
                next();
            },
            null, //do nothing if not found in db
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
    },
    function(req, res, next) {
        if (!res.locals.nutrition) {
            res
            .status(401)
            .send("Failed to get nutrition data for " + req.params.barcode);
            return;
        }
        next();
    }
];
    
export default source_functions;