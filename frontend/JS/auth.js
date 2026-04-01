"use strict";

function switchTab(tab) {
  const isLogin = tab === "login";
  document.getElementById("login-form").classList.toggle("hidden", !isLogin);
  document.getElementById("signup-form").classList.toggle("hidden", isLogin);
  document.getElementById("tab-login").classList.toggle("active", isLogin);
  document.getElementById("tab-signup").classList.toggle("active", !isLogin);
  document.getElementById("login-error").textContent  = "";
  document.getElementById("signup-error").textContent = "";
}

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

async function handleLogin(e) {
  e.preventDefault();
  const errEl = document.getElementById("login-error");
  errEl.textContent = "Authenticating…";

  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;

  try {
    const data = await api.performAuth("/auth/login", username, password);
    state.token    = data.token;
    state.username = username;

    sessionStorage.setItem("token",    data.token);
    sessionStorage.setItem("username", username);

    document.getElementById("login-password").value = "";
    errEl.textContent = "";
    window.location.href = "dashboard.html";
  } catch (err) {
    errEl.textContent = "Login failed: " + err.message;
  }
}

async function handleSignup(e) {
  e.preventDefault();
  const errEl = document.getElementById("signup-error");
  errEl.textContent = "";

  const username = document.getElementById("signup-username").value.trim();
  const password = document.getElementById("signup-password").value;

  try {
    await api.performAuth("/auth/register", username, password);
    alert("Account created! You can now log in.");
    switchTab("login");
    document.getElementById("login-username").value = username;
    document.getElementById("signup-form").reset();
  } catch (err) {
    errEl.textContent = "Registration failed: " + err.message;
  }
}

function handleLogout() {
  state.token    = null;
  state.username = null;
  sessionStorage.clear();
  window.location.href = "login.html";
}

/*
  Google OAuth 2.0 — Implementation Steps
  =========================================

  STEP 1 — Create a Google Cloud project
    Go to https://console.cloud.google.com, create a project (or pick an
    existing one). Enable the "Google Identity" API if prompted.

  STEP 2 — Configure the OAuth consent screen
    APIs & Services → OAuth consent screen
    - User type: External
    - Fill in App name, support email, developer contact
    - Add scopes: openid, email, profile

  STEP 3 — Create OAuth credentials
    APIs & Services → Credentials → Create Credentials → OAuth client ID
    - Application type: Web application
    - Authorised JavaScript origins: e.g. http://localhost:5500
    - Authorised redirect URIs: e.g. http://localhost:5500/HTML/dashboard.html
    - Copy the Client ID shown after saving

  STEP 4 — Load the Google Identity Services library in login.html
    Add before </body>:
      <script src="https://accounts.google.com/gsi/client" async defer></script>

  STEP 5 — Add the sign-in button markup inside the login form
    Replace the current #google-login-btn with:
      <div id="g_id_onload"
           data-client_id="YOUR_CLIENT_ID_HERE"
           data-callback="handleGoogleCredential"
           data-auto_prompt="false">
      </div>
      <div class="g_id_signin" data-type="standard" data-width="100%"></div>

  STEP 6 — Handle the credential callback (add this function below)
    async function handleGoogleCredential(response) {
      // response.credential is a signed JWT (ID token) from Google
      const res = await fetch(`${API_BASE}/auth/google`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ idToken: response.credential })
      });
      if (!res.ok) {
        document.getElementById("login-error").textContent = "Google sign-in failed.";
        return;
      }
      const data = await res.json();
      sessionStorage.setItem("token",    data.token);
      sessionStorage.setItem("username", data.username);
      window.location.href = "dashboard.html";
    }

  STEP 7 — Add a backend endpoint  POST /api/v1/auth/google
    In AuthController.cs / AuthService:
    - Accept { idToken: string } in the request body
    - Verify the token using Google's tokeninfo endpoint:
        GET https://oauth2.googleapis.com/tokeninfo?id_token=<idToken>
      Or use the Google.Apis.Auth NuGet package:
        GoogleJsonWebSignature.ValidateAsync(idToken)
    - Extract email and name from the payload
    - Find or create a User record for that email
    - Return your own JWT exactly as /auth/login does

  STEP 8 — (Optional) Persist the session
    The token is already stored in sessionStorage (step 6), matching the
    pattern used by handleLogin(). main.js reads it on dashboard load.
*/

document.addEventListener("DOMContentLoaded", () => {
  const googleBtn = document.getElementById("google-login-btn");
  if (googleBtn) {
    googleBtn.addEventListener("click", () => {
      alert(
        "Google Sign-In is not yet configured.\n\n" +
        "Follow the steps documented in JS/auth.js to set it up."
      );
    });
  }
});
