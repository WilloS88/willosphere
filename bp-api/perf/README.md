# Výkonnostní testy (k6)

Testy pokrývají kapitolu 4.4 bakalářské práce a jsou napsané pro [k6](https://k6.io/).

## Struktura

| Soubor | Test case | Popis |
|--------|-----------|-------|
| `load.js` | TC-P01 | Load test: 10 req/s mix čtení + login + zápis, 5 minut. |
| `stress.js` | TC-P02 | Stress test: rampa 10 → 200 req/s, hledá bod degradace. |
| `spike.js` | TC-P03 | Spike test: baseline 10 req/s → spike 200 req/s → recovery. |
| `lib/auth.js` | — | Pomocný modul: login + extrakce cookie pro autentizované volání. |

## Předpoklady

1. **Backend běží** na `http://localhost:3000` (přepiš proměnnou `BASE_URL`).
2. **Databáze obsahuje seed**:
   - alespoň jeden uživatel pro login,
   - alespoň jeden track v katalogu (id = `PERF_TRACK_ID`, default `1`).
3. **k6** nainstalovaný v PATH (`choco install k6` nebo `winget install k6`).

Default test user:

```
PERF_USER_EMAIL    = perf@willosphere.test
PERF_USER_PASSWORD = PerfTest123!
```

Pokud uživatel ještě neexistuje, vytvořte ho jednoduchým curl voláním:

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"perf@willosphere.test","password":"PerfTest123!","displayName":"Perf"}'
```

## Spuštění

```bash
# Smoke test — 5 vteřin, 1 VU, jen GET /tracks. Ověří, že k6 + backend žijí.
k6 run --vus 1 --duration 5s perf/smoke.js

# Plné běhy (load/stress/spike používají options.scenarios — CLI flagy
# --vus/--duration jsou v takovém případě k6em ignorovány, takže
# nelze "zkrátit" tyto scénáře z CLI; uprav options přímo, pokud chceš
# kratší běh):
k6 run perf/load.js
k6 run perf/stress.js
k6 run perf/spike.js

# S vlastním cílem:
k6 run -e BASE_URL=https://staging.willosphere.cz perf/smoke.js
```

## Cílové prahy (thresholds)

Definováno v `options.thresholds` každého scénáře:

| Metrika | Práh |
|---------|------|
| `http_req_duration` p(95) | < 100 ms |
| `http_req_duration` p(99) | < 250 ms |
| `http_req_failed` rate | < 1 % |

Pro login scénář v `load.js` je p(95) povoleno do 500 ms — bcrypt cost 12 v
produkčním kódu generuje hash kolem 250 ms na laptopu, takže běžný 100 ms
strop by byl nereálný.

## Testované endpointy

- `GET /tracks?page=...&limit=...` — paginační čtení katalogu (read-heavy).
- `POST /auth/login` — CPU-bound bcrypt verifikace.
- `POST /listen-history` — autentizovaný zápis (sekundárně doplní `stream_events`).

## Co tyto testy neměří

- **Cold-start latency** — JIT a connection-pool warmup proběhne během prvních
  ~100 požadavků; pro krátké běhy (`--duration 5s`) je p(99) zkreslený.
- **DB tier scaling** — testy zatěžují jediný MySQL kontejner z `docker compose`.
  Pro reálnou produkční extrapolaci by bylo nutné běžet proti managed DB.
- **CDN / signed-url overhead** — testy běží lokálně, CloudFront podpis se
  generuje, ale latence skutečné fetch operace audio souboru tu není.
