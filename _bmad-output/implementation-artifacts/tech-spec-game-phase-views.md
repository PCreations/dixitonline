# Tech-Spec: Game Phase Views

**Created:** 2026-01-17
**Status:** Ready for Development
**Stack:** Fastify + Preact JSX (SSR) + HTMX + Alpine.js

## Overview

### Feature Description

Implement all game phase views for the in-game screen. The `Game.tsx` component should be a pure declarative component that renders the appropriate UI based on the current game phase and player role.

### Gameplay Impact

Players will see the correct interface for each phase of a Dixit game:
- Storyteller giving clues and selecting cards
- Guessers selecting bluff cards
- Voting on board cards
- Viewing scores and results
- End game rankings

### Scope

**In Scope:**
- Discriminated union types for all game phases (make impossible states illegal)
- `GameQueryService` to fetch game state with player names
- `GameViewModel` pure function for view transformation
- `Game.tsx` component with phase-specific sub-components
- HTMX actions for all player interactions
- Update `GameViewProjector` to include `clue` field

**Out of Scope:**
- Real-time updates (SSE) - will be added later
- Animations/transitions between phases
- Sound effects
- Mobile-specific optimizations

## Context for Development

### Engine Patterns

This project uses:
- **SSR-first**: Preact JSX rendered server-side with `preact-render-to-string`
- **HTMX**: Server-driven UI updates via `hx-post`, `hx-target`, `hx-swap`
- **Alpine.js**: Client-side state for modals and local interactions
- **Effect**: Functional programming with dependency injection
- **Hexagonal Architecture**: QueryService → ViewModel → Component

### Existing Systems Integration

| System | File | Integration Point |
|--------|------|-------------------|
| Game View Projector | `src/game/game-view-projector.ts` | Add `clue` field to projection |
| Lobby Query Service | `src/game/lobby.query-service.ts` | Pattern to follow for GameQueryService |
| Lobby ViewModel | `src/view/view-models/lobby.view-model.ts` | Pattern to follow for GameViewModel |
| Player Repository | `src/player/player.repository.ts` | `findByIds()` for player names |
| Existing Game routes | `src/http/routes/game-play.routes.ts` | Update to use new components |

### Files to Reference

```
src/game/game-view-projector.ts      # Modify: add clue to projection
src/game/game.entity.ts              # Read: understand phases
src/game/turn.entity.ts              # Read: understand turn data
src/game/lobby.query-service.ts      # Pattern: query service structure
src/view/view-models/lobby.view-model.ts  # Pattern: view model structure
src/view/components/Game.tsx         # Modify: implement phases
src/view/components/Card.tsx         # Reuse: card display component
src/http/routes/game-play.routes.ts  # Modify: connect to query service
```

### Technical Decisions

1. **Discriminated Union Types**: Use `_tag` field to discriminate phases, making impossible states unrepresentable at the type level.

2. **Role-based Views**: Each phase has different views for storyteller vs guesser (non-storyteller players).

3. **Actions as Data**: HTMX actions are part of the view model, not hardcoded in components.

4. **Query Service Pattern**: Follow `LobbyQueryService` pattern - fetch game + players in one operation, project views, return typed state.

## Implementation Plan

### Types Definition

```typescript
// src/view/view-models/game.view-model.ts

// === Shared Types ===
interface CardView {
  readonly id: string;
  readonly url: string;
}

interface PlayerInfo {
  readonly id: string;
  readonly name: string;
  readonly isCurrentPlayer: boolean;
}

interface PlayerStatus {
  readonly player: PlayerInfo;
  readonly status: 'ready' | 'not-ready';
}

interface HtmxAction {
  readonly type: string;
  readonly url: string;
  readonly method: 'POST' | 'GET';
  readonly label: string;
  readonly disabled: boolean;
}

// === Base Props (common to all phases) ===
interface GameViewBase {
  readonly gameId: string;
  readonly currentPlayer: PlayerInfo;
  readonly score: number;
  readonly turnNumber: number;
  readonly storyteller: PlayerInfo;
  readonly hand: ReadonlyArray<CardView>;
  readonly playersStatus: ReadonlyArray<PlayerStatus>;
}

// === Phase-specific Views (Discriminated Union) ===

// Storytelling Phase
interface StorytellingAsStorytellerView extends GameViewBase {
  readonly _tag: 'StorytellingAsStoryteller';
  readonly action: HtmxAction; // submit-clue
}

interface StorytellingAsGuesserView extends GameViewBase {
  readonly _tag: 'StorytellingAsGuesser';
  // No action - waiting for storyteller
}

// Selecting Cards Phase
interface SelectingCardsAsStorytellerView extends GameViewBase {
  readonly _tag: 'SelectingCardsAsStoryteller';
  readonly clue: string;
  // No action - waiting for guessers
}

interface SelectingCardsAsGuesserView extends GameViewBase {
  readonly _tag: 'SelectingCardsAsGuesser';
  readonly clue: string;
  readonly hasSelectedCard: boolean;
  readonly action: HtmxAction; // select-card
}

// Voting Phase
interface VotingAsStorytellerView extends GameViewBase {
  readonly _tag: 'VotingAsStoryteller';
  readonly clue: string;
  readonly boardCards: ReadonlyArray<CardView>;
  // No action - waiting for guessers
}

interface VotingAsGuesserView extends GameViewBase {
  readonly _tag: 'VotingAsGuesser';
  readonly clue: string;
  readonly boardCards: ReadonlyArray<CardView>;
  readonly hasVoted: boolean;
  readonly action: HtmxAction; // vote
}

// Scoring Phase (same for all players)
interface ScoringView extends GameViewBase {
  readonly _tag: 'Scoring';
  readonly clue: string;
  readonly boardCards: ReadonlyArray<CardView>;
  readonly votes: Record<string, ReadonlyArray<PlayerInfo>>; // cardId → voters
  readonly storytellerCardId: string;
  readonly pointsEarned: ReadonlyArray<{
    readonly points: number;
    readonly reason: string;
  }>;
  readonly action: HtmxAction; // ready-for-next-turn
}

// Ended Phase
interface EndedView {
  readonly _tag: 'Ended';
  readonly gameId: string;
  readonly currentPlayer: PlayerInfo;
  readonly rankings: ReadonlyArray<{
    readonly rank: number;
    readonly player: PlayerInfo;
    readonly score: number;
  }>;
  readonly action: HtmxAction; // back-to-home
}

// === Union Type ===
export type GamePlayerView =
  | StorytellingAsStorytellerView
  | StorytellingAsGuesserView
  | SelectingCardsAsStorytellerView
  | SelectingCardsAsGuesserView
  | VotingAsStorytellerView
  | VotingAsGuesserView
  | ScoringView
  | EndedView;
```

### Tasks

- [ ] **Task 1: Update GameViewProjector to include clue**
  - Add `clue?: string` to projection output for phases after storytelling
  - Add `storytellerCardId` for scoring phase (to highlight the correct card)
  - Update tests in `game-view-projector.test-suite.ts`

- [ ] **Task 2: Create GameQueryService**
  - File: `src/game/game.query-service.ts`
  - Fetch game by ID, check if started/ended
  - Fetch player names via `playerRepository.findByIds()`
  - Call `gameViewProjector.project()` for current player
  - Return typed `GameState` based on phase and role

- [ ] **Task 3: Create game view model types**
  - File: `src/view/view-models/game.view-model.ts`
  - Define all discriminated union types as shown above
  - Create `createGameViewModel(state, props)` pure function

- [ ] **Task 4: Implement Game.tsx phase components**
  - Update `src/view/components/Game.tsx` to accept `GamePlayerView`
  - Create sub-components:
    - `StorytellerClueForm.tsx` (storytelling as storyteller)
    - `WaitingForStoryteller.tsx` (storytelling as guesser)
    - `CardSelection.tsx` (selecting-cards as guesser)
    - `WaitingForPlayers.tsx` (selecting-cards/voting as storyteller)
    - `VotingBoard.tsx` (voting as guesser)
    - `ScoringResults.tsx` (scoring phase)
    - `GameEnded.tsx` (ended phase)
  - Use pattern matching on `_tag` for rendering

- [ ] **Task 5: Create HTMX action routes**
  - `POST /game/:gameId/clue` - Submit clue (storytelling)
  - `POST /game/:gameId/select-card` - Select card (selecting-cards)
  - `POST /game/:gameId/vote` - Vote on card (voting)
  - `POST /game/:gameId/ready` - Ready for next turn (scoring)
  - Each route returns updated game view fragment

- [ ] **Task 6: Update game-play.routes.ts**
  - Replace stub with real `GameQueryService` integration
  - Route: `GET /game/:gameId` renders full game page with current view

- [ ] **Task 7: Add tests for GameQueryService**
  - Test each phase projection
  - Test storyteller vs guesser views
  - Test player name resolution

### Acceptance Criteria

- [ ] AC1: Given a game in storytelling phase, when the storyteller views the game, then they see a clue input form and their hand of cards
- [ ] AC2: Given a game in storytelling phase, when a guesser views the game, then they see a waiting message with player status indicators
- [ ] AC3: Given a game in selecting-cards phase, when a guesser views the game, then they see the clue and can select a card from their hand
- [ ] AC4: Given a game in voting phase, when a guesser views the game, then they see shuffled board cards and can vote (except their own card)
- [ ] AC5: Given a game in scoring phase, when any player views the game, then they see votes revealed, points earned, and a "Continue" button
- [ ] AC6: Given an ended game, when any player views the game, then they see final rankings sorted by score
- [ ] AC7: All views display real player names (not IDs)
- [ ] AC8: TypeScript compilation passes with no errors (discriminated unions enforced)
- [ ] AC9: No optional fields used for phase-specific data (impossible states illegal)

## Additional Context

### Component Structure

```
Game.tsx (dispatcher)
├── StorytellerClueForm.tsx
│   ├── CardSelector (select card for clue)
│   └── ClueInput (text input + submit)
├── WaitingForStoryteller.tsx
│   └── PlayerStatusList
├── CardSelection.tsx
│   ├── ClueDisplay
│   └── HandCards (selectable)
├── WaitingForPlayers.tsx
│   ├── ClueDisplay
│   └── PlayerStatusList
├── VotingBoard.tsx
│   ├── ClueDisplay
│   └── BoardCards (votable)
├── ScoringResults.tsx
│   ├── ClueDisplay
│   ├── BoardCardsWithVotes
│   ├── PointsBreakdown
│   └── ContinueButton
└── GameEnded.tsx
    ├── RankingTable
    └── BackToHomeButton
```

### HTMX Integration Pattern

```tsx
// Example: Clue submission form
<form
  hx-post={action.url}
  hx-target="#game-content"
  hx-swap="innerHTML"
  x-data="{ selectedCard: null, clue: '' }"
>
  {/* Card selection with Alpine.js state */}
  <input type="hidden" name="cardId" x-bind:value="selectedCard" />
  <input type="text" name="clue" x-model="clue" />
  <button type="submit" x-bind:disabled="!selectedCard || !clue">
    Submit Clue
  </button>
</form>
```

### Dependencies

- No new dependencies required
- Uses existing: Effect, Preact, HTMX, Alpine.js

### Testing Strategy

1. **Unit tests**: GameQueryService phase detection and view projection
2. **Integration tests**: Full route → query service → view model → render
3. **Existing test suite**: Update `game-view-projector.test-suite.ts` for clue field

### Notes

- The `clue` field is stored in `turnClue.clue` in the game snapshot
- The `storytellerCardId` is in `turnClue.cardId`
- Player names come from `PlayerRepository.findByIds()` - same pattern as `LobbyQueryService`
- Consider caching player names in memory during a game session (future optimization)
