class BusinessChat {
    constructor() {
        this.currentUserId = null;
        this.users = [];
        this.messages = {};
        this.API_BASE_URL = 'https://hub.comparehubprices.co.za';
        this.SEND_MESSAGE_URL = `${this.API_BASE_URL}/chat-hub/chat/send`;
        // Using separate business-specific endpoints
        this.GET_CONVERSATIONS_URL = `${this.API_BASE_URL}/chat-hub/chat/business/conversations`;
        this.GET_MESSAGES_URL = `${this.API_BASE_URL}/chat-hub/chat/business/messages`;
        this.GET_USER_PROFILE_URL = `${this.API_BASE_URL}/chat-hub/chat/user-profile`;
        this.SET_TYPING_URL = `${this.API_BASE_URL}/chat-hub/chat/typing`;
        // Presence endpoints
        this.PRESENCE_URL = `${this.API_BASE_URL}/chat-hub/chat/business/presence`;
        // Chat actions (mark read, delete)
        this.CHAT_ACTIONS_URL = `${this.API_BASE_URL}/chat-hub/chat/business/actions`;
        this.typingTimeout = null;
        this.typingPollInterval = null;
        this.presenceInterval = null;
        this.init();
    }

    init() {
        this.attachEventListeners();
        this.loadUsers();
        this.startPresenceUpdates();
    }

    // Start updating own presence every 30 seconds
    startPresenceUpdates() {
        // Update presence immediately
        this.updateOwnPresence();
        
        // Then update every 30 seconds
        this.presenceInterval = setInterval(() => {
            this.updateOwnPresence();
        }, 30000);

        // Also update on page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.updateOwnPresence();
            }
        });

        // Update presence before page unload
        window.addEventListener('beforeunload', () => {
            this.updateOwnPresence();
        });
    }

    async updateOwnPresence() {
        try {
            await fetch(this.PRESENCE_URL, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.debug('Error updating presence:', error);
        }
    }

    async getUserPresence(userId) {
        try {
            const response = await fetch(`${this.PRESENCE_URL}?userId=${encodeURIComponent(userId)}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    return data.data;
                }
            }
        } catch (error) {
            console.debug('Error fetching user presence:', error);
        }
        return null;
    }

    updateStatusDisplay(presenceData) {
        const statusElement = document.getElementById('chatBusinessStatus');
        const modalStatusElement = document.getElementById('modalBusinessStatus');
        
        if (presenceData) {
            const statusText = presenceData.isOnline ? 'Online' : presenceData.lastSeenFormatted || 'Offline';
            const statusClass = presenceData.isOnline ? 'online' : 'offline';
            
            if (statusElement) {
                statusElement.textContent = statusText;
                statusElement.className = `chat-status ${statusClass}`;
                statusElement.style.color = presenceData.isOnline ? '#10b981' : '#6c757d';
            }
            
            if (modalStatusElement) {
                modalStatusElement.textContent = statusText;
                modalStatusElement.style.color = presenceData.isOnline ? '#10b981' : '#6c757d';
            }
        }
    }

    attachEventListeners() {
        const sendBtn = document.getElementById('chatSendBtn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        const messageInput = document.getElementById('chatMessageInput');
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                } else {
                    this.handleTyping();
                }
            });
            
            messageInput.addEventListener('input', () => {
                this.handleTyping();
            });
        }
    }

    async loadUsers() {
        try {
            console.log('BusinessChat: Loading users from API:', this.GET_CONVERSATIONS_URL);
            const response = await fetch(this.GET_CONVERSATIONS_URL, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('BusinessChat: Response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('BusinessChat: Get conversations response:', data);
                
                if (data.success && data.data && data.data.users) {
                    this.users = data.data.users.map(user => ({
                        userId: user.userId,
                        userName: user.userName || 'User',
                        email: user.email || '',
                        lastMessage: user.lastMessage || '',
                        lastMessageTime: user.lastMessageTime || new Date().toISOString(),
                        unreadCount: user.unreadCount || 0
                    }));
                    console.log('BusinessChat: Processed users:', this.users.length);
                    this.renderUserList();
                    return;
                } else {
                    console.warn('BusinessChat: API returned success but no users found in response:', data);
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('BusinessChat: API error response:', response.status, errorData);
            }
            
            this.users = [];
            this.renderUserList();
        } catch (error) {
            console.error('BusinessChat: Error loading users from API:', error);
            this.users = [];
            this.renderUserList();
        }
    }

    renderUserList() {
        const container = document.getElementById('businessListContent');
        if (!container) return;

        if (this.users.length === 0) {
            container.innerHTML = `
                <div class="loading-state">
                    <i class="fas fa-user" style="font-size: 3rem; color: #dee2e6; margin-bottom: 1rem;"></i>
                    <p>No users available</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.users.map(user => {
            const lastMessage = user.lastMessage || '';
            const unreadCount = user.unreadCount || 0;
            const lastMessageTime = user.lastMessageTime ? this.formatTime(user.lastMessageTime) : '';
            const userName = user.userName || 'User';
            const initials = this.getInitials(userName);

            return `
                <div class="business-item" data-user-id="${user.userId}" onclick="businessChat.selectUser('${user.userId}')">
                    <div class="business-item-avatar">
                        ${initials}
                    </div>
                    <div class="business-item-info">
                        <div class="business-item-name">${this.escapeHtml(userName)}</div>
                        <div class="business-item-preview">${this.escapeHtml(lastMessage)}</div>
                        <div class="business-item-meta">
                            ${lastMessageTime ? `<span class="business-item-time">${lastMessageTime}</span>` : ''}
                        </div>
                    </div>
                    ${unreadCount > 0 ? `<span class="business-item-badge">${unreadCount}</span>` : ''}
                </div>
            `;
        }).join('');
    }

    async selectUser(userId) {
        document.querySelectorAll('.business-item').forEach(item => {
            item.classList.remove('active');
        });
        const selectedItem = document.querySelector(`[data-user-id="${userId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('active');
        }

        this.currentUserId = userId;
        const user = this.users.find(u => u.userId === userId);

        if (user) {
            document.getElementById('chatBusinessName').textContent = user.userName || 'User';
            document.getElementById('chatBusinessStatus').textContent = 'Loading...';

            const chatAvatar = document.getElementById('chatBusinessAvatar');
            if (chatAvatar) {
                const userName = user.userName || 'User';
                const initials = this.getInitials(userName);
                chatAvatar.textContent = initials;
                chatAvatar.innerHTML = '';
                chatAvatar.textContent = initials;
            }

            // Fetch and display user's presence status
            const presenceData = await this.getUserPresence(userId);
            this.updateStatusDisplay(presenceData);

            if (window.innerWidth <= 768) {
                const sidebar = document.getElementById('businessListSidebar');
                if (sidebar) {
                    sidebar.classList.add('hidden');
                }
                // Add chat-view-active class to body to hide header on mobile
                document.body.classList.add('chat-view-active');
            }

            const emptyState = document.getElementById('chatEmptyState');
            const activeChat = document.getElementById('chatActive');
            const messagesContainer = document.getElementById('chatMessages');
            
            if (emptyState) {
                emptyState.style.display = 'none';
            }
            
            if (activeChat) {
                activeChat.style.display = 'flex';
            }
            
            if (messagesContainer) {
                messagesContainer.innerHTML = `
                    <div style="text-align: center; color: #6c757d; padding: 2rem;">
                        <div class="spinner-border spinner-border-sm" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>
                `;
            }
            
            this.loadMessages(userId);
            this.startTypingPoll(userId);
            
            const messageInput = document.getElementById('chatMessageInput');
            if (messageInput) {
                setTimeout(() => {
                    messageInput.focus();
                }, 100);
            }
        }
    }

    handleTyping() {
        if (!this.currentUserId) return;
        
        this.setTypingStatus(true);
        
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }
        
        this.typingTimeout = setTimeout(() => {
            this.setTypingStatus(false);
        }, 3000);
    }

    async setTypingStatus(isTyping) {
        if (!this.currentUserId) return;
        
        try {
            await fetch(this.SET_TYPING_URL, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: this.currentUserId,
                    isTyping: isTyping
                })
            });
        } catch (error) {
            console.error('Error setting typing status:', error);
        }
    }

    startTypingPoll(userId) {
        if (this.typingPollInterval) {
            clearInterval(this.typingPollInterval);
        }
        
        this.typingPollInterval = setInterval(async () => {
            if (this.currentUserId === userId) {
                await this.checkTypingStatus(userId);
            } else {
                clearInterval(this.typingPollInterval);
            }
        }, 2000);
    }

    async checkTypingStatus(userId) {
        try {
            // Check typing status from typing endpoint
            const typingResponse = await fetch(`${this.SET_TYPING_URL}?userId=${encodeURIComponent(userId)}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (typingResponse.ok) {
                const typingData = await typingResponse.json();
                if (typingData.success && typingData.data) {
                    // Check typing status
                    if (typingData.data.isTyping !== undefined) {
                        this.showTypingIndicator(typingData.data.isTyping);
                    }
                }
            }

            // Also check for new messages
            const messagesResponse = await fetch(`${this.GET_MESSAGES_URL}?userId=${encodeURIComponent(userId)}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (messagesResponse.ok) {
                const data = await messagesResponse.json();
                if (data.success && data.data) {
                    // Check for new messages or updated read status
                    if (data.data.messages) {
                        const newMessages = data.data.messages;
                        const currentMessages = this.messages[userId] || [];
                        
                        // Check if messages have changed (new messages or read status updates)
                        const hasChanges = this.hasMessageChanges(currentMessages, newMessages);
                        
                        if (hasChanges) {
                            this.messages[userId] = newMessages;
                            this.renderMessages(userId);
                        }
                    }
                }
            }

            // Also refresh presence status periodically (every 6th poll = ~12 seconds)
            if (!this.presencePollCounter) this.presencePollCounter = 0;
            this.presencePollCounter++;
            if (this.presencePollCounter >= 6) {
                this.presencePollCounter = 0;
                const presenceData = await this.getUserPresence(userId);
                this.updateStatusDisplay(presenceData);
            }
        } catch (error) {
            console.error('Error checking typing status:', error);
        }
    }

    hasMessageChanges(currentMessages, newMessages) {
        // Different number of messages means new message arrived
        if (currentMessages.length !== newMessages.length) {
            return true;
        }
        
        // Check if any message has different isRead status
        for (let i = 0; i < newMessages.length; i++) {
            const newMsg = newMessages[i];
            const currentMsg = currentMessages.find(m => m.messageId === newMsg.messageId);
            
            if (!currentMsg) {
                return true; // New message found
            }
            
            if (currentMsg.isRead !== newMsg.isRead) {
                return true; // Read status changed
            }
        }
        
        return false;
    }

    showTypingIndicator(isTyping) {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;

        let typingIndicator = document.getElementById('typingIndicator');
        
        if (isTyping) {
            if (!typingIndicator) {
                typingIndicator = document.createElement('div');
                typingIndicator.id = 'typingIndicator';
                typingIndicator.className = 'typing-indicator';
                typingIndicator.innerHTML = `
                    <span class="typing-text">Typing</span>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                `;
                messagesContainer.appendChild(typingIndicator);
            }
            typingIndicator.style.display = 'block';
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } else {
            if (typingIndicator) {
                typingIndicator.style.display = 'none';
            }
        }
    }

    async loadMessages(userId) {
        if (!userId) return;
        
        try {
            console.log('BusinessChat: Loading messages for userId:', userId);
            const response = await fetch(`${this.GET_MESSAGES_URL}?userId=${encodeURIComponent(userId)}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('BusinessChat: Get messages response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('BusinessChat: Get messages response data:', data);
                if (data.success && data.data) {
                    if (data.data.messages) {
                        this.messages[userId] = data.data.messages;
                        console.log('BusinessChat: Loaded', data.data.messages.length, 'messages');
                        this.renderMessages(userId);
                    }
                } else {
                    console.warn('BusinessChat: No messages in response');
                    this.renderMessages(userId, []);
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('BusinessChat: Get messages error:', response.status, errorData);
                this.renderMessages(userId, []);
            }

            // Check typing status from typing endpoint
            try {
                const typingResponse = await fetch(`${this.SET_TYPING_URL}?userId=${encodeURIComponent(userId)}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (typingResponse.ok) {
                    const typingData = await typingResponse.json();
                    if (typingData.success && typingData.data) {
                        if (typingData.data.isTyping !== undefined) {
                            this.showTypingIndicator(typingData.data.isTyping);
                        }
                    }
                }
            } catch (typingError) {
                console.error('BusinessChat: Error checking typing status in loadMessages:', typingError);
            }
        } catch (error) {
            console.error('BusinessChat: Error loading messages:', error);
            this.renderMessages(userId, []);
        }
    }

    renderMessages(userId, messages = null) {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;

        const messageList = messages !== null ? messages : (this.messages[userId] || []);
        
        if (messageList.length === 0) {
            messagesContainer.innerHTML = `
                <div style="text-align: center; color: #6c757d; padding: 2rem;">
                    <p>Start the conversation!</p>
                </div>
            `;
            return;
        }

        messagesContainer.innerHTML = messageList.map(msg => {
            const isSent = msg.senderType === 'business';
            const messageTime = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            }) : '';
            
            let seenIndicator = '';
            if (isSent) {
                if (msg.isRead) {
                    seenIndicator = `
                        <div class="chat-message-seen seen">
                            <i class="fas fa-check-double"></i>
                            <span>Seen</span>
                        </div>
                    `;
                } else {
                    seenIndicator = `
                        <div class="chat-message-seen">
                            <i class="fas fa-check"></i>
                        </div>
                    `;
                }
            } else {
                if (msg.isRead) {
                    seenIndicator = `
                        <div class="chat-message-seen seen">
                            <i class="fas fa-check-double"></i>
                            <span>Seen</span>
                        </div>
                    `;
                }
            }
            
            return `
                <div class="message ${isSent ? 'message-sent' : 'message-received'}">
                    <div class="message-content">${this.escapeHtml(msg.content || '')}</div>
                    <div class="message-time">${messageTime}</div>
                    ${seenIndicator}
                </div>
            `;
        }).join('');

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async sendMessage() {
        const input = document.getElementById('chatMessageInput');
        const message = input?.value.trim();

        if (!message || !this.currentUserId) {
            return;
        }

        const sendBtn = document.getElementById('chatSendBtn');
        if (sendBtn) {
            sendBtn.disabled = true;
        }

        const requestBody = {
            userId: this.currentUserId,
            message: message
        };
        
        console.log('Business sending message:', requestBody);

        try {
            const response = await fetch(this.SEND_MESSAGE_URL, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            console.log('Send message response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Send message error:', errorData);
                throw new Error(errorData.message || 'Failed to send message');
            }

            const data = await response.json();
            console.log('Send message response data:', data);

            if (data.success) {
                input.value = '';
                this.loadUsers();
                if (this.currentUserId) {
                    setTimeout(() => {
                        this.loadMessages(this.currentUserId);
                    }, 500);
                }
            } else {
                throw new Error(data.message || 'Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert(error.message || 'Failed to send message. Please try again.');
        } finally {
            if (sendBtn) {
                sendBtn.disabled = false;
            }
        }
    }

    formatTime(timestamp) {
        if (!timestamp) return '';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getInitials(name) {
        if (!name) return 'U';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    showUserList() {
        // Show the user list sidebar on mobile
        const sidebar = document.getElementById('businessListSidebar');
        if (sidebar) {
            sidebar.classList.remove('hidden');
        }

        // Hide active chat and show empty state on mobile
        if (window.innerWidth <= 768) {
            const chatActive = document.getElementById('chatActive');
            if (chatActive) {
                chatActive.style.display = 'none';
            }
            
            // Remove chat-view-active class from body to show header
            document.body.classList.remove('chat-view-active');
        }

        // Clear current user selection
        this.currentUserId = null;
        
        // Stop typing poll
        if (this.typingPollInterval) {
            clearInterval(this.typingPollInterval);
            this.typingPollInterval = null;
        }
    }

    async showUserInfoModal() {
        if (!this.currentUserId) return;
        
        const user = this.users.find(u => u.userId === this.currentUserId);
        if (!user) return;

        const modal = document.getElementById('businessInfoModal');
        if (!modal) return;

        const modalName = document.getElementById('modalBusinessName');
        const modalStatus = document.getElementById('modalBusinessStatus');
        const modalAvatar = document.getElementById('modalBusinessAvatar');

        if (modalName) {
            modalName.textContent = user.userName || 'User';
        }

        if (modalStatus) {
            modalStatus.textContent = 'Loading...';
        }

        // Fetch presence for modal
        const presenceData = await this.getUserPresence(this.currentUserId);
        if (modalStatus && presenceData) {
            const statusText = presenceData.isOnline ? 'Online' : presenceData.lastSeenFormatted || 'Offline';
            modalStatus.textContent = statusText;
            modalStatus.style.color = presenceData.isOnline ? '#10b981' : '#6c757d';
        }

        try {
            const response = await fetch(`${this.GET_USER_PROFILE_URL}?userId=${encodeURIComponent(this.currentUserId)}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    const profile = data.data;
                    
                    if (modalName) {
                        modalName.textContent = profile.name || user.userName || 'User';
                    }

                    if (modalAvatar) {
                        const userName = profile.name || user.userName || 'User';
                        const initials = this.getInitials(userName);
                        modalAvatar.textContent = initials;
                        modalAvatar.innerHTML = '';
                        modalAvatar.textContent = initials;
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }

        if (modalAvatar && !modalAvatar.textContent) {
            const userName = user.userName || 'User';
            const initials = this.getInitials(userName);
            modalAvatar.textContent = initials;
        }

        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    viewUserProfile() {
        if (!this.currentUserId) return;
        window.location.href = `regular_view_profile.html?userId=${encodeURIComponent(this.currentUserId)}`;
    }

    reportUser() {
        if (!this.currentUserId) return;
        alert('Report user functionality coming soon');
    }

    blockUser() {
        if (!this.currentUserId) return;
        alert('Block user functionality coming soon');
    }

    async markMessagesAsRead(userId = null) {
        const targetUserId = userId || this.currentUserId;
        if (!targetUserId) return;

        try {
            const response = await fetch(`${this.CHAT_ACTIONS_URL}?userId=${encodeURIComponent(targetUserId)}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Messages marked as read:', data);
                
                // Refresh the conversation list to update unread counts
                this.loadUsers();
                
                // Refresh messages to update read status
                if (this.currentUserId === targetUserId) {
                    this.loadMessages(targetUserId);
                }
                
                return data;
            }
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
        return null;
    }

    async deleteConversation(userId = null) {
        const targetUserId = userId || this.currentUserId;
        if (!targetUserId) return;

        const user = this.users.find(u => u.userId === targetUserId);
        const userName = user?.userName || 'this user';

        // Show confirmation dialog
        const confirmed = confirm(`Are you sure you want to delete the conversation with ${userName}? This action cannot be undone.`);
        if (!confirmed) return;

        try {
            const response = await fetch(`${this.CHAT_ACTIONS_URL}?userId=${encodeURIComponent(targetUserId)}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Conversation deleted:', data);

                // Close the modal if open
                const modal = document.getElementById('businessInfoModal');
                if (modal) {
                    const bootstrapModal = bootstrap.Modal.getInstance(modal);
                    if (bootstrapModal) {
                        bootstrapModal.hide();
                    }
                }

                // Show success message
                if (typeof showSuccessToast === 'function') {
                    showSuccessToast('Conversation deleted successfully');
                } else {
                    alert('Conversation deleted successfully');
                }

                // Clear current selection and go back to list
                this.currentUserId = null;
                this.showUserList();
                
                // Refresh conversations list
                this.loadUsers();
                
                return data;
            } else {
                throw new Error('Failed to delete conversation');
            }
        } catch (error) {
            console.error('Error deleting conversation:', error);
            if (typeof showErrorToast === 'function') {
                showErrorToast('Failed to delete conversation. Please try again.');
            } else {
                alert('Failed to delete conversation. Please try again.');
            }
        }
        return null;
    }
}

let businessChat;
document.addEventListener('DOMContentLoaded', function() {
    businessChat = new BusinessChat();
    
    const loadingOverlay = document.getElementById('pageLoadingOverlay');
    if (loadingOverlay) {
        setTimeout(() => {
            loadingOverlay.classList.add('hidden');
            setTimeout(() => {
                loadingOverlay.remove();
            }, 500);
        }, 500);
    }
});

