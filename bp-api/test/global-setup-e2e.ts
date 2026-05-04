import * as path from "path";
import { config as loadDotenv } from "dotenv";
import * as mysql from "mysql2/promise";


export default async function globalSetup(): Promise<void> {
  loadDotenv({ path: path.join(__dirname, "..", ".env") });

  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST ?? "localhost",
    port: Number(process.env.MYSQL_PORT ?? 3307),
    user: "root",
    password: process.env.MYSQL_PASSWORD,
    multipleStatements: true,
  });

  await conn.query(
    "CREATE DATABASE IF NOT EXISTS willosphere_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
  );
  await conn.query(
    `GRANT ALL PRIVILEGES ON willosphere_test.* TO '${process.env.MYSQL_USER}'@'%'`,
  );
  await conn.query("FLUSH PRIVILEGES");
  await conn.end();
}
