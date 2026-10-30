document.addEventListener('DOMContentLoaded', function() {
  const paletteForm = document.querySelector('[data-md-component="palette"]');
  if (!paletteForm) return;

  const radios = paletteForm.querySelectorAll('input[name="__palette"]');
  if (radios.length < 2) return;

  // Create toggle button
  const toggle = document.createElement('button');
  toggle.className = 'md-header__button md-icon';
  toggle.setAttribute('aria-label', 'Toggle theme');
  toggle.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="lucide lucide-sun" viewBox="0 0 24 24" style="display: none;">
      <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="lucide lucide-moon" viewBox="0 0 24 24" style="display: none;">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  `;

  // Insert before search button
  const searchLabel = paletteForm.parentElement.querySelector('label[for="__search"]');
  if (searchLabel) {
    searchLabel.parentElement.insertBefore(toggle, searchLabel);
  }

  // Toggle logic
  const sunIcon = toggle.querySelector('.lucide-sun');
  const moonIcon = toggle.querySelector('.lucide-moon');

  function updateIcons() {
    const isDark = document.body.getAttribute('data-md-color-scheme') === 'slate';
    sunIcon.style.display = isDark ? 'block' : 'none';
    moonIcon.style.display = isDark ? 'none' : 'block';
  }

  toggle.addEventListener('click', function(e) {
    e.preventDefault();
    const isDark = document.body.getAttribute('data-md-color-scheme') === 'slate';
    const target = isDark ? radios[0] : radios[1];
    target.checked = true;
    target.dispatchEvent(new Event('change', { bubbles: true }));
  });

  // Watch for scheme changes
  const observer = new MutationObserver(updateIcons);
  observer.observe(document.body, { attributes: true, attributeFilter: ['data-md-color-scheme'] });

  updateIcons();
});