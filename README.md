# Sprint Engine Studio releases

The public half of Sprint Engine Studio. What lives here, and nothing else:

- **Releases**: installers and `latest*.yml`, which the app's updater reads.
- **`model-feed.json`**: the models each agent CLI can be told to use. Every
  running studio fetches it once an hour; the website renders it.
- **The Claude marketplace** — this repository IS one, so any harness that
  speaks the format can add it, and the studio's own catalogues read it as the
  *SprintEngine Studio* source:
  - `.claude-plugin/marketplace.json`: the listing. `sprintengine-studio` is
    always first; it is the plugin the studio installs into every workspace it
    opens, and the row every catalogue shows at the top.
  - `sprintengine-studio/`: that plugin — the stdio bridge to a running studio
    (`.mcp.json`), its hooks, and one skill per area.
  - `studio-skills/`: the workflow skills the studio ships — backlog, debug,
    prototype, review guide, handoff and the rest — as a plugin of their own,
    so each stays installable on its own from the Skills catalogue.
  - `brave-search/`, `kubernetes/`, `snyk/`: MCP servers the studio ships,
    each packaged as a plugin — the server's `.mcp.json` plus the skill that
    teaches it. A server with no skill is not listed here, because an agent
    left to learn a server from its tool descriptions is what these exist to
    stop, and a wrong manual is worse than none. Servers Anthropic's own
    marketplace already carries are not duplicated here; that tab is their
    home.
- **The signed index** — what a Claude marketplace cannot carry, because the
  studio refuses code-bearing components from any GitHub source unless they are
  signed:
  - `marketplace.json`: the agent CLIs, the automation starters and the signed
    first-party modules.
  - `plugins/<id>/`, `icons/`, `trusted-publishers.json`: the bundles that
    index references, and the keys their signatures are checked against.
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
