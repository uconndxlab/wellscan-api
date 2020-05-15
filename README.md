Backend API for getting nutritional information from a barcode and nutritional ranking system. To run:

```

npm install

npm start

```

OR

```

yarn install

yarn start

```

## Overview of file structure
```
src/clientswsg
```
Contains all files related to connecting with WellScan Global. Currently there are two files, one for storing the Express routes to be used in other workflows and another to store helper functions to support the Express Routes

```
src/foodInfo
```
Holds all the Express routes that the final app uses. It currently has one for the ranking system route and one to get food info. Every future route/workflow should be programmed in separate files in the folder. 
The routes will borrow logic from all other folders in src/ to support each workflow.

```
src/db
```
Is for all the ranking system info. It contains json files for HER, SWAP, etc. Each JSON file contains logic to be used in tandem with the `src/operators` files. Each JSON file starts out in initial information about the ranking system and then finally contain an array with all the different categories for foods. Each category contains the info as an array for the ranks other than the default rank (e.g. "red", "use rarely"). Any route should use a degradation approach to ranking foods, i.e. if it fails the requirements for green, try yellow, and then if yellow fails, it has to be red. Each requirement has three values: one for the key to access the nutrition object (sodium), one for the key to operator (less than), and a number for the value (500). Each set of requirements is strict –if a food fails one requirement, then it fails all the requirements for that rank. 

\* Maybe we should move this to another database to make it editable by nutritionists?

```
src/operators
```
Is for all the function for comparisons. Each .js file should contain a map for strings to functions that take two inputs. These string keys should be used in the db and the operator's index.js file can be imported into any routes that need them
```
src/nutrition_sources
```
Stores all the logic for getting and processing info from other nutrition sources. Each is represented as a class that must have a constructor that stores the variable `source` set to a string that is unique to each nutrition source. Each class should also have a function `getNutritionByUPC(options,  success,  notfound,  fail)` that can be used by routers to get the nutrition info. The inputs are an `options` object for the UPC code, any API keys, or things to be set, a `success` function that takes in the final nutrition object, a `notfound` function that takes any additional data when a food info is not found, and a `fail` function that takes in an error object to handle. The goal is to send back a nutrition object with the structure

```
{
"item_name": STRING,
"nf_ingredient_statement": STRING,
"nf_water_grams": NUMBER,
"nf_calories": NUMBER,
"nf_calories_from_fat": NUMBER,
"nf_total_fat": NUMBER,
"nf_saturated_fat": NUMBER,
"nf_trans_fatty_acid": NUMBER,
"nf_cholesterol": NUMBER,
"nf_sodium": NUMBER,
"nf_total_carbohydrate": NUMBER,
"nf_dietary_fiber": NUMBER,
"nf_sugars": NUMBER,
"nf_protein": NUMBER,
"nf_vitamin_a_dv": NUMBER,
"nf_vitamin_c_dv": NUMBER,
"nf_calcium_dv": NUMBER,
"nf_iron_dv": NUMBER}
```
If any value was not able to processed, the key should be set to `null` to indicate that it could not be found. All other functions other than `constructor` and `getNutritionByUPC` are helpers to support the nutrition source.

Each nutrition source class is instantiated in the index.js file to be shipped off to other files that need them. 

\* Future feature should be to make a base class that can be extended for each ranking system

```
src/tests
```
has not been used in a while. After a lot of changes in the API, these aren't as relevant and could use  some updated. It currently uses checks the ranking of different foods and if its ranking is green, yellow, or red.

To update these tests the following should be done:

 - Check the /nutrition/ route for various nutrition object
 - Check if the object is already in WSG
 - Have foods that are testable that are not in WSG or maybe could delete it from WSG, only to put it back there
 - check for nutrition source
