class RegularUserChat {
    constructor() {
        this.currentBusinessId = null;
        this.businesses = [];
        this.pendingBusinessId = null;
        this.API_BASE_URL = 'https://hub.comparehubprices.co.za';
        this.SEND_MESSAGE_URL = `${this.API_BASE_URL}/chat-hub/chat/send`;
        this.GET_CONVERSATIONS_URL = `${this.API_BASE_URL}/chat-hub/chat/conversations`;
        this.GET_BUSINESS_PROFILE_URL = `${this.API_BASE_URL}/chat-hub/chat/business-profile`;
        this.GET_MESSAGES_URL = `${this.API_BASE_URL}/chat-hub/chat/messages`;
        this.messages = {};
        this.init();
    }

    init() {
        const urlParams = new URLSearchParams(window.location.search);
        this.pendingBusinessId = urlParams.get('businessId');
        this.attachEventListeners();
        this.loadBusinesses();
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
                }
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
                        lastMessage: biz.lastMessage || '',
                        lastMessageTime: biz.lastMessageTime || new Date().toISOString(),
                        unreadCount: biz.unreadCount || 0
                    }));
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
                    <i class="fas fa-store" style="font-size: 3rem; color: #dee2e6; margin-bottom: 1rem;"></i>
                    <p>No businesses available</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.businesses.map(business => {
            const lastMessage = business.lastMessage || '';
            const unreadCount = business.unreadCount || 0;
            const lastMessageTime = business.lastMessageTime ? this.formatTime(business.lastMessageTime) : '';

            return `
                <div class="business-item" data-business-id="${business.businessId}" onclick="regularUserChat.selectBusiness('${business.businessId}')">
                    <div class="business-item-avatar">
                        <i class="fas fa-store"></i>
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
            document.getElementById('chatBusinessStatus').textContent = 'Online';

            if (window.innerWidth <= 768) {
                const sidebar = document.getElementById('businessListSidebar');
                if (sidebar) {
                    sidebar.classList.add('hidden');
                }
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
            
            this.loadMessages(businessId);
            
            const messageInput = document.getElementById('chatMessageInput');
            if (messageInput) {
                setTimeout(() => {
                    messageInput.focus();
                }, 100);
            }
        }
    }

    async loadMessages(businessId) {
        if (!businessId) return;
        
        try {
            const response = await fetch(`${this.GET_MESSAGES_URL}?businessId=${encodeURIComponent(businessId)}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data && data.data.messages) {
                    this.messages[businessId] = data.data.messages;
                    this.renderMessages(businessId);
                } else {
                    this.renderMessages(businessId, []);
                }
            } else {
                this.renderMessages(businessId, []);
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
            
            return `
                <div class="message ${isSent ? 'message-sent' : 'message-received'}">
                    <div class="message-content">
                        <p>${this.escapeHtml(msg.content || '')}</p>
                        <span class="message-time">${messageTime}</span>
                    </div>
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

