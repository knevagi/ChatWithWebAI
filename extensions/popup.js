// DOM Elements
const messagesContainer = document.getElementById("messages");
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendBtn");
const settingsButton = document.getElementById("settingsBtn");

// Chat History
let chatHistory = [];

// Initialize markdown-it
let md;
function initMarkdown() {
  if (window.markdownit) {
    md = window.markdownit({
      html: false,
      linkify: true,
      typographer: true
    });
  } else {
    console.error('Markdown-it library not loaded');
  }
}

// Initialize markdown-it when the library is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMarkdown);
} else {
  initMarkdown();
}

// Handle settings button click
settingsButton.addEventListener("click", () => {
  window.location.href = "settings.html";
});

// Add message to chat
function addMessage(text, isUser = false) {
  // Add to history
  chatHistory.push({ role: isUser ? 'user' : 'ai', content: text });
  
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
  
  if (isUser) {
    messageDiv.textContent = text;
  } else {
    if (md) {
      messageDiv.innerHTML = md.render(text);
    } else {
      messageDiv.textContent = text;
    }
  }
  
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Add loading animation
function addLoadingAnimation() {
  const loadingDiv = document.createElement("div");
  loadingDiv.className = "loading-dots";
  loadingDiv.innerHTML = "<span></span><span></span><span></span>";
  messagesContainer.appendChild(loadingDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  return loadingDiv;
}

// Handle send button click
sendButton.addEventListener("click", async () => {
  const userQuestion = userInput.value.trim();
  if (!userQuestion) return;

  // Disable input and button while processing
  userInput.disabled = true;
  sendButton.disabled = true;

  // Add user message to chat (this also adds it to history)
  addMessage(userQuestion, true);
  userInput.value = "";

  // Add loading animation
  const loadingDiv = addLoadingAnimation();

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
            context: response.pageText, 
            history: chatHistory.slice(0, -1) // Send history *before* the current question
          },
          resolve
        );
      });

      console.log("Backend response:", backendResponse);

      // Remove loading animation
      loadingDiv.remove();

      if (backendResponse && backendResponse.answer) {
        addMessage(backendResponse.answer); // Add AI response to chat and history
      } else if (backendResponse && backendResponse.error) {
        addMessage(backendResponse.error); // Add error message (but maybe not to history?)
      } else {
        addMessage("Sorry, I couldn't get a response from the AI. Please try again.");
      }
    } else {
      // Remove loading animation
      loadingDiv.remove();
      addMessage("Sorry, I couldn't read the page content. Please try again.");
    }
  } catch (error) {
    console.error("Error:", error);
    // Remove loading animation
    loadingDiv.remove();
    addMessage("Sorry, something went wrong. Please try again.");
  } finally {
    // Re-enable input and button
    userInput.disabled = false;
    sendButton.disabled = false;
    userInput.focus();
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
