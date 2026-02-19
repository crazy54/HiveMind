import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  getContextWindow,
  serializeChatMessage,
  deserializeChatMessage,
  assembleStreamChunks,
  insertMessageOrdered,
} from './chatService';
import type { ChatMessage, StreamChunk, MessageRole } from '../utils/studio/studioTypes';

// --- Arbitraries ---

const messageRoleArb = fc.constantFrom<MessageRole>('user', 'assistant', 'system');

/** Arbitrary for ChatMessage with rich content including unicode, markdown, code blocks */
const chatMessageArb: fc.Arbitrary<ChatMessage> = fc.record({
  id: fc.uuid(),
  role: messageRoleArb,
  content: fc.oneof(
    fc.string(),
    fc.constant('🚀 **bold** `code`'),
    fc.constant('```ts\nconst x = 1;\n```'),
    fc.constant('Special chars: <>&"\'\\\n\ttab'),
    fc.constant('日本語テスト 中文 한국어'),
    fc.constant('emoji: 🎉🔥💯🤖 surrogate: 𝕳𝖊𝖑𝖑𝖔'),
  ),
  timestamp: fc.nat({ max: 2_000_000_000_000 }),
  agentId: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
  agentName: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
  isStreaming: fc.option(fc.boolean(), { nil: undefined }),
  isError: fc.option(fc.boolean(), { nil: undefined }),
});

/** Arbitrary for a valid stream chunk sequence with one start, N chunks, one end */
const streamSequenceArb: fc.Arbitrary<{ chunks: StreamChunk[]; expectedContent: string }> = fc
  .record({
    messageId: fc.uuid(),
    agentId: fc.string({ minLength: 1, maxLength: 20 }),
    chunkContents: fc.array(fc.string({ minLength: 0, maxLength: 100 }), { minLength: 0, maxLength: 20 }),
  })
  .map(({ messageId, agentId, chunkContents }) => {
    const chunks: StreamChunk[] = [
      { type: 'stream_start', messageId, content: '', agentId },
      ...chunkContents.map((content) => ({
        type: 'stream_chunk' as const,
        messageId,
        content,
        agentId,
      })),
      { type: 'stream_end', messageId, content: '', agentId },
    ];
    return { chunks, expectedContent: chunkContents.join('') };
  });


/**
 * Feature: studio-v2-overhaul, Property 2: Stream chunk concatenation produces complete message
 *
 * For any sequence of StreamChunk objects with the same messageId (one stream_start,
 * N stream_chunks, one stream_end), concatenating all content fields from the
 * stream_chunk messages in order SHALL produce the complete assistant message content.
 *
 * **Validates: Requirements 3.3**
 */
describe('Property 2: Stream chunk concatenation produces complete message', () => {
  it('assembling stream chunks produces the concatenation of all chunk contents', () => {
    fc.assert(
      fc.property(streamSequenceArb, ({ chunks, expectedContent }) => {
        const assembled = assembleStreamChunks(chunks);
        expect(assembled).toBe(expectedContent);
      }),
      { numRuns: 100 },
    );
  });

  it('ignores stream_start and stream_end content', () => {
    fc.assert(
      fc.property(streamSequenceArb, ({ chunks }) => {
        const startChunks = chunks.filter((c) => c.type === 'stream_start');
        const endChunks = chunks.filter((c) => c.type === 'stream_end');
        // start and end should not contribute to assembled content
        for (const c of [...startChunks, ...endChunks]) {
          expect(c.content).toBe('');
        }
        // Even if we set non-empty content on start/end, assembleStreamChunks filters them out
        const modified = chunks.map((c) =>
          c.type === 'stream_start' || c.type === 'stream_end'
            ? { ...c, content: 'SHOULD_BE_IGNORED' }
            : c,
        );
        const chunkOnly = assembleStreamChunks(chunks);
        const withModified = assembleStreamChunks(modified);
        expect(withModified).toBe(chunkOnly);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: studio-v2-overhaul, Property 3: Conversation context windowing
 *
 * For any array of ChatMessage objects, if the array length is <= 50, the context
 * window function SHALL return the full array. If the array length exceeds 50,
 * the context window function SHALL return exactly the last 20 messages, and those
 * 20 messages SHALL be the same objects as the last 20 in the original array.
 *
 * **Validates: Requirements 3.8, 10.5**
 */
describe('Property 3: Conversation context windowing', () => {
  it('returns full array when length <= 50, last 20 when > 50', () => {
    fc.assert(
      fc.property(
        fc.array(chatMessageArb, { minLength: 0, maxLength: 200 }),
        (messages) => {
          const window = getContextWindow(messages);

          if (messages.length <= 50) {
            // Full array returned
            expect(window).toHaveLength(messages.length);
            expect(window).toEqual(messages);
          } else {
            // Exactly last 20
            expect(window).toHaveLength(20);
            const expectedSlice = messages.slice(-20);
            expect(window).toEqual(expectedSlice);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('windowed messages are the same objects from the original array', () => {
    fc.assert(
      fc.property(
        fc.array(chatMessageArb, { minLength: 51, maxLength: 150 }),
        (messages) => {
          const window = getContextWindow(messages);
          const last20 = messages.slice(-20);
          for (let i = 0; i < 20; i++) {
            // Same reference (slice returns references, not copies)
            expect(window[i]).toBe(last20[i]);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: studio-v2-overhaul, Property 9: ChatMessage serialization round-trip
 *
 * For any valid ChatMessage object (with any combination of role, content including
 * unicode/markdown/code blocks, timestamp, and id), serializing to JSON and then
 * deserializing back SHALL produce an object with identical field values.
 *
 * **Validates: Requirements 10.1, 10.2, 10.3, 10.6**
 */
describe('Property 9: ChatMessage serialization round-trip', () => {
  it('serialize then deserialize produces an equivalent ChatMessage', () => {
    fc.assert(
      fc.property(chatMessageArb, (msg) => {
        const json = serializeChatMessage(msg);
        const restored = deserializeChatMessage(json);
        expect(restored).toEqual(msg);
      }),
      { numRuns: 100 },
    );
  });

  it('serialized form is valid JSON', () => {
    fc.assert(
      fc.property(chatMessageArb, (msg) => {
        const json = serializeChatMessage(msg);
        expect(() => JSON.parse(json)).not.toThrow();
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: studio-v2-overhaul, Property 10: Message ordering invariant
 *
 * For any sequence of ChatMessage additions to the conversation, the resulting
 * messages array SHALL be ordered by timestamp in ascending (chronological) order.
 * For all indices i < j in the array, messages[i].timestamp <= messages[j].timestamp.
 *
 * **Validates: Requirements 10.4**
 */
describe('Property 10: Message ordering invariant', () => {
  it('insertMessageOrdered maintains chronological order', () => {
    fc.assert(
      fc.property(
        fc.array(chatMessageArb, { minLength: 0, maxLength: 50 }),
        chatMessageArb,
        (existingMessages, newMessage) => {
          // First sort existing messages to simulate a valid conversation state
          const sorted = [...existingMessages].sort((a, b) => a.timestamp - b.timestamp);
          const result = insertMessageOrdered(sorted, newMessage);

          // Verify ascending timestamp order
          for (let i = 1; i < result.length; i++) {
            expect(result[i].timestamp).toBeGreaterThanOrEqual(result[i - 1].timestamp);
          }

          // Result should contain all original messages plus the new one
          expect(result).toHaveLength(sorted.length + 1);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('building a conversation by repeated insertion always stays ordered', () => {
    fc.assert(
      fc.property(
        fc.array(chatMessageArb, { minLength: 1, maxLength: 30 }),
        (messages) => {
          let conversation: ChatMessage[] = [];
          for (const msg of messages) {
            conversation = insertMessageOrdered(conversation, msg);
          }

          // Final conversation must be in chronological order
          for (let i = 1; i < conversation.length; i++) {
            expect(conversation[i].timestamp).toBeGreaterThanOrEqual(
              conversation[i - 1].timestamp,
            );
          }

          // Must contain all messages
          expect(conversation).toHaveLength(messages.length);
        },
      ),
      { numRuns: 100 },
    );
  });
});
