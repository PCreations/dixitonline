# API Reference - Tixid Online

## Vue d'ensemble

L'API Tixid Online est une API HTTP RESTful avec support HTMX pour les mises à jour partielles du DOM et SSE pour les événements temps réel.

**Base URL**: `http://localhost:3010`

## Authentification

L'authentification utilise **Supabase Auth** avec des JWT.

### Header Authorization

```
Authorization: Bearer <supabase_jwt_token>
```

Le JWT est automatiquement géré par le client Supabase côté frontend.

### Auth Hook

Le hook d'authentification :
1. Extrait le JWT du header `Authorization`
2. Vérifie la signature avec Supabase
3. Crée/synchronise le joueur dans la DB locale
4. Attache `authUser` et `authLayer` à la request

## Endpoints

### Home

#### `GET /`

Page d'accueil.

**Response**: HTML page complète

---

### Authentication

#### `GET /api/auth/callback`

Callback OAuth pour Supabase Auth.

**Query Parameters**:
- `code`: Authorization code from OAuth provider

**Response**: Redirect vers la page appropriée

---

### Game Creation

#### `GET /game/create`

Page de création de partie.

**Auth**: Required

**Response**: HTML page avec formulaire de création

---

#### `POST /game/create`

Crée une nouvelle partie.

**Auth**: Required

**Content-Type**: `application/x-www-form-urlencoded`

**Body**:
```
endConditionType=NumberOfTimesBeingStoryteller&numberOfTimes=3
```

ou

```
endConditionType=LimitOfPoints&limitOfPoints=30
```

**Success Response**:
```
HX-Redirect: /game/{gameId}/lobby
```

**Error Responses**:
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error`

---

### Game Lobby

#### `GET /game/:gameId/lobby`

Page du lobby de la partie.

**Auth**: Required

**URL Parameters**:
- `gameId` (string, UUID)

**Response**: HTML page complète avec SSE connection

**HTML Structure**:
```html
<div hx-ext="sse" sse-connect="/game/{gameId}/events">
  <div id="lobby-content"><!-- LobbyContent --></div>
  <div sse-swap="gameStarted" hx-swap="innerHTML"></div>
</div>
```

---

#### `GET /game/:gameId/join`

Rejoindre une partie existante.

**Auth**: Required

**URL Parameters**:
- `gameId` (string, UUID)

**Success Response**:
```
HTTP 302 Redirect → /game/{gameId}/lobby
```

**Error Responses**:
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Game not found
- `400 Bad Request` - Game full or already started

---

#### `GET /game/:gameId/lobby/content`

Fragment HTML du contenu du lobby (pour HTMX swap).

**Auth**: Required

**URL Parameters**:
- `gameId` (string, UUID)

**Response**: HTML fragment

```html
<div id="lobby-content" sse-swap="playerJoined playerLeft">
  <h2>4/6 joueurs</h2>
  <ul class="player-list">
    <li>Player1 (Host)</li>
    <li>Player2</li>
  </ul>
  <button hx-post="/game/{gameId}/start">Démarrer</button>
</div>
```

---

#### `POST /game/:gameId/start`

Démarrer la partie.

**Auth**: Required (Host only)

**URL Parameters**:
- `gameId` (string, UUID)

**Success Response**:
```
HX-Redirect: /game/{gameId}/play
```

**Error Responses**:
- `401 Unauthorized`
- `403 Forbidden` - Not the host
- `400 Bad Request` - Not enough players

---

### Game Play

#### `GET /game`

Page du plateau de jeu (stub).

**Auth**: Optional

**Response**: HTML page du jeu

---

### Game Events (SSE)

#### `GET /game/:gameId/events`

Server-Sent Events stream pour les mises à jour temps réel.

**Auth**: Required

**URL Parameters**:
- `gameId` (string, UUID)

**Response**: `text/event-stream`

**Events**:

```
event: playerJoined
data: <html_fragment>

event: playerLeft
data: <html_fragment>

event: gameStarted
data: <html_redirect_script>
```

**HTMX Integration**:
```html
<div hx-ext="sse" sse-connect="/game/{gameId}/events">
  <div sse-swap="playerJoined playerLeft" hx-swap="outerHTML">
    <!-- Content replaced on events -->
  </div>
</div>
```

---

### Test Endpoints

#### `POST /api/test/clear-db`

Vide la base de données (dev only).

**Auth**: None

**Response**: `{ "success": true }`

---

## Error Handling

### Error Response Format

```json
{
  "error": "Error description",
  "details": "Additional context (optional)"
}
```

### Common Errors

| Status | Error | Description |
|--------|-------|-------------|
| `400` | Bad Request | Invalid input data |
| `401` | Unauthorized | Missing or invalid JWT |
| `403` | Forbidden | Not allowed (e.g., not host) |
| `404` | Not Found | Resource not found |
| `409` | Conflict | Optimistic locking failure |
| `500` | Internal Server Error | Server error |

### Domain Errors

```typescript
// Game not found
{ "error": "Game not found" }

// Game is full
{ "error": "Game is full" }

// Not enough players
{ "error": "Not enough players to start game" }

// Not the host
{ "error": "Only the host can start the game" }

// Already started
{ "error": "Game has already started" }

// Username taken
{ "error": "username_taken" }
```

## HTMX Patterns

### Partial Page Updates

```html
<!-- Trigger a request and swap content -->
<button
  hx-post="/game/{gameId}/start"
  hx-target="#game-container"
  hx-swap="innerHTML"
>
  Start Game
</button>
```

### SSE Event Swapping

```html
<!-- Auto-update on SSE events -->
<div
  hx-ext="sse"
  sse-connect="/game/{gameId}/events"
>
  <div
    id="lobby-content"
    sse-swap="playerJoined playerLeft"
    hx-swap="outerHTML"
  >
    <!-- Replaced when event received -->
  </div>
</div>
```

### Response Headers

Les routes HTMX utilisent des headers spéciaux :

```
HX-Redirect: /game/{gameId}/lobby    # Redirect client
HX-Trigger: closeModal               # Trigger client event
HX-Refresh: true                     # Full page refresh
```

## Rate Limiting

Pas de rate limiting implémenté actuellement.

## CORS

CORS configuré pour le développement local uniquement.

## Versioning

Pas de versioning d'API implémenté (v1 implicite).
