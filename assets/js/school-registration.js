/**
 * =================================================================
 * Main School Registration System
 * =================================================================
 * This file relies on firebase-config.js being loaded first,
 * which provides the global 'db' and 'firebase' objects.
 */

/**
 * Generates a random secure password.
 * @param {number} length - The desired length of the password.
 * @returns {string} The generated password.
 */
function generateSecurePassword(length = 8) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

/**
 * Generates a unique School ID in the format "SCH<YEAR>-<5-DIGITS>".
 * It checks Firestore to guarantee the ID is not already in use.
 * @returns {Promise<string>} A promise that resolves to a unique school ID.
 */
async function generateUniqueSchoolId() {
    const year = new Date().getFullYear();
    let schoolId;
    let isUnique = false;

    while (!isUnique) {
        const randomDigits = Math.floor(10000 + Math.random() * 90000);
        schoolId = `SCH${year}-${randomDigits}`;
        
        const schoolRef = db.collection("schools").doc(schoolId);
        const doc = await schoolRef.get();
        
        if (!doc.exists) {
            isUnique = true;
        } else {
            console.warn(`Generated School ID ${schoolId} already exists. Retrying...`);
        }
    }
    return schoolId;
}

/**
 * Creates the empty subcollection structure for a new school.
 * Firestore subcollections only appear when they have at least one document,
 * so we add a placeholder document to each.
 * @param {string} schoolId - The ID of the school.
 */
async function createSchoolStructure(schoolId) {
    const placeholder = { _initialized: true, createdAt: firebase.firestore.FieldValue.serverTimestamp() };
    const schoolRef = db.collection("schools").doc(schoolId);
    const batch = db.batch();

    batch.set(schoolRef.collection("students").doc("_placeholder"), placeholder);
    batch.set(schoolRef.collection("teachers").doc("_placeholder"), placeholder);
    batch.set(schoolRef.collection("classes").doc("_placeholder"), placeholder);
    batch.set(schoolRef.collection("settings").doc("_placeholder"), placeholder);

    await batch.commit();
    console.log(`Initial directory structure created in Firestore for school: ${schoolId}`);
}

/**
 * Main function to register a new school. Handles form submission.
 * @param {Event} event - The form submission event.
 */
async function registerNewSchool(event) {
    event.preventDefault();

    const form = event.target;
    const registerButton = document.getElementById('register-button');
    const successMessage = document.getElementById('success-message');
    const errorMessage = document.getElementById('error-message');

    // --- Start Loading State ---
    registerButton.disabled = true;
    registerButton.textContent = "Registering...";
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';
    document.querySelector('.credentials-display-wrapper').style.display = 'none';


    try {
        const formData = new FormData(form);
        const schoolData = Object.fromEntries(formData.entries());

        // --- 1. Validate Form Data ---
        if (!schoolData.schoolName || !schoolData.city || !schoolData.adminName || !schoolData.adminEmail || !schoolData.schoolType) {
            throw new Error("Please fill out all required fields.");
        }
        
        // --- 2. Generate Unique ID and Password ---
        const schoolId = await generateUniqueSchoolId();
        const adminPassword = generateSecurePassword(10);

        // --- 3. Prepare Data for Firestore ---
        const schoolInfo = {
            name: schoolData.schoolName,
            city: schoolData.city,
            adminName: schoolData.adminName,
            adminEmail: schoolData.adminEmail,
            adminPassword: adminPassword, // WARNING: For testing only. Not secure for production.
            schoolId: schoolId,
            phone: schoolData.phoneNumber || "",
            address: schoolData.schoolAddress || "",
            schoolType: schoolData.schoolType,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: "active"
        };

        // --- 4. Save to Firestore ---
        await db.collection("schools").doc(schoolId).set(schoolInfo);
        console.log("School document written to Firestore with ID:", schoolId);

        // --- 5. Create Subcollections ---
        await createSchoolStructure(schoolId);
        
        // --- 6. Display Success ---
        form.reset();
        successMessage.textContent = 'School registered successfully! Please save the credentials displayed below.';
        successMessage.style.display = 'block';
        displayGeneratedCredentials(schoolId, adminPassword);

    } catch (error) {
        console.error("Error registering school: ", error);
        errorMessage.textContent = `Registration failed: ${error.message}`;
        errorMessage.style.display = 'block';
    } finally {
        // --- End Loading State ---
        registerButton.disabled = false;
        registerButton.textContent = "Register School";
    }
}

/**
 * Displays the newly generated credentials on the UI.
 * @param {string} schoolId - The generated school ID.
 * @param {string} password - The generated password.
 */
function displayGeneratedCredentials(schoolId, password) {
    const displayArea = document.querySelector('.credentials-display-wrapper');
    document.getElementById('generated-school-id').textContent = schoolId;
    document.getElementById('generated-admin-password').textContent = password;
    if (displayArea) {
        displayArea.style.display = 'block';
    }
}