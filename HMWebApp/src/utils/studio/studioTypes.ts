// Studio V2 type definitions

// View types for the Studio hub
export type StudioView = 'agents' | 'chat' | 'deployments' | 'logs';
export type InfraSubView = 'architecture' | 'template' | 'cost';

// Chat message roles
export type MessageRole = 'user' | 'assistant' | 'system';

// Chat message
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  agentId?: string;
  agentName?: string;
  isStreaming?: boolean;
  isError?: boolean;
}

// Streaming message types for real LLM chat
export interface StreamChunk {
  type: 'stream_start' | 'stream_chunk' | 'stream_end';
  messageId: string;
  content: string;
  agentId: string;
}

// Agent data from /api/agents
export interface AgentInfo {
  id: string;
  name: string;
  icon: string;
  role: string;
  capabilities: string[];
  status: 'available' | 'busy' | 'unavailable';
}

// Deployment event
export interface DeploymentEvent {
  timestamp: number;
  resourceType: string;
  logicalResourceId: string;
  status: string;
  statusReason?: string;
}

// Deployment record from /api/deployments
export interface DeploymentRecord {
  deploymentId: string;
  status: 'pending' | 'in-progress' | 'complete' | 'failed' | 'rolled-back';
  timestamp: number;
  stackName: string;
  region: string;
  events: DeploymentEvent[];
  outputs: Record<string, string>;
}

// CloudWatch log types
export interface LogGroup {
  name: string;
  arn: string;
  storedBytes: number;
  creationTime: number;
}

export interface LogEvent {
  timestamp: number;
  message: string;
  logStreamName: string;
  ingestionTime: number;
}

export interface LogFilter {
  keyword: string;
  startTime: number | null;
  endTime: number | null;
  logGroupName: string;
}

// Session / API config
export type AuthMode = 'env' | 'profile' | 'keys';

export interface BedrockAuthConfig {
  auth_mode: AuthMode;
  region: string;
  profile?: string;
  access_key_id?: string;
  secret_access_key?: string;
  session_token?: string;
  model_id?: string;
}

export interface SessionConfig {
  provider: 'bedrock' | 'claude' | 'chatgpt';
  apiKey?: string;
  endpoint?: string;
  region?: string;
  bedrockAuth?: BedrockAuthConfig;
}

// WebSocket message types (client -> server)
export interface WsOutgoingMessage {
  type: 'message' | 'switch_agent';
  agent_id: string;
  message?: string;
  include_briefing?: boolean;
  context?: ChatMessage[];
}

// WebSocket message types (server -> client)
export type WsIncomingMessage =
  | { type: 'response'; agent_id: string; message: string; status: string; metrics?: Record<string, unknown> }
  | { type: 'stream_start'; message_id: string; agent_id: string }
  | { type: 'stream_chunk'; message_id: string; content: string }
  | { type: 'stream_end'; message_id: string; agent_id: string; metrics?: Record<string, unknown> }
  | { type: 'error'; message: string }
  | { type: 'agent_switched'; agent_id: string; agent_name: string }
  | { type: 'auth_status'; ok: boolean; message: string };
