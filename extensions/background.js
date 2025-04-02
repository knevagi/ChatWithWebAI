chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "ASK_BACKEND") {
    const { question, context } = message;
    
    // Get settings from storage
    chrome.storage.sync.get(['selectedModel', 'openaiApiKey', 'claudeApiKey', 'geminiApiKey'], (result) => {
      if (!result.selectedModel) {
        sendResponse({ error: "Please select an AI model in settings" });
        return;
      }

      const apiKey = result[`${result.selectedModel}ApiKey`];
      if (!apiKey) {
        sendResponse({ error: `Please update your ${result.selectedModel} API key in settings` });
        return;
      }

      const bodyparam = JSON.stringify({
        context: context,
        question: question,
        model: result.selectedModel,
        api_key: apiKey
      });
      console.log(bodyparam)
      fetch("https://chatwithwebai.onrender.com/send_answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: bodyparam
      })
      .then(response => response.json())
      .then(data => {
        console.log("Backend response:", data);
        sendResponse({ answer: data.answer });
      })
      .catch(error => {
        console.log(error)
        console.error("Error:", error);
        sendResponse({ error: "Failed to get response from backend" });
      });
    });
    
    return true; // Keep the message channel alive
  }
});
  