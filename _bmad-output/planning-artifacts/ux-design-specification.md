---
stepsCompleted: [1]
inputDocuments:
  - CLAUDE.md
  - src/game/game-view-projector.ts
currentFeature: player-info-panel
---

# UX Design Specification - dixitonline

**Author:** Pierre
**Date:** 2026-01-31

---

<!-- UX design content will be appended sequentially through collaborative workflow steps -->

## Context

This UX design session focuses on adding player information to the game interface. Currently, the game screens (storytelling, voting, scoring phases) don't display information about other players (names, scores, status).

### Current State Analysis

**Available Data (from game-view-projector.ts):**
- `playerStatus`: Record<playerId, 'ready' | 'not-ready'>
- `score`: player's score
- `storyteller`: current storyteller ID
- `phase`: current game phase
- List of all player IDs

**UI Constraints:**
- Dark theme with starry background
- Cards displayed at bottom of screen
- Status bar showing: points | current action | turn number
- Mobile-first responsive design needed

