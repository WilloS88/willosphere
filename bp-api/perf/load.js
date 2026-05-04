/**
 * TC-P01 — Load test
 * Steady-state load: ~10 requests/second for 5 minutes against a mix of
 * read endpoints (catalog), CPU-bound endpoints (login = bcrypt) and write
 * endpoints (listen-history). The goal is to verify that the API holds
 * response-time SLOs at expected production traffic.
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL, login } from "./lib/auth.js";

export const options = {
  scenarios: {
    catalog_read: {
      executor: "constant-arrival-rate",
      rate: 7, // 7 req/s — bulk of traffic is reads
      timeUnit: "1s",
      duration: "5m",
      preAllocatedVUs: 10,
      maxVUs: 30,
      exec: "browseCatalog",
    },
    login_cpu: {
      executor: "constant-arrival-rate",
      rate: 1, // 1 req/s — bcrypt is expensive
      timeUnit: "1s",
      duration: "5m",
      preAllocatedVUs: 5,
      maxVUs: 15,
      exec: "loginFlow",
    },
    listen_write: {
      executor: "constant-arrival-rate",
      rate: 2, // 2 req/s — write path
      timeUnit: "1s",
      duration: "5m",
      preAllocatedVUs: 5,
      maxVUs: 15,
      exec: "recordListen",
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<100", "p(99)<250"],
    http_req_failed: ["rate<0.01"],
    "http_req_duration{scenario:login_cpu}": ["p(95)<500"], // bcrypt nutí povolit vyšší práh
  },
};

export function browseCatalog() {
  const page = 1 + Math.floor(Math.random() * 5);
  const res = http.get(`${BASE_URL}/tracks?page=${page}&limit=20`);
  check(res, { "GET /tracks -> 200": (r) => r.status === 200 });
  sleep(0.1);
}

export function loginFlow() {
  // login() volá pm-style assertion uvnitř, ne potřebujeme dál nic dělat.
  login();
}

const TRACK_ID = Number(__ENV.PERF_TRACK_ID || 1);

export function recordListen() {
  const auth = login();
  const payload = JSON.stringify({
    trackId: TRACK_ID,
    secondsPlayed: 30 + Math.floor(Math.random() * 60),
    source: "browse",
  });
  const res = http.post(`${BASE_URL}/listen-history`, payload, {
    headers: auth.headers,
  });
  check(res, { "POST /listen-history -> 204": (r) => r.status === 204 });
}
