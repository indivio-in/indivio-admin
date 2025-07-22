document.addEventListener('DOMContentLoaded', () => {
    // Check if on the correct page before running code
    const registrationForm = document.getElementById('new-school-form');
    if (registrationForm) {
        populatePlanTiers(); // Immediately try to load the plans
        registrationForm.addEventListener('submit', handleNewSchoolRegistration);
    }
});

/**
 * Fetches the available subscription plans from Firestore and populates the dropdown.
 * This version includes improved error handling.
 */
async function populatePlanTiers() {
    const planSelect = document.getElementById('plan-tier-select');
    // Guard clause in case the element doesn't exist
    if (!planSelect) return;

    planSelect.disabled = true;
    planSelect.innerHTML = '<option>Loading Plans...</option>';
    
    try {
        const plansDoc = await db.collection('platformConfig').doc('plans').get();

        if (plansDoc.exists) {
            planSelect.innerHTML = '<option value="" disabled selected>Choose a plan...</option>';
            const plans = plansDoc.data();
            
            // Loop through the plan keys ('Normal', 'Pro', 'Ultra')
            Object.keys(plans).forEach(planKey => {
                const plan = plans[planKey];
                const option = document.createElement('option');
                option.value = planKey; // The value is the key, e.g., "Pro"
                option.textContent = plan.name; // The displayed text is the name, e.g., "Pro"
                planSelect.appendChild(option);
            });
            planSelect.disabled = false; // Enable the dropdown now that it's populated
        } else {
            // This is a critical error, the config document is missing!
            throw new Error("Platform configuration not found.");
        }
    } catch (error) {
        console.error("Error fetching plan tiers:", error);
        planSelect.innerHTML = `<option>${error.message}</option>`;
    }
}

/**
 * Handles the entire new school registration process from form submission.
 */
async function handleNewSchoolRegistration(e) {
    e.preventDefault();
    const form = e.target;
    const statusDiv = document.getElementById('registration-status');
    const button = form.querySelector('button');

    // --- Validation ---
    const selectedPlanKey = form.querySelector('#plan-tier-select').value;
    if (!selectedPlanKey) {
        statusDiv.innerHTML = `<div class="message message-error">Error: Please select a subscription plan.</div>`;
        return;
    }

    button.disabled = true;
    button.textContent = 'Registering...';
    statusDiv.innerHTML = `<div class="loader"></div>`;

    const file = form.querySelector('#school-logo-upload').files[0];
    let logoUrl = '';

    try {
        // Step 1: Upload logo if it exists
        if (file) {
            const logoRef = storage.ref(`school_logos/${Date.now()}_${file.name}`);
            const snapshot = await logoRef.put(file);
            logoUrl = await snapshot.ref.getDownloadURL();
            console.log('Logo uploaded successfully:', logoUrl);
        }

        // Step 2: Generate Credentials and ID
        const schoolId = `SCH${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
        const adminPassword = Math.random().toString(36).slice(-8);

        // Step 3: Fetch full plan details from selected key
        const plansDoc = await db.collection('platformConfig').doc('plans').get();
        const planDetails = plansDoc.data()[selectedPlanKey];

        // Step 4: Prepare final school document
        const schoolData = {
            name: form.schoolName.value,
            city: form.city.value,
            adminName: form.adminName.value,
            adminEmail: form.adminEmail.value,
            logoUrl: logoUrl,
            schoolId: schoolId,
            adminPassword: adminPassword,
            plan: planDetails, // Embed the whole plan object for easy access
            status: 'active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        };

        // Step 5: Save to Firestore and create subcollections
        const schoolRef = db.collection('schools').doc(schoolId);
        const authRef = schoolRef.collection('auth').doc('admin_credentials');
        const studentsPlaceholderRef = schoolRef.collection('students').doc('_placeholder');
        const teachersPlaceholderRef = schoolRef.collection('teachers').doc('_placeholder');
        const classesPlaceholderRef = schoolRef.collection('classes').doc('_placeholder');

        const batch = db.batch();

        // 1. Set the main school data
        batch.set(schoolRef, schoolData);

        // 2. Set the admin credentials in the auth subcollection
        batch.set(authRef, {
            email: form.adminEmail.value,
            password: adminPassword,
            role: 'admin'
        });

        // 3. Set placeholder documents to ensure subcollections are visible
        batch.set(studentsPlaceholderRef, {
            info: "This subcollection holds all student records.",
            fields: "Name, Class, Section, Gender, DOB, ParentName, Phone, Email, Address, RollNo, AdmissionDate, Status, FeeStatus, studentID"
        });
        batch.set(teachersPlaceholderRef, {
            info: "This subcollection holds all teacher records.",
            fields: "Name, Subject, Phone, Email, JoiningDate, ClassIncharge, Salary, Status, teacherID"
        });
        batch.set(classesPlaceholderRef, {
            info: "This subcollection holds all class records.",
            fields: "classID, classTeacher, section"
        });
        
        // Commit the batch
        await batch.commit();
        
        statusDiv.innerHTML = `<div class="message message-success">
            <strong>School registered successfully!</strong><br>
            The complete data structure, including subcollections for auth, students, teachers, and classes, has been created automatically in Firestore.<br>
            Please save these credentials for the school admin:<br>
            <strong>School ID:</strong> ${schoolId}<br>
            <strong>Password:</strong> ${adminPassword}
        </div>`;
        form.reset();

    } catch (error) {
        console.error("Registration failed:", error);
        statusDiv.innerHTML = `<div class="message message-error">Error: ${error.message}</div>`;
    } finally {
        button.disabled = false;
        button.textContent = 'Register School';
    }
}