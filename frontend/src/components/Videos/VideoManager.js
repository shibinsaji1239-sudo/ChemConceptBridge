import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../apiClient';
import './VideoManager.css';

const initialForm = {
  title: '',
  url: '',
  description: '',
  type: 'youtube',
  experimentTitle: '',
  visibility: 'public'
};

// Same demo videos that are visible on the student Videos page.
// This keeps the experience consistent across student, teacher, and admin dashboards.
const DEMO_VIDEOS = [
  {
    title: 'Understanding pH & Neutralization',
    url: 'https://www.youtube.com/watch?v=ANi709MYnWg',
    description:
      'Visual explanation of pH scale, strong vs. weak acids/bases, and neutralization concepts.',
    type: 'youtube',
    experimentTitle: 'pH and Neutralization'
  },
  {
    title: 'Calorimetry & Energy Changes',
    url: 'https://www.youtube.com/watch?v=JuWtBR-rDQk',
    description:
      'Understanding how we measure heat exchange in chemical reactions using calorimetry.',
    type: 'youtube',
    experimentTitle: 'Calorimetry Basics'
  },
  {
    title: "Le Chatelier's Principle Explained",
    url: 'https://www.youtube.com/watch?v=XmgRRmxS3is',
    description:
      'Explore how chemical systems respond to changes in concentration, temperature, and pressure.',
    type: 'youtube',
    experimentTitle: 'Chemical Equilibrium'
  },
  {
    title: 'Mastering Stoichiometry & Mole Ratios',
    url: 'https://www.youtube.com/watch?v=UL1jmJaUkaQ',
    description:
      'Understanding the quantitative relationships in chemical reactions using the mole concept.',
    type: 'youtube',
    experimentTitle: 'Stoichiometry'
  }
];

const toYouTubeEmbed = (url) => {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.slice(1);
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    return null;
  }
  return null;
};

const VideoManager = ({ role = 'teacher' }) => {
  const [videos, setVideos] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const canCreate = role === 'teacher';
  const canEdit = role === 'teacher';
  const canDelete = role === 'teacher' || role === 'admin';

  const loadVideos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Platform-level videos managed via /videos
      // 2. Per-experiment videos already visible to students in the lab
      const [videosRes, experimentsRes] = await Promise.all([
        api.get('/videos').catch(() => ({ data: [] })),
        api.get('/experiments').catch(() => ({ data: [] }))
      ]);

      const platformVideos = (videosRes.data || []).map((v) => ({
        ...v,
        source: 'platform',
        readOnly: false
      }));

      // Keep experiment-derived videos consistent with the student dashboard:
      // students only see experiments with visibility === 'public'.
      const experimentVideos = [];
      (experimentsRes.data || [])
        .filter((exp) => (exp?.visibility || 'public') === 'public')
        .forEach((exp) => {
        (exp.videos || []).forEach((v, index) => {
          if (!v || !v.url) return;
          experimentVideos.push({
            _id: `exp-${exp._id || exp.id}-${index}`,
            title: v.title || 'Experiment video',
            url: v.url,
            description: v.description,
            type: v.type || 'youtube',
            experimentTitle: exp.title || exp.name || 'Virtual Lab Experiment',
            visibility: 'public',
            source: 'experiment',
            readOnly: true
          });
        });
      });

      // Always include the shared demo videos used on the student dashboard
      const demoVideos = DEMO_VIDEOS.map((v, index) => ({
        _id: `demo-${index}`,
        ...v,
        visibility: 'public',
        source: 'demo',
        readOnly: true
      }));

      setVideos([...platformVideos, ...experimentVideos, ...demoVideos]);
    } catch (e) {
      const message = e?.response?.data?.message || 'Failed to load videos';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canCreate) {
      toast.error('You do not have permission to create or edit videos');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: form.title.trim(),
        url: form.url.trim(),
        description: form.description.trim(),
        type: form.type,
        experimentTitle: form.experimentTitle.trim(),
        visibility: form.visibility
      };

      if (!payload.title || !payload.url) {
        toast.error('Title and URL are required');
        setSaving(false);
        return;
      }

      if (editingId) {
        await api.put(`/videos/${editingId}`, payload);
        toast.success('Video updated');
      } else {
        await api.post('/videos', payload);
        toast.success('Video created');
      }

      setForm(initialForm);
      setEditingId(null);
      await loadVideos();
    } catch (e) {
      const message = e?.response?.data?.message || 'Save failed';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (video) => {
    if (video.readOnly) {
      toast.info('These videos come from experiments or demo content and can be edited there.');
      return;
    }
    if (!canEdit) {
      toast.error('You do not have permission to edit videos');
      return;
    }

    setEditingId(video._id);
    setForm({
      title: video.title || '',
      url: video.url || '',
      description: video.description || '',
      type: video.type || 'youtube',
      experimentTitle: video.experimentTitle || '',
      visibility: video.visibility || 'public'
    });
  };

  const handleDelete = async (id, readOnly) => {
    if (readOnly) {
      toast.info('Experiment and demo videos cannot be deleted here.');
      return;
    }
    if (!canDelete) {
      toast.error('You do not have permission to delete videos');
      return;
    }

    if (!window.confirm('Delete this video?')) return;
    setSaving(true);
    try {
      await api.delete(`/videos/${id}`);
      toast.success('Video deleted');
      await loadVideos();
    } catch (e) {
      const message = e?.response?.data?.message || 'Delete failed';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const previewEmbed = useMemo(() => toYouTubeEmbed(form.url), [form.url]);

  return (
    <div className="dashboard-card">
      <div className="dashboard-card__header">
        <div>
          <h3>{role === 'admin' ? 'Manage Platform Videos' : 'Manage Your Videos'}</h3>
          <p style={{ color: '#6b7280', marginTop: 4 }}>
            Create, update, and remove the concept videos shown to learners.
          </p>
        </div>
        <div>
          <button className="btn ghost" onClick={loadVideos} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="two-column-grid">
        {canCreate ? (
        <div className="form-panel">
          <h4 style={{ marginTop: 0 }}>{editingId ? 'Edit Video' : 'Add Video'}</h4>
          <form onSubmit={handleSubmit} className="form-grid">
            <label>
              <span>Title *</span>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Mastering Stoichiometry"
              />
            </label>
            <label>
              <span>Video URL *</span>
              <input
                type="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </label>
            <label>
              <span>Description</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Short summary learners will see."
              />
            </label>
            <label>
              <span>Experiment Title</span>
              <input
                type="text"
                value={form.experimentTitle}
                onChange={(e) => setForm({ ...form, experimentTitle: e.target.value })}
                placeholder="Which experiment this supports"
              />
            </label>
            <div className="split">
              <label>
                <span>Type</span>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="youtube">YouTube</option>
                  <option value="mp4">MP4 / direct link</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label>
                <span>Visibility</span>
                <select
                  value={form.visibility}
                  onChange={(e) => setForm({ ...form, visibility: e.target.value })}
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </label>
            </div>

            {previewEmbed && (
              <div className="video-preview">
                <span style={{ color: '#6b7280', fontSize: 12 }}>Preview</span>
                <iframe
                  title="Preview"
                  src={previewEmbed}
                  width="100%"
                  height="200"
                  frameBorder="0"
                  allowFullScreen
                  style={{ borderRadius: 8 }}
                />
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn primary" disabled={saving}>
                {saving ? 'Saving…' : editingId ? 'Update Video' : 'Create Video'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => {
                    setEditingId(null);
                    setForm(initialForm);
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
        ) : (
          <div className="form-panel">
            <h4 style={{ marginTop: 0 }}>Video Management</h4>
            <div className="muted">Admins can review and delete videos. Creation and editing are limited to teachers.</div>
          </div>
        )}

        <div className="list-panel">
          <div className="list-header">
            <h4 style={{ margin: 0 }}>Videos ({videos.length})</h4>
            <span style={{ color: '#6b7280', fontSize: 12 }}>
              {role === 'admin' ? 'All platform videos' : 'All available videos'}
            </span>
          </div>

          {loading ? (
            <div className="muted">Loading videos…</div>
          ) : videos.length === 0 ? (
            <div className="muted">No videos yet. Add your first video.</div>
          ) : (
            <div className="video-list">
              {videos.map((v) => (
                <div key={v._id} className="video-row">
                  <div className="video-meta">
                    <div className="video-title">{v.title}</div>
                    <div className="video-sub">
                      <span>{v.experimentTitle || 'General'}</span>
                      <span className={`pill ${v.visibility === 'public' ? 'success' : 'muted'}`}>
                        {v.visibility}
                      </span>
                      <span className="pill soft">{v.type || 'youtube'}</span>
                    </div>
                    {v.description && (
                      <div className="video-desc">{v.description}</div>
                    )}
                    <a href={v.url} target="_blank" rel="noreferrer" className="video-link">
                      Open source ↗
                    </a>
                  </div>
                  <div className="video-actions">
                    {!v.readOnly && (
                      <>
                        {canEdit && (
                          <button className="btn ghost" onClick={() => handleEdit(v)} disabled={saving}>
                            Edit
                          </button>
                        )}
                        {canDelete && (
                          <button
                            className="btn danger"
                            onClick={() => handleDelete(v._id, v.readOnly)}
                            disabled={saving}
                          >
                            Delete
                          </button>
                        )}
                      </>
                    )}
                    {v.readOnly && (
                      <span className="pill soft" style={{ fontSize: 12 }}>
                        {v.source === 'experiment' ? 'From experiments' : 'Demo video'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoManager;
