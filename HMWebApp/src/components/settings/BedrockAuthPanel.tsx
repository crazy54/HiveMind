/**
 * BedrockAuthPanel — configure how HiveMind authenticates to Amazon Bedrock.
 *
 * Three modes:
 *   env     — use whatever boto3 finds (env vars, instance role, ~/.aws/credentials)
 *   profile — named AWS CLI profile from ~/.aws/config
 *   keys    — explicit access key + secret (session-only, never persisted)
 */
import {
  Radio,
  Input,
  Select,
  Typography,
  Space,
  Button,
  Alert,
  Spin,
  Tag,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useState, type ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { AuthMode, BedrockAuthConfig } from '../../utils/studio/studioTypes';

const { Text } = Typography;

const AWS_REGIONS = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-west-2', 'eu-central-1',
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1',
];

const BEDROCK_MODELS = [
  { value: 'anthropic.claude-sonnet-4-20250514-v1:0', label: 'Claude Sonnet 4 (latest)' },
  { value: 'anthropic.claude-3-5-sonnet-20241022-v2:0', label: 'Claude 3.5 Sonnet v2' },
  { value: 'anthropic.claude-3-5-haiku-20241022-v1:0', label: 'Claude 3.5 Haiku' },
  { value: 'anthropic.claude-3-sonnet-20240229-v1:0', label: 'Claude 3 Sonnet' },
  { value: 'amazon.nova-pro-v1:0', label: 'Amazon Nova Pro' },
  { value: 'amazon.nova-lite-v1:0', label: 'Amazon Nova Lite' },
];

type ValidationState = 'idle' | 'checking' | 'ok' | 'error';

function activeLabel(config: BedrockAuthConfig, hasRuntimeKeys: boolean): string {
  if (config.auth_mode === 'profile') return `Profile: ${config.profile ?? '(none)'}`;
  if (config.auth_mode === 'keys') return hasRuntimeKeys ? 'Explicit Keys (set this session)' : 'Explicit Keys (no keys entered yet)';
  return 'Environment / Instance Role';
}

export function BedrockAuthPanel(): ReactNode {
  const { authConfig, setAuthConfig, runtimeSecrets, setRuntimeSecrets } = useAuth();
  const [mode, setMode] = useState<AuthMode>(authConfig.auth_mode);
  const [region, setRegion] = useState(authConfig.region ?? 'us-east-1');
  const [profile, setProfile] = useState(authConfig.profile ?? '');
  const [modelId, setModelId] = useState(authConfig.model_id ?? BEDROCK_MODELS[0].value);

  // Keys — session-only state, never persisted
  const [accessKeyId, setAccessKeyId] = useState(runtimeSecrets.access_key_id ?? '');
  const [secretKey, setSecretKey] = useState(runtimeSecrets.secret_access_key ?? '');
  const [sessionToken, setSessionToken] = useState(runtimeSecrets.session_token ?? '');

  const [validation, setValidation] = useState<ValidationState>('idle');
  const [validationMsg, setValidationMsg] = useState('');

  const hasRuntimeKeys = Boolean(runtimeSecrets.access_key_id && runtimeSecrets.secret_access_key);

  function buildConfig(): BedrockAuthConfig {
    return {
      auth_mode: mode,
      region,
      profile: mode === 'profile' ? profile : undefined,
      model_id: modelId,
    };
  }

  function handleApply(): void {
    const config = buildConfig();
    setAuthConfig(config);
    if (mode === 'keys') {
      setRuntimeSecrets({
        access_key_id: accessKeyId,
        secret_access_key: secretKey,
        session_token: sessionToken || undefined,
      });
    } else {
      setRuntimeSecrets({});
    }
  }

  async function handleValidate(): Promise<void> {
    handleApply();
    setValidation('checking');
    setValidationMsg('');
    try {
      const body: BedrockAuthConfig = {
        ...buildConfig(),
        ...(mode === 'keys' ? {
          access_key_id: accessKeyId,
          secret_access_key: secretKey,
          session_token: sessionToken || undefined,
        } : {}),
      };
      const res = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { ok: boolean; message: string };
      setValidation(data.ok ? 'ok' : 'error');
      setValidationMsg(data.message);
    } catch (err) {
      setValidation('error');
      setValidationMsg(String(err));
    }
  }

  function handleReset(): void {
    localStorage.removeItem('hivemind-bedrock-auth');
    const defaults: BedrockAuthConfig = {
      auth_mode: 'env',
      region: 'us-east-1',
      model_id: BEDROCK_MODELS[0].value,
    };
    setAuthConfig(defaults);
    setRuntimeSecrets({});
    setMode('env');
    setRegion('us-east-1');
    setProfile('');
    setAccessKeyId('');
    setSecretKey('');
    setSessionToken('');
    setModelId(BEDROCK_MODELS[0].value);
    setValidation('idle');
    setValidationMsg('');
  }

  const isDirty =
    mode !== authConfig.auth_mode ||
    region !== authConfig.region ||
    profile !== (authConfig.profile ?? '') ||
    modelId !== (authConfig.model_id ?? '') ||
    (mode === 'keys' && (accessKeyId !== (runtimeSecrets.access_key_id ?? '') || secretKey !== (runtimeSecrets.secret_access_key ?? '')));

  return (
    <div>
      {/* Active config indicator */}
      <Alert
        type="info"
        icon={<InfoCircleOutlined />}
        showIcon
        message={
          <Text style={{ fontSize: 12 }}>
            Active: <Text strong style={{ fontSize: 12 }}>{activeLabel(authConfig, hasRuntimeKeys)}</Text>
            {' · '}{authConfig.region}{' · '}{authConfig.model_id?.split('.').pop()?.split('-v')[0] ?? 'unknown model'}
          </Text>
        }
        style={{ marginBottom: 16, padding: '6px 12px' }}
      />

      {/* Auth mode */}
      <Text strong style={{ display: 'block', marginBottom: 8 }}>Authentication Mode</Text>
      <Radio.Group
        value={mode}
        onChange={(e) => {
          const newMode = e.target.value as AuthMode;
          setMode(newMode);
          setValidation('idle');
          // Auto-apply non-keys mode switches immediately so the WS session updates
          if (newMode !== 'keys') {
            const config: BedrockAuthConfig = {
              auth_mode: newMode,
              region,
              profile: newMode === 'profile' ? profile : undefined,
              model_id: modelId,
            };
            setAuthConfig(config);
            setRuntimeSecrets({});
          }
        }}
        style={{ marginBottom: 16 }}
      >
        <Space direction="vertical" size={4}>
          <Radio value="env">
            <Text>Environment / Instance Role</Text>
            <Text type="secondary" style={{ fontSize: 11, display: 'block', marginLeft: 24 }}>
              Uses AWS_ACCESS_KEY_ID env vars, ~/.aws/credentials, or EC2/ECS instance role
            </Text>
          </Radio>
          <Radio value="profile">
            <Text>AWS Profile</Text>
            <Text type="secondary" style={{ fontSize: 11, display: 'block', marginLeft: 24 }}>
              Named profile from ~/.aws/config
            </Text>
          </Radio>
          <Radio value="keys">
            <Text>Explicit Keys</Text>
            <Text type="secondary" style={{ fontSize: 11, display: 'block', marginLeft: 24 }}>
              Access key + secret — session only, never saved to disk
            </Text>
          </Radio>
        </Space>
      </Radio.Group>

      {/* Profile name */}
      {mode === 'profile' && (
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Profile Name</Text>
          <Input
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            placeholder="e.g. default, dev, prod"
            data-testid="profile-input"
          />
        </div>
      )}

      {/* Explicit keys */}
      {mode === 'keys' && (
        <>
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Access Key ID</Text>
            <Input
              value={accessKeyId}
              onChange={(e) => setAccessKeyId(e.target.value)}
              placeholder="AKIA..."
              data-testid="access-key-input"
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Secret Access Key</Text>
            <Input.Password
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="Secret key"
              data-testid="secret-key-input"
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
              Session Token <Tag style={{ fontSize: 10 }}>optional</Tag>
            </Text>
            <Input.Password
              value={sessionToken}
              onChange={(e) => setSessionToken(e.target.value)}
              placeholder="For temporary credentials (STS)"
              data-testid="session-token-input"
            />
          </div>
        </>
      )}

      {/* Region */}
      <div style={{ marginBottom: 12 }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>AWS Region</Text>
        <Select
          value={region}
          onChange={(val) => setRegion(val)}
          options={AWS_REGIONS.map((r) => ({ value: r, label: r }))}
          style={{ width: '100%' }}
          data-testid="region-select"
        />
      </div>

      {/* Model */}
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Bedrock Model</Text>
        <Select
          value={modelId}
          onChange={(val) => setModelId(val)}
          options={BEDROCK_MODELS}
          style={{ width: '100%' }}
          data-testid="model-select"
        />
      </div>

      {/* Validation result */}
      {validation === 'ok' && (
        <Alert
          type="success"
          icon={<CheckCircleOutlined />}
          message={validationMsg}
          showIcon
          style={{ marginBottom: 12 }}
        />
      )}
      {validation === 'error' && (
        <Alert
          type="error"
          icon={<CloseCircleOutlined />}
          message={validationMsg}
          showIcon
          style={{ marginBottom: 12 }}
        />
      )}

      {/* Actions */}
      <Space wrap>
        <Button
          type="primary"
          onClick={handleValidate}
          disabled={validation === 'checking'}
          icon={validation === 'checking' ? <Spin indicator={<LoadingOutlined />} /> : undefined}
          data-testid="validate-bedrock-btn"
        >
          {validation === 'checking' ? 'Checking…' : 'Test Connection'}
        </Button>
        {isDirty && (
          <Button onClick={handleApply} data-testid="apply-auth-btn">
            Apply
          </Button>
        )}
        <Button
          danger
          onClick={handleReset}
          data-testid="reset-auth-btn"
        >
          Reset
        </Button>
      </Space>
    </div>
  );
}
