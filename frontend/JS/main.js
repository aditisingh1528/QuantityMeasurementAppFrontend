"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const token    = sessionStorage.getItem("token");
  const username = sessionStorage.getItem("username");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  state.token    = token;
  state.username = username;

  const display = document.getElementById("username-display");
  if (display) display.textContent = username ?? "User";

  populateUnitSelects();
  updateActionUI();
  loadHistoryUI();

  ["val1", "val2", "unit1", "unit2"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input",  triggerLiveUpdate);
      el.addEventListener("change", triggerLiveUpdate);
    }
  });
});
