// ChatService — WebSocket-based chat with streaming support and offline fallback
import type {
  ChatMessage,
  WsIncomingMessage,
  StreamChunk,
  BedrockAuthConfig,
} from '../utils/studio/studioTypes';
import { generateMockResponse } from '../utils/studio/chatEngine';

// --- Context windowing ---
const MAX_CONTEXT = 50;
const WINDOW_SIZE = 20;

export function getContextWindow(messages: ChatMessage[]): ChatMessage[] {
  if (messages.length <= MAX_CONTEXT) return messages;
  return messages.slice(-WINDOW_SIZE);
}

// --- Serialization ---
export function serializeChatMessage(msg: ChatMessage): string {
  return JSON.stringify(msg);
}

export function deserializeChatMessage(json: string): ChatMessage {
  return JSON.parse(json) as ChatMessage;
}

// --- Stream chunk assembly ---
export function assembleStreamChunks(chunks: StreamChunk[]): string {
  return chunks
    .filter((c) => c.type === 'stream_chunk')
    .map((c) => c.content)
    .join('');
}

// --- Message ordering ---
export function insertMessageOrdered(messages: ChatMessage[], msg: ChatMessage): ChatMessage[] {
  const result = [...messages, msg];
  result.sort((a, b) => a.timestamp - b.timestamp);
  return result;
}

// --- Unique ID generator ---
let msgIdCounter = 0;
export function generateMessageId(): string {
  msgIdCounter += 1;
  return `msg-${Date.now()}-${msgIdCounter}`;
}

// --- ChatService class ---
export interface ChatServiceOptions {
  send: (data: Record<string, unknown>) => void;
  isConnected: () => boolean;
  onMessage: (handler: (msg: WsIncomingMessage) => void) => void;
}

export interface StreamCallback {
  onStreamStart: (messageId: string, agentId: string) => void;
  onStreamChunk: (messageId: string, content: string) => void;
  onStreamEnd: (messageId: string, agentId: string) => void;
}

export interface ChatServiceCallbacks {
  onResponse: (msg: ChatMessage) => void;
  onStream: StreamCallback;
  onError: (errorMsg: string) => void;
  onAgentSwitched: (agentId: string, agentName: string) => void;
  onAuthStatus?: (ok: boolean, message: string) => void;
}

export class ChatService {
  private readonly options: ChatServiceOptions;
  private callbacks: ChatServiceCallbacks | null = null;
  private activeAgentId = 'conductor';
  private authConfig: BedrockAuthConfig | null = null;

  constructor(options: ChatServiceOptions) {
    this.options = options;
    this.options.onMessage((msg) => this.handleIncoming(msg));
  }

  setCallbacks(callbacks: ChatServiceCallbacks): void {
    this.callbacks = callbacks;
  }

  setActiveAgent(agentId: string): void {
    this.activeAgentId = agentId;
  }

  /** Push auth config to the backend for this WS session. */
  setAuthConfig(config: BedrockAuthConfig): void {
    this.authConfig = config;
    if (this.options.isConnected()) {
      this.options.send({ type: 'set_auth', auth_config: config as unknown as Record<string, unknown> });
    }
  }

  sendMessage(content: string, conversationContext: ChatMessage[]): void {
    if (!this.options.isConnected()) {
      const mockReply = generateMockResponse(content, this.activeAgentId);
      this.callbacks?.onResponse(mockReply);
      return;
    }

    const context = getContextWindow(conversationContext);
    const payload: Record<string, unknown> = {
      type: 'message',
      agent_id: this.activeAgentId,
      message: content,
      include_briefing: false,
      context: context.map((m) => ({ role: m.role, content: m.content })),
    };
    // Always include current auth config so backend uses the right credentials
    if (this.authConfig) {
      payload.auth_config = this.authConfig;
    }
    this.options.send(payload);
  }

  switchAgent(agentId: string): void {
    this.activeAgentId = agentId;
    if (this.options.isConnected()) {
      this.options.send({ type: 'switch_agent', agent_id: agentId });
    }
  }

  private handleIncoming(msg: WsIncomingMessage): void {
    if (!this.callbacks) return;

    switch (msg.type) {
      case 'response':
        this.callbacks.onResponse({
          id: generateMessageId(),
          role: 'assistant',
          content: msg.message,
          timestamp: Date.now(),
          agentId: msg.agent_id,
        });
        break;

      case 'stream_start':
        this.callbacks.onStream.onStreamStart(msg.message_id, msg.agent_id);
        break;

      case 'stream_chunk':
        this.callbacks.onStream.onStreamChunk(msg.message_id, msg.content);
        break;

      case 'stream_end':
        this.callbacks.onStream.onStreamEnd(msg.message_id, msg.agent_id);
        break;

      case 'error':
        this.callbacks.onError(msg.message);
        break;

      case 'agent_switched':
        this.activeAgentId = msg.agent_id;
        this.callbacks.onAgentSwitched(msg.agent_id, msg.agent_name);
        break;

      case 'auth_status':
        this.callbacks.onAuthStatus?.(msg.ok, msg.message);
        break;
    }
  }
}
