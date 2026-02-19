import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { Select, DatePicker, Input, Typography, Alert, Skeleton, Button, Space } from 'antd';
import { ReloadOutlined, LinkOutlined } from '@ant-design/icons';
import { LogViewer } from './LogViewer';
import {
  fetchLogGroups,
  fetchLogEvents,
  filterLogEvents,
  createLogStreamSubscription,
} from '../../services/logService';
import { useTheme } from '../../contexts/ThemeContext';
import type { LogGroup, LogEvent, LogFilter } from '../../utils/studio/studioTypes';
import type { Dayjs } from 'dayjs';

const { Text } = Typography;
const { RangePicker } = DatePicker;
const { Search } = Input;

export function LogsView(): ReactNode {
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  const [logGroups, setLogGroups] = useState<LogGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [events, setEvents] = useState<LogEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [credentialsError, setCredentialsError] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const [filter, setFilter] = useState<LogFilter>({
    keyword: '',
    startTime: null,
    endTime: null,
    logGroupName: '',
  });

  const streamRef = useRef<{ close: () => void } | null>(null);

  // Load log groups on mount
  const loadLogGroups = useCallback(async () => {
    setGroupsLoading(true);
    setError(null);
    setCredentialsError(false);
    try {
      const groups = await fetchLogGroups();
      setLogGroups(groups);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load log groups';
      if (message.includes('401') || message.includes('403')) {
        setCredentialsError(true);
      } else {
        setError(message);
      }
    } finally {
      setGroupsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogGroups();
  }, [loadLogGroups]);

  // Fetch events when group or time range changes
  const loadEvents = useCallback(async () => {
    if (!selectedGroup) return;
    setLoading(true);
    setError(null);
    try {
      const logFilter: LogFilter = {
        keyword: '',
        startTime: filter.startTime,
        endTime: filter.endTime,
        logGroupName: selectedGroup,
      };
      const data = await fetchLogEvents(logFilter);
      setEvents(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load log events';
      if (message.includes('401') || message.includes('403')) {
        setCredentialsError(true);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedGroup, filter.startTime, filter.endTime]);

  useEffect(() => {
    if (selectedGroup) {
      loadEvents();
    }
  }, [selectedGroup, loadEvents]);

  // Start/stop streaming when group changes
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.close();
      streamRef.current = null;
      setIsStreaming(false);
    }

    if (!selectedGroup) return;

    const sub = createLogStreamSubscription(
      selectedGroup,
      (event) => {
        setEvents((prev) => [...prev, event]);
      },
      () => {
        setIsStreaming(false);
      },
    );
    streamRef.current = sub;
    setIsStreaming(true);

    return () => {
      sub.close();
    };
  }, [selectedGroup]);

  const handleGroupChange = useCallback((value: string) => {
    setSelectedGroup(value);
    setEvents([]);
    setFilter((prev) => ({ ...prev, logGroupName: value }));
  }, []);

  const handleTimeRangeChange = useCallback(
    (dates: [Dayjs | null, Dayjs | null] | null) => {
      setFilter((prev) => ({
        ...prev,
        startTime: dates?.[0]?.valueOf() ?? null,
        endTime: dates?.[1]?.valueOf() ?? null,
      }));
    },
    [],
  );

  const handleKeywordChange = useCallback((value: string) => {
    setFilter((prev) => ({ ...prev, keyword: value }));
  }, []);

  // Apply client-side keyword filter
  const filteredEvents = filter.keyword
    ? filterLogEvents(events, filter)
    : events;

  if (credentialsError) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          type="error"
          message="AWS credentials not configured"
          description={
            <span>
              AWS credentials not configured. Go to{' '}
              <Button type="link" icon={<LinkOutlined />} style={{ padding: 0 }}>
                Settings
              </Button>{' '}
              to configure your API connection.
            </span>
          }
          showIcon
        />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text strong style={{ fontSize: 18 }}>CloudWatch Logs</Text>
        <Button
          size="small"
          icon={<ReloadOutlined />}
          onClick={loadLogGroups}
          loading={groupsLoading}
        >
          Refresh Groups
        </Button>
      </div>

      {error && (
        <Alert
          type="error"
          message={error}
          showIcon
          closable
          onClose={() => setError(null)}
        />
      )}

      <Space wrap size="middle">
        <Select
          placeholder="Select log group"
          style={{ minWidth: 300 }}
          value={selectedGroup}
          onChange={handleGroupChange}
          loading={groupsLoading}
          showSearch
          filterOption={(input, option) =>
            (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={logGroups.map((g) => ({ label: g.name, value: g.name }))}
          notFoundContent={groupsLoading ? <Skeleton.Input active size="small" /> : 'No log groups found'}
        />

        <RangePicker
          showTime
          onChange={handleTimeRangeChange}
          style={{ minWidth: 300 }}
        />

        <Search
          placeholder="Filter by keyword"
          allowClear
          onSearch={handleKeywordChange}
          onChange={(e) => {
            if (!e.target.value) handleKeywordChange('');
          }}
          style={{ minWidth: 200 }}
        />
      </Space>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} active paragraph={{ rows: 1 }} title={false} />
          ))}
        </div>
      ) : (
        <LogViewer
          events={filteredEvents}
          isStreaming={isStreaming}
        />
      )}

      {isStreaming && (
        <div style={{ textAlign: 'center' }}>
          <Text
            type="secondary"
            style={{
              fontSize: 12,
              color: isDark ? '#52c41a' : '#389e0d',
            }}
          >
            ● Live streaming from {selectedGroup}
          </Text>
        </div>
      )}
    </div>
  );
}
