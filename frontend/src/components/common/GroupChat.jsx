import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { chatAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './GroupChat.css';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';
const INITIAL_MESSAGE_LIMIT = 30;

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '🔥', '🎉'];

const getInitials = (name) =>
  name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

const getAvatarColor = (name) => {
  const palette = [
    ['#7C3AED', '#4F46E5'],
    ['#DB2777', '#9D174D'],
    ['#059669', '#047857'],
    ['#D97706', '#B45309'],
    ['#2563EB', '#1D4ED8'],
    ['#7C3AED', '#BE185D'],
    ['#0891B2', '#0E7490'],
  ];
  let hash = 0;
  for (let i = 0; i < (name?.length || 0); i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
};

const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDateDivider = (dateStr) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
};

const shouldShowDivider = (messages, index) => {
  if (index === 0) return true;
  const curr = new Date(messages[index].createdAt).toDateString();
  const prev = new Date(messages[index - 1].createdAt).toDateString();
  return curr !== prev;
};

export default function GroupChat({ tripId, trip }) {
  const { user, token } = useAuth();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [hoveredMsg, setHoveredMsg] = useState(null);
  const [reactionPickerFor, setReactionPickerFor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimerRef = useRef(null);
  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputAreaRef = useRef(null);
  const particlesRef = useRef(null);
  const isTypingRef = useRef(false);

  // ── Entrance animation ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && containerRef.current) {
      return;
      const tl = null;

      tl.fromTo(containerRef.current,
        { opacity: 0, y: 24, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'power3.out' }
      )
        .fromTo(headerRef.current,
          { opacity: 0, y: -12 },
          { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, '-=0.3'
        )
        .fromTo(inputAreaRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, '-=0.3'
        )
        .fromTo('.gc-msg-row',
          { opacity: 0, y: 16, scale: 0.97 },
          { opacity: 1, y: 0, scale: 1, duration: 0.35, stagger: 0.04, ease: 'power2.out' }, '-=0.2'
        );

      // Aurora particles
      if (particlesRef.current) {
        particlesRef.current.querySelectorAll('.gc-particle').forEach((p, i) => {
          gsap.to(p, {
            y: `${-40 - Math.random() * 60}px`,
            x: `${(Math.random() - 0.5) * 40}px`,
            opacity: Math.random() * 0.35 + 0.05,
            duration: 4 + Math.random() * 5,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: Math.random() * 4,
          });
        });
      }
    }
  }, [loading]);

  // ── Animate new incoming messages ───────────────────────────────────────────
  const animateLastMessage = useCallback(() => {
    return;
    setTimeout(() => {
      const rows = document.querySelectorAll('.gc-msg-row');
      const last = rows[rows.length - 1];
      if (last) {
        gsap.fromTo(last,
          { opacity: 0, y: 20, scale: 0.93 },
          { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(1.5)' }
        );
      }
    }, 30);
  }, []);

  // ── Socket ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!tripId || !token) return;
    const socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => socket.emit('join_trip', tripId));
    socket.on('online_users', setOnlineUsers);

    socket.on('new_message', (msg) => {
      setMessages(prev => {
        if (prev.find(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      if (messagesContainerRef.current) {
        const el = messagesContainerRef.current;
        const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
        if (nearBottom) setTimeout(() => scrollToBottom('smooth'), 50);
      }
      animateLastMessage();
    });

    socket.on('message_updated', (msg) => setMessages(prev => prev.map(m => m._id === msg._id ? msg : m)));
    socket.on('message_deleted', ({ msgId }) => setMessages(prev => prev.filter(m => m._id !== msgId)));

    socket.on('user_typing', ({ userId, name }) => {
      if (userId === user?._id) return;
      setTypingUsers(prev => prev.find(u => u.userId === userId) ? prev : [...prev, { userId, name }]);
    });
    socket.on('user_stopped_typing', ({ userId }) => setTypingUsers(prev => prev.filter(u => u.userId !== userId)));
    socket.on('error', ({ message }) => toast.error(message));

    return () => socket.disconnect();
  }, [tripId, token]);

  // ── Load history ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!tripId) return;
    setLoading(true);
    chatAPI.getHistory(tripId, { limit: INITIAL_MESSAGE_LIMIT })
      .then(({ data }) => {
        setMessages(data.messages || []);
        setHasMore((data.messages || []).length === INITIAL_MESSAGE_LIMIT);
      })
      .catch(() => toast.error('Failed to load chat history'))
      .finally(() => { setLoading(false); setTimeout(() => scrollToBottom('instant'), 100); });
  }, [tripId]);

  useEffect(() => {
    const handler = () => setReactionPickerFor(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesContainerRef.current?.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior });
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput('');
    setReplyTo(null);
    setSending(true);
    stopTypingSignal();

    if (socketRef.current?.connected) {
      socketRef.current.emit('send_message', { tripId, content, replyTo: replyTo?._id || null, type: 'text' });
      setSending(false);
    } else {
      try { await chatAPI.sendMessage(tripId, { content, replyTo: replyTo?._id }); }
      catch { toast.error('Failed to send'); }
      finally { setSending(false); }
    }
  }, [input, sending, replyTo, tripId]);

  const startTypingSignal = () => {
    if (!isTypingRef.current) { isTypingRef.current = true; socketRef.current?.emit('typing_start', { tripId }); }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(stopTypingSignal, 2500);
  };

  const stopTypingSignal = () => {
    if (isTypingRef.current) { isTypingRef.current = false; socketRef.current?.emit('typing_stop', { tripId }); }
    clearTimeout(typingTimerRef.current);
  };

  const handleReact = (msgId, emoji) => {
    socketRef.current?.emit('react_message', { msgId, emoji, tripId });
    setReactionPickerFor(null);
  };

  const handleDelete = async (msgId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('delete_message', { msgId, tripId });
      return;
    }

    try {
      await chatAPI.deleteMessage(msgId);
      setMessages(prev => prev.filter(m => m._id !== msgId));
    } catch {
      toast.error('Failed to delete message');
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    try {
      const { data } = await chatAPI.getHistory(tripId, { limit: 50, before: messages[0]?.createdAt });
      setMessages(prev => [...(data.messages || []), ...prev]);
      setHasMore((data.messages || []).length === 50);
    } catch { toast.error('Failed to load more'); }
    finally { setLoadingMore(false); }
  };

  const isMe = (msg) => msg.sender?._id === user?._id || msg.sender?._id === user?.id;

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (loading) return (
    <div className="gc-loading-screen">
      <div className="gc-loading-orb" />
      <div className="gc-loading-inner">
        <div className="gc-loading-ring">
          <svg viewBox="0 0 40 40" className="gc-spinner-svg">
            <circle cx="20" cy="20" r="16" className="gc-spinner-track" />
            <circle cx="20" cy="20" r="16" className="gc-spinner-fill" />
          </svg>
        </div>
        <p className="gc-loading-text">Loading messages</p>
        <div className="gc-loading-dots"><span /><span /><span /></div>
      </div>
    </div>
  );

  const memberCount = trip?.members?.length || 0;
  const onlineCount = onlineUsers.length;

  return (
    <div className="gc-container" ref={containerRef}>

      {/* ── Aurora particles background ── */}
      <div className="gc-particles" ref={particlesRef}>
        {Array.from({ length: 0 }).map((_, i) => (
          <div key={i} className="gc-particle" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${2 + Math.random() * 5}px`,
            height: `${2 + Math.random() * 5}px`,
            background: i % 3 === 0 ? '#818CF8' : i % 3 === 1 ? '#38BDF8' : '#34D399',
          }} />
        ))}
      </div>

      {/* ── Header ── */}
      <div className="gc-header" ref={headerRef}>
        <div className="gc-header-left">
          <div className="gc-header-icon-wrap">
            <div className="gc-header-icon-pulse" />
            <div className="gc-header-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
          </div>
          <div className="gc-header-text">
            <h3 className="gc-header-title">Group Chat</h3>
            <p className="gc-header-sub">
              <span className="gc-online-indicator" />
              {onlineCount > 0 ? `${onlineCount} online` : `${memberCount} members`}
            </p>
          </div>
        </div>

        {/* Online pill avatars */}
        <div className="gc-online-strip">
          {onlineUsers.slice(0, 4).map((u, i) => {
            const [c1, c2] = getAvatarColor(u.name);
            return (
              <div key={u.userId} className="gc-online-pill-avatar"
                style={{ background: `linear-gradient(135deg,${c1},${c2})`, zIndex: 10 - i, marginLeft: i > 0 ? '-8px' : 0 }}
                title={u.name}
              >
                {getInitials(u.name)}
                <span className="gc-pulse-ring" />
              </div>
            );
          })}
          {onlineUsers.length > 4 && (
            <div className="gc-online-overflow">+{onlineUsers.length - 4}</div>
          )}
          {onlineCount > 0 && <div className="gc-status-badge">● Live</div>}
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="gc-messages" ref={messagesContainerRef}>
        {hasMore && (
          <div className="gc-load-more">
            <button onClick={loadMore} disabled={loadingMore} className="gc-load-btn">
              {loadingMore
                ? <span className="gc-load-spinner" />
                : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15" /></svg> Load older</>
              }
            </button>
          </div>
        )}

        {messages.length === 0 && (
          <div className="gc-empty">
            <div className="gc-empty-glyph">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <p className="gc-empty-title">No messages yet</p>
            <p className="gc-empty-sub">Be the first to say something ✨</p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const mine = isMe(msg);
          const deleted = !!msg.deletedAt;
          const prevMsg = messages[idx - 1];
          const isSameAuthor = prevMsg && prevMsg.sender?._id === msg.sender?._id && !shouldShowDivider(messages, idx);
          const [c1, c2] = getAvatarColor(msg.sender?.name);

          return (
            <div key={msg._id}>
              {shouldShowDivider(messages, idx) && (
                <div className="gc-date-sep">
                  <div className="gc-date-line" />
                  <span className="gc-date-chip">{formatDateDivider(msg.createdAt)}</span>
                  <div className="gc-date-line" />
                </div>
              )}

              <div
                className={`gc-msg-row ${mine ? 'gc-msg-row--me' : ''}`}
                onMouseEnter={() => setHoveredMsg(msg._id)}
                onMouseLeave={() => { setHoveredMsg(null); setReactionPickerFor(null); }}
              >
                {/* Avatar */}
                {!mine && (
                  isSameAuthor
                    ? <div className="gc-avatar gc-avatar--spacer" />
                    : (
                      <div className="gc-avatar" style={{ background: `linear-gradient(135deg,${c1},${c2})` }} title={msg.sender?.name}>
                        {getInitials(msg.sender?.name)}
                        {onlineUsers.find(u => u.userId === msg.sender?._id) && <span className="gc-avatar-dot" />}
                      </div>
                    )
                )}

                <div className={`gc-bubble-col ${mine ? 'gc-bubble-col--me' : ''}`}>
                  {/* Name */}
                  <span className={`gc-sender-name ${mine ? 'gc-sender-name--me' : ''}`} style={{ color: mine ? undefined : c1 }}>
                    {mine ? 'You' : msg.sender?.name}
                  </span>

                  {/* Reply preview */}
                  {msg.replyTo && (
                    <div className={`gc-reply-preview ${mine ? 'gc-reply-preview--me' : ''}`}>
                      <div className="gc-reply-stripe" style={{ background: mine ? 'rgba(255,255,255,0.4)' : c1 }} />
                      <div>
                        <span className="gc-reply-from">{msg.replyTo.sender?.name || 'Someone'}</span>
                        <p className="gc-reply-snip">{msg.replyTo.content?.substring(0, 70)}…</p>
                      </div>
                    </div>
                  )}

                  {/* Bubble */}
                  <div className={`gc-bubble ${mine ? 'gc-bubble--me' : 'gc-bubble--them'} ${deleted ? 'gc-bubble--ghost' : ''}`}>
                    {/* Glow layer on my messages */}
                    {mine && !deleted && <div className="gc-bubble-glow" />}

                    {deleted ? (
                      <span className="gc-ghost-text">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                        Message deleted
                      </span>
                    ) : (
                      <>
                        <p className="gc-bubble-text">{msg.content}</p>
                        <span className="gc-timestamp">{formatTime(msg.createdAt)}{msg.edited && ' · edited'}</span>
                      </>
                    )}
                  </div>

                  {/* Reactions */}
                  {!deleted && msg.reactions?.length > 0 && (
                    <div className={`gc-reactions ${mine ? 'gc-reactions--me' : ''}`}>
                      {msg.reactions.map(r => (
                        <button key={r.emoji}
                          className={`gc-react-chip ${r.users?.includes(user?._id) ? 'gc-react-chip--on' : ''}`}
                          onClick={() => handleReact(msg._id, r.emoji)}
                        >
                          {r.emoji}<span>{r.users?.length}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions on hover */}
                {!deleted && hoveredMsg === msg._id && (
                  <div className={`gc-actions ${mine ? 'gc-actions--me' : ''}`} onClick={e => e.stopPropagation()}>
                    <div className="gc-action-wrap">
                      <button className="gc-action"
                        onClick={e => { e.stopPropagation(); setReactionPickerFor(reactionPickerFor === msg._id ? null : msg._id); }}
                      >😊</button>
                      {reactionPickerFor === msg._id && (
                        <div className={`gc-picker ${mine ? 'gc-picker--me' : ''}`}>
                          {QUICK_REACTIONS.map(emoji => (
                            <button key={emoji} className="gc-picker-btn" onClick={() => handleReact(msg._id, emoji)}>
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button className="gc-action" onClick={() => { setReplyTo(msg); inputRef.current?.focus(); }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 00-4-4H4" /></svg>
                    </button>
                    {mine && (
                      <button className="gc-action gc-action--del" onClick={() => handleDelete(msg._id)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M9 6V4h6v2" /></svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="gc-typing-row">
            <div className="gc-typing-avatars">
              {typingUsers.slice(0, 2).map(u => {
                const [c1, c2] = getAvatarColor(u.name);
                return (
                  <div key={u.userId} className="gc-avatar gc-avatar--xs"
                    style={{ background: `linear-gradient(135deg,${c1},${c2})` }}>
                    {getInitials(u.name)}
                  </div>
                );
              })}
            </div>
            <div className="gc-typing-bubble">
              <div className="gc-typing-label">
                {typingUsers.length === 1
                  ? `${typingUsers[0].name} is typing...`
                  : `${typingUsers.length} people are typing...`}
              </div>
              <div className="gc-typing-dots"><span /><span /><span /></div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Reply strip ── */}
      {replyTo && (
        <div className="gc-reply-strip">
          <div className="gc-reply-bar-accent" />
          <div className="gc-reply-body">
            <span className="gc-reply-label">Replying to <strong>{replyTo.sender?.name}</strong></span>
            <p className="gc-reply-quote">{replyTo.content?.substring(0, 90)}</p>
          </div>
          <button className="gc-reply-x" onClick={() => setReplyTo(null)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
      )}

      {/* ── Input ── */}
      <div className="gc-input-zone" ref={inputAreaRef}>
        <div className="gc-input-row">
          {/* My avatar */}
          {(() => {
            const [c1, c2] = getAvatarColor(user?.name); return (
              <div className="gc-me-avatar" style={{ background: `linear-gradient(135deg,${c1},${c2})` }}>
                {getInitials(user?.name)}
              </div>
            );
          })()}

          {/* Input field */}
          <div className="gc-field-wrap">
            <input
              ref={inputRef}
              type="text"
              className="gc-field"
              placeholder="Message the group…"
              value={input}
              onChange={e => { setInput(e.target.value); startTypingSignal(); }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                if (e.key === 'Escape') setReplyTo(null);
              }}
              onBlur={stopTypingSignal}
              maxLength={2000}
            />
          </div>

          {/* Send button */}
          <button
            className={`gc-send ${input.trim() ? 'gc-send--hot' : ''}`}
            onClick={sendMessage}
            disabled={sending || !input.trim()}
          >
            {sending
              ? <span className="gc-send-spin" />
              : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )
            }
          </button>
        </div>

        <div className="gc-field-footer">
          <span>Enter to send · Esc cancels reply</span>
          <span className={input.length > 1800 ? 'gc-char-warn' : ''}>{input.length}/2000</span>
        </div>
      </div>

    </div>
  );
}
