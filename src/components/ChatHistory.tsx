import { useState } from 'react';
import type { SavedConversation } from '../types/chat-history';
import './ChatHistory.css';

interface ChatHistoryProps {
  conversations: SavedConversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

export function ChatHistory({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation
}: ChatHistoryProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this conversation?')) {
      onDeleteConversation(id);
    }
  };

  return (
    <div className={`chat-history-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button
        className="history-toggle"
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? 'Expand history' : 'Collapse history'}
      >
        {isCollapsed ? '→' : '←'}
      </button>

      {!isCollapsed && (
        <div className="history-content">
          <div className="history-header">
            <h3>Chat History</h3>
            <button className="btn-new-chat" onClick={onNewConversation}>
              + New Chat
            </button>
          </div>

          <div className="conversations-list">
            {conversations.length === 0 ? (
              <div className="empty-state">
                <p>No saved conversations yet.</p>
                <p>Start chatting to create your first conversation!</p>
              </div>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.id}
                  className={`conversation-item ${conv.id === currentConversationId ? 'active' : ''}`}
                  onClick={() => onSelectConversation(conv.id)}
                >
                  <div className="conversation-header">
                    <h4 className="conversation-title">{conv.title}</h4>
                    <button
                      className="btn-delete"
                      onClick={(e) => handleDelete(e, conv.id)}
                      title="Delete conversation"
                    >
                      ×
                    </button>
                  </div>
                  <div className="conversation-meta">
                    <span className="message-count">
                      {conv.messages.filter(m => m.role === 'user').length} messages
                    </span>
                    <span className="conversation-date">
                      {formatDate(conv.updatedAt)}
                    </span>
                  </div>
                  {(conv.papers.length > 0 || conv.researchers.length > 0) && (
                    <div className="conversation-tags">
                      {conv.papers.length > 0 && (
                        <span className="tag">📄 {conv.papers.length} papers</span>
                      )}
                      {conv.researchers.length > 0 && (
                        <span className="tag">👥 {conv.researchers.length} researchers</span>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
