//import all nutrition info
import OpenFoodFacts from "./openfoodfacts";
import USDA from "./usda";
import FatSecret from "./fatsecret";

//instantiate nutrition source objects
const off = new OpenFoodFacts();
const usda = new USDA();
const fs = new FatSecret();

// this list of functions is the routers for each nutrition object
// ORDER MATTERS! we'll try the nutrition source at index 0, then the one at index 1, then so on...
let source_functions = [
    fs.express_router.bind(fs),
    usda.express_router.bind(usda),
    off.express_router.bind(off)
];
    
export default source_functions;
