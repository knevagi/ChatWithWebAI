// API Key Manager
class ApiKeyManager {
    static async getApiKey() {
        try {
            const result = await chrome.storage.local.get(['apiKey']);
            return result.apiKey;
        } catch (error) {
            console.error('Error getting API key:', error);
            return null;
        }
    }

    static async setApiKey(apiKey) {
        try {
            await chrome.storage.local.set({ apiKey });
            return true;
        } catch (error) {
            console.error('Error setting API key:', error);
            return false;
        }
    }

    static async validateApiKey(apiKey) {
        try {
            const response = await fetch(`${config.BACKEND_URL}/validate_key`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': apiKey
                }
            });
            return response.ok;
        } catch (error) {
            console.error('Error validating API key:', error);
            return false;
        }
    }
}

export default ApiKeyManager; 