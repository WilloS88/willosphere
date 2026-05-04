/**
 * Smoke test — minimal request to verify that:
 *   1) k6 binary works on this machine,
 *   2) the backend is reachable on BASE_URL,
 *   3) the catalog endpoint returns 200.
 *
 * Use this for a 5-second sanity check before running the heavier
 * load.js / stress.js / spike.js scenarios. CLI:
 *
 *     k6 run --vus 1 --duration 5s perf/smoke.js
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL } from "./lib/auth.js";

export const options = {
  thresholds: {
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/tracks?page=1&limit=1`);
  check(res, {
    "GET /tracks -> 200": (r) => r.status === 200,
  });
  sleep(0.5);
}
