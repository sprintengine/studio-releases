# Sprint Engine Studio releases

The public half of Sprint Engine Studio. What lives here, and nothing else:

- **Releases**: installers and `latest*.yml`, which the app's updater reads.
- **`model-feed.json`**: the models each agent CLI can be told to use. Every
  running studio fetches it once an hour; the website renders it.
- **The catalogue** — what the Plugins door offers as the *Multicode* source:
  - `marketplace.json`: the index. First-party bundles, automation starters,
    the bundled agent CLIs, and Claude Code plugin entries that point at their
    upstream repository at a pinned commit with per-file digests.
  - `plugins/<id>/`, `icons/`, `trusted-publishers.json`: the first-party
    signed bundles and automation starters the index references.
  - `skills/<id>/`: the skills the studio ships as its own.
  - `mcps/catalog.json`: the launchable MCP server catalogue.

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

## Adding, updating or removing a plugin

Every running studio fetches `marketplace.json` once an hour with an ETag, so
an edit here reaches every machine without an app release. Studios that
installed a plugin from it are told an update is available on the next fetch.

- **A Claude Code plugin from GitHub** — add an entry with `provides:
  ["skills"]`, a `source` URL of the form
  `https://github.com/<owner>/<repo>/tree/<commit>/<path>`, and its `skills[]`
  with per-file `sha256` digests. The studio's `npm run catalogue:generate`
  produces these entries from the HotStack catalogue snapshot; hand-written
  entries are fine too.
- **An MCP server** — an inline entry (`mcp.servers[]`, `provides: ["mcp"]`)
  or a signed bundle under `plugins/<id>/`.
- **A skill of our own** — a directory under `skills/<id>/` with a `SKILL.md`
  whose frontmatter names it and carries a `version`.
- **Remove** — delete the entry (and its bundle directory). Installed copies
  are not taken away from anyone; they stop being offered.

Rules the verifier enforces on every pull request:

- an entry's `source` is HTTPS on `github.com` / `raw.githubusercontent.com`;
- a bundle carrying a `module` or `cli` component is signed by a key in
  `trusted-publishers.json`; an unsigned entry may not set
  `publisher.verified`;
- component file digests match the committed bytes.

The studio bundles a snapshot of this catalogue as its offline seed
(`npm run sync:catalogue` in the app repo, run before a release), the same way
it bundles `model-feed.json`.
