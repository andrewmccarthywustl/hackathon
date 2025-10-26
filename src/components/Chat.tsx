import { useState, useRef, useEffect, useContext, useMemo } from 'react';
import type { ChatMessage, ChatResponse, ArxivPaper } from '../types';
import type { SavedConversation } from '../types/chat-history';
import { chatStorage } from '../utils/chatStorage';
import { apiUrl } from '../utils/api';
import { ChatHistory } from './ChatHistory';
import PaperCard from './PaperCard';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ProfileContext } from '../context/ProfileContext';
import './Chat.css';

export default function Chat() {
  const { profile } = useContext(ProfileContext);
  const interestFocus = profile?.researchInterests?.[0] ?? 'emerging research areas';
  const institutionFocus = profile?.institution ?? 'leading labs';

  const examplePrompts = useMemo(() => [
    `Show me top ${interestFocus.toLowerCase()} papers published this year.`,
    `Who are the most cited ${interestFocus.toLowerCase()} researchers right now?`,
    `Which ${institutionFocus} labs are doing interesting work related to ${interestFocus.toLowerCase()}?`
  ], [interestFocus, institutionFocus]);

  const [conversations, setConversations] = useState<SavedConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPapers, setCurrentPapers] = useState<ArxivPaper[]>([]);
  const [currentResearchers, setCurrentResearchers] = useState<string[]>([]);
  const [sidebarView, setSidebarView] = useState<'papers' | 'people'>('papers');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations on mount
  useEffect(() => {
    const saved = chatStorage.getAll();
    setConversations(saved);
  }, []);

  // Auto-save current conversation
  useEffect(() => {
    if (currentConversationId && messages.length > 0) {
      const conversation: SavedConversation = {
        id: currentConversationId,
        title: conversations.find(c => c.id === currentConversationId)?.title ||
               chatStorage.generateTitle(messages.find(m => m.role === 'user')?.content || 'New Chat'),
        messages,
        papers: currentPapers,
        researchers: currentResearchers,
        createdAt: conversations.find(c => c.id === currentConversationId)?.createdAt || new Date(),
        updatedAt: new Date()
      };
      chatStorage.save(conversation);

      // Update local state
      setConversations(chatStorage.getAll());
    }
  }, [messages, currentPapers, currentResearchers]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentPapers, currentResearchers]);

  const startNewConversation = () => {
    setCurrentConversationId(chatStorage.generateId());
    setMessages([]);
    setCurrentPapers([]);
    setCurrentResearchers([]);
  };

  const loadConversation = (id: string) => {
    const conv = chatStorage.getById(id);
    if (conv) {
      setCurrentConversationId(conv.id);
      setMessages(conv.messages);
      setCurrentPapers(conv.papers);
      setCurrentResearchers(conv.researchers);
    }
  };

  const deleteConversation = (id: string) => {
    chatStorage.delete(id);
    setConversations(chatStorage.getAll());

    // If we deleted the current conversation, start a new one
    if (id === currentConversationId) {
      startNewConversation();
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    await sendPrompt(input.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredPapers = currentPapers.filter((paper) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      paper.title.toLowerCase().includes(term) ||
      paper.authors.some(author => author.toLowerCase().includes(term)) ||
      paper.categories.some(category => category.toLowerCase().includes(term))
    );
  });

  const filteredResearchers = currentResearchers.filter((researcher) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return researcher.toLowerCase().includes(term);
  });

  const sendPrompt = async (prompt: string) => {
    if (!prompt.trim() || loading) return;

    if (!currentConversationId) {
      setCurrentConversationId(chatStorage.generateId());
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: prompt,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setInput('');

    try {
      const response = await fetch(apiUrl('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
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

  const handleExampleClick = (prompt: string) => {
    sendPrompt(prompt);
  };

  return (
    <div className="chat-wrapper">
      {/* Chat History Sidebar */}
      <ChatHistory
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={loadConversation}
        onNewConversation={startNewConversation}
        onDeleteConversation={deleteConversation}
      />

      {/* Main Chat Area */}
      <div className="chat-main-area">
        {messages.length === 0 && (
          <div className="prompt-buttons">
            {examplePrompts.map((prompt) => (
              <button
                key={prompt}
                className="prompt-btn"
                onClick={() => handleExampleClick(prompt)}
                disabled={loading}
              >
                {prompt}
              </button>
            ))}
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

      {/* Right Sidebar for Papers/People */}
      {(currentPapers.length > 0 || currentResearchers.length > 0) && (
        <div className="right-sidebar">
          {/* Toggle between Papers and People */}
          <div className="sidebar-toggle">
            <button
              className={`toggle-btn ${sidebarView === 'papers' ? 'active' : ''}`}
              onClick={() => setSidebarView('papers')}
            >
              Papers ({currentPapers.length})
            </button>
            <button
              className={`toggle-btn ${sidebarView === 'people' ? 'active' : ''}`}
              onClick={() => setSidebarView('people')}
            >
              People ({currentResearchers.length})
            </button>
          </div>

          {/* Search Input */}
          <div className="sidebar-search">
            <input
              type="text"
              placeholder={`Search ${sidebarView}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Content Area */}
          <div className="sidebar-content">
            {sidebarView === 'papers' ? (
              filteredPapers.length === 0 ? (
                <p className="sidebar-empty">
                  {searchTerm ? 'No papers match your search.' : 'No papers available.'}
                </p>
              ) : (
                filteredPapers.map((paper) => (
                  <PaperCard key={paper.id} paper={paper} />
                ))
              )
            ) : (
              filteredResearchers.length === 0 ? (
                <p className="sidebar-empty">
                  {searchTerm ? 'No people match your search.' : 'No researchers found.'}
                </p>
              ) : (
                <div className="researchers-list">
                  {filteredResearchers.map((researcher, idx) => (
                    <div key={idx} className="researcher-item">
                      <div className="researcher-avatar">👤</div>
                      <div className="researcher-name">{researcher}</div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
