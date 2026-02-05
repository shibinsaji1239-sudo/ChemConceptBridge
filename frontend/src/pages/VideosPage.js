import React, { useEffect, useState } from 'react';
import api from '../apiClient';

const toYouTubeEmbed = (url) => {
  if (!url) return null;
  try {
    const u = new URL(url);

    const origin =
      typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';

    const buildEmbed = (id) => {
      // Using youtube-nocookie and minimal params for better compatibility on localhost
      return `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
    };

    if (u.hostname.includes('youtube.com')) {
      // watch?v=...
      const v = u.searchParams.get('v');
      if (v) return buildEmbed(v);

      // /shorts/<id>
      const shorts = u.pathname.match(/\/shorts\/([^/]+)/);
      if (shorts?.[1]) return buildEmbed(shorts[1]);

      // /embed/<id>
      const embed = u.pathname.match(/\/embed\/([^/]+)/);
      if (embed?.[1]) return buildEmbed(embed[1]);
    }

    if (u.hostname === 'youtu.be') {
      const id = u.pathname.slice(1);
      if (id) return buildEmbed(id);
    }
  } catch (e) {
    return null;
  }
  return null;
};

// Demo / onboarding videos - same for all roles (students, teachers, and admins)
// We use openly available MP4 samples so they reliably play in the HTML5 player.
const DEMO_VIDEOS = [
  {
    title: 'Understanding pH & Neutralization',
    url: 'https://www.youtube.com/watch?v=ANi709MYnWg',
    description: 'Visual explanation of pH scale, strong vs. weak acids/bases, and neutralization concepts.',
    type: 'youtube',
    experimentTitle: 'pH and Neutralization'
  },
  {
    title: 'Calorimetry & Energy Changes',
    url: 'https://www.youtube.com/watch?v=JuWtBR-rDQk',
    description: 'Understanding how we measure heat exchange in chemical reactions using calorimetry.',
    type: 'youtube',
    experimentTitle: 'Calorimetry Basics'
  },
  {
    title: "Le Chatelier's Principle Explained",
    url: 'https://www.youtube.com/watch?v=XmgRRmxS3is',
    description: 'Explore how chemical systems respond to changes in concentration, temperature, and pressure.',
    type: 'youtube',
    experimentTitle: 'Chemical Equilibrium'
  },
  {
    title: 'Mastering Stoichiometry & Mole Ratios',
    url: 'https://www.youtube.com/watch?v=UL1jmJaUkaQ',
    description: 'Understanding the quantitative relationships in chemical reactions using the mole concept.',
    type: 'youtube',
    experimentTitle: 'Stoichiometry'
  }
];

export default function VideosPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Students: show (1) experiment videos + (2) platform videos + (3) demo videos
        const [experimentsRes, platformVideosRes] = await Promise.all([
          api.get('/experiments'),
          api.get('/videos')
        ]);

        const data = experimentsRes.data || [];
        const platformVideos = platformVideosRes.data || [];
        if (!mounted) return;

        const agg = [];
        data.forEach((exp) => {
          (exp.videos || []).forEach((v, i) => {
            if (!v || !v.url) {
              console.warn('Skipping video with missing URL:', v);
              return;
            }
            const embed = toYouTubeEmbed(v.url);
            if (embed) {
              agg.push({
                experimentId: exp._id || exp.id,
                experimentTitle: exp.title || exp.name,
                video: v,
                index: i,
                embed: embed
              });
            } else if (v.type === 'youtube') {
              console.warn('Failed to convert YouTube URL to embed:', v.url);
            }
          });
        });

        // Include platform videos (backend already filters to public for students)
        platformVideos.forEach((v, i) => {
          if (!v || !v.url) {
            console.warn('Skipping platform video with missing URL:', v);
            return;
          }
          const embed = toYouTubeEmbed(v.url);
          if (embed) {
            agg.push({
              experimentId: `platform-${v._id || i}`,
              experimentTitle: v.experimentTitle || 'General',
              video: v,
              index: i,
              embed: embed
            });
          } else if (v.type === 'youtube') {
            console.warn('Failed to convert platform YouTube URL to embed:', v.url);
          }
        });

        // Always include demo videos
        const demoList = DEMO_VIDEOS;
        demoList.forEach((demo, i) => {
          const embed = toYouTubeEmbed(demo.url);
          if (embed) {
            agg.push({
              experimentId: `demo-${i}`,
              experimentTitle: demo.experimentTitle,
              video: demo,
              index: i,
              embed: embed
            });
          }
        });

        setVideos(agg);
      } catch (err) {
        console.error('Videos load failed', err);

        // If API fails for any reason, still show demo videos
        if (mounted) {
          const demoList = DEMO_VIDEOS;
          const fallback = [];
          demoList.forEach((demo, i) => {
            const embed = toYouTubeEmbed(demo.url);
            if (embed) {
              fallback.push({
                experimentId: `demo-${i}`,
                experimentTitle: demo.experimentTitle,
                video: demo,
                index: i,
                embed: embed
              });
            }
          });
          setVideos(fallback);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <div className="p-6">Loading videos</div>;

  return (
    <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh', padding: '32px 0' }}>
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px'
        }}
      >
        <header style={{ marginBottom: 24, borderBottom: '1px solid #e5e7eb', paddingBottom: 12 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: '#111827', margin: 0 }}>
            All Experiment Videos
          </h2>
          <p style={{ marginTop: 6, color: '#6b7280', fontSize: 14 }}>
            Curated concept videos from your virtual chemistry lab.
          </p>
        </header>

        {videos.length === 0 && (
          <p style={{ color: '#6b7280', fontSize: 14 }}>No videos found.</p>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 0.8fr)',
            gap: 24,
            alignItems: 'flex-start'
          }}
        >
          <div>
            {videos.map((v, idx) => (
              <article
                key={idx}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 10,
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 10px 15px -10px rgba(15, 23, 42, 0.15)',
                  padding: 16,
                  marginBottom: 16
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 18,
                      fontWeight: 600,
                      color: '#111827'
                    }}
                  >
                    {v.video.title}
                  </h3>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 13,
                      color: '#6b7280',
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 8
                    }}
                  >
                    <span>{v.experimentTitle}</span>
                    <span style={{ fontStyle: 'italic' }}>Concept video</span>
                  </div>
                </div>

                {v.video.description && (
                  <p style={{ marginTop: 4, marginBottom: 12, fontSize: 14, color: '#374151' }}>
                    {v.video.description}
                  </p>
                )}

                <div>
                  {v.embed && (
                    <iframe
                      title={v.video.title}
                      src={v.embed}
                      width="100%"
                      height="260"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      style={{ borderRadius: 8 }}
                      onError={(e) => {
                        console.error('Video embed error:', v.video.url);
                      }}
                    />
                  )}
                </div>
              </article>
            ))}
          </div>

          <aside
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 10,
              border: '1px solid #e5e7eb',
              padding: 16,
              boxShadow: '0 10px 15px -10px rgba(15, 23, 42, 0.1)'
            }}
          >
            <h4
              style={{
                marginTop: 0,
                marginBottom: 8,
                fontSize: 16,
                fontWeight: 600,
                color: '#111827'
              }}
            >
              Viewing tips
            </h4>
            <ul style={{ paddingLeft: 20, margin: 0, fontSize: 14, color: '#4b5563' }}>
              <li style={{ marginBottom: 6 }}>
                Use a stable internet connection for smooth playback of the concept videos.
              </li>
              <li style={{ marginBottom: 6 }}>
                Pause and replay key sections when new chemistry ideas are introduced.
              </li>
              <li>
                Keep your notebook open and link each video to the corresponding virtual lab
                experiment.
              </li>
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}
