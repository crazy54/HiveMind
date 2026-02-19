/**
 * AuthContext — persists Bedrock auth config to localStorage and exposes it
 * app-wide. The config is sent to the backend on every chat session init.
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { BedrockAuthConfig, AuthMode } from '../utils/studio/studioTypes';

const STORAGE_KEY = 'hivemind-bedrock-auth';

const DEFAULT_AUTH: BedrockAuthConfig = {
  auth_mode: 'env',
  region: 'us-east-1',
  model_id: 'anthropic.claude-sonnet-4-20250514-v1:0',
};

function readStored(): BedrockAuthConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AUTH;
    const parsed = JSON.parse(raw) as Partial<BedrockAuthConfig>;
    // Never persist raw secret keys to localStorage — only mode/region/profile
    return {
      auth_mode: (parsed.auth_mode as AuthMode) ?? 'env',
      region: parsed.region ?? 'us-east-1',
      profile: parsed.profile,
      model_id: parsed.model_id ?? DEFAULT_AUTH.model_id,
      // keys are session-only, never stored
    };
  } catch {
    return DEFAULT_AUTH;
  }
}

function persistSafe(config: BedrockAuthConfig): void {
  try {
    // Strip secrets before persisting
    const safe: BedrockAuthConfig = {
      auth_mode: config.auth_mode,
      region: config.region,
      profile: config.profile,
      model_id: config.model_id,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
  } catch { /* noop */ }
}

interface AuthContextValue {
  authConfig: BedrockAuthConfig;
  setAuthConfig: (config: BedrockAuthConfig) => void;
  /** Runtime-only secrets (access key / secret) — never persisted */
  runtimeSecrets: { access_key_id?: string; secret_access_key?: string; session_token?: string };
  setRuntimeSecrets: (s: { access_key_id?: string; secret_access_key?: string; session_token?: string }) => void;
  /** Full config merged with runtime secrets — use this when sending to backend */
  fullConfig: BedrockAuthConfig;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): ReactNode {
  const [authConfig, setAuthConfigState] = useState<BedrockAuthConfig>(readStored);
  const [runtimeSecrets, setRuntimeSecrets] = useState<{
    access_key_id?: string;
    secret_access_key?: string;
    session_token?: string;
  }>({});

  const setAuthConfig = useCallback((config: BedrockAuthConfig) => {
    setAuthConfigState(config);
    persistSafe(config);
  }, []);

  const fullConfig: BedrockAuthConfig = {
    ...authConfig,
    ...runtimeSecrets,
  };

  return (
    <AuthContext.Provider value={{ authConfig, setAuthConfig, runtimeSecrets, setRuntimeSecrets, fullConfig }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
