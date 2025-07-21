document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('new-school-form')) {
        populatePlanTiers();
        document.getElementById('new-school-form').addEventListener('submit', handleNewSchoolRegistration);
    }
});

async function populatePlanTiers() {
    const planSelect = document.getElementById('plan-tier-select');
    planSelect.innerHTML = '<option>Loading Plans...</option>';
    try {
        const plansDoc = await db.collection('platformConfig').doc('plans').get();
        if (plansDoc.exists) {
            planSelect.innerHTML = '<option value="" disabled selected>Choose a plan...</option>';
            const plans = plansDoc.data();
            Object.keys(plans).forEach(planKey => {
                const option = document.createElement('option');
                option.value = planKey;
                option.textContent = plans[planKey].name;
                planSelect.appendChild(option);
            });
        }
    } catch (e) {
        planSelect.innerHTML = '<option>Could not load plans</option>';
    }
}

async function handleNewSchoolRegistration(e) {
    e.preventDefault();
    const form = e.target;
    const statusDiv = document.getElementById('registration-status');
    const button = form.querySelector('button');

    button.disabled = true;
    button.textContent = 'Registering...';
    statusDiv.innerHTML = `<div class="loader"></div>`;

    const file = form.querySelector('#school-logo-upload').files[0];
    let logoUrl = '';

    try {
        if (file) {
            const logoRef = storage.ref(`school_logos/${Date.now()}_${file.name}`);
            const snapshot = await logoRef.put(file);
            logoUrl = await snapshot.ref.getDownloadURL();
        }

        const schoolId = `SCH${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
        const adminPassword = Math.random().toString(36).slice(-8);

        const selectedPlanKey = form.querySelector('#plan-tier-select').value;
        const plansDoc = await db.collection('platformConfig').doc('plans').get();
        const planDetails = plansDoc.data()[selectedPlanKey];

        const schoolData = {
            name: form.schoolName.value,
            city: form.city.value,
            adminName: form.adminName.value,
            adminEmail: form.adminEmail.value,
            logoUrl: logoUrl,
            schoolId: schoolId,
            adminPassword: adminPassword,
            plan: planDetails,
            status: 'active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        };

        await db.collection('schools').doc(schoolId).set(schoolData);
        statusDiv.innerHTML = `<div class="message message-success">School registered successfully! ID: ${schoolId} | Pass: ${adminPassword}</div>`;
        form.reset();

    } catch (error) {
        console.error("Registration failed:", error);
        statusDiv.innerHTML = `<div class="message message-error">Error: ${error.message}</div>`;
    } finally {
        button.disabled = false;
        button.textContent = 'Register School';
    }
}