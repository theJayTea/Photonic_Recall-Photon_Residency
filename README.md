# Photonic Recall

**Text someone's name, get a cheat sheet of everything you need to remember before seeing them.**

Photonic Recall is an iMessage-native social memory agent. It runs locally on your Mac, watches your messages, and when you text a contact's name to yourself, it pulls your full conversation history, sends it through Gemini for synthesis, and texts you back a structured social briefing — all within iMessage.

No separate app. No context switching. Just text a name and know exactly what to talk about.

---

## Demo

```
You:     Sarah

Recall:  📋 Photonic RECALL

         📊 PULSE
         Last talked 3 days ago. You two chat every few days,
         pretty steady rhythm since January.

         💬 LAST CONVO
         You talked about the upcoming hackathon — she signed up
         and you suggested teaming up. She said she'd bring her
         laptop. You also briefly discussed the new ramen place
         on 5th that she recommended.

         🌍 THEIR WORLD
         Really into ML/AI lately, mentioned starting a side
         project with computer vision. Just got back from
         visiting her sister in Portland last week.

         📌 MY IOUs
         You said you'd send her that Figma plugin link.
         She offered to share her notes from the AI meetup.

         🎯 CONVERSATION STARTERS
         Ask how the Portland trip went
         Follow up on the hackathon team plan
         Ask about her computer vision side project
```

```
You:     everyone

Recall:  📋 Photonic RECALL

         You have unreplied messages from:

         Sarah Chen (3 hrs ago) — 2 messages
         Mike (1 day ago) — 1 message
         Mom (3 days ago) — 1 message
```

---

## Setup

### Prerequisites

- **macOS** (required — iMessage runs only on Mac)
- **Bun** runtime ([install](https://bun.sh))
- **Full Disk Access** granted to your terminal (System Settings > Privacy & Security > Full Disk Access)
- A **Gemini API key** ([get one](https://aistudio.google.com/apikey))

### Install

```bash
git clone <your-repo-url> photonic-recall
cd photonic-recall
bun install
```

### Configure

Edit `.env` and fill in your details:

```env
GEMINI_API_KEY=your_gemini_api_key_here
MY_IDENTIFIER=+1234567890
```

`MY_IDENTIFIER` is your phone number or iCloud email — wherever you want the agent to send briefings back to.

### Run

```bash
bun run src/index.ts
```

You'll see:

```
[10:30:00 AM] Starting Photonic Recall...
[10:30:01 AM] Startup message sent
[10:30:01 AM] Watching for messages... Press Ctrl+C to stop
```

And you'll get an iMessage: "🧠 Photonic Recall is online. Text me someone's name and I'll brief you."

---

## How It Works

1. **You text a name** to yourself (e.g., "Sarah")
2. **Photonic Recall detects it** — the agent watches all incoming DMs and recognizes name-like inputs
3. **Fuzzy matches** the name against your iMessage chat list
4. **Pulls your message history** with that person (last 200 messages)
5. **Sends the history to Gemini Flash** for synthesis
6. **Texts you back** a structured social briefing with five sections: Pulse, Last Convo, Their World, My IOUs, and Conversation Starters

All of this happens inside iMessage. No browser, no app, no dashboard.

---

## Commands

| Command | What it does |
|---------|-------------|
| `Sarah` | Get a social briefing on Sarah |
| `Sarah deep` | Get a deeper analysis (500 messages) |
| `everyone` | See all unreplied messages |
| `unreplied` | Same as `everyone` |
| `recap` | Weekly conversation recap |
| `help` | Usage guide |

Names are fuzzy-matched — "Sar" finds "Sarah Chen", phone numbers work too.

---

## Features

- **Fuzzy contact matching** — partial names, first names, phone numbers
- **5-section social briefings** — Pulse, Last Convo, Their World, IOUs, Conversation Starters
- **Deep mode** — fetch 500 messages for richer analysis
- **Unreplied inbox** — see who's waiting on you
- **Weekly recap** — who you talked to, open threads, fading connections
- **Infinite loop prevention** — prefix-based + ID tracking, dual protection
- **Rate limiting** — 30-second cooldown per query
- **Long message splitting** — auto-splits responses that exceed iMessage limits
- **Graceful error handling** — never crashes, always recovers

---

## Built With

- **[Bun](https://bun.sh)** — fast JavaScript runtime
- **[Photon iMessage SDK](https://www.npmjs.com/package/@photon-ai/imessage-kit)** — native iMessage access on macOS
- **[Google Gemini Flash](https://ai.google.dev)** — fast, capable LLM for synthesis
- **[OpenAI SDK](https://www.npmjs.com/package/openai)** — client library (pointed at Gemini's OpenAI-compatible endpoint)
- **TypeScript** — type-safe, strict mode

---

## Why Photonic Recall?

The best AI agents don't ask you to switch contexts — they meet you where you already are.

You don't need another app to remember that your friend mentioned a new job, or that you promised to send someone a link three weeks ago. That context already exists in your messages. Photonic Recall just surfaces it at the moment you need it.

The name is a nod to how memory works — every interaction leaves a trace, like photons hitting film. This agent develops those traces into something useful, right when you need to recall them.

Social context shouldn't require a separate app. It should live where the conversation already happens.

---

## Project Structure

```
├── src/
│   ├── index.ts              # Entry point — SDK init, watcher, main loop
│   ├── photonic-recall.ts    # Core logic — matching, history, briefings
│   ├── prompts.ts            # LLM system prompt and templates
│   └── utils.ts              # Helpers — fuzzy match, formatting, guards
├── package.json
├── tsconfig.json
├── .env                      # API keys (not committed)
└── README.md
```

---

*Built for the [Photon Residency](https://photon.sh) build challenge.*
