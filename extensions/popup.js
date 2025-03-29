// DOM Elements
const messagesContainer = document.getElementById("messages");
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendBtn");

// Add message to chat
function addMessage(text, isUser = false) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
  messageDiv.textContent = text;
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Handle send button click
sendButton.addEventListener("click", async () => {
  const userQuestion = userInput.value.trim();
  if (!userQuestion) return;

  // Add user message to chat
  addMessage(userQuestion, true);
  userInput.value = "";

  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Get page text
    const response = await new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, { type: "GET_PAGE_TEXT" }, resolve);
    });

    if (response && response.pageText) {
      // Send to backend and wait for response
      const backendResponse = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { 
            type: "ASK_BACKEND", 
            question: userQuestion, 
            context: response.pageText 
          },
          resolve
        );
      });

      console.log("Backend response:", backendResponse);

      if (backendResponse && backendResponse.answer) {
        addMessage(backendResponse.answer);
      } else if (backendResponse && backendResponse.error) {
        addMessage(backendResponse.error);
      } else {
        addMessage("Sorry, I couldn't get a response from the AI. Please try again.");
      }
    } else {
      addMessage("Sorry, I couldn't read the page content. Please try again.");
    }
  } catch (error) {
    console.error("Error:", error);
    addMessage("Sorry, something went wrong. Please try again.");
  }
});

// Handle enter key
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendButton.click();
  }
});

// Focus input on popup open
userInput.focus();
