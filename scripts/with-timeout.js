/**
 * Deterministic Timeout Wrapper
 * Prevents promises from running indefinitely.
 * @param {Promise} promise - The promise to wrap inside timeout
 * @param {number} ms - Timeout in milliseconds
 * @returns {Promise}
 */
function withTimeout(promise, ms = 15000) {
    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Operation Timeout. Process took too long.')), ms)
    );

    return Promise.race([promise, timeout]);
}

module.exports = { withTimeout };
