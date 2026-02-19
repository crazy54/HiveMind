import { useRef, useState, useCallback, useEffect } from 'react';
import type { WsIncomingMessage } from '../utils/studio/studioTypes';

export type WsStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface UseWebSocketReturn {
  status: WsStatus;
  send: (data: Record<string, unknown>) => void;
  disconnect: () => void;
  reconnect: () => void;
  lastMessage: WsIncomingMessage | null;
  onMessage: (handler: (msg: WsIncomingMessage) => void) => void;
  retryCount: number;
}

const MAX_DELAY_MS = 16000;
const BASE_DELAY_MS = 1000;

export function useWebSocket(url: string): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const stoppedRef = useRef(false);
  const handlersRef = useRef<Array<(msg: WsIncomingMessage) => void>>([]);
  const [status, setStatus] = useState<WsStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<WsIncomingMessage | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const connect = useCallback(() => {
    if (stoppedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus('connecting');
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        retriesRef.current = 0;
        setRetryCount(0);
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as WsIncomingMessage;
          setLastMessage(parsed);
          handlersRef.current.forEach((h) => h(parsed));
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (stoppedRef.current) {
          setStatus('disconnected');
          return;
        }
        // Keep retrying indefinitely with capped exponential backoff
        const delay = Math.min(BASE_DELAY_MS * Math.pow(2, retriesRef.current), MAX_DELAY_MS);
        retriesRef.current += 1;
        setRetryCount(retriesRef.current);
        setStatus('disconnected');
        setTimeout(connect, delay);
      };

      ws.onerror = () => {
        // onerror always fires before onclose — just mark error state,
        // onclose will handle the retry
        setStatus('error');
      };
    } catch {
      setStatus('error');
      // Retry even on construction failure
      if (!stoppedRef.current) {
        const delay = Math.min(BASE_DELAY_MS * Math.pow(2, retriesRef.current), MAX_DELAY_MS);
        retriesRef.current += 1;
        setRetryCount(retriesRef.current);
        setTimeout(connect, delay);
      }
    }
  }, [url]);

  const send = useCallback((data: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const disconnect = useCallback(() => {
    stoppedRef.current = true;
    wsRef.current?.close();
    wsRef.current = null;
    setStatus('disconnected');
  }, []);

  const reconnect = useCallback(() => {
    stoppedRef.current = false;
    retriesRef.current = 0;
    setRetryCount(0);
    wsRef.current?.close();
    wsRef.current = null;
    connect();
  }, [connect]);

  const onMessage = useCallback((handler: (msg: WsIncomingMessage) => void) => {
    // Avoid duplicate registrations (React StrictMode double-invokes effects)
    if (!handlersRef.current.includes(handler)) {
      handlersRef.current.push(handler);
    }
  }, []);

  useEffect(() => {
    stoppedRef.current = false;
    connect();
    return () => {
      stoppedRef.current = true;
      wsRef.current?.close();
    };
  }, [connect]);

  return { status, send, disconnect, reconnect, lastMessage, onMessage, retryCount };
}
