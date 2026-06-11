// Post-it creation, dragging, and form management

function restorePostit(data, parentElement) {
    const postit = document.createElement('div');
    postit.className = 'postit' + (data.status === 'done' ? ' done' : '');
    postit.id = data.id;
    postit.style.backgroundColor = getPostitColor(data.color);
    postit.style.left = data.x + 'px';
    postit.style.top = data.y + 'px';
    postit.setAttribute('data-color', data.color);
    postit.innerHTML = `
        <div class="postit-view">${data.content || ''}</div>
        <div class="postit-inner" style="display:none;">
            <div class="postit-front">
                <textarea placeholder="...">${data.content || ''}</textarea>
            </div>
        </div>
        <button class="postit-delete">&times;</button>
    `;
    parentElement.appendChild(postit);
    makePostitDraggable(postit);
    attachPostitEvents(postit);
}

function getColumnContext(element) {
    const context = { type: 'unknown', details: {} };

    const kanbanColumn = element.closest('.kanban-column');
    if (kanbanColumn) {
        context.type = 'kanban';
        if (kanbanColumn.classList.contains('todo')) context.details.column = 'To Do';
        else if (kanbanColumn.classList.contains('inprogress')) context.details.column = 'In Progress';
        else if (kanbanColumn.classList.contains('done')) context.details.column = 'Done';
        return context;
    }

    const weekCell = element.closest('.week-cell');
    if (weekCell) {
        context.type = 'weekplan';
        const weekColumn = weekCell.closest('.week-column');
        const weekIndex = weekColumn?.getAttribute('data-week-index');
        const weekHeader = weekColumn?.querySelector('.week-header')?.textContent;
        const trackColumn = weekCell.closest('.week-planner-wrapper')?.querySelector('.track-column');
        const allCells = Array.from(weekCell.parentElement.children);
        const cellIndex = allCells.indexOf(weekCell);
        const trackName = trackColumn?.querySelectorAll('.track-item')?.[cellIndex]?.querySelector('input')?.value || `Track ${cellIndex + 1}`;
        context.details.week = weekHeader || `Week ${parseInt(weekIndex) + 1}`;
        context.details.track = trackName;
        return context;
    }

    const matrixQuadrant = element.closest('.matrix-quadrant');
    if (matrixQuadrant) {
        context.type = 'matrix';
        const quadrants = Array.from(matrixQuadrant.parentElement.children);
        const quadrantNames = ['High Impact, Low Effort', 'High Impact, High Effort', 'Low Impact, Low Effort', 'Low Impact, High Effort'];
        context.details.quadrant = quadrantNames[quadrants.indexOf(matrixQuadrant)] || 'Unknown';
        const matrixSection = element.closest('.matrix-section');
        context.details.xLabel = matrixSection?.querySelector('.x-axis-label')?.value || 'X';
        context.details.yLabel = matrixSection?.querySelector('.y-axis-label')?.value || 'Y';
        return context;
    }

    return context;
}

function getRiskScore(postitId) {
    const data = AppState.postits[postitId];
    return (data && data.isMatrix) ? data.xValue * data.yValue : null;
}

function createPostit(color, x, y, parentElement, data = {}) {
    const id = data.id || generateId('postit');
    const finalColor = data.color || 'yellow';
    const rotation = data.rotation || (Math.random() * 6 - 3);

    const postit = document.createElement('div');
    postit.className = 'postit' + (data.status === 'done' ? ' done' : '');
    postit.id = id;
    postit.style.backgroundColor = getPostitColor(finalColor);
    postit.style.left = snapToGrid(x) + 'px';
    postit.style.top = snapToGrid(y) + 'px';
    postit.style.transform = `rotate(${rotation}deg)`;
    postit.setAttribute('data-color', finalColor);
    postit.setAttribute('data-rotation', rotation);
    postit.innerHTML = `
        <div class="postit-view" style="font-family: 'Kalam', cursive; font-size: 10px; line-height: 1.1;">${data.content || ''}</div>
        <div class="postit-inner" style="display:none;">
            <div class="postit-front">
                <textarea placeholder="..." style="font-family: 'Kalam', cursive; font-size: 10px; line-height: 1.1;">${data.content || ''}</textarea>
            </div>
        </div>
        <button class="postit-delete">&times;</button>
    `;
    parentElement.appendChild(postit);

    const sectionContent = parentElement.closest('.section-content');
    const isInWeekCell = parentElement.classList.contains('week-cell');
    let weekIdx = 0, trackIdx = 0;
    if (isInWeekCell) {
        const weekCol = parentElement.closest('.week-column');
        weekIdx = parseInt(weekCol?.getAttribute('data-week-index') ?? '0');
        const cells = Array.from(weekCol?.querySelectorAll('.week-cell') || []);
        trackIdx = Math.max(0, cells.indexOf(parentElement));
    }
    AppState.postits[id] = {
        id,
        color,
        x: snapToGrid(x),
        y: snapToGrid(y),
        content: data.content || '',
        owner: data.owner || '',
        status: data.status || 'todo',
        section: parentElement.closest('.grid-stack-item')?.getAttribute('gs-id') || 'unknown',
        isMatrix: sectionContent?.classList.contains('matrix-section'),
        isWeekPlan: isInWeekCell,
        weekIndex: weekIdx,
        trackIndex: trackIdx,
        xValue: data.xValue || 50,
        yValue: data.yValue || 50,
        mitigation: data.mitigation || '',
        rotation
    };

    makePostitDraggable(postit);
    attachPostitEvents(postit);

    const columnContext = getColumnContext(parentElement);
    const logDetails = { color, x: snapToGrid(x), y: snapToGrid(y) };
    if (columnContext.type === 'kanban') logDetails.kanbanColumn = columnContext.details.column;
    else if (columnContext.type === 'weekplan') { logDetails.week = columnContext.details.week; logDetails.track = columnContext.details.track; }
    else if (columnContext.type === 'matrix') { logDetails.quadrant = columnContext.details.quadrant; logDetails.riskScore = AppState.postits[id].xValue * AppState.postits[id].yValue; }

    logEvent('create', id, 'postit', logDetails);
    scheduleAutoSave();
    return postit;
}

function attachPostitEvents(postit) {
    const id = postit.id;
    const view = postit.querySelector('.postit-view');
    const inner = postit.querySelector('.postit-inner');
    const textarea = postit.querySelector('textarea');

    postit.querySelector('.postit-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        deletePostit(id);
    });

    textarea.addEventListener('blur', () => {
        if (AppState.postits[id]) {
            const content = textarea.value;
            AppState.postits[id].content = content;
            view.textContent = content;
            inner.style.display = 'none';
            view.style.display = 'block';
            scheduleAutoSave();
        }
    });

    postit.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        openPostitForm(id, e.clientX, e.clientY);
    });
}

function makePostitDraggable(postit) {
    let isDragging = false, startX, startY, origLeft, origTop, didDrag = false;

    const onMouseMove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            didDrag = true;
            postit.classList.add('dragging');
        }
        if (didDrag) {
            postit.style.left = (origLeft + dx) + 'px';
            postit.style.top = (origTop + dy) + 'px';
            const cell = document.elementFromPoint(e.clientX, e.clientY)?.closest('.week-cell');
            document.querySelectorAll('.drag-over-active').forEach(c => { if (c !== cell) c.classList.remove('drag-over-active'); });
            if (cell) cell.classList.add('drag-over-active');
        }
    };

    const onMouseUp = (e) => {
        if (!isDragging) return;
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        if (didDrag) {
            postit.classList.remove('dragging');
            document.querySelectorAll('.drag-over-active').forEach(c => c.classList.remove('drag-over-active'));
            handleDrop(postit, e);
        } else {
            enterInlineEdit(postit);
        }
    };

    postit.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON') return;
        if (!e.target.classList.contains('postit') && !e.target.closest('.postit')) return;
        isDragging = true;
        didDrag = false;
        startX = e.clientX;
        startY = e.clientY;
        origLeft = postit.offsetLeft;
        origTop = postit.offsetTop;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}

function handleDrop(postit, e) {
    const id = postit.id;
    postit.hidden = true;
    const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
    postit.hidden = false;

    let newParent = elemBelow?.closest('.postit-dropzone');
    if (!newParent && elemBelow?.closest('.postit')) newParent = elemBelow.closest('.postit').parentElement;

    if (newParent) {
        if (newParent !== postit.parentElement) {
            newParent.appendChild(postit);
            if (AppState.postits[id]) {
                AppState.postits[id].isMatrix = newParent.classList.contains('matrix-dropzone');
                const isWeekCell = newParent.classList.contains('week-cell');
                AppState.postits[id].isWeekPlan = isWeekCell;
                AppState.postits[id].section = newParent.closest('.grid-stack-item')?.getAttribute('gs-id');
                if (isWeekCell) {
                    const weekCol = newParent.closest('.week-column');
                    AppState.postits[id].weekIndex = parseInt(weekCol?.getAttribute('data-week-index') ?? '0');
                    const cells = Array.from(weekCol?.querySelectorAll('.week-cell') || []);
                    AppState.postits[id].trackIndex = Math.max(0, cells.indexOf(newParent));
                }
                const kanbanCol = newParent.closest('.kanban-column');
                if (kanbanCol) {
                    if (kanbanCol.classList.contains('inprogress')) AppState.postits[id].status = 'inprogress';
                    else if (kanbanCol.classList.contains('done')) AppState.postits[id].status = 'done';
                    else AppState.postits[id].status = 'todo';
                    postit.classList.toggle('done', AppState.postits[id].status === 'done');
                }
            }
        }
        if (newParent.classList.contains('week-cell')) {
            postit.style.transform = '';
            postit.style.left = '10px';
            postit.style.top = '10px';
        } else {
            const rect = newParent.getBoundingClientRect();
            postit.style.left = Math.max(0, e.clientX - rect.left - 30) + 'px';
            postit.style.top = Math.max(0, e.clientY - rect.top - 30) + 'px';
        }
    }

    const newX = parseInt(postit.style.left);
    const newY = parseInt(postit.style.top);
    if (AppState.postits[id]) {
        AppState.postits[id].x = newX;
        AppState.postits[id].y = newY;
        const matrixDropzone = postit.closest('.matrix-dropzone');
        if (matrixDropzone) updateMatrixPositionFromDrag(postit, matrixDropzone);
    }

    const columnContext = getColumnContext(postit);
    const logDetails = { x: newX, y: newY };
    if (columnContext.type === 'kanban') logDetails.kanbanColumn = columnContext.details.column;
    else if (columnContext.type === 'weekplan') { logDetails.week = columnContext.details.week; logDetails.track = columnContext.details.track; }
    else if (columnContext.type === 'matrix' && AppState.postits[id]) {
        const d = AppState.postits[id];
        logDetails.quadrant = columnContext.details.quadrant;
        logDetails.riskScore = d.xValue * d.yValue;
    }
    logEvent('move', id, 'postit', logDetails);
}

function enterInlineEdit(postit) {
    postit.querySelector('.postit-view').style.display = 'none';
    postit.querySelector('.postit-inner').style.display = 'block';
    postit.querySelector('textarea').focus();
}

function deletePostit(id) {
    const postit = document.getElementById(id);
    if (postit) {
        postit.remove();
        delete AppState.postits[id];
        logEvent('delete', id, 'postit', 'Deleted');
        scheduleAutoSave();
    }
}

function updateMatrixPositionFromDrag(postit, matrix) {
    const matrixRect = matrix.getBoundingClientRect();
    const postitRect = postit.getBoundingClientRect();
    const centerX = (postitRect.left + postitRect.width / 2) - matrixRect.left;
    const centerY = (postitRect.top + postitRect.height / 2) - matrixRect.top;
    const xPercent = Math.max(1, Math.min(100, Math.round((centerX / matrixRect.width) * 100)));
    const yPercent = Math.max(1, Math.min(100, Math.round(100 - (centerY / matrixRect.height) * 100)));
    const id = postit.id;

    if (AppState.postits[id]) {
        AppState.postits[id].xValue = xPercent;
        AppState.postits[id].yValue = yPercent;
        const section = matrix.closest('.matrix-section');
        const xLabel = section?.querySelector('.x-axis-label')?.value || 'X';
        const yLabel = section?.querySelector('.y-axis-label')?.value || 'Y';
        logMatrixPosition(id, matrix.getAttribute('data-matrix-id'), xLabel, xPercent, yLabel, yPercent, xPercent * yPercent);
    }
}

function openPostitForm(id, clickX, clickY) {
    const data = AppState.postits[id];
    if (!data) return;

    AppState.currentPostitId = id;
    const form = document.getElementById('postitForm');
    const formWidth = 280, formHeight = 400;
    let x = clickX + 10, y = clickY + 10;
    if (x + formWidth > window.innerWidth) x = clickX - formWidth - 10;
    if (y + formHeight > window.innerHeight) y = window.innerHeight - formHeight - 10;
    form.style.left = x + 'px';
    form.style.top = Math.max(10, y) + 'px';
    form.style.display = 'block';

    updateAllOwnerDropdowns();
    document.getElementById('formContent').value = data.content || '';
    document.getElementById('formOwner').value = data.owner || '';
    document.getElementById('formStatus').value = data.status || 'todo';

    const color = data.color || 'yellow';
    document.getElementById('formColor').value = color;
    document.querySelectorAll('.color-opt').forEach(opt => opt.classList.toggle('selected', opt.getAttribute('data-color') === color));

    const riskFields = document.getElementById('riskFields');
    if (data.isMatrix) {
        riskFields.style.display = 'block';
        document.getElementById('formXValue').value = data.xValue || 50;
        document.getElementById('formYValue').value = data.yValue || 50;
        document.getElementById('formMitigation').value = data.mitigation || '';
        updateScoreDisplay();
        const section = document.getElementById(id)?.closest('.matrix-section');
        if (section) {
            document.getElementById('xAxisLabel').textContent = (section.querySelector('.x-axis-label')?.value || 'X').replace(' →', '') + ' (1-100)';
            document.getElementById('yAxisLabel').textContent = (section.querySelector('.y-axis-label')?.value || 'Y').replace(' →', '') + ' (1-100)';
        }
    } else {
        riskFields.style.display = 'none';
    }

    document.getElementById('formTitle').textContent = data.isMatrix ? 'Risk Item' : (data.isWeekPlan ? 'Task' : 'Note');
}

function closePostitForm() {
    document.getElementById('postitForm').style.display = 'none';
    AppState.currentPostitId = null;
}

function savePostitForm() {
    const id = AppState.currentPostitId;
    if (!id || !AppState.postits[id]) return;

    const data = AppState.postits[id];
    data.content = document.getElementById('formContent').value;
    data.owner = document.getElementById('formOwner').value;
    data.status = document.getElementById('formStatus').value;
    data.color = document.getElementById('formColor').value;

    if (data.isMatrix) {
        data.xValue = parseInt(document.getElementById('formXValue').value) || 50;
        data.yValue = parseInt(document.getElementById('formYValue').value) || 50;
        data.mitigation = document.getElementById('formMitigation').value;
        updatePostitPositionInMatrix(id);
    }

    const postit = document.getElementById(id);
    if (postit) {
        postit.querySelector('textarea').value = data.content;
        postit.querySelector('.postit-view').textContent = data.content;
        postit.classList.toggle('done', data.status === 'done');
        postit.style.backgroundColor = getPostitColor(data.color);
        postit.setAttribute('data-color', data.color);
        postit.className = 'postit' + (data.status === 'done' ? ' done ' : ' ') + data.color;
    }

    logEvent('edit', id, 'postit', { status: data.status, owner: data.owner });
    scheduleAutoSave();
}

function updatePostitPositionInMatrix(id) {
    const data = AppState.postits[id];
    const postit = document.getElementById(id);
    if (!postit || !data.isMatrix) return;

    const matrix = postit.closest('.matrix-dropzone');
    if (!matrix) return;

    const matrixRect = matrix.getBoundingClientRect();
    const postitSize = 60;
    const x = (data.xValue / 100) * matrixRect.width - postitSize / 2;
    const y = ((100 - data.yValue) / 100) * matrixRect.height - postitSize / 2;

    postit.style.left = Math.max(0, x) + 'px';
    postit.style.top = Math.max(0, y) + 'px';
    data.x = Math.max(0, x);
    data.y = Math.max(0, y);
}

function updateScoreDisplay() {
    const x = parseInt(document.getElementById('formXValue').value) || 0;
    const y = parseInt(document.getElementById('formYValue').value) || 0;
    document.getElementById('scoreDisplay').textContent = x * y;
}
