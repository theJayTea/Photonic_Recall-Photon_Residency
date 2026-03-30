export const SYSTEM_PROMPT = `You are Photonic Recall, a social memory assistant. You analyze iMessage conversation history and produce concise, actionable social briefings.

Your job is to help the user prepare before meeting or texting someone by surfacing the most relevant context from their chat history.

Be concise, warm, and specific. Use concrete details from the messages — names, places, dates, topics. Don't be generic.

Format your response as a clean text message (no markdown, no headers with ##, no bullet points with -). Use simple line breaks and casual formatting that looks good in iMessage. Use emojis sparingly for section separation.`;

export function buildBriefingPrompt(
  contactName: string,
  transcript: string
): string {
  return `Here is the iMessage conversation history between me and ${contactName}:

---
${transcript}
---

Based on this conversation history, create a social briefing with these sections:

📊 PULSE
- When we last talked and how often we chat
- Whether conversation frequency is increasing, steady, or fading

💬 LAST CONVO
- What we talked about last time (2-3 sentences max)
- Any open loops — things either of us said we'd do but might not have

🌍 THEIR WORLD
- Topics/interests they bring up often
- Any recent life updates they've mentioned (job, travel, relationships, etc.)

📌 MY IOUs
- Things I said I'd do for them
- Things they offered to do for me

🎯 CONVERSATION STARTERS
- 2-3 natural things I could bring up based on our history
- Make these specific and authentic, not generic

Keep the entire response under 1500 characters so it fits nicely as a text message. Be specific — use actual names, dates, and details from the chat. Don't say vague things like "you discussed various topics."`;
}

export function buildDeepBriefingPrompt(
  contactName: string,
  transcript: string
): string {
  return `Here is an extended iMessage conversation history between me and ${contactName}:

---
${transcript}
---

Create a deep social briefing. Go beyond the surface — find patterns, recurring themes, and relationship dynamics. Include all the standard sections but with more depth:

📊 PULSE
- Detailed communication pattern analysis
- How the relationship has evolved over time

💬 RECENT THREADS
- Summary of the last 3-5 conversation topics
- All open loops and unresolved threads

🌍 THEIR WORLD
- Major life themes and ongoing situations
- Their interests, opinions, and what they care about

📌 IOUs & PROMISES
- Everything either of us committed to
- Things that were mentioned but never followed up on

🎯 CONVERSATION STARTERS
- 3-5 specific, contextual things to bring up

Keep the response under 2000 characters. Be specific — use actual names, dates, and details from the chat.`;
}

export function buildRecapPrompt(transcript: string): string {
  return `Here is a summary of my recent iMessage activity across all conversations:

${transcript}

Give me a weekly social recap:
- Who I talked to most
- Open threads that need follow-up
- People who might be going cold (haven't replied or chatted recently)
- Any notable conversations or commitments I made

Keep it under 1500 characters. Format for iMessage (no markdown).`;
}
