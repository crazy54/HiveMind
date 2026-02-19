import { useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { Typography, Segmented, Empty, Alert, Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { ChatMessage as ChatMessageComponent } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { ChatService, generateMessageId, getContextWindow } from '../../services/chatService';
import { useWebSocket } from '../../hooks/useWebSocket';
import type { ChatMessage, InfraSubView } from '../../utils/studio/studioTypes';

const { Text } = Typography;

const WS_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/chat`;

const INFRA_SUB_VIEWS: { value: InfraSubView; label: string }[] = [
  { value: 'architecture', label: 'Architecture' },
  { value: 'template', label: 'Template' },
  { value: 'cost', label: 'Cost' },
];

export function ChatView(): ReactNode {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const { fullConfig } = useAuth();
  const ws = useWebSocket(WS_URL);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeAgentId, setActiveAgentId] = useState('conductor');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);
  const [infraSubView, setInfraSubView] = useState<InfraSubView>('architecture');
  const [authAlert, setAuthAlert] = useState<{ ok: boolean; message: string } | null>(null);

  const isConnected = ws.status === 'connected';
  const isConnecting = ws.status === 'connecting';

  // Keep a ref so the ChatService closure always sees the current status
  const wsStatusRef = useRef(ws.status);
  useEffect(() => { wsStatusRef.current = ws.status; }, [ws.status]);

  // Create ChatService instance — stable ref, never recreated
  const chatServiceRef = useRef<InstanceType<typeof ChatService> | null>(null);
  if (!chatServiceRef.current) {
    chatServiceRef.current = new ChatService({
      send: ws.send,
      isConnected: () => wsStatusRef.current === 'connected',
      onMessage: ws.onMessage,
    });
  }
  const chatService = chatServiceRef.current;

  // Wire callbacks
  useEffect(() => {
    chatService.setCallbacks({
      onResponse: (msg) => {
        setMessages((prev) => [...prev, msg]);
        setIsStreaming(false);
        setStreamingMsgId(null);
      },
      onStream: {
        onStreamStart: (messageId, agentId) => {
          setIsStreaming(true);
          setStreamingMsgId(messageId);
          setMessages((prev) => [...prev, {
            id: messageId,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
            agentId,
            isStreaming: true,
          }]);
        },
        onStreamChunk: (messageId, content) => {
          setMessages((prev) => prev.map((m) =>
            m.id === messageId ? { ...m, content: m.content + content } : m
          ));
        },
        onStreamEnd: (messageId) => {
          setMessages((prev) => prev.map((m) =>
            m.id === messageId ? { ...m, isStreaming: false } : m
          ));
          setIsStreaming(false);
          setStreamingMsgId(null);
        },
      },
      onError: (errorMsg) => {
        setMessages((prev) => [...prev, {
          id: generateMessageId(),
          role: 'system',
          content: errorMsg,
          timestamp: Date.now(),
          isError: true,
        }]);
        setIsStreaming(false);
        setStreamingMsgId(null);
      },
      onAgentSwitched: (agentId) => {
        setActiveAgentId(agentId);
      },
      onAuthStatus: (ok, message) => {
        setAuthAlert({ ok, message });
        // Auto-dismiss success after 4s
        if (ok) setTimeout(() => setAuthAlert(null), 4000);
      },
    });
  }, [chatService]);

  // Push auth config to backend whenever WS connects or auth config changes
  useEffect(() => {
    if (isConnected) {
      chatService.setAuthConfig(fullConfig);
    }
  }, [isConnected, fullConfig, chatService]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback((content: string) => {
    const userMsg: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    chatService.sendMessage(content, getContextWindow([...messages, userMsg]));
  }, [chatService, messages]);

  const handleSwitchAgent = useCallback((agentId: string) => {
    setActiveAgentId(agentId);
    chatService.setActiveAgent(agentId);
    chatService.switchAgent(agentId);
  }, [chatService]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Infra sub-views toggle */}
      <div style={{ padding: '8px 16px', borderBottom: `1px solid ${isDark ? '#2a2a2a' : '#e8e8e8'}` }}>
        <Segmented
          value={infraSubView}
          onChange={(v) => setInfraSubView(v as InfraSubView)}
          options={INFRA_SUB_VIEWS}
          size="small"
        />
      </div>

      {/* Backend connection banner — shown when WS is not connected */}
      {!isConnected && (
        <Alert
          type={isConnecting ? 'info' : 'warning'}
          showIcon
          message={
            isConnecting
              ? `Connecting to backend${ws.retryCount > 0 ? ` (attempt ${ws.retryCount})` : ''}…`
              : `Backend not reachable — make sure the server is running on port 8000`
          }
          description={
            !isConnecting ? (
              <span>
                Run: <code>uvicorn hivemind_web.server:app --reload --port 8000</code>
                {' '}then{' '}
                <Button size="small" onClick={ws.reconnect} style={{ marginLeft: 4 }}>
                  Reconnect
                </Button>
              </span>
            ) : undefined
          }
          style={{ margin: '8px 16px 0', borderRadius: 6 }}
        />
      )}

      {/* Auth status banner */}
      {authAlert && (
        <Alert
          type={authAlert.ok ? 'success' : 'error'}
          message={authAlert.ok ? `Bedrock connected — ${authAlert.message}` : `Bedrock auth failed: ${authAlert.message}`}
          showIcon
          closable
          onClose={() => setAuthAlert(null)}
          action={!authAlert.ok ? (
            <Button size="small" icon={<SettingOutlined />} onClick={() => {
              window.dispatchEvent(new CustomEvent('hivemind:open-settings'));
            }}>
              Fix in Settings
            </Button>
          ) : undefined}
          style={{ margin: '8px 16px 0', borderRadius: 6 }}
        />
      )}

      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {messages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Empty
              description={
                <Text type="secondary">
                  {isConnected
                    ? 'Start a conversation with a HiveMind agent'
                    : 'Offline mode — connect to backend for real agent chat'}
                </Text>
              }
            />
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessageComponent
              key={msg.id}
              message={msg}
              isStreaming={msg.id === streamingMsgId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <ChatInput
        onSend={handleSend}
        disabled={isStreaming}
        wsConnected={isConnected}
        activeAgentId={activeAgentId}
        onSwitchAgent={handleSwitchAgent}
      />

      <style>{`
        @keyframes msgSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes cursorBlink {
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
