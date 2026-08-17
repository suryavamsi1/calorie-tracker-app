import "dotenv/config";
import { createApp } from "./app";
import { initDb } from "./db";
import { seedFoods } from "./seed";

initDb();
seedFoods();

const app = createApp();
const PORT = Number(process.env.PORT) || 4000;

app.listen(PORT, () => {
  console.log(`Calorie tracker API listening on http://localhost:${PORT}`);
});
