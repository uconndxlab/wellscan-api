export default {
  "first-ingredient" : (ingred, search) => ingred.toLowerCase().startsWith(search.toLowerCase()),
  "contains": (ingred, search) => ingred.toLowerCase().includes(search.toLowerCase())
}
