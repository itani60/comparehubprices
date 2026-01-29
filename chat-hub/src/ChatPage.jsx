import React, { useEffect, useMemo, useRef, useState } from 'react';
import './ChatPage.css';
import {
  blockConversation,
  clearConversation,
  getConversation,
  getRealtimeToken,
  listConversations,
  markConversationRead,
  reportConversation,
  sendMessage,
  unblockConversation
} from './chatSystemApi';

const SESSION_STORAGE_KEY = 'chp_session_id';

function initialsFromName(name) {
  if (!name) return 'CH';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || 'C';
  const second = (parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1]) || 'H';
  return `${first}${second}`.toUpperCase();
}

function timeAgo(isoStr) {
  if (!isoStr) return '';
  const then = new Date(isoStr).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.round((now - then) / 1000));
  if (diffSec < 60) return 'now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function presenceFromLastSeen(lastSeenIso) {
  if (!lastSeenIso) return { status: 'offline', lastSeen: '' };
  const diffMs = Date.now() - new Date(lastSeenIso).getTime();
  if (diffMs <= 2 * 60 * 1000) return { status: 'online', lastSeen: 'now' };
  return { status: 'offline', lastSeen: timeAgo(lastSeenIso) };
}

const Icons = {
  Search: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  More: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  ),
  Home: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5 10v10h14V10" />
    </svg>
  ),
  Archive: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" />
      <path d="M10 12h4" />
    </svg>
  ),
  Blocked: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M7 17L17 7" />
    </svg>
  ),
  Report: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 3v18" />
      <path d="M4 5h11l-2 3 2 3H4" />
    </svg>
  ),
  Delete: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6l1 14h10l1-14" />
    </svg>
  ),
  Logout: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  ),
  Emoji: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  ),
  Attach: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  ),
  Send: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  ),
  Sun: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  ),
  Moon: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  ),
  Back: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  ),
  Checks: ({ status }) => {
    const stroke = status === 'read' ? '#3b82f6' : 'currentColor';
    const isDouble = status === 'delivered' || status === 'read';
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {!isDouble && <path d="M6.5 12.5l3.5 3.5L17.5 8.5" />}
        {isDouble && (
          <>
            <path d="M5.2 12.6l3.2 3.2 6.2-6.2" />
            <path d="M9.6 12.6l3.2 3.2 6.2-6.2" />
          </>
        )}
      </svg>
    );
  }
};

const formatDate = (isoStr) => {
  const date = new Date(isoStr);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatTime = (isoStr) => new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const ChatPage = () => {
  const deepLink = useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const recipientId = params.get('recipientId');
      const recipientName = params.get('recipientName');
      return {
        recipientId: recipientId ? String(recipientId) : null,
        recipientName: recipientName ? String(recipientName) : null
      };
    } catch {
      return { recipientId: null, recipientName: null };
    }
  }, []);

  const [pendingRecipient, setPendingRecipient] = useState(() => {
    if (!deepLink.recipientId) return null;
    return { id: deepLink.recipientId, name: deepLink.recipientName || 'Business' };
  });

  const [sessionId, setSessionId] = useState(() => localStorage.getItem(SESSION_STORAGE_KEY) || '');
  const [sessionDraft, setSessionDraft] = useState(() => localStorage.getItem(SESSION_STORAGE_KEY) || '');
  const [me, setMe] = useState({ userId: null, realtimeToken: null });
  const [isBootLoading, setIsBootLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState('');

  const [conversations, setConversations] = useState([]);
  const [messagesByCid, setMessagesByCid] = useState({});
  const [activeCid, setActiveCid] = useState(null);
  const [theme, setTheme] = useState('light');
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarMenuOpen, setIsSidebarMenuOpen] = useState(false);
  const [isChatMenuOpen, setIsChatMenuOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, cid: null });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isArchivePanelOpen, setIsArchivePanelOpen] = useState(false);
  const [isBlockedPanelOpen, setIsBlockedPanelOpen] = useState(false);
  const [isMyProfileOpen, setIsMyProfileOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmCid, setConfirmCid] = useState(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportCid, setReportCid] = useState(null);
  const [reportReason, setReportReason] = useState('Spam or scam');
  const [reportDetails, setReportDetails] = useState('');

  const scrollRef = useRef(null);
  const sidebarMenuRef = useRef(null);
  const chatMenuRef = useRef(null);
  const contextMenuRef = useRef(null);
  const logoUrl = `${import.meta.env.BASE_URL}logo/chat_image_logo.png`;

  const myProfile = useMemo(() => {
    const id = me.userId ? String(me.userId) : '—';
    return {
      firstName: 'You',
      lastName: '',
      suburb: '',
      city: '',
      province: '',
      accountSince: '—',
      initials: 'ME',
      userId: id
    };
  }, [me.userId]);

  const mapConversation = (conv) => {
    const other = conv?.other_party || {};
    const name = other?.name || 'Unknown';
    const presence = presenceFromLastSeen(other?.last_seen);

    return {
      id: conv.id,
      name,
      avatar: initialsFromName(name),
      lastMessage: conv.last_message_preview || '',
      lastTime: conv.last_message_at || conv.updated_at || conv.created_at || new Date().toISOString(),
      unread: 0,
      status: presence.status,
      lastSeen: presence.lastSeen,
      archived: false,
      blocked: !!other?.is_blocked,
      otherPartyId: other?.id ?? null,
      otherPartyType: other?.type ?? null,
      otherPartyImage: other?.image ?? null
    };
  };

  const mapMessage = (message) => {
    const sender = message.sender_id === me.userId ? 'me' : 'them';
    const status = sender === 'me' ? (message.is_read ? 'read' : 'delivered') : undefined;
    return {
      id: message.id,
      conversationId: message.conversation_id,
      sender,
      text: message.content,
      timestamp: message.created_at,
      status
    };
  };

  const refreshConversations = async ({ preferredActiveId } = {}) => {
    if (!sessionId) return;
    const data = await listConversations({ sessionId });
    const mapped = (data?.conversations || []).map(mapConversation);

    setConversations(mapped);

    if (pendingRecipient?.id) {
      const match = mapped.find((c) => String(c.otherPartyId ?? '') === String(pendingRecipient.id));
      if (match) {
        setPendingRecipient(null);
        setActiveCid(match.id);
        return;
      }
      if (!activeCid && !preferredActiveId) {
        setActiveCid(null);
        return;
      }
    }

    const nextActive =
      (preferredActiveId && mapped.find((c) => c.id === preferredActiveId)?.id) ||
      (activeCid && mapped.find((c) => c.id === activeCid)?.id) ||
      mapped[0]?.id ||
      null;

    setActiveCid(nextActive);
  };

  const loadConversationMessages = async (conversationId) => {
    if (!sessionId || !conversationId) return;
    const data = await getConversation({ sessionId, conversationId });
    const mapped = (data?.messages || []).map(mapMessage);
    setMessagesByCid((prev) => ({ ...prev, [conversationId]: mapped }));
  };

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (!sessionId) return;

      setIsBootLoading(true);
      setErrorBanner('');
      try {
        const [rt, list] = await Promise.all([
          getRealtimeToken({ sessionId }),
          listConversations({ sessionId })
        ]);
        if (cancelled) return;

        setMe({ userId: rt?.userId ?? null, realtimeToken: rt?.token ?? null });
        const mapped = (list?.conversations || []).map(mapConversation);
        setConversations(mapped);
        if (pendingRecipient?.id) {
          const match = mapped.find((c) => String(c.otherPartyId ?? '') === String(pendingRecipient.id));
          if (match) {
            setPendingRecipient(null);
            setActiveCid(match.id);
          } else {
            setActiveCid(null);
          }
        } else {
          setActiveCid(mapped[0]?.id ?? null);
        }
      } catch (error) {
        if (!cancelled) setErrorBanner(error?.message || 'Failed to load chat');
      } finally {
        if (!cancelled) setIsBootLoading(false);
      }
    }

    boot();

    return () => {
      cancelled = true;
    };
  }, [sessionId, pendingRecipient]);

  useEffect(() => {
    if (!sessionId) return undefined;

    const timer = setInterval(() => {
      refreshConversations({ preferredActiveId: activeCid }).catch(() => {});
    }, 20000);

    return () => clearInterval(timer);
  }, [sessionId, activeCid]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 900) {
        setIsSidebarCollapsed(true);
      } else {
        setIsSidebarCollapsed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messagesByCid, activeCid, isTyping]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarMenuRef.current && !sidebarMenuRef.current.contains(event.target)) {
        setIsSidebarMenuOpen(false);
      }
      if (chatMenuRef.current && !chatMenuRef.current.contains(event.target)) {
        setIsChatMenuOpen(false);
      }
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGoHome = () => {
    window.location.href = 'index.html';
  };

  const handleGoSettings = () => {
    window.location.href = 'my_account_settings.html';
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setSessionId('');
    setSessionDraft('');
    setMe({ userId: null, realtimeToken: null });
    setConversations([]);
    setMessagesByCid({});
    setActiveCid(null);
  };

  const handleConnectSession = () => {
    const next = sessionDraft.trim();
    if (!next) {
      setErrorBanner('Session ID is required.');
      return;
    }
    localStorage.setItem(SESSION_STORAGE_KEY, next);
    setSessionId(next);
    setErrorBanner('');
  };

  const handleMarkAllRead = async () => {
    setIsSidebarMenuOpen(false);
    if (!sessionId) return;

    try {
      await Promise.all(conversations.map((c) => markConversationRead({ sessionId, conversationId: c.id })));
      setConversations((prev) => prev.map((c) => ({ ...c, unread: 0 })));
    } catch (error) {
      setErrorBanner(error?.message || 'Failed to mark read');
    }
  };

  const handleDeleteAllChats = () => {
    setIsDeleteConfirmOpen(true);
    setIsSidebarMenuOpen(false);
  };

  const confirmDeleteAllChats = async () => {
    setIsDeleteConfirmOpen(false);
    if (!sessionId) return;

    try {
      await Promise.all(conversations.map((c) => clearConversation({ sessionId, conversationId: c.id })));
      setMessagesByCid({});
      await refreshConversations({ preferredActiveId: null });
    } catch (error) {
      setErrorBanner(error?.message || 'Failed to delete chats');
    }
  };

  const cancelDeleteAllChats = () => {
    setIsDeleteConfirmOpen(false);
  };

  const handleDeleteChatById = async (cid) => {
    if (!cid || !sessionId) return;
    setContextMenu((prev) => ({ ...prev, visible: false }));

    try {
      await clearConversation({ sessionId, conversationId: cid });
      setMessagesByCid((prev) => {
        const next = { ...prev };
        delete next[cid];
        return next;
      });
      await refreshConversations({ preferredActiveId: activeCid === cid ? null : activeCid });
    } catch (error) {
      setErrorBanner(error?.message || 'Failed to delete chat');
    }
  };

  const handleClearChatById = async (cid) => {
    if (!cid || !sessionId) return;
    setContextMenu((prev) => ({ ...prev, visible: false }));

    try {
      await clearConversation({ sessionId, conversationId: cid });
      setMessagesByCid((prev) => ({ ...prev, [cid]: [] }));
      await refreshConversations({ preferredActiveId: cid });
    } catch (error) {
      setErrorBanner(error?.message || 'Failed to clear chat');
    }
  };

  const handleArchiveChat = (cid) => {
    if (!cid) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === cid ? { ...c, archived: true } : c))
    );
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const handleUnarchiveChat = (cid) => {
    if (!cid) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === cid ? { ...c, archived: false } : c))
    );
  };

  const handleBlockChat = async (cid) => {
    if (!cid || !sessionId) return;
    setContextMenu((prev) => ({ ...prev, visible: false }));

    const conv = conversations.find((c) => c.id === cid);
    try {
      await blockConversation({ sessionId, conversationId: cid, recipientId: conv?.otherPartyId });
      await refreshConversations({ preferredActiveId: activeCid });
    } catch (error) {
      setErrorBanner(error?.message || 'Failed to block');
    }
  };

  const handleUnblockChat = async (cid) => {
    if (!cid || !sessionId) return;
    const conv = conversations.find((c) => c.id === cid);
    try {
      await unblockConversation({ sessionId, conversationId: cid, recipientId: conv?.otherPartyId });
      await refreshConversations({ preferredActiveId: activeCid });
    } catch (error) {
      setErrorBanner(error?.message || 'Failed to unblock');
    }
  };

  const reportReasons = [
    'Spam or scam',
    'Harassment or bullying',
    'Hate speech',
    'Inappropriate content',
    'Impersonation',
    'Other'
  ];

  const openConfirm = (action, cid) => {
    setConfirmAction(action);
    setConfirmCid(cid);
    setIsChatMenuOpen(false);
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const closeConfirm = () => {
    setConfirmAction(null);
    setConfirmCid(null);
  };

  const confirmAndRun = () => {
    if (!confirmCid || !confirmAction) return;
    if (confirmAction === 'delete') {
      handleDeleteChatById(confirmCid);
    }
    if (confirmAction === 'block') {
      handleBlockChat(confirmCid);
    }
    if (confirmAction === 'clear') {
      handleClearChatById(confirmCid);
    }
    closeConfirm();
  };

  const openReport = (cid) => {
    setReportCid(cid);
    setReportReason('Spam or scam');
    setReportDetails('');
    setIsReportOpen(true);
    setIsChatMenuOpen(false);
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const closeReport = () => {
    setIsReportOpen(false);
    setReportCid(null);
  };

  const submitReport = async () => {
    if (!reportCid || !reportReason || !sessionId) return;

    const conv = conversations.find((c) => c.id === reportCid);
    const reason = reportDetails?.trim()
      ? `${reportReason} — ${reportDetails.trim()}`
      : reportReason;

    try {
      await reportConversation({ sessionId, conversationId: reportCid, recipientId: conv?.otherPartyId, reason });
      closeReport();
    } catch (error) {
      setErrorBanner(error?.message || 'Failed to submit report');
    }
  };

  const openContextMenu = (event, cid) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setContextMenu({
      visible: true,
      x: rect.right - 180,
      y: rect.bottom + 6,
      cid
    });
  };

  const handleOpenProfile = () => {
    if (!currentConversation) return;
    setIsProfileOpen(true);
    setIsChatMenuOpen(false);
  };

  const handleCloseProfile = () => {
    setIsProfileOpen(false);
  };

  const handleOpenMyProfile = () => {
    setIsMyProfileOpen(true);
    setIsProfileOpen(false);
    setIsArchivePanelOpen(false);
    setIsBlockedPanelOpen(false);
    setIsSidebarCollapsed(true);
  };

  const handleCloseMyProfile = () => {
    setIsMyProfileOpen(false);
    if (window.innerWidth < 900) setIsSidebarCollapsed(false);
  };

  const handleOpenArchivePanel = () => {
    setIsArchivePanelOpen(true);
    setIsBlockedPanelOpen(false);
    setIsProfileOpen(false);
    setIsSidebarMenuOpen(false);
    setIsSidebarCollapsed(true);
  };

  const handleOpenBlockedPanel = () => {
    setIsBlockedPanelOpen(true);
    setIsArchivePanelOpen(false);
    setIsProfileOpen(false);
    setIsSidebarMenuOpen(false);
    setIsSidebarCollapsed(true);
  };

  const handleCloseArchivePanel = () => {
    setIsArchivePanelOpen(false);
    if (window.innerWidth < 900) setIsSidebarCollapsed(false);
  };

  const handleCloseBlockedPanel = () => {
    setIsBlockedPanelOpen(false);
    if (window.innerWidth < 900) setIsSidebarCollapsed(false);
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!sessionId) {
      setErrorBanner('Please connect a session first.');
      return;
    }
    if (!inputText.trim()) return;

    const recipientId = pendingRecipient?.id || currentConversation?.otherPartyId || null;
    if (!activeCid && !recipientId) return;

    const text = inputText.trim();
    const tempId = `tmp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      conversationId: activeCid || null,
      sender: 'me',
      text,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    setMessagesByCid((prev) => ({
      ...prev,
      ...(activeCid ? { [activeCid]: [...(prev[activeCid] || []), optimistic] } : {}),
      ...(!activeCid ? { __pending__: [...(prev.__pending__ || []), optimistic] } : {})
    }));
    setConversations((prev) =>
      activeCid
        ? prev.map((c) => (c.id === activeCid ? { ...c, lastMessage: text, lastTime: optimistic.timestamp } : c))
        : prev
    );
    setInputText('');

    try {
      const resp = await sendMessage({
        sessionId,
        conversationId: activeCid || undefined,
        recipientId: activeCid ? undefined : recipientId,
        content: text
      });
      const serverMsg = resp?.data ? mapMessage(resp.data) : null;

      if (!activeCid && serverMsg?.conversationId) {
        setPendingRecipient(null);
        setActiveCid(serverMsg.conversationId);
        setMessagesByCid((prev) => {
          const next = { ...prev };
          delete next.__pending__;
          return next;
        });
        await loadConversationMessages(serverMsg.conversationId);
        await refreshConversations({ preferredActiveId: serverMsg.conversationId });
        return;
      }

      if (activeCid && serverMsg) {
        setMessagesByCid((prev) => ({
          ...prev,
          [activeCid]: (prev[activeCid] || []).map((m) => (m.id === tempId ? serverMsg : m))
        }));
      } else {
        if (activeCid) await loadConversationMessages(activeCid);
      }

      await refreshConversations({ preferredActiveId: activeCid });
    } catch (error) {
      setErrorBanner(error?.message || 'Failed to send message');
      setMessagesByCid((prev) => ({
        ...prev,
        ...(activeCid ? { [activeCid]: (prev[activeCid] || []).map((m) => (m.id === tempId ? { ...m, status: 'sent' } : m)) } : {}),
        ...(!activeCid ? { __pending__: (prev.__pending__ || []).map((m) => (m.id === tempId ? { ...m, status: 'sent' } : m)) } : {})
      }));
    }
  };

  const currentConversation = useMemo(() => {
    const found = conversations.find((c) => c.id === activeCid);
    if (found) return found;
    if (!pendingRecipient) return null;

    const name = pendingRecipient.name || 'Business';
    return {
      id: null,
      name,
      avatar: initialsFromName(name),
      lastMessage: '',
      lastTime: new Date().toISOString(),
      unread: 0,
      status: 'offline',
      lastSeen: '',
      archived: false,
      blocked: false,
      otherPartyId: pendingRecipient.id,
      otherPartyType: 'business',
      otherPartyImage: null
    };
  }, [conversations, activeCid, pendingRecipient]);

  const filteredConversations = useMemo(
    () =>
      conversations.filter((c) => {
        const query = sidebarSearch.toLowerCase();
        const matches =
          c.name.toLowerCase().includes(query) || c.lastMessage.toLowerCase().includes(query);
        if (c.archived || c.blocked) return false;
        return matches;
      }),
    [conversations, sidebarSearch]
  );

  const archivedConversations = useMemo(
    () => conversations.filter((c) => c.archived),
    [conversations]
  );

  const blockedConversations = useMemo(
    () => conversations.filter((c) => c.blocked),
    [conversations]
  );

  const currentMessages = useMemo(() => {
    if (activeCid) return messagesByCid[activeCid] || [];
    if (pendingRecipient) return messagesByCid.__pending__ || [];
    return [];
  }, [messagesByCid, activeCid, pendingRecipient]);

  const groupedMessages = useMemo(() => {
    const groups = [];
    currentMessages.forEach((msg, idx) => {
      const dateLabel = formatDate(msg.timestamp);
      if (idx === 0 || formatDate(currentMessages[idx - 1].timestamp) !== dateLabel) {
        groups.push({ type: 'date', label: dateLabel });
      }
      groups.push({ type: 'msg', ...msg });
    });
    return groups;
  }, [currentMessages]);

  const handleSelectConversation = async (id) => {
    setPendingRecipient(null);
    setActiveCid(id);
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
    if (window.innerWidth < 900) setIsSidebarCollapsed(true);

    if (!sessionId) return;
    try {
      await Promise.all([
        loadConversationMessages(id),
        markConversationRead({ sessionId, conversationId: id })
      ]);
    } catch (error) {
      setErrorBanner(error?.message || 'Failed to load messages');
    }
  };

  const presenceText = currentConversation
    ? currentConversation.status === 'online'
      ? 'Online'
      : `Last seen ${currentConversation.lastSeen}`
    : '';

  return (
    <div
      className={`chp-app-container ${(isProfileOpen || isArchivePanelOpen || isBlockedPanelOpen || isMyProfileOpen) ? 'has-profile' : ''} ${(isArchivePanelOpen || isBlockedPanelOpen || isMyProfileOpen) ? 'sidepanel-left-open' : ''}`}
    >
      {(errorBanner || isBootLoading) && (
        <div className="chp-top-banner-wrap" aria-live="polite">
          {errorBanner && (
            <div className="chp-top-banner" role="alert">
              <span className="chp-top-banner-text">{errorBanner}</span>
              <button className="chp-top-banner-close" onClick={() => setErrorBanner('')} aria-label="Dismiss">
                ×
              </button>
            </div>
          )}
          {isBootLoading && (
            <div className="chp-top-banner chp-top-banner-info" role="status">
              <span className="chp-top-banner-text">Loading chat…</span>
            </div>
          )}
        </div>
      )}
      <aside className={`chp-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`} aria-label="Conversation Sidebar">
        <header className="chp-sidebar-header">
          <div className="chp-header-brand">
            <img className="chp-logo" src={logoUrl} alt="CompareHubPrices logo" />
          </div>
          <div className="chp-header-actions" ref={sidebarMenuRef}>
            <button
              className="chp-icon-btn"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Icons.Moon /> : <Icons.Sun />}
            </button>
            <button
              className="chp-icon-btn"
              aria-label="More options"
              onClick={() => setIsSidebarMenuOpen((prev) => !prev)}
            >
              <Icons.More />
            </button>
            {isSidebarMenuOpen && (
              <div className="chp-dropdown" role="menu" aria-label="Sidebar menu">
                <button className="chp-dropdown-item" onClick={handleGoHome} role="menuitem">
                  Home
                </button>
                <button className="chp-dropdown-item" onClick={handleGoSettings} role="menuitem">
                  Settings
                </button>
                <button className="chp-dropdown-item" onClick={handleLogout} role="menuitem">
                  Logout
                </button>
                <button className="chp-dropdown-item" onClick={handleDeleteAllChats} role="menuitem">
                  Delete chats
                </button>
                <button className="chp-dropdown-item" onClick={handleMarkAllRead} role="menuitem">
                  Mark as read
                </button>
                <button
                  className="chp-dropdown-item"
                  onClick={handleOpenArchivePanel}
                  role="menuitem"
                >
                  Archive chats
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="chp-search-box">
          <div className="chp-search-inner">
            <Icons.Search />
            <input
              className="chp-search-input"
              placeholder="Search conversations..."
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              aria-label="Filter conversations"
            />
          </div>
        </div>

        <div className="chp-chat-list" role="list">
                    {filteredConversations.map((c) => (
                        <div
                          key={c.id}
                          className={`chp-chat-item ${activeCid === c.id ? 'active' : ''}`}
                          onClick={() => {
                            handleSelectConversation(c.id);
                          }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && handleSelectConversation(c.id)}
                          aria-label={`Open conversation with ${c.name}`}
                        >
                          <div className="chp-avatar">
                {c.avatar}
                <span className={`chp-status-dot ${c.status}`}></span>
              </div>
              <div className="chp-chat-content">
                <div className="chp-chat-top">
                  <span className="chp-chat-name">{c.name}</span>
                  <span className="chp-chat-time">{formatDate(c.lastTime)}</span>
                </div>
                            <div className="chp-chat-bottom">
                              <span className="chp-chat-preview">{c.lastMessage}</span>
                              <div className="chp-chat-actions">
                                {c.unread > 0 && <span className="chp-unread-badge">{c.unread}</span>}
                                <button
                                  className="chp-icon-btn chp-icon-btn-sm"
                                  aria-label="Chat options"
                                  onClick={(e) => openContextMenu(e, c.id)}
                                >
                                  <Icons.More />
                                </button>
                              </div>
                </div>
              </div>
            </div>
          ))}
          {filteredConversations.length === 0 && (
            <div className="chp-empty-list">No matches found</div>
          )}
        </div>

        <div className="chp-sidebar-footer">
          <div className="chp-footer-group">
            <button
              className={`chp-icon-btn ${isArchivePanelOpen ? 'active' : ''}`}
              aria-label="Open archived chats panel"
              onClick={handleOpenArchivePanel}
            >
              <Icons.Archive />
            </button>
            <button
              className={`chp-icon-btn ${isBlockedPanelOpen ? 'active' : ''}`}
              aria-label="Open blocked users panel"
              onClick={handleOpenBlockedPanel}
            >
              <Icons.Blocked />
            </button>
          </div>
          <div className="chp-footer-center">
            <button className="chp-icon-btn" aria-label="Home" onClick={handleGoHome}>
              <Icons.Home />
            </button>
          </div>
          <div className="chp-footer-group">
            <button className="chp-avatar chp-avatar-small chp-avatar-btn" aria-label="Open my profile" onClick={handleOpenMyProfile}>
              {myProfile.initials}
            </button>
            <button className="chp-icon-btn" aria-label="Logout" onClick={handleLogout}>
              <Icons.Logout />
            </button>
          </div>
        </div>
      </aside>

      <main className="chp-main" aria-label="Chat View">
        {currentConversation ? (
          <>
            <header className="chp-main-header">
              <button
                className="chp-icon-btn chp-back-btn"
                onClick={() => setIsSidebarCollapsed(false)}
                aria-label="Open conversation list"
              >
                <Icons.Back />
              </button>
              <div className="chp-avatar">{currentConversation.avatar}</div>
              <div className="chp-main-info">
                <div className="chp-chat-name">{currentConversation.name}</div>
                <div className="chp-main-subtitle">
                  {isTyping ? <span className="chp-typing">Typing...</span> : presenceText}
                </div>
              </div>
              <div className="chp-header-actions" ref={chatMenuRef}>
                <button
                  className="chp-icon-btn"
                  aria-label="More options"
                  onClick={() => setIsChatMenuOpen((prev) => !prev)}
                >
                  <Icons.More />
                </button>
                {isChatMenuOpen && (
                  <div className="chp-dropdown" role="menu" aria-label="Chat options">
                    <button
                      className="chp-dropdown-item"
                      onClick={() => openConfirm('clear', currentConversation.id)}
                      role="menuitem"
                    >
                      Clear chat
                    </button>
                    <button
                      className="chp-dropdown-item"
                      onClick={() => openConfirm('delete', currentConversation.id)}
                      role="menuitem"
                    >
                      Delete chat
                    </button>
                    <button
                      className="chp-dropdown-item"
                      onClick={() => openReport(currentConversation.id)}
                      role="menuitem"
                    >
                      Report
                    </button>
                    <button
                      className="chp-dropdown-item"
                      onClick={() => openConfirm('block', currentConversation.id)}
                      role="menuitem"
                    >
                      Block
                    </button>
                    <button
                      className="chp-dropdown-item"
                      onClick={handleOpenProfile}
                      role="menuitem"
                    >
                      Profile info
                    </button>
                  </div>
                )}
              </div>
            </header>

            <div className="chp-message-list" ref={scrollRef} role="log" aria-live="polite">
              {groupedMessages.map((item, idx) =>
                item.type === 'date' ? (
                  <div key={`date-${idx}`} className="chp-date-separator">
                    <span>{item.label}</span>
                  </div>
                ) : (
                  <div key={item.id} className={`chp-message-row ${item.sender}`}>
                    <div className={`chp-message-bubble ${item.sender}`}>
                      <div className="chp-message-text">{item.text}</div>
                      <div className="chp-message-footer">
                        <span className="chp-message-time">{formatTime(item.timestamp)}</span>
                        {item.sender === 'me' && <Icons.Checks status={item.status} />}
                      </div>
                    </div>
                  </div>
                )
              )}
              {isTyping && (
                <div className="chp-message-row them">
                  <div className="chp-message-bubble them chp-typing-bubble" aria-label="Typing indicator">
                    <span className="chp-typing-dot"></span>
                    <span className="chp-typing-dot"></span>
                    <span className="chp-typing-dot"></span>
                  </div>
                </div>
              )}
            </div>

            <form className="chp-composer" onSubmit={handleSend}>
              <button type="button" className="chp-icon-btn" aria-label="Insert emoji">
                <Icons.Emoji />
              </button>
              <button type="button" className="chp-icon-btn" aria-label="Attach file">
                <Icons.Attach />
              </button>
              <div className="chp-input-container">
                <textarea
                  className="chp-textarea"
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={1}
                  aria-label="Message input"
                />
              </div>
              <button
                type="submit"
                className="chp-icon-btn chp-send-btn"
                disabled={!inputText.trim()}
                aria-label="Send message"
              >
                <Icons.Send />
              </button>
            </form>
          </>
        ) : (
          <div className="chp-empty-state">
            <img className="chp-logo chp-logo-lg" src={logoUrl} alt="CompareHubPrices logo" />
            <h1>CompareHubPrices Chat</h1>
            <p>Select a contact to begin comparing prices and discussing quotes.</p>
          </div>
        )}
      </main>
      {isProfileOpen && currentConversation && (
        <aside className="chp-profile-panel" aria-label="Profile panel">
          <div className="chp-profile-header">
            <button className="chp-icon-btn chp-profile-close" aria-label="Close profile" onClick={handleCloseProfile}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
            <div className="chp-avatar chp-avatar-lg">{currentConversation.avatar}</div>
            <div>
              <h2>{currentConversation.name}</h2>
              <div className="chp-profile-subtitle">Profile info</div>
            </div>
          </div>
          <div className="chp-profile-list">
            <div className="chp-profile-row"><span>Conversation ID</span><strong>{currentConversation.id}</strong></div>
            <div className="chp-profile-row"><span>Contact ID</span><strong>{currentConversation.otherPartyId ?? '—'}</strong></div>
            <div className="chp-profile-row"><span>Contact type</span><strong>{currentConversation.otherPartyType ?? '—'}</strong></div>
            <div className="chp-profile-row"><span>Status</span><strong>{currentConversation.status === 'online' ? 'Online' : `Last seen ${currentConversation.lastSeen}`}</strong></div>
            <div className="chp-profile-row"><span>Blocked</span><strong>{currentConversation.blocked ? 'Yes' : 'No'}</strong></div>
          </div>
          <div className="chp-profile-actions">
            <button className="chp-btn chp-btn-ghost" onClick={() => handleArchiveChat(currentConversation.id)}>
              Archive
            </button>
            <button className="chp-btn chp-btn-ghost" onClick={() => openConfirm('clear', currentConversation.id)}>
              Clear chat
            </button>
            <button className="chp-btn chp-btn-ghost chp-btn-danger-text" onClick={() => openReport(currentConversation.id)}>
              <Icons.Report />
              Report
            </button>
            <button className="chp-btn chp-btn-ghost chp-btn-danger-text" onClick={() => openConfirm('block', currentConversation.id)}>
              <Icons.Blocked />
              Block
            </button>
            <button className="chp-btn chp-btn-ghost chp-btn-danger-text" onClick={() => openConfirm('delete', currentConversation.id)}>
              <Icons.Delete />
              Delete chat
            </button>
          </div>
        </aside>
      )}

      {isMyProfileOpen && (
        <aside className="chp-profile-panel chp-side-panel chp-side-panel-left" aria-label="My profile panel">
          <div className="chp-profile-header">
            <button className="chp-icon-btn chp-profile-close" aria-label="Close my profile" onClick={handleCloseMyProfile}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
            <div className="chp-avatar chp-avatar-lg">{myProfile.initials}</div>
            <div>
              <h2>{myProfile.firstName} {myProfile.lastName}</h2>
              <div className="chp-profile-subtitle">My profile</div>
            </div>
          </div>
          <div className="chp-profile-list">
            <div className="chp-profile-row"><span>User ID</span><strong>{myProfile.userId}</strong></div>
            <div className="chp-profile-row"><span>First name</span><strong>{myProfile.firstName}</strong></div>
            <div className="chp-profile-row"><span>Last name</span><strong>{myProfile.lastName}</strong></div>
            <div className="chp-profile-row"><span>Suburb</span><strong>{myProfile.suburb}</strong></div>
            <div className="chp-profile-row"><span>City</span><strong>{myProfile.city}</strong></div>
            <div className="chp-profile-row"><span>Province</span><strong>{myProfile.province}</strong></div>
            <div className="chp-profile-row"><span>Account since</span><strong>{myProfile.accountSince}</strong></div>
          </div>
        </aside>
      )}

      {isArchivePanelOpen && (
        <aside className="chp-profile-panel chp-side-panel chp-side-panel-left" aria-label="Archived chats panel">
          <div className="chp-profile-header">
            <button className="chp-icon-btn chp-profile-close" aria-label="Close archived panel" onClick={handleCloseArchivePanel}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
            <div>
              <h2>Archived chats</h2>
              <div className="chp-profile-subtitle">Saved conversations</div>
            </div>
          </div>
          <div className="chp-sidepanel-list">
            {archivedConversations.length === 0 && (
              <div className="chp-empty-list">No archived chats</div>
            )}
            {archivedConversations.map((c) => (
              <div key={c.id} className="chp-sidepanel-item">
                <div className="chp-avatar chp-avatar-small">{c.avatar}</div>
                <div className="chp-sidepanel-info">
                  <div className="chp-sidepanel-top">
                    <strong>{c.name}</strong>
                    <span className="chp-chat-time">{formatDate(c.lastTime)}</span>
                  </div>
                  <div className="chp-sidepanel-preview">{c.lastMessage}</div>
                </div>
                <div className="chp-sidepanel-actions">
                  <button
                    className="chp-btn chp-btn-ghost chp-btn-mini"
                    onClick={() => {
                      handleUnarchiveChat(c.id);
                      handleSelectConversation(c.id);
                      handleCloseArchivePanel();
                    }}
                  >
                    Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}

      {isBlockedPanelOpen && (
        <aside className="chp-profile-panel chp-side-panel chp-side-panel-left" aria-label="Blocked users panel">
          <div className="chp-profile-header">
            <button className="chp-icon-btn chp-profile-close" aria-label="Close blocked panel" onClick={handleCloseBlockedPanel}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
            <div>
              <h2>Blocked users</h2>
              <div className="chp-profile-subtitle">Contacts you blocked</div>
            </div>
          </div>
          <div className="chp-sidepanel-list">
            {blockedConversations.length === 0 && (
              <div className="chp-empty-list">No blocked users</div>
            )}
            {blockedConversations.map((c) => (
              <div key={c.id} className="chp-sidepanel-item">
                <div className="chp-avatar chp-avatar-small">{c.avatar}</div>
                <div className="chp-sidepanel-info">
                  <div className="chp-sidepanel-top">
                    <strong>{c.name}</strong>
                    <span className="chp-chat-time">{formatDate(c.lastTime)}</span>
                  </div>
                  <div className="chp-sidepanel-preview">{c.lastMessage}</div>
                </div>
                <div className="chp-sidepanel-actions">
                  <button
                    className="chp-btn chp-btn-ghost chp-btn-mini"
                    onClick={() => {
                      handleUnblockChat(c.id);
                      handleSelectConversation(c.id);
                      handleCloseBlockedPanel();
                    }}
                  >
                    Unblock
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}

      {contextMenu.visible && (
        <div
          ref={contextMenuRef}
          className="chp-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          role="menu"
          aria-label="Chat actions"
        >
          <button className="chp-dropdown-item" onClick={() => openConfirm('clear', contextMenu.cid)} role="menuitem">
            Clear chat
          </button>
          <button className="chp-dropdown-item" onClick={() => openConfirm('delete', contextMenu.cid)} role="menuitem">
            Delete chat
          </button>
          <button className="chp-dropdown-item" onClick={() => openConfirm('block', contextMenu.cid)} role="menuitem">
            Block
          </button>
          <button className="chp-dropdown-item" onClick={() => handleArchiveChat(contextMenu.cid)} role="menuitem">
            Archive
          </button>
        </div>
      )}

      {isDeleteConfirmOpen && (
        <div className="chp-modal-backdrop" role="dialog" aria-modal="true" aria-label="Delete chats confirmation">
          <div className="chp-modal">
            <h2>Delete all chats?</h2>
            <p>This will remove all conversations and messages. This action cannot be undone.</p>
            <div className="chp-modal-actions">
              <button className="chp-btn chp-btn-ghost" onClick={cancelDeleteAllChats}>
                No
              </button>
              <button className="chp-btn chp-btn-danger" onClick={confirmDeleteAllChats}>
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="chp-modal-backdrop" role="dialog" aria-modal="true" aria-label="Confirm action">
          <div className="chp-modal">
            <h2>
              {confirmAction === 'delete'
                ? 'Delete this chat?'
                : confirmAction === 'block'
                  ? 'Block this chat?'
                  : 'Clear this chat?'}
            </h2>
            <p>
              {confirmAction === 'delete'
                ? 'This chat will be removed permanently.'
                : confirmAction === 'block'
                  ? 'You will no longer be able to message this contact.'
                  : 'This will remove all messages in this chat.'}
            </p>
            <div className="chp-modal-actions">
              <button className="chp-btn chp-btn-ghost" onClick={closeConfirm}>
                No
              </button>
              <button className="chp-btn chp-btn-danger" onClick={confirmAndRun}>
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {isReportOpen && (
        <div className="chp-modal-backdrop" role="dialog" aria-modal="true" aria-label="Report chat">
          <div className="chp-modal">
            <h2>Report this chat</h2>
            <p>Select a reason for reporting this conversation.</p>
            <div className="chp-report-list" role="radiogroup" aria-label="Report reasons">
              {reportReasons.map((reason) => (
                <label key={reason} className="chp-report-option">
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason}
                    checked={reportReason === reason}
                    onChange={() => setReportReason(reason)}
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
            <textarea
              className="chp-report-textarea"
              rows="3"
              placeholder="Add optional details (e.g., what happened)"
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              aria-label="Report details"
            />
            <div className="chp-modal-actions">
              <button className="chp-btn chp-btn-ghost" onClick={closeReport}>
                Cancel
              </button>
              <button className="chp-btn chp-btn-danger" onClick={submitReport}>
                Submit report
              </button>
            </div>
          </div>
        </div>
      )}

      {!sessionId && (
        <div className="chp-modal-backdrop" role="dialog" aria-modal="true" aria-label="Connect session">
          <div className="chp-modal">
            <h2>Connect chat session</h2>
            <p>Paste your Session ID (used as the `x-session-id` header) to load conversations.</p>
            <input
              className="chp-text-input"
              placeholder="Session ID"
              value={sessionDraft}
              onChange={(e) => setSessionDraft(e.target.value)}
              autoComplete="off"
              aria-label="Session ID"
            />
            <div className="chp-modal-actions">
              <button className="chp-btn chp-btn-ghost" onClick={() => setSessionDraft('')}>
                Clear
              </button>
              <button className="chp-btn chp-btn-primary" onClick={handleConnectSession}>
                Connect
              </button>
            </div>
            <p className="chp-modal-hint">
              Tip: for local dev, ensure the edge function allows `http://localhost:5173` in CORS.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
