// This script runs in the MAIN world to override page properties
(function () {
    console.log('AI Bots: Injecting Anti-Throttling Shim');

    // 1. Force Visibility
    Object.defineProperty(document, 'visibilityState', {
        get: () => 'visible'
    });
    Object.defineProperty(document, 'hidden', {
        get: () => false
    });

    // 2. Force Focus
    Object.defineProperty(document, 'hasFocus', {
        value: () => true
    });

    // 3. Prevent Throttling (shim requestAnimationFrame? maybe too risky/heavy)

    // 4. Periodically dispatch activation events to keep app alive
    setInterval(() => {
        document.dispatchEvent(new Event('visibilitychange'));
        window.dispatchEvent(new Event('focus'));
    }, 5000);
})();
