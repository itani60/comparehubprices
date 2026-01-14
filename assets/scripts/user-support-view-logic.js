/* User Support View Logic */
const API_URL = 'https://hub.comparehubprices.co.za/admin/support-management';

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const ticketId = params.get('id') || 'TK-9007'; // Fallback for testing/design default if no ID

    // Auth Check
    // Auth: Cookies handled automatically
    // const token = localStorage.getItem...

    // Load Details
    await loadTicketDetails(ticketId, token);

    // Setup Reply
    const sendBtn = document.getElementById('send-reply-btn');
    if (sendBtn) {
        sendBtn.addEventListener('click', () => sendReply(ticketId, token));
    }
});

async function loadTicketDetails(id, token) {
    // If testing without token, this might fail unless backed allows public read (unlikely).
    // Cookie Auth

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: 'getTicketDetails', ticketId: id })
        });

        const ticket = await response.json();

        if (response.ok && ticket.TicketID) {
            // Update Header
            setText('ticket-subject', ticket.Subject);
            setText('ticket-ref', '#' + ticket.TicketID);
            setText('ticket-category-badge', ticket.Category);
            setText('ticket-status-badge', ticket.Status);

            // Render Messages
            const messages = ticket.History || [];
            // We need to know who 'me' is to align messages? 
            // Simplified: If Author == 'Customer' -> Me. Else -> Support.
            renderMessages(messages);
        } else {
            const container = document.getElementById('messages-list');
            if (container) container.innerHTML = '<div class="p-3 text-center text-danger">Ticket not found or access denied.</div>';
        }
    } catch (e) {
        console.error(e);
    }
}

function renderMessages(history) {
    const container = document.getElementById('messages-list');
    if (!container) return;
    container.innerHTML = '';

    history.forEach(item => {
        if (item.Type === 'System') return; // Skip system messages for now

        const isMe = item.Author === 'Customer';

        const msgDiv = document.createElement('div');
        msgDiv.className = 'd1-message';

        const avatar = isMe ? 'ME' : '<i class="fas fa-headset"></i>';
        const avatarClass = isMe ? 'd1-avatar' : 'd1-avatar bg-primary text-white';
        const nameText = isMe ? 'Me' : 'Support Team';
        const metaText = isMe ? 'Customer' : 'Admin';

        if (!isMe) {
            msgDiv.style.borderLeft = '4px solid var(--primary)';
        }

        msgDiv.innerHTML = `
            <div class="d-flex gap-3">
                <div class="${avatarClass}">${avatar}</div>
                <div>
                    <div class="d-flex align-items-center gap-2 mb-2">
                        <span class="fw-bold ${!isMe ? 'text-primary' : ''}">${nameText}</span>
                        <span class="d1-meta">${metaText} • ${new Date(item.Timestamp).toLocaleString()}</span>
                    </div>
                    <p class="mb-0 text-dark">${item.Message}</p>
                </div>
            </div>
        `;
        container.appendChild(msgDiv);
    });
}

async function sendReply(id, token) {
    const input = document.getElementById('reply-input');
    const msg = input.value.trim();
    if (!msg) return;

    const btn = document.getElementById('send-reply-btn');
    btn.disabled = true;
    btn.innerText = 'Sending...';

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'addReply',
                ticketId: id,
                message: msg,
                author: 'Customer'
            })
        });

        const res = await response.json();
        if (response.ok && res.success) {
            input.value = '';
            // Reload details to show new message
            // Wait briefly for eventual consistency if needed, but usually immediate
            setTimeout(() => loadTicketDetails(id, token), 500);
        } else {
            alert('Failed to send reply: ' + (res.error || 'Unknown error'));
        }
    } catch (e) {
        console.error(e);
        alert('Error sending reply.');
    } finally {
        btn.disabled = false;
        btn.innerText = 'Send Reply';
    }
}

function setText(id, txt) {
    const el = document.getElementById(id);
    if (el) el.innerText = txt;
}
