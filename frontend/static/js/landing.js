import { setupAuthForms } from "./auth.js";
import { openModal } from "./modal.js";

document.addEventListener("DOMContentLoaded", async () => {
    const authModalContainer = document.getElementById("auth-modal-container");
    const loginButton = document.getElementById("login-button"); // The 'Iniciar Sesión' button in the header

    if (!authModalContainer) {
        console.error("Auth modal container not found.");
        return;
    }

    // Dynamically load the auth modal HTML
    try {
        const response = await fetch("/static/components/auth_modal.html");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        authModalContainer.innerHTML = await response.text();

        const authModalElement = document.getElementById("auth-modal");
        if (authModalElement) {
            // Setup modal toggle for the header login button
            if (loginButton) {
                loginButton.addEventListener("click", (e) => {
                    e.preventDefault();
                    openModal(authModalElement);
                });
            }
            // Setup modal toggle for the close button inside the modal
            const closeAuthModalButton =
                document.getElementById("close-auth-modal");
            if (closeAuthModalButton) {
                closeAuthModalButton.addEventListener("click", () => {
                    closeModal(authModalElement);
                });
            }
            // Setup form submissions and toggles within the modal
            setupAuthForms(authModalElement);
        } else {
            console.error("Auth modal element not found after loading.");
        }
    } catch (error) {
        console.error("Failed to load auth modal HTML:", error);
        authModalContainer.innerHTML =
            '<p class="text-red-500">Failed to load authentication form.</p>';
    }
});
