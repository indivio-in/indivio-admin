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
                        <label class="static-label">Allowed Features</label>
                        <div class="feature-chips" id="chips-${planKey}"></div>
                        <input type="text" class="form-input feature-input" id="input-${planKey}" placeholder="Add feature and press Enter">
                    </div>
                    <div class="form-group">
                        <label><input type="checkbox" class="update-schools-checkbox"> Apply changes to all schools using this plan</label>
                    </div>
                    <button type="submit" class="btn btn-primary">Update ${plan.name} Plan</button>
                </form>
            `;
            container.appendChild(card);

            // Render chips (editable)
            const chipsDiv = card.querySelector(`#chips-${planKey}`);
            const input = card.querySelector(`#input-${planKey}`);
            let features = [...plan.allowedFeatures];
            function renderChips() {
                chipsDiv.innerHTML = '';
                features.forEach((feature, idx) => {
                    const chip = document.createElement('span');
                    chip.className = 'feature-chip';
                    // Editable span
                    const chipText = document.createElement('span');
                    chipText.textContent = feature;
                    chipText.className = 'chip-text';
                    chipText.tabIndex = 0;
                    chipText.onclick = () => {
                        const inputEdit = document.createElement('input');
                        inputEdit.type = 'text';
                        inputEdit.value = feature;
                        inputEdit.className = 'chip-edit-input';
                        chip.replaceChild(inputEdit, chipText);
                        inputEdit.focus();
                        inputEdit.onblur = inputEdit.onkeydown = (e) => {
                            if (e.type === 'blur' || (e.type === 'keydown' && e.key === 'Enter')) {
                                if (inputEdit.value.trim() && !features.includes(inputEdit.value.trim())) {
                                    features[idx] = inputEdit.value.trim();
                                }
                                renderChips();
                            }
                        };
                    };
                    chip.appendChild(chipText);
                    const removeBtn = document.createElement('button');
                    removeBtn.type = 'button';
                    removeBtn.className = 'remove-chip';
                    removeBtn.textContent = '×';
                    removeBtn.onclick = () => { features.splice(idx, 1); renderChips(); };
                    chip.appendChild(removeBtn);
                    chipsDiv.appendChild(chip);
                });
            }
            renderChips();
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter' && input.value.trim()) {
                    e.preventDefault();
                    if (!features.includes(input.value.trim())) {
                        features.push(input.value.trim());
                        renderChips();
                    }
                    input.value = '';
                }
            });
            input.addEventListener('blur', () => {
                if (input.value.trim() && !features.includes(input.value.trim())) {
                    features.push(input.value.trim());
                    renderChips();
                }
                input.value = '';
            });
            card.querySelector('.plan-edit-form')._features = features;
            Object.defineProperty(card.querySelector('.plan-edit-form'), 'features', {
                get: () => features
            });
        });

        document.querySelectorAll('.plan-edit-form').forEach(form => form.addEventListener('submit', handlePlanUpdate));

    } catch (error) {
        container.innerHTML = `<div class="message message-error">${error.message}</div>`;
    }
}

async function handlePlanUpdate(e) {
    e.preventDefault();
    const form = e.target;
    const planKey = form.dataset.planKey;
    const button = form.querySelector('button');
    const updateSchools = form.querySelector('.update-schools-checkbox').checked;

    button.disabled = true;
    button.textContent = 'Updating...';

    // Use the features array from the chips UI
    const features = form.features || [];

    const updates = {
        [`${planKey}.limits.students`]: parseInt(form.students.value, 10),
        [`${planKey}.limits.teachers`]: parseInt(form.teachers.value, 10),
        [`${planKey}.allowedFeatures`]: features,
    };

    try {
        await db.collection('platformConfig').doc('plans').update(updates);
        if (updateSchools) {
            // Update all schools using this plan
            const planName = form.closest('.feature-card').querySelector('h3').textContent.replace(' Plan','');
            const schoolsSnapshot = await db.collection('schools').where('plan.name', '==', planName).get();
            const batch = db.batch();
            schoolsSnapshot.forEach(doc => {
                const ref = db.collection('schools').doc(doc.id);
                const schoolPlan = doc.data().plan;
                schoolPlan.allowedFeatures = features;
                batch.update(ref, { plan: schoolPlan });
            });
            await batch.commit();
        }
        alert(`${planKey} plan updated successfully!` + (updateSchools ? ' (All schools updated)' : ''));
    } catch(error) {
        console.error("Plan update failed: ", error);
        alert(`Error: ${error.message}`);
    } finally {
        button.disabled = false;
        button.textContent = `Update ${planKey} Plan`;
    }
}