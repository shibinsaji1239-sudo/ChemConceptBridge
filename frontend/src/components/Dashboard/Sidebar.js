import React from 'react';
import './Sidebar.css';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ user, activeTab, setActiveTab, onLogout }) => {
  const getMenuItems = () => {
    const baseItems = [
      { id: 'overview', label: 'Overview', icon: '📊' },
      { id: 'concepts', label: 'Concepts', icon: '🧪' },
      { id: 'quizzes', label: 'Quizzes', icon: '📝' },
      { id: 'progress', label: 'Progress', icon: '📈' },
      { id: 'subscription', label: 'Subscription', icon: '💳' },
      { id: 'videos', label: 'Videos', icon: '🎬' },
      { id: 'dependency-risk', label: 'Risk Analyzer', icon: '🧠' },
      { id: 'exams', label: 'Exams', icon: '📝' },
      { id: 'chemistry-sandbox', label: 'Lab Sandbox', icon: '🧪' },
      { id: 'reaction-visualizer', label: 'Reaction Visualizer', icon: '⚗️' },
      { id: 'ar-multimedia', label: 'AR & Multimedia', icon: '🎨' },
      { id: 'molecule-animation', label: 'Molecule Animation', icon: '⚛️' },
      { id: 'learning-path', label: 'Learning Path', icon: '📚' },
      { id: 'concept-map', label: 'Concept Map', icon: '🗺️' },
      { id: 'smart-graph', label: 'Smart Graph', icon: '🕸️' },
      { id: 'remediation', label: 'Remediation', icon: '🔧' },
      { id: 'chemistry-calculator', label: 'Chemistry Calculator', icon: '🧮' },
      { id: 'periodic-table', label: 'Periodic Table', icon: '📅' },
      { id: 'chemical-equations', label: 'Chemical Equations', icon: '⚗️' },
      { id: 'revision', label: 'AI Revision', icon: '⏰' },
      { id: 'gamification', label: 'Achievements', icon: '🏆' },
      { id: 'performance-dashboard', label: 'Performance', icon: '📊' },
    ];

    if (user.role === 'student') {
      return [
        ...baseItems,
        { id: 'confidence', label: 'Confidence Meter', icon: '📏' },
      ];
    } else if (user.role === 'teacher') {
      return [
        ...baseItems,
        { id: 'students', label: 'Students', icon: '👥' },
        { id: 'analytics', label: 'Analytics', icon: '📊' },
        { id: 'content', label: 'Content Management', icon: '📚' },
        { id: 'concept-library', label: 'Concept Library', icon: '🧪' },
      ];
    } else if (user.role === 'admin') {
      return [
        ...baseItems,
        { id: 'users', label: 'User Management', icon: '👥' },
        { id: 'analytics', label: 'Analytics', icon: '📊' },
        { id: 'misconceptions', label: 'Misconception Analytics', icon: '🧠' },
        { id: 'system', label: 'System Settings', icon: '⚙️' },
        { id: 'reports', label: 'Reports', icon: '📋' },
        { id: 'content', label: 'Content Management', icon: '📚' },
      ];
    }

    return baseItems;
  };

  const navigate = useNavigate();
  const menuItems = getMenuItems();

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">🧪</span>
          <span className="logo-text">ChemConcept Bridge</span>
        </div>
      </div>

      <div className="sidebar-content">
        <div className="user-info">
          <div className="user-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <div className="user-name">{user.name}</div>
            <div className="user-role">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                if (item.id === 'videos') {
                  if (user.role === 'student') {
                    navigate('/videos');
                    return;
                  }
                  setActiveTab(item.id);
                  return;
                } else {
                  setActiveTab(item.id);
                }
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={onLogout}>
          <span className="logout-icon">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
