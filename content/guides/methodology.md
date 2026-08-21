---
title: How We Decide If You Should Go Out
h1: How We Decide
---

Northern Lights Tonight is a local **go / maybe / no** for tonight. It is not a percentage, not a map tracker, and not affiliated with NOAA.

## The gates, in order

For each 30-minute slot that is dark enough (sun at or below **−12°**):

1. If aurora data is missing, we do not guess (**UNKNOWN**).
2. If the oval does not reach you, that slot is **NO**.
3. If clouds are socked in, **NO**.
4. Horizon-only plus city glow, or a bright moon on a horizon oval, cannot be **GO**.
5. Only a clear-enough sky with real reach can be **GO**. Otherwise **MAYBE**.

Slots that are still twilight are skipped (`not dark yet`) and do not vote. If the whole night never gets dark enough, the night is **NO** (summer high latitude).

We do **not** average a weighted score. We do **not** print 73%.

## Near window vs the rest of the night

The next ~90 minutes use NOAA SWPC **OVATION** grids (at the point and north along the horizon). Later tonight uses the **3-hour Kp forecast** plus, on pages that have a dossier, that place’s typical Kp bands. Mid-latitude and sub-oval pages cannot GO on that far window. A `/view` pin with no dossier cannot GO on the far window either.

## State pages use one headline point

A state is not the max of its cities. Colorado’s headline is the Fort Collins area, not Denver. Oregon’s headline is Baker City, not Portland. Other points can be listed; they do not get their own indexed URL.

## Sources

- NOAA Space Weather Prediction Center public products (OVATION and Kp).
- Open-Meteo cloud cover (low / mid / high).
- Local sun and moon from the coordinates in the place dossier.

The browser never calls NOAA. Pages read snapshot files. Stale snapshots display **UNKNOWN**, not last hour’s GO.

Related: [Tonight](/) · [How to see](/guides/how-to-see-northern-lights)
