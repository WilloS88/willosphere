import http from "k6/http";
import { check, fail } from "k6";

/**
 * Default credentials assumed to exist in the target database.
 * Override at runtime with environment variables, e.g.:
 *   k6 run -e PERF_USER_EMAIL=user@x.test -e PERF_USER_PASSWORD=pw load.js
 */
export const PERF_USER_EMAIL =
  __ENV.PERF_USER_EMAIL || "perf@willosphere.test";
export const PERF_USER_PASSWORD =
  __ENV.PERF_USER_PASSWORD || "PerfTest123!";

export const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

/**
 * Performs a login and returns a header object suitable for subsequent
 * requests. Cookies are extracted from Set-Cookie headers because k6's
 * default cookie jar is per-VU and would interfere with parallel ramps.
 *
 * Usage:
 *   const auth = login();
 *   http.get(`${BASE_URL}/auth/me`, { headers: auth.headers });
 */
export function login(email = PERF_USER_EMAIL, password = PERF_USER_PASSWORD) {
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { "Content-Type": "application/json" } },
  );

  const ok = check(res, {
    "login -> 201": (r) => r.status === 201,
  });
  if (!ok) {
    fail(`login failed (status=${res.status}, body=${res.body})`);
  }

  const cookies = parseSetCookies(res);
  const cookieHeader = ["access_token", "refresh_token", "device_id"]
    .filter((n) => cookies[n])
    .map((n) => `${n}=${cookies[n]}`)
    .join("; ");

  return {
    headers: {
      Cookie: cookieHeader,
      "Content-Type": "application/json",
    },
    cookies,
  };
}

function parseSetCookies(res) {
  const out = {};
  // k6 Response exposes set-cookie via res.cookies (object keyed by name).
  if (res.cookies) {
    for (const [name, arr] of Object.entries(res.cookies)) {
      if (Array.isArray(arr) && arr.length > 0) {
        out[name] = arr[0].value;
      }
    }
  }
  return out;
}
