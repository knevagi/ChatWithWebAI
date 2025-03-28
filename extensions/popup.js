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
      // TODO: Send to AI service and get response
      // For now, just show a placeholder response
      addMessage("I've received your question and the page content. AI integration coming soon!");
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
