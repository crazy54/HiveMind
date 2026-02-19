// DeploymentService — fetches deployment records and events from the API
import type { DeploymentRecord, DeploymentEvent } from '../utils/studio/studioTypes';

export async function fetchDeployments(): Promise<DeploymentRecord[]> {
  const res = await fetch('/api/deployments');
  if (!res.ok) throw new Error(`Failed to fetch deployments (${res.status})`);
  const data: DeploymentRecord[] = await res.json();
  return data;
}

export async function fetchDeploymentEvents(deploymentId: string): Promise<DeploymentEvent[]> {
  const res = await fetch(`/api/deployments/${deploymentId}/events`);
  if (!res.ok) throw new Error(`Failed to fetch events for deployment ${deploymentId} (${res.status})`);
  const data: DeploymentEvent[] = await res.json();
  return data;
}

export function sortDeploymentsByTimestamp(deployments: DeploymentRecord[]): DeploymentRecord[] {
  return [...deployments].sort((a, b) => b.timestamp - a.timestamp);
}
