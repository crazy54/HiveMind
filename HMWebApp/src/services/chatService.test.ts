import { describe, it, expect, vi } from 'vitest';
import {
  getContextWindow,
  serializeChatMessage,
  deserializeChatMessage,
  assembleStreamChunks,
  insertMessageOrdered,
  ChatService,
} from './chatService';
import type { ChatMessage, StreamChunk, WsIncomingMessage } from '../utils/studio/studioTypes';

function makeMsg(id: string, ts: number, role: 'user' | 'assistant' = 'user'): ChatMessage {
  return { id, role, content: `msg-${id}`, timestamp: ts };
}

describe('getContextWindow', () => {
  it('returns full array when <= 50 messages', () => {
    const msgs = Array.from({ length: 30 }, (_, i) => makeMsg(`${i}`, i));
    expect(getContextWindow(msgs)).toHaveLength(30);
  });

  it('returns last 20 when > 50 messages', () => {
    const msgs = Array.from({ length: 60 }, (_, i) => makeMsg(`${i}`, i));
    const window = getContextWindow(msgs);
    expect(window).toHaveLength(20);
    expect(window[0].id).toBe('40');
    expect(window[19].id).toBe('59');
  });

  it('returns exactly 50 when array has 50 messages', () => {
    const msgs = Array.from({ length: 50 }, (_, i) => makeMsg(`${i}`, i));
    expect(getContextWindow(msgs)).toHaveLength(50);
  });
});

describe('serializeChatMessage / deserializeChatMessage', () => {
  it('round-trips a basic message', () => {
    const msg: ChatMessage = { id: '1', role: 'user', content: 'hello', timestamp: 1000 };
    const json = serializeChatMessage(msg);
    const restored = deserializeChatMessage(json);
    expect(restored).toEqual(msg);
  });

  it('preserves unicode and markdown', () => {
    const msg: ChatMessage = { id: '2', role: 'assistant', content: '🚀 **bold** `code`\n```ts\nconst x = 1;\n```', timestamp: 2000 };
    expect(deserializeChatMessage(serializeChatMessage(msg))).toEqual(msg);
  });
});

describe('assembleStreamChunks', () => {
  it('concatenates stream_chunk content in order', () => {
    const chunks: StreamChunk[] = [
      { type: 'stream_start', messageId: 'a', content: '', agentId: 'recon' },
      { type: 'stream_chunk', messageId: 'a', content: 'Hello ', agentId: 'recon' },
      { type: 'stream_chunk', messageId: 'a', content: 'world', agentId: 'recon' },
      { type: 'stream_end', messageId: 'a', content: '', agentId: 'recon' },
    ];
    expect(assembleStreamChunks(chunks)).toBe('Hello world');
  });

  it('returns empty string for no chunks', () => {
    expect(assembleStreamChunks([])).toBe('');
  });
});

describe('insertMessageOrdered', () => {
  it('maintains chronological order', () => {
    const msgs = [makeMsg('1', 100), makeMsg('3', 300)];
    const result = insertMessageOrdered(msgs, makeMsg('2', 200));
    expect(result.map((m) => m.id)).toEqual(['1', '2', '3']);
  });

  it('appends at end when timestamp is latest', () => {
    const msgs = [makeMsg('1', 100)];
    const result = insertMessageOrdered(msgs, makeMsg('2', 200));
    expect(result[1].id).toBe('2');
  });
});

describe('ChatService', () => {
  function createMockOptions() {
    const handlers: Array<(msg: WsIncomingMessage) => void> = [];
    return {
      send: vi.fn(),
      isConnected: vi.fn(() => true),
      onMessage: (handler: (msg: WsIncomingMessage) => void) => { handlers.push(handler); },
      _emit: (msg: WsIncomingMessage) => { handlers.forEach((h) => h(msg)); },
    };
  }

  it('sends message via WebSocket when connected', () => {
    const opts = createMockOptions();
    const service = new ChatService(opts);
    service.setActiveAgent('recon');
    service.sendMessage('hello', []);
    expect(opts.send).toHaveBeenCalledWith(expect.objectContaining({
      type: 'message',
      agent_id: 'recon',
      message: 'hello',
    }));
  });

  it('falls back to mock when disconnected', () => {
    const opts = createMockOptions();
    opts.isConnected.mockReturnValue(false);
    const service = new ChatService(opts);
    const onResponse = vi.fn();
    service.setCallbacks({ onResponse, onStream: { onStreamStart: vi.fn(), onStreamChunk: vi.fn(), onStreamEnd: vi.fn() }, onError: vi.fn(), onAgentSwitched: vi.fn() });
    service.sendMessage('hello', []);
    expect(opts.send).not.toHaveBeenCalled();
    expect(onResponse).toHaveBeenCalledWith(expect.objectContaining({ role: 'assistant' }));
  });

  it('dispatches response messages to onResponse callback', () => {
    const opts = createMockOptions();
    const service = new ChatService(opts);
    const onResponse = vi.fn();
    service.setCallbacks({ onResponse, onStream: { onStreamStart: vi.fn(), onStreamChunk: vi.fn(), onStreamEnd: vi.fn() }, onError: vi.fn(), onAgentSwitched: vi.fn() });
    opts._emit({ type: 'response', agent_id: 'conductor', message: 'hi', status: 'ok' });
    expect(onResponse).toHaveBeenCalledWith(expect.objectContaining({ content: 'hi', agentId: 'conductor' }));
  });

  it('dispatches stream events to stream callbacks', () => {
    const opts = createMockOptions();
    const service = new ChatService(opts);
    const onStreamStart = vi.fn();
    const onStreamChunk = vi.fn();
    const onStreamEnd = vi.fn();
    service.setCallbacks({ onResponse: vi.fn(), onStream: { onStreamStart, onStreamChunk, onStreamEnd }, onError: vi.fn(), onAgentSwitched: vi.fn() });

    opts._emit({ type: 'stream_start', message_id: 'm1', agent_id: 'recon' });
    expect(onStreamStart).toHaveBeenCalledWith('m1', 'recon');

    opts._emit({ type: 'stream_chunk', message_id: 'm1', content: 'chunk' });
    expect(onStreamChunk).toHaveBeenCalledWith('m1', 'chunk');

    opts._emit({ type: 'stream_end', message_id: 'm1', agent_id: 'recon' });
    expect(onStreamEnd).toHaveBeenCalledWith('m1', 'recon');
  });

  it('dispatches error messages', () => {
    const opts = createMockOptions();
    const service = new ChatService(opts);
    const onError = vi.fn();
    service.setCallbacks({ onResponse: vi.fn(), onStream: { onStreamStart: vi.fn(), onStreamChunk: vi.fn(), onStreamEnd: vi.fn() }, onError, onAgentSwitched: vi.fn() });
    opts._emit({ type: 'error', message: 'rate limit' });
    expect(onError).toHaveBeenCalledWith('rate limit');
  });

  it('switches agent via WebSocket', () => {
    const opts = createMockOptions();
    const service = new ChatService(opts);
    service.switchAgent('janitor');
    expect(opts.send).toHaveBeenCalledWith({ type: 'switch_agent', agent_id: 'janitor' });
  });

  it('applies context windowing when sending', () => {
    const opts = createMockOptions();
    const service = new ChatService(opts);
    const msgs = Array.from({ length: 60 }, (_, i) => makeMsg(`${i}`, i));
    service.sendMessage('test', msgs);
    const sentContext = opts.send.mock.calls[0][0].context as unknown[];
    expect(sentContext).toHaveLength(20);
  });
});
