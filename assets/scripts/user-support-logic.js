/* User Support Logic */
const API_URL = 'https://hub.comparehubprices.co.za/admin/support-management';

document.addEventListener('DOMContentLoaded', () => {

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

            // Auth Token
            const token = localStorage.getItem('user_session_token') || localStorage.getItem('business_session_token');
            if (!token) {
                alert('You must be logged in to submit a ticket.');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerText = 'Submitting...';

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
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
    const token = localStorage.getItem('user_session_token') || localStorage.getItem('business_session_token');
    if (!token) return;

    try {
        // NOTE: action 'getUserTickets' requires backend implementation update
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: 'getUserTickets' })
        });

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
