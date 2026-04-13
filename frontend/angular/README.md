# Quantity Measurement App — Angular Frontend

Angular 17 conversion of the original HTML/CSS/JS frontend.

## Project Structure

```
src/
├── app/
│   ├── app.component.ts        # Root component
│   ├── app.config.ts           # App config (providers)
│   ├── app.routes.ts           # Routes: /home, /login, /history
│   │
│   ├── models/
│   │   └── quantity.model.ts   # Types, interfaces, UNITS/UNIT_LABELS constants
│   │
│   ├── services/
│   │   ├── auth.service.ts     # Login, register, token management
│   │   ├── quantity.service.ts # API calls: compare, convert, add, subtract, divide
│   │   └── history.service.ts  # Session + JSON Server history
│   │
│   ├── guards/
│   │   └── auth.guard.ts       # Protects /history route
│   │
│   └── components/
│       ├── header/             # Header with login/logout
│       ├── login/              # Login + Signup with Reactive Forms
│       ├── dashboard/          # Main calculator + history sidebar
│       └── history/            # Full history page (login required)
│
├── styles.scss                 # Original CSS + Angular-specific additions
└── index.html
```

## Routes

| Path       | Access   | Description             |
|------------|----------|-------------------------|
| `/home`    | Public   | Dashboard (calculator)  |
| `/login`   | Public   | Login / Signup          |
| `/history` | Protected | Full history page      |

## Setup & Run

```bash
# 1. Install dependencies
npm install

# 2. Start the Angular app
ng serve

# 3. (Optional) Start JSON Server for history persistence
npx json-server --watch db.json --port 3000
```

App runs at: http://localhost:4200

Backend API should be running at: http://localhost:8080/api/v1

## What was converted

| Original JS/HTML               | Angular equivalent                          |
|-------------------------------|---------------------------------------------|
| `onclick="selectType(this)"`  | `(click)="selectType(type)"`               |
| `classList.toggle('active')`  | `[class.active]="activeType === type"`     |
| `document.getElementById`     | Component properties + template binding    |
| `innerHTML = ...`             | `*ngFor` with template                     |
| `fetch(...)`                  | `HttpClient.post(...)` via service         |
| `sessionStorage` auth state   | `AuthService` with `sessionStorage`        |
| `localStorage` persisted state| Same — in component + service methods      |
| Form `onsubmit`               | Reactive Forms with `(ngSubmit)`           |
| `state.token`, `state.username` | `AuthService.getToken()` / `getUsername()` |
