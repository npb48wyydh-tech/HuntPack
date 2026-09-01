# Hunting Packing List

An iPhone-friendly Progressive Web App that generates a checkable hunting-trip packing list from:

- Start and end dates / duration
- Hunt location
- Number of hunters in the party
- One or more game species / hunt types
- Trip style
- Whether a dog is hunting with you
- Whether you plan to process/transport game
- Live weather when the trip falls inside the available forecast window

## Features

- Party-size-aware Food / Snacks / Beer / Water provisioning with calculated total water, meal servings, snack portions, electrolytes, emergency food, and optional post-hunt drinks
- Multi-species hunt support with game-specific packing logic for upland birds, waterfowl, dove, deer, turkey, hogs, western big game, small game, and predator hunts
- Smart merging of shared gear so mixed-species lists avoid duplicate coolers, knives, navigation gear, and other overlapping items
- Conditional hot/cold/rain/wind gear from Open-Meteo when a forecast is available
- Location-aware additions for desert, coastal, mountain, public-land, and remote trips
- Vehicle-camp, lodge, day-trip, and backcountry packing modes
- Optional dog gear and game-processing sections
- Checkable list with progress tracking and packed/unpacked filters
- Custom items
- Print-friendly checklist
- Trip/checkmark persistence in browser storage
- Installable as an iPhone Home Screen app
- Core app works offline after the first load; live weather naturally requires internet access

## Developer

Thomas Hopkins

Packing logic developed with OpenAI assistance. Weather data is provided by Open-Meteo.

## Put it on GitHub Pages

1. Create a new GitHub repository, for example `hunting-packing-list`.
2. Upload everything in this folder to the repository root, preserving the `icons` folder.
3. In GitHub, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select **main** and **/(root)**, then save.
6. Open the GitHub Pages URL in Safari on your iPhone.
7. Tap **Share → Add to Home Screen**.

## Notes

Water and food quantities are planning baselines, not medical or survival guarantees; increase reserves for heat, exertion, remoteness, delays, and limited resupply. Optional alcohol is explicitly post-hunt only, for legal-age adults, after weapons are secured and when nobody will drive or perform safety-critical tasks.

The app intentionally does not make legal determinations. Always verify current hunting regulations, season dates, access rules, legal methods, tagging, ammunition restrictions, and closures with the responsible agencies.
