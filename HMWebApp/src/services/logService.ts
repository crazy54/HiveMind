// LogService — fetches CloudWatch log groups and events from the API
import type { LogGroup, LogEvent, LogFilter } from '../utils/studio/studioTypes';

export async function fetchLogGroups(region?: string): Promise<LogGroup[]> {
  const params = region ? `?region=${encodeURIComponent(region)}` : '';
  const res = await fetch(`/api/logs/groups${params}`);
  if (!res.ok) throw new Error(`Failed to fetch log groups (${res.status})`);
  const data = await res.json();
  return data.groups as LogGroup[];
}

export async function fetchLogEvents(filter: LogFilter): Promise<LogEvent[]> {
  const params = new URLSearchParams();
  params.set('group', filter.logGroupName);
  if (filter.startTime !== null) params.set('start', String(filter.startTime));
  if (filter.endTime !== null) params.set('end', String(filter.endTime));
  if (filter.keyword) params.set('keyword', filter.keyword);

  const res = await fetch(`/api/logs/events?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch log events (${res.status})`);
  const data = await res.json();
  return data.events as LogEvent[];
}

export function filterLogEvents(events: LogEvent[], filter: LogFilter): LogEvent[] {
  let filtered = events;

  if (filter.keyword) {
    const kw = filter.keyword.toLowerCase();
    filtered = filtered.filter((e) => e.message.toLowerCase().includes(kw));
  }

  if (filter.startTime !== null) {
    filtered = filtered.filter((e) => e.timestamp >= filter.startTime!);
  }

  if (filter.endTime !== null) {
    filtered = filtered.filter((e) => e.timestamp <= filter.endTime!);
  }

  return filtered;
}

export function formatLogTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString().replace('T', ' ').replace('Z', '');
}

export function formatLogEvent(event: LogEvent): string {
  return `${formatLogTimestamp(event.timestamp)} [${event.logStreamName}] ${event.message}`;
}

export function createLogStreamSubscription(
  logGroupName: string,
  onEvent: (event: LogEvent) => void,
  onError?: (error: Event) => void,
): { close: () => void } {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws/logs?group=${encodeURIComponent(logGroupName)}`;
  const ws = new WebSocket(wsUrl);

  ws.onmessage = (msgEvent) => {
    try {
      const event = JSON.parse(msgEvent.data) as LogEvent;
      onEvent(event);
    } catch {
      // Ignore malformed messages
    }
  };

  ws.onerror = (err) => {
    onError?.(err);
  };

  return {
    close: () => {
      ws.close();
    },
  };
}
