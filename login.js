// login.js
// This code is CORRECT. Its job is to create the user's empty "profile" document.

document.addEventListener('DOMContentLoaded', () => {
    // Get references to the major elements
    const loginFormBox = document.getElementById('login-form');
    const registerFormBox = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');

    // Get a reference to the Firebase services
    const auth = firebase.auth();
    const db = firebase.firestore(); // Get a reference to Firestore

    // --- Form Switching Logic ---
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginFormBox.classList.add('hidden');
        registerFormBox.classList.remove('hidden');
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerFormBox.classList.add('hidden');
        loginFormBox.classList.remove('hidden');
    });

    // --- Form Submission Handlers ---
    const loginFormHandler = document.getElementById('loginFormHandler');
    const loginMessage = document.getElementById('login-message');

    loginFormHandler.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = loginFormHandler.email.value;
        const password = loginFormHandler.password.value;

        loginMessage.textContent = 'Logging in...';
        loginMessage.className = 'message-area success-message';

        try {
            await auth.signInWithEmailAndPassword(email, password);
            loginMessage.textContent = 'Login successful! Redirecting...';
            window.setTimeout(() => {
                window.location.href = '../index.html';
            }, 1500);
        } catch (error) {
            console.error('Login Error:', error.message);
            loginMessage.textContent = error.message;
            loginMessage.className = 'message-area error-message';
        }
    });

    const registerFormHandler = document.getElementById('registerFormHandler');
    const registerMessage = document.getElementById('register-message');

    registerFormHandler.addEventListener('submit', async (event) => {
        event.preventDefault();
        const username = registerFormHandler.username.value;
        const email = registerFormHandler.email.value;
        const password = registerFormHandler.password.value;

        if (!username.trim()) {
            registerMessage.textContent = 'Please enter your full name.';
            registerMessage.className = 'message-area error-message';
            return;
        }

        registerMessage.textContent = 'Creating account...';
        registerMessage.className = 'message-area success-message';

        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            await user.updateProfile({
                displayName: username
            });

            // Create the user's document in Firestore with their info
            await db.collection('users').doc(user.uid).set({
                username: username,
                email: email
            });

            registerMessage.textContent = 'Account created! Redirecting...';
            window.setTimeout(() => {
                window.location.href = '../index.html';
            }, 1500);

        } catch (error) {
            console.error('Registration Error:', error.message);
            registerMessage.textContent = error.message;
            registerMessage.className = 'message-area error-message';
        }
    });
});