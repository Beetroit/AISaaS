export function openModal(modalElement) {
    modalElement.classList.remove("hidden");
    document.body.classList.add("overflow-hidden"); // Prevent scrolling
}

export function closeModal(modalElement) {
    modalElement.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
}

export function setupModalToggle(openButtonId, modalId, closeButtonId) {
    const openButton = document.getElementById(openButtonId);
    const modal = document.getElementById(modalId);
    const closeButton = document.getElementById(closeButtonId);

    if (openButton && modal && closeButton) {
        openButton.addEventListener("click", (e) => {
            e.preventDefault();
            openModal(modal);
        });

        closeButton.addEventListener("click", () => {
            closeModal(modal);
        });

        // Close modal when clicking outside
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    }
}
