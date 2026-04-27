Plan

1. Fix the Admin App install flow and remove the unwanted message
- Remove all admin install fallback text that says to go to Chrome, Edge, browser menu, Play Store, or manually add to home screen.
- Update the Admin App section so the button always feels direct:
  - If the browser supports native one-click install, it opens the install prompt immediately.
  - If the browser does not provide the install prompt, show a clean in-app status such as “Preparing install…” / “Install will appear when available” instead of manual Chrome instructions.
- Keep the admin and user manifests separate:
  - Admin install uses `manifest-admin.json` with start URL `/#/admin`.
  - User install uses `manifest.json`.
- Remove the current Android/Desktop manual instruction card from the Admin App page.
- Keep iOS behavior clean and minimal because iOS does not allow a true programmatic one-click PWA install; avoid the requested Chrome-style message.

Important note
- Browser security rules do not allow any website to silently download/install a PWA without the browser’s native install prompt or user confirmation. I can remove the confusing fallback messages and make the install flow as direct as the browser allows, but a true forced install is not technically possible from a web app.

2. Clean up the Tournament App navigation
- Replace the current crowded tournament nav with a simpler Free Fire focused navigation:
  - Play
  - Create
  - My Games
  - Wallet
- Remove/hide confusing top-level tournament sections from the main navigation such as Live, Leaderboard, History, Reports, and extra hub-style wording.
- Keep existing routes available where needed for compatibility, but make the visible user journey much simpler.

3. Redesign the Tournaments home page for Free Fire players
- Change the Tournaments Hub into a simple Free Fire tournament landing page.
- Keep only the most useful sections:
  - Admin-managed banner at the top
  - Clear Free Fire hero with two main buttons: “Join Free Fire Match” and “Create Match”
  - “Available Free Fire Rooms” list
  - “My Games” summary card for logged-in users
  - Small “How to play” section with 3 simple steps
- Remove/reduce noisy sections from the hub: carousel-style extra content, live ticker, testimonials, FAQ block, app CTA block, recent winners, and multiple stat-heavy sections.

4. Simplify joining tournaments
- Make the Join page Free Fire-first:
  - Default to Free Fire only or prioritize Free Fire rooms.
  - Use fewer filters: search plus simple chips like All, Starting Soon, Live.
  - Rename labels to plain language: “Rooms”, “Entry”, “Prize”, “Players”.
- Keep the existing join logic and secure credential flow unchanged.

5. Simplify creating a Free Fire match
- Make Create Match default to Free Fire and remove multi-game selection from the main flow.
- Keep match mode choices relevant for Free Fire: 1v1, 2v2, 4v4, Squad.
- Reduce the form copy and steps so users can understand it quickly:
  - Match mode
  - Entry fee and players
  - Start time
  - Optional rules
- Keep existing backend creation logic and financial settings unchanged.

6. Simplify My Games
- Replace the many tabs in `MyGamesPanel` with a cleaner layout:
  - Active / Upcoming
  - Hosted by me
  - Completed
- Keep Wallet as its own visible nav item instead of another tab inside My Games.
- Keep Reports/disputes accessible from match details or secondary links, not as a prominent confusing page.

Technical details
- Main files to update:
  - `src/components/admin/AdminAppDownload.tsx`
  - `src/hooks/usePWAInstall.ts` if needed for cleaner prompt state handling
  - `src/components/tournaments/TournamentsLayout.tsx`
  - `src/pages/tournaments/TournamentsHub.tsx`
  - `src/pages/tournaments/JoinTournamentPage.tsx`
  - `src/pages/tournaments/CreateMatchPage.tsx`
  - `src/components/tournaments/MyGamesPanel.tsx`
  - Potential small updates to route labels/calls in `src/App.tsx`
- No database changes are required for this redesign.
- Existing tournament data, joins, payouts, admin banners, and security restrictions will remain intact.