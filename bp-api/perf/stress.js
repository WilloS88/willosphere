/**
 * TC-P02 — Stress test
 * Linearly ramps the request rate from 10 req/s to 200 req/s over 6 minutes,
 * then holds the peak for 2 minutes and ramps back down. Identifies the
 * point at which response-time SLOs degrade and the API starts shedding
 * requests (5xx, timeouts).
 */
import http from "k6/http";
import { check } from "k6";
import { BASE_URL, login } from "./lib/auth.js";

export const options = {
  scenarios: {
    ramp_reads: {
      executor: "ramping-arrival-rate",
      startRate: 10,
      timeUnit: "1s",
      preAllocatedVUs: 30,
      maxVUs: 200,
      stages: [
        { duration: "3m", target: 100 },
        { duration: "3m", target: 200 },
        { duration: "2m", target: 200 },
        { duration: "1m", target: 10 },
      ],
      exec: "browseCatalog",
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<100", "p(99)<250"],
    http_req_failed: ["rate<0.01"],
  },
};

export function setup() {
  const probe = http.get(`${BASE_URL}/tracks?page=1&limit=1`);
  if (probe.status !== 200) {
    throw new Error(`Pre-flight catalog probe failed: ${probe.status}`);
  }
  login();
}

export function browseCatalog() {
  const page = 1 + Math.floor(Math.random() * 10);
  const res = http.get(`${BASE_URL}/tracks?page=${page}&limit=20`);
  check(res, { "GET /tracks -> 200": (r) => r.status === 200 });
}
