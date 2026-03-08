import { execSync } from "child_process";
import * as path from "path";

console.log("[v0] Starting database migration...");
console.log("[v0] Current directory:", process.cwd());
console.log("[v0] DATABASE_URL is set:", !!process.env.DATABASE_URL);

try {
  // Check if drizzle.config.ts exists in current directory
  console.log("[v0] Looking for drizzle.config.ts...");
  
  // Run drizzle-kit push command with explicit config path
  const output = execSync("npx drizzle-kit push --config drizzle.config.ts", {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "production",
    },
  });
  console.log("[v0] Database migration completed successfully!");
  process.exit(0);
} catch (error) {
  console.error("[v0] Migration failed:", error);
  process.exit(1);
}
