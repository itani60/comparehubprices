/* User Support Logic */
const API_URL = 'https://hub.comparehubprices.co.za/chat-hub/support';

document.addEventListener('DOMContentLoaded', () => {

    updateAuthDisplay();

    /* --- Filter Dropdown Logic --- */
    document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
        const trigger = dropdown.querySelector('.dropdown-trigger');

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.custom-dropdown').forEach(d => {
                if (d !== dropdown) d.classList.remove('active');
            });
            dropdown.classList.toggle('active');
        });
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-dropdown').forEach(d => d.classList.remove('active'));
    });

    /* --- Ticket Submission --- */
    const submitBtn = document.getElementById('submit-ticket-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const subject = document.getElementById('ticket-subject').value;
            const description = document.getElementById('ticket-description').value;
            const categoryObj = document.getElementById('ticket-category');
            const priorityObj = document.getElementById('ticket-priority');

            const category = categoryObj ? categoryObj.options[categoryObj.selectedIndex].text : 'General';
            const priority = priorityObj ? priorityObj.options[priorityObj.selectedIndex].text.split(' ')[0] : 'Medium';

            if (!subject || !description) {
                alert('Please fill in all required fields.');
                return;
            }

            // Auth: Rely on HttpOnly Cookies

            submitBtn.disabled = true;
            submitBtn.innerText = 'Submitting...';

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    credentials: 'include', // Use Cookies
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'createTicket',
                        subject: subject,
                        initialMessage: description,
                        category: category,
                        priority: priority
                    })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    alert('Ticket Submitted Successfully! Reference: ' + result.ticketId);

                    // Close Modal
                    const modalEl = document.getElementById('newTicketModal');
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    modal.hide();

                    // Optionally refresh the list
                } else {
                    alert('Error: ' + (result.error || 'Failed to submit ticket'));
                }
            } catch (err) {
                console.error(err);
                alert('An error occurred. Please try again.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = 'Submit Ticket';
            }
        });
    }

    // Expose selectFilter to window for onclick handlers
    window.selectFilter = function (type, value) {
        const dropdown = document.querySelector(`#${type}Dropdown`);
        if (dropdown) {
            dropdown.querySelector('.selected-text').textContent = value;
            dropdown.classList.add('active');
            setTimeout(() => dropdown.classList.remove('active'), 150);
        }
    };

    // Initial Fetch
    fetchUserTickets();
});

async function fetchUserTickets() {
    // Session is managed via HttpOnly cookies (regular_sessionid), so no localStorage token needed.
    // However, we rely on the auth display logic to determine if we should fetch (i.e. if user logged in).
    // Ideally, we just try to fetch. If 401, we handle it.

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            // critical for sending HttpOnly cookies
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: 'getUserTickets' })
        });

        if (response.status === 401 || response.status === 403) {
            // Not logged in or session expired
            return;
        }

        const result = await response.json();
        if (result.tickets) {
            renderUserTickets(result.tickets);
        }
    } catch (e) {
        console.log('Error fetching user tickets:', e);
    }
}

function renderUserTickets(tickets) {
    const tbody = document.getElementById('user-tickets-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    tickets.forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="ps-4">
                <div class="fw-bold text-dark">${t.Subject}</div>
                <div class="small text-secondary text-truncate" style="max-width: 300px;">${t.Category}</div>
            </td>
            <td class="text-secondary fw-semibold">#${t.TicketID}</td>
            <td><span class="badge bg-secondary bg-opacity-10 text-dark border">${t.Category}</span></td>
            <td class="text-secondary small">${new Date(t.Timestamp).toLocaleDateString()}</td>
            <td><span class="ticket-status status-${t.Status.toLowerCase()}">${t.Status}</span></td>
            <td class="pe-4 text-end">
                <a href="user-support-view.html?id=${t.TicketID}" class="btn btn-sm btn-light border">View</a>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function updateAuthDisplay() {
    const container = document.getElementById('user-auth-display');
    if (!container) return;

    // Helper to wait for services to be available
    const waitForServices = async () => {
        let retries = 0;
        while ((!window.awsAuthService && !window.businessAWSAuthService) && retries < 20) {
            await new Promise(r => setTimeout(r, 100));
            retries++;
        }
    };

    await waitForServices();

    let profile = null;
    let isBusiness = false;

    // 1. Try Regular User via AWSAuthService (Cookie-based)
    if (window.awsAuthService) {
        try {
            const info = await window.awsAuthService.getUserInfo();
            if (info && info.success && info.user) {
                profile = info.user;
                isBusiness = false;
            }
        } catch (err) {
            // Not a regular user or error
        }
    }

    // 2. Try Business User if no regular user found
    if (!profile && window.businessAWSAuthService) {
        try {
            const info = await window.businessAWSAuthService.getUserInfo();
            if (info && info.success && info.user) {
                profile = info.user;
                isBusiness = true;
            }
        } catch (err) {
            // Not a business user
        }
    }

    if (profile) {
        const initials = getInitials(profile);
        const givenName = (profile.givenName || profile.given_name) || '';
        const displayName = (givenName || profile.email?.split('@')[0] || 'User').replace(/['"]+/g, '');
        const role = isBusiness ? 'Business Account' : 'User';

        container.innerHTML = `
            <div class="d-flex align-items-center gap-2 dropstart">
                <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold shadow-sm dropdown-toggle" 
                     style="width: 40px; height: 40px; font-size: 1rem; border: 2px solid white; cursor: pointer;" 
                     id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false" title="${displayName}">
                    ${initials}
                </div>
                <ul class="dropdown-menu shadow border-0" aria-labelledby="userDropdown">
                    <li class="px-3 py-2 border-bottom">
                        <div class="fw-bold text-dark">${displayName}</div>
                        <div class="small text-muted">${profile.email}</div>
                        <div class="small text-primary">${role}</div>
                    </li>
                    <li><a class="dropdown-item py-2" href="${isBusiness ? 'Business_account_manager.html' : 'my_account.html'}"><i class="fas fa-user-circle me-2"></i>My Account</a></li>
                    <li><a class="dropdown-item py-2" href="#" onclick="handleLogout()"><i class="fas fa-sign-out-alt me-2 text-danger"></i>Sign Out</a></li>
                </ul>
            </div>
        `;
    } else {
        container.innerHTML = `<a href="login.html" class="btn btn-outline-primary rounded-pill px-4">Login</a>`;
    }
}

function getInitials(profile) {
    try {
        const given = (profile && (profile.givenName || profile.given_name)) || '';
        const family = (profile && (profile.familyName || profile.family_name)) || '';
        const email = (profile && profile.email) || '';

        let initials = '';
        if (given || family) {
            initials = (given.charAt(0) + (family.charAt(0) || '')).toUpperCase();
        } else if (email) {
            const namePart = email.split('@')[0] || '';
            const parts = namePart.split(/[._-]+/).filter(Boolean);
            if (parts.length >= 2) {
                initials = (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
            } else {
                initials = (namePart.slice(0, 2)).toUpperCase();
            }
        }
        return initials || 'U';
    } catch { return 'U'; }
}

async function handleLogout() {
    if (window.awsAuthService) await window.awsAuthService.logout();
    if (window.businessAWSAuthService) await window.businessAWSAuthService.logout();
    window.location.reload();
}
