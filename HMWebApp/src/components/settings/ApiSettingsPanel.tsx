import { Radio, Input, Select, Typography, Space } from 'antd';
import { useState, type ReactNode } from 'react';
import type { SessionConfig } from '../../utils/studio/studioTypes';

const { Text } = Typography;

const AWS_REGIONS = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-west-2', 'eu-central-1',
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1',
];

interface ApiSettingsPanelProps {
  config?: SessionConfig;
  onChange?: (config: SessionConfig) => void;
}

export function ApiSettingsPanel({ config, onChange }: ApiSettingsPanelProps): ReactNode {
  const [provider, setProvider] = useState<SessionConfig['provider']>(config?.provider ?? 'bedrock');
  const [apiKey, setApiKey] = useState(config?.apiKey ?? '');
  const [endpoint, setEndpoint] = useState(config?.endpoint ?? '');
  const [region, setRegion] = useState(config?.region ?? 'us-east-1');

  const handleChange = (updates: Partial<SessionConfig>): void => {
    const updated: SessionConfig = { provider, apiKey, endpoint, region, ...updates };
    if (updates.provider !== undefined) setProvider(updates.provider);
    if (updates.apiKey !== undefined) setApiKey(updates.apiKey);
    if (updates.endpoint !== undefined) setEndpoint(updates.endpoint);
    if (updates.region !== undefined) setRegion(updates.region);
    onChange?.(updated);
  };

  return (
    <div>
      <Text strong style={{ display: 'block', marginBottom: 12 }}>LLM Provider</Text>
      <Radio.Group
        value={provider}
        onChange={(e) => handleChange({ provider: e.target.value })}
        style={{ marginBottom: 16 }}
      >
        <Space direction="vertical">
          <Radio value="bedrock">Amazon Bedrock</Radio>
          <Radio value="claude">Claude API</Radio>
          <Radio value="chatgpt">ChatGPT API</Radio>
        </Space>
      </Radio.Group>

      {(provider === 'claude' || provider === 'chatgpt') && (
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>API Key</Text>
          <Input.Password
            value={apiKey}
            onChange={(e) => handleChange({ apiKey: e.target.value })}
            placeholder="Enter API key"
            data-testid="api-key-input"
          />
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Endpoint (optional)</Text>
        <Input
          value={endpoint}
          onChange={(e) => handleChange({ endpoint: e.target.value })}
          placeholder="Custom endpoint URL"
          data-testid="endpoint-input"
        />
      </div>

      {provider === 'bedrock' && (
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>AWS Region</Text>
          <Select
            value={region}
            onChange={(val) => handleChange({ region: val })}
            options={AWS_REGIONS.map((r) => ({ value: r, label: r }))}
            style={{ width: '100%' }}
            data-testid="region-select"
          />
        </div>
      )}
    </div>
  );
}
