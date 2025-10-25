import { useState, useRef, useEffect } from 'react';
import type { ChatMessage, ChatResponse, ArxivPaper } from '../types';
import PaperCard from './PaperCard';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './Chat.css';

const API_BASE = '/api';

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your research assistant. I can help you:\n\n• Find and discuss research papers\n• Discover researchers working in specific fields\n• Analyze research trends and opportunities\n\nJust ask me anything! For example:\n- \"Show me recent papers on quantum computing\"\n- \"Who are the leading researchers in machine learning?\"\n- \"What are the trends in neuroscience?\"",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPapers, setCurrentPapers] = useState<ArxivPaper[]>([]);
  const [currentResearchers, setCurrentResearchers] = useState<string[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentPapers, currentResearchers]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setCurrentPapers([]);
    setCurrentResearchers([]);

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          context: messages.slice(-5)
        })
      });

      const data: ChatResponse & { researchers?: string[] } = await response.json();

      if (response.ok) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);

        if (data.relatedPapers && data.relatedPapers.length > 0) {
          setCurrentPapers(data.relatedPapers);
        }

        if (data.researchers && data.researchers.length > 0) {
          setCurrentResearchers(data.researchers);
        }
      } else {
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: `Error: ${data}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      console.error('Chat error:', error);
    }

    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const hasSidebarContent = currentPapers.length > 0 || currentResearchers.length > 0;

  return (
    <div className="chat-wrapper">
      {/* Left Sidebar */}
      {hasSidebarContent && (
        <div className={`results-sidebar left ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>

          {!sidebarCollapsed && (
            <>
              {currentPapers.length > 0 && (
                <>
                  <h3>📄 Related Papers ({currentPapers.length})</h3>
                  <div className="papers-list">
                    {currentPapers.slice(0, 10).map(paper => (
                      <PaperCard key={paper.id} paper={paper} />
                    ))}
                  </div>
                </>
              )}

              {currentResearchers.length > 0 && (
                <>
                  <h3>👥 Researchers ({currentResearchers.length})</h3>
                  <div className="researchers-list">
                    {currentResearchers.map((researcher, idx) => (
                      <div key={idx} className="researcher-item">
                        {researcher}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              <div className="message-content">
                {msg.role === 'assistant' ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="message assistant loading">
              <div className="message-content">Thinking and searching...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-container">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about papers, researchers, or research fields..."
            disabled={loading}
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
