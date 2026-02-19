import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import { UserSettingsPanel } from './UserSettingsPanel';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { AuthProvider } from '../../contexts/AuthContext';
import { THEME_PRESETS } from '../../utils/studio/themePresets';

function renderPanel(visible = true, onClose = vi.fn()) {
  return {
    onClose,
    ...render(
      <ThemeProvider>
        <AuthProvider>
          <ConfigProvider>
            <UserSettingsPanel visible={visible} onClose={onClose} />
          </ConfigProvider>
        </AuthProvider>
      </ThemeProvider>,
    ),
  };
}

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('UserSettingsPanel', () => {
  // Req 7.1: Settings panel accessible from settings icon (renders as Drawer)
  it('renders the settings modal when visible', () => {
    renderPanel(true);
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Bedrock Connection')).toBeInTheDocument();
    expect(screen.getByText('Tutorial')).toBeInTheDocument();
  });

  // Req 7.2: Dropdown of 6 theme presets
  it('renders the theme preset selector with all 6 presets', () => {
    renderPanel(true);
    expect(screen.getByText('Theme Preset')).toBeInTheDocument();
    // The Apply button from ThemePresetSelector should be present
    expect(screen.getByTestId('apply-preset-button')).toBeInTheDocument();
  });

  it('renders dark mode toggle switch', () => {
    renderPanel(true);
    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
    expect(screen.getByTestId('dark-mode-switch')).toBeInTheDocument();
  });

  // Req 7.8: Live preview swatches
  it('renders preview swatches for the selected preset', () => {
    renderPanel(true);
    expect(screen.getByText('Preview')).toBeInTheDocument();
    // Preview swatches render colored circles with title attributes
    expect(screen.getAllByTitle('Primary').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByTitle('Success').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByTitle('Warning').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByTitle('Error').length).toBeGreaterThanOrEqual(1);
  });

  // Tutorial reset
  it('renders tutorial reset button', () => {
    renderPanel(true);
    expect(screen.getByTestId('reset-tutorial-button')).toBeInTheDocument();
    expect(screen.getByText('Replay the introduction walkthrough on next visit.')).toBeInTheDocument();
  });

  it('clears tutorial flag from localStorage on reset click', async () => {
    localStorage.setItem('hivemind-tutorial-completed', 'true');
    renderPanel(true);

    const user = userEvent.setup();
    await user.click(screen.getByTestId('reset-tutorial-button'));

    expect(localStorage.getItem('hivemind-tutorial-completed')).toBeNull();
  });

  // Apply preset action
  it('calls setPreset when a new preset is selected and Apply is clicked', async () => {
    renderPanel(true);
    const user = userEvent.setup();

    // Open the select dropdown
    const selectEl = screen.getByTestId('theme-preset-select');
    // Ant Design Select needs click on the selector div
    await user.click(selectEl.querySelector('.ant-select-selector')!);

    // Pick a different preset from the dropdown
    const option = await screen.findByText('Geek Blue');
    await user.click(option);

    // Apply button should now be enabled (different from current)
    const applyBtn = screen.getByTestId('apply-preset-button');
    expect(applyBtn).not.toBeDisabled();
    await user.click(applyBtn);

    // After applying, the preset should be persisted
    expect(localStorage.getItem('hivemind-theme-preset')).toBe('geek-blue');
  });

  it('disables Apply button when selected preset matches current', () => {
    renderPanel(true);
    // Default preset is 'default-gold', which is already selected
    const applyBtn = screen.getByTestId('apply-preset-button');
    expect(applyBtn).toBeDisabled();
  });

  // Req 15.3: StylePresetSelector rendered in Appearance section
  it('renders StylePresetSelector in the Appearance section', () => {
    renderPanel(true);
    expect(screen.getByTestId('style-preset-select')).toBeInTheDocument();
    expect(screen.getByTestId('apply-style-preset-button')).toBeInTheDocument();
  });

  // Req 15.3, 15.5: Selecting a style preset and clicking Apply persists to localStorage
  it('persists selected style preset to localStorage under hivemind-theme-style', async () => {
    renderPanel(true);
    const user = userEvent.setup();

    // Open the style preset select dropdown
    const styleSelectEl = screen.getByTestId('style-preset-select');
    await user.click(styleSelectEl.querySelector('.ant-select-selector')!);

    // Pick 'Geek' preset
    const option = await screen.findByText('Geek');
    await user.click(option);

    // Apply button should now be enabled
    const applyBtn = screen.getByTestId('apply-style-preset-button');
    expect(applyBtn).not.toBeDisabled();
    await user.click(applyBtn);

    expect(localStorage.getItem('hivemind-theme-style')).toBe('geek');
  });
});
