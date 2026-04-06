"use strict";

// ─── Clear form fields on page load (Fix: prevent auto-fill) 

window.addEventListener("load", () => {
  // Always clear auth fields — prevents browser auto-fill from persisting
  const ids = [
    "login-username", "login-password",
    "signup-name", "signup-username", "signup-password", "signup-mobile"
  ];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  // Note: we do NOT auto-redirect to dashboard here.
  // The user navigated to login.html on purpose (e.g. to log in before viewing history).
});

// ─── Tab switching 

function switchTab(tab) {
  const isLogin = tab === "login";
  document.getElementById("login-form").classList.toggle("hidden", !isLogin);
  document.getElementById("signup-form").classList.toggle("hidden", isLogin);
  document.getElementById("tab-login").classList.toggle("active", isLogin);
  document.getElementById("tab-signup").classList.toggle("active", !isLogin);
  document.getElementById("login-error").textContent  = "";
  document.getElementById("signup-error").textContent = "";
}

// ─── Password visibility toggle ──

function togglePw(inputId, btn) {
  const input = document.getElementById(inputId);
  const icon  = btn.querySelector(".material-icons-round");
  if (input.type === "password") {
    input.type       = "text";
    icon.textContent = "visibility";
  } else {
    input.type       = "password";
    icon.textContent = "visibility_off";
  }
}

// ─── handleLogin ─

async function handleLogin(e) {
  e.preventDefault();
  const errEl = document.getElementById("login-error");
  errEl.textContent = "Authenticating…";
  errEl.style.color = "#5b8cff";

  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;

  if (!username || !password) {
    errEl.textContent = "Please enter username and password.";
    errEl.style.color = "";
    return;
  }

  try {
    const data = await api.performAuth("/auth/login", username, password);

    // Store login state
    state.token    = data.token;
    state.username = username;
    sessionStorage.setItem("token",    data.token);
    sessionStorage.setItem("username", username);

    // Clear sensitive field
    document.getElementById("login-password").value = "";
    errEl.textContent = "";

    window.location.href = "dashboard.html";
  } catch (err) {
    errEl.textContent = "Login failed: " + err.message;
    errEl.style.color = "";
  }
}

// ─── handleSignup ─

async function handleSignup(e) {
  e.preventDefault();
  const errEl = document.getElementById("signup-error");
  errEl.textContent = "";

  const name     = document.getElementById("signup-name").value.trim();
  const username = document.getElementById("signup-username").value.trim();
  const password = document.getElementById("signup-password").value;
  const mobile   = document.getElementById("signup-mobile").value.trim();

  if (!username || !password) {
    errEl.textContent = "Username and password are required.";
    return;
  }

  // Basic password validation: 3+ chars, at least one uppercase, one special char
  const pwValid = password.length >= 3
    && /[A-Z]/.test(password)
    && /[^a-zA-Z0-9]/.test(password);

  if (!pwValid) {
    errEl.textContent = "Password must be 3+ chars with an uppercase letter and a special character.";
    return;
  }

  try {
    errEl.textContent = "Creating account…";
    errEl.style.color = "#5b8cff";
    await api.performAuth("/auth/register", username, password);

    errEl.textContent = "";
    errEl.style.color = "";

    // Switch to login tab and pre-fill username for convenience
    switchTab("login");
    document.getElementById("login-username").value = username;
    document.getElementById("signup-form").reset();
    // Re-clear all signup fields explicitly
    ["signup-name","signup-username","signup-password","signup-mobile"]
      .forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });

    showToast("Account created! Please log in.");
  } catch (err) {
    errEl.textContent = "Registration failed: " + err.message;
    errEl.style.color = "";
  }
}

// ─── handleLogout (also called from dashboard.js) ──────

function handleLogout() {
  // Clear all auth state
  state.token    = null;
  state.username = null;
  sessionStorage.clear();
  localStorage.removeItem("app_activeType");
  localStorage.removeItem("app_activeAction");
  localStorage.removeItem("app_activeSubOp");

  // Redirect to dashboard (public, no login needed)
  window.location.replace("dashboard.html");
}

// ─── Google Sign-In ───
//
// Uses Google Identity Services (GIS) — ID Token popup flow.
// No redirect URI needed.
//
// ⚠️  REQUIRED to fix "Error 400: origin_mismatch":
//   1. Go to https://console.cloud.google.com
//   2. APIs & Services → Credentials → your OAuth 2.0 Client ID
//   3. Under "Authorised JavaScript origins", add the EXACT origin
//      you serve the app from (check your browser address bar), e.g.:
//        http://localhost:5500
//        http://127.0.0.1:5500
//   4. Save — wait ~5 minutes for Google to propagate the change.
//   No "Authorised redirect URIs" entry is needed.

const GOOGLE_CLIENT_ID = "1047951815164-uoahl7stijinetbksodc9l868vf8p77m.apps.googleusercontent.com";

// Render the real Google-branded button directly into #google-login-btn.
// renderButton() fires instantly on click — unlike prompt() which browsers silently suppress.
// Called once after the GIS script loads (see DOMContentLoaded listener below).
function initGoogleButton() {
  if (typeof google === "undefined" || !google.accounts) return;

  const container = document.getElementById("google-login-btn");
  if (!container) return;

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback:  handleGoogleCredential
    // No ux_mode — uses ID token flow (One Tap / FedCM).
    // Only needs Authorized JavaScript Origins, NOT redirect URIs.
  });

  // Replace our custom button markup with the real Google-signed button.
  container.innerHTML = "";
  google.accounts.id.renderButton(container, {
    type:  "standard",
    theme: "filled_blue",
    size:  "large",
    text:  "signin_with",
    shape: "rectangular",
    width: container.offsetWidth || 320
  });
}

// Wire up once the DOM (and hopefully GIS) is ready.
// The GIS script tag has async+defer so it may load slightly after DOMContentLoaded;
// we poll briefly to handle that race condition.
document.addEventListener("DOMContentLoaded", () => {
  let attempts = 0;
  const interval = setInterval(() => {
    attempts++;
    if (typeof google !== "undefined" && google.accounts) {
      clearInterval(interval);
      initGoogleButton();
    } else if (attempts >= 20) {   // give up after ~2 s
      clearInterval(interval);
    }
  }, 100);
});

// Kept so the onclick="handleGoogleSignIn()" in login.html still works as fallback.
function handleGoogleSignIn() {
  if (typeof google === "undefined" || !google.accounts) {
    showToast("Google Sign-In library not loaded. Check your internet connection.", "warn");
    return;
  }
  initGoogleButton();
}

// Called by GIS with the signed ID token JWT after the user picks an account.
async function handleGoogleCredential(response) {
  try {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ idToken: response.credential })
    });
    if (!res.ok) throw new Error("Google auth rejected by server.");
    const data = await res.json();

    state.token    = data.token;
    state.username = data.username ?? data.email;
    sessionStorage.setItem("token",    data.token);
    sessionStorage.setItem("username", state.username);

    window.location.href = "dashboard.html";
  } catch (err) {
    document.getElementById("login-error").textContent = "Google sign-in failed: " + err.message;
  }
}

// ─── Toast helper ─

function showToast(msg, type = "info") {
  let toast = document.getElementById("app-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "app-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className   = "app-toast show " + type;
  setTimeout(() => toast.classList.remove("show"), 3000);
}