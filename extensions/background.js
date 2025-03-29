import config from './config.js';
import ApiKeyManager from './apiKeyManager.js';

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === "ASK_BACKEND") {
    try {
      // Get API key from storage
      let apiKey = await ApiKeyManager.getApiKey();
      
      // If no API key is stored, use the default one
      if (!apiKey) {
        apiKey = config.API_KEY;
        // Validate and store the default key
        if (await ApiKeyManager.validateApiKey(apiKey)) {
          await ApiKeyManager.setApiKey(apiKey);
        } else {
          throw new Error("Invalid API key configuration");
        }
      }

      const { question, context } = message;
      const bodyparam = JSON.stringify({
        context: context,
        question: question
      });
      
      const response = await fetch(`${config.BACKEND_URL}/send_answer`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-API-Key": apiKey
        },
        body: bodyparam
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Invalid API key. Please check your configuration.");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Backend response:", data);
      sendResponse({ answer: data.answer });
    } catch (error) {
      console.error("Error:", error);
      sendResponse({ error: error.message || "Failed to get response from backend" });
    }
    
    return true; // Keep the message channel alive
  }
});
  