document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('features-container')) {
        loadFeaturesAndPlans();
    }
});

async function loadFeaturesAndPlans() {
    const container = document.getElementById('features-container');
    try {
        const plansDoc = await db.collection('platformConfig').doc('plans').get();
        if (!plansDoc.exists) throw new Error("Plans config not found.");
        
        const plans = plansDoc.data();
        container.innerHTML = '';

        Object.keys(plans).forEach(planKey => {
            const plan = plans[planKey];
            const card = document.createElement('div');
            card.className = 'card feature-card';
            card.innerHTML = `
                <h3>${plan.name} Plan</h3>
                <form class="plan-edit-form" data-plan-key="${planKey}">
                    <div class="form-group">
                        <label class="static-label">Student Limit (-1 for unlimited)</label>
                        <input type="number" name="students" value="${plan.limits.students}" class="form-input">
                    </div>
                    <div class="form-group">
                         <label class="static-label">Teacher Limit (-1 for unlimited)</label>
                        <input type="number" name="teachers" value="${plan.limits.teachers}" class="form-input">
                    </div>
                    <div class="form-group">
                        <label class="static-label">Allowed Features (comma separated)</label>
                        <textarea name="features" rows="4" class="form-input">${plan.allowedFeatures.join(', ')}</textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">Update ${plan.name} Plan</button>
                </form>
            `;
            container.appendChild(card);
        });

        document.querySelectorAll('.plan-edit-form').forEach(form => form.addEventListener('submit', handlePlanUpdate));

    } catch(error) {
        container.innerHTML = `<div class="message message-error">${error.message}</div>`;
    }
}

async function handlePlanUpdate(e) {
    e.preventDefault();
    const form = e.target;
    const planKey = form.dataset.planKey;
    const button = form.querySelector('button');

    button.disabled = true;
    button.textContent = 'Updating...';

    const updates = {
        [`${planKey}.limits.students`]: parseInt(form.students.value, 10),
        [`${planKey}.limits.teachers`]: parseInt(form.teachers.value, 10),
        [`${planKey}.allowedFeatures`]: form.features.value.split(',').map(s => s.trim()),
    };

    try {
        await db.collection('platformConfig').doc('plans').update(updates);
        alert(`${planKey} plan updated successfully!`);
    } catch(error) {
        console.error("Plan update failed: ", error);
        alert(`Error: ${error.message}`);
    } finally {
        button.disabled = false;
        button.textContent = `Update ${planKey} Plan`;
    }
}