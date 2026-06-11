// Grid initialization, section locking, and dropzone management

function toggleSectionLock(sectionId) {
    const isLocked = AppState.lockedSections.has(sectionId);
    isLocked ? AppState.lockedSections.delete(sectionId) : AppState.lockedSections.add(sectionId);
    updateSectionLockUI(sectionId, !isLocked);
    updateGridLock();
    scheduleAutoSave();
}

function updateSectionLockUI(sectionId, locked) {
    const item = document.querySelector(`[gs-id="${sectionId}"]`);
    if (!item) return;
    const header = item.querySelector('.section-header');
    const lockBtn = item.querySelector('.lock-btn');
    header?.classList.toggle('locked', locked);
    if (lockBtn) {
        lockBtn.classList.toggle('locked', locked);
        lockBtn.innerHTML = locked ? '<i class="fas fa-lock"></i>' : '<i class="fas fa-unlock"></i>';
    }
}

function updateGridLock() {
    document.querySelectorAll('.grid-stack-item').forEach(item => {
        const id = item.getAttribute('gs-id');
        const locked = AppState.lockedSections.has(id);
        AppState.grid.update(item, { noMove: locked, noResize: locked });
    });
}

function initializeGrid() {
    AppState.grid = GridStack.init({
        column: 12,
        cellHeight: 80,
        margin: 8,
        float: true,
        animate: true,
        staticGrid: true,
        draggable: { handle: '.section-header' },
        resizable: { handles: 'all' },
        disableOneColumnMode: true
    });

    AppState.grid.on('resizestop dragstop', () => {
        setTimeout(initializeDropzones, 100);
        scheduleAutoSave();
    });

    AppState.grid.on('added', () => {
        setTimeout(() => {
            initializeDropzones();
            attachSectionEventListeners();
        }, 100);
    });
}

function toggleEditMode() {
    AppState.isEditMode = !AppState.isEditMode;
    const btn = document.getElementById('editLayout');
    if (AppState.isEditMode) {
        document.body.classList.add('edit-mode');
        btn.classList.add('active');
        btn.innerHTML = '<i class="fas fa-check"></i> Done';
        AppState.grid.setStatic(false);
    } else {
        document.body.classList.remove('edit-mode');
        btn.classList.remove('active');
        btn.innerHTML = '<i class="fas fa-pen-to-square"></i> Edit Layout';
        AppState.grid.setStatic(true);
        scheduleAutoSave();
    }
}

function initializePostitPalette() {
    document.querySelectorAll('.postit-color').forEach(colorBtn => {
        colorBtn.addEventListener('click', () => {
            const color = 'yellow';
            document.querySelectorAll('.postit-color').forEach(c => c.classList.remove('selected'));
            if (AppState.selectedColor === color) {
                AppState.selectedColor = null;
                document.body.style.cursor = 'default';
            } else {
                AppState.selectedColor = color;
                colorBtn.classList.add('selected');
                document.body.style.cursor = 'crosshair';
            }
        });
    });
}

function initializeDropzones() {
    document.querySelectorAll('.postit-dropzone').forEach(dropzone => {
        dropzone.removeEventListener('click', handleDropzoneClick);
        dropzone.addEventListener('click', handleDropzoneClick);
    });
}

function handleDropzoneClick(e) {
    if (!AppState.selectedColor) return;
    if (e.target.closest('.postit')) return;
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;

    const dropzone = e.currentTarget;
    const rect = dropzone.getBoundingClientRect();
    createPostit(AppState.selectedColor, Math.max(0, e.clientX - rect.left - 30), Math.max(0, e.clientY - rect.top - 30), dropzone);

    AppState.selectedColor = null;
    document.querySelectorAll('.postit-color').forEach(c => c.classList.remove('selected'));
    document.body.style.cursor = 'default';
}
