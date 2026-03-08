import { push } from "drizzle-kit";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.join(__dirname, "..");

console.log("[v0] Starting database migration using drizzle-kit push...");
console.log("[v0] Project root:", projectRoot);
console.log("[v0] DATABASE_URL is set:", !!process.env.DATABASE_URL);

try {
  await push({
    config: path.join(projectRoot, "drizzle.config.ts"),
  });
  console.log("[v0] Database migration completed successfully!");
  process.exit(0);
} catch (error) {
  console.error("[v0] Migration failed:", error);
  process.exit(1);
}
