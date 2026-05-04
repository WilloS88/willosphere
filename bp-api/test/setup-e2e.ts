import * as path from "path";
import { config as loadDotenv } from "dotenv";

// Per-worker setup: nahraj .env (z bp-api/.env, který obsahuje JWT klíče,
// MFA secret, CloudFront stuff) a přepiš pár proměnných pro testovací běh.
loadDotenv({ path: path.join(__dirname, "..", ".env") });

process.env.MYSQL_DATABASE = "willosphere_test";
process.env.MYSQL_SYNC = "1";
process.env.DB_LOGGING = "false";
process.env.REFRESH_COOKIE_SECURE = "false";
process.env.REFRESH_COOKIE_SAMESITE = "lax";
