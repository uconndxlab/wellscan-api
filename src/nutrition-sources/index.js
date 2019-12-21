//import Nutritionix from "./nutritionix";
import OpenFoodFacts from "./openfoodfacts";
import USDA from "./usda";
import FatSecret from "./fatsecret";

const off = new OpenFoodFacts();
//const nix = new Nutritionix();
const usda = new USDA();
const fs = new FatSecret();

let source_functions = [
//    nix.express_router.bind(nix),
    fs.express_router.bind(fs),
    usda.express_router.bind(usda),
    off.express_router.bind(off)
];
    
export default source_functions;
