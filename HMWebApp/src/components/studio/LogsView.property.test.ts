import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { filterLogEvents, formatLogEvent, formatLogTimestamp } from '../../services/logService';
import type { LogEvent, LogFilter } from '../../utils/studio/studioTypes';

// --- Arbitraries ---

const logEventArb: fc.Arbitrary<LogEvent> = fc.record({
  timestamp: fc.integer({ min: 0, max: 2_000_000_000_000 }),
  message: fc.string({ minLength: 0, maxLength: 200 }),
  logStreamName: fc.string({ minLength: 1, maxLength: 50 }),
  ingestionTime: fc.integer({ min: 0, max: 2_000_000_000_000 }),
});

const logEventsArb = fc.array(logEventArb, { minLength: 0, maxLength: 30 });

const nonEmptyKeywordArb = fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0);

/**
 * Feature: studio-v2-overhaul, Property 13: Log keyword filter correctness
 *
 * For any array of LogEvent objects and any non-empty keyword string,
 * filtering by keyword SHALL return only events where event.message
 * contains the keyword (case-insensitive). The filtered result SHALL be
 * a subset of the original array, and every event in the filtered result
 * SHALL contain the keyword in its message.
 *
 * **Validates: Requirements 14.4**
 */
describe('Property 13: Log keyword filter correctness', () => {
  it('returns only events whose message contains the keyword (case-insensitive)', () => {
    fc.assert(
      fc.property(logEventsArb, nonEmptyKeywordArb, (events, keyword) => {
        const filter: LogFilter = {
          keyword,
          startTime: null,
          endTime: null,
          logGroupName: 'test-group',
        };

        const result = filterLogEvents(events, filter);

        // Result must be a subset of the original array
        expect(result.length).toBeLessThanOrEqual(events.length);

        const kwLower = keyword.toLowerCase();

        // Every event in the result must contain the keyword (case-insensitive)
        for (const event of result) {
          expect(event.message.toLowerCase()).toContain(kwLower);
        }

        // Every event in the original that contains the keyword must be in the result
        const expectedCount = events.filter((e) =>
          e.message.toLowerCase().includes(kwLower),
        ).length;
        expect(result.length).toBe(expectedCount);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: studio-v2-overhaul, Property 14: Log time-range filter correctness
 *
 * For any array of LogEvent objects and any time range [startTime, endTime],
 * filtering by time range SHALL return only events where
 * startTime <= event.timestamp <= endTime. The filtered result SHALL be
 * a subset of the original array.
 *
 * **Validates: Requirements 14.5**
 */
describe('Property 14: Log time-range filter correctness', () => {
  it('returns only events within [startTime, endTime]', () => {
    fc.assert(
      fc.property(
        logEventsArb,
        fc.integer({ min: 0, max: 2_000_000_000_000 }),
        fc.integer({ min: 0, max: 2_000_000_000_000 }),
        (events, t1, t2) => {
          const startTime = Math.min(t1, t2);
          const endTime = Math.max(t1, t2);

          const filter: LogFilter = {
            keyword: '',
            startTime,
            endTime,
            logGroupName: 'test-group',
          };

          const result = filterLogEvents(events, filter);

          // Result must be a subset
          expect(result.length).toBeLessThanOrEqual(events.length);

          // Every event in the result must be within the time range
          for (const event of result) {
            expect(event.timestamp).toBeGreaterThanOrEqual(startTime);
            expect(event.timestamp).toBeLessThanOrEqual(endTime);
          }

          // Every event in the original within the range must be in the result
          const expectedCount = events.filter(
            (e) => e.timestamp >= startTime && e.timestamp <= endTime,
          ).length;
          expect(result.length).toBe(expectedCount);
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: studio-v2-overhaul, Property 15: Log event display contains required fields
 *
 * For any valid LogEvent object, the formatted display string SHALL contain
 * the event's timestamp (formatted), logStreamName, and message content.
 *
 * **Validates: Requirements 14.7**
 */
describe('Property 15: Log event display contains required fields', () => {
  it('formatLogEvent output contains timestamp, logStreamName, and message', () => {
    fc.assert(
      fc.property(logEventArb, (event) => {
        const formatted = formatLogEvent(event);
        const formattedTimestamp = formatLogTimestamp(event.timestamp);

        // Must contain the formatted timestamp
        expect(formatted).toContain(formattedTimestamp);

        // Must contain the log stream name
        expect(formatted).toContain(event.logStreamName);

        // Must contain the message
        expect(formatted).toContain(event.message);
      }),
      { numRuns: 100 },
    );
  });
});
