class RegularUserChat {
    constructor() {
        this.currentBusinessId = null;
        this.businesses = [];
        this.pendingBusinessId = null;
        this.API_BASE_URL = 'https://hub.comparehubprices.co.za';
        this.SEND_MESSAGE_URL = `${this.API_BASE_URL}/chat-hub/chat/send`;
        // Using separate user-specific endpoints
        this.GET_CONVERSATIONS_URL = `${this.API_BASE_URL}/chat-hub/chat/user/conversations`;
        this.GET_BUSINESS_PROFILE_URL = `${this.API_BASE_URL}/chat-hub/chat/business-profile`;
        this.GET_MESSAGES_URL = `${this.API_BASE_URL}/chat-hub/chat/user/messages`;
        this.SET_TYPING_URL = `${this.API_BASE_URL}/chat-hub/chat/typing`;
        // Presence endpoints
        this.PRESENCE_URL = `${this.API_BASE_URL}/chat-hub/chat/user/presence`;
        // Chat actions (mark read, delete)
        this.CHAT_ACTIONS_URL = `${this.API_BASE_URL}/chat-hub/chat/user/actions`;
        this.messages = {};
        this.typingTimeout = null;
        this.typingPollInterval = null;
        this.presenceInterval = null;
        this.init();
    }

    init() {
        const urlParams = new URLSearchParams(window.location.search);
        this.pendingBusinessId = urlParams.get('businessId');
        this.attachEventListeners();
        this.loadBusinesses();
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

    async getBusinessPresence(businessId) {
        try {
            const response = await fetch(`${this.PRESENCE_URL}?businessId=${encodeURIComponent(businessId)}`, {
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
            console.debug('Error fetching business presence:', error);
        }
        return null;
    }

    updateStatusDisplay(presenceData) {
        const statusElement = document.getElementById('chatBusinessStatus');
        const modalStatusElement = document.getElementById('modalBusinessStatus');
        const statusDot = document.getElementById('statusDot');
        
        if (presenceData) {
            const statusText = presenceData.isOnline ? 'Online' : presenceData.lastSeenFormatted || 'Offline';
            const statusClass = presenceData.isOnline ? 'online' : 'offline';
            const statusColor = presenceData.isOnline ? '#10b981' : '#9ca3af';
            
            if (statusElement) {
                statusElement.textContent = statusText;
                statusElement.className = `chat-status ${statusClass}`;
                statusElement.style.color = statusColor;
            }
            
            if (statusDot) {
                statusDot.style.background = statusColor;
            }
            
            if (modalStatusElement) {
                modalStatusElement.textContent = statusText;
                modalStatusElement.style.color = statusColor;
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

    async loadBusinesses() {
        try {
            const response = await fetch(this.GET_CONVERSATIONS_URL, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Get conversations response:', data);
                
                if (data.success && data.data && data.data.businesses) {
                    this.businesses = data.data.businesses.map(biz => ({
                        businessId: biz.businessId,
                        businessName: biz.businessName || 'Business',
                        email: biz.email || '',
                        businessLogoUrl: biz.businessLogoUrl || biz.logo || null,
                        lastMessage: biz.lastMessage || '',
                        lastMessageTime: biz.lastMessageTime || new Date().toISOString(),
                        unreadCount: biz.unreadCount || 0
                    }));
                    
                    const logoPromises = this.businesses.map(async (business) => {
                        if (!business.businessLogoUrl) {
                            try {
                                const profileResponse = await fetch(`${this.GET_BUSINESS_PROFILE_URL}?businessId=${encodeURIComponent(business.businessId)}`, {
                                    method: 'GET',
                                    credentials: 'include',
                                    headers: { 'Content-Type': 'application/json' }
                                });
                                if (profileResponse.ok) {
                                    const profileData = await profileResponse.json();
                                    if (profileData.success && profileData.data) {
                                        business.businessLogoUrl = profileData.data.businessLogoUrl || profileData.data.logo || null;
                                    }
                                }
                            } catch (error) {
                                console.warn('Error fetching business logo:', error);
                            }
                        }
                    });
                    
                    await Promise.all(logoPromises);
                    this.renderBusinessList();
                    
                    if (this.pendingBusinessId) {
                        setTimeout(() => {
                            this.handlePendingBusiness();
                        }, 200);
                    }
                    return;
                }
            }
            
            this.businesses = [];
            this.renderBusinessList();
            
            if (this.pendingBusinessId) {
                setTimeout(() => {
                    this.handlePendingBusiness();
                }, 200);
            }
        } catch (error) {
            console.error('Error loading businesses from API:', error);
            this.businesses = [];
            this.renderBusinessList();
            
            if (this.pendingBusinessId) {
                setTimeout(() => {
                    this.handlePendingBusiness();
                }, 200);
            }
        }
    }

    async handlePendingBusiness() {
        if (!this.pendingBusinessId) return;
        
        const businessId = this.pendingBusinessId;
        this.pendingBusinessId = null;
        
        let business = this.businesses.find(b => b.businessId === businessId);
        
        if (!business) {
            try {
                const response = await fetch(`${this.GET_BUSINESS_PROFILE_URL}?businessId=${encodeURIComponent(businessId)}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data) {
                        business = {
                            businessId: data.data.businessId || businessId,
                            businessName: data.data.businessName || 'Business',
                            email: data.data.email || '',
                            lastMessage: '',
                            lastMessageTime: new Date().toISOString(),
                            unreadCount: 0
                        };
                        this.businesses.unshift(business);
                        this.renderBusinessList();
                    }
                } else {
                    console.warn('Failed to fetch business profile, using fallback');
                }
            } catch (error) {
                console.warn('Error fetching business info, using fallback:', error.message);
            }
            
            if (!business) {
                business = {
                    businessId: businessId,
                    businessName: 'Business',
                    email: '',
                    lastMessage: '',
                    lastMessageTime: new Date().toISOString(),
                    unreadCount: 0
                };
                this.businesses.unshift(business);
                this.renderBusinessList();
            }
        }
        
        if (business) {
            await new Promise(resolve => setTimeout(resolve, 300));
            await this.selectBusiness(businessId);
        }
    }

    renderBusinessList() {
        const container = document.getElementById('businessListContent');
        if (!container) return;

        if (this.businesses.length === 0) {
            container.innerHTML = `
                <div class="loading-state">
                    <i class="fas fa-comments"></i>
                    <p>No chats available</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.businesses.map(business => {
            const lastMessage = business.lastMessage || '';
            const unreadCount = business.unreadCount || 0;
            const lastMessageTime = business.lastMessageTime ? this.formatTime(business.lastMessageTime) : '';
            const logoUrl = business.businessLogoUrl || business.logo || null;

            return `
                <div class="business-item" data-business-id="${business.businessId}" onclick="regularUserChat.selectBusiness('${business.businessId}')">
                    <div class="business-item-avatar">
                        ${logoUrl ? `<img src="${this.escapeHtml(logoUrl)}" alt="${this.escapeHtml(business.businessName || 'Business')}">` : '<i class="fas fa-store"></i>'}
                    </div>
                    <div class="business-item-info">
                        <div class="business-item-name">${this.escapeHtml(business.businessName || 'Business')}</div>
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

    async selectBusiness(businessId) {
        document.querySelectorAll('.business-item').forEach(item => {
            item.classList.remove('active');
        });
        const selectedItem = document.querySelector(`[data-business-id="${businessId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('active');
        }

        this.currentBusinessId = businessId;
        const business = this.businesses.find(b => b.businessId === businessId);

        if (business) {
            document.getElementById('chatBusinessName').textContent = business.businessName || 'Business';
            document.getElementById('chatBusinessStatus').textContent = 'Loading...';

            const chatAvatar = document.getElementById('chatBusinessAvatar');
            if (chatAvatar) {
                let logoUrl = business.businessLogoUrl || business.logo || null;
                
                if (!logoUrl) {
                    try {
                        const response = await fetch(`${this.GET_BUSINESS_PROFILE_URL}?businessId=${encodeURIComponent(businessId)}`, {
                            method: 'GET',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' }
                        });
                        if (response.ok) {
                            const data = await response.json();
                            if (data.success && data.data) {
                                logoUrl = data.data.businessLogoUrl || data.data.logo || null;
                                business.businessLogoUrl = logoUrl;
                            }
                        }
                    } catch (error) {
                        console.warn('Error fetching business logo:', error);
                    }
                }
                
                if (logoUrl) {
                    chatAvatar.innerHTML = `<img src="${this.escapeHtml(logoUrl)}" alt="${this.escapeHtml(business.businessName || 'Business')}">`;
                } else {
                    chatAvatar.innerHTML = '<i class="fas fa-store"></i>';
                }
            }

            // Fetch and display business's presence status
            const presenceData = await this.getBusinessPresence(businessId);
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
            
            this.loadMessages(businessId, true); // true = mark as read when opening conversation
            this.startTypingPoll(businessId);
            
            const messageInput = document.getElementById('chatMessageInput');
            if (messageInput) {
                setTimeout(() => {
                    messageInput.focus();
                }, 100);
            }
        }
    }

    handleTyping() {
        if (!this.currentBusinessId) return;
        
        this.setTypingStatus(true);
        
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }
        
        this.typingTimeout = setTimeout(() => {
            this.setTypingStatus(false);
        }, 3000);
    }

    async setTypingStatus(isTyping) {
        if (!this.currentBusinessId) return;
        
        try {
            await fetch(this.SET_TYPING_URL, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    businessId: this.currentBusinessId,
                    isTyping: isTyping
                })
            });
        } catch (error) {
            console.error('Error setting typing status:', error);
        }
    }

    startTypingPoll(businessId) {
        if (this.typingPollInterval) {
            clearInterval(this.typingPollInterval);
        }
        
        this.typingPollInterval = setInterval(async () => {
            if (this.currentBusinessId === businessId) {
                await this.checkTypingStatus(businessId);
            } else {
                clearInterval(this.typingPollInterval);
            }
        }, 2000);
    }

    async checkTypingStatus(businessId) {
        try {
            // Check typing status from typing endpoint
            const typingResponse = await fetch(`${this.SET_TYPING_URL}?businessId=${encodeURIComponent(businessId)}`, {
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
                    
                    // Note: If messages were marked as seen, the message check below will detect the read status changes
                    // and automatically refresh the UI via hasMessageChanges()
                }
            }

            // Also check for new messages
            const messagesResponse = await fetch(`${this.GET_MESSAGES_URL}?businessId=${encodeURIComponent(businessId)}`, {
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
                        const currentMessages = this.messages[businessId] || [];
                        
                        // Check if messages have changed (new messages or read status updates)
                        const hasChanges = this.hasMessageChanges(currentMessages, newMessages);
                        
                        if (hasChanges) {
                            this.messages[businessId] = newMessages;
                            this.renderMessages(businessId);
                        }
                    }
                }
            }

            // Also refresh presence status periodically (every 6th poll = ~12 seconds)
            if (!this.presencePollCounter) this.presencePollCounter = 0;
            this.presencePollCounter++;
            if (this.presencePollCounter >= 6) {
                this.presencePollCounter = 0;
                const presenceData = await this.getBusinessPresence(businessId);
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
        
        // Check if any message has different read status
        for (let i = 0; i < newMessages.length; i++) {
            const newMsg = newMessages[i];
            const currentMsg = currentMessages.find(m => m.messageId === newMsg.messageId);
            
            if (!currentMsg) {
                return true; // New message found
            }
            
            // Check status changes - for sent messages check delivered and readByBusiness
            const isSent = newMsg.senderType === 'user';
            if (isSent) {
                // For sent messages, check if delivered or readByBusiness changed
                // Normalize undefined/null to false for comparison
                const currentDelivered = Boolean(currentMsg.delivered);
                const newDelivered = Boolean(newMsg.delivered);
                const currentReadByBusiness = Boolean(currentMsg.readByBusiness);
                const newReadByBusiness = Boolean(newMsg.readByBusiness);
                
                if (currentDelivered !== newDelivered || currentReadByBusiness !== newReadByBusiness) {
                    console.log('Message status changed (sent):', {
                        messageId: newMsg.messageId,
                        delivered: { from: currentDelivered, to: newDelivered },
                        readByBusiness: { from: currentReadByBusiness, to: newReadByBusiness }
                    });
                    return true; // Status changed (sent -> delivered -> read)
                }
                
                // Also check deliveredAt and readAt timestamps
                if (currentMsg.deliveredAt !== newMsg.deliveredAt || currentMsg.readAt !== newMsg.readAt) {
                    console.log('Message timestamp changed (sent):', {
                        messageId: newMsg.messageId,
                        deliveredAt: { from: currentMsg.deliveredAt, to: newMsg.deliveredAt },
                        readAt: { from: currentMsg.readAt, to: newMsg.readAt }
                    });
                    return true;
                }
            } else {
                // For received messages, check if readByUser or isRead changed
                const currentReadByUser = Boolean(currentMsg.readByUser);
                const newReadByUser = Boolean(newMsg.readByUser);
                const currentIsRead = Boolean(currentMsg.isRead);
                const newIsRead = Boolean(newMsg.isRead);
                
                if (currentReadByUser !== newReadByUser || currentIsRead !== newIsRead) {
                    console.log('Message status changed (received):', {
                        messageId: newMsg.messageId,
                        readByUser: { from: currentReadByUser, to: newReadByUser },
                        isRead: { from: currentIsRead, to: newIsRead }
                    });
                    return true; // Read status changed
                }
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

    async loadMessages(businessId, markAsRead = false) {
        if (!businessId) return;
        
        // Mark messages as seen immediately when opening the conversation (only on initial load)
        if (markAsRead) {
            this.markMessagesAsRead(businessId);
        }
        
        try {
            // Load messages
            const response = await fetch(`${this.GET_MESSAGES_URL}?businessId=${encodeURIComponent(businessId)}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    if (data.data.messages) {
                        this.messages[businessId] = data.data.messages;
                        this.renderMessages(businessId);
                    }
                } else {
                    this.renderMessages(businessId, []);
                }
            } else {
                this.renderMessages(businessId, []);
            }

            // Check typing status from typing endpoint
            try {
                const typingResponse = await fetch(`${this.SET_TYPING_URL}?businessId=${encodeURIComponent(businessId)}`, {
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
                console.error('Error checking typing status in loadMessages:', typingError);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
            this.renderMessages(businessId, []);
        }
    }

    renderMessages(businessId, messages = null) {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;

        const messageList = messages !== null ? messages : (this.messages[businessId] || []);
        
        if (messageList.length === 0) {
            messagesContainer.innerHTML = `
                <div style="text-align: center; color: #6c757d; padding: 2rem;">
                    <p>Start the conversation!</p>
                </div>
            `;
            return;
        }

        messagesContainer.innerHTML = messageList.map(msg => {
            const isSent = msg.senderType === 'user';
            const messageTime = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            }) : '';
            
            let seenIndicator = '';
            if (isSent) {
                // WhatsApp-style status for sent messages (sent by user)
                // 1 tick: Sent (always shown)
                // 2 gray ticks: Delivered to business
                // 2 blue ticks: Read by business
                if (msg.readByBusiness) {
                    // Read (2 blue ticks)
                    seenIndicator = `
                        <div class="chat-message-seen seen">
                            <i class="fas fa-check-double" style="color: #0084ff;"></i>
                            <span>Seen</span>
                        </div>
                    `;
                } else if (msg.delivered) {
                    // Delivered (2 gray ticks)
                    seenIndicator = `
                        <div class="chat-message-seen">
                            <i class="fas fa-check-double"></i>
                        </div>
                    `;
                } else {
                    // Sent (1 tick)
                    seenIndicator = `
                        <div class="chat-message-seen">
                            <i class="fas fa-check"></i>
                        </div>
                    `;
                }
            } else {
                // For received messages, no status indicator (like WhatsApp)
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

        if (!message || !this.currentBusinessId) {
            return;
        }

        const sendBtn = document.getElementById('chatSendBtn');
        if (sendBtn) {
            sendBtn.disabled = true;
        }

        const requestBody = {
            businessId: this.currentBusinessId,
            message: message
        };
        
        console.log('Regular user sending message:', requestBody);

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
                this.loadBusinesses();
                if (this.currentBusinessId) {
                    setTimeout(() => {
                        this.loadMessages(this.currentBusinessId);
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

    async showBusinessInfoModal() {
        if (!this.currentBusinessId) return;
        
        const business = this.businesses.find(b => b.businessId === this.currentBusinessId);
        if (!business) return;

        const modal = document.getElementById('businessInfoModal');
        if (!modal) return;

        const modalName = document.getElementById('modalBusinessName');
        const modalStatus = document.getElementById('modalBusinessStatus');
        const modalAvatar = document.getElementById('modalBusinessAvatar');

        if (modalName) {
            modalName.textContent = business.businessName || 'Business';
        }

        if (modalStatus) {
            modalStatus.textContent = 'Loading...';
        }

        // Fetch presence for modal
        const presenceData = await this.getBusinessPresence(this.currentBusinessId);
        if (modalStatus && presenceData) {
            const statusText = presenceData.isOnline ? 'Online' : presenceData.lastSeenFormatted || 'Offline';
            modalStatus.textContent = statusText;
            modalStatus.style.color = presenceData.isOnline ? '#10b981' : '#6c757d';
        }

        try {
            const response = await fetch(`${this.GET_BUSINESS_PROFILE_URL}?businessId=${encodeURIComponent(this.currentBusinessId)}`, {
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
                        modalName.textContent = profile.businessName || 'Business';
                    }

                    if (modalAvatar) {
                        if (profile.businessLogoUrl || profile.logo) {
                            modalAvatar.innerHTML = `<img src="${this.escapeHtml(profile.businessLogoUrl || profile.logo)}" alt="${this.escapeHtml(profile.businessName || 'Business')}">`;
                        } else {
                            modalAvatar.innerHTML = '<i class="fas fa-store"></i>';
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching business profile:', error);
        }

        if (modalAvatar && !modalAvatar.querySelector('img')) {
            modalAvatar.innerHTML = '<i class="fas fa-store"></i>';
        }

        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    viewBusinessProfile() {
        if (!this.currentBusinessId) return;
        window.location.href = `business_view_profile.html?businessId=${encodeURIComponent(this.currentBusinessId)}`;
    }

    reportBusiness() {
        if (!this.currentBusinessId) return;
        alert('Report business functionality coming soon');
    }

    blockBusiness() {
        if (!this.currentBusinessId) return;
        alert('Block business functionality coming soon');
    }

    showBusinessList() {
        // Show the business list sidebar on mobile
        const sidebar = document.getElementById('businessListSidebar');
        if (sidebar) {
            sidebar.classList.remove('hidden');
        }

        // Hide active chat and show empty state on mobile
        if (window.innerWidth <= 768) {
            const emptyState = document.getElementById('chatEmptyState');
            const activeChat = document.getElementById('chatActive');
            
            if (activeChat) {
                activeChat.style.display = 'none';
            }
            
            // Remove chat-view-active class from body to show header
            document.body.classList.remove('chat-view-active');
        }

        // Clear current business selection
        this.currentBusinessId = null;
        
        // Stop typing poll
        if (this.typingPollInterval) {
            clearInterval(this.typingPollInterval);
            this.typingPollInterval = null;
        }
    }

    async markMessagesAsRead(businessId = null) {
        const targetBusinessId = businessId || this.currentBusinessId;
        if (!targetBusinessId) return;

        try {
            const response = await fetch(`${this.CHAT_ACTIONS_URL}?businessId=${encodeURIComponent(targetBusinessId)}`, {
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
                this.loadBusinesses();
                
                // Refresh messages to update read status
                if (this.currentBusinessId === targetBusinessId) {
                    this.loadMessages(targetBusinessId);
                }
                
                return data;
            }
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
        return null;
    }

    async deleteConversation(businessId = null) {
        const targetBusinessId = businessId || this.currentBusinessId;
        if (!targetBusinessId) return;

        try {
            const response = await fetch(`${this.CHAT_ACTIONS_URL}?businessId=${encodeURIComponent(targetBusinessId)}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Conversation deleted:', data);

                // Close custom delete modal if open
                const customDeleteModalOverlay = document.getElementById('customDeleteModalOverlay');
                if (customDeleteModalOverlay) {
                    customDeleteModalOverlay.classList.remove('show');
                    setTimeout(() => {
                        customDeleteModalOverlay.style.display = 'none';
                    }, 100);
                }

                // Close options modal if open
                const customModalOverlay = document.getElementById('customModalOverlay');
                if (customModalOverlay) {
                    customModalOverlay.classList.remove('show');
                    setTimeout(() => {
                        customModalOverlay.style.display = 'none';
                    }, 100);
                }

                // Refresh the page
                window.location.reload();
                
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

let regularUserChat;
document.addEventListener('DOMContentLoaded', function() {
    regularUserChat = new RegularUserChat();
    
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

