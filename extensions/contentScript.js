try {
  console.log("[ChatWithWebAI] Content script starting to load...");
  
  document.addEventListener('DOMContentLoaded', () => {
    console.log("[ChatWithWebAI] Content script loaded - DOMContentLoaded event");
  });

  // Also log immediately in case DOMContentLoaded already fired
  console.log("[ChatWithWebAI] Content script loaded - immediate execution");

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("[ChatWithWebAI] Message received:", request.type);
    if (request.type === "GET_PAGE_TEXT") {
      const article = new Readability(document.cloneNode(true)).parse();

      const cleanedText = article && article.content
        ? stripHtml(article.content).slice(0, 2000)
        : document.body.innerText.slice(0, 2000);
      console.log("[ChatWithWebAI] Page text extracted:", cleanedText.substring(0, 100) + "...");
      sendResponse({ pageText: cleanedText });
    }
    return true;
  });

  // Utility to strip HTML tags
  function stripHtml(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }
} catch (error) {
  console.error("[ChatWithWebAI] Error in content script:", error);
}
