import { env } from "./env";
import { createApp } from "./app";
import { initDb } from "./db";
import { seedFoods } from "./seed";

initDb();
seedFoods();

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`BiteLog API listening on http://localhost:${env.PORT}`);
});
