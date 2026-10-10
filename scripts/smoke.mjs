#!/usr/bin/env node
// Smoke test contra el backend real (leer-only por defecto).
// Uso:  npm run smoke
// Para incluir una venta de prueba (persiste datos):
//   $env:ALLOW_WRITES=1  (PowerShell)  |  ALLOW_WRITES=1 (bash)
const BASE = process.env.SMOKE_BASE ?? "http://localhost:3000/api";

const results = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(method, path, { token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, json, text };
}

function record(label, { status, json }) {
  const ok = status >= 200 && status < 300;
  results.push({ label, ok, status, detail: typeof json?.message === "string" ? json.message : "" });
  return { status, json };
}

const summary = { total: 0, passed: 0, failed: 0 };

async function main() {
  console.log(`Smoke MiSalud frontend -> ${BASE}\n`);

  // 1. Login por rol (respetar rate-limit: 10 por IP por 15 min)
  const loginSteps = [
    ["superadmin", "superadmin@misalud.com", "Admin123!"],
    ["supervisor", "supervisor.cali@misalud.com", "Supervisor123!"],
    ["vendedor", "vendedor.cali@misalud.com", "Vendedor123!"],
  ];
  const tokens = {};
  for (const [role, email, password] of loginSteps) {
    const res = record(
      `login:${role}`,
      await call("POST", "/auth/login", { body: { email, password } }),
    );
    tokens[role] = res.json?.accessToken ?? null;
    if (!tokens[role]) {
      console.error(`  FATAL: no se obtuvo token para ${role} (HTTP ${res.status})`);
      process.exit(1);
    }
    await sleep(200);
  }

  const checks = [
    ["superadmin", "GET", "/suppliers"],
    ["superadmin", "GET", "/users"],
    ["superadmin", "GET", "/branches"],
    ["superadmin", "GET", "/cities"],
    ["superadmin", "GET", "/audit?limit=5"],
    ["superadmin", "GET", "/invima-sanitary"],
    ["superadmin", "GET", "/transfers"],
    ["superadmin", "GET", "/electronic-invoicing"],
    ["superadmin", "GET", "/pharmacovigilance"],
    ["supervisor", "GET", "/sales"],
    ["supervisor", "GET", "/batches?branchId=1"],
    ["supervisor", "GET", "/inventory"],
    ["supervisor", "GET", "/medicines"],
    ["supervisor", "GET", "/prescripciones"],
    ["supervisor", "GET", "/temperatura-humidity"],
    ["vendedor", "GET", "/inventory"],
    ["vendedor", "GET", "/sales"],
    ["vendedor", "GET", "/prescripciones"],
    ["vendedor", "GET", "/suppliers"],
  ];
  for (const [role, method, path] of checks) {
    const res = record(
      `${role}:${method} ${path}`,
      await call(method, path, { token: tokens[role] }),
    );
    if (res.status >= 400) console.log(`   -> HTTP ${res.status}`);
    await sleep(50);
  }

  // 2. Vuelta de permisos: vendedor NO debe acceder a recursos de gestión
  const forbidden = [
    ["vendedor", "/users"],
    ["vendedor", "/transfers"],
    ["vendedor", "/audit"],
    ["vendedor", "/cities"],
  ];
  for (const [role, path] of forbidden) {
    const res = await call("GET", path, { token: tokens[role] });
    results.push({
      label: `denegar:${role}:${path}`,
      ok: res.status === 403,
      status: res.status,
      detail: "",
    });
  }

  // 3. (Opcional) escritura real: crear una venta para el vendedor Cali
  if (process.env.ALLOW_WRITES === "1") {
    const inv = (await call("GET", "/inventory", { token: tokens.vendedor })).json ?? [];
    const first = inv.find((i) => i.quantityAvailable > 0);
    if (first) {
      const price = Math.max(1, Math.round((first.medicine?.unitCost ?? 3000) * 1.3));
      const res = record(
        "vendedor:POST /sales (venta de prueba)",
        await call("POST", "/sales", {
          token: tokens.vendedor,
          body: {
            customerName: "Smoke test",
            items: [{ medicineId: first.medicineId, quantity: 1, unitPrice: price }],
          },
        }),
      );
      console.log(`   -> venta creada: #${res.json?.id ?? "?"} por ${res.json?.total ?? "?"}`);
    } else {
      console.log("   (no hay stock en la sucursal del vendedor; se omite la venta)");
    }
  }

  // Resumen
  for (const r of results) {
    if (r.ok) summary.passed += 1;
    else summary.failed += 1;
    summary.total += 1;
  }
  console.log("\n--------------------------------------");
  for (const r of results) {
    const icon = r.ok ? "PASS" : `FAIL(HTTP ${r.status})`;
    console.log(`  ${r.ok ? "ok " : "XX "}  ${r.label.padEnd(42)} ${icon}`);
    if (!r.ok && r.detail) console.log(`        ${r.detail}`);
  }
  console.log("--------------------------------------");
  console.log(
    `Resultado: ${summary.passed}/${summary.total} comprobaciones exitosas.\n`,
  );
  process.exit(summary.failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("Smoke falló con excepción:", err);
  process.exit(1);
});