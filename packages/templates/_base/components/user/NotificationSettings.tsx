import * as React from "react";

import { Button } from "../ui/Button";

/**
 * 通知设置组件
 * 支持按渠道（邮件/短信/站内）和事件类型分别开关
 */

export type NotifyChannel = "email" | "sms" | "inApp";

export interface NotificationSettingsValue {
  channels: Record<NotifyChannel, boolean>;
  events: Record<string, Record<NotifyChannel, boolean>>;
}

export interface NotificationSettingsProps {
  defaultValues?: NotificationSettingsValue;
  events?: { key: string; label: string }[];
  onSubmit?: (values: NotificationSettingsValue) => Promise<void> | void;
  loading?: boolean;
}

const channelLabels: Record<NotifyChannel, string> = {
  email: "邮件",
  sms: "短信",
  inApp: "站内",
};

export function NotificationSettings({
  defaultValues,
  events = [],
  onSubmit,
  loading,
}: NotificationSettingsProps) {
  const [values, setValues] = React.useState<NotificationSettingsValue>(
    defaultValues ?? {
      channels: { email: true, sms: false, inApp: true },
      events: Object.fromEntries(
        events.map((e) => [
          e.key,
          { email: true, sms: false, inApp: true },
        ]),
      ),
    },
  );
  const [saved, setSaved] = React.useState(false);

  const toggleChannel = (channel: NotifyChannel) => {
    setValues((prev) => ({
      ...prev,
      channels: { ...prev.channels, [channel]: !prev.channels[channel] },
    }));
    setSaved(false);
  };

  const toggleEventChannel = (
    eventKey: string,
    channel: NotifyChannel,
  ) => {
    setValues((prev) => ({
      ...prev,
      events: {
        ...prev.events,
        [eventKey]: {
          ...prev.events[eventKey],
          [channel]: !prev.events[eventKey]?.[channel],
        },
      },
    }));
    setSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit?.(values);
      setSaved(true);
    } catch {
      // 错误由调用方处理
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-xl flex-col gap-6">
      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">总开关</h3>
        <div className="flex flex-wrap gap-4">
          {(Object.keys(channelLabels) as NotifyChannel[]).map((ch) => (
            <label
              key={ch}
              className="flex items-center gap-2 text-sm text-gray-700"
            >
              <input
                type="checkbox"
                checked={values.channels[ch]}
                onChange={() => toggleChannel(ch)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              {channelLabels[ch]}
            </label>
          ))}
        </div>
      </section>
      {events.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            事件通知
          </h3>
          <div className="overflow-hidden rounded-md border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium text-gray-600">事件</th>
                  {(Object.keys(channelLabels) as NotifyChannel[]).map((ch) => (
                    <th
                      key={ch}
                      className="px-3 py-2 text-center font-medium text-gray-600"
                    >
                      {channelLabels[ch]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {events.map((ev) => (
                  <tr key={ev.key}>
                    <td className="px-3 py-2 text-gray-800">{ev.label}</td>
                    {(Object.keys(channelLabels) as NotifyChannel[]).map((ch) => (
                      <td key={ch} className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(values.events[ev.key]?.[ch])}
                          onChange={() => toggleEventChannel(ev.key, ch)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {saved && <p className="text-sm text-green-600">设置已保存</p>}
      <Button type="submit" loading={loading} className="self-start">
        保存设置
      </Button>
    </form>
  );
}
