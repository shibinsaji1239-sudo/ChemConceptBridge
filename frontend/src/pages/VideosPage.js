import React, { useEffect, useState } from 'react';

const toYouTubeEmbed = (url) => {
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
  } catch (e) {
    return null;
  }
  return null;
};

// Decode the current user's role from the JWT token.
// Falls back to "student" if anything goes wrong.
const getCurrentRole = () => {
  let role = 'student';
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload && payload.role) {
        role = payload.role;
      }
    }
  } catch (err) {
    // ignore decode errors and keep default
  }
  return role;
};

// Demo / onboarding videos for each role, focused on chemistry concepts.
// We use openly available MP4 samples so they reliably play in the HTML5 player.
const ROLE_DEMO_VIDEOS = {
  admin: [
    {
      title: 'Monitoring Concept Mastery in Acid–Base Chemistry',
      url: 'https://www.youtube.com/watch?v=7p6V_P3jK5U',
      description: 'How to read dashboards that track student understanding of pH, titration curves, and neutralization.',
      type: 'mp4',
      experimentTitle: 'Acid–Base Concepts Overview'
    },
    {
      title: 'Using Data to Improve Conceptual Learning',
      url: 'https://www.youtube.com/watch?v=kR_f60N0uXg',
      description: 'Demo of analytics based on core chemistry topics like thermochemistry, equilibrium, and kinetics.',
      type: 'mp4',
      experimentTitle: 'Concept Analytics for Chemistry'
    }
  ],
  teacher: [
    {
      title: 'Teaching Acid–Base Titration Concepts',
      url: 'https://www.youtube.com/watch?v=N6U8027DMTQ',
      description: 'Concept-focused walkthrough of titration, equivalence point, and indicator choice.',
      type: 'mp4',
      experimentTitle: 'Acid–Base Titration'
    },
    {
      title: 'Explaining Chemical Equilibrium with Simulations',
      url: 'https://www.youtube.com/watch?v=vVIBXk6E5pI',
      description: 'Using virtual experiments to help students visualize Le Châtelier’s principle and dynamic equilibrium.',
      type: 'mp4',
      experimentTitle: 'Chemical Equilibrium'
    }
  ],
  student: [
    {
      title: 'Understanding pH and Acid–Base Reactions',
      url: 'https://www.youtube.com/watch?v=ANi709MYnWg',
      description: 'Visual explanation of pH scale, strong vs. weak acids/bases, and neutralization concepts.',
      type: 'mp4',
      experimentTitle: 'pH and Neutralization'
    },
    {
      title: 'Calorimetry: Measuring Energy Changes',
      url: 'https://www.youtube.com/watch?v=JuWtBR-rDQk',
      description: 'Understanding how we measure heat exchange in chemical reactions using calorimetry.',
      type: 'mp4',
      experimentTitle: 'Calorimetry Basics'
    },
    {
      title: 'Chemical Equilibrium: Le Chatelier’s Principle',
      url: 'https://www.youtube.com/watch?v=7zuUV0S5680',
      description: 'Explore how chemical systems respond to changes in concentration, temperature, and pressure.',
      type: 'mp4',
      experimentTitle: 'Chemical Equilibrium'
    },
    {
      title: 'Stoichiometry and Mole Ratios',
      url: 'https://www.youtube.com/watch?v=SjQG3rJIRwc',
      description: 'Understanding the quantitative relationships in chemical reactions using the mole concept.',
      type: 'mp4',
      experimentTitle: 'Stoichiometry'
    }
  ]
};

export default function VideosPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/experiments', {
          headers: { Authorization: token ? `Bearer ${token}` : '' }
        });
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        if (!mounted) return;

        const agg = [];
        data.forEach((exp) => {
          (exp.videos || []).forEach((v, i) => {
            agg.push({
              experimentId: exp._id || exp.id,
              experimentTitle: exp.title || exp.name,
              video: v,
              index: i,
              embed: toYouTubeEmbed(v.url)
            });
          });
        });

        // Always include role-based demo videos
        const role = getCurrentRole();
        const demoList = ROLE_DEMO_VIDEOS[role] || ROLE_DEMO_VIDEOS.student;
        demoList.forEach((demo, i) => {
          agg.push({
            experimentId: `demo-${role}-${i}`,
            experimentTitle: demo.experimentTitle,
            video: demo,
            index: i,
            embed: toYouTubeEmbed(demo.url)
          });
        });

        setVideos(agg);
      } catch (err) {
        console.error('Videos load failed', err);

        // If API fails for any reason, still show role-based demo videos
        if (mounted) {
          const role = getCurrentRole();
          const demoList = ROLE_DEMO_VIDEOS[role] || ROLE_DEMO_VIDEOS.student;
          const fallback = demoList.map((demo, i) => ({
            experimentId: `demo-${role}-${i}`,
            experimentTitle: demo.experimentTitle,
            video: demo,
            index: i,
            embed: toYouTubeEmbed(demo.url)
          }));
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

  if (loading) return <div className="p-6">Loading videos…</div>;

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
            Curated concept videos from your virtual chemistry lab, tailored to your role.
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
                  {v.embed ? (
                    <iframe
                      title={v.video.title}
                      src={v.embed}
                      width="100%"
                      height="260"
                      frameBorder="0"
                      allowFullScreen
                      style={{ borderRadius: 8 }}
                    />
                  ) : (
                    <video
                      controls
                      style={{
                        width: '100%',
                        borderRadius: 8,
                        backgroundColor: '#000'
                      }}
                    >
                      <source src={v.video.url} />
                      Your browser does not support HTML5 video.
                    </video>
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
