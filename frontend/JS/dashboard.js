"use strict";

// ─── selectType ───

function selectType(btn) {
  document.querySelectorAll(".type-card").forEach(c => c.classList.remove("active"));
  btn.classList.add("active");
  state.activeType = btn.dataset.type;

  const arithTab = document.querySelector(".action-tab[data-action='arithmetic']");
  if (state.activeType === "Temperature") {
    arithTab.disabled = true;
    arithTab.title    = "Arithmetic not supported for Temperature";
    if (state.activeAction === "arithmetic") {
      state.activeAction = "comparison";
      document.querySelectorAll(".action-tab").forEach(t => t.classList.remove("active"));
      document.querySelector(".action-tab[data-action='comparison']").classList.add("active");
    }
  } else {
    arithTab.disabled = false;
    arithTab.title    = "";
  }

  populateUnitSelects();
  updateActionUI(true); // clear result when type changes — user is starting fresh
}

// ─── selectAction ─

function selectAction(btn) {
  if (btn.disabled) return;
  document.querySelectorAll(".action-tab").forEach(t => t.classList.remove("active"));
  btn.classList.add("active");
  state.activeAction = btn.dataset.action;
  updateActionUI(true); // clear result when action changes
}

// ─── selectSubOp ─

function selectSubOp(btn) {
  document.querySelectorAll(".sub-tab").forEach(t => t.classList.remove("active"));
  btn.classList.add("active");
  state.activeSubOp = btn.dataset.op;
  updateArithConnector();
  clearResultDisplay();
}

// ─── populateUnitSelects ──────────

function populateUnitSelects() {
  const units = UNITS[state.activeType] ?? [];
  ["unit1", "unit2"].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const prev = sel.value;
    sel.innerHTML = units
      .map(u => `<option value="${u}">${UNIT_LABELS[u] ?? u}</option>`)
      .join("");
    if (units.includes(prev)) {
      sel.value = prev;
    } else if (id === "unit2" && units.length >= 2) {
      sel.value = units[1];
    }
  });
}

// ─── updateActionUI ───
// clearResult=true  → wipe result (called on type/action change)
// clearResult=false → preserve result (called on page init/restore)

function updateActionUI(clearResult = false) {
  const isArith   = state.activeAction === "arithmetic";
  const isConvert = state.activeAction === "conversion";
  const isCompare = state.activeAction === "comparison";

  document.getElementById("sub-tabs").classList.toggle("hidden", !isArith);
  document.getElementById("arith-result-row").classList.toggle("hidden", !isArith);
  document.getElementById("compare-result-row").classList.toggle("hidden", !isCompare);
  document.getElementById("execute-btn").classList.remove("hidden");

  const label = document.getElementById("execute-label");
  if (isConvert)      label.textContent = "Convert";
  else if (isCompare) label.textContent = "Compare";
  else                label.textContent = "Calculate";

  const val2El     = document.getElementById("val2");
  const resultPrev = document.getElementById("result-preview");
  const label2     = document.getElementById("label-val2");

  if (isConvert) {
    val2El.classList.add("hidden");
    resultPrev.classList.remove("hidden");
    label2.textContent = "TO";
    updateConnector("→");
  } else if (isCompare) {
    val2El.classList.remove("hidden");
    resultPrev.classList.add("hidden");
    label2.textContent = "COMPARE WITH";
    updateConnector("=");
  } else {
    val2El.classList.remove("hidden");
    resultPrev.classList.add("hidden");
    label2.textContent = "VALUE 2";
    updateArithConnector();
  }

  if (clearResult) {
    clearResultDisplay();
  }

  document.getElementById("api-error").textContent = "";
}

function clearResultDisplay() {
  document.getElementById("result-preview").textContent       = "—";
  document.getElementById("arith-result-value").textContent   = "—";
  document.getElementById("arith-result-unit").textContent    = "";
  document.getElementById("compare-result-badge").textContent = "—";
  document.getElementById("compare-result-badge").className   = "compare-result-badge";
  localStorage.removeItem("app_lastResult");
}

function updateConnector(symbol) {
  document.getElementById("connector-symbol").textContent = symbol;
}

function updateArithConnector() {
  const symbols = { ADD: "+", SUBTRACT: "−", DIVIDE: "÷" };
  updateConnector(symbols[state.activeSubOp] ?? "?");
}

// ─── Persist & restore last result ────
// Saves result to localStorage so it survives soft navigations without a
// page reload — user sees their answer until they change inputs or type/action.

function persistLastResult(resultData) {
  localStorage.setItem("app_lastResult", JSON.stringify(resultData));
}

function restoreLastResult() {
  const raw = localStorage.getItem("app_lastResult");
  if (!raw) return;
  try {
    const r = JSON.parse(raw);
    if (r.type !== state.activeType || r.action !== state.activeAction) return;

    if (r.action === "comparison") {
      const badge = document.getElementById("compare-result-badge");
      badge.textContent = r.display;
      badge.className   = "compare-result-badge " + (r.equal ? "equal" : "not-equal");
    } else if (r.action === "conversion") {
      document.getElementById("result-preview").textContent = r.display;
    } else {
      document.getElementById("arith-result-value").textContent = r.display;
      document.getElementById("arith-result-unit").textContent  = r.unit ?? "";
    }
  } catch (_) {}
}

// ─── Persist & restore input values ───

function persistInputs() {
  const v1 = document.getElementById("val1")?.value;
  const v2 = document.getElementById("val2")?.value;
  const u1 = document.getElementById("unit1")?.value;
  const u2 = document.getElementById("unit2")?.value;
  if (v1 !== undefined) localStorage.setItem("app_val1", v1);
  if (v2 !== undefined) localStorage.setItem("app_val2", v2);
  if (u1) localStorage.setItem("app_unit1_" + state.activeType, u1);
  if (u2) localStorage.setItem("app_unit2_" + state.activeType, u2);
}

function restoreInputs() {
  const v1 = localStorage.getItem("app_val1");
  const v2 = localStorage.getItem("app_val2");
  const u1 = localStorage.getItem("app_unit1_" + state.activeType);
  const u2 = localStorage.getItem("app_unit2_" + state.activeType);

  const val1El  = document.getElementById("val1");
  const val2El  = document.getElementById("val2");
  const unit1El = document.getElementById("unit1");
  const unit2El = document.getElementById("unit2");

  if (v1 && val1El)  val1El.value  = v1;
  if (v2 && val2El)  val2El.value  = v2;
  if (u1 && unit1El && [...unit1El.options].some(o => o.value === u1)) unit1El.value = u1;
  if (u2 && unit2El && [...unit2El.options].some(o => o.value === u2)) unit2El.value = u2;
}

// ─── executeOperation ─

async function executeOperation() {
  const errEl = document.getElementById("api-error");
  const val1  = parseFloat(document.getElementById("val1").value);
  const unit1 = document.getElementById("unit1").value;
  const val2  = parseFloat(document.getElementById("val2").value);
  const unit2 = document.getElementById("unit2").value;

  if (isNaN(val1)) { errEl.textContent = "Please enter a valid value."; return; }
  errEl.textContent = "";

  // Persist inputs so they survive soft navigation
  persistInputs();

  const execBtn = document.getElementById("execute-btn");
  execBtn.disabled = true;
  execBtn.style.opacity = "0.7";

  try {
    let data, resultText, historyRecord, resultData;
    const mType = state.activeType + "Unit";

    if (state.activeAction === "comparison") {
      if (isNaN(val2)) { errEl.textContent = "Please enter a valid second value."; return; }
      data = await api.compare(val1, unit1, val2, unit2, mType);

      const equal = data.resultString === "true" || data.resultValue === 1 || data.result === true;
      resultText  = equal ? "✔ Equal" : "✘ Not Equal";

      const badge = document.getElementById("compare-result-badge");
      badge.textContent = resultText;
      badge.className   = "compare-result-badge " + (equal ? "equal" : "not-equal");

      resultData    = { type: state.activeType, action: "comparison", display: resultText, equal };
      historyRecord = buildHistoryRecord("COMPARE",
        `${val1} ${UNIT_LABELS[unit1]} vs ${val2} ${UNIT_LABELS[unit2]}`,
        resultText
      );

    } else if (state.activeAction === "conversion") {
      data = await api.convert(val1, unit1, unit2, mType);

      const resultVal       = formatNumber(data.resultValue);
      const resultUnitLabel = UNIT_LABELS[data.resultUnit ?? unit2] ?? unit2;
      resultText = `${resultVal} ${resultUnitLabel}`;
      document.getElementById("result-preview").textContent = resultVal;

      resultData    = { type: state.activeType, action: "conversion", display: resultVal };
      historyRecord = buildHistoryRecord("CONVERT",
        `${val1} ${UNIT_LABELS[unit1]} → ${UNIT_LABELS[unit2]}`,
        resultText
      );

    } else {
      if (isNaN(val2)) { errEl.textContent = "Please enter a valid second value."; return; }

      if (state.activeSubOp === "ADD") {
        data = await api.add(val1, unit1, val2, unit2, mType);
      } else if (state.activeSubOp === "SUBTRACT") {
        data = await api.subtract(val1, unit1, val2, unit2, mType);
      } else {
        data = await api.divide(val1, unit1, val2, unit2, mType);
      }

      const resultVal    = formatNumber(data.resultValue);
      const resUnit      = data.resultUnit ?? unit1;
      const resUnitLabel = UNIT_LABELS[resUnit] ?? resUnit;
      resultText         = `${resultVal} ${resUnitLabel}`;

      document.getElementById("arith-result-value").textContent = resultVal;
      document.getElementById("arith-result-unit").textContent  = resUnitLabel;

      resultData    = { type: state.activeType, action: "arithmetic", display: resultVal, unit: resUnitLabel };
      const opSymbols = { ADD: "+", SUBTRACT: "−", DIVIDE: "÷" };
      historyRecord = buildHistoryRecord(state.activeSubOp,
        `${val1} ${UNIT_LABELS[unit1]} ${opSymbols[state.activeSubOp]} ${val2} ${UNIT_LABELS[unit2]}`,
        resultText
      );
    }

    // Persist result so it survives soft navigation (no page reload needed)
    persistLastResult(resultData);

    saveSessionHistory(historyRecord);
    if (state.token) {
      api.saveHistory(historyRecord);
    }
    renderSessionHistory();

  } catch (err) {
    errEl.textContent = err.message;
  } finally {
    execBtn.disabled = false;
    execBtn.style.opacity = "";
  }
}

// ─── History helpers ──

function buildHistoryRecord(operation, details, outcome) {
  return {
    id:        Date.now().toString(),
    type:      state.activeType,
    operation,
    details,
    outcome,
    time:      new Date().toLocaleTimeString()
  };
}

// (A) Session history — sessionStorage, cleared on browser close or logout
function saveSessionHistory(record) {
  const raw = sessionStorage.getItem("sessionHistory") ?? "[]";
  const arr = JSON.parse(raw);
  arr.push(record);
  sessionStorage.setItem("sessionHistory", JSON.stringify(arr));
}

function getSessionHistory() {
  const raw = sessionStorage.getItem("sessionHistory") ?? "[]";
  return JSON.parse(raw);
}

function clearSessionHistory() {
  // Clear session history
  sessionStorage.removeItem("sessionHistory");
  // If logged in, also delete from JSON Server and flag as cleared
  if (state.token) {
    api.clearFullHistory().then(() => {
      // fullHistoryCleared is now true on the api object —
      // pressing "Load Full History" will show empty list, not re-fetch deleted records
    });
  }
  renderSessionHistory();
}

function renderSessionHistory(items) {
  const list = document.getElementById("history-list");
  const data = items ?? getSessionHistory();

  if (data.length === 0) {
    list.innerHTML = `<div class="history-empty">No operations yet</div>`;
    return;
  }

  list.innerHTML = [...data].reverse().map(h => `
    <div class="history-item op-${(h.operation ?? "").toLowerCase()}">
      <div class="history-op">${h.type ?? ""} · ${h.operation ?? "OP"}</div>
      <div class="history-detail">${h.details ?? ""}</div>
      <div class="history-outcome">${h.outcome ?? ""}</div>
      <div class="history-time">${h.time ?? ""}</div>
    </div>
  `).join("");
}

// (B) Full history — loads from JSON Server (login required)
async function loadFullHistory() {
  if (!state.token) {
    window.location.href = "login.html";
    return;
  }

  // BUG FIX: If history was cleared this session, never re-fetch — it's gone
  if (api.fullHistoryCleared) {
    renderSessionHistory([]);
    return;
  }

  const btn = document.getElementById("btn-load-history");
  btn.innerHTML = `<span class="material-icons-round" style="font-size:14px;">refresh</span> Loading…`;
  btn.disabled = true;

  const data = await api.loadFullHistory();

  btn.innerHTML = `<span class="material-icons-round" style="font-size:14px;">cloud_download</span> Load Full History`;
  btn.disabled = false;

  if (data === null) {
    showHistoryMessage("JSON Server offline.<br><small>Run: <code>npx json-server --watch db.json --port 3000</code></small>");
    return;
  }

  if (data.length === 0) {
    showHistoryMessage("No saved history found.");
    return;
  }

  renderSessionHistory(data);
}

function showHistoryMessage(msg) {
  document.getElementById("history-list").innerHTML =
    `<div class="history-empty">${msg}</div>`;
}

// ─── Utility ──────

function formatNumber(n) {
  if (n === undefined || n === null) return "—";
  const num = parseFloat(n);
  if (isNaN(num)) return "—";
  return parseFloat(num.toPrecision(8)).toString();
}
