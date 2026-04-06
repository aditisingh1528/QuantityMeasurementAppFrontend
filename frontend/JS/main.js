"use strict";

document.addEventListener("DOMContentLoaded", () => {
  // ── Read auth state 
  const token      = sessionStorage.getItem("token");
  const username   = sessionStorage.getItem("username");
  const isLoggedIn = !!token;

  state.token    = token;
  state.username = username;

  // ── Update header UI based on login state ───────────
  const userPill       = document.getElementById("user-pill");
  const usernameDisplay= document.getElementById("username-display");
  const btnLogin       = document.getElementById("btn-header-login");
  const btnLogout      = document.getElementById("btn-logout");
  const historyPrompt  = document.getElementById("history-login-prompt");
  const historyFullRow = document.getElementById("history-full-btn-row");

  if (isLoggedIn) {
    if (userPill)        { userPill.style.display = "flex"; }
    if (usernameDisplay) { usernameDisplay.textContent = username ?? "User"; }
    if (btnLogin)        { btnLogin.style.display = "none"; }
    if (btnLogout)       { btnLogout.style.display = "flex"; }
    if (historyPrompt)   { historyPrompt.style.display = "none"; }
    if (historyFullRow)  { historyFullRow.classList.remove("hidden"); }
  } else {
    if (userPill)        { userPill.style.display = "none"; }
    if (btnLogin)        { btnLogin.style.display = "flex"; }
    if (btnLogout)       { btnLogout.style.display = "none"; }
    if (historyPrompt)   { historyPrompt.style.display = "flex"; }
    if (historyFullRow)  { historyFullRow.classList.add("hidden"); }
  }

  // ── Restore saved type, action, sub-op ──────────────
  const savedType   = state.activeType;
  const savedAction = state.activeAction;
  const savedSubOp  = state.activeSubOp;

  document.querySelectorAll(".type-card").forEach(card => {
    card.classList.toggle("active", card.dataset.type === savedType);
  });
  document.querySelectorAll(".action-tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.action === savedAction);
  });
  document.querySelectorAll(".sub-tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.op === savedSubOp);
  });

  // Disable arithmetic for Temperature
  if (savedType === "Temperature") {
    const arithTab = document.querySelector(".action-tab[data-action='arithmetic']");
    if (arithTab) { arithTab.disabled = true; arithTab.title = "Not supported for Temperature"; }
  }

  // ── Populate unit dropdowns ────
  populateUnitSelects();

  // ── Restore last-used input values ─
  restoreInputs();

  // ── Render action layout WITHOUT clearing result ────
  // clearResult=false means existing result display is preserved
  updateActionUI(false);

  // ── Restore last computed result (survives without page reload) ────────────
  restoreLastResult();

  // ── Render session history ────
  renderSessionHistory();
});

// ─── handleLogout ─

function handleLogout() {
  state.token    = null;
  state.username = null;
  sessionStorage.clear();
  localStorage.removeItem("app_activeType");
  localStorage.removeItem("app_activeAction");
  localStorage.removeItem("app_activeSubOp");
  localStorage.removeItem("app_lastResult");
  localStorage.removeItem("app_val1");
  localStorage.removeItem("app_val2");
  // Reload dashboard (still public, no redirect to login)
  window.location.replace("dashboard.html");
}
