COUPLES BOT — GAME FIX

Root cause fixed:
Both TttGame and BombGame used a mountedRef guard inside useEffect. The app renders React StrictMode in development, which intentionally runs effects twice. The first effect cleanup sets cancelled=true while the mountedRef remains true. The second effect then returns immediately, so the REST join flow never reaches setJoinPhase("ready"). The UI remains on “O'yinga ulanmoqda…” forever.

Changed files:
- apps/web/src/features/games/tictactoe/TttGame.tsx
- apps/web/src/features/games/bomb/BombGame.tsx

The two game components now allow the effect to run normally and use its own cancellation flag. This is the minimal, correct fix for the observed stuck-connection bug.

Additional review findings are listed in the analysis report outside this patch.
