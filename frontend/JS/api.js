"use strict";

// ─── Unit definitions 

const UNITS = {
  Length:      ["FEET", "INCHES", "YARDS", "CENTIMETERS"],
  Weight:      ["KILOGRAM", "GRAM", "POUND"],
  Volume:      ["LITRE", "MILLILITRE", "GALLON"],
  Temperature: ["CELSIUS", "FAHRENHEIT", "KELVIN"]
};

const UNIT_LABELS = {
  FEET:        "Feet",
  INCHES:      "Inches",
  YARDS:       "Yards",
  CENTIMETERS: "Centimeters",
  KILOGRAM:    "Kilogram",
  GRAM:        "Gram",
  POUND:       "Pound",
  LITRE:       "Litre",
  MILLILITRE:  "Millilitre",
  GALLON:      "Gallon",
  CELSIUS:     "Celsius",
  FAHRENHEIT:  "Fahrenheit",
  KELVIN:      "Kelvin"
};

// ─── API base URLs 

const API_BASE  = "http://localhost:8080/api/v1";
const JSON_BASE = "http://localhost:3000";

// ─── App State ────
// FIX: state persisted via localStorage so type/action survive re-renders

const state = {
  token:        sessionStorage.getItem("token")  ?? null,
  username:     sessionStorage.getItem("username") ?? null,
  // Persist selected type & action to fix "switches back to Length" bug
  get activeType()   { return localStorage.getItem("app_activeType")   ?? "Length"; },
  set activeType(v)  { localStorage.setItem("app_activeType", v); },
  get activeAction() { return localStorage.getItem("app_activeAction") ?? "comparison"; },
  set activeAction(v){ localStorage.setItem("app_activeAction", v); },
  get activeSubOp()  { return localStorage.getItem("app_activeSubOp")  ?? "ADD"; },
  set activeSubOp(v) { localStorage.setItem("app_activeSubOp", v); }
};

// ─── API Service ──

class ApiService {
  constructor(backendBase, jsonBase) {
    this.backendBase = backendBase;
    this.jsonBase    = jsonBase;
  }

  async performAuth(endpoint, username, password) {
    const res = await fetch(`${this.backendBase}${endpoint}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message ?? `Server error ${res.status}`);
    }
    return res.json();
  }

  async compare(val1, unit1, val2, unit2, type) {
    return this._post("/quantities/compare", {
      this: { value: Number(val1), unit: unit1, measurementType: type },
      that: { value: Number(val2), unit: unit2, measurementType: type }
    });
  }

  async convert(val, fromUnit, toUnit, type) {
    return this._post("/quantities/convert", {
      from:   { value: Number(val), unit: fromUnit, measurementType: type },
      toUnit: toUnit
    });
  }

  async add(val1, unit1, val2, unit2, type) {
    return this._post("/quantities/add", {
      this: { value: Number(val1), unit: unit1, measurementType: type },
      that: { value: Number(val2), unit: unit2, measurementType: type }
    });
  }

  async subtract(val1, unit1, val2, unit2, type) {
    return this._post("/quantities/subtract", {
      this: { value: Number(val1), unit: unit1, measurementType: type },
      that: { value: Number(val2), unit: unit2, measurementType: type }
    });
  }

  async divide(val1, unit1, val2, unit2, type) {
    return this._post("/quantities/divide", {
      this: { value: Number(val1), unit: unit1, measurementType: type },
      that: { value: Number(val2), unit: unit2, measurementType: type }
    });
  }

  async _post(endpoint, body) {
    const headers = { "Content-Type": "application/json" };
    // Only attach the Authorization header when a token is present.
    // Public dashboard endpoints work without a token; sending "Bearer null"
    // causes the server to reject the request with 401.
    if (state.token) {
      headers["Authorization"] = `Bearer ${state.token}`;
    }
    const res = await fetch(`${this.backendBase}${endpoint}`, {
      method:  "POST",
      headers,
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message ?? `Server error ${res.status}`);
    }
    return res.json();
  }

  // ── Full history via backend (JSON Server as proxy) 

  async saveHistory(record) {
    try {
      await fetch(`${this.jsonBase}/history`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...record, user: state.username ?? "guest" })
      });
    } catch (e) {
      console.warn("JSON Server not reachable — history not persisted:", e);
    }
  }

  async loadFullHistory() {
    try {
      const res = await fetch(`${this.jsonBase}/history`);
      if (!res.ok) throw new Error("offline");
      const all = await res.json();
      // Filter by current user
      return all.filter(h => h.user === state.username);
    } catch (e) {
      return null;
    }
  }

  async clearFullHistory() {
    try {
      const all = await fetch(`${this.jsonBase}/history`).then(r => r.json());
      // Only delete records belonging to current user
      const mine = all.filter(r => r.user === state.username);
      await Promise.all(
        mine.map(r => fetch(`${this.jsonBase}/history/${r.id}`, { method: "DELETE" }))
      );
      // Set a flag so "Load Full History" won't re-fetch stale data
      this.fullHistoryCleared = true;
    } catch (e) {
      console.warn("Could not clear full history:", e);
    }
  }
}

const api = new ApiService(API_BASE, JSON_BASE);