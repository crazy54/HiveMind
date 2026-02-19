import type { ReactNode } from 'react';
import { Typography, Table, Tag } from 'antd';

const { Title, Paragraph, Text } = Typography;

const PRESET_DATA = [
  { key: '1', name: 'Default Gold', color: '#D4AF37', description: 'Original HiveMind brand gold' },
  { key: '2', name: 'Geek Blue', color: '#1677ff', description: 'Ant Design default blue' },
  { key: '3', name: 'Sunset Orange', color: '#fa541c', description: 'Warm orange for high-energy feel' },
  { key: '4', name: 'Nature Green', color: '#389e0d', description: 'Earthy green for calm productivity' },
  { key: '5', name: 'Cyber Purple', color: '#722ed1', description: 'Deep purple for tech-forward aesthetic' },
  { key: '6', name: 'Midnight Teal', color: '#13c2c2', description: 'Cool teal for modern minimalism' },
];

const COLUMNS = [
  {
    title: 'Preset',
    dataIndex: 'name',
    key: 'name',
    render: (name: string, record: { color: string }) => (
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 16, height: 16, borderRadius: 4, background: record.color, display: 'inline-block' }} />
        <Text strong>{name}</Text>
      </span>
    ),
  },
  {
    title: 'Primary Color',
    dataIndex: 'color',
    key: 'color',
    render: (color: string) => <Tag color={color}>{color}</Tag>,
  },
  {
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
  },
];

export default function ThemeCustomization(): ReactNode {
  return (
    <Typography>
      <Title level={2}>Theme Customization</Title>
      <Paragraph>
        HiveMind Studio supports dark and light modes with six color presets. Theme preferences
        are saved to your browser and persist across sessions.
      </Paragraph>

      <Title level={3}>Dark / Light Mode</Title>
      <Paragraph>
        Toggle between dark and light mode using the sun/moon icon in the top bar. The mode
        affects background colors, text contrast, and component styling throughout the application.
        Light mode is designed with 4.5:1+ contrast ratios for accessibility.
      </Paragraph>

      <Title level={3}>Theme Presets</Title>
      <Paragraph>
        Theme presets change the primary accent color used across all UI components — buttons,
        links, active states, selection highlights, and progress indicators. Presets are
        independent of dark/light mode.
      </Paragraph>

      <Table
        dataSource={PRESET_DATA}
        columns={COLUMNS}
        pagination={false}
        size="small"
        style={{ marginBottom: 24 }}
      />

      <Title level={3}>Applying a Preset</Title>
      <Paragraph>
        1. Open Settings from the top bar or left icon rail.
      </Paragraph>
      <Paragraph>
        2. In the Theme section, select a preset from the dropdown.
      </Paragraph>
      <Paragraph>
        3. Preview the colors in the swatch display.
      </Paragraph>
      <Paragraph>
        4. Click <Text code>Apply</Text> to activate the preset.
      </Paragraph>

      <Title level={3}>Persistence</Title>
      <Paragraph>
        Both the mode and preset are saved to <Text code>localStorage</Text> under the keys{' '}
        <Text code>hivemind-theme-mode</Text> and <Text code>hivemind-theme-preset</Text>.
        They are restored automatically on the next visit.
      </Paragraph>
    </Typography>
  );
}
