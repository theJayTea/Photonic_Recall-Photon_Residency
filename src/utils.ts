import type { Message } from "@photon-ai/imessage-kit";

/** Represents a chat entry for contact matching */
export interface ChatInfo {
  chatId: string;
  displayName: string;
  participants: string[];
}

/**
 * Returns true if the input looks like a contact name/label rather than a normal sentence.
 * Permissive — real contact names can have parentheses, numbers, annotations, etc.
 * e.g. "Sarah", "J Aadarsh (US Number)", "Mom", "+14155551234"
 */
export function isNameLike(text: string): boolean {
  if (!text || text.length === 0) return false;
  const trimmed = text.trim();

  // Too long to be a name — likely a sentence or paragraph
  if (trimmed.length > 60) return false;

  // Accept phone numbers
  if (/^\+?\d[\d\s\-()]{6,}$/.test(trimmed)) return true;

  // Reject if it looks like a sentence (contains common sentence-ending punctuation
  // or starts with common sentence words followed by more words)
  if (/[.!?]$/.test(trimmed) && trimmed.split(/\s+/).length > 3) return false;

  // Up to 6 words — contact names/labels can be longer than just first+last
  const words = trimmed.split(/\s+/);
  if (words.length > 6) return false;

  // At least one word should start with a letter (not purely numeric/symbolic)
  return words.some((word) => /^[a-zA-Z]/.test(word));
}

/** Formats a date as a relative time string */
export function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hr${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Converts a Message[] to a readable transcript format */
export function formatMessages(messages: Message[], contactName: string): string {
  return messages
    .map((msg) => {
      const time = msg.date.toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      const sender = msg.isFromMe ? "Me" : contactName;
      let content = msg.text || "";

      // Include attachment descriptions
      if (msg.attachments && msg.attachments.length > 0) {
        const attachmentDescs = msg.attachments.map((att) => {
          if (att.isImage) return "[sent an image]";
          return `[sent file: ${att.filename}]`;
        });
        content = content
          ? `${content} ${attachmentDescs.join(" ")}`
          : attachmentDescs.join(" ");
      }

      if (!content) return null;
      return `[${time}] ${sender}: ${content}`;
    })
    .filter(Boolean)
    .join("\n");
}

/** Fuzzy matches an input string against a list of chats by display name */
export function fuzzyMatch(input: string, chats: ChatInfo[]): ChatInfo[] {
  const query = input.toLowerCase().trim();

  // 1. Exact match
  const exact = chats.filter((c) => c.displayName.toLowerCase() === query);
  if (exact.length > 0) return exact;

  // 2. Substring/includes match
  const substring = chats.filter((c) =>
    c.displayName.toLowerCase().includes(query)
  );
  if (substring.length > 0) return substring;

  // 3. Word-start matching (e.g., "sar" matches "Sarah")
  const wordStart = chats.filter((c) => {
    const words = c.displayName.toLowerCase().split(/\s+/);
    return words.some((word) => word.startsWith(query));
  });
  if (wordStart.length > 0) return wordStart;

  // 4. Match against participant identifiers (phone/email)
  const participantMatch = chats.filter((c) =>
    c.participants.some((p) => p.toLowerCase().includes(query))
  );
  return participantMatch;
}
