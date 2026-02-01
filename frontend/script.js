const API_BASE_URL = 'https://tezario-backend.onrender.com/api'; // Live Render Backend

// Load students and stats on page load
document.addEventListener('DOMContentLoaded', () => {
    // Intro overlay behavior: play, allow skip, hide when ended (instant reveal)
    const introVideo = document.getElementById('introVideo');
    const introOverlay = document.getElementById('introOverlay');
    const heroVideo = document.querySelector('.hero-video');

    // Ensure the background hero is hidden while intro plays
    if (heroVideo) heroVideo.classList.add('hero-hidden');

    // Check if intro has already been seen in this session
    const introSeen = sessionStorage.getItem('introSeen');

    if (introVideo && introOverlay) {
        // Parse event query param up-front
        const params = new URLSearchParams(window.location.search);
        const preEvent = params.get('event');
        const preDomain = params.get('domain');
        const preProblem = params.get('problem');

        // If intro seen, HIDE overlay immediately
        if (introSeen === 'true') {
            introOverlay.style.display = 'none';
            if (heroVideo) heroVideo.classList.remove('hero-hidden');
            document.querySelector('.container').removeAttribute('aria-hidden');

            // If this is the root path and no special params, and we've seen the video,
            // maybe we shouldn't be here? Does user want to go straight to events?
            // The user said: "video plays one time... after video -> events file"
            // If I navigate back to index.html manually, I probably want to see the form.
            // So we stay here.
        } else {
            // Intro NOT seen: Play it
            // Prevent background interactions while intro is visible
            document.querySelector('.container').setAttribute('aria-hidden', 'true');
            // Hide main content (prevent flash) by ensuring overlay is top and opaque
            introOverlay.classList.remove('opacity-0');

            // Play video (catch in case autoplay is blocked)
            introVideo.play().catch(() => { });
        }

        const revealFormAndPrefill = (ev, dom, prob) => {
            // Prefill hidden event field and suggest a team name
            const eventInput = document.getElementById('eventName');
            if (eventInput) eventInput.value = ev || 'Tezario 2026';
            const teamInput = document.getElementById('teamName');
            if (teamInput && !teamInput.value) teamInput.value = (ev || 'Tezario') + ' Team';

            // Add a visible note above the form so user sees the context
            const form = document.getElementById('registrationForm');
            if (form && !document.getElementById('prefillEventNote')) {
                const note = document.createElement('div');
                note.id = 'prefillEventNote';
                note.className = 'card';
                note.style.marginBottom = '12px';
                note.style.fontWeight = '700';
                note.style.color = 'var(--primary)';
                note.textContent = 'Registering for: ' + (ev || 'Tezario 2026');
                form.insertBefore(note, form.firstChild);
            }

            // Handle Domain and Problem Prefill
            if (dom) {
                const domainSelect = document.getElementById('domain');
                if (domainSelect) {
                    domainSelect.value = dom;
                    // Trigger change to populate problems
                    domainSelect.dispatchEvent(new Event('change'));

                    if (prob) {
                        const problemSelect = document.getElementById('problemStatement');
                        if (problemSelect) {
                            // Poll until options are populated (max 2 seconds)
                            let attempts = 0;
                            const checkAndSelect = () => {
                                const options = Array.from(problemSelect.options);
                                // Check if options are populated (more than just the placeholder)
                                if (options.length > 1) {
                                    // Try exact match first
                                    let match = options.find(opt => opt.value === prob);

                                    if (!match) {
                                        // Fuzzy match: Option starts with the problem string (e.g., "01.")
                                        // This handles cases where we pass "01." and the option is "01. Full Text"
                                        match = options.find(opt => opt.value.startsWith(prob));
                                    }

                                    if (match) {
                                        problemSelect.value = match.value;
                                        // Visual feedback
                                        problemSelect.classList.add('highlight-field');
                                        setTimeout(() => problemSelect.classList.remove('highlight-field'), 2000);
                                    }
                                } else if (attempts < 20) {
                                    attempts++;
                                    setTimeout(checkAndSelect, 100);
                                }
                            };
                            checkAndSelect();
                        }
                    }
                }
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

            // Determine destination
            const shouldStay = (preEvent || preDomain) && (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '');

            if (shouldStay) {
                // FADE OUT only if staying
                introOverlay.classList.add('opacity-0');
            } else {
                // If redirecting, keep overlay visible (black) to hide form
                // But we can fade out the video element itself if we want, or just cut to black.
                // The overlay has bg-black, so if we remove video it will be black.
                // Let's ensure it stays opaque.
                introOverlay.classList.remove('opacity-0');
            }

            // Mark as seen
            sessionStorage.setItem('introSeen', 'true');

            // Allow time for transition sequence
            setTimeout(() => {
                // Pause and unload the intro video
                try {
                    introVideo.pause();
                    while (introVideo.firstChild) introVideo.removeChild(introVideo.firstChild);
                    introVideo.removeAttribute('src');
                } catch (e) { }

                // Remove the hero background video entirely so it won't play later
                try {
                    if (heroVideo && heroVideo.parentNode) {
                        try { heroVideo.pause(); } catch (e) { }
                        while (heroVideo.firstChild) heroVideo.removeChild(heroVideo.firstChild);
                        heroVideo.parentNode.removeChild(heroVideo);
                    }
                } catch (e) { }

                // If staying, remove overlay finally
                if (shouldStay) {
                    if (introOverlay.parentNode) introOverlay.parentNode.removeChild(introOverlay);
                    try {
                        const ev = preEvent ? decodeURIComponent(preEvent) : 'Tezario 2026';
                        const dom = preDomain ? decodeURIComponent(preDomain) : null;
                        const prob = preProblem ? decodeURIComponent(preProblem) : null;
                        document.querySelector('.container').removeAttribute('aria-hidden');
                        revealFormAndPrefill(ev, dom, prob);
                    } catch (e) { }
                } else {
                    // REDIRECTING
                    // We kept the overlay opaque (black). 
                    // Now we can just redirect. The page is black.
                    // Optional: Transitions
                    const transition = document.getElementById('pageTransition');
                    if (transition) transition.style.opacity = '1'; // Ensure it's black too just in case

                    window.location.href = 'events.html';
                }
            }, shouldStay ? 1000 : 100); // Shorter wait if redirecting? No, wait for video 'ended' or just short delay.
            // If video ended, we enter here.
            // If staying: wait 1000ms for fade out.
            // If redirecting: we don't need to wait long, just enough to cleanup/switch. 
            // Let's keep 1000ms logic for consistency but maybe faster for redirect?
            // Actually user wants "video finish -> events".
            // So instant redirect after video ends is fine if screen is black.
        };

        introVideo.addEventListener('ended', hideIntro);
        // Skip button and Escape skip disabled per request (no skip option shown)

        // Auto-hide after 4s so the intro plays briefly and then reveals the form or redirects
        window.__introAutoHideTimer = setTimeout(() => {
            if (document.getElementById('introOverlay')) hideIntro();
        }, 4000);

        // If page was opened with ?event=... or ?domain=... skip intro right away and prefill
        if (preEvent || preDomain) {
            try {
                hideIntro();
                // Hide timeline whenever deep-linking to a specific event
                const timelineSection = document.querySelector('.timeline-section');
                if (timelineSection) {
                    timelineSection.style.display = 'none';
                }

                // Hide registered students list when deep-linking
                const studentsSection = document.querySelector('.students-section');
                if (studentsSection) {
                    studentsSection.style.display = 'none';
                }

                // Show Abstract File Upload if event is Hackathon
                if (preEvent === 'Hackathon') {
                    const abstractGroup = document.getElementById('abstractUploadGroup');
                    if (abstractGroup) abstractGroup.style.display = 'block';
                }
            } catch (e) {
                // ignore
            }
        }
    }

    loadStudents();
    loadStats();

    // Auto-refresh stats every 30 seconds
    setInterval(loadStats, 30000);

    // Problem Statements Data
    const problemStatements = {
        'Hardware': [
            "01. Implementation of Smart Agriculture for Efficient Cultivation in Hilly Regions",
            "02. Earthquake stabilised dialysis system for patient safety during seismic events.",
            "03. Real-time based pressure measurement device to optimize orthotic design and patient outcomes.",
            "04. AI and IoT Powered Intelligent System for Real Time Elephant Movement Detection and Prevention of Human-Elephant Conflict (HEC)",
            "05. Design of a Sustainable, Low-Cost Geocell Road System for Landslide-Prone Rural Areas",
            "06. Low-Cost Decentralized Smart Air Purification & Monitoring System",
            "07. Integrated Wearable Device for Real-Time Monitoring of Vital Parameters, Gas Exposure, and Fatigue",
            "08. Cloudburst Early Warning and Alarm System",
            "09. Development of a floating sensor based system for automatic reading and transmission of water levels in the rivers."
        ],
        'Software': [
            "01. Disaster Preparedness and Response Education System for Schools and Colleges",
            "02. Real-Time Public Transport Tracking for Small Cities",
            "03. Digital Platform for Centralized Alumni Data Management and Engagement",
            "04. Gamified Learning Platform for Rural Education",
            "05. Development of a travel related software app that can be installed on mobile phones that could capture trip related information",
            "06. AI-Based Timetable Generation System aligned with NEP 2020 for Multidisciplinary Education Structures",
            "07. AI-based drop-out prediction and counseling system",
            "08. AI-powered monitoring of crop health, soil condition, and pest risks using multispectral/hyperspectral imaging and sensor data.",
            "09. App to book/manage Seminar Halls, Vehicle parking, and Rooms, etc",
            "10. Use of measurements from the mobile phones (low cost preferred) to provide a safe autonomous navigation on the roads",
            "11. AI enabled cyber incident & safety web portal for defence.",
            "12. Portable log analysis tool for isolated network.",
            "13. Automated Vulnerability Assessment and Penetration Testing tool for CCTV cameras & DVRs",
            "14. Development of a mobile application for secure water level data collection from rivers using image processing."
        ]
    };

    // Handle Domain Change
    const domainSelect = document.getElementById('domain');
    const problemSelect = document.getElementById('problemStatement');

    if (domainSelect && problemSelect) {
        domainSelect.addEventListener('change', function () {
            const selectedDomain = this.value;

            // Clear existing options
            problemSelect.innerHTML = '<option value="">Select Problem Statement</option>';

            // FIX: Keep abstract group visible or ensure it is shown
            const abstractGroup = document.getElementById('abstractUploadGroup');
            if (abstractGroup) abstractGroup.style.display = 'block';

            if (selectedDomain && problemStatements[selectedDomain]) {
                // Show grid/block
                const problemGroup = document.getElementById('problemStatementGroup');
                if (problemGroup) problemGroup.style.display = 'block';

                problemSelect.disabled = false;
                problemStatements[selectedDomain].forEach(problem => {
                    const option = document.createElement('option');
                    option.value = problem;
                    option.textContent = problem;
                    problemSelect.appendChild(option);
                });
            } else {
                const problemGroup = document.getElementById('problemStatementGroup');
                if (problemGroup) problemGroup.style.display = 'none';

                problemSelect.disabled = true;
                problemSelect.innerHTML = '<option value="">Select Domain First</option>';
            }
        });

        // Handle Problem Selection for Copy Box
        problemSelect.addEventListener('change', function () {
            const selectedProblem = this.value;
            const fullTextDisplay = document.getElementById('problemStatementFullText');
            const copyBtn = document.getElementById('copyProblemBtn');

            if (fullTextDisplay) {
                if (selectedProblem) {
                    fullTextDisplay.value = selectedProblem;
                    fullTextDisplay.parentElement.style.display = 'block';
                } else {
                    fullTextDisplay.parentElement.style.display = 'none';
                }
            }
        });


    }

    // Handle Team Size Change
    const teamSizeSelect = document.getElementById('teamSize');
    if (teamSizeSelect) {
        // Initial render
        updateTeamSidebar(parseInt(teamSizeSelect.value));

        teamSizeSelect.addEventListener('change', (e) => {
            const size = parseInt(e.target.value);
            updateTeamSidebar(size);

            // Update summary
            const summarySlots = document.getElementById('summarySlots');
            if (summarySlots) summarySlots.textContent = `${size} Total`;

            // Update header count
            const slotsFilled = document.getElementById('slotsFilledCount');
            if (slotsFilled) slotsFilled.textContent = `0/${size}`; // This would ideally track filled inputs
        });
    }

    // Handle Domain Change for Summary
    const domainSelectSummary = document.getElementById('domain');
    if (domainSelectSummary) {
        domainSelectSummary.addEventListener('change', (e) => {
            const summaryTrack = document.getElementById('summaryTrack');
            if (summaryTrack) summaryTrack.textContent = e.target.options[e.target.selectedIndex].text;

            // ... existing domain logic ...
        });
    }

    function updateTeamSidebar(size) {
        const container = document.getElementById('teamMembersContainer');
        if (!container) return;

        container.innerHTML = '';
        const MAX_SLOTS = 4; // Total slots (1 leader + 3 members)

        // Logic: Leader is #1. Members continue from #2.
        // If size is 1, Render "Add Participant #2" button/placeholder?
        // Or just render slots #2, #3, #4 as Locked/Available.

        for (let i = 2; i <= MAX_SLOTS; i++) {
            if (i <= size) {
                // Active Participant Card - User Design
                const memberCard = document.createElement('div');
                // Using full tailwind string as member-card class was removed from CSS
                memberCard.className = 'member-card border-l-2 border-primary/20 bg-white/5 p-4 rounded-r-md mb-4 transition-all hover:border-primary hover:bg-white/10';
                memberCard.innerHTML = `
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-[10px] font-bold text-white uppercase">Participant #${i}</span>
                        <span class="material-symbols-outlined text-primary text-sm cursor-pointer" onclick="this.closest('.member-card').querySelector('.space-y-3').classList.toggle('hidden'); this.textContent = this.textContent === 'expand_less' ? 'expand_more' : 'expand_less'">expand_less</span>
                    </div>
                    <div class="space-y-3">
                        <div>
                            <label class="label-sm">Full Name</label>
                            <input class="form-control !py-1 text-xs" type="text" name="member${i}_name" required placeholder="Member Name">
                        </div>
                        <div>
                            <label class="label-sm">Email</label>
                            <input class="form-control !py-1 text-xs" type="email" name="member${i}_email" required placeholder="member@email.com">
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="label-sm">Roll No</label>
                                <input class="form-control !py-1 text-xs" type="text" name="member${i}_roll" required placeholder="ID-001">
                            </div>
                            <div>
                                <label class="label-sm">Department</label>
                                <input class="form-control !py-1 text-xs" type="text" name="member${i}_dept" required placeholder="CSE">
                            </div>
                        </div>
                    </div>
                `;
                container.appendChild(memberCard);
            } else {
                // Locked / Add Slot
                const lockedCard = document.createElement('div');

                if (i === size + 1) {
                    // "Add Participant" placeholder
                    lockedCard.className = 'border border-dashed border-white/10 rounded-md p-4 group cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2';
                    lockedCard.onclick = () => {
                        // Auto select next size
                        const select = document.getElementById('teamSize');
                        select.value = i;
                        select.dispatchEvent(new Event('change'));
                    };
                    lockedCard.innerHTML = `
                        <span class="material-symbols-outlined text-slate-500 group-hover:text-primary transition-colors">person_add</span>
                        <span class="text-[10px] uppercase font-bold text-slate-500 group-hover:text-primary transition-colors">Add Participant #${i}</span>
                     `;
                } else {
                    // Fully Locked - opacity-40
                    lockedCard.className = 'border border-dashed border-white/10 rounded-md p-4 group cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 opacity-40';
                    lockedCard.innerHTML = `
                        <span class="material-symbols-outlined text-slate-500">lock</span>
                        <span class="text-[10px] uppercase font-bold text-slate-500">Slot #${i} Locked</span>
                    `;
                }
                container.appendChild(lockedCard);
            }
        }
    }
});

// Handle form submission
document.getElementById('registrationForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Registering... <span class="material-symbols-outlined animate-spin">sync</span>';

    const formData = {
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        rollNumber: document.getElementById('rollNumber').value.trim(),
        year: document.querySelector('input[name="year"]:checked')?.value || '',
        department: document.getElementById('department').value,
        accommodation: document.getElementById('accommodation').value,
        teamName: document.getElementById('teamName').value.trim(),
        teamSize: document.getElementById('teamSize').value,
        domain: document.getElementById('domain').value,
        problemStatement: document.getElementById('problemStatement').value,
        event: document.getElementById('eventName').value,
        teamMembers: []
    };

    // Collect additional team members
    const size = parseInt(formData.teamSize);
    if (size > 1) {
        for (let i = 2; i <= size; i++) {
            const nameEl = document.querySelector(`input[name="member${i}_name"]`);
            const emailEl = document.querySelector(`input[name="member${i}_email"]`);
            const rollEl = document.querySelector(`input[name="member${i}_roll"]`);
            const deptEl = document.querySelector(`input[name="member${i}_dept"]`);

            // Safe access
            const name = nameEl ? nameEl.value.trim() : '';
            const email = emailEl ? emailEl.value.trim() : '';
            const rollNumber = rollEl ? rollEl.value.trim() : '';
            const department = deptEl ? deptEl.value.trim() : '';
            // Phone is removed from UI, verify if backend needs it. Sending empty string.
            const phone = '';

            formData.teamMembers.push({
                memberId: i,
                name,
                email,
                phone,
                rollNumber,
                department
            });
        }
    }

    // Handle File Upload
    const fileInput = document.getElementById('abstractFile');
    if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];

        // Size validation (10MB)
        if (file.size > 10 * 1024 * 1024) {
            showModal('⚠️ File size exceeds 10MB limit.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            return;
        }

        try {
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });

            formData.abstractFile = {
                name: file.name,
                type: file.type,
                data: base64
            };
        } catch (err) {
            console.error('File read error:', err);
            showModal('⚠️ Error reading file. Please try again.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            return;
        }
    }

    // Handle Registration File Upload



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
        submitBtn.innerHTML = originalText;
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
                    <span class="info-value" style="color: var(--secondary); fontWeight: 700;">${escapeHtml(student.event || 'General')}</span>
                </div>
                ${student.teamName ? `
                <div class="info-item">
                    <span class="info-label">👥 Team:</span>
                    <span class="info-value">
                        ${escapeHtml(student.teamName)} 
                        ${student.teamSize > 1 ? `<span class="badge badge-year" style="margin-left:5px">${student.teamSize} Members</span>` : ''}
                    </span>
                </div>
                ` : ''}
                ${student.domain ? `
                <div class="info-item">
                    <span class="info-label">🔧 Domain:</span>
                    <span class="info-value">${escapeHtml(student.domain)}</span>
                </div>
                <div class="info-item" style="grid-column: span 2;">
                    <span class="info-label">🎯 Problem:</span>
                    <span class="info-value" style="font-size: 0.9em;">${escapeHtml(student.problemStatement)}</span>
                </div>
                ` : ''
        }
<div class="info-item">
    <span class="info-label">🕒 Registered:</span>
    <span class="info-value">${formatDate(student.registeredAt)}</span>
</div>
            </div >
        </div >
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
        const response = await fetch(`${API_BASE_URL} /students/${id} `, {
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
 
 / /   C o u n t d o w n   T i m e r   L o g i c  
 f u n c t i o n   s t a r t C o u n t d o w n ( )   {  
         c o n s t   t i m e r E l e m e n t   =   d o c u m e n t . g e t E l e m e n t B y I d ( ' c o u n t d o w n T i m e r ' ) ;  
         i f   ( ! t i m e r E l e m e n t )   r e t u r n ;  
  
         / /   S e t   t h e   d a t e   w e ' r e   c o u n t i n g   d o w n   t o  
         c o n s t   c o u n t D o w n D a t e   =   n e w   D a t e ( " F e b   6 ,   2 0 2 6   0 0 : 0 0 : 0 0 " ) . g e t T i m e ( ) ;  
  
         / /   U p d a t e   t h e   c o u n t   d o w n   e v e r y   1   s e c o n d  
         c o n s t   x   =   s e t I n t e r v a l ( f u n c t i o n   ( )   {  
  
                 / /   G e t   t o d a y ' s   d a t e   a n d   t i m e  
                 c o n s t   n o w   =   n e w   D a t e ( ) . g e t T i m e ( ) ;  
  
                 / /   F i n d   t h e   d i s t a n c e   b e t w e e n   n o w   a n d   t h e   c o u n t   d o w n   d a t e  
                 c o n s t   d i s t a n c e   =   c o u n t D o w n D a t e   -   n o w ;  
  
                 / /   T i m e   c a l c u l a t i o n s   f o r   d a y s ,   h o u r s ,   m i n u t e s   a n d   s e c o n d s  
                 c o n s t   d a y s   =   M a t h . f l o o r ( d i s t a n c e   /   ( 1 0 0 0   *   6 0   *   6 0   *   2 4 ) ) ;  
                 c o n s t   h o u r s   =   M a t h . f l o o r ( ( d i s t a n c e   %   ( 1 0 0 0   *   6 0   *   6 0   *   2 4 ) )   /   ( 1 0 0 0   *   6 0   *   6 0 ) ) ;  
                 c o n s t   m i n u t e s   =   M a t h . f l o o r ( ( d i s t a n c e   %   ( 1 0 0 0   *   6 0   *   6 0 ) )   /   ( 1 0 0 0   *   6 0 ) ) ;  
  
                 / /   D i s p l a y   t h e   r e s u l t  
                 t i m e r E l e m e n t . i n n e r H T M L   =   ` $ { d a y s } D   $ { h o u r s } H ` ;  
  
                 / /   I f   t h e   c o u n t   d o w n   i s   f i n i s h e d ,   w r i t e   s o m e   t e x t  
                 i f   ( d i s t a n c e   <   0 )   {  
                         c l e a r I n t e r v a l ( x ) ;  
                         t i m e r E l e m e n t . i n n e r H T M L   =   " E X P I R E D " ;  
                 }  
         } ,   1 0 0 0 ) ;  
 }  
  
 / /   S t a r t   t h e   t i m e r   w h e n   D O M   i s   l o a d e d  
 d o c u m e n t . a d d E v e n t L i s t e n e r ( ' D O M C o n t e n t L o a d e d ' ,   s t a r t C o u n t d o w n ) ;  
 