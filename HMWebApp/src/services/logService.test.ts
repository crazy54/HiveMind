import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchLogGroups,
  fetchLogEvents,
  filterLogEvents,
  formatLogTimestamp,
  formatLogEvent,
} from './logService';
import type { LogEvent, LogFilter } from '../utils/studio/studioTypes';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('fetchLogGroups', () => {
  it('fetches log groups from API', async () => {
    const mockGroups = [
      { name: '/aws/lambda/my-fn', arn: 'arn:aws:logs:us-east-1:123:log-group:/aws/lambda/my-fn', storedBytes: 1024, creationTime: 1700000000000 },
    ];
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ groups: mockGroups }),
    } as Response);

    const groups = await fetchLogGroups();
    expect(groups).toEqual(mockGroups);
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/logs/groups');
  });

  it('passes region as query param', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ groups: [] }),
    } as Response);

    await fetchLogGroups('us-west-2');
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/logs/groups?region=us-west-2');
  });

  it('throws on non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 403,
    } as Response);

    await expect(fetchLogGroups()).rejects.toThrow('Failed to fetch log groups (403)');
  });
});

describe('fetchLogEvents', () => {
  it('fetches events with filter params', async () => {
    const mockEvents = [
      { timestamp: 1700000000000, message: 'test log', logStreamName: 'stream-1', ingestionTime: 1700000001000 },
    ];
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ events: mockEvents }),
    } as Response);

    const filter: LogFilter = {
      keyword: 'error',
      startTime: 1700000000000,
      endTime: 1700001000000,
      logGroupName: '/aws/lambda/my-fn',
    };
    const events = await fetchLogEvents(filter);
    expect(events).toEqual(mockEvents);

    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain('group=%2Faws%2Flambda%2Fmy-fn');
    expect(calledUrl).toContain('start=1700000000000');
    expect(calledUrl).toContain('end=1700001000000');
    expect(calledUrl).toContain('keyword=error');
  });

  it('omits null time params', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ events: [] }),
    } as Response);

    const filter: LogFilter = { keyword: '', startTime: null, endTime: null, logGroupName: 'test' };
    await fetchLogEvents(filter);

    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).not.toContain('start=');
    expect(calledUrl).not.toContain('end=');
    expect(calledUrl).not.toContain('keyword=');
  });

  it('throws on non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    const filter: LogFilter = { keyword: '', startTime: null, endTime: null, logGroupName: 'test' };
    await expect(fetchLogEvents(filter)).rejects.toThrow('Failed to fetch log events (500)');
  });
});

describe('filterLogEvents', () => {
  const events: LogEvent[] = [
    { timestamp: 1000, message: 'ERROR: something failed', logStreamName: 's1', ingestionTime: 1001 },
    { timestamp: 2000, message: 'INFO: all good', logStreamName: 's1', ingestionTime: 2001 },
    { timestamp: 3000, message: 'WARN: check this error', logStreamName: 's2', ingestionTime: 3001 },
    { timestamp: 4000, message: 'DEBUG: trace info', logStreamName: 's2', ingestionTime: 4001 },
  ];

  it('filters by keyword case-insensitively', () => {
    const filter: LogFilter = { keyword: 'error', startTime: null, endTime: null, logGroupName: 'g' };
    const result = filterLogEvents(events, filter);
    expect(result).toHaveLength(2);
    expect(result[0].message).toContain('ERROR');
    expect(result[1].message).toContain('error');
  });

  it('filters by time range', () => {
    const filter: LogFilter = { keyword: '', startTime: 1500, endTime: 3000, logGroupName: 'g' };
    const result = filterLogEvents(events, filter);
    expect(result).toHaveLength(2);
    expect(result[0].timestamp).toBe(2000);
    expect(result[1].timestamp).toBe(3000);
  });

  it('combines keyword and time range filters', () => {
    const filter: LogFilter = { keyword: 'error', startTime: 2500, endTime: 4000, logGroupName: 'g' };
    const result = filterLogEvents(events, filter);
    expect(result).toHaveLength(1);
    expect(result[0].timestamp).toBe(3000);
  });

  it('returns all events when no filters applied', () => {
    const filter: LogFilter = { keyword: '', startTime: null, endTime: null, logGroupName: 'g' };
    const result = filterLogEvents(events, filter);
    expect(result).toHaveLength(4);
  });

  it('returns empty array when no events match', () => {
    const filter: LogFilter = { keyword: 'nonexistent', startTime: null, endTime: null, logGroupName: 'g' };
    const result = filterLogEvents(events, filter);
    expect(result).toHaveLength(0);
  });
});

describe('formatLogTimestamp', () => {
  it('formats timestamp as ISO-like string without T and Z', () => {
    const ts = new Date('2024-01-15T10:30:00.000Z').getTime();
    const formatted = formatLogTimestamp(ts);
    expect(formatted).toBe('2024-01-15 10:30:00.000');
  });
});

describe('formatLogEvent', () => {
  it('includes timestamp, stream name, and message', () => {
    const event: LogEvent = {
      timestamp: new Date('2024-01-15T10:30:00.000Z').getTime(),
      message: 'Test log message',
      logStreamName: 'my-stream',
      ingestionTime: 0,
    };
    const formatted = formatLogEvent(event);
    expect(formatted).toContain('2024-01-15 10:30:00.000');
    expect(formatted).toContain('[my-stream]');
    expect(formatted).toContain('Test log message');
  });
});
