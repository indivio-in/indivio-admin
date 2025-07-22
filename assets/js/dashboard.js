let currentSchools = [];

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('school-grid')) {
        initializeDashboard();
    }
});

function initializeDashboard() {
    listenForSchoolUpdates();
    const modal = document.getElementById('edit-school-modal');
    modal.querySelector('.close-button').addEventListener('click', () => modal.style.display = 'none');
    document.getElementById('edit-school-form').addEventListener('submit', handleUpdateSchool);
}

async function openEditModal(school) {
    const modal = document.getElementById('edit-school-modal');
    document.getElementById('edit-school-id').value = school.id;
    document.getElementById('edit-school-name').value = school.name;
    document.getElementById('edit-logo-url').value = school.logoUrl || '';
    document.getElementById('edit-status').value = school.status || 'active';
    
    const planSelect = document.getElementById('edit-plan-tier');
    planSelect.innerHTML = '<option>Loading Plans...</option>';
    try {
        const plansDoc = await db.collection('platformConfig').doc('plans').get();
        if (plansDoc.exists) {
            planSelect.innerHTML = '';
            const plans = plansDoc.data();
            Object.keys(plans).forEach(planKey => {
                const option = document.createElement('option');
                option.value = planKey;
                option.textContent = plans[planKey].name;
                option.selected = (school.plan.name === plans[planKey].name);
                planSelect.appendChild(option);
            });
        }
    } catch(e) { planSelect.innerHTML = '<option>Could not load plans</option>'; }
    
    modal.style.display = 'flex';
}

async function handleUpdateSchool(e) {
    e.preventDefault();
    const form = e.target;
    const schoolId = form.schoolId.value;
    const selectedPlanKey = form.planTier.value;
    
    const plansDoc = await db.collection('platformConfig').doc('plans').get();
    const selectedPlanDetails = plansDoc.data()[selectedPlanKey];
    
    const updatedData = {
        name: form.name.value,
        logoUrl: form.logoUrl.value,
        status: form.status.value,
        plan: selectedPlanDetails,
    };
    
    await db.collection('schools').doc(schoolId).update(updatedData);
    document.getElementById('edit-school-modal').style.display = 'none';
}

function listenForSchoolUpdates() {
    const grid = document.getElementById("school-grid");
    grid.innerHTML = '<div class="loader"></div>';
    db.collection("schools").orderBy("createdAt", "desc").onSnapshot(snapshot => {
        grid.innerHTML = '';
        if (snapshot.empty) {
            grid.innerHTML = `<div style="text-align:center;padding:2rem;"><i class='fas fa-school-slash' style='font-size:2rem;color:#aaa;'></i><p>No schools registered yet.<br><small>Use the button above to add your first school!</small></p></div>`;
            return;
        }
        snapshot.forEach(doc => {
            const school = { id: doc.id, ...doc.data() };
            const card = document.createElement('div');
            card.className = 'school-card';
            card.innerHTML = `
                <div class="card-header">
                    <img src="${school.logoUrl || 'https://via.placeholder.com/40x40.png?text=L'}" alt="Logo" class="school-logo">
                    <div class="school-info">
                        <h3>${school.name}</h3>
                        <p>${school.schoolId}</p>
                    </div>
                </div>
                <div class="card-body">
                    <p><strong>Plan:</strong> <span class="plan-badge">${school.plan.name || 'N/A'}</span></p>
                    <p><strong>Limits:</strong> ${school.plan.limits.students} S / ${school.plan.limits.teachers} T</p>
                    <p><strong>Status:</strong> <span class="status-badge status-${school.status}">${school.status}</span></p>
                </div>
                <div class="card-footer">
                    <button class="btn edit-btn">Edit</button>
                </div>
            `;
            card.querySelector('.edit-btn').addEventListener('click', () => openEditModal(school));
            grid.appendChild(card);
        });
    });
}