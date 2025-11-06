import { api } from "./api.js";
import { closeModal } from "./modal.js";

export function isLoggedIn() {
    return localStorage.getItem("access_token") !== null;
}

export function logout() {
    localStorage.removeItem('access_token');
    // window.location.href = '/'; // Temporarily commented out for debugging
}

export async function handleLogin(event, modalElement) {
    event.preventDefault();
    const email = event.target.elements["login-email"].value;
    const password = event.target.elements["login-password"].value;

    try {
        const data = await api.login(email, password);
        localStorage.setItem('access_token', data.access_token);

        // Fetch user details to get the agent ID
        const user = await api.fetchUserMe();
        console.log('User object after login:', user);
        console.log('User agent_id after login:', user.agent_id);
        if (user && user.agent_id) {
            localStorage.setItem('active_agent_id', user.agent_id);
        } else {
            console.warn('No agent ID found for the user. Some dashboard features might not work.');
            // Handle cases where an agent ID might be missing, e.g., redirect to an agent creation page
        }

        closeModal(modalElement);
        window.location.href = '/static/dashboard.html'; // Redirect to dashboard
    } catch (error) {
        alert(`Login failed: ${error.message}`);
    }
}

export async function handleRegister(event) {
    event.preventDefault();
    const email = event.target.elements["register-email"].value;
    const password = event.target.elements["register-password"].value;

    try {
        await api.register(email, password);
        alert("Registration successful! Please log in.");
        event.target.reset(); // Clear form
        // Optionally switch to login form
        document.getElementById("login-section").classList.remove("hidden");
        document.getElementById("register-section").classList.add("hidden");
    } catch (error) {
        alert(`Registration failed: ${error.message}`);
    }
}

export function setupAuthForms(modalElement) {
    const loginForm = modalElement.querySelector("#login-form");
    const registerForm = modalElement.querySelector("#register-form");
    const showRegisterLink = modalElement.querySelector("#show-register");
    const showLoginLink = modalElement.querySelector("#show-login");
    const loginSection = modalElement.querySelector("#login-section");
    const registerSection = modalElement.querySelector("#register-section");

    if (loginForm) {
        loginForm.addEventListener("submit", (e) =>
            handleLogin(e, modalElement)
        );
    }
    if (registerForm) {
        registerForm.addEventListener("submit", handleRegister);
    }
    if (showRegisterLink) {
        showRegisterLink.addEventListener("click", (e) => {
            e.preventDefault();
            loginSection.classList.add("hidden");
            registerSection.classList.remove("hidden");
        });
    }
    if (showLoginLink) {
        showLoginLink.addEventListener("click", (e) => {
            e.preventDefault();
            registerSection.classList.add("hidden");
            loginSection.classList.remove("hidden");
        });
    }
}
