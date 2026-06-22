import { closeSync, existsSync, mkdirSync, openSync } from "node:fs";
import { dirname, resolve } from "node:path";

const dbPath = resolve(process.cwd(), "prisma", "hayat.db");

mkdirSync(dirname(dbPath), { recursive: true });

if (!existsSync(dbPath)) {
  closeSync(openSync(dbPath, "w"));
  console.log(`SQLite veritabani olusturuldu: ${dbPath}`);
}
