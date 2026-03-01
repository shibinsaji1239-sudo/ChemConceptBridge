import React, { useEffect, useState } from 'react';
import api from '../../apiClient';
import { toast } from 'react-toastify';

const defaultSettings = {
  maintenanceMode: false,
  allowRegistration: true,
  conceptMapEnabled: true,
  analyticsEnabled: true,
  chemicalEquationsEnabled: true,
  aiThoughtPathRecorderEnabled: false,
};

const AdminSystemSettings = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/admin/system-settings');
      setSettings({
        maintenanceMode: !!data.maintenanceMode,
        allowRegistration: !!data.allowRegistration,
        conceptMapEnabled: !!data.conceptMapEnabled,
        analyticsEnabled: !!data.analyticsEnabled,
        chemicalEquationsEnabled: !!data.chemicalEquationsEnabled,
        aiThoughtPathRecorderEnabled: !!data.aiThoughtPathRecorderEnabled,
      });
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load system settings');
      toast.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const saveSettings = async () => {
    setSaving(true);
    setError('');
    try {
      const { data } = await api.put('/admin/system-settings', settings);
      setSettings({
        maintenanceMode: !!data.maintenanceMode,
        allowRegistration: !!data.allowRegistration,
        conceptMapEnabled: !!data.conceptMapEnabled,
        analyticsEnabled: !!data.analyticsEnabled,
        chemicalEquationsEnabled: !!data.chemicalEquationsEnabled,
        aiThoughtPathRecorderEnabled: !!data.aiThoughtPathRecorderEnabled,
      });
      toast.success('System settings saved');
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to save settings');
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="header">
          <h2>System Settings</h2>
          <p>Load and manage global system-level controls</p>
        </div>
        <div className="dashboard-card" style={{ minHeight: 180 }}>
          <p>Loading settings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="header">
        <h2>System Settings</h2>
        <p>Manage platform-wide controls and features</p>
      </div>

      {error && (
        <div className="error" role="alert" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      <div className="dashboard-card">
        <h3>Core Controls</h3>
        <div className="status-list">
          <div className="status-item">
            <span className="status-label">Maintenance Mode</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={() => handleToggle('maintenanceMode')}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="status-item">
            <span className="status-label">Allow Registration</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.allowRegistration}
                onChange={() => handleToggle('allowRegistration')}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <h3>Features</h3>
        <div className="status-list">
          <div className="status-item">
            <span className="status-label">Concept Map Enabled</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.conceptMapEnabled}
                onChange={() => handleToggle('conceptMapEnabled')}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="status-item">
            <span className="status-label">Analytics Enabled</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.analyticsEnabled}
                onChange={() => handleToggle('analyticsEnabled')}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="status-item">
            <span className="status-label">Chemical Equations Enabled</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.chemicalEquationsEnabled}
                onChange={() => handleToggle('chemicalEquationsEnabled')}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="status-item">
            <span className="status-label">AI Thought Path Recorder (NLP)</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.aiThoughtPathRecorderEnabled}
                onChange={() => handleToggle('aiThoughtPathRecorderEnabled')}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>
      </div>

      <div className="actions" style={{ display: 'flex', gap: 12 }}>
        <button className="action-btn" disabled={saving} onClick={saveSettings}>
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
        <button className="action-btn" disabled={saving} onClick={loadSettings}>
          Reload
        </button>
      </div>
    </div>
  );
};

export default AdminSystemSettings;