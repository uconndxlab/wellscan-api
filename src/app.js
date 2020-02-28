import express from "express";
import rank from "./controllers/rank";
import foodInfo from "./controllers/foodinfo";

const app = express();

app.use(foodInfo);
app.use(rank);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Listening to localhost:${PORT}...`);
  console.log("Ctrl+C to quit.");
});

export default app;