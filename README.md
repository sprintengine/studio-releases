# Sprint Engine Studio releases

The public half of Sprint Engine Studio. What lives here, and nothing else:

- **Releases**: installers and `latest*.yml`, which the app's updater reads.
- **`model-feed.json`**: the models each agent CLI can be told to use. Every
  running studio fetches it once an hour; the website renders it.
- **`sources.json`**: the skill and plugin SOURCES the studio recommends —
  GitHub repositories in the Claude plugin marketplace format, each of which a
  person adds as a source in one click. See "The sources list" below.
- **The Claude marketplace** — this repository IS one, so any harness that
  speaks the format can add it, and the studio's own catalogues read it as the
  *SprintEngine Studio* source:
  - `.claude-plugin/marketplace.json`: the listing. It holds exactly one row.
  - `sprintengine-studio/`: that plugin — the stdio bridge to a running studio
    (`.mcp.json`), its hooks, and its skills: one per studio area
    (`studio-sprints`, `studio-backlog`, `studio-automations`,
    `studio-workspaces`, `studio-review`), plus `debug` and `review-guide`,
    which are features of the studio rather than general advice. Every one of
    them teaches an agent to drive SprintEngine Studio itself.

    These are the only skills published here, and they are the only ones that
    ever will be. The studio is not in the business of authoring skills, or of
    repackaging other people's MCP servers: it provides a place to add sources,
    and recommends some. Two retirements followed from that rule. The
    `studio-skills/` pack — twelve general-purpose workflow skills — went on
    2026-09-07; `debug` and `review-guide` were the two that belonged to the
    studio, and they live in `sprintengine-studio/skills/` now. The
    `brave-search/`, `kubernetes/` and `snyk/` plugins went on 2026-09-08,
    along with `mcps/catalog.json`, for the same reason: an MCP server someone
    else wrote is not ours to publish, and a plugin in a marketplace already
    carries its own `.mcp.json`.
- **The signed index** — what a Claude marketplace cannot carry, because the
  studio refuses code-bearing components from any GitHub source unless they are
  signed:
  - `marketplace.json`: twenty-two rows — thirteen agent CLIs, five automation
    starters and four signed first-party MCP bundles. No modules yet, despite
    what this line used to promise.
  - `plugins/<id>/`, `icons/`, `trusted-publishers.json`: the bundles that
    index references, and the keys their signatures are checked against. Each
    signed entry carries its own signature over its own bytes, so adding or
    removing a row never invalidates another. `icons/` holds a reviewable SVG
    per entry, generated in the app repo; a CLI or automation row carries the
    same mark inline as a data URI, so most of those files are read by people
    rather than by the app.

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

- **A Claude Code plugin from GitHub** — don't. The studio reads
  `anthropics/claude-plugins-official` live, at the commits that marketplace
  pins, and shows it as the Anthropic tab in every catalogue. This index held a
  frozen copy of 256 of those plugins until the frozen-snapshots retirement
  (2026-09-06) removed them; 255 of the 256 were verified present in a live
  scan of that repository first. An entry with `provides: ["skills"]` is still
  a valid shape — `source` URL of the form
  `https://github.com/<owner>/<repo>/tree/<commit>/<path>` plus `skills[]` with
  per-file `sha256` digests — and it is the right one for a skill bundle that
  has to be SIGNED, which a Claude marketplace cannot carry. It is the wrong one
  for anything a marketplace can list.
- **An MCP server** — an inline entry (`mcp.servers[]`, `provides: ["mcp"]`)
  or a signed bundle under `plugins/<id>/`.
- **A skill of our own** — only if it teaches the studio itself, and then it
  belongs in `sprintengine-studio/skills/`, not in this index. A skill that
  teaches somebody else's tool is not ours to publish; add the marketplace that
  carries it to `sources.json` instead.
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
it bundles `model-feed.json`. That script still expects `mcps/catalog.json` and
a `studio-skills/` directory, neither of which is published any more; it has to
be updated in the app repo before the next release sync.

## The sources list

`sources.json` is a curated list of places to get skills and plugins. Every row
is a GitHub repository in the Claude plugin marketplace format — a
`.claude-plugin/marketplace.json` at the root — which is a shape the studio
already reads and pins per commit. Adding a source does not install anything;
it puts that repository's plugins in the catalogue beside ours, where a person
chooses.

```json
{ "id": "claude-plugins-official", "repo": "anthropics/claude-plugins-official",
  "kind": "claude-marketplace", "description": "..." }
```

- `repo` is `owner/name` on github.com.
- `kind` is `claude-marketplace` (the repository holds
  `.claude-plugin/marketplace.json`) or `skills-repo` (a folder tree of
  `SKILL.md` files and no manifest). Every row today is the former.
- Anthropic's own sources come first. Everything after them is a community
  marketplace we would point somebody at, not something we vouch for.

**The list is capped at six**, and the cap is the point. Unauthenticated GitHub
allows 60 requests an hour per machine, and a studio without a token stops a
scan after 20 repositories; a longer list would spend a person's budget before
it reached the sources they came for. Adding a seventh means removing one.

MCP servers need no separate route here: a plugin in any of these marketplaces
brings its own `.mcp.json`, which is why `mcps/catalog.json` — a list of servers
with no plugin anywhere — was retired rather than replaced.

Run the check locally with `node scripts/check-sources.mjs`.
