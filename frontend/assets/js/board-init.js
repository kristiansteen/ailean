// Section event listeners, display updates, and main initialization

function attachSectionEventListeners() {
    document.querySelectorAll('.delete-section-btn').forEach(btn => {
        btn.onclick = function () {
            const item = this.closest('.grid-stack-item');
            if (item && confirm('Delete this section?')) {
                const id = item.getAttribute('gs-id');
                AppState.grid.removeWidget(item);
                AppState.lockedSections.delete(id);
                logEvent('delete', id, 'section', 'Deleted');
                scheduleAutoSave();
            }
        };
    });

    document.querySelectorAll('.lock-btn').forEach(btn => {
        btn.onclick = function () {
            const item = this.closest('.grid-stack-item');
            if (item) toggleSectionLock(item.getAttribute('gs-id'));
        };
    });

    document.querySelectorAll('.kpi-delete-btn').forEach(btn => {
        btn.onclick = function () { this.closest('.kpi-item')?.remove(); scheduleAutoSave(); };
    });

    document.querySelectorAll('.add-kpi-btn').forEach(btn => {
        btn.onclick = function () {
            const container = this.closest('.grid-stack-item-content').querySelector('.kpi-container');
            const item = document.createElement('div');
            item.className = 'kpi-item';
            item.innerHTML = `
                <div class="kpi-indicator green" data-status="green" onclick="cycleKPIStatus(this)"></div>
                <input type="text" value="New KPI" />
                <button class="section-btn kpi-delete-btn"><i class="fas fa-times"></i></button>
            `;
            container.appendChild(item);
            item.querySelector('.kpi-delete-btn').onclick = function () { item.remove(); scheduleAutoSave(); };
            scheduleAutoSave();
        };
    });

    document.querySelectorAll('.add-row').forEach(row => {
        row.onclick = function () {
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td><input type="text" placeholder="Enter action..." /></td>
                <td><input type="date" /></td>
                <td><select class="action-owner-select"><option value="">-- Select --</option></select></td>
                <td><select><option value="todo">To Do</option><option value="inprogress">In Progress</option><option value="done">Done</option></select></td>
            `;
            this.parentElement.insertBefore(newRow, this);
            updateAllOwnerDropdowns();
            scheduleAutoSave();
        };
    });

    document.querySelectorAll('.add-week-btn').forEach(btn => {
        btn.onclick = function () {
            const section = this.closest('.grid-stack-item-content');
            const weeksContainer = section.querySelector('.weeks-container');
            const numWeeks = weeksContainer.children.length;
            const numTracks = section.querySelectorAll('.track-item').length;
            const newWeek = document.createElement('div');
            newWeek.className = 'week-column';
            newWeek.setAttribute('data-week-index', numWeeks);
            let cells = '';
            for (let i = 0; i < numTracks; i++) cells += '<div class="week-cell postit-dropzone"></div>';
            newWeek.innerHTML = `<div class="week-header">Week ${numWeeks + 1}</div>${cells}`;
            weeksContainer.appendChild(newWeek);
            const dateInput = section.querySelector('.week-start-date');
            if (dateInput) updateWeekNumbers(dateInput);
            initializeDropzones();
            scheduleAutoSave();
        };
    });

    document.querySelectorAll('.add-track-btn').forEach(btn => {
        btn.onclick = function () {
            const section = this.closest('.grid-stack-item-content');
            const trackColumn = section.querySelector('.track-column');
            const weeksContainer = section.querySelector('.weeks-container');
            const trackItem = document.createElement('div');
            trackItem.className = 'track-item';
            trackItem.innerHTML = '<input type="text" value="New Track" />';
            trackColumn.appendChild(trackItem);
            weeksContainer.querySelectorAll('.week-column').forEach(week => {
                const cell = document.createElement('div');
                cell.className = 'week-cell postit-dropzone';
                week.appendChild(cell);
            });
            initializeDropzones();
            scheduleAutoSave();
        };
    });

    document.querySelectorAll('.add-column-btn').forEach(btn => {
        btn.onclick = function () {
            const container = this.closest('.grid-stack-item-content').querySelector('.kanban-container');
            const newColumn = document.createElement('div');
            newColumn.className = 'kanban-column';
            newColumn.innerHTML = `
                <div class="kanban-column-header" style="border-bottom-color: var(--gray-400)">
                    <input type="text" value="New Column" style="background:transparent;border:none;color:white;font-weight:bold;width:100%;text-align:center;" onclick="event.stopPropagation()">
                </div>
                <div class="kanban-dropzone postit-dropzone"></div>
            `;
            container.appendChild(newColumn);
            initializeDropzones();
            scheduleAutoSave();
        };
    });

    document.querySelectorAll('.toggle-view-btn').forEach(btn => {
        btn.onclick = function () {
            const content = this.closest('.grid-stack-item-content')?.querySelector('.section-content');
            if (!content) return;
            if (content.querySelector('.week-planner-wrapper')) {
                switchToKanban(content);
            } else if (content.getAttribute('data-origin') === 'weekplan') {
                switchToWeekplan(content);
            }
        };
    });

    document.querySelectorAll('.section-title, .text-content, .track-item input').forEach(input => {
        input.addEventListener('input', scheduleAutoSave);
    });

    attachTeamTableEvents();
}

function updateDisplays() {
    const eventBody = document.getElementById('eventLogBody');
    if (eventBody) {
        eventBody.innerHTML = AppState.eventLog.slice(0, 100).map(e => `
            <tr>
                <td>${e.timestamp}</td>
                <td><span class="event-type ${e.type}">${e.type}</span></td>
                <td>${e.elementId}</td>
                <td>${e.elementType}</td>
                <td>${e.details}</td>
            </tr>
        `).join('');
    }

    const postitBody = document.getElementById('postitLogBody');
    if (postitBody) {
        postitBody.innerHTML = Object.values(AppState.postits).map(p => {
            const el = document.getElementById(p.id);
            let loc1 = '-', loc2 = '-';
            if (el) {
                const ctx = getColumnContext(el);
                if (ctx.type === 'kanban') { loc1 = ctx.details.column; }
                else if (ctx.type === 'weekplan') { loc1 = ctx.details.week; loc2 = ctx.details.track; }
                else if (ctx.type === 'matrix') { loc1 = ctx.details.quadrant; loc2 = `Score: ${p.xValue * p.yValue}`; }
                else { loc1 = `X:${Math.round(p.x)}`; loc2 = `Y:${Math.round(p.y)}`; }
            } else {
                loc1 = `X:${Math.round(p.x)}`; loc2 = `Y:${Math.round(p.y)}`;
            }
            return `
                <tr>
                    <td><span style="background:${getPostitColor(p.color)};padding:2px 8px;border-radius:4px;">${p.color}</span></td>
                    <td>${p.content || '-'}</td>
                    <td>${p.owner || '-'}</td>
                    <td>${p.status}</td>
                    <td>${loc1}</td>
                    <td>${loc2}</td>
                    <td>${p.id}</td>
                </tr>
            `;
        }).join('');
    }

    const matrixBody = document.getElementById('matrixLogBody');
    if (matrixBody) {
        matrixBody.innerHTML = AppState.matrixLog.slice(0, 100).map(m => `
            <tr>
                <td>${m.timestamp}</td>
                <td>${m.postitId}</td>
                <td>${m.sectionId}</td>
                <td>${m.xLabel}</td>
                <td>${m.xValue}</td>
                <td>${m.yLabel}</td>
                <td>${m.yValue}</td>
                <td><strong>${m.score}</strong></td>
            </tr>
        `).join('');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const overlay = document.getElementById('authLoadingOverlay');
    const pageContent = document.getElementById('pageContent');

    if (!apiClient.isAuthenticated()) {
        window.location.replace('login.html');
        return;
    }

    const user = await apiClient.getCurrentUser().catch(() => null);
    if (!user || (!user.user && !user.id)) {
        apiClient.clearToken();
        window.location.replace('login.html');
        return;
    }

    if (overlay) overlay.classList.add('hidden');
    if (pageContent) pageContent.classList.add('visible');

    AppState.userId = user.user ? user.user.id : user.id;

    initializeGrid();
    initializePostitPalette();

    const urlParams = new URLSearchParams(window.location.search);
    const isNewBoard = urlParams.get('new') === 'true';

    if (isNewBoard) {
        AppState.postits = {};
        AppState.eventLog = [];
        AppState.matrixLog = [];
        AppState.lockedSections = new Set();
        AppState.teamMembers = [];
        window.history.replaceState({}, document.title, window.location.pathname);
        createDefaultBoard();
    } else {
        const loaded = await loadBoardState();
        if (!loaded) createDefaultBoard();
        if (currentUserRole === 'admin') {
            const editBtn = document.getElementById('editLayout');
            if (editBtn) editBtn.style.display = 'flex';
        }
    }

    // Settings burger menu
    const settingsBurger = document.getElementById('settingsBurger');
    const settingsDropdown = document.getElementById('settingsDropdown');
    if (settingsBurger && settingsDropdown) {
        settingsBurger.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsBurger.classList.toggle('active');
            settingsDropdown.classList.toggle('active');
        });
        document.addEventListener('click', (e) => {
            if (settingsBurger.classList.contains('active') && !settingsBurger.contains(e.target) && !settingsDropdown.contains(e.target)) {
                settingsBurger.classList.remove('active');
                settingsDropdown.classList.remove('active');
            }
        });
        settingsDropdown.addEventListener('click', (e) => {
            if (e.target.closest('.menu-item')) {
                settingsBurger.classList.remove('active');
                settingsDropdown.classList.remove('active');
            }
        });
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) logout();
        });
    }

    setTimeout(() => {
        initializeDropzones();
        attachSectionEventListeners();
    }, 600);

    document.getElementById('editLayout').addEventListener('click', toggleEditMode);

    document.getElementById('showBackend').addEventListener('click', () => {
        document.getElementById('backendModal').classList.add('active');
        updateDisplays();
    });
    document.getElementById('closeBackend').addEventListener('click', () => {
        document.getElementById('backendModal').classList.remove('active');
    });

    document.getElementById('addSection').addEventListener('click', () => {
        document.getElementById('addSectionModal').classList.add('active');
    });
    document.getElementById('closeAddSection').addEventListener('click', () => {
        document.getElementById('addSectionModal').classList.remove('active');
    });

    document.getElementById('sectionTypes').addEventListener('click', (e) => {
        const card = e.target.closest('.section-type-card');
        if (card) {
            addSection(card.getAttribute('data-type'));
            document.getElementById('addSectionModal').classList.remove('active');
        }
    });

    const newBoardBtn = document.getElementById('newBoard');
    if (newBoardBtn) {
        newBoardBtn.addEventListener('click', async () => {
            if (confirm('Create a new empty board?')) {
                try {
                    const response = await apiClient.createBoard('New Board', 'Created from board view');
                    const board = response.board || response;
                    if (board && board.id) {
                        window.location.href = `board.html?id=${board.id}`;
                    } else {
                        throw new Error('Invalid server response');
                    }
                } catch (e) {
                    alert(`Failed to create board: ${e.message || 'Unknown error'}`);
                }
            }
        });
    }

    document.getElementById('exportBoard').addEventListener('click', () => {
        const state = gatherBoardState();
        const blob = new Blob([JSON.stringify(state)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'vimpl-board-' + new Date().toISOString().split('T')[0] + '.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    document.getElementById('closePostitForm').addEventListener('click', closePostitForm);

    ['formContent', 'formOwner', 'formStatus', 'formXValue', 'formYValue', 'formMitigation'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                savePostitForm();
                if (id === 'formXValue' || id === 'formYValue') updateScoreDisplay();
            });
            el.addEventListener('change', savePostitForm);
        }
    });

    document.querySelectorAll('.color-opt').forEach(opt => {
        opt.addEventListener('click', () => {
            const color = opt.getAttribute('data-color');
            document.getElementById('formColor').value = color;
            document.querySelectorAll('.color-opt').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            savePostitForm();
        });
    });

    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const tabName = tab.getAttribute('data-tab');
            document.getElementById('eventsTab').style.display = tabName === 'events' ? 'block' : 'none';
            document.getElementById('postitsTab').style.display = tabName === 'postits' ? 'block' : 'none';
            document.getElementById('matrixTab').style.display = tabName === 'matrix' ? 'block' : 'none';
        });
    });

    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    });

    document.addEventListener('click', (e) => {
        const form = document.getElementById('postitForm');
        if (form.style.display !== 'none' && !form.contains(e.target) && !e.target.closest('.postit')) {
            closePostitForm();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            AppState.selectedColor = null;
            document.querySelectorAll('.postit-color').forEach(c => c.classList.remove('selected'));
            document.body.style.cursor = 'default';
            closePostitForm();
        }
    });

    document.getElementById('projectTitle').addEventListener('input', scheduleAutoSave);
});
