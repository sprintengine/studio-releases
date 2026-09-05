# Sprint Engine Studio releases

The public half of Sprint Engine Studio. Two things live here and nothing else:

- **Releases**: installers and `latest*.yml`, which the app's updater reads.
- **`model-feed.json`**: the models each agent CLI can be told to use. Every
  running studio fetches it once an hour; the website renders it.

No source code is here. Release notes are written by hand.

## Adding a model

Edit `model-feed.json`, add a row under the CLI's `models`, bump `updatedAt`,
open a pull request. The check runs on the PR. Once merged, every studio has
the model within the hour and it shows on sprintengine.ai/models.

```json
{ "id": "claude-opus-5-2", "label": "Opus 5.2", "releasedAt": "2026-09-02", "retired": false }
```

- `id` is the exact string the CLI takes after `--model` (or its equivalent).
- `label` is what the picker shows.
- `releasedAt` is required: the date the model shipped. Pickers list models
  newest first by it, and it marks the row "New" for 30 days. The one
  exception is a floating alias like `opus[1m]` or `fable`: set
  `"alias": true` and leave `releasedAt` off; aliases have no date of their
  own and sit after the dated rows.
- To retire a model set `"retired": true` and a `retiredAt` date. Never delete
  a row: the feed has to be able to hide a model an older build still ships.

Run the check locally with `node scripts/check-model-feed.mjs`.
