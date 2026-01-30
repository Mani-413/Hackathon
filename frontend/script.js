const API_BASE_URL = 'http://localhost:3000/api';

// Load students and stats on page load
document.addEventListener('DOMContentLoaded', () => {
    // Intro overlay behavior: play, allow skip, hide when ended (instant reveal)
    const introVideo = document.getElementById('introVideo');
    const introOverlay = document.getElementById('introOverlay');
    const heroVideo = document.querySelector('.hero-video');

    // Ensure the background hero is hidden while intro plays
    if (heroVideo) heroVideo.classList.add('hero-hidden');

    if (introVideo && introOverlay) {
        // Parse event query param up-front
        const params = new URLSearchParams(window.location.search);
        const preEvent = params.get('event');

        // Prevent background interactions while intro is visible
        document.querySelector('.container').setAttribute('aria-hidden', 'true');

        // Play video and detect if autoplay fails
        let __introPlayFailed = false;
        introVideo.play().catch(() => { __introPlayFailed = true; });

        const revealFormAndPrefill = (ev) => {
            // Prefill hidden event field and suggest a team name
            const eventInput = document.getElementById('eventName');
            if (eventInput) eventInput.value = ev;
            const teamInput = document.getElementById('teamName');
            if (teamInput && !teamInput.value) teamInput.value = ev + ' Team';

            // Add a visible note above the form so user sees the context
            const form = document.getElementById('registrationForm');
            if (form && !document.getElementById('prefillEventNote')) {
                const note = document.createElement('div');
                note.id = 'prefillEventNote';
                note.className = 'card';
                note.style.marginBottom = '12px';
                note.style.fontWeight = '700';
                note.style.color = 'var(--primary)';
                note.textContent = 'Registering for: ' + ev;
                form.insertBefore(note, form.firstChild);
            }

            // Focus first input
            const formEl = document.getElementById('registrationForm');
            if (formEl) {
                formEl.scrollIntoView({ behavior: 'auto' });
                const firstInput = formEl.querySelector('input, select, textarea, button');
                if (firstInput) firstInput.focus();
            }
        };

        const hideIntro = () => {
            if (!introOverlay) return;
            if (window.__introAutoHideTimer) { clearTimeout(window.__introAutoHideTimer); window.__introAutoHideTimer = null; }

            // Pause and unload the intro video to stop network/activity
            try {
                introVideo.pause();
                // Remove sources and clear src to stop downloading
                while (introVideo.firstChild) introVideo.removeChild(introVideo.firstChild);
                introVideo.removeAttribute('src');
            } catch (e) {
                // Ignore errors when cleaning up
            }

            // Remove the hero background video entirely so it won't play later
            try {
                if (heroVideo && heroVideo.parentNode) {
                    try { heroVideo.pause(); } catch (e) { }
                    // Remove any child sources
                    while (heroVideo.firstChild) heroVideo.removeChild(heroVideo.firstChild);
                    heroVideo.parentNode.removeChild(heroVideo);
                }
            } catch (e) {
                // ignore
            }

            // Immediately remove the overlay and reveal the page
            introOverlay.setAttribute('aria-hidden', 'true');
            document.querySelector('.container').removeAttribute('aria-hidden');
            if (introOverlay && introOverlay.parentNode) introOverlay.parentNode.removeChild(introOverlay);

            // If an event param was provided on this page, prefill and show the form — otherwise redirect to Events
            if (preEvent && (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '')) {
                try {
                    const ev = decodeURIComponent(preEvent);
                    revealFormAndPrefill(ev);
                } catch (e) {
                    // ignore
                }
            } else {
                window.location.href = 'events.html';
            }
        };

        // introVideo.addEventListener('ended', hideIntro); // Disabled to ensure it plays for 4 seconds
        // Skip button and Escape skip disabled per request (no skip option shown)

        // Auto-hide after 4s so the intro plays briefly and then reveals the form or redirects
        window.__introAutoHideTimer = setTimeout(() => {
            if (document.getElementById('introOverlay')) hideIntro();
        }, 4000);

        // If page was opened with ?event=..., decide whether to skip intro or play it
        const playIntroParam = params.get('playIntro');
        const playIntroFlag = playIntroParam && (playIntroParam === '1' || playIntroParam.toLowerCase() === 'true');

        if (preEvent && !playIntroFlag) {
            // Skip intro immediately and show prefilled registration form
            try {
                hideIntro();
            } catch (e) {
                // ignore
            }
        } else if (preEvent && playIntroFlag) {
            // Play the intro; when it ends / auto-hides, hideIntro() will prefill and reveal the form
            // If autoplay fails, ensure we still reveal the form after a short delay
            setTimeout(() => {
                if (typeof __introPlayFailed !== 'undefined' && __introPlayFailed && document.getElementById('introOverlay')) {
                    hideIntro();
                }
            }, 1200);
        }
    }

    loadStudents();
    loadStats();

    // Auto-refresh stats every 30 seconds
    setInterval(loadStats, 30000);
});

// Handle form submission
document.getElementById('registrationForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.querySelector('.btn-primary');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Registering...';

    const formData = {
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        rollNumber: document.getElementById('rollNumber').value.trim(),
        year: document.getElementById('year').value,
        department: document.getElementById('department').value,
        teamName: document.getElementById('teamName').value.trim(),
        event: document.getElementById('eventName').value || 'General'
    };

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            showModal('🎉 Registration successful! Welcome to the hackathon.', 'success');
            document.getElementById('registrationForm').reset();
            loadStudents();
            loadStats();
        } else {
            showModal(data.error || 'Registration failed. Please try again.', 'error');
        }
    } catch (error) {
        showModal('⚠️ Network error. Please make sure the backend server is running.', 'error');
        console.error('Error:', error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

// Load all students
async function loadStudents() {
    try {
        const response = await fetch(`${API_BASE_URL}/students`);
        const data = await response.json();

        if (data.success) {
            displayStudents(data.data);
        } else {
            document.getElementById('studentsList').innerHTML =
                '<div class="empty">❌ Failed to load students.</div>';
        }
    } catch (error) {
        document.getElementById('studentsList').innerHTML =
            '<div class="empty">⚠️ Error connecting to server. Please make sure the backend is running.</div>';
        console.error('Error:', error);
    }
}

// Display students in the list
function displayStudents(students) {
    const studentsList = document.getElementById('studentsList');

    if (students.length === 0) {
        studentsList.innerHTML = '<div class="empty">👋 No students registered yet. Be the first to register!</div>';
        return;
    }

    studentsList.innerHTML = students.map(student => `
        <div class="student-card" data-name="${student.name.toLowerCase()}" 
             data-email="${student.email.toLowerCase()}" 
             data-department="${student.department.toLowerCase()}">
            <div class="student-header">
                <div>
                    <div class="student-name">${escapeHtml(student.name)}</div>
                    <div style="font-size: 0.9rem; color: var(--text-light); margin-top: 5px;">
                        ${escapeHtml(student.email)}
                    </div>
                </div>
                <button class="btn btn-danger" onclick="deleteStudent('${student.id}')" title="Delete this registration">Delete</button>
            </div>
            <div class="student-info">
                <div class="info-item">
                    <span class="info-label">📞 Phone:</span>
                    <span class="info-value">${escapeHtml(student.phone)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">🎓 Roll No:</span>
                    <span class="info-value">${escapeHtml(student.rollNumber)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">📚 Department:</span>
                    <span class="badge badge-department">${escapeHtml(student.department)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">📅 Year:</span>
                    <span class="badge badge-year">${escapeHtml(student.year)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">✨ Event:</span>
                    <span class="info-value" style="color: var(--secondary); font-weight: 700;">${escapeHtml(student.event || 'General')}</span>
                </div>
                ${student.teamName ? `
                <div class="info-item">
                    <span class="info-label">👥 Team:</span>
                    <span class="info-value">${escapeHtml(student.teamName)}</span>
                </div>
                ` : ''}
                <div class="info-item">
                    <span class="info-label">🕒 Registered:</span>
                    <span class="info-value">${formatDate(student.registeredAt)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Filter students based on search input
function filterStudents() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const studentCards = document.querySelectorAll('.student-card');
    let visibleCount = 0;

    studentCards.forEach(card => {
        const name = card.getAttribute('data-name');
        const email = card.getAttribute('data-email');
        const department = card.getAttribute('data-department');

        if (name.includes(searchTerm) || email.includes(searchTerm) || department.includes(searchTerm)) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    // Show message if no results
    if (visibleCount === 0 && searchTerm.length > 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'empty';
        emptyMsg.textContent = '🔍 No students match your search.';
        const studentsList = document.getElementById('studentsList');
        if (!studentsList.querySelector('.search-empty')) {
            emptyMsg.classList.add('search-empty');
            studentsList.appendChild(emptyMsg);
        }
    } else {
        const emptyMsg = document.querySelector('.search-empty');
        if (emptyMsg) emptyMsg.remove();
    }
}

// Delete a student
async function deleteStudent(id) {
    if (!confirm('Are you sure you want to delete this registration?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/students/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showModal('✓ Student registration deleted successfully.', 'success');
            loadStudents();
            loadStats();
        } else {
            showModal(data.error || 'Failed to delete registration.', 'error');
        }
    } catch (error) {
        showModal('❌ Error deleting registration.', 'error');
        console.error('Error:', error);
    }
}

// Load statistics
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/stats`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            const totalEl = document.getElementById('totalRegistrations');
            const deptEl = document.getElementById('departmentCount');
            const deptCount = Object.keys(data.data.byDepartment).length;

            // Animate number changes
            animateNumber(totalEl, parseInt(totalEl.textContent), data.data.total);
            animateNumber(deptEl, parseInt(deptEl.textContent), deptCount || 0);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        // Set default values if stats fail to load
        document.getElementById('totalRegistrations').textContent = '0';
        document.getElementById('departmentCount').textContent = '0';
    }
}

// Animate number counter
function animateNumber(element, startNum, endNum) {
    if (startNum === endNum) return;

    const duration = 500; // 500ms animation
    const steps = 30;
    const increment = (endNum - startNum) / steps;
    let current = startNum;

    const interval = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= endNum) || (increment < 0 && current <= endNum)) {
            current = endNum;
            clearInterval(interval);
        }
        element.textContent = Math.round(current);
    }, duration / steps);
}

// Show modal message
function showModal(message, type = 'success') {
    const modal = document.getElementById('modal');
    const modalMessage = document.getElementById('modalMessage');

    modalMessage.innerHTML = `<div class="message-${type}">${escapeHtml(message)}</div>`;
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');

    // Auto close after 4 seconds
    const timeoutId = setTimeout(() => {
        closeModal();
    }, 4000);

    // Allow manual close to clear timeout
    modal.dataset.timeoutId = timeoutId;
}

// Close modal
function closeModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');

    // Clear any pending timeout
    if (modal.dataset.timeoutId) {
        clearTimeout(parseInt(modal.dataset.timeoutId));
    }
}

// Close modal when clicking outside
window.onclick = function (event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        closeModal();
    }
}

// Escape key to close modal
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        closeModal();
    }
});

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Format date with timezone
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}
