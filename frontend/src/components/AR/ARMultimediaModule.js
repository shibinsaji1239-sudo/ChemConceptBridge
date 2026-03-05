import React, { useState, useEffect } from 'react';
 import { useNavigate } from 'react-router-dom';
 import api from '../../apiClient';
 import MoleculeAnimation from './MoleculeAnimation';
 import LabSimulation from '../LabSimulation/LabSimulation';
 import ReactionVisualizer from '../ReactionVisualizer/ReactionVisualizer';
 import './ARMultimediaModule.css';
 
 
 const ARMultimediaModule = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
 
 
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const response = await api.get('/user/profile');
        const user = response.data;
        const allowedPlans = ['pro', 'teacher'];
        setHasAccess(allowedPlans.includes(user.subscription.plan) && user.subscription.status === 'active');
      } catch (error) {
        console.error('Error checking subscription:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };
 
 
    checkSubscription();
  }, []);
 
 
  const modules = [
    {
      id: 'molecules',
      name: '3D Molecule Viewer',
      icon: '⚛️',
      description: 'Explore interactive 3D molecular structures with multiple viewing modes',
      component: MoleculeAnimation
    },
    {
      id: 'lab',
      name: 'Virtual Lab Simulation',
      icon: '🧪',
      description: 'Conduct safe, interactive chemistry experiments in a virtual environment',
      component: LabSimulation
    },
    {
      id: 'reactions',
      name: 'Reaction Visualizer',
      icon: '⚗️',
      description: 'Visualize atomic rearrangement and energy changes in chemical reactions',
      component: ReactionVisualizer
    }
  ];
 
 
  const renderContent = () => {
    if (activeTab === 'overview') {
      return (
        <div className="overview-content">
          <div className="welcome-section">
            <h2>Welcome to AR & Multimedia Learning</h2>
            <p>
              Explore chemistry through interactive 3D visualizations, virtual lab experiments,
              and animated chemical reactions. Select a module to get started!
            </p>
          </div>
 
 
          <div className="modules-grid">
            {modules.map((module) => (
              <div
                key={module.id}
                className="module-card"
                onClick={() => setActiveTab(module.id)}
              >
                <div className="module-icon">{module.icon}</div>
                <h3>{module.name}</h3>
                <p>{module.description}</p>
                <button className="explore-btn">Explore →</button>
              </div>
            ))}
          </div>
 
 
          <div className="features-section">
            <h3>Key Features</h3>
            <div className="features-grid">
              <div className="feature">
                <div className="feature-icon">🔬</div>
                <h4>Interactive 3D Models</h4>
                <p>Rotate, zoom, and manipulate molecular structures in real-time</p>
              </div>
              <div className="feature">
                <div className="feature-icon">📊</div>
                <h4>Real-time Visualization</h4>
                <p>Watch chemical processes happen step-by-step with animations</p>
              </div>
              <div className="feature">
                <div className="feature-icon">🎮</div>
                <h4>Safe Experimentation</h4>
                <p>Conduct experiments without risk or cleanup</p>
              </div>
              <div className="feature">
                <div className="feature-icon">📈</div>
                <h4>Educational Content</h4>
                <p>Learn properties, reactions, and energetics of chemicals</p>
              </div>
              <div className="feature">
                <div className="feature-icon">🎯</div>
                <h4>Self-Paced Learning</h4>
                <p>Explore at your own pace with detailed explanations</p>
              </div>
              <div className="feature">
                <div className="feature-icon">💾</div>
                <h4>Track Progress</h4>
                <p>Save your observations and review your learning journey</p>
              </div>
            </div>
          </div>
 
 
          <div className="learning-tips">
            <h3>📚 Learning Tips</h3>
            <div className="tips-grid">
              <div className="tip">
                <h4>🎓 For Molecule Viewer</h4>
                <ul>
                  <li>Start with simple molecules like H₂O and CH₄</li>
                  <li>Try different viewing modes (stick, ball & stick, space fill)</li>
                  <li>Rotate molecules to understand their 3D geometry</li>
                  <li>Compare molecular shapes and bonding patterns</li>
                </ul>
              </div>
              <div className="tip">
                <h4>🧪 For Virtual Lab</h4>
                <ul>
                  <li>Read safety precautions before starting</li>
                  <li>Follow procedure steps in order</li>
                  <li>Make detailed observations at each step</li>
                  <li>Understand the chemistry behind the experiment</li>
                </ul>
              </div>
              <div className="tip">
                <h4>⚗️ For Reaction Visualizer</h4>
                <ul>
                  <li>Understand reactants and products</li>
                  <li>Observe energy changes (exothermic vs endothermic)</li>
                  <li>Watch molecular transformation step-by-step</li>
                  <li>Connect visualization to chemical equations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      );
    }
 
 
    const selectedModule = modules.find((m) => m.id === activeTab);
    if (selectedModule) {
      const Component = selectedModule.component;
      return <Component />;
    }
 
 
    return null;
  };
 
 
  if (loading) {
    return (
      <div className="ar-multimedia-module">
        <div className="module-content">
          <div className="loading">Checking subscription...</div>
        </div>
      </div>
    );
  }
 
 
  if (!hasAccess) {
    return (
      <div className="ar-multimedia-module">
        <div className="module-content">
          <div className="subscription-prompt">
            <h2>🔒 AR Multimedia Access Required</h2>
            <p>
              Unlock interactive 3D molecule viewers, virtual lab simulations, and reaction visualizers
              with a Pro Student or Teacher plan.
            </p>
            <div className="subscription-options">
              <button
                className="upgrade-btn"
                onClick={() => navigate('/subscription')}
              >
                View Subscription Plans
              </button>
              <p className="note">
                Available in Pro Student and Teacher plans.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
 
 
  return (
    <div className="ar-multimedia-module">
      <div className="module-navigation">
        <button
          className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          🏠 Overview
        </button>
        {modules.map((module) => (
          <button
            key={module.id}
            className={`nav-btn ${activeTab === module.id ? 'active' : ''}`}
            onClick={() => setActiveTab(module.id)}
          >
            {module.icon} {module.name}
          </button>
        ))}
      </div>
 
 
      <div className="module-content">
        {renderContent()}
      </div>
    </div>
  );
 };
 
 
 export default ARMultimediaModule;
