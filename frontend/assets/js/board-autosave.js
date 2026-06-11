// Auto-save, load, and board state persistence

function getBoardIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

function scheduleAutoSave() {
    clearTimeout(AppState.autoSaveTimeout);
    showAutoSaveStatus('saving');
    saveToLocalBackup();

    AppState.autoSaveTimeout = setTimeout(async () => {
        const result = await saveBoardState();
        if (result.success) {
            showAutoSaveStatus('saved');
            retryCount = 0;
            clearLocalBackup();
        } else if (result.conflict) {
            showAutoSaveStatus('conflict');
        } else {
            showAutoSaveStatus('error');
        }
    }, 1500);
}

function saveToLocalBackup() {
    if (!currentBoardId) return;
    try {
        const state = gatherBoardState();
        localStorage.setItem(`${BACKUP_KEY}-${currentBoardId}`, JSON.stringify({
            state,
            timestamp: Date.now(),
            version: currentBoardVersion
        }));
    } catch (e) {
        console.warn('Failed to save local backup:', e);
    }
}

function clearLocalBackup() {
    if (!currentBoardId) return;
    localStorage.removeItem(`${BACKUP_KEY}-${currentBoardId}`);
}

function getLocalBackup() {
    if (!currentBoardId) return null;
    try {
        const backup = localStorage.getItem(`${BACKUP_KEY}-${currentBoardId}`);
        return backup ? JSON.parse(backup) : null;
    } catch (e) {
        return null;
    }
}

function showAutoSaveStatus(status) {
    const indicator = document.getElementById('autosaveIndicator');
    if (!indicator) return;
    const text = indicator.querySelector('.autosave-text');
    indicator.className = 'autosave-indicator ' + status;

    if (status === 'saving') {
        text.textContent = 'Saving changes...';
    } else if (status === 'saved') {
        text.textContent = `Saved at ${new Date().toLocaleTimeString()}`;
    } else if (status === 'conflict') {
        text.textContent = 'Conflict detected - please refresh';
        indicator.style.background = '#f59e0b';
    } else if (status === 'error') {
        retryCount++;
        if (retryCount <= MAX_RETRIES) {
            const delay = Math.min(5000 * Math.pow(2, retryCount - 1), 30000);
            text.textContent = `Save failed - retrying in ${Math.round(delay / 1000)}s...`;
            if (!AppState.retryTimeout) {
                AppState.retryTimeout = setTimeout(() => {
                    AppState.retryTimeout = null;
                    scheduleAutoSave();
                }, delay);
            }
        } else {
            text.textContent = 'Save failed - changes backed up locally';
        }
    }
}

function gatherBoardState() {
    const gridData = AppState.grid ? AppState.grid.save(true) : [];
    const sectionContent = {};

    document.querySelectorAll('.grid-stack-item').forEach(item => {
        const id = item.getAttribute('gs-id');
        const textarea = item.querySelector('.text-content');
        if (textarea) sectionContent[id] = { text: textarea.value };

        const title = item.querySelector('.section-title');
        if (title) {
            sectionContent[id] = sectionContent[id] || {};
            sectionContent[id].title = title.value;
        }

        const xLabel = item.querySelector('.x-axis-label');
        const yLabel = item.querySelector('.y-axis-label');
        if (xLabel || yLabel) {
            sectionContent[id] = sectionContent[id] || {};
            if (xLabel) sectionContent[id].xLabel = xLabel.value;
            if (yLabel) sectionContent[id].yLabel = yLabel.value;
        }

        const customData = saveSectionData(item);
        if (customData) {
            sectionContent[id] = sectionContent[id] || {};
            sectionContent[id].custom = customData;
        }
    });

    const projectTitle = document.getElementById('projectTitle')?.value || 'Project name';
    updateTeamMembersFromTable();

    return {
        grid: gridData,
        postits: AppState.postits,
        eventLog: AppState.eventLog.slice(0, 100),
        matrixLog: AppState.matrixLog.slice(0, 100),
        lockedSections: Array.from(AppState.lockedSections),
        sectionContent,
        projectTitle,
        teamMembers: AppState.teamMembers,
        userId: AppState.userId,
        version: 2
    };
}

async function saveBoardState() {
    if (!currentBoardId) return { success: false };

    try {
        const state = gatherBoardState();
        const projectTitle = document.getElementById('projectTitle')?.value || 'Project name';

        const response = await apiClient.updateBoard(currentBoardId, {
            title: projectTitle,
            gridData: state,
            expectedVersion: currentBoardVersion
        });

        if (response?.board?.version !== undefined) {
            currentBoardVersion = response.board.version;
        } else if (response?.version !== undefined) {
            currentBoardVersion = response.version;
        }

        return { success: true };
    } catch (e) {
        console.error('Save error:', e);
        if (e.status === 409 || e.message?.includes('modified by another')) {
            return { success: false, conflict: true };
        }
        return { success: false, conflict: false };
    }
}

window.addEventListener('beforeunload', () => {
    if (currentBoardId && AppState.autoSaveTimeout) {
        clearTimeout(AppState.autoSaveTimeout);
        const state = gatherBoardState();
        const projectTitle = document.getElementById('projectTitle')?.value || 'Project name';
        saveToLocalBackup();

        const url = `${apiClient.baseURL}/boards/${currentBoardId}`;
        const token = apiClient.getToken();
        if (token) {
            fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ title: projectTitle, gridData: state, expectedVersion: currentBoardVersion }),
                keepalive: true
            }).catch(err => console.error('Save on close failed:', err));
        }
    }
});

async function loadBoardState() {
    const boardId = getBoardIdFromUrl();
    if (!boardId) {
        if (window.location.search.includes('new=true')) return false;
        alert('No board ID specified');
        window.location.href = 'dashboard.html';
        return false;
    }
    currentBoardId = boardId;

    try {
        const response = await apiClient.getBoard(boardId);
        const board = response.board;
        currentBoardVersion = board.version || 0;

        const currentUser = await apiClient.getCurrentUser();
        const userId = currentUser.user?.id || currentUser.id;

        if (board.userId === userId) {
            currentUserRole = 'admin';
        } else {
            const collaborator = board.collaborators?.find(c => c.userId === userId);
            if (collaborator) {
                currentUserRole = 'member';
            } else {
                alert("You don't have permission to access this board.");
                window.location.href = 'dashboard.html';
                return false;
            }
        }

        applyRoleRestrictions();

        if (board.title) {
            const titleInput = document.getElementById('projectTitle');
            if (titleInput) titleInput.value = board.title;
        }

        const state = board.gridData;
        if (!state || Object.keys(state).length === 0) return false;

        if (state.grid) AppState.grid.load(state.grid || []);
        AppState.postits = state.postits || {};
        AppState.eventLog = state.eventLog || [];
        AppState.matrixLog = state.matrixLog || [];
        AppState.lockedSections = new Set(state.lockedSections || []);
        AppState.teamMembers = state.teamMembers || [];

        if (state.projectTitle) {
            document.getElementById('projectTitle').value = state.projectTitle;
        }

        setTimeout(() => {
            if (state.sectionContent) {
                Object.keys(state.sectionContent).forEach(id => {
                    const item = document.querySelector(`[gs-id="${id}"]`);
                    if (!item || !state.sectionContent[id]) return;

                    const textarea = item.querySelector('.text-content');
                    if (textarea && state.sectionContent[id].text) textarea.value = state.sectionContent[id].text;

                    const title = item.querySelector('.section-title');
                    if (title && state.sectionContent[id].title) title.value = state.sectionContent[id].title;

                    const xLabel = item.querySelector('.x-axis-label');
                    const yLabel = item.querySelector('.y-axis-label');
                    if (xLabel && state.sectionContent[id].xLabel) xLabel.value = state.sectionContent[id].xLabel;
                    if (yLabel && state.sectionContent[id].yLabel) yLabel.value = state.sectionContent[id].yLabel;

                    if (state.sectionContent[id].custom) restoreSectionData(item, state.sectionContent[id].custom);
                });
            }

            if (state.teamMembers && state.teamMembers.length > 0) {
                const tbody = document.querySelector('.team-members-body');
                if (tbody) {
                    tbody.querySelectorAll('.team-member-row').forEach(row => row.remove());
                    const addRow = tbody.querySelector('.add-team-row');
                    state.teamMembers.forEach(member => {
                        const row = document.createElement('tr');
                        row.className = 'team-member-row';
                        row.setAttribute('data-member-id', member.id || 'member_' + Date.now());
                        row.innerHTML = `
                            <td><input type="text" class="team-name" placeholder="Name" value="${member.name || ''}" /></td>
                            <td><input type="email" class="team-email" placeholder="email@example.com" value="${member.email || ''}" /></td>
                            <td><button class="section-btn team-delete-btn"><i class="fas fa-times"></i></button></td>
                        `;
                        tbody.insertBefore(row, addRow);
                    });
                }
            }

            const matrixPostitIds = [];

            Object.values(AppState.postits).forEach(postitData => {
                const section = document.querySelector(`[gs-id="${postitData.section}"]`);
                if (!section) {
                    console.error('Orphaned Post-it (Section missing):', postitData.id, 'Section:', postitData.section);
                    return;
                }

                if (postitData.isWeekPlan && postitData.weekIndex !== undefined) {
                    const weekCol = section.querySelector(`.week-column[data-week-index="${postitData.weekIndex}"]`);
                    const cells = weekCol?.querySelectorAll('.week-cell');
                    const targetCell = cells?.[postitData.trackIndex ?? 0];
                    if (targetCell) { restorePostit(postitData, targetCell); return; }
                }

                if (postitData.isMatrix) {
                    const matrixDropzone = section.querySelector('.matrix-dropzone');
                    if (matrixDropzone) {
                        restorePostit(postitData, matrixDropzone);
                        matrixPostitIds.push(postitData.id);
                        return;
                    }
                }

                const dropzone = section.querySelector('.postit-dropzone');
                if (dropzone) restorePostit(postitData, dropzone);
                else console.warn('Dropzone not found in section:', postitData.section);
            });

            // Reposition all matrix postits after GridStack has fully rendered
            if (matrixPostitIds.length > 0) {
                setTimeout(() => {
                    matrixPostitIds.forEach(id => updatePostitPositionInMatrix(id));
                }, 500);
            }

            AppState.lockedSections.forEach(id => updateSectionLockUI(id, true));
            initializeDropzones();
            attachSectionEventListeners();
            updateAllOwnerDropdowns();
            fixLegacyKPISections();
            syncBoardMembersToTeamSection(board);

            // Apply deferred kanban view for weekplan sections saved in kanban view
            document.querySelectorAll('.section-content[data-pending-kanban]').forEach(content => {
                content.removeAttribute('data-pending-kanban');
                switchToKanban(content);
            });
        }, 300);

        return true;
    } catch (e) {
        console.error('Load error:', e);
        return false;
    }
}

function syncBoardMembersToTeamSection(board) {
    const tbody = document.querySelector('.team-members-body');
    if (!tbody) return;

    tbody.querySelectorAll('.team-member-row').forEach(row => row.remove());
    const addRow = tbody.querySelector('.add-team-row');

    if (board.user) {
        const ownerRow = createTeamMemberRow({
            id: board.userId,
            name: board.user.name || board.user.email?.split('@')[0] || 'Owner',
            email: board.user.email || '',
            isOwner: true
        });
        tbody.insertBefore(ownerRow, addRow);
    }

    if (board.collaborators && board.collaborators.length > 0) {
        board.collaborators.forEach(collab => {
            const memberRow = createTeamMemberRow({
                id: collab.userId,
                name: collab.user?.name || collab.user?.email?.split('@')[0] || 'Member',
                email: collab.user?.email || '',
                isOwner: false
            });
            tbody.insertBefore(memberRow, addRow);
        });
    }

    attachTeamMemberEvents();
}
