# Grimoire — Defence Against the Dark Arts CTF

> *GRIMOIRE is ns.com's internal operations/signal feed. The shared screen (/tv)
> shows the live feed, the leaderboard, and high-signal operator events as they
> happen.*

Grimoire is a white-box Next.js + Django CTF app. You have the full source, but
the running instance is the source of truth. Your job is to map the system,
probe the live service, and submit the flags you capture. Solves appear on the
shared TV the moment they register, so the room sees every first blood.

---

## The theme that matters: drive your AI coding agent

Everyone in the room has Claude Code (or Codex). That's not a crutch — it's the point.

**Beginners:** Use the AI for recon. Ask it to map endpoints, inputs, data
stores, background workers, and client-side render paths. Let it turn the source
tree into a checklist. Then probe the running app.

**Experts:** Find out where it stops. Some challenge facts are only visible at
runtime: mounted profiles, generated rows, worker-local state, browser state, and
route selection. The lesson is not "read one suspicious file"; it is learning how
to make an agent gather the missing context.

Use your AI as a recon and exploitation partner. It can read the whole codebase in seconds.
So can you.

---

## Connecting

The instructor will announce a URL on the TV. Write it down.

| Service | URL |
|---|---|
| Frontend (the app) | `http://<HOST_IP>:3000` |
| Backend API | `http://<HOST_IP>:8000` |
| Submit a flag | `http://<HOST_IP>:3000/submit` |
| TV leaderboard (instructor screen) | `http://<HOST_IP>:3000/tv` |

**Warmup — find the app on the LAN.** If the URL isn't announced yet, find it yourself:

```bash
# Discover hosts on the class subnet (instructor will name the range)
nmap -sn 192.168.x.0/24

# Then scan open ports on anything you find
nmap -p 3000,8000,5432 <HOST_IP>
```

Some open ports are themselves a finding. Note everything you see.

The `/tv` page is the shared kiosk on the instructor's screen. Successful exploits show up
there for the whole room — new admins in the ADMINS panel, deface and breach banners, XSS
firing in the signal feed.

---

## How to play

1. **Read the source.** It's all here, white-box. Use `grep`, use the AI, use devtools.
2. **Pick a challenge** from the board below — no linear gate, no locked doors.
3. **Exploit it** against the running app at the announced IP.
4. **Submit the flag.** Every flag looks like `flag{...}`.
5. Watch the TV.

The feed auto-resets periodically, so stored payloads may disappear. Don't rely on
persistence between resets. Flags survive resets; your captured solves persist with your
account (a reset only clears the feed, not the leaderboard — unless the instructor runs a
full flush).

---

## Submitting flags

Solves are tied to **your account** (your identity is minted automatically when you first
load the app). Submit a flag from the in-app page at `http://<HOST_IP>:3000/submit`, or POST
it directly — the app sends your identity token as a `Bearer` header:

```bash
curl -s -X POST http://<HOST_IP>:8000/api/submit/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_grimoire_token>" \
  -d '{"flag":"flag{paste_your_real_flag_here}"}'
```

Grab `<your_grimoire_token>` from the `grimoire_token` value in your browser's localStorage
(or the cookie of the same name). The name shown on the leaderboard is your operator handle —
change it under **Settings**. `flag{paste_your_real_flag_here}` is the actual flag you found.

First bloods (first person to solve a challenge) are highlighted on the TV leaderboard.

---

## The challenge board

Challenges are independent. Pick by interest, pick by tier, pick by what the AI found.
Points are difficulty-weighted: easy 100 · medium 250 · hard 500.

### Easy — recon + low-hanging fruit

| ID | Name | Points | Teaser |
|----|------|--------|--------|
| E2 | Beacon | 100 | The composer previews drafts locally while you type. Inspect the page state closely. |
| E5 | Oracle | 100 | The preview service renders small theme shells. Try the edges of the selector. |

### Medium — exploitation + chaining

| ID | Name | Points | Teaser |
|----|------|--------|--------|
| M1 | Sigil | 250 | Identity, role, and session state travel through more than one layer. |
| M2 | Ledger | 250 | Profile updates are small JSON documents with a larger row behind them. |
| M3 | Relay | 250 | Operator search uses a directory plan that is built when the instance starts. |

### Hard — the boss chain

| ID | Name | Points | Teaser |
|----|------|--------|--------|
| H1 | Effigy | 500 | Dispatches can be reported into the shared-room review surface. Follow the whole lifecycle. |
| H2 | Warden | 500 | Saved views are signed in the app and restored by a worker. The worker has its own runtime. |

**Expert endgame:** the hard challenges chain. The boss chain ends with your handle on the TV.
There is also an open bounty — see the rules below.

---

## Rules and scope

**In scope:**
- The Grimoire app and all its services running on the announced host IP
- All open ports: 3000 (frontend), 8000 (API), 5432 (Postgres)
- Any bug in the source, planted or otherwise

**Out of scope:**
- Anything not on the announced host — don't scan the rest of the LAN
- The instructor's laptop or other students' laptops
- Denial-of-service attacks that kill the app for everyone

**Be excellent to each other.** Deleting other people's posts, spamming the feed with
noise, or otherwise ruining the experience for the room is poor form. The feed resets
periodically. The worker container is isolated and low-privilege.

**"Find a bug we didn't plant" bounty.** This is real white-box code written by humans.
Accidental bugs exist. If you find a security issue that isn't on the challenge board,
flag it to the instructor for bonus recognition. That's the researcher path.

---

## Running it yourself (optional)

If you want to run a local copy for practice, or if you're the instructor:

```bash
# 1. Generate fresh flags and secrets (do this once per class)
make gen-flags          # writes a new .env from scripts/gen-flags.sh
# — or copy the template manually:
cp .env.example .env    # then edit HOST_IP and any values you want to change

# 2. Build and start everything
make up

# 3. Open the app
open http://127.0.0.1:3000

# 4. See what else is available
make help
```

Key targets: `make reset` wipes the feed and restores seed data without touching flags or
identities. `make nuke` tears down everything including volumes (use between classes).
`make logs-attack` shows a colour-coded live attack feed useful on a second screen.

Set `HOST_IP` in `.env` to the machine's LAN IP so student browsers can reach the API
from other laptops on the class wifi. `make ip` prints the LAN IP for you.
