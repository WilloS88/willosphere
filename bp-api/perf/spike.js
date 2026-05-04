/**
 * TC-P03 — Spike test
 * Holds a 10 req/s baseline, jumps to 200 req/s for 30 seconds (the spike),
 * then drops back to baseline. Validates that the API recovers (response
 * times return to baseline) and does not deadlock or exhaust connections.
 */
import http from "k6/http";
import { check } from "k6";
import { BASE_URL } from "./lib/auth.js";

export const options = {
  scenarios: {
    baseline_then_spike: {
      executor: "ramping-arrival-rate",
      startRate: 10,
      timeUnit: "1s",
      preAllocatedVUs: 30,
      maxVUs: 250,
      stages: [
        { duration: "1m", target: 10 },   // baseline
        { duration: "10s", target: 200 }, // rampa nahoru
        { duration: "30s", target: 200 }, // spike (high)
        { duration: "10s", target: 10 },  // rampa zpět
        { duration: "1m", target: 10 },   // post-spike recovery
      ],
      exec: "browseCatalog",
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<100", "p(99)<250"],
    http_req_failed: ["rate<0.01"],
  },
};

export function browseCatalog() {
  const res = http.get(`${BASE_URL}/tracks?page=1&limit=20`);
  check(res, { "GET /tracks -> 200": (r) => r.status === 200 });
}
