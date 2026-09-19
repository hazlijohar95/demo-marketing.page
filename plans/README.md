# Animation plans

Plans 001–008 (standard audit, commit `f9d985b`) and 009–017 (deep audit,
commit `e1936a7`) were all implemented and verified (`npm run build` green,
`node --test` 24/24). The individual plan files were removed to keep them
out of agent context; this index stays as the record.

- 001 motion tokens · 002 bars width→transform · 003 card hover gating ·
  004 console log fade · 005 sandbox field loop · 006 demo status running ·
  007 FAQ icon timing · 008 entrance physicality
- 009 entrance ease token · 010 color easing order · 011 paint transitions ·
  012 menu icon scale · 013 sandbox reduced-motion listener ·
  014 convo-head switch ack · 015 live-url switch ack ·
  016 language panel swap · 017 sidebar view swap

To re-audit, run the `improve-animations` skill; it writes new numbered
plans here.
