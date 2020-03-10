function checkSWAP(nut) {
    //returns true if nutrition object has all the properties
    return (nut.nf_saturated_fat !== null && nut.nf_sodium !== null && nut.nf_sugars !== null)
}

export default {
    swap: checkSWAP

}