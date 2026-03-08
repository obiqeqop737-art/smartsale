import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../shared/schema.ts";

async function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const client = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const db = drizzle(client, { schema });
    console.log("[v0] Database connection established");
    
    // Test connection
    const result = await db.execute("SELECT NOW()");
    console.log("[v0] Database is working:", result);
    
    console.log("[v0] Database initialization complete. Use 'npm run db:push' to apply schema changes.");
  } catch (error) {
    console.error("[v0] Database initialization failed:", error);
    throw error;
  } finally {
    await client.end();
  }
}

initializeDatabase();
