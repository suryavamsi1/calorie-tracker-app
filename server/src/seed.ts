import { db } from "./db";
import { generateId } from "./utils/id";

// Curated starter food database for MVP (Option 1 from the product plan).
// Calories and macros (protein/carbs/fat in grams) are approximate per the
// listed serving size/unit, based on standard nutrition reference values.
const STARTER_FOODS: Array<{
  name: string;
  brand?: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}> = [
  { name: "Apple", servingSize: 1, servingUnit: "medium (182g)", calories: 95, proteinG: 0.5, carbsG: 25, fatG: 0.3 },
  { name: "Banana", servingSize: 1, servingUnit: "medium (118g)", calories: 105, proteinG: 1.3, carbsG: 27, fatG: 0.4 },
  { name: "Orange", servingSize: 1, servingUnit: "medium (131g)", calories: 62, proteinG: 1.2, carbsG: 15.4, fatG: 0.2 },
  { name: "Egg, whole", servingSize: 1, servingUnit: "large (50g)", calories: 72, proteinG: 6.3, carbsG: 0.4, fatG: 4.8 },
  { name: "White rice, cooked", servingSize: 1, servingUnit: "cup (158g)", calories: 205, proteinG: 4.3, carbsG: 44.5, fatG: 0.4 },
  { name: "Brown rice, cooked", servingSize: 1, servingUnit: "cup (195g)", calories: 216, proteinG: 5, carbsG: 45, fatG: 1.8 },
  { name: "Chicken breast, grilled", servingSize: 100, servingUnit: "g", calories: 165, proteinG: 31, carbsG: 0, fatG: 3.6 },
  { name: "Chicken thigh, grilled", servingSize: 100, servingUnit: "g", calories: 209, proteinG: 26, carbsG: 0, fatG: 10.9 },
  { name: "Ground beef, 90% lean, cooked", servingSize: 100, servingUnit: "g", calories: 176, proteinG: 20, carbsG: 0, fatG: 10 },
  { name: "Salmon, cooked", servingSize: 100, servingUnit: "g", calories: 208, proteinG: 20, carbsG: 0, fatG: 13 },
  { name: "Whole wheat bread", servingSize: 1, servingUnit: "slice (28g)", calories: 69, proteinG: 3.6, carbsG: 12, fatG: 0.9 },
  { name: "White bread", servingSize: 1, servingUnit: "slice (28g)", calories: 75, proteinG: 2.6, carbsG: 13.8, fatG: 1 },
  { name: "Oatmeal, cooked", servingSize: 1, servingUnit: "cup (234g)", calories: 158, proteinG: 6, carbsG: 27, fatG: 3.2 },
  { name: "Greek yogurt, plain, nonfat", servingSize: 1, servingUnit: "cup (245g)", calories: 133, proteinG: 23, carbsG: 9, fatG: 0.7 },
  { name: "Whole milk", servingSize: 1, servingUnit: "cup (244g)", calories: 149, proteinG: 7.7, carbsG: 12, fatG: 8 },
  { name: "Skim milk", servingSize: 1, servingUnit: "cup (245g)", calories: 83, proteinG: 8.3, carbsG: 12, fatG: 0.2 },
  { name: "Cheddar cheese", servingSize: 1, servingUnit: "oz (28g)", calories: 113, proteinG: 7, carbsG: 0.4, fatG: 9.3 },
  { name: "Peanut butter", servingSize: 2, servingUnit: "tbsp (32g)", calories: 188, proteinG: 8, carbsG: 6, fatG: 16 },
  { name: "Almonds", servingSize: 1, servingUnit: "oz (28g, ~23 nuts)", calories: 164, proteinG: 6, carbsG: 6, fatG: 14 },
  { name: "Avocado", servingSize: 1, servingUnit: "medium (150g)", calories: 240, proteinG: 3, carbsG: 12.8, fatG: 22 },
  { name: "Broccoli, cooked", servingSize: 1, servingUnit: "cup (156g)", calories: 55, proteinG: 3.7, carbsG: 11.2, fatG: 0.6 },
  { name: "Spinach, raw", servingSize: 2, servingUnit: "cups (60g)", calories: 14, proteinG: 1.7, carbsG: 2.2, fatG: 0.2 },
  { name: "Sweet potato, baked", servingSize: 1, servingUnit: "medium (114g)", calories: 103, proteinG: 2.3, carbsG: 24, fatG: 0.2 },
  { name: "Potato, baked", servingSize: 1, servingUnit: "medium (173g)", calories: 161, proteinG: 4.3, carbsG: 37, fatG: 0.2 },
  { name: "Pasta, cooked", servingSize: 1, servingUnit: "cup (140g)", calories: 221, proteinG: 8.1, carbsG: 43, fatG: 1.3 },
  { name: "Tomato", servingSize: 1, servingUnit: "medium (123g)", calories: 22, proteinG: 1.1, carbsG: 4.8, fatG: 0.2 },
  { name: "Carrot", servingSize: 1, servingUnit: "medium (61g)", calories: 25, proteinG: 0.6, carbsG: 6, fatG: 0.1 },
  { name: "Black beans, cooked", servingSize: 1, servingUnit: "cup (172g)", calories: 227, proteinG: 15, carbsG: 41, fatG: 0.9 },
  { name: "Tofu, firm", servingSize: 100, servingUnit: "g", calories: 144, proteinG: 15.5, carbsG: 3, fatG: 8.7 },
  { name: "Olive oil", servingSize: 1, servingUnit: "tbsp (14g)", calories: 119, proteinG: 0, carbsG: 0, fatG: 13.5 },
  { name: "Butter", servingSize: 1, servingUnit: "tbsp (14g)", calories: 102, proteinG: 0.1, carbsG: 0, fatG: 11.5 },
  { name: "Orange juice", servingSize: 1, servingUnit: "cup (248g)", calories: 112, proteinG: 1.7, carbsG: 26, fatG: 0.5 },
  { name: "Coffee, black", servingSize: 1, servingUnit: "cup (240g)", calories: 2, proteinG: 0.3, carbsG: 0, fatG: 0 },
  { name: "Pizza, cheese", servingSize: 1, servingUnit: "slice (107g)", calories: 285, proteinG: 12, carbsG: 36, fatG: 10 },
  { name: "Hamburger", servingSize: 1, servingUnit: "sandwich (110g)", calories: 295, proteinG: 12, carbsG: 27, fatG: 14 },
  { name: "French fries", servingSize: 1, servingUnit: "medium serving (117g)", calories: 365, proteinG: 4, carbsG: 48, fatG: 17 },
  { name: "Caesar salad, no dressing", servingSize: 1, servingUnit: "bowl (150g)", calories: 120, proteinG: 6, carbsG: 10, fatG: 6 },
  { name: "Granola bar", servingSize: 1, servingUnit: "bar (28g)", calories: 120, proteinG: 2, carbsG: 20, fatG: 4 },
  { name: "Protein shake", servingSize: 1, servingUnit: "scoop + water (30g)", calories: 120, proteinG: 24, carbsG: 3, fatG: 1 },
  { name: "Dark chocolate", servingSize: 1, servingUnit: "oz (28g)", calories: 155, proteinG: 2, carbsG: 13, fatG: 12 },
];

export function seedFoods() {
  const { count } = db.prepare("SELECT COUNT(*) as count FROM foods").get() as { count: number };
  if (count > 0) return;

  const insert = db.prepare(
    `INSERT INTO foods (id, name, brand, serving_size, serving_unit, calories, protein_g, carbs_g, fat_g, source, created_by_user_id)
     VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, 'curated', NULL)`
  );

  const insertMany = db.transaction((foods: typeof STARTER_FOODS) => {
    for (const food of foods) {
      insert.run(
        generateId(),
        food.name,
        food.servingSize,
        food.servingUnit,
        food.calories,
        food.proteinG,
        food.carbsG,
        food.fatG
      );
    }
  });

  insertMany(STARTER_FOODS);
  console.log(`Seeded ${STARTER_FOODS.length} starter foods.`);
}
