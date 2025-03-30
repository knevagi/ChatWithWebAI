document.addEventListener('DOMContentLoaded', () => {
  const settingsForm = document.getElementById('settingsForm');
  const backBtn = document.getElementById('backBtn');
  const modelSelect = document.getElementById('modelSelect');
  const apiKeyGroups = document.querySelectorAll('.api-key-group');
  const togglePasswordButtons = document.querySelectorAll('.toggle-password');

  // Load saved settings
  chrome.storage.sync.get(['selectedModel', 'openaiApiKey', 'claudeApiKey', 'geminiApiKey'], (result) => {
    if (result.selectedModel) {
      modelSelect.value = result.selectedModel;
      updateApiKeyVisibility(result.selectedModel);
    }
    if (result.openaiApiKey) {
      document.getElementById('openaiKey').value = result.openaiApiKey;
    }
    if (result.claudeApiKey) {
      document.getElementById('claudeKey').value = result.claudeApiKey;
    }
    if (result.geminiApiKey) {
      document.getElementById('geminiKey').value = result.geminiApiKey;
    }
  });

  // Handle model selection change
  modelSelect.addEventListener('change', (e) => {
    updateApiKeyVisibility(e.target.value);
  });

  // Update API key input visibility based on selected model
  function updateApiKeyVisibility(selectedModel) {
    apiKeyGroups.forEach(group => {
      group.style.display = 'none';
    });
    document.getElementById(`${selectedModel}KeyGroup`).style.display = 'block';
  }

  // Handle toggle password visibility for all API key inputs
  togglePasswordButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-target');
      const input = document.getElementById(targetId);
      const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
      input.setAttribute('type', type);
      
      const eyeIcon = button.querySelector('.eyeIcon');
      const eyeOffIcon = button.querySelector('.eyeOffIcon');
      
      if (type === 'password') {
        eyeIcon.style.display = 'block';
        eyeOffIcon.style.display = 'none';
      } else {
        eyeIcon.style.display = 'none';
        eyeOffIcon.style.display = 'block';
      }
    });
  });

  // Handle form submission
  settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const selectedModel = modelSelect.value;
    const openaiKey = document.getElementById('openaiKey').value.trim();
    const claudeKey = document.getElementById('claudeKey').value.trim();
    const geminiKey = document.getElementById('geminiKey').value.trim();
    
    // Validate that the selected model has an API key
    const selectedKey = document.getElementById(`${selectedModel}Key`).value.trim();
    if (!selectedKey) {
      alert(`Please enter an API key for ${selectedModel}`);
      return;
    }

    // Save all settings
    chrome.storage.sync.set({
      selectedModel,
      openaiApiKey: openaiKey,
      claudeApiKey: claudeKey,
      geminiApiKey: geminiKey
    }, () => {
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'success-message';
      successMessage.textContent = 'Settings saved successfully!';
      settingsForm.appendChild(successMessage);
      
      setTimeout(() => {
        successMessage.remove();
      }, 2000);
    });
  });

  // Handle back button
  backBtn.addEventListener('click', () => {
    window.location.href = 'popup.html';
  });
}); 