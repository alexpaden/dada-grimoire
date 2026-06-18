# Running Grimoire locally — 0 to 1

You do **not** need this to play. In class you attack the instance the instructor
announces on the TV. This guide is for when you want your **own** copy on your
laptop — to practice, to poke at the source while it runs, or to keep going after
class.

Your local copy gets its **own freshly-generated flags**. They will not match
anyone else's instance, and they are not the class flags. That's expected.

---

## 1. Install the tools (macOS / Homebrew)

Don't have Homebrew? Install it first: https://brew.sh

**An AI coding agent — pick at least one.** This CTF is meant to be played with one.
```bash
brew install --cask cursor           # Cursor — free Hobby tier, no subscription needed
brew install --cask claude-code      # Claude Code (needs a Claude subscription)
brew install codex                   # OpenAI Codex CLI (needs an OpenAI login)
```

**To run the app locally** (this is the only required toolchain for *running* it):
```bash
brew install --cask docker-desktop   # Docker + Compose. Older guides use the `docker` cask.
brew install git                     # to clone the source
xcode-select --install               # gives you `make` (skip if you already have it)
```

**To actually exploit it** (handy whether you self-host or attack the class box):
```bash
brew install --cask google-chrome    # a real Chromium browser + devtools
brew install python                  # python3 — request scripting, token crafting
brew install nmap                    # optional: network/port recon
# curl already ships with macOS
```

Some challenges need a Python helper library; install it in a throwaway virtualenv
when you get there:
```bash
python3 -m venv ~/grimoire-venv && source ~/grimoire-venv/bin/activate
pip install django requests
```

---

## 2. Get the source

```bash
git clone https://github.com/alexpaden/dada-grimoire
cd dada-grimoire
```

It's fully white-box — you have all the code. Reading it is part of the game.

---

## 3. Start Docker Desktop

Launch **Docker Desktop** from Applications (or `open -a Docker`) and wait until
its menu-bar whale stops animating. The `make` steps below talk to it; if Docker
isn't running they'll fail with a "cannot connect to the Docker daemon" error.

---

## 4. Generate secrets and bring it up

```bash
make gen-flags     # writes a fresh .env (new flags + secrets, autodetects your IP)
make up            # build the images and start all containers (first run is slow)
```

`make up` builds four containers (frontend, backend, postgres, a render worker)
and seeds the database. The first build pulls base images and can take a few
minutes; later starts are fast.

Prefer no surprises? Instead of `make gen-flags` you can just `cp .env.example .env`
— that pins everything to `127.0.0.1` with default ports and predictable values.

---

## 5. Open it

```bash
open http://127.0.0.1:3000        # the app
```

| What | URL |
|---|---|
| The app (frontend) | http://127.0.0.1:3000 |
| Backend API | http://127.0.0.1:8000 |
| Submit a flag | http://127.0.0.1:3000/submit |
| Shared TV / leaderboard | http://127.0.0.1:3000/tv |

Your operator identity is minted automatically the first time you load the app —
no signup. Change your handle under **Settings**.

> Ports come from `.env` (`FRONTEND_PORT` / `BACKEND_PORT`). Defaults are 3000/8000;
> if something else on your machine already uses those, edit `.env` and `make rebuild`.

---

## 6. Play against your local copy

Same as the class instance, just pointed at `127.0.0.1`. Find a bug, exploit the
running service, submit what you capture:

```bash
curl -s -X POST http://127.0.0.1:8000/api/submit/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_grimoire_token>" \
  -d '{"flag":"flag{...}"}'
```

Grab `<your_grimoire_token>` from `localStorage.grimoire_token` in your browser's
devtools (Application → Local Storage). Every flag looks like `flag{...}`.

See the full challenge board and rules in **README.md**.

---

## Useful commands

```bash
make help        # list every target
make logs        # tail all container logs
make status      # what's running
make reset       # wipe the feed + reseed, keep flags and your solves
make down        # stop the stack
make nuke        # tear down everything including the database volume
make ip          # print your LAN IP (only needed if others connect to your box)
```

---

## Troubleshooting

- **"Cannot connect to the Docker daemon"** — Docker Desktop isn't running. Start
  it (step 3) and retry.
- **"port is already allocated" / address in use** — something else owns 3000,
  8000, or 5432. Change the matching `*_PORT` in `.env`, then `make rebuild`.
- **`make gen-flags` says `.env already exists`** — it won't clobber by accident.
  Re-run `make gen-flags --force` to rotate everything (this changes all flags).
- **The page loads but flag submission/API calls fail** — your browser is hitting
  the wrong API host. For a pure-local run keep `HOST_IP=127.0.0.1` in `.env`
  (or use `cp .env.example .env`), then `make rebuild`.
- **Edited source but nothing changed** — rebuild the image: `make rebuild`
  (a plain restart reuses the old build).
- **Stuck / weird state** — `make nuke` then `make up` for a clean slate.

---

## Want others on your wifi to connect?

`make gen-flags` already sets `HOST_IP` to your LAN IP, so other laptops can reach
you at `http://<your-ip>:3000`. Run `make ip` to print it. Only do this on a
network you trust — the app is deliberately vulnerable.
