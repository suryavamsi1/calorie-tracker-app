import { db } from "./db";
import { generateId } from "./utils/id";

// Curated starter food database for MVP (Option 1 from the product plan).
// Calories are approximate per the listed serving size/unit.
const STARTER_FOODS: Array<{
  name: string;
  brand?: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
}> = [
  { name: "Apple", servingSize: 1, servingUnit: "medium (182g)", calories: 95 },
  { name: "Banana", servingSize: 1, servingUnit: "medium (118g)", calories: 105 },
  { name: "Orange", servingSize: 1, servingUnit: "medium (131g)", calories: 62 },
  { name: "Egg, whole", servingSize: 1, servingUnit: "large (50g)", calories: 72 },
  { name: "White rice, cooked", servingSize: 1, servingUnit: "cup (158g)", calories: 205 },
  { name: "Brown rice, cooked", servingSize: 1, servingUnit: "cup (195g)", calories: 216 },
  { name: "Chicken breast, grilled", servingSize: 100, servingUnit: "g", calories: 165 },
  { name: "Chicken thigh, grilled", servingSize: 100, servingUnit: "g", calories: 209 },
  { name: "Ground beef, 90% lean, cooked", servingSize: 100, servingUnit: "g", calories: 176 },
  { name: "Salmon, cooked", servingSize: 100, servingUnit: "g", calories: 208 },
  { name: "Whole wheat bread", servingSize: 1, servingUnit: "slice (28g)", calories: 69 },
  { name: "White bread", servingSize: 1, servingUnit: "slice (28g)", calories: 75 },
  { name: "Oatmeal, cooked", servingSize: 1, servingUnit: "cup (234g)", calories: 158 },
  { name: "Greek yogurt, plain, nonfat", servingSize: 1, servingUnit: "cup (245g)", calories: 133 },
  { name: "Whole milk", servingSize: 1, servingUnit: "cup (244g)", calories: 149 },
  { name: "Skim milk", servingSize: 1, servingUnit: "cup (245g)", calories: 83 },
  { name: "Cheddar cheese", servingSize: 1, servingUnit: "oz (28g)", calories: 113 },
  { name: "Peanut butter", servingSize: 2, servingUnit: "tbsp (32g)", calories: 188 },
  { name: "Almonds", servingSize: 1, servingUnit: "oz (28g, ~23 nuts)", calories: 164 },
  { name: "Avocado", servingSize: 1, servingUnit: "medium (150g)", calories: 240 },
  { name: "Broccoli, cooked", servingSize: 1, servingUnit: "cup (156g)", calories: 55 },
  { name: "Spinach, raw", servingSize: 2, servingUnit: "cups (60g)", calories: 14 },
  { name: "Sweet potato, baked", servingSize: 1, servingUnit: "medium (114g)", calories: 103 },
  { name: "Potato, baked", servingSize: 1, servingUnit: "medium (173g)", calories: 161 },
  { name: "Pasta, cooked", servingSize: 1, servingUnit: "cup (140g)", calories: 221 },
  { name: "Tomato", servingSize: 1, servingUnit: "medium (123g)", calories: 22 },
  { name: "Carrot", servingSize: 1, servingUnit: "medium (61g)", calories: 25 },
  { name: "Black beans, cooked", servingSize: 1, servingUnit: "cup (172g)", calories: 227 },
  { name: "Tofu, firm", servingSize: 100, servingUnit: "g", calories: 144 },
  { name: "Olive oil", servingSize: 1, servingUnit: "tbsp (14g)", calories: 119 },
  { name: "Butter", servingSize: 1, servingUnit: "tbsp (14g)", calories: 102 },
  { name: "Orange juice", servingSize: 1, servingUnit: "cup (248g)", calories: 112 },
  { name: "Coffee, black", servingSize: 1, servingUnit: "cup (240g)", calories: 2 },
  { name: "Pizza, cheese", servingSize: 1, servingUnit: "slice (107g)", calories: 285 },
  { name: "Hamburger", servingSize: 1, servingUnit: "sandwich (110g)", calories: 295 },
  { name: "French fries", servingSize: 1, servingUnit: "medium serving (117g)", calories: 365 },
  { name: "Caesar salad, no dressing", servingSize: 1, servingUnit: "bowl (150g)", calories: 120 },
  { name: "Granola bar", servingSize: 1, servingUnit: "bar (28g)", calories: 120 },
  { name: "Protein shake", servingSize: 1, servingUnit: "scoop + water (30g)", calories: 120 },
  { name: "Dark chocolate", servingSize: 1, servingUnit: "oz (28g)", calories: 155 },
];

export function seedFoods() {
  const { count } = db.prepare("SELECT COUNT(*) as count FROM foods").get() as { count: number };
  if (count > 0) return;

  const insert = db.prepare(
    `INSERT INTO foods (id, name, brand, serving_size, serving_unit, calories, source, created_by_user_id)
     VALUES (?, ?, NULL, ?, ?, ?, 'curated', NULL)`
  );

  const insertMany = db.transaction((foods: typeof STARTER_FOODS) => {
    for (const food of foods) {
      insert.run(generateId(), food.name, food.servingSize, food.servingUnit, food.calories);
    }
  });

  insertMany(STARTER_FOODS);
  console.log(`Seeded ${STARTER_FOODS.length} starter foods.`);
}
