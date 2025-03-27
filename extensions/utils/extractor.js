export function smartExtractPageText() {
    const selectors = ["article", "main", "[role='main']", "[class*='content']"];
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && el.innerText.length > 500) return el.innerText.slice(0, 2000);
    }
    return document.body.innerText.slice(0, 2000);
  }