import { drizzle } from "drizzle-orm/mysql2";
import { users, subscriptions } from "./drizzle/schema.js";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

// Recupera l'utente owner
const ownerOpenId = process.env.OWNER_OPEN_ID;
console.log("Owner OpenId:", ownerOpenId);

const owner = await db.select().from(users).where(eq(users.openId, ownerOpenId));
console.log("Owner user:", owner);

if (owner.length > 0) {
  const userId = owner[0].id;
  console.log("Updating subscription for user:", userId);
  
  // Aggiorna la sottoscrizione a Pro
  await db.update(subscriptions).set({ level: 'pro' }).where(eq(subscriptions.userId, userId));
  
  // Verifica l'aggiornamento
  const updated = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
  console.log("Updated subscription:", updated);
  console.log("✅ Subscription upgraded to Pro!");
} else {
  console.log("Owner not found");
}
