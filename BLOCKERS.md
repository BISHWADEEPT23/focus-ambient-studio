# Blocker Registry & Mitigation Log

## Active Blockers
*None currently blocking progress.*

## Monitored External Constraints & Mitigation Strategies

| Constraint | Impact | Status | Mitigation Strategy |
|---|---|---|---|
| Flocus proprietary cloud sync API is closed and requires account credentials | Cloud sync cannot be directly called without credentials | MITIGATED | Build an offline-first storage engine (IndexedDB + local caching) with standardized export/import schema, fulfilling clean-room autonomy requirements without violating auth boundaries. |
| Browser background tab timer throttling | `setInterval` drops to <= 1Hz in inactive tabs, causing timer drift | MITIGATED | Utilize a Web Worker clock tick + wall-clock timestamp delta reconciliation (`Date.now()`) to ensure zero timer drift even during prolonged backgrounding. |
| Proprietary copyrighted sound recordings in commercial Flocus | Cannot distribute or copy Flocus sound files | RESOLVED | Built a native, procedural Web Audio synthesis engine that programmatically generates rain, ocean waves, wind, campfire, and brown noise in real time using noise nodes and biquad filters with zero audio file assets. |
| Windows PowerShell execution policy restriction on npm.ps1 | Calling `npm` directly invokes PowerShell script execution policy error | RESOLVED | Invoke `npm.cmd` and `npx.cmd` directly in automated commands. |
