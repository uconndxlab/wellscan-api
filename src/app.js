
import express from "express";

const app = express();

app.get('/', (req, res) => {
    res.send("Hello World!");
})

app.get("/api/:system/:category/:barcode", (req, res) => {
    });

});


const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Listening to localhost:${PORT}...`);
    console.log('Ctrl+C to quit.');
})
