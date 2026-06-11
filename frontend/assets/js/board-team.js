// Team member management and role restrictions

function applyRoleRestrictions() {
    if (currentUserRole === 'member') {
        document.getElementById('addSection').style.display = 'none';
        document.getElementById('toggleGrid').style.display = 'none';
        document.getElementById('newBoard').style.display = 'none';
        const titleInput = document.getElementById('projectTitle');
        if (titleInput) titleInput.disabled = true;
        document.body.classList.add('role-member');
    }
}

function fixLegacyKPISections() {
    document.querySelectorAll('.section-kpi').forEach(section => {
        const oldBtn = section.querySelector('.kpi-add');
        if (oldBtn) oldBtn.remove();

        const headerRight = section.querySelector('.section-header-right');
        if (headerRight && !headerRight.querySelector('.add-kpi-btn')) {
            const addBtn = document.createElement('button');
            addBtn.className = 'section-btn add-kpi-btn';
            addBtn.title = 'Add KPI';
            addBtn.innerHTML = '<i class="fas fa-plus"></i>';
            headerRight.insertBefore(addBtn, headerRight.firstChild);
            addBtn.onclick = function () {
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
        }
    });
}

function createTeamMemberRow(member) {
    const row = document.createElement('tr');
    row.className = 'team-member-row';
    row.setAttribute('data-member-id', member.id);
    if (member.isOwner) row.classList.add('owner-row');

    const ownerBadge = member.isOwner ? '<span class="owner-badge" title="Board Owner"><i class="fas fa-crown"></i></span>' : '';
    const deleteBtn = member.isOwner ? '' : '<button class="section-btn team-delete-btn"><i class="fas fa-times"></i></button>';

    row.innerHTML = `
        <td>${ownerBadge}<input type="text" class="team-name" placeholder="Name" value="${member.name}" /></td>
        <td><input type="email" class="team-email" placeholder="email@example.com" value="${member.email}" readonly /></td>
        <td>${deleteBtn}</td>
    `;
    return row;
}

function attachTeamMemberEvents() {
    document.querySelectorAll('.team-member-row').forEach(row => {
        const nameInput = row.querySelector('.team-name');
        const deleteBtn = row.querySelector('.team-delete-btn');
        if (nameInput) nameInput.addEventListener('input', () => scheduleAutoSave());
        if (deleteBtn) deleteBtn.onclick = function () { row.remove(); scheduleAutoSave(); };
    });
}

function updateTeamMembersFromTable() {
    AppState.teamMembers = [];
    document.querySelectorAll('.team-member-row').forEach(row => {
        const name = row.querySelector('.team-name')?.value?.trim();
        const email = row.querySelector('.team-email')?.value?.trim();
        if (name) {
            AppState.teamMembers.push({
                id: row.getAttribute('data-member-id'),
                name,
                email
            });
        }
    });
    updateAllOwnerDropdowns();
}

function updateAllOwnerDropdowns() {
    if (updateDropdownsTimeout) return;
    updateDropdownsTimeout = setTimeout(() => {
        updateDropdownsTimeout = null;

        const formOwner = document.getElementById('formOwner');
        if (formOwner) {
            const currentValue = formOwner.value;
            formOwner.innerHTML = '<option value="">-- Select Owner --</option>';
            AppState.teamMembers.forEach(member => {
                const option = document.createElement('option');
                option.value = member.name;
                option.textContent = member.name + (member.email ? ` (${member.email})` : '');
                formOwner.appendChild(option);
            });
            formOwner.value = currentValue;
        }

        document.querySelectorAll('.action-owner-select').forEach(select => {
            const currentValue = select.value;
            select.innerHTML = '<option value="">-- Select --</option>';
            AppState.teamMembers.forEach(member => {
                const option = document.createElement('option');
                option.value = member.name;
                option.textContent = member.name;
                select.appendChild(option);
            });
            select.value = currentValue;
        });
    }, 100);
}

function addTeamMemberRow(tbody) {
    const memberId = 'member_' + Date.now();
    const newRow = document.createElement('tr');
    newRow.className = 'team-member-row';
    newRow.setAttribute('data-member-id', memberId);
    newRow.innerHTML = `
        <td><input type="text" class="team-name" placeholder="Name" value="" /></td>
        <td><input type="email" class="team-email" placeholder="email@example.com" value="" /></td>
        <td><button class="section-btn team-delete-btn"><i class="fas fa-times"></i></button></td>
    `;
    const addRow = tbody.querySelector('.add-team-row');
    tbody.insertBefore(newRow, addRow);
    attachTeamRowEvents(newRow);
    newRow.querySelector('.team-name').focus();
    scheduleAutoSave();
}

function attachTeamRowEvents(row) {
    const nameInput = row.querySelector('.team-name');
    const emailInput = row.querySelector('.team-email');
    const deleteBtn = row.querySelector('.team-delete-btn');

    if (nameInput) {
        nameInput.addEventListener('input', updateTeamMembersFromTable);
        nameInput.addEventListener('change', updateTeamMembersFromTable);
    }
    if (emailInput) {
        emailInput.addEventListener('input', updateTeamMembersFromTable);
        emailInput.addEventListener('change', updateTeamMembersFromTable);
    }
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            row.remove();
            updateTeamMembersFromTable();
            scheduleAutoSave();
        });
    }
}

function attachTeamTableEvents() {
    document.querySelectorAll('.add-team-row').forEach(row => {
        row.onclick = function () {
            addTeamMemberRow(this.closest('tbody'));
        };
    });
    document.querySelectorAll('.team-member-row').forEach(row => attachTeamRowEvents(row));
    updateTeamMembersFromTable();
}
