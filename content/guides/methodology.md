---
title: How We Decide If You Should Go Out
h1: How We Decide
---

Northern Lights Tonight is a local **go / maybe / no** for tonight. It is not a percentage, not a map tracker, and not affiliated with NOAA. This page is how we decide whether a night is worth a look at one place.

## How we decide, in gate order

For each 30-minute slot that is dark enough (sun at or below **−12°**):

1. If aurora data is missing, we do not guess (**UNKNOWN**).
2. If the oval does not reach you, that slot is **NO**.
3. If clouds are socked in, **NO**.
4. Horizon-only plus city glow, or a bright moon on a horizon oval, cannot be **GO**.
5. Only a clear-enough sky with real reach can be **GO**. Otherwise **MAYBE**.

Slots that are still twilight are skipped (`not dark yet`) and do not vote. If the whole night never gets dark enough, the night is **NO** (summer high latitude). We do **not** average a weighted score. We do **not** print 73%.

## Near window vs the rest of the night

The next ~90 minutes use NOAA SWPC **OVATION** grids (at the point and north along the horizon). Later tonight uses the **3-hour Kp forecast** plus, on pages that have a dossier, that place’s typical Kp bands. Mid-latitude and sub-oval pages cannot GO on that far window. A `/view` pin with no dossier cannot GO on the far window either.

The next hour is therefore stricter about the live oval, and more conservative about “later tonight.” A MAYBE in the far window is not a promise the oval will arrive.

## State pages use one headline point

A state is not the max of its cities. Colorado’s headline is the Fort Collins area, not Denver. Oregon’s headline is Baker City, not Portland. Other points can be listed; they do not get their own indexed URL.

A state night is “headline point, then contrast,” not “any city in the state said maybe.” If you need a ZIP, use near me rather than assuming the headline speaks for you.

## What UNKNOWN is for

UNKNOWN is a product decision. Missing or stale aurora data is not last hour’s GO with a disclaimer. Refusing to guess is part of the method. If every Wave 1 row is UNKNOWN, the homepage card says readings are paused.

## Sources

- NOAA Space Weather Prediction Center public products (OVATION and Kp).
- Cloud-cover data adapted from [Open-Meteo](https://open-meteo.com/) under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (low / mid / high).
- Local sun and moon from the coordinates in the place dossier.

The browser never calls NOAA. Pages read snapshot files. Stale snapshots display **UNKNOWN**, not last hour’s GO.

The method is open on this page so a GO is auditable: darkness, reach, clouds, then glow and moon. It is not a neural net, and it is not a vibe.

Related: [Tonight](/) · [How to see](/guides/how-to-see-northern-lights) · [Best time](/guides/best-time-to-see-northern-lights)

## Confidence on the card

Confidence is high / medium / low on the card. It is not a percent. Conflicting short-term and overnight signals, missing clouds, or a far-window Kp call all push confidence down. Low confidence still never becomes a fake GO.

## Moon and glow

Moon is a blocker when it washes a horizon-only oval. It is not a nationwide kill switch. City glow is a blocker when the oval is weak and low. An overhead storm can punch through modest skyglow. The card names the issue instead of mixing moon, glow, and clouds into one mystery score.

## What we refuse to build

We do not average slots into 73%. We do not let the sunlit hours vote. We do not let a `/view` pin without a dossier GO on the far window. We do not take the max of every city in a state. The method is intentionally conservative so a GO means the gates passed, not that a map looked pretty.

If this page and a social post disagree, this page is the product. The social post is not a data source. How we decide stays on this URL so the gates can be checked.

## Worked example of the gates

Suppose OVATION says the oval reaches the headline point, clouds are mixed, the sun is below −12°, and the moon is down. That can be MAYBE (clouds) or GO (clear-enough). If the same oval is horizon-only and the city is a light dome, it cannot be GO even if Kp looks large on Twitter.

Suppose OVATION is missing. The night is UNKNOWN, not last night’s leftover GO. Suppose the sun never reaches −12°. The night is NO for darkness, even if the oval is wild.

These examples are the method, not extra data sources.

## What the far window is for

The far window exists so you can see whether later hours are even in play. It is not a second GO button. Mid-latitude pages cannot GO there. Pins without a dossier cannot GO there. If you only have time in the far window, read that as “maybe later, not a promise.”

## Related

[Tonight](/) · [How to see](/guides/how-to-see-northern-lights) · [Colorado example](/forecast/colorado) · [Fairbanks example](/forecast/fairbanks)

## Why the gates are ordered that way

Darkness first because a bright sky cannot show a night-sky event. Reach second because clouds over an oval that never arrives are a wasted wait. Clouds third because a clear sky with no oval is still a no. Glow and moon last because they modulate a weak horizon oval more than they cancel an overhead storm.

How we decide follows that order every night so the main issue on the card matches the first gate that failed, not a blended vibe.

## Slots and voting

Each 30-minute slot that is dark enough can fail or pass. Twilight slots do not vote. The night label is not an average of slots. One GO slot can make the night worth trying if clouds and reach agree. A night of NO slots stays NO.

How we decide also refuses to let the far window overrule a near-window UNKNOWN. Missing live oval data is not “use Kp instead and hope.”

How we decide GO MAYBE nights still names the obstacle. How we decide the night label is the first failed gate, not a blend. How we decide UNKNOWN nights is missing or stale aurora data, not a coin flip. Keep those three sentences next to the card if a social post disagrees.

Far-window Kp is context. Near-window OVATION is the live oval. Mid-latitude pages never use the far window as a GO. Summer high latitude can be a darkness NO even when the oval is active.

Confidence on the card stays high, medium, or low. It is not a percent and it is not a second status. Low confidence plus a MAYBE still means an obstacle was named. Missing cloud data can drop confidence without turning a reach-NO into a maybe.

Sources stay NOAA SWPC for the oval and Kp, Open-Meteo for clouds, and the dossier coordinates for sun and moon. The browser does not call those APIs. Stale files display UNKNOWN. That is the whole stack.

Gates decide how we label nights. Clouds decide how we label nights. Darkness decide how we label nights. Same five words, three gates, so the card matches the first failure.
