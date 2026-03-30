import { IMessageSDK } from "@photon-ai/imessage-kit";
import OpenAI from "openai";
import { handleIncomingMessage, isOwnResponse } from "./photonic-recall";

// --- Environment ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MY_IDENTIFIER = process.env.MY_IDENTIFIER;
const TRIGGER_CONTACT = process.env.TRIGGER_CONTACT;

if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is required in .env");
  process.exit(1);
}

if (!MY_IDENTIFIER || MY_IDENTIFIER === "<my phone number or iCloud email>") {
  console.error(
    "MY_IDENTIFIER is required in .env — set it to your phone number or iCloud email"
  );
  process.exit(1);
}

if (!TRIGGER_CONTACT) {
  console.error(
    "TRIGGER_CONTACT is required in .env — set it to the phone number/email of your trigger contact"
  );
  process.exit(1);
}

// --- Logging ---
function log(message: string): void {
  const timestamp = new Date().toLocaleTimeString("en-US", { hour12: true });
  console.log(`[${timestamp}] ${message}`);
}

// --- Initialize Gemini via OpenAI-compatible client ---
const ai = new OpenAI({
  apiKey: GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

// --- Initialize iMessage SDK ---
const sdk = new IMessageSDK({
  debug: true,
  watcher: {
    pollInterval: 3000,
    unreadOnly: false,
    excludeOwnMessages: false, // Must see own messages for self-texting flow
  },
});

// --- Deduplication ---
const processedIds = new Set<string>();

// Periodically clean processed IDs to prevent memory leaks
setInterval(() => {
  if (processedIds.size > 5000) {
    const entries = Array.from(processedIds);
    const toRemove = entries.slice(0, entries.length - 2500);
    for (const id of toRemove) {
      processedIds.delete(id);
    }
    log(`Cleaned processed IDs cache, kept 2500 entries`);
  }
}, 60 * 60 * 1000); // Every hour

// --- Start ---
log("Starting Photonic Recall...");

await sdk.startWatching({
  onDirectMessage: async (msg) => {
    // Deduplicate
    if (processedIds.has(msg.id)) return;
    processedIds.add(msg.id);

    // Only listen to messages in the trigger contact's chat
    // msg.sender is the other party's identifier; for our sent messages in that chat,
    // the chatId contains the trigger contact's identifier
    const chatMatchesTrigger =
      msg.sender === TRIGGER_CONTACT ||
      msg.chatId.includes(TRIGGER_CONTACT!.replace("+", ""));
    if (!chatMatchesTrigger) return;

    // Only process messages I sent (commands TO the trigger contact)
    if (!msg.isFromMe) return;

    // Skip empty messages
    if (!msg.text?.trim()) return;

    // Skip our own prefixed responses (infinite loop prevention)
    if (isOwnResponse(msg.text)) {
      return;
    }

    // Reply goes to the trigger contact chat
    await handleIncomingMessage(msg, sdk, ai, TRIGGER_CONTACT!);
  },

  onError: (error) => {
    log(`Watcher error: ${error.message}`);
  },
});

// --- Startup notification ---
try {
  await sdk.send(
    TRIGGER_CONTACT,
    "\u{1F9E0} Photonic Recall is online. Text me someone's name and I'll brief you."
  );
  log(`Startup message sent to trigger contact (${TRIGGER_CONTACT})`);
} catch (error) {
  log(
    `Could not send startup message: ${error instanceof Error ? error.message : error}`
  );
}

log("Watching for messages... Press Ctrl+C to stop");

// --- Graceful shutdown ---
const shutdown = async () => {
  log("Shutting down...");
  sdk.stopWatching();
  await sdk.close();
  log("Photonic Recall offline. Goodbye!");
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Keep process alive
await new Promise(() => {});
