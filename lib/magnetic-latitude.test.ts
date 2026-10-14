import assert from "node:assert/strict";
import test from "node:test";

// @ts-ignore TS5097
import {
  FAR_WINDOW_NO_REACH_MAG_LAT,
  farWindowHasNoReach,
  magneticLatitude,
} from "./magnetic-latitude.ts";

test("centered-dipole magnetic latitude matches the wave1 pole constants", () => {
  const fairbanks = magneticLatitude(64.838, -147.716);
  const fortCollins = magneticLatitude(40.585, -105.084);
  const losAngeles = magneticLatitude(34.052, -118.244);

  assert.ok(Math.abs(fairbanks - 65.6) < 0.3, `Fairbanks ${fairbanks}`);
  assert.ok(Math.abs(fortCollins - 48.3) < 0.3, `Fort Collins ${fortCollins}`);
  assert.ok(losAngeles < 41.5 && losAngeles > 39, `Los Angeles ${losAngeles}`);
});

test("Los Angeles is below the far-window no-reach floor; covered midlatitudes are not", () => {
  assert.equal(farWindowHasNoReach(magneticLatitude(34.052, -118.244)), true);
  assert.equal(farWindowHasNoReach(magneticLatitude(33.448, -112.074)), true);
  assert.equal(farWindowHasNoReach(magneticLatitude(40.585, -105.084)), false);
  assert.equal(farWindowHasNoReach(FAR_WINDOW_NO_REACH_MAG_LAT), false);
});
