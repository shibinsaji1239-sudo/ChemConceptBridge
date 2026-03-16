import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../apiClient';
import { toast } from 'react-toastify';
import AIQuizGenerator from '../Quiz/AIQuizGenerator';
import './TeacherQuizManager.css';

const TeacherQuizManager = ({ user }) => {
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [previewQuiz, setPreviewQuiz] = useState(null);
    const [editingQuiz, setEditingQuiz] = useState(null);

    const fetchQuizzes = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/quiz');
            // Filter for quizzes created by this teacher
            const myQuizzes = (data || []).filter(q => (q.createdBy?._id || q.createdBy) === user.id);
            setQuizzes(myQuizzes);
        } catch (err) {
            toast.error('Failed to load quizzes');
        } finally {
            setLoading(false);
        }
    }, [user.id]);

    useEffect(() => {
        fetchQuizzes();
    }, [fetchQuizzes]);

    const handleQuizGenerated = (newQuiz) => {
        toast.success(`Quiz "${newQuiz.title}" generated successfully!`);
        fetchQuizzes(); // Refresh list to show the new quiz
    };

    const togglePublishStatus = async (quizId, currentStatus) => {
        try {
            await api.patch(`/quiz/${quizId}/status`, { isActive: !currentStatus });
            toast.success(currentStatus ? 'Quiz unpublished' : 'Quiz published');
            fetchQuizzes();
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (quizId) => {
        if (!window.confirm('Are you sure you want to delete this quiz?')) return;
        try {
            await api.delete(`/quiz/${quizId}`);
            toast.success('Quiz deleted successfully');
            fetchQuizzes();
        } catch (err) {
            toast.error('Failed to delete quiz');
        }
    };

    const handlePreview = async (quizId) => {
        try {
            const { data } = await api.get(`/quiz/${quizId}`);
            setPreviewQuiz(data);
        } catch (err) {
            toast.error('Failed to load preview');
        }
    };

    const handleEdit = (quiz) => {
        // For now, redirect to a complex edit page or show a modal
        // Implementing a full inline editor here for brevity or simple fields
        setEditingQuiz({ ...quiz });
    };

    const saveEdit = async () => {
        try {
            setLoading(true);
            await api.put(`/quiz/${editingQuiz._id}`, editingQuiz);
            toast.success('Quiz updated successfully');
            setEditingQuiz(null);
            fetchQuizzes();
        } catch (err) {
            toast.error('Failed to update quiz');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="teacher-quiz-manager">
            <div className="dashboard-card">
                <AIQuizGenerator
                    onQuizGenerated={handleQuizGenerated}
                    role="teacher"
                />
            </div>

            <div className="dashboard-card my-quizzes-section">
                <div className="quiz-manager-header">
                    <h3>My Managed Quizzes</h3>
                    <button className="refresh-btn" onClick={fetchQuizzes} disabled={loading}>
                        {loading ? 'Refreshing...' : 'Refresh List'}
                    </button>
                </div>

                <div className="quiz-list">
                    {quizzes.length === 0 && !loading && (
                        <div className="activity-item" style={{ justifyContent: 'center', color: '#64748b' }}>
                            No quizzes created yet. Use the generator above to start!
                        </div>
                    )}

                    {quizzes.map(quiz => (
                        <div key={quiz._id} className="quiz-item-card">
                            <div className="quiz-item-info">
                                <div className="quiz-item-title">
                                    {quiz.title}
                                    <span className={`status-badge ${quiz.isActive ? 'published' : 'draft'}`} style={{ marginLeft: '10px' }}>
                                        {quiz.isActive ? 'Published' : 'Draft'}
                                    </span>
                                </div>
                                <div className="quiz-item-meta">
                                    <span>🧪 {quiz.topic}</span>
                                    <span>📊 {quiz.difficulty}</span>
                                    <span>⏱️ {quiz.duration} min</span>
                                    <span>👥 {quiz.attempts || 0} attempts</span>
                                </div>
                            </div>

                            <div className="quiz-item-actions">
                                <div className="toggle-container" title={quiz.isActive ? 'Unpublish' : 'Publish'}>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={quiz.isActive}
                                            onChange={() => togglePublishStatus(quiz._id, quiz.isActive)}
                                        />
                                        <span className="slider"></span>
                                    </label>
                                </div>
                                <button className="action-btn preview" onClick={() => handlePreview(quiz._id)}>Preview</button>
                                <button className="action-btn stats" onClick={() => navigate(`/quiz/${quiz._id}/stats`)}>Stats</button>
                                <button className="action-btn edit" onClick={() => handleEdit(quiz)}>Edit</button>
                                <button className="action-btn delete" onClick={() => handleDelete(quiz._id)}>Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Preview Modal */}
            {previewQuiz && (
                <div className="preview-overlay" onClick={() => setPreviewQuiz(null)}>
                    <div className="preview-content" onClick={e => e.stopPropagation()}>
                        <div className="preview-header">
                            <h2>Preview: {previewQuiz.title}</h2>
                            <button className="close-preview" onClick={() => setPreviewQuiz(null)}>&times;</button>
                        </div>
                        <div className="preview-body">
                            <p><strong>Description:</strong> {previewQuiz.description}</p>
                            <div className="preview-questions">
                                {previewQuiz.questions?.map((q, i) => (
                                    <div key={i} className="quiz-question-block" style={{ marginBottom: '20px', background: '#f8fafc' }}>
                                        <p><strong>Q{i + 1}:</strong> {q.question}</p>
                                        <ul style={{ listStyle: 'none', paddingLeft: '20px', marginTop: '10px' }}>
                                            {q.options?.map((opt, j) => (
                                                <li key={j} style={{
                                                    padding: '8px',
                                                    borderRadius: '4px',
                                                    border: '1px solid #e2e8f0',
                                                    marginBottom: '4px',
                                                    background: 'white'
                                                }}>
                                                    {String.fromCharCode(65 + j)}. {opt}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal (Simplified) */}
            {editingQuiz && (
                <div className="preview-overlay" onClick={() => setEditingQuiz(null)}>
                    <div className="preview-content" onClick={e => e.stopPropagation()} style={{ height: 'auto', maxHeight: '90vh' }}>
                        <div className="preview-header">
                            <h2>Edit Quiz</h2>
                            <button className="close-preview" onClick={() => setEditingQuiz(null)}>&times;</button>
                        </div>
                        <div className="preview-body">
                            <div style={{ display: 'grid', gap: '12px' }}>
                                <label>Title</label>
                                <input
                                    className="form-input"
                                    value={editingQuiz.title}
                                    onChange={e => setEditingQuiz({ ...editingQuiz, title: e.target.value })}
                                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5f5' }}
                                />
                                <label>Description</label>
                                <textarea
                                    className="form-input"
                                    value={editingQuiz.description}
                                    onChange={e => setEditingQuiz({ ...editingQuiz, description: e.target.value })}
                                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5f5', minHeight: '80px' }}
                                />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label>Difficulty</label>
                                        <select
                                            value={editingQuiz.difficulty}
                                            onChange={e => setEditingQuiz({ ...editingQuiz, difficulty: e.target.value })}
                                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5f5' }}
                                        >
                                            <option>Beginner</option>
                                            <option>Intermediate</option>
                                            <option>Advanced</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label>Duration (min)</label>
                                        <input
                                            type="number"
                                            value={editingQuiz.duration}
                                            onChange={e => setEditingQuiz({ ...editingQuiz, duration: parseInt(e.target.value) })}
                                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5f5' }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <button
                                className="quiz-create-submit"
                                onClick={saveEdit}
                                disabled={loading}
                                style={{ marginTop: '20px', width: '100%' }}
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherQuizManager;
