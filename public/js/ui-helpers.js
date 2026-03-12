/**
 * Global UI Helpers for loading states and common interactions
 */

/**
 * Sets a button to loading state or restores it
 * @param {HTMLButtonElement|HTMLElement} btn - The button to toggle
 * @param {boolean} isLoading - Whether to show loading state
 */
export function setLoading(btn, isLoading) {
    if (!btn) return;

    if (isLoading) {
        // Prevent multiple clicks
        btn.disabled = true;

        // Save original content
        if (!btn.hasAttribute('data-original-content')) {
            btn.setAttribute('data-original-content', btn.innerHTML);
        }

        // Add loading class and spinner
        btn.classList.add('btn-loading');
        btn.innerHTML = '<span class="spinner"></span>' + (btn.getAttribute('data-original-content') || '');
    } else {
        // Restore state
        btn.disabled = false;
        btn.classList.remove('btn-loading');

        const originalContent = btn.getAttribute('data-original-content');
        if (originalContent) {
            btn.innerHTML = originalContent;
        }
    }
}

/**
 * Shows the global full-screen loading overlay
 */
export function showGlobalLoading() {
    const overlay = document.getElementById('global-loading-overlay');
    if (overlay) {
        overlay.classList.remove('hidden-overlay');
    }
}

/**
 * Hides the global full-screen loading overlay
 */
export function hideGlobalLoading() {
    const overlay = document.getElementById('global-loading-overlay');
    if (overlay) {
        overlay.classList.add('hidden-overlay');
    }
}

// Attach to window for legacy inline onclick support
window.setLoading = setLoading;
window.showGlobalLoading = showGlobalLoading;
window.hideGlobalLoading = hideGlobalLoading;
