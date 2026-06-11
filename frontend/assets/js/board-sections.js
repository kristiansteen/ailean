// Section templates, creation, and persistence

function createSectionHeader(title, showLock = true, extraButtons = '') {
    return `
        <div class="section-header">
            <input type="text" class="section-title" value="${title}" />
            <div class="section-controls">
                ${extraButtons}
                ${showLock ? '<button class="section-btn lock-btn" title="Lock Section"><i class="fas fa-unlock"></i></button>' : ''}
                <button class="section-btn delete-section-btn" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `;
}

function createTextSection(title = 'New Section') {
    return `
        ${createSectionHeader(title)}
        <div class="section-content postit-dropzone">
            <textarea class="text-content" placeholder="Enter text here..."></textarea>
        </div>
    `;
}

function createTeamSection(title = 'Team') {
    return `
        ${createSectionHeader(title)}
        <div class="section-content">
            <table class="team-table">
                <thead><tr><th>Name</th><th>Email</th><th></th></tr></thead>
                <tbody class="team-members-body">
                    <tr class="team-member-row" data-member-id="member_1">
                        <td><input type="text" class="team-name" placeholder="Name" value="" /></td>
                        <td><input type="email" class="team-email" placeholder="email@example.com" value="" /></td>
                        <td><button class="section-btn team-delete-btn"><i class="fas fa-times"></i></button></td>
                    </tr>
                    <tr class="add-team-row">
                        <td colspan="3"><i class="fas fa-plus"></i> Add Team Member</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
}

function createKPISection(title = 'Project KPIs') {
    const extraBtns = `<button class="section-btn add-kpi-btn" title="Add KPI"><i class="fas fa-plus"></i></button>`;
    return `
        ${createSectionHeader(title, true, extraBtns)}
        <div class="section-content">
            <div class="kpi-container">
                <div class="kpi-item">
                    <div class="kpi-indicator green" data-status="green" onclick="cycleKPIStatus(this)"></div>
                    <input type="text" value="Cost" />
                    <button class="section-btn kpi-delete-btn"><i class="fas fa-times"></i></button>
                </div>
                <div class="kpi-item">
                    <div class="kpi-indicator green" data-status="green" onclick="cycleKPIStatus(this)"></div>
                    <input type="text" value="Quality" />
                    <button class="section-btn kpi-delete-btn"><i class="fas fa-times"></i></button>
                </div>
                <div class="kpi-item">
                    <div class="kpi-indicator green" data-status="green" onclick="cycleKPIStatus(this)"></div>
                    <input type="text" value="Time" />
                    <button class="section-btn kpi-delete-btn"><i class="fas fa-times"></i></button>
                </div>
            </div>
        </div>
    `;
}

function createMatrixSection(title = 'Risk Matrix', xLabel = 'Probability', yLabel = 'Consequence') {
    const id = generateId('matrix');
    return `
        ${createSectionHeader(title)}
        <div class="section-content matrix-section" data-matrix-id="${id}" data-x-label="${xLabel}" data-y-label="${yLabel}">
            <div class="matrix-container">
                <div class="matrix-y-label">
                    <input type="text" value="${yLabel} →" class="y-axis-label" />
                </div>
                <div class="matrix-grid postit-dropzone matrix-dropzone" data-matrix-id="${id}">
                    <div class="matrix-quadrant postit-dropzone"></div>
                    <div class="matrix-quadrant postit-dropzone"></div>
                    <div class="matrix-quadrant postit-dropzone"></div>
                    <div class="matrix-quadrant postit-dropzone"></div>
                </div>
                <div class="matrix-x-label">
                    <input type="text" value="${xLabel} →" class="x-axis-label" />
                </div>
            </div>
        </div>
    `;
}

function createWeekPlanSection(title = 'Week Plan', numWeeks = 12, numTracks = 5) {
    const today = new Date().toISOString().split('T')[0];
    let weeksHtml = '';
    for (let i = 0; i < numWeeks; i++) {
        let cellsHtml = '';
        for (let t = 0; t < numTracks; t++) cellsHtml += `<div class="week-cell postit-dropzone"></div>`;
        weeksHtml += `
            <div class="week-column" data-week-index="${i}">
                <div class="week-header">Week ${i + 1}</div>
                ${cellsHtml}
            </div>
        `;
    }
    let tracksHtml = '';
    for (let i = 1; i <= numTracks; i++) {
        tracksHtml += `<div class="track-item"><input type="text" value="Track ${i}" /></div>`;
    }
    const extraBtns = `
        <button class="section-btn toggle-view-btn" title="Switch to Kanban"><i class="fas fa-exchange-alt"></i></button>
        <button class="section-btn add-week-btn" title="Add Week"><i class="fas fa-plus"></i></button>
        <button class="section-btn add-track-btn" title="Add Track"><i class="fas fa-layer-group"></i></button>
        <button class="section-btn calendar-btn" title="Calendar Settings"><i class="fas fa-calendar-alt"></i></button>
    `;
    return `
        ${createSectionHeader(title, true, extraBtns)}
        <div class="section-content" style="padding: 0; display: flex; flex-direction: column;">
            <div class="week-planner-wrapper">
                <div class="week-planner-settings">
                    <label>Start Date:</label>
                    <input type="date" class="week-start-date" value="${today}" onchange="updateWeekNumbers(this)" />
                </div>
                <div class="week-planner">
                    <div class="track-column">
                        <div class="track-header">Track</div>
                        ${tracksHtml}
                    </div>
                    <div class="weeks-container">${weeksHtml}</div>
                </div>
            </div>
        </div>
    `;
}

function createActionsSection(title = 'Actions') {
    return `
        ${createSectionHeader(title)}
        <div class="section-content">
            <table class="actions-table">
                <thead>
                    <tr><th>Action</th><th>When</th><th>Who</th><th>Status</th></tr>
                </thead>
                <tbody>
                    <tr>
                        <td><input type="text" placeholder="Enter action..." /></td>
                        <td><input type="date" /></td>
                        <td><select class="action-owner-select"><option value="">-- Select --</option></select></td>
                        <td>
                            <select>
                                <option value="todo">To Do</option>
                                <option value="inprogress">In Progress</option>
                                <option value="done">Done</option>
                            </select>
                        </td>
                    </tr>
                    <tr class="add-row">
                        <td colspan="4"><i class="fas fa-plus"></i> Add Action</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
}

function createPostitAreaSection(title = 'Ideas') {
    return `
        ${createSectionHeader(title)}
        <div class="section-content postit-dropzone" style="min-height: 200px;"></div>
    `;
}

function createKanbanSection(title = 'Kanban Board') {
    const extraBtns = `<button class="section-btn add-column-btn" title="Add Column"><i class="fas fa-plus"></i></button>`;
    return `
        ${createSectionHeader(title, true, extraBtns)}
        <div class="section-content">
            <div class="kanban-container">
                <div class="kanban-column todo">
                    <div class="kanban-column-header">📋 To Do</div>
                    <div class="kanban-dropzone postit-dropzone"></div>
                </div>
                <div class="kanban-column inprogress">
                    <div class="kanban-column-header">⚡ In Progress</div>
                    <div class="kanban-dropzone postit-dropzone"></div>
                </div>
                <div class="kanban-column done">
                    <div class="kanban-column-header">✅ Done</div>
                    <div class="kanban-dropzone postit-dropzone"></div>
                </div>
            </div>
        </div>
    `;
}

function updateWeekNumbers(input) {
    const startDate = new Date(input.value);
    const section = input.closest('.grid-stack-item-content');
    section.querySelectorAll('.week-column').forEach((col, index) => {
        const weekDate = new Date(startDate);
        weekDate.setDate(weekDate.getDate() + (index * 7));
        const weekNum = getWeekNumber(weekDate);
        col.querySelector('.week-header').textContent = `W${weekNum}`;
        const now = new Date();
        col.classList.toggle('current', weekNum === getWeekNumber(now) && weekDate.getFullYear() === now.getFullYear());
    });
    scheduleAutoSave();
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function cycleKPIStatus(indicator) {
    const statuses = ['green', 'yellow', 'red'];
    const next = statuses[(statuses.indexOf(indicator.getAttribute('data-status')) + 1) % 3];
    indicator.setAttribute('data-status', next);
    indicator.className = 'kpi-indicator ' + next;
    scheduleAutoSave();
}

function addSection(type, options = {}) {
    const id = generateId('section');
    let content = '';
    let w = 3, h = 3;

    switch (type) {
        case 'text':      content = createTextSection(options.title || 'New Section'); w = 2; h = 3; break;
        case 'team':      content = createTeamSection(options.title || 'Team'); w = 2; h = 3; break;
        case 'kpi':       content = createKPISection(options.title || 'Project KPIs'); w = 2; h = 3; break;
        case 'matrix':    content = createMatrixSection(options.title || 'Risk Matrix', options.xLabel || 'Probability', options.yLabel || 'Consequence'); w = 2; h = 4; break;
        case 'weekplan':  content = createWeekPlanSection(options.title || 'Week Plan'); w = 8; h = 5; break;
        case 'actions':   content = createActionsSection(options.title || 'Actions'); w = 3; h = 3; break;
        case 'postit-area': content = createPostitAreaSection(options.title || 'Ideas'); w = 3; h = 4; break;
        case 'kanban':    content = createKanbanSection(options.title || 'Kanban Board'); w = 4; h = 4; break;
    }

    AppState.grid.addWidget({ id, w, h, content });
    logEvent('create', id, 'section', { type });
    scheduleAutoSave();

    if (type === 'team') {
        setTimeout(() => attachTeamTableEvents(), 100);
    }
}

function createDefaultBoard() {
    const widgets = [
        { x: 0, y: 0, w: 2, h: 2, content: createTextSection('Project Name') },
        { x: 0, y: 2, w: 2, h: 2, content: createTeamSection('Team') },
        { x: 0, y: 4, w: 2, h: 2, content: createTextSection('Purpose') },
        { x: 0, y: 6, w: 2, h: 2, content: createTextSection('Success Criteria') },
        { x: 2, y: 0, w: 8, h: 6, content: createWeekPlanSection('Week Plan') },
        { x: 2, y: 6, w: 8, h: 3, content: createActionsSection('Actions') },
        { x: 10, y: 0, w: 2, h: 3, content: createKPISection("Project KPI's") },
        { x: 10, y: 3, w: 2, h: 3, content: createMatrixSection('Project Risk', 'Probability', 'Consequence') },
        { x: 10, y: 6, w: 2, h: 3, content: createMatrixSection('Improvement Ideas', 'Ease', 'Impact') },
    ];

    widgets.forEach(w => AppState.grid.addWidget({ id: generateId('section'), ...w }));

    setTimeout(() => {
        initializeDropzones();
        attachSectionEventListeners();
        attachTeamTableEvents();
        document.querySelectorAll('.week-start-date').forEach(input => updateWeekNumbers(input));
    }, 100);
}

function saveSectionData(item) {
    const content = item.querySelector('.section-content');
    if (!content) return null;

    if (content.querySelector('.kpi-container')) {
        const kpis = [];
        content.querySelectorAll('.kpi-item').forEach(kpi => {
            kpis.push({ text: kpi.querySelector('input').value, status: kpi.querySelector('.kpi-indicator').getAttribute('data-status') });
        });
        return { type: 'kpi', kpis };
    }
    if (content.querySelector('.week-planner')) {
        const tracks = Array.from(content.querySelectorAll('.track-item input')).map(i => i.value);
        return { type: 'weekplan', tracks, weeks: content.querySelectorAll('.week-column').length, startDate: content.querySelector('.week-start-date')?.value };
    }
    if (content.querySelector('.actions-table')) {
        const rows = [];
        content.querySelectorAll('.actions-table tbody tr:not(.add-row)').forEach(tr => {
            const inputs = tr.querySelectorAll('input, select');
            if (inputs.length >= 4) rows.push({ action: inputs[0].value, date: inputs[1].value, owner: inputs[2].value, status: inputs[3].value });
        });
        return { type: 'actions', rows };
    }
    if (content.querySelector('.kanban-container') && content.getAttribute('data-origin') === 'weekplan') {
        const tracks = JSON.parse(content.getAttribute('data-wp-tracks') || '[]');
        const weeks = parseInt(content.getAttribute('data-wp-weeks') || '12');
        const startDate = content.getAttribute('data-wp-startdate') || '';
        return { type: 'weekplan', viewMode: 'kanban', tracks, weeks, startDate };
    }
    if (content.querySelector('.kanban-container')) {
        const columns = [];
        content.querySelectorAll('.kanban-column').forEach(col => {
            const header = col.querySelector('.kanban-column-header');
            const input = header.querySelector('input');
            columns.push({ title: (input ? input.value : header.innerText).trim(), id: col.className });
        });
        return { type: 'kanban', columns };
    }
    if (content.querySelector('.matrix-container')) {
        return { type: 'matrix' };
    }
    return null;
}

function restoreSectionData(item, data) {
    const content = item.querySelector('.section-content');
    if (!content) return;

    if (data.type === 'kpi') {
        const container = content.querySelector('.kpi-container');
        container.innerHTML = '';
        data.kpis.forEach(kpi => {
            const el = document.createElement('div');
            el.className = 'kpi-item';
            el.innerHTML = `
                <div class="kpi-indicator ${kpi.status}" data-status="${kpi.status}" onclick="cycleKPIStatus(this)"></div>
                <input type="text" value="${kpi.text}" />
                <button class="section-btn kpi-delete-btn"><i class="fas fa-times"></i></button>
            `;
            container.appendChild(el);
            el.querySelector('.kpi-delete-btn').onclick = function () { el.remove(); scheduleAutoSave(); };
        });
    } else if (data.type === 'weekplan') {
        const planner = content.querySelector('.week-planner');
        const trackCol = planner.querySelector('.track-column');
        const weeksCont = planner.querySelector('.weeks-container');
        const startDateInput = content.querySelector('.week-start-date');

        if (startDateInput && data.startDate) startDateInput.value = data.startDate;

        const trackHeader = trackCol.querySelector('.track-header');
        trackCol.innerHTML = '';
        trackCol.appendChild(trackHeader);
        data.tracks.forEach(trackText => {
            const div = document.createElement('div');
            div.className = 'track-item';
            div.innerHTML = `<input type="text" value="${trackText}" />`;
            trackCol.appendChild(div);
        });

        weeksCont.innerHTML = '';
        for (let i = 0; i < data.weeks; i++) {
            const weekDiv = document.createElement('div');
            weekDiv.className = 'week-column';
            weekDiv.setAttribute('data-week-index', i);
            weekDiv.innerHTML = `<div class="week-header">Week ${i + 1}</div>` +
                Array(data.tracks.length).fill('<div class="week-cell postit-dropzone"></div>').join('');
            weeksCont.appendChild(weekDiv);
        }
        if (startDateInput) updateWeekNumbers(startDateInput);

        if (data.viewMode === 'kanban') {
            content.setAttribute('data-origin', 'weekplan');
            content.setAttribute('data-wp-tracks', JSON.stringify(data.tracks));
            content.setAttribute('data-wp-weeks', data.weeks);
            content.setAttribute('data-wp-startdate', data.startDate || '');
            content.setAttribute('data-pending-kanban', 'true');
        }

    } else if (data.type === 'actions') {
        const tbody = content.querySelector('.actions-table tbody');
        const addRow = tbody.querySelector('.add-row');
        tbody.querySelectorAll('tr:not(.add-row)').forEach(tr => tr.remove());
        data.rows.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="text" placeholder="Enter action..." value="${row.action}" /></td>
                <td><input type="date" value="${row.date}" /></td>
                <td><select class="action-owner-select"><option value="">-- Select --</option></select></td>
                <td>
                    <select>
                        <option value="todo" ${row.status === 'todo' ? 'selected' : ''}>To Do</option>
                        <option value="inprogress" ${row.status === 'inprogress' ? 'selected' : ''}>In Progress</option>
                        <option value="done" ${row.status === 'done' ? 'selected' : ''}>Done</option>
                    </select>
                </td>
            `;
            tr.querySelector('.action-owner-select').setAttribute('data-value', row.owner);
            tbody.insertBefore(tr, addRow);
        });

    } else if (data.type === 'kanban') {
        const container = content.querySelector('.kanban-container');
        container.innerHTML = '';
        data.columns.forEach(col => {
            const isDefault = col.id.includes('todo') || col.id.includes('inprogress') || col.id.includes('done');
            const div = document.createElement('div');
            div.className = col.id.includes('kanban-column') ? col.id : 'kanban-column';
            if (!div.className.includes('kanban-column')) div.className = 'kanban-column';
            const headerContent = isDefault ? col.title :
                `<input type="text" value="${col.title}" style="background:transparent;border:none;color:white;font-weight:bold;width:100%;text-align:center;" onclick="event.stopPropagation()">`;
            div.innerHTML = `
                <div class="kanban-column-header">${headerContent}</div>
                <div class="kanban-dropzone postit-dropzone"></div>
            `;
            container.appendChild(div);
        });
    }
}

function switchToKanban(sectionContent) {
    if (!sectionContent.querySelector('.week-planner-wrapper')) return;

    const tracks = Array.from(sectionContent.querySelectorAll('.track-item input')).map(i => i.value);
    const weeks = sectionContent.querySelectorAll('.week-column').length;
    const startDate = sectionContent.querySelector('.week-start-date')?.value || '';

    // Persist weekIndex/trackIndex on every postit currently in a week cell
    sectionContent.querySelectorAll('.week-column').forEach(weekCol => {
        const weekIndex = parseInt(weekCol.getAttribute('data-week-index'));
        const cells = Array.from(weekCol.querySelectorAll('.week-cell'));
        cells.forEach((cell, trackIndex) => {
            cell.querySelectorAll('.postit').forEach(postit => {
                if (AppState.postits[postit.id]) {
                    AppState.postits[postit.id].weekIndex = weekIndex;
                    AppState.postits[postit.id].trackIndex = trackIndex;
                }
            });
        });
    });

    // Collect all post-its in this section
    const postits = Array.from(sectionContent.querySelectorAll('.week-cell .postit'));

    // Store weekplan metadata on the content element for switchToWeekplan
    sectionContent.setAttribute('data-origin', 'weekplan');
    sectionContent.setAttribute('data-wp-tracks', JSON.stringify(tracks));
    sectionContent.setAttribute('data-wp-weeks', weeks);
    sectionContent.setAttribute('data-wp-startdate', startDate);

    sectionContent.innerHTML = `
        <div class="kanban-container">
            <div class="kanban-column todo">
                <div class="kanban-column-header">📋 To Do</div>
                <div class="kanban-dropzone postit-dropzone"></div>
            </div>
            <div class="kanban-column inprogress">
                <div class="kanban-column-header">⚡ In Progress</div>
                <div class="kanban-dropzone postit-dropzone"></div>
            </div>
            <div class="kanban-column done">
                <div class="kanban-column-header">✅ Done</div>
                <div class="kanban-dropzone postit-dropzone"></div>
            </div>
        </div>
    `;

    // Place post-its into status columns
    postits.forEach(postit => {
        const id = postit.id;
        const status = AppState.postits[id]?.status || 'todo';
        const colClass = status === 'inprogress' ? 'inprogress' : (status === 'done' ? 'done' : 'todo');
        const dropzone = sectionContent.querySelector(`.kanban-column.${colClass} .kanban-dropzone`);
        if (dropzone) {
            dropzone.appendChild(postit);
            postit.style.transform = '';
            postit.style.left = '10px';
            postit.style.top = '10px';
            if (AppState.postits[id]) AppState.postits[id].isWeekPlan = false;
        }
    });

    const toggleBtn = sectionContent.closest('.grid-stack-item-content')?.querySelector('.toggle-view-btn');
    if (toggleBtn) toggleBtn.title = 'Switch to Week Plan';

    initializeDropzones();
    attachSectionEventListeners();
    scheduleAutoSave();
}

function switchToWeekplan(sectionContent) {
    if (sectionContent.getAttribute('data-origin') !== 'weekplan') return;

    let tracks = JSON.parse(sectionContent.getAttribute('data-wp-tracks') || '[]');
    const weeks = parseInt(sectionContent.getAttribute('data-wp-weeks') || '12');
    const startDate = sectionContent.getAttribute('data-wp-startdate') || new Date().toISOString().split('T')[0];
    if (tracks.length === 0) tracks = ['Track 1', 'Track 2', 'Track 3'];

    // Update status for postits based on their current kanban column
    sectionContent.querySelectorAll('.kanban-column').forEach(col => {
        const status = col.classList.contains('inprogress') ? 'inprogress' : (col.classList.contains('done') ? 'done' : 'todo');
        col.querySelectorAll('.postit').forEach(postit => {
            if (AppState.postits[postit.id]) AppState.postits[postit.id].status = status;
        });
    });

    const postits = Array.from(sectionContent.querySelectorAll('.kanban-dropzone .postit'));

    const tracksHtml = tracks.map(t => `<div class="track-item"><input type="text" value="${t}" /></div>`).join('');
    let weeksHtml = '';
    for (let i = 0; i < weeks; i++) {
        const cellsHtml = tracks.map(() => '<div class="week-cell postit-dropzone"></div>').join('');
        weeksHtml += `<div class="week-column" data-week-index="${i}"><div class="week-header">Week ${i + 1}</div>${cellsHtml}</div>`;
    }

    sectionContent.removeAttribute('data-origin');
    sectionContent.removeAttribute('data-wp-tracks');
    sectionContent.removeAttribute('data-wp-weeks');
    sectionContent.removeAttribute('data-wp-startdate');
    sectionContent.innerHTML = `
        <div class="week-planner-wrapper">
            <div class="week-planner-settings">
                <label>Start Date:</label>
                <input type="date" class="week-start-date" value="${startDate}" onchange="updateWeekNumbers(this)" />
            </div>
            <div class="week-planner">
                <div class="track-column">
                    <div class="track-header">Track</div>
                    ${tracksHtml}
                </div>
                <div class="weeks-container">${weeksHtml}</div>
            </div>
        </div>
    `;

    const dateInput = sectionContent.querySelector('.week-start-date');
    if (dateInput) updateWeekNumbers(dateInput);

    // Place post-its back into their week cells
    postits.forEach(postit => {
        const id = postit.id;
        const data = AppState.postits[id];
        const wIdx = data?.weekIndex ?? 0;
        const tIdx = data?.trackIndex ?? 0;
        const weekCol = sectionContent.querySelector(`.week-column[data-week-index="${wIdx}"]`);
        if (weekCol) {
            const cells = weekCol.querySelectorAll('.week-cell');
            const cell = cells[tIdx] || cells[0];
            if (cell) {
                cell.appendChild(postit);
                postit.style.transform = '';
                postit.style.left = '10px';
                postit.style.top = '10px';
                if (AppState.postits[id]) AppState.postits[id].isWeekPlan = true;
            }
        }
    });

    const toggleBtn = sectionContent.closest('.grid-stack-item-content')?.querySelector('.toggle-view-btn');
    if (toggleBtn) toggleBtn.title = 'Switch to Kanban';

    initializeDropzones();
    attachSectionEventListeners();
    scheduleAutoSave();
}
