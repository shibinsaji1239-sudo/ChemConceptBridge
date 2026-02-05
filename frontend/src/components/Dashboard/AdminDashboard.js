import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './AdminDashboard.css';
import AdminUsers from './AdminUsers';
import AdminConcepts from './AdminConcepts';
import AdminQuizzes from './AdminQuizzes';
import AdminAnalytics from './AdminAnalytics';
import MisconceptionAnalytics from './MisconceptionAnalytics';
import AdminSystemSettings from './AdminSystemSettings';
import SubscriptionPage from '../../pages/SubscriptionPage';
import VideoManager from '../Videos/VideoManager';
import ConceptDependencyRiskAnalyzer from '../ConceptDependency/ConceptDependencyRiskAnalyzer';
import LearningPath from '../Progress/LearningPath';
import api from '../../apiClient';
import { toast } from 'react-toastify';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend);

const AdminDashboard = ({ activeTab, setActiveTab }) => {
  const [counts, setCounts] = useState({ users: 2847, concepts: '—', quizzes: '—', students: 2234, teachers: 142 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportsData, setReportsData] = useState({ summary: null, users: { admin: 0, teacher: 0, student: 0 }, concepts: [], quizzes: [] });
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState('');
  const [section, setSection] = useState('users'); // inner tabs for new admin layout

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [conceptsRes, quizzesRes, analyticsRes] = await Promise.all([
        api.get('/concept', { params: { status: 'approved' } }),
        api.get('/quiz'),
        api.get('/admin/analytics/users-by-role')
      ]);
      
      setCounts({
        users: (analyticsRes?.data?.admin || 0) + (analyticsRes?.data?.teacher || 0) + (analyticsRes?.data?.student || 0) || 2847,
        students: analyticsRes?.data?.student || 2234,
        teachers: analyticsRes?.data?.teacher || 142,
        concepts: (conceptsRes.data || []).length || '—',
        quizzes: (quizzesRes.data || []).length || '—',
      });
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load dashboard data');
      toast.error('Failed to load dashboard data. Please try again.');
      setCounts({ users: 2847, concepts: '—', quizzes: '—', students: 2234, teachers: 142 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'reports') {
      loadReports();
    }
  }, [activeTab]);

  const loadReports = useCallback(async () => {
    setReportsLoading(true);
    setReportsError('');
    try {
      const [summaryRes, usersRes, quizzesRes, conceptsRes] = await Promise.all([
        api.get('/admin/summary'),
        api.get('/admin/analytics/users-by-role'),
        api.get('/quiz'),
        api.get('/concept')
      ]);
      setReportsData({
        summary: summaryRes?.data || null,
        users: {
          admin: usersRes?.data?.admin || 0,
          teacher: usersRes?.data?.teacher || 0,
          student: usersRes?.data?.student || 0
        },
        quizzes: quizzesRes?.data || [],
        concepts: conceptsRes?.data || []
      });
    } catch (e) {
      const message = e?.response?.data?.message || 'Failed to load reports';
      setReportsError(message);
      toast.error(message);
      setReportsData({ summary: null, users: { admin: 0, teacher: 0, student: 0 }, concepts: [], quizzes: [] });
    } finally {
      setReportsLoading(false);
    }
  }, []);

  const handleDownloadInstitutionReport = async () => {
    try {
      setReportsLoading(true);
      const response = await api.get('/reports/institution', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Institution_Outcome_Report.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('Institution report downloaded successfully');
    } catch (err) {
      console.error('Institution report download failed', err);
      toast.error('Failed to download institution report');
    } finally {
      setReportsLoading(false);
    }
  };

  const revenue = 48392;

  const userTable = useMemo(
    () => [
      { name: 'Alice Johnson', email: 'alice@school.edu', role: 'student', status: 'Active', subscription: 'Premium', joined: '2024-01-15' },
      { name: 'Bob Smith', email: 'bob@school.edu', role: 'teacher', status: 'Active', subscription: 'Basic', joined: '2024-02-20' },
      { name: 'Carol White', email: 'carol@college.edu', role: 'student', status: 'Active', subscription: 'AR+AI', joined: '2024-03-10' },
      { name: 'David Chen', email: 'david@uni.edu', role: 'admin', status: 'Active', subscription: 'Enterprise', joined: '2024-04-02' },
      { name: 'Ella Patel', email: 'ella@school.edu', role: 'student', status: 'Inactive', subscription: 'Basic', joined: '2023-11-18' },
    ],
    []
  );

  const userGrowthChart = useMemo(
    () => ({
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
      datasets: [
        { label: 'admins', data: [10, 12, 13, 14, 15], borderColor: '#8b5cf6', backgroundColor: '#8b5cf6', tension: 0.3 },
        { label: 'students', data: [1800, 1900, 2000, 2100, 2234], borderColor: '#10b981', backgroundColor: '#10b981', tension: 0.3 },
        { label: 'teachers', data: [120, 130, 135, 138, 142], borderColor: '#22d3ee', backgroundColor: '#22d3ee', tension: 0.3 },
      ],
    }),
    []
  );

  const subscriptionPie = useMemo(
    () => ({
      labels: ['Basic', 'Premium', 'AR+AI', 'Enterprise'],
      datasets: [
        {
          data: [44, 34, 15, 7],
          backgroundColor: ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b'],
        },
      ],
    }),
    []
  );

  const revenueBar = useMemo(
    () => ({
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
      datasets: [
        {
          label: 'revenue',
          data: [38000, 41000, 43000, 45500, 48392],
          backgroundColor: '#10b981',
          borderRadius: 8,
        },
      ],
    }),
    []
  );

  const renderUserManagement = () => (
    <div className="panel-card">
      <div className="panel-card__header">
        <div>
          <div className="panel-title">User Management</div>
          <div className="panel-subtitle">Manage and monitor all platform users</div>
        </div>
        <div className="panel-actions">
          <div className="panel-search">
            <span role="img" aria-label="search">🔍</span>
            <input placeholder="Search users by name or email..." />
          </div>
          <select className="panel-filter">
            <option>All Roles</option>
            <option>Admin</option>
            <option>Teacher</option>
            <option>Student</option>
          </select>
          <button className="btn primary">Add User</button>
          <button className="btn ghost">Export</button>
        </div>
      </div>

      <div className="panel-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Subscription</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {userTable.map((user) => (
              <tr key={user.email}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td><span className={`tag ${user.role}`}>{user.role}</span></td>
                <td><span className={`pill ${user.status === 'Active' ? 'success' : 'muted'}`}>{user.status}</span></td>
                <td><span className="pill soft">{user.subscription}</span></td>
                <td>{user.joined}</td>
                <td><button className="link-btn">Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="panel-grid">
      <div className="panel-card stretch">
        <div className="panel-card__header">
          <div className="panel-title">User Growth Trend</div>
          <div className="panel-subtitle">Monthly active users by role</div>
        </div>
        <div className="chart-wrapper">
          <Line
            data={userGrowthChart}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: true, position: 'bottom' } },
            }}
          />
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-card__header">
          <div className="panel-title">Subscription Distribution</div>
          <div className="panel-subtitle">Active subscriptions by plan type</div>
        </div>
        <div className="chart-wrapper pie">
          <Pie
            data={subscriptionPie}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: true, position: 'right' } },
            }}
          />
        </div>
      </div>

      <div className="panel-card stretch">
        <div className="panel-card__header">
          <div className="panel-title">Revenue Trends</div>
          <div className="panel-subtitle">Monthly recurring revenue in USD</div>
        </div>
        <div className="chart-wrapper">
          <Bar
            data={revenueBar}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { y: { ticks: { callback: (v) => `$${v.toLocaleString()}` } } },
            }}
          />
        </div>
      </div>
    </div>
  );

  const renderSubscriptions = () => (
    <div className="panel-card">
      <div className="panel-card__header">
        <div>
          <div className="panel-title">Subscription Overview</div>
          <div className="panel-subtitle">Active subscriptions and payment status</div>
        </div>
      </div>

      <div className="subscription-grid">
        {[
          { name: 'Basic', count: 1240 },
          { name: 'Premium', count: 980 },
          { name: 'AR+AI', count: 427 },
          { name: 'Enterprise', count: 200 },
        ].map((plan) => (
          <div className="subscription-card" key={plan.name}>
            <div className="subscription-name">{plan.name}</div>
            <div className="subscription-count">{plan.count}</div>
            <div className="subscription-label">Active users</div>
          </div>
        ))}
      </div>

      <div className="integration-banner">
        <div className="integration-icon">ℹ️</div>
        <div className="integration-text">
          <div className="integration-title">Payment Integration Status</div>
          <div className="integration-desc">
            Subscription payment processing is currently in demo mode. Connect to Razorpay or Stripe for live payments.
          </div>
        </div>
        <div className="integration-actions">
          <button className="btn primary">View Subscription Plans</button>
          <button className="btn ghost">Export Report</button>
        </div>
      </div>
    </div>
  );

  const renderPerformance = () => (
    <div className="panel-card">
      <div className="panel-card__header">
        <div>
          <div className="panel-title">Platform Performance Metrics</div>
          <div className="panel-subtitle">System health and user engagement statistics</div>
        </div>
      </div>
      <div className="kpi-grid modern">
        <div className="kpi-tile">
          <div className="kpi-icon">📈</div>
          <div>
            <div className="kpi-label">Avg. Session Time</div>
            <div className="kpi-value">42 min</div>
          </div>
          <span className="pill success subtle">+23%</span>
        </div>
        <div className="kpi-tile">
          <div className="kpi-icon">📊</div>
          <div>
            <div className="kpi-label">Quiz Completion Rate</div>
            <div className="kpi-value">87.3%</div>
          </div>
          <span className="pill info subtle">+15%</span>
        </div>
        <div className="kpi-tile">
          <div className="kpi-icon">✅</div>
          <div>
            <div className="kpi-label">Concept Mastery</div>
            <div className="kpi-value">73.8%</div>
          </div>
          <span className="pill secondary subtle">+31%</span>
        </div>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="neo-admin">
      <div className="neo-topbar">
        <div className="brand">
          <div className="brand-icon">⚡</div>
          <div>
            <div className="brand-title">ChemConcept Bridge - Admin Panel</div>
            <div className="brand-subtitle">Manage users, monitor performance, and oversee platform operations</div>
          </div>
        </div>
        <div className="brand-actions">
          <button className="btn ghost">Switch to Dashboard</button>
          <button className="btn ghost">Logout</button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="summary-grid">
        <div className="summary-card users">
          <div className="summary-icon">👥</div>
          <div className="summary-label">Total Users</div>
          <div className="summary-value">{counts.users?.toLocaleString()}</div>
          <span className="chip success">+12.5%</span>
        </div>
        <div className="summary-card students">
          <div className="summary-icon">🎓</div>
          <div className="summary-label">Active Students</div>
          <div className="summary-value">{counts.students?.toLocaleString()}</div>
          <span className="chip success">+8.2%</span>
        </div>
        <div className="summary-card teachers">
          <div className="summary-icon">📘</div>
          <div className="summary-label">Active Teachers</div>
          <div className="summary-value">{counts.teachers?.toLocaleString()}</div>
          <span className="chip success">+5.1%</span>
        </div>
        <div className="summary-card revenue">
          <div className="summary-icon">💰</div>
          <div className="summary-label">Revenue (Monthly)</div>
          <div className="summary-value">${revenue.toLocaleString()}</div>
          <span className="chip success">+18.7%</span>
        </div>
      </div>

      <div className="section-tabs">
        {[
          { id: 'users', label: 'User Management' },
          { id: 'analytics', label: 'Analytics' },
          { id: 'subscriptions', label: 'Subscriptions' },
          { id: 'performance', label: 'Performance' },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`section-tab ${section === tab.id ? 'active' : ''}`}
            onClick={() => setSection(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="section-body">
        {section === 'users' && renderUserManagement()}
        {section === 'analytics' && renderAnalytics()}
        {section === 'subscriptions' && renderSubscriptions()}
        {section === 'performance' && renderPerformance()}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'concepts':
        return <AdminConcepts />;
      case 'quizzes':
        return <AdminQuizzes />;
      case 'videos':
        return <VideoManager role="admin" />;
      case 'dependency-risk':
        return <ConceptDependencyRiskAnalyzer mode="admin" />;
      case 'analytics':
        return <AdminAnalytics />;
      case 'misconceptions':
        return <MisconceptionAnalytics />;
      case 'users':
        return <AdminUsers />;
      case 'periodic-table':
        return (
          <div className="dashboard-card">
            <h3>Periodic Table</h3>
            <div style={{ paddingTop: 8 }}>
              {React.createElement(require('../PeriodicTable/PeriodicTable').default)}
            </div>
          </div>
        );
      case 'concept-map':
        return (
          <div className="dashboard-card">
            <h3>Concept Map Moderation</h3>
            <div style={{ paddingTop: 8 }}>
              {React.createElement(require('../Admin/AdminConceptMapModeration').default)}
            </div>
          </div>
        );
      case 'learning-path':
        return (
          <div className="dashboard-card">
            <h3>Student Learning Paths</h3>
            <div style={{ paddingTop: 8 }}>
              <LearningPath role="admin" />
            </div>
          </div>
        );
      case 'system':
        return (
          <div className="tab-content">
            <AdminSystemSettings />
          </div>
        );
      case 'subscription':
        return <SubscriptionPage user={{ role: 'admin' }} />;
      case 'reports':
        return (
          <div className="reports-section">
            <div className="reports-header">
              <div>
                <h2>Reports</h2>
                <p>Comprehensive performance insights across users, content, and engagement.</p>
              </div>
              <div className="reports-actions" style={{ display: 'flex', gap: '10px' }}>
                <button className="download-institution-report-btn" onClick={handleDownloadInstitutionReport} disabled={reportsLoading} style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>
                  {reportsLoading ? '...' : '📊 Download Outcome Report'}
                </button>
                <button className="refresh-btn" onClick={loadReports} disabled={reportsLoading}>
                  {reportsLoading ? 'Loading…' : 'Refresh Reports'}
                </button>
              </div>
            </div>

            {reportsError && <div className="error-message">{reportsError}</div>}

            {reportsLoading ? (
              <div className="loading-spinner">Loading reports...</div>
            ) : (
              <>
                <div className="reports-grid">
                  <div className="reports-card">
                    <h3>User Distribution</h3>
                    <div className="reports-grid-cols">
                      <div className="reports-stat">
                        <span className="reports-stat-label">Admins</span>
                        <span className="reports-stat-value">{reportsData.users.admin}</span>
                      </div>
                      <div className="reports-stat">
                        <span className="reports-stat-label">Teachers</span>
                        <span className="reports-stat-value">{reportsData.users.teacher}</span>
                      </div>
                      <div className="reports-stat">
                        <span className="reports-stat-label">Students</span>
                        <span className="reports-stat-value">{reportsData.users.student}</span>
                      </div>
                    </div>
                  </div>

                  <div className="reports-card">
                    <h3>Concept Overview</h3>
                    <div className="reports-grid-cols">
                      <div className="reports-stat">
                        <span className="reports-stat-label">Total Concepts</span>
                        <span className="reports-stat-value">{reportsData.summary?.concepts?.total || 0}</span>
                      </div>
                      <div className="reports-stat">
                        <span className="reports-stat-label">Approved & Active</span>
                        <span className="reports-stat-value">{reportsData.summary?.concepts?.approvedActive || 0}</span>
                      </div>
                      <div className="reports-stat">
                        <span className="reports-stat-label">Pending</span>
                        <span className="reports-stat-value">{reportsData.summary?.conceptsByStatus?.pending || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="reports-card">
                    <h3>Quiz Overview</h3>
                    <div className="reports-grid-cols">
                      <div className="reports-stat">
                        <span className="reports-stat-label">Total Quizzes</span>
                        <span className="reports-stat-value">{reportsData.summary?.quizzes?.total || 0}</span>
                      </div>
                      <div className="reports-stat">
                        <span className="reports-stat-label">Active Quizzes</span>
                        <span className="reports-stat-value">{reportsData.summary?.quizzes?.active || 0}</span>
                      </div>
                      <div className="reports-stat">
                        <span className="reports-stat-label">Hard Difficulty</span>
                        <span className="reports-stat-value">{reportsData.summary?.quizzesByDifficulty?.hard || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="reports-table-container">
                  <div className="reports-table">
                    <h3>Latest Concepts</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Status</th>
                          <th>Updated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportsData.concepts.slice(0, 5).map((concept) => (
                          <tr key={concept._id}>
                            <td>{concept.title}</td>
                            <td>{concept.status}</td>
                            <td>{new Date(concept.updatedAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="reports-table">
                    <h3>Latest Quizzes</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Difficulty</th>
                          <th>Updated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportsData.quizzes.slice(0, 5).map((quiz) => (
                          <tr key={quiz._id}>
                            <td>{quiz.title}</td>
                            <td>{quiz.difficulty}</td>
                            <td>{new Date(quiz.updatedAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      default:
        return renderOverview();
    }
  };

  return (
    <div className="admin-dashboard fade-in">
      {renderContent()}
    </div>
  );
};

export default AdminDashboard;
