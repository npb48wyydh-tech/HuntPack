(() => {
  'use strict';

  const STORAGE_KEY = 'huntingPackingList.v1';
  const FOOD_CATEGORY = 'Food / Snacks / Beer / Water';
  const el = (id) => document.getElementById(id);

  const form = el('tripForm');
  const startDate = el('startDate');
  const endDate = el('endDate');
  const locationInput = el('location');
  const hunterCountInput = el('hunterCount');
  const gameInputs = () => [...document.querySelectorAll('input[name="games"]')];
  const tripStyle = el('tripStyle');
  const withDog = el('withDog');
  const processing = el('processing');
  const liveWeather = el('liveWeather');
  const resultSection = el('resultSection');
  const checklistEl = el('checklist');
  const formError = el('formError');
  const durationLine = el('durationLine');
  const customDialog = el('customDialog');
  const aboutDialog = el('aboutDialog');

  let state = loadState();
  let activeFilter = 'all';
  let weatherContext = null;

  const GAME_LABELS = {
    upland: 'Upland birds', waterfowl: 'Waterfowl', dove: 'Dove', deer: 'Deer', turkey: 'Turkey',
    hog: 'Feral hog', elk: 'Western big game', smallgame: 'Small game', predator: 'Predator / varmint', other: 'Other game'
  };

  const STYLE_LABELS = {
    day: 'Day trip', lodge: 'Lodge / cabin', vehicle: 'Vehicle camping', backcountry: 'Backcountry'
  };

  const baseItems = (ctx) => [
    item('Documents & Legal', 'Hunting license', 'Verify it is valid for the state, species, and dates.', '1', true),
    item('Documents & Legal', 'Tags / permits / stamps', 'Include species, public-land, draw, migratory-bird, or access documents that apply.', 'As required', true),
    item('Documents & Legal', 'Photo ID', 'Keep it accessible and protected from weather.', '1', true),
    item('Documents & Legal', 'Offline map / access information', 'Save boundaries, parking, gates, emergency exits, and landowner/public-land contacts.', '1 set', true),

    item('Hunting Gear', 'Primary hunting arm / bow', 'Unloaded and transported in accordance with applicable law.', '1', true),
    item('Hunting Gear', 'Ammunition / arrows', ammoQty(ctx), 'Trip supply', true),
    item('Hunting Gear', 'Optics suited to the hunt', 'Binoculars, rangefinder, or scope tools as appropriate.', '1 set'),
    item('Hunting Gear', 'Eye and hearing protection', 'Especially for range checks, blinds, and high-volume wingshooting.', '1 set'),
    item('Hunting Gear', 'Small field repair / cleaning kit', 'Cloth, lubricant, multi-tool, and only the tools your equipment actually needs.', '1 kit'),

    item('Safety & Navigation', 'Phone + charging cable', 'Download maps and key documents before leaving coverage.', '1', true),
    item('Safety & Navigation', 'Backup battery / power bank', 'Size it for navigation, communications, and weather use.', ctx.days >= 3 ? '10,000–20,000 mAh' : '5,000–10,000 mAh'),
    item('Safety & Navigation', 'First-aid kit', 'Include trauma supplies appropriate to your training and remoteness.', '1', true),
    item('Safety & Navigation', 'Navigation backup', 'Compass, GPS, or second offline-capable device.', '1', true),
    item('Safety & Navigation', 'Headlamp', 'Pack spare batteries or a second light.', '1–2', true),
    item('Safety & Navigation', 'Emergency signaling', 'Whistle, mirror, or satellite communicator for remote country.', '1 set'),
    item('Safety & Navigation', 'Fire / ignition kit', 'Weatherproof ignition source where lawful and safe.', '1 kit'),

    item('Clothing', 'Hunting boots', 'Broken-in, terrain-appropriate, and dry before departure.', '1 pair', true),
    item('Clothing', 'Hunting pants', '', qtyByDays(ctx.days, 1, 2, 3)),
    item('Clothing', 'Base shirts', 'Favor moisture management over cotton for active hunts.', qtyByDays(ctx.days, 1, 2, 3)),
    item('Clothing', 'Socks', 'Pack at least one dry reserve pair.', String(Math.max(2, ctx.days + 1)) + ' pairs'),
    item('Clothing', 'Underwear', '', String(Math.max(1, ctx.days)) + ' pairs'),
    item('Clothing', 'Hat / cap', 'Sun, rain, brush, or warmth as conditions require.', '1–2'),
    item('Clothing', 'High-visibility garment', 'Carry blaze orange/pink when required or prudent for the hunt.', '1'),

    ...foodProvisioningItems(ctx),

    item('Miscellaneous', 'Sunscreen', 'Reapply during long open-country hunts.', '1'),
    item('Miscellaneous', 'Insect / tick repellent', 'Choose for the local season and vectors.', '1'),
    item('Miscellaneous', 'Toilet kit', 'Paper, wipes, hand sanitizer, and waste bags.', '1 kit'),
    item('Miscellaneous', 'Trash bags / zip bags', 'For wet gear, litter, small parts, and cleanup.', 'Several')
  ];

  const gameItems = {
    upland: (ctx) => [
      item('Hunting Gear', 'Shotgun + appropriate choke(s)', 'Pattern and function-check before the trip.', '1', true),
      item('Hunting Gear', 'Upland vest / game bag', 'Carry shells, water, first aid, birds, and navigation.', '1', true),
      item('Hunting Gear', 'Brush protection', 'Briar-resistant pants/chaps and eye protection where cover is thick.', '1 set'),
      item('Hunting Gear', 'Bird cleaning kit', 'Small knife/shears, gloves, bags, and paper towels.', '1 kit'),
      item('Game Care', 'Breathable bird storage', 'Cool birds promptly; avoid sealing warm birds in plastic.', 'As needed'),
      item('Game Care', 'Cooler + ice plan', 'Keep harvested birds cool without soaking meat.', ctx.days > 1 ? '1 large cooler' : '1 cooler')
    ],
    waterfowl: (ctx) => [
      item('Hunting Gear', 'Non-toxic shotshells', 'Confirm legal shot material, shot size, and possession limits.', ammoQty(ctx, 'waterfowl'), true),
      item('Hunting Gear', 'Waders / waterproof boots', 'Inspect for leaks before the trip.', '1', true),
      item('Hunting Gear', 'Waterfowl calls', 'Species-appropriate calls plus lanyard.', '1 set'),
      item('Hunting Gear', 'Decoys + lines/weights', 'Match species and water depth.', ctx.days > 1 ? 'Hunt set + spares' : 'Hunt set'),
      item('Hunting Gear', 'Blind / concealment materials', 'Blind bag, face cover, gloves, and natural cover tools as needed.', '1 set'),
      item('Hunting Gear', 'Dry bag', 'Protect phone, documents, layers, and emergency gear.', '1', true),
      item('Safety & Navigation', 'Wading / boat safety gear', 'PFD and water-rescue equipment when using a boat or deep water.', 'As applicable', true),
      item('Game Care', 'Bird straps / totes', '', '1 set'),
      item('Game Care', 'Cooler + ice plan', 'Cool birds promptly after the hunt.', '1 cooler')
    ],
    dove: (ctx) => [
      item('Hunting Gear', 'Shotgun + shells', 'Bring more shells than an equivalent upland hunt; verify field rules.', ammoQty(ctx, 'dove'), true),
      item('Hunting Gear', 'Lightweight stool / bucket seat', '', '1'),
      item('Hunting Gear', 'Dove decoys / spinner', 'Only where lawful and desired.', 'Optional set'),
      item('Hunting Gear', 'Shell pouch / vest', '', '1'),
      item('Game Care', 'Small cooler + ice', 'Dove hunts are often hot; cool birds quickly.', '1')
    ],
    deer: () => [
      item('Hunting Gear', 'Rangefinder', 'Confirm batteries and your realistic shooting limits.', '1'),
      item('Hunting Gear', 'Binoculars', '', '1'),
      item('Hunting Gear', 'Shooting support', 'Bipod, sticks, rest, or pack as appropriate.', '1'),
      item('Hunting Gear', 'Tree-stand safety harness', 'Use a full-body system when hunting elevated stands.', 'If applicable', true),
      item('Game Care', 'Field-dressing knife', 'Sharp, clean, and secure in its sheath.', '1', true),
      item('Game Care', 'Game bags', 'Breathable, sized for the animal and retrieval method.', '1 set'),
      item('Game Care', 'Nitrile gloves', '', 'Several pairs'),
      item('Game Care', 'Drag rope / game cart plan', 'Match the terrain, distance, and animal size.', '1 system')
    ],
    turkey: () => [
      item('Hunting Gear', 'Turkey calls', 'Carry a primary and backup call.', '2+'),
      item('Hunting Gear', 'Turkey vest / seat', '', '1'),
      item('Hunting Gear', 'Face mask + gloves', 'Reduce exposed skin movement.', '1 set'),
      item('Hunting Gear', 'Decoys + stakes', 'Use only where legal and safe.', 'Optional'),
      item('Hunting Gear', 'Patterned shotgun setup / archery gear', 'Verify point of impact before hunting.', '1', true),
      item('Game Care', 'Turkey tote / game bag', '', '1')
    ],
    hog: () => [
      item('Hunting Gear', 'Low-light illumination', 'Headlamp/handheld light; verify local rules for artificial light.', '1–2'),
      item('Hunting Gear', 'Optics for expected shooting light', 'Confirm batteries and zero before departure.', '1'),
      item('Game Care', 'Heavy-duty game bags / cooler space', 'Plan for warm-weather recovery and rapid cooling.', '1 set', true),
      item('Game Care', 'Extra nitrile gloves', 'Use good hygiene during field dressing.', 'Several pairs')
    ],
    elk: () => [
      item('Hunting Gear', 'Rangefinder + binocular harness', '', '1 set'),
      item('Hunting Gear', 'Trekking poles', 'Useful for steep terrain and heavy pack-outs.', '1 pair'),
      item('Game Care', 'Large breathable game bags', 'Sized for quartered big game.', '1 full set', true),
      item('Game Care', 'Pack frame / meat-hauling plan', 'Capacity should match the animal and retrieval distance.', '1 system', true),
      item('Game Care', 'Flagging / waypoint plan', 'Mark meat, route, and retrieval points responsibly.', '1 set')
    ],
    smallgame: () => [
      item('Hunting Gear', 'Small-game vest / pouch', '', '1'),
      item('Hunting Gear', 'Compact game-cleaning kit', '', '1'),
      item('Game Care', 'Small cooler / breathable game bag', '', '1')
    ],
    predator: () => [
      item('Hunting Gear', 'Calls / caller + spare power', 'Confirm batteries, remote, and saved sound set.', '1 set'),
      item('Hunting Gear', 'Shooting sticks / stable rest', '', '1'),
      item('Hunting Gear', 'Wind indicator', 'Use powder, lightweight ribbon, or other non-littering method.', '1'),
      item('Hunting Gear', 'Low-light gear', 'Only as lawful and needed for the hunt.', 'As applicable')
    ],
    other: () => [
      item('Hunting Gear', 'Species-specific hunting equipment', 'Add calls, decoys, specialized optics, or retrieval gear for your quarry.', 'As needed')
    ]
  };

  const styleItems = {
    day: () => [],
    lodge: (ctx) => [
      item('Camp & Sleep', 'Overnight bag', 'Comfortable clothes, toiletries, medications, and charging setup.', qtyByDays(ctx.days, 'Small', 'Medium', 'Medium')),
      item('Camp & Sleep', 'Casual shoes / camp footwear', '', '1 pair')
    ],
    vehicle: (ctx) => [
      item('Camp & Sleep', 'Shelter', 'Tent, vehicle sleep system, or other weather-worthy shelter.', '1', true),
      item('Camp & Sleep', 'Sleeping bag / quilt', 'Temperature rating should fit the forecast with margin.', '1', true),
      item('Camp & Sleep', 'Sleeping pad / mattress', '', '1'),
      item('Camp & Sleep', 'Pillow', '', '1'),
      item('Camp & Sleep', 'Camp chair', '', '1'),
      item('Camp & Sleep', 'Stove + fuel', 'Use only where permitted; have a no-flame meal backup during restrictions.', ctx.days >= 3 ? '1 + reserve fuel' : '1'),
      item('Camp & Sleep', 'Cook/eat kit', 'Pot/pan as needed, cup, utensils, lighter.', '1 kit'),
      item('Camp & Sleep', 'Camp light / lantern', '', '1'),
      item('Vehicle', 'Fuel plan', 'Start remote legs with adequate range and reserve.', 'Full tank + reserve plan', true),
      item('Vehicle', 'Tire / recovery kit', 'Spare, jack, inflator, plug kit, traction/recovery equipment appropriate to vehicle and terrain.', '1 kit', true),
      item('Vehicle', 'Basic tool kit', '', '1'),
      item('Vehicle', 'Jumper / battery solution', '', '1'),
      item('Vehicle', 'Paper map / written route backup', 'Useful when phone navigation or service fails.', '1')
    ],
    backcountry: (ctx) => [
      item('Camp & Sleep', 'Backpack', 'Sized for overnight load and game-retrieval requirements.', '1', true),
      item('Camp & Sleep', 'Lightweight shelter', 'Include stakes/guylines appropriate to the terrain.', '1', true),
      item('Camp & Sleep', 'Sleeping bag / quilt', 'Temperature rating should fit forecast lows with margin.', '1', true),
      item('Camp & Sleep', 'Sleeping pad', '', '1'),
      item(FOOD_CATEGORY, 'Water treatment', 'Filter/purifier plus backup tablets if water sources are uncertain.', '1 system', true),
      item(FOOD_CATEGORY, 'Backcountry stove + fuel', 'Unless intentionally using a no-cook plan.', '1 set'),
      item('Safety & Navigation', 'Satellite communicator / PLB', 'Strongly recommended beyond reliable cell service.', '1', true),
      item('Safety & Navigation', 'Emergency bivy / repair kit', 'Tape, cordage, patches, and shelter repair materials.', '1 kit'),
      item('Game Care', 'Pack-out capacity', 'Leave enough space/weight capacity for harvested game.', 'Planned', true)
    ]
  };

  const dogItems = (ctx) => [
    item('Dog Gear', 'Dog food', 'Normal food plus a small reserve; avoid changing diet immediately before the trip.', dogFoodQty(ctx.days), true),
    item('Dog Gear', 'Dog water', 'Carry dedicated water; increase substantially for heat and dry country.', dogWaterQty(ctx), true),
    item('Dog Gear', 'Collar + ID', 'Include current contact information.', '1', true),
    item('Dog Gear', 'Tracking / GPS collar + charger', 'Charge fully and download maps/updates before departure.', '1', true),
    item('Dog Gear', 'Lead / check cord', '', '1–2'),
    item('Dog Gear', 'Dog first-aid kit', 'Include paw care, wound supplies, tick tools, vet wrap, and medications prescribed for the dog.', '1 kit', true),
    item('Dog Gear', 'Paw protection / boot plan', 'Especially for rock, cactus, ice, sand burrs, or long abrasive days.', '1 set'),
    item('Dog Gear', 'Towel / dog blanket', '', '1–2'),
    item('Dog Gear', 'Food/water bowls', 'Collapsible bowls are easy to keep in the vest or vehicle.', '2'),
    item('Dog Gear', 'Waste bags', '', 'Several')
  ];

  const processingItems = () => [
    item('Game Care', 'Cooler capacity', 'Pre-chill when possible; separate food and game when practical.', 'Sized to quarry', true),
    item('Game Care', 'Ice / frozen jugs', 'Plan replenishment for multi-day trips and hot weather.', 'Trip supply', true),
    item('Game Care', 'Sharp knife + backup blade / sharpener', '', '1 set', true),
    item('Game Care', 'Nitrile gloves', '', 'Several pairs'),
    item('Game Care', 'Game bags / food-safe bags', 'Use breathable bags for warm meat until fully cooled.', 'As needed'),
    item('Game Care', 'Paper towels / cleanup supplies', '', '1 roll / kit')
  ];

  function item(category, name, note = '', qty = '', critical = false) {
    const id = slug(`${category}-${name}`);
    return { id, category, name, note, qty, critical, custom: false };
  }

  function slug(s) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 90);
  }

  function qtyByDays(days, one, two, threePlus) {
    if (days <= 1) return String(one);
    if (days <= 3) return String(two);
    return String(threePlus);
  }

  function ammoQty(ctx, gameOverride = '') {
    const games = selectedGamesFor(ctx);
    const game = gameOverride || (games.length === 1 ? games[0] : '');
    if (!game && games.length > 1) return 'Species-specific supply + reserve';
    if (game === 'upland') return ctx.days <= 1 ? '2–4 boxes' : `${Math.max(4, ctx.days * 2)}+ boxes`;
    if (game === 'waterfowl') return ctx.days <= 1 ? '2–4 boxes' : `${Math.max(4, ctx.days * 2)}+ boxes`;
    if (game === 'dove') return ctx.days <= 1 ? '4–6 boxes' : `${Math.max(6, ctx.days * 3)}+ boxes`;
    return ctx.days <= 2 ? 'Hunt supply + zero/check rounds' : 'Hunt supply + reserve';
  }

  function safeHunterCount(ctx) {
    const n = Number(ctx?.hunters);
    if (!Number.isFinite(n)) return 1;
    return Math.min(20, Math.max(1, Math.round(n)));
  }

  function hunterDays(ctx) {
    return safeHunterCount(ctx) * Math.max(1, Number(ctx.days) || 1);
  }

  function formatGallons(n) {
    return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, '');
  }

  function waterRate(ctx) {
    const hot = Boolean(weatherContext?.hot);
    const remote = ctx.tripStyle === 'backcountry' || /desert|wma|national forest|public land|backcountry|remote/i.test(ctx.location);
    if (hot) return [1, 1.5];
    if (/desert|big bend|west texas|new mexico|arizona|nevada|utah/i.test(ctx.location)) return [1, 1.25];
    if (remote) return [0.75, 1];
    return [0.5, 1];
  }

  function waterQty(ctx) {
    const hunters = safeHunterCount(ctx);
    const [lowRate, highRate] = waterRate(ctx);
    const low = lowRate * hunters * ctx.days;
    const high = highRate * hunters * ctx.days;
    return `${formatGallons(low)}–${formatGallons(high)} gal total + reserve`;
  }

  function waterCapacityQty(ctx) {
    const hunters = safeHunterCount(ctx);
    const [, highRate] = waterRate(ctx);
    const high = highRate * hunters * ctx.days;
    return `${formatGallons(high)}+ gal capacity or verified resupply`;
  }

  function waterNote(ctx) {
    const hunters = safeHunterCount(ctx);
    const [lowRate, highRate] = waterRate(ctx);
    return `Planning baseline: ${lowRate}–${highRate} gal per hunter per day × ${hunters} hunter${hunters === 1 ? '' : 's'} × ${ctx.days} day${ctx.days === 1 ? '' : 's'}. Increase for heat, exertion, dry conditions, delays, and limited refill access.`;
  }

  function foodProvisioningItems(ctx) {
    const hunters = safeHunterCount(ctx);
    const hd = hunterDays(ctx);
    const nights = Math.max(0, ctx.days - 1);
    const hot = Boolean(weatherContext?.hot);
    const remote = ctx.tripStyle === 'backcountry' || /desert|wma|national forest|public land|backcountry|remote/i.test(ctx.location);
    const snackPortions = hd * 3;
    const electrolyteServings = hd * (hot ? 2 : 1);
    const items = [
      item(FOOD_CATEGORY, 'Drinking water', waterNote(ctx), waterQty(ctx), true),
      item(FOOD_CATEGORY, 'Water containers / refill plan', 'Carry enough container capacity for the planned supply and reserve; do not assume a listed water source is usable without verification.', waterCapacityQty(ctx), true),
      item(FOOD_CATEGORY, 'Electrolytes', hot ? 'Plan roughly two servings per hunter-day during sustained heat or heavy sweating; use with adequate water.' : 'A simple planning baseline of one serving per hunter-day; pack more for heat or unusually hard exertion.', `${electrolyteServings} servings`),
      item(FOOD_CATEGORY, 'Field snacks', 'Pack compact calories that are easy to eat one-handed or with cold/dirty hands. A mix of salty, carbohydrate, and protein options works well.', `${snackPortions} portions (3/hunter-day)`, true)
    ];

    if (ctx.tripStyle === 'day') {
      items.push(item(FOOD_CATEGORY, 'Field meals / lunches', 'One substantial hunt-day meal per hunter, plus whatever is needed before or after the hunt.', `${hd} meal serving${hd === 1 ? '' : 's'}`, true));
    } else if (ctx.tripStyle === 'lodge') {
      items.push(item(FOOD_CATEGORY, 'Field lunches / hunt-day meals', 'Pack one field meal per hunter-day. Confirm which breakfasts and dinners are actually provided by the lodge/cabin before shopping.', `${hd} field meal serving${hd === 1 ? '' : 's'}`, true));
      items.push(item(FOOD_CATEGORY, 'Breakfast / dinner backup', 'Keep an easy backup in case restaurants, lodge meals, or travel timing do not work out.', `${hunters}–${hunters * 2} shared backup serving${hunters * 2 === 1 ? '' : 's'}`));
    } else {
      items.push(item(FOOD_CATEGORY, 'Main meals / meal components', 'Planning baseline is breakfast, field lunch, and dinner for each hunter-day. Subtract meals you know will be eaten en route or elsewhere.', `${hd * 3} meal servings (${hd} hunter-day${hd === 1 ? '' : 's'})`, true));
    }

    items.push(item(FOOD_CATEGORY, 'Emergency food reserve', remote ? 'For remote trips, keep at least one extra person-day of shelf-stable food for the whole party.' : 'Carry a modest shelf-stable reserve for delays, weather, or a longer-than-planned hunt.', `${hunters} person-day${hunters === 1 ? '' : 's'} reserve`, true));
    items.push(item(FOOD_CATEGORY, 'Coffee / hot drinks (optional)', 'Include sugar/creamer if wanted and account for stove fuel or hot-water access.', `${hd}–${hd * 2} servings`));

    if (nights > 0) {
      const maxBeer = hunters * nights * 2;
      items.push(item(FOOD_CATEGORY, 'Beer / nonalcoholic camp drinks (optional)', 'Post-hunt only. Alcohol is for legal-age adults after firearms/bows are secured and when nobody will drive, boat, handle weapons, or perform safety-critical tasks. Reduce the quantity for non-drinkers or underage hunters.', `Up to ${maxBeer} total if all hunters are legal-age adults (2 × hunters × ${nights} evening${nights === 1 ? '' : 's'})`));
    } else {
      items.push(item(FOOD_CATEGORY, 'Beer / nonalcoholic post-hunt drinks (optional)', 'A day-trip pack generally does not need alcohol. If included, keep it post-hunt only, for legal-age adults, after firearms/bows are secured and with no driving or other safety-critical activity afterward.', 'Optional'));
    }

    if (ctx.tripStyle !== 'backcountry') {
      const cooler = hd <= 2 ? '1 small/medium shared cooler' : hd <= 8 ? '1 medium/large shared cooler' : '1–2 large shared coolers';
      items.push(item(FOOD_CATEGORY, 'Food / drink cooler + ice', 'Keep food and drinks separate from warm harvested game when practical. Pre-chill and plan ice replenishment for multi-day or hot-weather trips.', cooler));
    }

    return items;
  }

  function dogWaterQty(ctx) {
    const hot = weatherContext?.hot;
    return hot ? `At least 1 gal/day × ${ctx.days}, plus reserve` : `Dedicated daily supply × ${ctx.days}, plus reserve`;
  }

  function dogFoodQty(days) {
    return `${days} day${days === 1 ? '' : 's'} + 1 day reserve`;
  }

  function weatherItems(ctx, wx) {
    const items = [];
    if (!wx) return items;
    if (wx.rainy) {
      items.push(item('Clothing', 'Rain shell', 'Waterproof/breathable layer sized to fit over insulation.', '1', true));
      items.push(item('Clothing', 'Pack cover / waterproof liner', 'Keep critical gear and dry layers protected.', '1'));
      items.push(item('Miscellaneous', 'Dry bags / waterproof pouches', 'Protect electronics, documents, and fire-starting materials.', 'Several'));
    }
    if (wx.cold) {
      items.push(item('Clothing', 'Insulating midlayer', 'Fleece, synthetic, or wool layer.', '1–2', true));
      items.push(item('Clothing', 'Warm hat + gloves', '', '1 set'));
      items.push(item('Clothing', 'Dry backup layer', 'Keep one warm layer protected from moisture.', '1'));
    }
    if (wx.veryCold) {
      items.push(item('Clothing', 'Heavy insulation', 'Add a puffy/parka appropriate to forecast lows and stationary time.', '1', true));
      items.push(item('Safety & Navigation', 'Cold-weather emergency insulation', 'Emergency bivy/blanket and chemical warmers where useful.', '1 set'));
    }
    if (wx.hot) {
      items.push(item('Clothing', 'Sun hoodie / lightweight long sleeve', 'Useful for extended sun and brush exposure.', '1'));
    }
    if (wx.windy) {
      items.push(item('Clothing', 'Wind-resistant outer layer', 'Useful for exposed ridges, boats, blinds, and glassing.', '1'));
      if (ctx.tripStyle === 'vehicle' || ctx.tripStyle === 'backcountry') {
        items.push(item('Camp & Sleep', 'Extra shelter stakes / guylines', 'Reinforce shelter for forecast wind.', '1 set'));
      }
    }
    if (wx.highElevation) {
      items.push(item('Safety & Navigation', 'Altitude / exposure contingency', 'Plan slower pacing, more hydration, and rapid weather changes.', 'Plan'));
    }
    return items;
  }

  function locationItems(ctx, geo) {
    const s = ctx.location.toLowerCase();
    const items = [];
    if (/desert|big bend|west texas|new mexico|arizona|nevada|utah/.test(s)) {
      items.push(item('Safety & Navigation', 'Sun / heat exposure backup', 'Shade plan, extra water, and conservative travel margins for dry country.', '1 plan', true));
      items.push(item('Vehicle', 'Extra water reserve', 'Carry enough for vehicle delays, not just the planned hunt.', 'Several gallons', true));
      items.push(item('Miscellaneous', 'Cactus / thorn tools', 'Tweezers, small pliers, comb, or hemostat for spines and burrs.', '1 small kit'));
    }
    if (/coast|coastal|marsh|gulf|rockport|galveston|freeport|bay|wetland/.test(s)) {
      items.push(item('Miscellaneous', 'Corrosion-control kit', 'Fresh-water wipe/rinse plan and light protectant for salt exposure.', '1 kit'));
      items.push(item('Miscellaneous', 'Mosquito protection', 'Repellent and optional head net for warm coastal conditions.', '1 set'));
    }
    if (/mountain|alpine|rocky|colorado|wyoming|montana|idaho/.test(s) || (geo && geo.elevation > 1200)) {
      items.push(item('Clothing', 'Rapid-weather-change layer', 'Mountain conditions can change quickly even when valley forecasts look mild.', '1', true));
      items.push(item('Safety & Navigation', 'Topographic offline map', 'Include elevation, bailout routes, and water sources.', '1 set', true));
    }
    if (/public land|wma|national forest|blm|national grassland/.test(s)) {
      items.push(item('Documents & Legal', 'Public-land rules / access notes', 'Save current unit-specific rules, road status, closures, and boundary maps.', '1 set', true));
    }
    return items;
  }

  function buildList(ctx, geo, wx) {
    let items = [
      ...baseItems(ctx),
      ...selectedGamesFor(ctx).flatMap(game => gameItems[game] ? gameItems[game](ctx) : []),
      ...(styleItems[ctx.tripStyle] ? styleItems[ctx.tripStyle](ctx) : []),
      ...(ctx.withDog ? dogItems(ctx) : []),
      ...(ctx.processing ? processingItems(ctx) : []),
      ...locationItems(ctx, geo),
      ...weatherItems(ctx, wx)
    ];

    items = dedupe(items);
    if (state.customItems?.length) items.push(...state.customItems);
    return items;
  }

  function dedupe(items) {
    const seen = new Map();
    for (const it of items) {
      if (!seen.has(it.id)) {
        seen.set(it.id, { ...it });
        continue;
      }
      const old = seen.get(it.id);
      if (it.note && it.note !== old.note) {
        old.note = [old.note, it.note].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(' ');
      }
      if (it.qty && it.qty !== old.qty) {
        old.qty = [old.qty, it.qty].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(' / ');
      }
      old.critical = old.critical || it.critical;
    }
    return [...seen.values()];
  }

  function selectedGamesFor(ctx) {
    if (Array.isArray(ctx?.games) && ctx.games.length) return [...new Set(ctx.games)].filter(game => GAME_LABELS[game]);
    if (ctx?.game && GAME_LABELS[ctx.game]) return [ctx.game];
    return [];
  }

  function getSelectedGames() {
    return gameInputs().filter(input => input.checked).map(input => input.value);
  }

  function setSelectedGames(games) {
    const selected = new Set(Array.isArray(games) ? games : []);
    gameInputs().forEach(input => {
      input.checked = selected.has(input.value);
      input.closest('.game-choice')?.classList.toggle('selected', input.checked);
    });
  }

  function parseDateOnly(v) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
    const [y, m, d] = v.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  }

  function daysInclusive(a, b) {
    return Math.floor((b - a) / 86400000) + 1;
  }

  function formatDate(v) {
    const d = parseDateOnly(v);
    if (!d) return v;
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(d);
  }

  function validateForm() {
    formError.hidden = true;
    const s = parseDateOnly(startDate.value);
    const e = parseDateOnly(endDate.value);
    if (!s || !e) return showError('Choose both a start date and an end date.');
    if (e < s) return showError('End date must be on or after the start date.');
    const days = daysInclusive(s, e);
    if (days > 60) return showError('For a useful packing list, keep a single trip to 60 days or less.');
    if (!locationInput.value.trim()) return showError('Enter a hunt location.');
    const hunters = Number(hunterCountInput.value);
    if (!Number.isInteger(hunters) || hunters < 1 || hunters > 20) return showError('Enter a whole number of hunters from 1 to 20.');
    if (!getSelectedGames().length) return showError('Select at least one game species or hunt type.');
    return { s, e, days };
  }

  function showError(msg) {
    formError.textContent = msg;
    formError.hidden = false;
    return null;
  }

  async function generate() {
    const valid = validateForm();
    if (!valid) return;

    const ctx = {
      startDate: startDate.value,
      endDate: endDate.value,
      days: valid.days,
      location: locationInput.value.trim(),
      hunters: Number(hunterCountInput.value),
      games: getSelectedGames(),
      tripStyle: tripStyle.value,
      withDog: withDog.checked,
      processing: processing.checked,
      liveWeather: liveWeather.checked
    };

    form.querySelector('.primary-btn').disabled = true;
    form.querySelector('.primary-btn span:first-child').textContent = ctx.liveWeather ? 'Checking conditions…' : 'Building list…';

    let geo = null;
    let wx = null;
    if (ctx.liveWeather) {
      try {
        geo = await geocode(ctx.location);
        if (geo) wx = await getForecast(geo, ctx.startDate, ctx.endDate);
      } catch (err) {
        console.warn('Weather lookup failed:', err);
      }
    }
    weatherContext = wx;

    const signature = tripSignature(ctx);
    if (state.tripSignature !== signature) {
      state.checked = {};
      state.tripSignature = signature;
    }
    state.trip = ctx;
    state.geo = geo;
    state.weather = wx;
    state.items = buildList(ctx, geo, wx);
    saveState();

    renderResults();
    form.querySelector('.primary-btn').disabled = false;
    form.querySelector('.primary-btn span:first-child').textContent = 'Generate packing list';
    resultSection.hidden = false;
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function geocode(name) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Geocoding failed');
    const data = await res.json();
    const r = data.results?.[0];
    if (!r) return null;
    return {
      name: r.name,
      admin1: r.admin1 || '',
      country: r.country || '',
      latitude: r.latitude,
      longitude: r.longitude,
      elevation: Number(r.elevation || 0)
    };
  }

  async function getForecast(geo, tripStart, tripEnd) {
    const params = new URLSearchParams({
      latitude: geo.latitude,
      longitude: geo.longitude,
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max',
      temperature_unit: 'fahrenheit',
      wind_speed_unit: 'mph',
      timezone: 'auto',
      forecast_days: '16'
    });
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
    if (!res.ok) throw new Error('Forecast failed');
    const data = await res.json();
    const daily = data.daily;
    if (!daily?.time?.length) return null;

    const indexes = daily.time.map((d, i) => ({ d, i })).filter(x => x.d >= tripStart && x.d <= tripEnd).map(x => x.i);
    if (!indexes.length) return { available: false, highElevation: geo.elevation > 1200 };

    const vals = (key) => indexes.map(i => Number(daily[key][i])).filter(Number.isFinite);
    const highs = vals('temperature_2m_max');
    const lows = vals('temperature_2m_min');
    const rain = vals('precipitation_probability_max');
    const wind = vals('wind_speed_10m_max');
    const max = arr => arr.length ? Math.max(...arr) : null;
    const min = arr => arr.length ? Math.min(...arr) : null;

    const maxTemp = max(highs);
    const minTemp = min(lows);
    const rainChance = max(rain);
    const maxWind = max(wind);
    return {
      available: true,
      maxTemp, minTemp, rainChance, maxWind,
      hot: maxTemp !== null && maxTemp >= 85,
      cold: minTemp !== null && minTemp <= 40,
      veryCold: minTemp !== null && minTemp <= 25,
      rainy: rainChance !== null && rainChance >= 40,
      windy: maxWind !== null && maxWind >= 20,
      highElevation: geo.elevation > 1200
    };
  }

  function tripSignature(ctx) {
    return [ctx.startDate, ctx.endDate, ctx.location.toLowerCase(), safeHunterCount(ctx), ...selectedGamesFor(ctx).slice().sort(), ctx.tripStyle, ctx.withDog, ctx.processing].join('|');
  }

  function renderResults() {
    const ctx = state.trip;
    if (!ctx || !state.items) return;
    const games = selectedGamesFor(ctx);
    const gameNames = games.map(game => GAME_LABELS[game]);
    const huntTitle = gameNames.length <= 3 ? gameNames.join(' + ') : `${gameNames.length} game types`;
    el('summaryTitle').textContent = `${huntTitle || 'Hunt'} — ${ctx.location}`;
    el('summaryChips').innerHTML = [
      `${formatDate(ctx.startDate)} – ${formatDate(ctx.endDate)}`,
      `${ctx.days} day${ctx.days === 1 ? '' : 's'}`,
      `${safeHunterCount(ctx)} hunter${safeHunterCount(ctx) === 1 ? '' : 's'}`,
      STYLE_LABELS[ctx.tripStyle],
      ...gameNames,
      ctx.withDog ? 'Dog hunt' : null
    ].filter(Boolean).map(x => `<span class="chip">${escapeHtml(x)}</span>`).join('');

    renderWeather();
    renderCritical();
    renderChecklist();
    updateProgress();
  }

  function renderWeather() {
    const wx = state.weather;
    const geo = state.geo;
    const note = el('weatherNote');
    if (!state.trip.liveWeather) {
      note.innerHTML = 'Live weather is turned off. The list is based on hunt type, trip style, duration, and location keywords.';
      return;
    }
    if (!geo) {
      note.innerHTML = 'Could not match the location for live weather. The packing list still uses the trip details you entered.';
      return;
    }
    const place = [geo.name, geo.admin1].filter(Boolean).join(', ');
    if (!wx?.available) {
      note.innerHTML = `<strong>${escapeHtml(place)}:</strong> live forecast is not available for those dates yet. The list will still adapt to location and season-independent hunt needs.`;
      return;
    }
    const parts = [];
    if (wx.minTemp !== null && wx.maxTemp !== null) parts.push(`${Math.round(wx.minTemp)}–${Math.round(wx.maxTemp)}°F`);
    if (wx.rainChance !== null) parts.push(`up to ${Math.round(wx.rainChance)}% precip.`);
    if (wx.maxWind !== null) parts.push(`winds up to ${Math.round(wx.maxWind)} mph`);
    note.innerHTML = `<strong>${escapeHtml(place)} forecast:</strong> ${parts.join(' · ')}. Weather-sensitive gear has been added automatically.`;
  }

  function renderCritical() {
    const remaining = state.items.filter(it => it.critical && !state.checked[it.id]);
    const callout = el('criticalCallout');
    if (!remaining.length) {
      callout.hidden = true;
      return;
    }
    callout.hidden = false;
    el('criticalText').textContent = `${remaining.length} critical item${remaining.length === 1 ? '' : 's'} still unchecked.`;
  }

  function renderChecklist() {
    const grouped = groupByCategory(state.items || []);
    checklistEl.innerHTML = '';
    let visibleAny = false;

    for (const [category, items] of grouped) {
      const filtered = items.filter(it => {
        const checked = Boolean(state.checked[it.id]);
        if (activeFilter === 'packed') return checked;
        if (activeFilter === 'unpacked') return !checked;
        return true;
      });
      if (!filtered.length) continue;
      visibleAny = true;

      const card = document.createElement('section');
      card.className = 'category-card';
      card.dataset.category = category;

      const header = document.createElement('button');
      header.type = 'button';
      header.className = 'category-header';
      header.innerHTML = `<span class="category-title"><strong>${escapeHtml(category)}</strong></span><span class="category-count">${filtered.length} item${filtered.length === 1 ? '' : 's'} <span class="chevron">⌄</span></span>`;
      header.addEventListener('click', () => card.classList.toggle('collapsed'));
      card.appendChild(header);

      const body = document.createElement('div');
      body.className = 'category-items';
      for (const it of filtered) body.appendChild(renderItemRow(it));
      card.appendChild(body);
      checklistEl.appendChild(card);
    }

    if (!visibleAny) {
      checklistEl.innerHTML = `<div class="empty-state">No items match this filter.</div>`;
    }
  }

  function renderItemRow(it) {
    const row = document.createElement('label');
    row.className = `check-row${state.checked[it.id] ? ' packed' : ''}`;
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = Boolean(state.checked[it.id]);
    cb.addEventListener('change', () => {
      state.checked[it.id] = cb.checked;
      saveState();
      renderCritical();
      updateProgress();
      if (activeFilter !== 'all') renderChecklist();
      else row.classList.toggle('packed', cb.checked);
    });

    const main = document.createElement('div');
    main.className = 'item-main';
    main.innerHTML = `<div class="item-name">${escapeHtml(it.name)}${it.critical ? '<span class="critical-badge">CRITICAL</span>' : ''}</div>${it.note ? `<div class="item-note">${escapeHtml(it.note)}</div>` : ''}`;

    const qty = document.createElement('div');
    qty.className = 'item-qty';
    qty.textContent = it.qty || '';

    row.append(cb, main, qty);
    return row;
  }

  function groupByCategory(items) {
    const order = ['Documents & Legal','Hunting Gear','Safety & Navigation','Clothing',FOOD_CATEGORY,'Camp & Sleep','Vehicle','Game Care','Dog Gear','Miscellaneous'];
    const map = new Map();
    for (const cat of order) map.set(cat, []);
    for (const it of items) {
      if (!map.has(it.category)) map.set(it.category, []);
      map.get(it.category).push(it);
    }
    return [...map.entries()].filter(([, items]) => items.length);
  }

  function updateProgress() {
    const items = state.items || [];
    const total = items.length;
    const packed = items.filter(it => state.checked[it.id]).length;
    const pct = total ? Math.round((packed / total) * 100) : 0;
    el('progressText').textContent = `${packed} of ${total} packed`;
    el('progressPct').textContent = `${pct}%`;
    el('progressBar').style.width = `${pct}%`;
  }

  function updateDuration() {
    const s = parseDateOnly(startDate.value);
    const e = parseDateOnly(endDate.value);
    if (!s || !e || e < s) {
      durationLine.textContent = 'Choose dates to calculate trip duration.';
      return;
    }
    const days = daysInclusive(s, e);
    durationLine.textContent = `${days} calendar day${days === 1 ? '' : 's'} · ${Math.max(0, days - 1)} night${days - 1 === 1 ? '' : 's'}`;
  }

  function escapeHtml(v) {
    return String(v).replace(/[&<>'"]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[ch]));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      const migrateItem = (it) => it && it.category === 'Food & Water' ? { ...it, category: FOOD_CATEGORY } : it;
      const trip = parsed.trip ? { ...parsed.trip, hunters: safeHunterCount(parsed.trip) } : null;
      return {
        trip,
        geo: parsed.geo || null,
        weather: parsed.weather || null,
        items: Array.isArray(parsed.items) ? parsed.items.map(migrateItem) : [],
        checked: parsed.checked || {},
        customItems: Array.isArray(parsed.customItems) ? parsed.customItems.map(migrateItem) : [],
        tripSignature: parsed.tripSignature || ''
      };
    } catch {
      return { trip: null, geo: null, weather: null, items: [], checked: {}, customItems: [], tripSignature: '' };
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function restoreForm() {
    if (!state.trip) return;
    const t = state.trip;
    startDate.value = t.startDate || '';
    endDate.value = t.endDate || '';
    locationInput.value = t.location || '';
    hunterCountInput.value = String(safeHunterCount(t));
    setSelectedGames(selectedGamesFor(t));
    tripStyle.value = t.tripStyle || 'vehicle';
    withDog.checked = Boolean(t.withDog);
    processing.checked = t.processing !== false;
    liveWeather.checked = t.liveWeather !== false;
    updateDuration();
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); generate(); });
  startDate.addEventListener('change', updateDuration);
  endDate.addEventListener('change', updateDuration);
  gameInputs().forEach(input => {
    input.addEventListener('change', () => {
      input.closest('.game-choice')?.classList.toggle('selected', input.checked);
      formError.hidden = true;
    });
  });

  el('editTripBtn').addEventListener('click', () => {
    document.querySelector('.planner-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    locationInput.focus({ preventScroll: true });
  });

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.filter;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b === btn));
      renderChecklist();
    });
  });

  el('resetChecksBtn').addEventListener('click', () => {
    if (!confirm('Clear all checkmarks for this trip?')) return;
    state.checked = {};
    saveState();
    renderResults();
  });

  el('printBtn').addEventListener('click', () => window.print());
  el('addItemBtn').addEventListener('click', () => {
    el('customItemName').value = '';
    customDialog.showModal();
    setTimeout(() => el('customItemName').focus(), 0);
  });
  el('closeCustomBtn').addEventListener('click', () => customDialog.close());

  el('customItemForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = el('customItemName').value.trim();
    if (!name) return;
    const category = el('customItemCategory').value;
    const custom = {
      id: `custom-${Date.now()}-${slug(name)}`,
      category,
      name,
      note: 'Custom item',
      qty: '',
      critical: false,
      custom: true
    };
    state.customItems.push(custom);
    state.items.push(custom);
    saveState();
    customDialog.close();
    renderResults();
  });

  el('aboutBtn').addEventListener('click', () => aboutDialog.showModal());
  el('closeAboutBtn').addEventListener('click', () => aboutDialog.close());

  restoreForm();
  if (state.trip && state.items?.length) {
    weatherContext = state.weather;
    resultSection.hidden = false;
    renderResults();
  } else {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    startDate.value = local;
    endDate.value = local;
    updateDuration();
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('service-worker.js').catch(() => {}));
  }
})();
