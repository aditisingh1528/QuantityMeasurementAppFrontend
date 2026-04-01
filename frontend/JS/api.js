"use strict";

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

const API_BASE    = "http://localhost:8080/api/v1";
const JSON_BASE   = "http://localhost:3000";
const DEBOUNCE_MS = 500;

const state = {
  token:         null,
  username:      null,
  activeType:    "Length",
  activeAction:  "comparison",
  activeSubOp:   "ADD",
  debounceTimer: null
};

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
    const res = await fetch(`${this.backendBase}${endpoint}`, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${state.token}`
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message ?? `Server error ${res.status}`);
    }
    return res.json();
  }

  async saveHistory(record) {
    try {
      await fetch(`${this.jsonBase}/history`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(record)
      });
    } catch (e) {
      console.warn("JSON Server not reachable — history not saved:", e);
    }
  }

  async loadHistory() {
    try {
      const res = await fetch(`${this.jsonBase}/history`);
      if (!res.ok) throw new Error("offline");
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  async clearHistory() {
    try {
      const all = await this.loadHistory();
      if (!all) return;
      await Promise.all(
        all.map(r => fetch(`${this.jsonBase}/history/${r.id}`, { method: "DELETE" }))
      );
    } catch (e) {
      console.warn("Could not clear history:", e);
    }
  }
}

const api = new ApiService(API_BASE, JSON_BASE);
