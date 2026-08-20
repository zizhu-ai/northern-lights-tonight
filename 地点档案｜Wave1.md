# 地点档案｜Wave 1

**状态：** 字段已填，等引擎跑通后再把 `seo_indexable` 打开  
**数据：** `地点档案/wave1.json`（机器可读源）  
**日期：** 2026-08-20

磁纬度是偶极近似，不是 AACGM。`typical_kp_*` 是暗处朝北看的整数门槛初值，引擎应以 OVATION 网格为主，不要把这些 Kp 当成科学保证。

州页不用几何中心：结论点写在 `primary_verdict_point`（预指定，每晚不对三点取 max）。页面文案为英文。

## 总表

| slug | 类型 | 模板 | 结论点 | zone | Kp地平/头顶 | 时区 | 互链 |
|---|---|---|---|---|---|---|---|
| `colorado` | state | tonight_local | fort-collins | midlatitude_event | 7/8 | `America/Denver` | utah |
| `ohio` | state | tonight_local | cleveland | midlatitude_event | 6/8 | `America/New_York` | indiana, michigan, chicago |
| `indiana` | state | tonight_local | south-bend | midlatitude_event | 6/8 | `America/Indiana/Indianapolis` | ohio, chicago, michigan, illinois |
| `michigan` | state | tonight_local | traverse-city | sub_oval | 5/7 | `America/Detroit` | wisconsin, ohio, indiana, chicago, minnesota |
| `chicago` | city | tonight_local | chicago | midlatitude_event | 6/8 | `America/Chicago` | illinois, indiana, wisconsin, michigan |
| `seattle` | city | tonight_local | seattle | sub_oval | 5/7 | `America/Los_Angeles` | oregon |
| `wisconsin` | state | tonight_local | madison | sub_oval | 5/7 | `America/Chicago` | minnesota, michigan, chicago, illinois |
| `massachusetts` | state | tonight_local | newburyport | midlatitude_event | 6/8 | `America/New_York` | maine |
| `maine` | state | tonight_local | bangor | sub_oval | 5/7 | `America/New_York` | massachusetts |
| `minnesota` | state | tonight_local | duluth | sub_oval | 4/6 | `America/Chicago` | wisconsin, michigan |
| `illinois` | state | tonight_local | rockford | midlatitude_event | 6/8 | `America/Chicago` | chicago, indiana, wisconsin |
| `oregon` | state | tonight_local | baker-city | midlatitude_event | 6/8 | `America/Los_Angeles` | seattle, utah |
| `utah` | state | tonight_local | logan | midlatitude_event | 7/8 | `America/Denver` | colorado |
| `alaska` | state | travel_plus_tonight | fairbanks | oval | 1/3 | `America/Anchorage` | fairbanks |
| `fairbanks` | city | travel_plus_tonight | fairbanks | oval | 1/3 | `America/Anchorage` | alaska |

**吸收进本页、不另开 URL：** Boston → massachusetts；Minneapolis / Duluth → minnesota；Columbus → ohio；Indianapolis → indiana；Salt Lake City → utah；Northern Michigan → michigan。

**分工：** Chicago 城页 vs Illinois 州页；Fairbanks 城页 vs Alaska 州页；Seattle 城页，Washington 州页仍在 Wave 2。Oregon 首屏是 Baker City，不是 Portland。

---

## `colorado` · Colorado

- **URL：** `/forecast/colorado`
- **类型 / 模板：** state / `tonight_local`
- **父级：** —
- **时区：** `America/Denver`
- **结论点：** `fort-collins`（40.5853, -105.0844）
- **磁纬（偶极初值）：** 48.3°
- **分区：** midlatitude_event — 中纬事件型（强风暴才有）
- **Kp 初值：** 地平线 ~7，头顶 ~8
- **夏季几乎不黑：** 否
- **主词：** northern lights colorado · 聚类量 30,810 · 加权 KD 21
- **朝向：** north

**代表点**

| id | 名字 | 角色 | lat | lng | 磁纬 |
|---|---|---|---:|---:|---:|
| `fort-collins` | Fort Collins | verdict_north | 40.5853 | -105.0844 | 48.3 |
| `denver` | Denver | population | 39.7392 | -104.9903 | 47.4 |
| `steamboat-springs` | Steamboat Springs | dark_sky | 40.485 | -106.8317 | 48.0 |

**南北 / 区域分工：** Northern Colorado (Fort Collins, North Park, the Wyoming border) is the only part of the state that is even marginally realistic in a strong storm. Southern Colorado almost never sees aurora except in extreme events.

**光污染：** The Front Range (Denver–Boulder–Colorado Springs) is a bright light dome. Northern plains and mountain parks north of I-70 are darker; going south into the San Luis Valley is darker but magnetically worse.

**要不要出城：** Leave Denver if you are trying at all. You need a dark north horizon, not a city skyline. Do not drive south expecting a better oval — go north or onto the eastern plains with a clear view of the northern sky.

**本地障碍：** Front Range light dome; mountains blocking the north horizon if you sit on a south-facing slope; mid-latitude oval only during strong storms; summer thunderstorms on the plains.

**季节：** Longer nights from September through March help. Storms can happen in any month, but June–July twilight is less of a problem here than in Alaska. Dry air is an advantage versus the Midwest when a storm does arrive.

**变体词（全部进本 URL）**

- aurora borealis colorado
- northern lights colorado tonight
- colorado northern lights
- aurora borealis colorado tonight
- northern lights in colorado tonight
- northern lights tonight colorado
- can you see the northern lights in colorado
- are the northern lights visible in colorado tonight
- can you see the northern lights in colorado tonight
- northern lights tonight in colorado
- will the northern lights be visible in colorado tonight

**本地 FAQ**

- **Can you see the northern lights from Denver?**  
  Almost never from the city itself. Denver’s skyglow washes out horizon aurora. Only a strong geomagnetic storm plus a dark site north of the metro gives a realistic chance.
- **Is it better in the mountains?**  
  Only if you have a dark, unobstructed north view. A high peak facing south or sitting above a town’s lights does not help. Northern parks and the plains north of the Front Range are more useful than a random 14er.
- **How strong does a storm need to be?**  
  Colorado is a mid-latitude, event-only location. Quiet or moderate nights are a no. You generally need a strong storm (roughly Kp 7 class) and clear skies.
- **Tonight in Colorado — which part of the state?**  
  This page’s headline uses northern Colorado (Fort Collins area), not Denver and not a geographic centroid. Southern counties are called out separately when they differ.

**内链：** `utah`

---

## `ohio` · Ohio

- **URL：** `/forecast/ohio`
- **类型 / 模板：** state / `tonight_local`
- **父级：** —
- **时区：** `America/New_York`
- **结论点：** `cleveland`（41.4993, -81.6944）
- **磁纬（偶极初值）：** 50.7°
- **分区：** midlatitude_event — 中纬事件型（强风暴才有）
- **Kp 初值：** 地平线 ~6，头顶 ~8
- **夏季几乎不黑：** 否
- **主词：** northern lights ohio · 聚类量 17,470 · 加权 KD 16
- **朝向：** north

**代表点**

| id | 名字 | 角色 | lat | lng | 磁纬 |
|---|---|---|---:|---:|---:|
| `cleveland` | Cleveland | verdict_north | 41.4993 | -81.6944 | 50.7 |
| `toledo` | Toledo | dark_sky | 41.6528 | -83.5379 | 50.8 |
| `columbus` | Columbus | population | 39.9612 | -82.9988 | 49.1 |

**南北 / 区域分工：** Northern Ohio (Cleveland, Toledo, the lake) is meaningfully closer to the oval than Columbus and Cincinnati. Southern Ohio is an extreme-event location only.

**光污染：** Cleveland–Akron and Columbus are bright. The Lake Erie shore can be slightly better if you look north over water, but the urban skyglow still dominates near the cities.

**要不要出城：** Get out of Columbus. Northern Ohio near Lake Erie is the realistic part of the state. Look north over the lake from a dark stretch of shoreline, not from downtown Cleveland.

**本地障碍：** Midwest cloud cover; lake-effect clouds in winter along Lake Erie; city light domes; humidity and haze on the horizon.

**季节：** September–March brings longer nights. Lake-effect overcast can ruin otherwise good winter storms along the snow belt.

**变体词（全部进本 URL）**

- aurora borealis ohio
- northern lights tonight ohio
- northern lights ohio tonight
- northern lights in ohio tonight
- northern lights tonight in ohio
- can you see the northern lights in ohio tonight
- northern lights tonight columbus ohio

**本地 FAQ**

- **Can you see the northern lights in Columbus tonight?**  
  Columbus sits well south of Cleveland magnetically. A night that is only maybe in northern Ohio is usually a no in Columbus. Those queries are answered on this state page, not a separate Columbus URL.
- **Is looking over Lake Erie enough?**  
  A north-facing lake horizon helps a little because there is less ground light in that direction. It does not cancel Cleveland’s skyglow. You still want distance from the city and a strong storm.
- **How often does Ohio actually get aurora?**  
  Most nights: no. Ohio is an event location. Strong geomagnetic storms are the nights that matter; routine Kp 3–4 nights are not.

**内链：** `indiana`, `michigan`, `chicago`

---

## `indiana` · Indiana

- **URL：** `/forecast/indiana`
- **类型 / 模板：** state / `tonight_local`
- **父级：** —
- **时区：** `America/Indiana/Indianapolis`
- **结论点：** `south-bend`（41.6764, -86.252）
- **磁纬（偶极初值）：** 50.7°
- **分区：** midlatitude_event — 中纬事件型（强风暴才有）
- **Kp 初值：** 地平线 ~6，头顶 ~8
- **夏季几乎不黑：** 否
- **主词：** northern lights indiana · 聚类量 13,060 · 加权 KD 14
- **朝向：** north

**代表点**

| id | 名字 | 角色 | lat | lng | 磁纬 |
|---|---|---|---:|---:|---:|
| `south-bend` | South Bend | verdict_north | 41.6764 | -86.252 | 50.7 |
| `indiana-dunes` | Indiana Dunes | dark_sky | 41.6581 | -87.0623 | 50.7 |
| `indianapolis` | Indianapolis | population | 39.7684 | -86.1581 | 48.8 |

**南北 / 区域分工：** Northern Indiana is an event location similar to northern Ohio. Indianapolis and southern Indiana need a stronger storm and are often a no when the north of the state is only maybe.

**光污染：** Indianapolis is a large light island. Northwest Indiana (Gary, Hammond, the inner dunes) sits under Chicago’s skyglow. South Bend and darker stretches of northern Indiana are the better in-state options.

**要不要出城：** Leave Indianapolis. Northern Indiana is the only part of the state worth a special trip in a strong storm. Do not treat the Chicago suburbs in Indiana as dark sky.

**本地障碍：** Chicago light dome in the northwest; Indianapolis glow; Midwest clouds; two time zones (most of the state Eastern, northwest corner Central) — times on this page use Eastern.

**季节：** Long nights September–March. Clouds, not darkness, are the usual Midwest limiter.

**互吃：** Northwest Indiana sits in Chicago’s light dome and in Central Time; Chicago remains a separate city page.

**变体词（全部进本 URL）**

- northern lights in indiana
- aurora borealis indiana
- northern lights indiana tonight
- northern lights tonight indiana
- can you see the northern lights in indiana tonight
- northern lights tonight in indiana
- northern lights tonight indianapolis

**本地 FAQ**

- **Can you see the northern lights in Indianapolis tonight?**  
  Only in a strong storm, and not from downtown. Indianapolis queries are mapped to this state page. The headline uses northern Indiana.
- **Should I drive to Michigan instead?**  
  If you can, yes — Michigan’s Upper Peninsula and even northern Lower Peninsula are closer to the oval. On a marginal night, driving north beats staying in Indianapolis.
- **What about Indiana Dunes?**  
  A north view over Lake Michigan can help, but you are still next to the Chicago light dome. It is a compromise, not a dark-sky destination.

**内链：** `ohio`, `chicago`, `michigan`, `illinois`

---

## `michigan` · Michigan

- **URL：** `/forecast/michigan`
- **类型 / 模板：** state / `tonight_local`
- **父级：** —
- **时区：** `America/Detroit`
- **结论点：** `traverse-city`（44.7631, -85.6206）
- **磁纬（偶极初值）：** 53.8°
- **分区：** sub_oval — 椭圆南缘（中等活动就可能）
- **Kp 初值：** 地平线 ~5，头顶 ~7
- **夏季几乎不黑：** 否
- **主词：** northern lights michigan · 聚类量 30,430 · 加权 KD 30
- **朝向：** north

**代表点**

| id | 名字 | 角色 | lat | lng | 磁纬 |
|---|---|---|---:|---:|---:|
| `marquette` | Marquette | dark_sky | 46.5436 | -87.3954 | 55.5 |
| `traverse-city` | Traverse City | verdict_north | 44.7631 | -85.6206 | 53.8 |
| `detroit` | Detroit | population | 42.3314 | -83.0458 | 51.5 |

**南北 / 区域分工：** Michigan is three different aurora places: Detroit (event-only), northern Lower Peninsula (sub-oval, sometimes), Upper Peninsula (the real viewing region). A GO in the UP is often still NO in Detroit.

**光污染：** Detroit–Ann Arbor–Toledo is a major light complex. Traverse City and the lakeshores are better. The Upper Peninsula (Marquette, Keweenaw, the Lake Superior shore) is the dark, high-latitude part of the state.

**要不要出城：** Leave Detroit. For a serious attempt, go north: at least to the Traverse City / Mackinac latitude, and to the Upper Peninsula when the storm is only moderate.

**本地障碍：** Lake-effect clouds off Superior and Michigan; Detroit skyglow; summer twilight in the UP; ice and winter travel in the UP.

**季节：** August through April is the practical season. The UP has short but not polar nights in June. Fall and late winter storms with clear, cold air are the usual wins.

**互吃：** Do not create /forecast/northern-michigan. That cluster is absorbed here until SERP clearly wants a separate region page.

**变体词（全部进本 URL）**

- aurora borealis northern michigan forecast
- northern lights michigan tonight
- aurora borealis michigan
- northern lights in michigan
- northern lights in michigan tonight
- michigan northern lights tonight
- northern lights tonight in michigan
- northern lights tonight michigan
- can you see the northern lights in michigan tonight

**本地 FAQ**

- **Is this the Northern Michigan page?**  
  There is no separate Northern Michigan URL. Queries like “aurora borealis northern Michigan forecast” are answered here, with the UP and northern Lower Peninsula called out explicitly.
- **Can you see the northern lights from Detroit?**  
  Only in a strong storm, and not from the city core. Detroit is the worst place in the state to try.
- **Upper Peninsula or Traverse City?**  
  The UP is closer to the oval and darker. Traverse City is the compromise if you cannot cross the bridge. On a weak night, the UP is the difference between maybe and no.
- **Does lake-effect ruin it?**  
  Often. A good Kp with a Superior snow band is still a no. Clouds are the usual reason a Michigan night fails after the oval has reached the state.

**内链：** `wisconsin`, `ohio`, `indiana`, `chicago`, `minnesota`

---

## `chicago` · Chicago

- **URL：** `/forecast/chicago`
- **类型 / 模板：** city / `tonight_local`
- **父级：** `illinois`
- **时区：** `America/Chicago`
- **结论点：** `chicago`（41.8781, -87.6298）
- **磁纬（偶极初值）：** 50.9°
- **分区：** midlatitude_event — 中纬事件型（强风暴才有）
- **Kp 初值：** 地平线 ~6，头顶 ~8
- **夏季几乎不黑：** 否
- **主词：** northern lights chicago · 聚类量 17,470 · 加权 KD 22
- **朝向：** north

**代表点**

| id | 名字 | 角色 | lat | lng | 磁纬 |
|---|---|---|---:|---:|---:|
| `chicago` | Chicago | population | 41.8781 | -87.6298 | 50.9 |

**光污染：** Chicago is Bortle-class urban core. The lakefront looking north over Lake Michigan is slightly less obstructed than looking over the city, but skyglow is still severe.

**要不要出城：** Yes. Downtown, the Loop, and the inner neighborhoods are the wrong place to stand. If the storm is strong, get north into southern Wisconsin or at least far enough from the skyline that the northern horizon is not orange.

**本地障碍：** Extreme light pollution; lake-effect and marine clouds; horizon haze; a mid-latitude oval that only reaches the city in strong storms.

**季节：** Event-driven year-round; longer nights September–March. A clear, cold night after a storm is more useful than a warm, hazy one.

**互吃：** illinois: this page is the city (light pollution, lakefront, leaving town). Illinois is the rest of the state and north–south split.

**变体词（全部进本 URL）**

- aurora borealis chicago
- northern lights tonight chicago
- northern lights chicago tonight
- northern lights in chicago tonight
- chicago northern lights tonight
- northern lights tonight in chicago

**本地 FAQ**

- **Can I see the northern lights from downtown Chicago?**  
  You might photograph a faint glow in an extreme storm. You should not plan a night around seeing it from the Loop or Navy Pier. Leave the city.
- **Is the lake enough?**  
  A north-facing lakefront removes some ground lights in that direction. It does not remove Chicago’s dome. Treat it as slightly less bad, not good.
- **Should I go to Wisconsin or Indiana?**  
  Wisconsin north of the metro is usually the better dark-sky direction. Indiana Dunes still sits under Chicago’s glow. Michigan is farther but magnetically better.
- **How is this different from the Illinois page?**  
  This page is the city tonight: pollution, the lake, whether to leave town. Illinois covers Rockford, Galena, and the rest of the state.

**内链：** `illinois`, `indiana`, `wisconsin`, `michigan`

---

## `seattle` · Seattle

- **URL：** `/forecast/seattle`
- **类型 / 模板：** city / `tonight_local`
- **父级：** —
- **时区：** `America/Los_Angeles`
- **结论点：** `seattle`（47.6062, -122.3321）
- **磁纬（偶极初值）：** 53.1°
- **分区：** sub_oval — 椭圆南缘（中等活动就可能）
- **Kp 初值：** 地平线 ~5，头顶 ~7
- **夏季几乎不黑：** 否
- **主词：** northern lights seattle · 聚类量 8,520 · 加权 KD 15
- **朝向：** north

**代表点**

| id | 名字 | 角色 | lat | lng | 磁纬 |
|---|---|---|---:|---:|---:|
| `seattle` | Seattle | population | 47.6062 | -122.3321 | 53.1 |

**光污染：** Puget Sound is a bright urban corridor (Seattle–Tacoma–Everett). City parks are not dark sky. The Olympics and the east slopes of the Cascades are darker; the east side is also often clearer.

**要不要出城：** Leave downtown. Clouds are the usual Seattle killer — a darker but still socked-in hillside does not help. If the forecast is cloudy west of the Cascades and clearer east, the rain shadow matters more than driving ten minutes north.

**本地障碍：** Persistent marine cloud and drizzle; Puget Sound light dome; Olympics blocking some western horizons; summer twilight later than in the Midwest.

**季节：** The oval can reach this latitude more often than Colorado, but winter is the cloudy season. Clear nights after a frontal passage, and the drier east side of the mountains, matter as much as Kp.

**互吃：** Washington state is Wave 2 (eastern Washington is drier and darker). Oregon is the adjacent Wave 1 state. Do not treat Seattle as Washington.

**变体词（全部进本 URL）**

- seattle northern lights tonight
- northern lights in seattle tonight
- northern lights seattle tonight
- northern lights tonight seattle
- northern lights tonight in seattle

**本地 FAQ**

- **Can I see the northern lights from Seattle tonight?**  
  From the city, only in a strong storm and usually as a horizon glow. Clouds stop more Seattle nights than the oval does.
- **Should I drive east of the Cascades?**  
  If western Washington is socked in and the east side is clear, yes — darkness and holes in the clouds beat sitting in the city under a stratus deck. Eastern Washington gets its own page later; until then this page will say when leaving the west side is the point.
- **Is Seattle better than Portland?**  
  Slightly higher latitude, similar cloud problem. Neither is Fairbanks. Both are “maybe in a storm if the sky opens.”

**内链：** `oregon`

---

## `wisconsin` · Wisconsin

- **URL：** `/forecast/wisconsin`
- **类型 / 模板：** state / `tonight_local`
- **父级：** —
- **时区：** `America/Chicago`
- **结论点：** `madison`（43.0731, -89.4012）
- **磁纬（偶极初值）：** 52.0°
- **分区：** sub_oval — 椭圆南缘（中等活动就可能）
- **Kp 初值：** 地平线 ~5，头顶 ~7
- **夏季几乎不黑：** 否
- **主词：** northern lights wisconsin · 聚类量 7,270 · 加权 KD 22
- **朝向：** north

**代表点**

| id | 名字 | 角色 | lat | lng | 磁纬 |
|---|---|---|---:|---:|---:|
| `bayfield` | Bayfield | dark_sky | 46.8108 | -90.8182 | 55.6 |
| `madison` | Madison | verdict_north | 43.0731 | -89.4012 | 52.0 |
| `milwaukee` | Milwaukee | population | 43.0389 | -87.9065 | 52.0 |

**南北 / 区域分工：** Southeast Wisconsin is Chicago-adjacent and event-heavy. Northern Wisconsin is closer to Minnesota’s odds. A maybe in Bayfield is often still a no in Milwaukee.

**光污染：** Milwaukee–Chicago glow covers the southeast. Madison is better than Milwaukee but still urban. Northern Wisconsin (Northwoods, Apostle Islands, Lake Superior shore) is the dark part of the state.

**要不要出城：** Leave Milwaukee. If you can keep driving north of the agricultural belt into the Northwoods, do it. Door County and the Superior shore beat the southern lakeshore suburbs.

**本地障碍：** Lake Michigan marine cloud in the east; Superior snow bands in the north; Milwaukee–Chicago skyglow; humid haze.

**季节：** Tonight-intent queries are a large share of this cluster. Long nights September–March; northern Wisconsin stays useful later into spring than Illinois.

**变体词（全部进本 URL）**

- northern lights wisconsin tonight
- northern lights tonight wisconsin
- northern lights tonight in wisconsin
- wisconsin northern lights tonight

**本地 FAQ**

- **Can you see the northern lights in Milwaukee?**  
  Only in a strong storm, and not from the inner city. Milwaukee is the wrong end of the state.
- **Where in Wisconsin is actually good?**  
  North: the Northwoods, Bayfield, the Apostle Islands region, and other Superior-facing dark areas. That is a different night than Madison.
- **Better than Illinois?**  
  Usually yes, especially once you are north of the Chicago–Milwaukee corridor.

**内链：** `minnesota`, `michigan`, `chicago`, `illinois`

---

## `massachusetts` · Massachusetts

- **URL：** `/forecast/massachusetts`
- **类型 / 模板：** state / `tonight_local`
- **父级：** —
- **时区：** `America/New_York`
- **结论点：** `newburyport`（42.8126, -70.8773）
- **磁纬（偶极初值）：** 51.7°
- **分区：** midlatitude_event — 中纬事件型（强风暴才有）
- **Kp 初值：** 地平线 ~6，头顶 ~8
- **夏季几乎不黑：** 否
- **主词：** northern lights massachusetts · 聚类量 7,460 · 加权 KD 23
- **朝向：** north

**代表点**

| id | 名字 | 角色 | lat | lng | 磁纬 |
|---|---|---|---:|---:|---:|
| `newburyport` | Newburyport | verdict_north | 42.8126 | -70.8773 | 52.2 |
| `boston` | Boston | population | 42.3601 | -71.0589 | 51.7 |
| `north-adams` | North Adams | dark_sky | 42.7009 | -73.1087 | 52.0 |

**南北 / 区域分工：** The North Shore and the northern Berkshires are the least-bad in-state options. The South Shore and Cape Cod are farther from the oval.

**光污染：** Boston–Providence is a dense coastal light corridor. The North Shore (beyond the inner suburbs) and the Berkshires are darker. Cape Cod is south of Boston and magnetically worse, not better.

**要不要出城：** Leave Boston. North toward the New Hampshire border or west into the Berkshires beats the harbor. Do not drive to the Cape for aurora.

**本地障碍：** Coastal clouds and nor’easters; Boston skyglow; a short north horizon over the ocean that still sits under regional light; event-only oval.

**季节：** Almost entirely storm-driven. Longer nights September–March. Maine, not the Cape, is the in-region upgrade.

**互吃：** Boston has tonight queries but no Wave 1 city page. All Boston variants map here. Do not ship /forecast/boston until SERP is clearly separate.

**变体词（全部进本 URL）**

- northern lights tonight massachusetts
- northern lights could be visible tonight from parts of massachusetts
- northern lights in massachusetts tonight
- northern lights massachusetts tonight
- northern lights tonight boston
- boston northern lights tonight
- northern lights boston tonight

**本地 FAQ**

- **Is there a Boston page?**  
  Not in the first index set. “Northern lights tonight Boston” is answered here as Massachusetts, with Boston as the population point.
- **Can I see it from the city?**  
  Only in a strong storm, usually as a faint northern glow, and often not with the naked eye through skyglow.
- **Cape Cod or north?**  
  North. Cape Cod is the wrong direction.

**内链：** `maine`

---

## `maine` · Maine

- **URL：** `/forecast/maine`
- **类型 / 模板：** state / `tonight_local`
- **父级：** —
- **时区：** `America/New_York`
- **结论点：** `bangor`（44.8016, -68.7712）
- **磁纬（偶极初值）：** 54.1°
- **分区：** sub_oval — 椭圆南缘（中等活动就可能）
- **Kp 初值：** 地平线 ~5，头顶 ~7
- **夏季几乎不黑：** 否
- **主词：** northern lights maine · 聚类量 5,680 · 加权 KD 21
- **朝向：** north

**代表点**

| id | 名字 | 角色 | lat | lng | 磁纬 |
|---|---|---|---:|---:|---:|
| `presque-isle` | Presque Isle | dark_sky | 46.6812 | -68.0159 | 56.0 |
| `bangor` | Bangor | verdict_north | 44.8016 | -68.7712 | 54.1 |
| `portland` | Portland | population | 43.6591 | -70.2568 | 53.0 |

**南北 / 区域分工：** Southern Maine is New England event-tier. Aroostook and the North Woods are closer to a sub-oval site. A maybe in Presque Isle can still be no in Portland.

**光污染：** Portland and the southern coast are the bright part of a generally dark state. Baxter, the North Woods, and Aroostook are among the darkest Wave 1 locations in the Lower 48.

**要不要出城：** Leave Portland if you can. Interior and northern Maine beat the tourist coast. Acadia is darker than Boston but still coastal and south of the woods.

**本地障碍：** Coastal fog and marine cloud; summer twilight in the far north; long winter drives; trees blocking horizon in the woods (you still need a north opening).

**季节：** One of the better Lower 48 states on a moderate storm. August–April; September and March are popular because nights are long enough without the worst winter weather.

**变体词（全部进本 URL）**

- northern lights maine tonight
- northern lights in maine tonight
- northern lights tonight maine
- maine northern lights tonight
- northern lights tonight in maine

**本地 FAQ**

- **Is Acadia a good place?**  
  Better than a city, and a north-facing coast helps, but it is not northern Maine. For a marginal night, the North Woods and Aroostook are the upgrade.
- **Portland tonight?**  
  Portland is the worst in-state default. This page’s headline uses Bangor-latitude Maine, and calls Portland out when it differs.
- **Better than Massachusetts?**  
  Yes. Darker, farther north, and less of a coastal megacity dome.

**内链：** `massachusetts`

---

## `minnesota` · Minnesota

- **URL：** `/forecast/minnesota`
- **类型 / 模板：** state / `tonight_local`
- **父级：** —
- **时区：** `America/Chicago`
- **结论点：** `duluth`（46.7867, -92.1005）
- **磁纬（偶极初值）：** 55.5°
- **分区：** sub_oval — 椭圆南缘（中等活动就可能）
- **Kp 初值：** 地平线 ~4，头顶 ~6
- **夏季几乎不黑：** 否
- **主词：** northern lights minnesota · 聚类量 4,060 · 加权 KD 16
- **朝向：** north

**代表点**

| id | 名字 | 角色 | lat | lng | 磁纬 |
|---|---|---|---:|---:|---:|
| `ely` | Ely | dark_sky | 47.9032 | -91.8671 | 56.6 |
| `duluth` | Duluth | verdict_north | 46.7867 | -92.1005 | 55.5 |
| `minneapolis` | Minneapolis | population | 44.9778 | -93.265 | 53.6 |

**南北 / 区域分工：** Twin Cities: event-to-sub-oval. Duluth and the Arrowhead: sub-oval. A GO near Ely is often only maybe in Minneapolis.

**光污染：** The Twin Cities are a large dome. Duluth is better but still a city. The Iron Range, Ely, and the Boundary Waters are the dark, high-latitude part of the state — among the best Lower 48 odds in this set.

**要不要出城：** Leave Minneapolis. North toward Duluth and beyond is the correct direction. The Boundary Waters / Ely latitude is the in-state destination on a moderate night.

**本地障碍：** Twin Cities glow; Superior lake cloud and winter snow bands; summer twilight in the far north; mosquitoes and trees if you pick a closed-in site.

**季节：** One of the best product matches in Wave 1. August–April; northern Minnesota can work on weaker storms than Ohio or Colorado.

**互吃：** Minneapolis and Duluth do not get Wave 1 city pages. Those tonight queries map here.

**变体词（全部进本 URL）**

- northern lights tonight minneapolis
- northern lights in minnesota tonight
- northern lights tonight minnesota
- northern lights tonight in minnesota
- northern lights tonight duluth mn

**本地 FAQ**

- **Minneapolis tonight?**  
  Answered here, not on a Twin Cities URL. The city is the wrong place to stand; the headline uses Duluth-latitude Minnesota.
- **Duluth or farther?**  
  Duluth is already a big step north of Minneapolis. Ely and the Boundary Waters are darker and slightly better magnetically.
- **How does Minnesota compare to Michigan?**  
  Northern Minnesota and Michigan’s UP are in the same league. Both beat Chicago, Ohio, and Colorado on ordinary active nights.

**内链：** `wisconsin`, `michigan`

---

## `illinois` · Illinois

- **URL：** `/forecast/illinois`
- **类型 / 模板：** state / `tonight_local`
- **父级：** —
- **时区：** `America/Chicago`
- **结论点：** `rockford`（42.2711, -89.094）
- **磁纬（偶极初值）：** 51.2°
- **分区：** midlatitude_event — 中纬事件型（强风暴才有）
- **Kp 初值：** 地平线 ~6，头顶 ~8
- **夏季几乎不黑：** 否
- **主词：** northern lights illinois · 聚类量 7,380 · 加权 KD 21
- **朝向：** north

**代表点**

| id | 名字 | 角色 | lat | lng | 磁纬 |
|---|---|---|---:|---:|---:|
| `galena` | Galena | dark_sky | 42.4167 | -90.429 | 51.2 |
| `rockford` | Rockford | verdict_north | 42.2711 | -89.094 | 51.2 |
| `springfield` | Springfield | population | 39.7817 | -89.6501 | 48.7 |

**南北 / 区域分工：** Northern Illinois can participate in strong storms. Central and southern Illinois are extreme-event only. Never use Springfield as the state headline.

**光污染：** Chicago’s dome covers a wide radius of northeastern Illinois. Rockford is better than the suburbs but still a city. Galena and the Mississippi palisades are the realistic in-state dark direction. Springfield and southern Illinois are much worse magnetically.

**要不要出城：** If you are in Chicago, use the Chicago page and leave the metro. If you are elsewhere in Illinois, go north and away from the Chicago glow — not south.

**本地障碍：** Chicago skyglow across the northeast; flat-horizon haze; Midwest clouds; a long north–south magnetic gradient inside one state.

**季节：** Event-driven. The value of this page is telling northern Illinois apart from Chicago and apart from Springfield.

**互吃：** chicago: city light pollution and lakefront. This page is Illinois minus the city story — northern vs central/southern Illinois.

**变体词（全部进本 URL）**

- illinois northern lights
- northern lights illinois tonight
- northern lights in illinois tonight
- northern lights tonight illinois
- northern lights tonight in illinois
- can you see the northern lights in illinois tonight
- are the northern lights visible in illinois tonight

**本地 FAQ**

- **Why isn’t this just the Chicago page?**  
  Chicago searches are city intent. Illinois searches include the rest of the state. Tonight’s headline here uses northern Illinois (Rockford/Galena), not the Loop.
- **Southern Illinois tonight?**  
  Treat it as a no unless the storm is extreme. The oval reaches northern Illinois first.
- **Better to go to Wisconsin?**  
  Usually yes, if you can cross the border and get north of the Chicago–Milwaukee glow.

**内链：** `chicago`, `indiana`, `wisconsin`

---

## `oregon` · Oregon

- **URL：** `/forecast/oregon`
- **类型 / 模板：** state / `tonight_local`
- **父级：** —
- **时区：** `America/Los_Angeles`
- **结论点：** `baker-city`（44.7749, -117.8344）
- **磁纬（偶极初值）：** 50.9°
- **分区：** midlatitude_event — 中纬事件型（强风暴才有）
- **Kp 初值：** 地平线 ~6，头顶 ~8
- **夏季几乎不黑：** 否
- **主词：** northern lights oregon · 聚类量 6,780 · 加权 KD 18
- **朝向：** north

**代表点**

| id | 名字 | 角色 | lat | lng | 磁纬 |
|---|---|---|---:|---:|---:|
| `baker-city` | Baker City | verdict_north | 44.7749 | -117.8344 | 50.9 |
| `portland` | Portland | population | 45.5152 | -122.6784 | 51.0 |
| `bend` | Bend | dark_sky | 44.0582 | -121.3153 | 49.8 |

**南北 / 区域分工：** The useful split is west (wet, cloudy, populated) vs east (dry, dark), not a large north–south oval difference. Portland is not meaningfully closer to the oval than Baker City.

**光污染：** Portland is a sizable dome. The high desert (Bend, the east side) is much darker. Northeast Oregon (Baker City) is the better magnetic+darkness compromise; Bend is darker but slightly farther from the oval.

**要不要出城：** Leave Portland, and treat the Cascades as a cloud wall, not a viewing destination. If the west side is socked in, the dry east is the reason to drive.

**本地障碍：** Pacific marine cloud on the west side; Portland glow; Bend is dark but not higher latitude; mountains blocking horizons.

**季节：** East-side clear nights in fall and winter are the realistic window. The coast is the wrong default.

**互吃：** Seattle is the adjacent city page (higher latitude, same marine-cloud problem). Eastern Oregon is clearer, not magnetically better.

**变体词（全部进本 URL）**

- aurora borealis oregon
- northern lights oregon tonight

**本地 FAQ**

- **Why is the headline Baker City, not Portland?**  
  This page’s tonight card uses northeast Oregon, not downtown Portland. Portland is listed separately and is usually worse because of clouds and skyglow.
- **Portland or Bend tonight?**  
  Bend wins on darkness and often on clouds. It does not win on magnetic latitude. Go east for sky, not because the oval is overhead there.
- **Is Oregon better than Washington?**  
  Seattle is a bit farther north. Oregon’s advantage is the dark, dry east, not a better oval.
- **The coast?**  
  No. Brighter marine layer, worse weather, no magnetic gain.

**内链：** `seattle`, `utah`

---

## `utah` · Utah

- **URL：** `/forecast/utah`
- **类型 / 模板：** state / `tonight_local`
- **父级：** —
- **时区：** `America/Denver`
- **结论点：** `logan`（41.737, -111.8338）
- **磁纬（偶极初值）：** 48.7°
- **分区：** midlatitude_event — 中纬事件型（强风暴才有）
- **Kp 初值：** 地平线 ~7，头顶 ~8
- **夏季几乎不黑：** 否
- **主词：** northern lights utah · 聚类量 7,290 · 加权 KD 22
- **朝向：** north

**代表点**

| id | 名字 | 角色 | lat | lng | 磁纬 |
|---|---|---|---:|---:|---:|
| `logan` | Logan | verdict_north | 41.737 | -111.8338 | 48.7 |
| `salt-lake-city` | Salt Lake City | population | 40.7608 | -111.891 | 47.7 |
| `antelope-island` | Antelope Island | dark_sky | 40.958 | -112.206 | 47.9 |

**南北 / 区域分工：** Northern Utah is the only realistic band. Southern Utah parks are dark and famous, and they are the wrong direction for the oval.

**光污染：** The Wasatch Front (Ogden–Salt Lake–Provo) is a bright valley dome. Looking north over the Great Salt Lake (Antelope Island) reduces ground lights in that direction. Northern Utah (Logan, the Idaho border) is the in-state magnetic upgrade. The west desert is darker but not farther north.

**要不要出城：** Leave downtown Salt Lake. A north-facing lake horizon is the local trick; driving north toward Logan / the Idaho line is the magnetic trick. Do not drive south to Zion for aurora.

**本地障碍：** Wasatch Front glow; valley inversions and winter haze; mountains blocking north if you sit in the wrong canyon; mid-latitude oval (similar to Colorado).

**季节：** Dry air and high elevation help when a strong storm arrives. September–March. Southern parks are not the aurora play.

**互吃：** Salt Lake City tonight maps here. No Wave 1 SLC city page.

**变体词（全部进本 URL）**

- aurora borealis utah
- northern lights in utah tonight
- northern lights utah tonight
- northern lights tonight utah
- northern lights tonight salt lake city

**本地 FAQ**

- **Salt Lake City tonight?**  
  Mapped to this state page. The city itself is a poor site; the headline uses northern Utah.
- **Antelope Island?**  
  A known public north-facing lake horizon near the metro. It is not wilderness dark sky, but it is a better local option than downtown.
- **What about Moab or Zion?**  
  Dark and the wrong way. Aurora in Utah is a northern-horizon, strong-storm problem.

**内链：** `colorado`

---

## `alaska` · Alaska

- **URL：** `/forecast/alaska`
- **类型 / 模板：** state / `travel_plus_tonight`
- **父级：** —
- **时区：** `America/Anchorage`
- **结论点：** `fairbanks`（64.8378, -147.7164）
- **磁纬（偶极初值）：** 65.6°
- **分区：** oval — 椭圆内（常驻）
- **Kp 初值：** 地平线 ~1，头顶 ~3
- **夏季几乎不黑：** 是
- **主词：** northern lights alaska · 聚类量 87,800 · 加权 KD 36
- **朝向：** north

**代表点**

| id | 名字 | 角色 | lat | lng | 磁纬 |
|---|---|---|---:|---:|---:|
| `fairbanks` | Fairbanks | verdict_north | 64.8378 | -147.7164 | 65.6 |
| `anchorage` | Anchorage | population | 61.2181 | -149.9003 | 61.9 |
| `juneau` | Juneau | contrast_weather | 58.3019 | -134.4197 | 61.6 |

**南北 / 区域分工：** Interior (Fairbanks belt) sits under the oval. Anchorage still sees aurora often but weaker and lower on the horizon. Juneau and the Inside Passage are wet; clouds, not Kp, are the usual failure. The North Slope has polar night in winter and midnight sun in summer — not the default tourist play.

**光污染：** Fairbanks and Anchorage are small compared with Lower 48 metros but still worth leaving. Interior dark sites beat both cities. Southeast Alaska is not a light problem — it is a rain problem.

**要不要出城：** In Interior Alaska, yes: get out of Fairbanks glow (the city page covers that). Statewide, picking the Interior over Juneau matters more than picking a hill inside Anchorage.

**本地障碍：** Midnight sun from roughly May through late July; Southeast rain and cloud; Anchorage weather vs Interior cold/clear; ice fog and inversions around Fairbanks in deep winter.

**季节：** Practical viewing is late August through mid-April. September and March are the usual travel compromise (dark enough, less brutal than December). Tonight in June is almost always a darkness no, even if the oval is active.

**互吃：** fairbanks: city tonight + local viewing. This page is statewide — Interior vs Southcentral vs Southeast, season, and where to go. Fairbanks-named queries go to the city page. “Best places in Alaska” stays here.

**变体词（全部进本 URL）**

- best places to see aurora in alaska
- alaska northern lights
- aurora borealis alaska
- northern lights aurora borealis alaska
- alaska aurora forecast
- aurora forecast alaska
- alaska aurora
- best time to see northern lights in alaska
- aurora forecast for alaska
- best time to visit alaska to see northern lights
- northern lights forecast alaska
- northern lights in alaska
- aurora alaska
- can you see the northern lights in alaska
- when can you see the northern lights in alaska
- alaska northern lights forecast
- when are the northern lights in alaska
- where to see aurora in alaska
- northern lights tonight alaska

**本地 FAQ**

- **Fairbanks or Anchorage?**  
  Fairbanks. It sits closer to the oval, with colder, clearer winter skies more often. Anchorage is easier to reach and still works on active nights, but it is the compromise.
- **Can I see the northern lights in Alaska in summer?**  
  Not in the way visitors mean. Interior nights do not get dark around the solstice. Come from late August onward.
- **Where are the best places in Alaska?**  
  The Interior around Fairbanks is the default. Southcentral can work. Southeast is for scenery, not reliable aurora, because of rain.
- **Is tonight the main question in Alaska?**  
  For visitors it is often “which week / which part of the state.” This page keeps a tonight card, then answers season and region. Fairbanks has the local tonight tool.

**内链：** `fairbanks`

---

## `fairbanks` · Fairbanks

- **URL：** `/forecast/fairbanks`
- **类型 / 模板：** city / `travel_plus_tonight`
- **父级：** `alaska`
- **时区：** `America/Anchorage`
- **结论点：** `fairbanks`（64.8378, -147.7164）
- **磁纬（偶极初值）：** 65.6°
- **分区：** oval — 椭圆内（常驻）
- **Kp 初值：** 地平线 ~1，头顶 ~3
- **夏季几乎不黑：** 是
- **主词：** fairbanks northern lights · 聚类量 19,790 · 加权 KD 32
- **朝向：** north

**代表点**

| id | 名字 | 角色 | lat | lng | 磁纬 |
|---|---|---|---:|---:|---:|
| `fairbanks` | Fairbanks | population | 64.8378 | -147.7164 | 65.6 |

**光污染：** Fairbanks is a small city with a noticeable winter dome, especially in cold inversions. Local high points and dark roads outside town (Murphy Dome, Pedro Dome, Chena country) are the usual advice — named as regions, not as parking instructions.

**要不要出城：** Yes, even here. Downtown Fairbanks is good enough on a strong overhead display and poor for a faint one. Get away from town lights and look north to east, which is the usual oval direction.

**本地障碍：** Not dark from late May through late July; ice fog and low cloud in deep winter; temperature inversions trapping moisture and glow; tour-bus traffic at well-known pullouts on peak nights.

**季节：** Late August to mid-April. September and March are the common trip months. December–January are darkest and coldest. Solstice weeks are a darkness no.

**互吃：** alaska: statewide season and regions. This page is Fairbanks tonight, darkness, and local glow. Tour keywords are mapped here but v1 does not sell tours.

**变体词（全部进本 URL）**

- fairbanks alaska northern lights
- aurora forecast fairbanks
- fairbanks alaska aurora borealis tours
- fairbanks alaska northern lights tour
- fairbanks aurora
- fairbanks aurora prediction
- aurora borealis fairbanks
- what time of year to see northern lights in fairbanks

**本地 FAQ**

- **Can I see the northern lights from downtown Fairbanks?**  
  On a strong, overhead night, sometimes. On a typical active night you still want to leave the glow. This is not Chicago, but it is not a wilderness site either.
- **What time of year?**  
  When it is actually dark: late August through mid-April. Summer trips for aurora are the wrong product.
- **Do I need a tour?**  
  This site does not book tours. Clouds, darkness, and leaving town lights are the decision. Tours are optional logistics, not a visibility requirement.
- **How is this different from the Alaska page?**  
  Alaska is Interior vs Anchorage vs Juneau and when to visit the state. Fairbanks is tonight at this city.

**内链：** `alaska`

