# Specification

## Summary
**Goal:** Make the game lobby content and visuals admin-editable, improve Wheel and Blackjack visuals, and apply small lobby/footer UI updates.

**Planned changes:**
- Add a backend-persisted, admin-editable game catalog that stores (per game) lobby cover image, display name, and description; have the lobby render game cards from this catalog with a default fallback when no catalog is stored yet.
- Extend the Admin Settings modal with a section/tab to edit each game’s catalog entry, including cover image upload with preview, name, and description; wire to backend APIs via React Query and enforce admin-only access.
- Update Blackjack to render dealt cards using card-face images when a complete 52-card backend-provided symbol set is available, with a safe fallback to the current text rendering when not.
- Update the Wheel Spin UI so each wheel segment displays its prize text directly on the wheel and remains readable while spinning.
- Add an edge-to-edge horizontal ad banner pinned to the bottom of the Game Lobby with visible default content.
- Update footer branding text to display “DexFans 2026”.

**User-visible outcome:** Admins can update lobby game images/names/descriptions without redeploying; Blackjack can show card-face images; the wheel shows prize labels on segments; the lobby includes a bottom banner; and the footer reads “DexFans 2026”.
