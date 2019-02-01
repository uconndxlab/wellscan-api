const path = require('path');
const express = require('express');

const app = express();

app.get('/', function(req, res) {
    res.send("Hello World!");
})




const PORT = process.env.PORT || 8080;
app.listen(PORT, function() {
    console.log(`Listening to localhost:${PORT}...`);
    console.log('Ctrl+C to quit.');
})
