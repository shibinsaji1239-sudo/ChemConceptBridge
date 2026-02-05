import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FaRobot, FaPaperPlane, FaTimes, FaCommentDots } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../../apiClient';
import './Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hello! I'm your AI Chemistry Tutor. I can help you with your doubts, explain concepts step-by-step, and clarify NCERT topics. What are you studying today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const location = useLocation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      // Use generic chemistry tutor mode (no route-based context)
      const context = null;

      // Prepare history for context-aware conversation (last 10 messages)
      const history = messages.slice(-10).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        content: msg.text
      }));

      const response = await api.post('/chat/message', {
        message: userMessage,
        context: context,
        history: history
      });

      if (response.data && response.data.response) {
        setMessages(prev => [...prev, { sender: 'bot', text: response.data.response }]);
      } else {
        throw new Error("Empty response from AI engine");
      }
    } catch (error) {
      console.error("Chat Error:", error);
      const errorMessage = error.response?.data?.response || error.message || "I'm having trouble connecting right now.";
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        text: `${errorMessage}\n\n*(Note: AI Tutor is currently in simulated mode)*` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaRobot size={20} />
              <div>
                <h3>AI Chemistry Tutor</h3>
                <span style={{ fontSize: '10px', opacity: 0.9 }}>Mode: General Chemistry</span>
              </div>
            </div>
            <button className="chatbot-close" onClick={() => setIsOpen(false)}>
              <FaTimes />
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                {msg.sender === 'bot' ? (
                   <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                ) : (
                  msg.text
                )}
              </div>
            ))}
            {isLoading && (
              <div className="typing-indicator">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chatbot-input-area" onSubmit={handleSendMessage}>
            <input
              type="text"
              placeholder="Ask a doubt..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button type="submit" className="chatbot-send" disabled={isLoading || !input.trim()}>
              <FaPaperPlane size={14} />
            </button>
          </form>
        </div>
      )}

      <button className="chatbot-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <FaTimes /> : <FaCommentDots />}
      </button>
    </div>
  );
};

export default Chatbot;
