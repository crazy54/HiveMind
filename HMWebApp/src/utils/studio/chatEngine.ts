// Mock chat engine — offline fallback when WebSocket is disconnected
import type { ChatMessage } from './studioTypes';

const MOCK_RESPONSES: Record<string, string> = {
  default: "I'm currently in offline mode. Connect to the backend to chat with real HiveMind agents.",
  hello: "Hey there! I'm running in offline mode right now. Once you connect to the backend, I can help with infrastructure design, deployments, and more.",
  help: "In offline mode, I can only provide canned responses. Connect to the backend for real agent capabilities:\n- **Recon**: Scans repos and discovers infrastructure\n- **Conductor**: Orchestrates deployments and workflows\n- **Janitor**: Cleans up unused resources",
  deploy: "Deployment requires a live backend connection. Please check your API settings and ensure the server is running.",
  infrastructure: "I'd love to help design infrastructure, but I need a live backend connection. Start the server and I'll connect automatically.",
};

function findBestResponse(content: string): string {
  const lower = content.toLowerCase();
  for (const [keyword, response] of Object.entries(MOCK_RESPONSES)) {
    if (keyword !== 'default' && lower.includes(keyword)) {
      return response;
    }
  }
  return MOCK_RESPONSES.default;
}

let idCounter = 0;

export function generateMockResponse(userMessage: string, agentId: string): ChatMessage {
  idCounter += 1;
  return {
    id: `mock-${Date.now()}-${idCounter}`,
    role: 'assistant',
    content: findBestResponse(userMessage),
    timestamp: Date.now(),
    agentId,
    agentName: agentId === 'recon' ? 'Recon' : agentId === 'conductor' ? 'Conductor' : 'Janitor',
  };
}
