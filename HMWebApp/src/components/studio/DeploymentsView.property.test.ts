import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { sortDeploymentsByTimestamp } from '../../services/deploymentService';
import type { DeploymentRecord, DeploymentEvent } from '../../utils/studio/studioTypes';

// --- Arbitraries ---

const deploymentStatusArb = fc.constantFrom<DeploymentRecord['status']>(
  'pending',
  'in-progress',
  'complete',
  'failed',
  'rolled-back',
);

const deploymentEventArb: fc.Arbitrary<DeploymentEvent> = fc.record({
  timestamp: fc.nat({ max: 2_000_000_000_000 }),
  resourceType: fc.constantFrom('AWS::S3::Bucket', 'AWS::Lambda::Function', 'AWS::EC2::Instance', 'AWS::IAM::Role'),
  logicalResourceId: fc.string({ minLength: 1, maxLength: 30 }),
  status: fc.constantFrom('CREATE_IN_PROGRESS', 'CREATE_COMPLETE', 'CREATE_FAILED', 'DELETE_IN_PROGRESS', 'DELETE_COMPLETE'),
  statusReason: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
});

const outputsArb: fc.Arbitrary<Record<string, string>> = fc.dictionary(
  fc.string({ minLength: 1, maxLength: 20 }),
  fc.string({ minLength: 0, maxLength: 50 }),
  { minKeys: 0, maxKeys: 5 },
);

const deploymentRecordArb: fc.Arbitrary<DeploymentRecord> = fc.record({
  deploymentId: fc.uuid(),
  status: deploymentStatusArb,
  timestamp: fc.nat({ max: 2_000_000_000_000 }),
  stackName: fc.string({ minLength: 1, maxLength: 40 }),
  region: fc.constantFrom('us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'),
  events: fc.array(deploymentEventArb, { minLength: 0, maxLength: 10 }),
  outputs: outputsArb,
});

/**
 * Feature: studio-v2-overhaul, Property 11: DeploymentRecord serialization round-trip
 *
 * For any valid DeploymentRecord object (with any combination of status, events, outputs),
 * serializing to JSON and then deserializing back SHALL produce an object with identical
 * field values for deploymentId, status, timestamp, stackName, region, events, and outputs.
 *
 * **Validates: Requirements 11.1, 11.2, 11.3**
 */
describe('Property 11: DeploymentRecord serialization round-trip', () => {
  it('JSON.stringify then JSON.parse produces an equivalent DeploymentRecord', () => {
    fc.assert(
      fc.property(deploymentRecordArb, (record) => {
        const json = JSON.stringify(record);
        const restored: DeploymentRecord = JSON.parse(json);

        expect(restored.deploymentId).toBe(record.deploymentId);
        expect(restored.status).toBe(record.status);
        expect(restored.timestamp).toBe(record.timestamp);
        expect(restored.stackName).toBe(record.stackName);
        expect(restored.region).toBe(record.region);
        expect(restored.events).toEqual(record.events);
        expect(restored.outputs).toEqual(record.outputs);
      }),
      { numRuns: 100 },
    );
  });

  it('serialized form is valid JSON', () => {
    fc.assert(
      fc.property(deploymentRecordArb, (record) => {
        const json = JSON.stringify(record);
        expect(() => JSON.parse(json)).not.toThrow();
      }),
      { numRuns: 100 },
    );
  });

  it('round-trip preserves deep equality of the entire object', () => {
    fc.assert(
      fc.property(deploymentRecordArb, (record) => {
        const restored: DeploymentRecord = JSON.parse(JSON.stringify(record));
        expect(restored).toEqual(record);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: studio-v2-overhaul, Property 12: Deployment records sorted by timestamp descending
 *
 * For any array of DeploymentRecord objects, after sorting for display, for all indices
 * i < j in the sorted array, sortedRecords[i].timestamp >= sortedRecords[j].timestamp
 * (newest first).
 *
 * **Validates: Requirements 6.1, 11.4**
 */
describe('Property 12: Deployment records sorted by timestamp descending', () => {
  it('sortDeploymentsByTimestamp produces descending timestamp order', () => {
    fc.assert(
      fc.property(
        fc.array(deploymentRecordArb, { minLength: 0, maxLength: 50 }),
        (deployments) => {
          const sorted = sortDeploymentsByTimestamp(deployments);

          // Verify descending order
          for (let i = 1; i < sorted.length; i++) {
            expect(sorted[i - 1].timestamp).toBeGreaterThanOrEqual(sorted[i].timestamp);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('sorting preserves all original records (same length, same elements)', () => {
    fc.assert(
      fc.property(
        fc.array(deploymentRecordArb, { minLength: 0, maxLength: 50 }),
        (deployments) => {
          const sorted = sortDeploymentsByTimestamp(deployments);

          // Same length
          expect(sorted).toHaveLength(deployments.length);

          // Every original record appears in the sorted result
          for (const record of deployments) {
            expect(sorted).toContainEqual(record);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('sorting does not mutate the original array', () => {
    fc.assert(
      fc.property(
        fc.array(deploymentRecordArb, { minLength: 1, maxLength: 30 }),
        (deployments) => {
          const originalCopy = [...deployments];
          sortDeploymentsByTimestamp(deployments);

          // Original array should be unchanged
          expect(deployments).toEqual(originalCopy);
        },
      ),
      { numRuns: 100 },
    );
  });
});
