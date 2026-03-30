import type { IMessageSDK, Message } from "@photon-ai/imessage-kit";
import type OpenAI from "openai";
import {
  isNameLike,
  formatMessages,
  fuzzyMatch,
  formatTimestamp,
  type ChatInfo,
} from "./utils";
import {
  SYSTEM_PROMPT,
  buildBriefingPrompt,
  buildDeepBriefingPrompt,
  buildRecapPrompt,
} from "./prompts";

// --- Constants ---
const RESPONSE_PREFIX = "\u{1F4CB} Photonic RECALL\n\n";
const COOLDOWN_MS = 30_000;
const MAX_TRACKED_IDS = 1000;

// --- State ---
const sentMessageIds = new Set<string>();
const lastRequestTime = new Map<string, number>();

// --- Logging ---
function log(message: string): void {
  const timestamp = new Date().toLocaleTimeString("en-US", { hour12: true });
  console.log(`[${timestamp}] ${message}`);
}

// --- Guards ---

/** Check if a message is one of our own responses */
export function isOwnResponse(text: string): boolean {
  return text.startsWith("\u{1F4CB} Photonic RECALL");
}

/** Determine if a message should be processed */
export function shouldProcess(msg: Message): boolean {
  if (!msg.text?.trim()) return false;
  if (isOwnResponse(msg.text)) return false;
  if (sentMessageIds.has(msg.id)) return false;
  return true;
}

/** Rate limiter: returns false if the same query was made within COOLDOWN_MS */
function checkCooldown(key: string): boolean {
  const now = Date.now();
  const last = lastRequestTime.get(key);
  if (last && now - last < COOLDOWN_MS) return false;
  lastRequestTime.set(key, now);
  return true;
}

// --- Chat List ---

/** Build a chat list from the SDK using listChats */
async function getChatList(sdk: IMessageSDK): Promise<ChatInfo[]> {
  const chats = await sdk.listChats({ sortBy: "recent" });
  return chats.map((c) => ({
    chatId: c.chatId,
    displayName: c.displayName || c.chatId,
    participants: [c.chatId],
  }));
}

// --- Messaging Helpers ---

/** Track a sent message ID to prevent processing our own responses */
function trackSentMessage(result: unknown): void {
  const id =
    (result as Record<string, unknown>)?.id ||
    (result as Record<string, unknown>)?.guid;
  if (typeof id === "string") {
    sentMessageIds.add(id);
  }
  // Prevent unbounded growth
  if (sentMessageIds.size > MAX_TRACKED_IDS) {
    const entries = Array.from(sentMessageIds);
    for (let i = 0; i < entries.length - MAX_TRACKED_IDS / 2; i++) {
      sentMessageIds.delete(entries[i]);
    }
  }
}

/** Send a response with the Photonic Recall prefix, splitting if necessary */
async function sendResponse(
  sdk: IMessageSDK,
  recipient: string,
  text: string
): Promise<void> {
  const fullText = RESPONSE_PREFIX + text;

  if (fullText.length <= 10000) {
    const result = await sdk.send(recipient, fullText);
    trackSentMessage(result);
  } else {
    const chunks = splitMessage(fullText, 9000);
    for (const chunk of chunks) {
      const result = await sdk.send(recipient, chunk);
      trackSentMessage(result);
    }
  }
}

/** Split a long message at natural boundaries */
function splitMessage(text: string, maxLen: number): string[] {
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }
    let splitAt = remaining.lastIndexOf("\n", maxLen);
    if (splitAt < maxLen / 2) splitAt = remaining.lastIndexOf(" ", maxLen);
    if (splitAt < maxLen / 2) splitAt = maxLen;
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).trimStart();
  }
  return chunks;
}

// --- LLM ---

async function generateWithAI(
  ai: OpenAI,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const response = await ai.chat.completions.create({
    model: "gemini-3-flash-preview",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });
  return (
    response.choices[0]?.message?.content ||
    "I couldn't generate a briefing. Try again."
  );
}

// --- Command Handlers ---

async function handleNameQuery(
  sdk: IMessageSDK,
  ai: OpenAI,
  recipient: string,
  input: string,
  deep: boolean = false
): Promise<void> {
  const name = deep ? input.replace(/\s+deep$/i, "").trim() : input.trim();

  log(`\u{1F50D} Searching for contact: "${name}"`);

  const chats = await getChatList(sdk);

  // Phone number lookup
  const isPhone = /^\+?\d[\d\s\-()]{6,}$/.test(name);

  let matches: ChatInfo[];
  if (isPhone) {
    const normalized = name.replace(/[\s\-()]/g, "");
    matches = chats.filter((c) =>
      c.participants.some((p) =>
        p.replace(/[\s\-()]/g, "").includes(normalized)
      )
    );
  } else {
    matches = fuzzyMatch(name, chats);
  }

  // No matches
  if (matches.length === 0) {
    await sendResponse(
      sdk,
      recipient,
      `I couldn't find anyone named "${name}" in your chats.`
    );
    return;
  }

  // Multiple matches — ask for clarification
  if (matches.length > 1 && matches.length <= 5) {
    const names = matches.map((m) => m.displayName).join(", ");
    await sendResponse(
      sdk,
      recipient,
      `I found ${matches.length} matches: ${names}. Which one?`
    );
    return;
  }

  if (matches.length > 5) {
    await sendResponse(
      sdk,
      recipient,
      `I found ${matches.length} matches for "${name}". Can you be more specific?`
    );
    return;
  }

  // Single match — generate briefing
  const match = matches[0];
  log(`\u2705 Matched: ${match.displayName} (${match.chatId})`);

  const msgLimit = deep ? 500 : 200;

  // Try fetching by chatId first, then by sender if empty
  let result = await sdk.getMessages({
    chatId: match.chatId,
    excludeOwnMessages: false,
    limit: msgLimit,
  });

  // If chatId didn't return messages, try extracting the phone/email and querying by sender
  if (!result.messages || result.messages.length === 0) {
    const senderMatch = match.chatId.match(/[+\d][\d]+$/)?.[0]
      || match.participants[0]
      || match.chatId;
    const sender = senderMatch.startsWith("+") ? senderMatch : `+${senderMatch}`;
    log(`Retrying with sender: ${sender}`);
    result = await sdk.getMessages({
      sender,
      excludeOwnMessages: false,
      limit: msgLimit,
    });
  }

  if (!result.messages || result.messages.length === 0) {
    await sendResponse(
      sdk,
      recipient,
      `I found ${match.displayName} but you have no message history with them.`
    );
    return;
  }

  log(`\u{1F4E8} Fetched ${result.messages.length} messages with ${match.displayName}`);

  // Sort chronologically
  const sorted = [...result.messages].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  const transcript = formatMessages(sorted, match.displayName);

  if (sorted.length < 5) {
    log(`\u26A0\uFE0F Limited history (${sorted.length} messages)`);
  }

  log(`\u{1F9E0} Generating ${deep ? "deep " : ""}briefing with Gemini...`);
  const prompt = deep
    ? buildDeepBriefingPrompt(match.displayName, transcript)
    : buildBriefingPrompt(match.displayName, transcript);

  const briefing = await generateWithAI(ai, SYSTEM_PROMPT, prompt);

  log(`\u{1F4E4} Sending briefing for ${match.displayName}`);
  await sendResponse(sdk, recipient, briefing);
}

async function handleEveryone(
  sdk: IMessageSDK,
  recipient: string
): Promise<void> {
  log(`\u{1F4EC} Checking unreplied messages...`);

  const unread = await sdk.getUnreadMessages();

  if (!unread || unread.groups.length === 0) {
    await sendResponse(
      sdk,
      recipient,
      "You're all caught up! No unreplied messages."
    );
    return;
  }

  const lines = unread.groups.map(({ sender, messages }) => {
    const latest = messages[messages.length - 1];
    const timeAgo = formatTimestamp(latest.date);
    return `${sender} (${timeAgo}) \u2014 ${messages.length} message${messages.length > 1 ? "s" : ""}`;
  });

  const summary = `You have unreplied messages from:\n\n${lines.join("\n")}`;
  await sendResponse(sdk, recipient, summary);
}

async function handleRecap(
  sdk: IMessageSDK,
  ai: OpenAI,
  recipient: string
): Promise<void> {
  log(`\u{1F4CA} Generating weekly recap...`);

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const result = await sdk.getMessages({
    since: oneWeekAgo,
    excludeOwnMessages: false,
    limit: 500,
  });

  if (!result.messages || result.messages.length === 0) {
    await sendResponse(
      sdk,
      recipient,
      "No messages in the past week to recap."
    );
    return;
  }

  // Group by sender
  const bySender = new Map<string, Message[]>();
  for (const msg of result.messages) {
    if (msg.isFromMe) continue;
    const key = msg.sender;
    if (!bySender.has(key)) bySender.set(key, []);
    bySender.get(key)!.push(msg);
  }

  const summaryLines = Array.from(bySender.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 15)
    .map(([sender, msgs]) => {
      const last = msgs[msgs.length - 1];
      return `${sender}: ${msgs.length} messages, last ${formatTimestamp(last.date)}`;
    });

  const transcript = `Weekly message summary (${result.messages.length} total messages):\n${summaryLines.join("\n")}`;

  const recap = await generateWithAI(ai, SYSTEM_PROMPT, buildRecapPrompt(transcript));
  await sendResponse(sdk, recipient, recap);
}

async function handleHelp(
  sdk: IMessageSDK,
  recipient: string
): Promise<void> {
  const helpText = `\u{1F9E0} Photonic Recall \u2014 Your Social Memory Agent

Text me a name and I'll brief you on your relationship.

Commands:
\u2022 Sarah \u2192 Get a briefing on Sarah
\u2022 Sarah deep \u2192 Get a deeper analysis
\u2022 everyone \u2192 See unreplied messages
\u2022 recap \u2192 Weekly conversation recap
\u2022 help \u2192 This message

Tip: I fuzzy-match names, so "Sar" will find "Sarah Chen".`;

  await sendResponse(sdk, recipient, helpText);
}

// --- Main Handler ---

export async function handleIncomingMessage(
  msg: Message,
  sdk: IMessageSDK,
  ai: OpenAI,
  myIdentifier: string
): Promise<void> {
  if (!shouldProcess(msg)) return;

  const text = msg.text!.trim();
  const lowerText = text.toLowerCase();
  const recipient = myIdentifier;

  // Rate limit
  if (!checkCooldown(lowerText)) {
    log(`\u23F3 Cooldown active for "${text}", skipping`);
    return;
  }

  log(`\u{1F4E9} Received: "${text}"`);

  try {
    // Special commands
    if (lowerText === "help") {
      await handleHelp(sdk, recipient);
      return;
    }

    if (lowerText === "everyone" || lowerText === "unreplied") {
      await handleEveryone(sdk, recipient);
      return;
    }

    if (lowerText === "recap") {
      await handleRecap(sdk, ai, recipient);
      return;
    }

    // Check for "deep" suffix
    const isDeep = lowerText.endsWith(" deep");
    const nameInput = isDeep ? text.replace(/\s+deep$/i, "").trim() : text;

    // Process if it looks like a name
    if (isNameLike(nameInput)) {
      await handleNameQuery(sdk, ai, recipient, text, isDeep);
    }
    // Otherwise ignore silently (regular conversation)
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    log(`\u274C Error handling "${text}": ${errMsg}`);
    try {
      await sendResponse(
        sdk,
        recipient,
        `Something went wrong: ${errMsg}`
      );
    } catch {
      log(`\u274C Failed to send error response`);
    }
  }
}
