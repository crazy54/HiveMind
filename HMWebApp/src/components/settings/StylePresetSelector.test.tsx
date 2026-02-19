import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StylePresetSelector } from './StylePresetSelector';
import { THEME_STYLE_PRESETS } from '../../utils/studio/themePresets';

describe('StylePresetSelector', () => {
  it('renders the select element in the DOM', () => {
    render(<StylePresetSelector currentStylePreset="default" onSelect={vi.fn()} />);
    expect(screen.getByTestId('style-preset-select')).toBeInTheDocument();
  });

  it('renders the Apply button in the DOM', () => {
    render(<StylePresetSelector currentStylePreset="default" onSelect={vi.fn()} />);
    expect(screen.getByTestId('apply-style-preset-button')).toBeInTheDocument();
  });

  it('Apply button is disabled when selection matches current preset', () => {
    render(<StylePresetSelector currentStylePreset="default" onSelect={vi.fn()} />);
    const button = screen.getByTestId('apply-style-preset-button');
    expect(button).toBeDisabled();
  });

  it('Apply button is enabled after selecting a different preset', () => {
    const { container } = render(
      <StylePresetSelector currentStylePreset="default" onSelect={vi.fn()} />
    );

    // Trigger the Select's onChange by finding the internal select element
    const selectEl = container.querySelector('.ant-select-selector');
    expect(selectEl).toBeTruthy();

    // Open the dropdown
    fireEvent.mouseDown(selectEl!);

    // Find and click the 'geek' option
    const geekOption = screen.getByText('Geek');
    fireEvent.click(geekOption);

    const button = screen.getByTestId('apply-style-preset-button');
    expect(button).not.toBeDisabled();
  });

  it('calls onSelect with the correct preset name when Apply is clicked', () => {
    const onSelect = vi.fn();
    const { container } = render(
      <StylePresetSelector currentStylePreset="default" onSelect={onSelect} />
    );

    // Open the dropdown and select 'mui'
    const selectEl = container.querySelector('.ant-select-selector');
    fireEvent.mouseDown(selectEl!);
    fireEvent.click(screen.getByText('MUI'));

    fireEvent.click(screen.getByTestId('apply-style-preset-button'));
    expect(onSelect).toHaveBeenCalledWith('mui');
  });

  it('renders preview pills for all presets in the options', () => {
    render(<StylePresetSelector currentStylePreset="default" onSelect={vi.fn()} />);

    // Open the dropdown to render all options
    const selectEl = document.querySelector('.ant-select-selector');
    fireEvent.mouseDown(selectEl!);

    // Each preset should have at least one preview pill rendered (selected item + dropdown option)
    for (const preset of Object.values(THEME_STYLE_PRESETS)) {
      const pills = screen.getAllByTestId(`style-preview-pill-${preset.name}`);
      expect(pills.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('does not call onSelect when Apply is clicked while disabled', () => {
    const onSelect = vi.fn();
    render(<StylePresetSelector currentStylePreset="default" onSelect={onSelect} />);

    const button = screen.getByTestId('apply-style-preset-button');
    fireEvent.click(button);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
