"use strict";

function selectType(btn) {
  document.querySelectorAll(".type-card").forEach(c => c.classList.remove("active"));
  btn.classList.add("active");
  state.activeType = btn.dataset.type;

  // If Temperature is selected and arithmetic is active, fall back to comparison
  if (state.activeType === "Temperature" && state.activeAction === "arithmetic") {
    state.activeAction = "comparison";
    document.querySelectorAll(".action-tab").forEach(t => t.classList.remove("active"));
    document.querySelector(".action-tab[data-action='comparison']").classList.add("active");
  }

  // Disable arithmetic tab for Temperature
  const arithTab = document.querySelector(".action-tab[data-action='arithmetic']");
  if (state.activeType === "Temperature") {
    arithTab.disabled = true;
    arithTab.title = "Arithmetic not supported for Temperature";
  } else {
    arithTab.disabled = false;
    arithTab.title = "";
  }

  populateUnitSelects();
  updateActionUI();
}

function selectAction(btn) {
  if (btn.disabled) return;
  document.querySelectorAll(".action-tab").forEach(t => t.classList.remove("active"));
  btn.classList.add("active");
  state.activeAction = btn.dataset.action;
  updateActionUI();
}

function selectSubOp(btn) {
  document.querySelectorAll(".sub-tab").forEach(t => t.classList.remove("active"));
  btn.classList.add("active");
  state.activeSubOp = btn.dataset.op;
  updateArithConnector();
}

function populateUnitSelects() {
  const units = UNITS[state.activeType] ?? [];
  ["unit1", "unit2", "result-unit"].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const prev = sel.value;
    sel.innerHTML = units
      .map(u => `<option value="${u}">${UNIT_LABELS[u] ?? u}</option>`)
      .join("");
    // Restore previous selection if still valid for the new type
    if (units.includes(prev)) {
      sel.value = prev;
    } else if (id === "unit2" && units.length >= 2) {
      sel.value = units[1];
    }
  });
}

function updateActionUI() {
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

  document.getElementById("result-preview").textContent       = "—";
  document.getElementById("arith-result-value").textContent   = "—";
  document.getElementById("compare-result-badge").textContent = "—";
  document.getElementById("compare-result-badge").className   = "compare-result-badge";
  document.getElementById("api-error").textContent            = "";
}

function updateConnector(symbol) {
  document.getElementById("connector-symbol").textContent = symbol;
}

function updateArithConnector() {
  const symbols = { ADD: "+", SUBTRACT: "−", DIVIDE: "÷" };
  updateConnector(symbols[state.activeSubOp] ?? "?");
}

function updateResult() {
  // No live update — button click required
}

function triggerLiveUpdate() {
  // No live update — button click required
}

async function executeOperation() {
  const errEl = document.getElementById("api-error");
  const val1  = parseFloat(document.getElementById("val1").value);
  const unit1 = document.getElementById("unit1").value;
  const val2  = parseFloat(document.getElementById("val2").value);
  const unit2 = document.getElementById("unit2").value;

  if (isNaN(val1)) { errEl.textContent = "Please enter a valid value."; return; }

  errEl.textContent = "";

  try {
    let data, resultText, historyRecord;
    const mType = state.activeType + "Unit";

    if (state.activeAction === "comparison") {
      if (isNaN(val2)) { errEl.textContent = "Please enter a valid second value."; return; }
      data = await api.compare(val1, unit1, val2, unit2, mType);

      const equal = data.resultString === "true" || data.resultValue === 1;
      resultText  = equal ? "✔ Equal" : "✘ Not Equal";

      const badge = document.getElementById("compare-result-badge");
      badge.textContent = resultText;
      badge.className   = "compare-result-badge " + (equal ? "equal" : "not-equal");

      historyRecord = {
        id:        Date.now().toString(),
        operation: "COMPARE",
        details:   `${val1} ${UNIT_LABELS[unit1]} vs ${val2} ${UNIT_LABELS[unit2]}`,
        outcome:   resultText,
        time:      new Date().toLocaleTimeString()
      };

    } else if (state.activeAction === "conversion") {
      data = await api.convert(val1, unit1, unit2, mType);

      const resultVal = formatNumber(data.resultValue);
      resultText      = `${resultVal} ${UNIT_LABELS[data.resultUnit ?? unit2] ?? unit2}`;
      document.getElementById("result-preview").textContent = resultVal;

      historyRecord = {
        id:        Date.now().toString(),
        operation: "CONVERT",
        details:   `${val1} ${UNIT_LABELS[unit1]} → ${UNIT_LABELS[unit2]}`,
        outcome:   resultText,
        time:      new Date().toLocaleTimeString()
      };

    } else {
      if (isNaN(val2)) { errEl.textContent = "Please enter a valid second value."; return; }
      if (state.activeSubOp === "ADD") {
        data = await api.add(val1, unit1, val2, unit2, mType);
      } else if (state.activeSubOp === "SUBTRACT") {
        data = await api.subtract(val1, unit1, val2, unit2, mType);
      } else {
        data = await api.divide(val1, unit1, val2, unit2, mType);
      }

      const resultVal = formatNumber(data.resultValue);
      const resUnit   = data.resultUnit ?? unit1;
      resultText      = `${resultVal} ${UNIT_LABELS[resUnit] ?? resUnit}`;
      document.getElementById("arith-result-value").textContent = resultVal;

      // Set result-unit silently — no onchange attached to this select
      try {
        const sel = document.getElementById("result-unit");
        if ([...sel.options].some(o => o.value === resUnit)) sel.value = resUnit;
      } catch (_) {}

      historyRecord = {
        id:        Date.now().toString(),
        operation: state.activeSubOp,
        details:   `${val1} ${UNIT_LABELS[unit1]} ${state.activeSubOp.toLowerCase()} ${val2} ${UNIT_LABELS[unit2]}`,
        outcome:   resultText,
        time:      new Date().toLocaleTimeString()
      };
    }

    api.saveHistory(historyRecord).then(() => loadHistoryUI());

  } catch (err) {
    errEl.textContent = err.message;
  }
}

function formatNumber(n) {
  if (n === undefined || n === null) return "—";
  const num = parseFloat(n);
  if (isNaN(num)) return "—";
  return parseFloat(num.toPrecision(8)).toString();
}

async function loadHistoryUI() {
  const list = document.getElementById("history-list");
  const data = await api.loadHistory();

  if (data === null) {
    list.innerHTML = `
      <div class="history-empty">
        JSON Server offline<br>
        <span style="font-size:10px;color:#aaa;margin-top:4px;display:block;">
          Run: <code>npx json-server --watch db.json --port 3000</code>
        </span>
      </div>`;
    return;
  }

  if (data.length === 0) {
    list.innerHTML = `<div class="history-empty">No operations yet</div>`;
    return;
  }

  list.innerHTML = [...data].reverse().map(h => `
    <div class="history-item op-${(h.operation ?? "").toLowerCase()}">
      <div class="history-op">${h.operation ?? "OP"}</div>
      <div class="history-detail">${h.details ?? ""}</div>
      <div class="history-outcome">${h.outcome ?? ""}</div>
      <div class="history-time">${h.time ?? ""}</div>
    </div>
  `).join("");
}

async function clearHistory() {
  await api.clearHistory();
  loadHistoryUI();
}
