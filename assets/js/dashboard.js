document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('school-grid')) {
        initializeDashboard();
    }
});

function initializeDashboard() {
    new LocomotiveScroll({ el: document.querySelector('#main-container'), smooth: true });
    new Swiper('.swiper', { slidesPerView: 'auto', spaceBetween: 30, pagination: { el: '.swiper-pagination', clickable: true } });
    new Typed('#admin-greeting', { strings: ['Admin.', 'Creator.', 'Manager.'], typeSpeed: 50, backSpeed: 30, loop: true });
    
    listenForSchoolUpdates();

    const modal = document.getElementById('edit-school-modal');
    modal.querySelector('.close-button').addEventListener('click', () => modal.style.display = 'none');
    document.getElementById('edit-school-form').addEventListener('submit', handleUpdateSchool);
}

function listenForSchoolUpdates() {
    const grid = document.getElementById("school-grid");
    
    db.collection("schools").orderBy("createdAt", "desc").onSnapshot(snapshot => {
        grid.innerHTML = '';
        if (snapshot.empty) {
            grid.innerHTML = `<p style="text-align: center; grid-column: 1/-1;">No schools registered yet.</p>`;
            updateStats([]);
            return;
        }
        
        const schoolsData = [];
        snapshot.forEach(doc => {
            const school = { id: doc.id, ...doc.data() };
            schoolsData.push(school);

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
                    <button class="btn btn-danger delete-btn">Delete</button>
                </div>
            `;
            card.querySelector('.edit-btn').addEventListener('click', () => openEditModal(school));
            card.querySelector('.delete-btn').addEventListener('click', () => deleteSchool(school.id, school.name));
            grid.appendChild(card);
        });

        updateStats(schoolsData);

    }, error => console.error("Real-time listener error: ", error));
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

function updateStats(schools) {
    document.getElementById('total-schools').textContent = schools.length;
    document.getElementById('normal-schools').textContent = schools.filter(s => s.plan.name === 'Normal').length;
    document.getElementById('pro-schools').textContent = schools.filter(s => s.plan.name === 'Pro').length;
    document.getElementById('ultra-schools').textContent = schools.filter(s => s.plan.name === 'Ultra').length;
}

async function deleteSchool(schoolId, schoolName) {
    if (confirm(`PERMANENTLY DELETE "${schoolName}"? This is irreversible.`)) {
        await db.collection('schools').doc(schoolId).delete();
    }
}