<div align="center">

<img src="Icon.jpg" width="140" alt="Photonic Recall Logo" />

# Photonic Recall

### Text a name. Get a cheat sheet before you see them.

[![Built with Bun](https://img.shields.io/badge/runtime-Bun-f9f1e1?logo=bun)](https://bun.sh)
[![Photon SDK](https://img.shields.io/badge/iMessage-Photon%20SDK-blue)](https://www.npmjs.com/package/@photon-ai/imessage-kit)
[![Gemini Flash](https://img.shields.io/badge/LLM-Gemini%20Flash-4285F4?logo=google)](https://ai.google.dev)
[![TypeScript](https://img.shields.io/badge/lang-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

*An iMessage-native social memory agent. It reads your real message history, synthesizes everything you need to know about someone, and texts it back to you — all inside iMessage.*

[Demo](#demo) &bull; [Setup](#setup) &bull; [Commands](#commands) &bull; [How It Works](#how-it-works) &bull; [Why This Exists](#why-photonic-recall)

</div>

---

## Demo

<div align="center">

https://github.com/user-attachments/assets/demo-video

https://github.com/theJayTea/Photonic-Recall-Photon-Residency-/raw/main/Demo%20Video.mp4

<br/>

<img src="Demo Screenshot.jpg" width="360" alt="Photonic Recall demo screenshot" />

</div>

<br/>

<details>
<summary><b>Example output</b></summary>

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

</details>

---

## Setup

### Prerequisites

- **macOS** (required — iMessage runs only on Mac)
- **[Bun](https://bun.sh)** runtime
- **Full Disk Access** granted to your terminal (System Settings > Privacy & Security > Full Disk Access)
- A **[Gemini API key](https://aistudio.google.com/apikey)**

### Install

```bash
git clone https://github.com/theJayTea/Photonic-Recall-Photon-Residency-.git
cd Photonic-Recall-Photon-Residency-
bun install
```

### Configure

Create a `.env` file:

```env
GEMINI_API_KEY=your_gemini_api_key_here
MY_IDENTIFIER=+1234567890
TRIGGER_CONTACT=+0987654321
```

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Your Google Gemini API key |
| `MY_IDENTIFIER` | Your phone number or iCloud email |
| `TRIGGER_CONTACT` | Phone number or email of the contact you'll text commands to |

> **Tip:** Rename any contact to "Photonic Recall" in your Contacts app — that becomes your dedicated chat with the agent.

### Run

```bash
bun run src/index.ts
```

```
[10:30:00 AM] Starting Photonic Recall...
[10:30:01 AM] Startup message sent
[10:30:01 AM] Watching for messages... Press Ctrl+C to stop
```

You'll get an iMessage: *"🧠 Photonic Recall is online. Text me someone's name and I'll brief you."*

---

## Commands

| Command | What it does |
|:--------|:-------------|
| `Sarah` | Social briefing on Sarah |
| `Sarah deep` | Deeper analysis (500 messages) |
| `everyone` | See all unreplied messages |
| `recap` | Weekly conversation recap |
| `help` | Usage guide |

> Names are fuzzy-matched — `Sar` finds `Sarah Chen`. Phone numbers work too.

---

## How It Works

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐     ┌──────────────┐
│  You text a  │────▶│ Fuzzy match  │────▶│ Pull message  │────▶│ Gemini Flash │
│    name      │     │ against chat │     │   history     │     │  synthesizes │
│              │     │    list      │     │  (200 msgs)   │     │   briefing   │
└─────────────┘     └──────────────┘     └───────────────┘     └──────┬───────┘
                                                                      │
                                                                      ▼
                                                               ┌──────────────┐
                                                               │ Briefing is  │
                                                               │  texted back │
                                                               │  to you      │
                                                               └──────────────┘
```

1. **You text a name** to your trigger contact
2. **Photonic Recall detects it** — watches that chat for name-like inputs
3. **Fuzzy matches** against your iMessage chat list via `listChats()`
4. **Pulls your conversation history** with that person via `getMessages()`
5. **Sends it to Gemini Flash** for synthesis into a structured briefing
6. **Texts you back** five sections: Pulse, Last Convo, Their World, My IOUs, Conversation Starters

All inside iMessage. No browser, no app, no dashboard.

---

## Features

| | Feature | Details |
|---|---------|---------|
| 🔍 | **Fuzzy contact matching** | Partial names, first names, phone numbers |
| 📊 | **5-section briefings** | Pulse, Last Convo, Their World, IOUs, Starters |
| 🔬 | **Deep mode** | 500 messages for richer analysis |
| 📬 | **Unreplied inbox** | See who's waiting on you |
| 📈 | **Weekly recap** | Top contacts, open threads, fading connections |
| 🔄 | **Loop prevention** | Prefix-based + ID tracking, dual protection |
| ⏱️ | **Rate limiting** | 30-second cooldown per query |
| ✂️ | **Message splitting** | Auto-splits long responses |
| 🛡️ | **Error recovery** | Never crashes, always recovers |

---

## Built With

<table>
<tr>
<td align="center"><a href="https://bun.sh"><b>Bun</b></a><br/>Runtime</td>
<td align="center"><a href="https://www.npmjs.com/package/@photon-ai/imessage-kit"><b>Photon SDK</b></a><br/>iMessage Access</td>
<td align="center"><a href="https://ai.google.dev"><b>Gemini Flash</b></a><br/>LLM Synthesis</td>
<td align="center"><a href="https://www.npmjs.com/package/openai"><b>OpenAI SDK</b></a><br/>API Client</td>
<td align="center"><a href="https://www.typescriptlang.org/"><b>TypeScript</b></a><br/>Strict Mode</td>
</tr>
</table>

---

## Why Photonic Recall?

> *The best AI agents don't ask you to switch contexts — they meet you where you already are.*

Everyone has that moment: *"Wait, what did we talk about last time?"* The context you need already exists in your messages — who mentioned a new job, what you promised to follow up on, the restaurant they recommended.

Photonic Recall surfaces all of that at the exact moment you need it. No separate app. No dashboard. Just text a name, right where the conversation already happens.

The name is a nod to how memory works — every interaction leaves a trace, like photons hitting film. This agent develops those traces into something useful, right when you need to recall them.

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

<div align="center">

*Built for the [Photon Residency](https://photon.sh) build challenge.*

</div>
