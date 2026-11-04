/**
 * Zensical Custom Dark / Light Mode Toggle
 *
 * Injects a single sun / moon toggle button in the header next to search.
 * Ensures no duplicate toggle buttons exist (fixes bug seen in some Material / Zensical setups).
 */
document.addEventListener('DOMContentLoaded', function() {
  const paletteForm = document.querySelector('[data-md-component="palette"]');
  if (!paletteForm) return;

  const radios = paletteForm.querySelectorAll('input[name="__palette"]');
  if (radios.length < 2) return;

  // Prevent duplicate insertion if already initialized
  if (document.querySelector('.custom-theme-toggle')) return;

  // Hide any default / native palette toggle labels to prevent duplicates (Image 1 fix)
  paletteForm.querySelectorAll('label').forEach(label => {
    label.style.display = 'none';
  });

  // Create toggle button
  const toggle = document.createElement('button');
  toggle.className = 'md-header__button md-icon custom-theme-toggle';
  toggle.setAttribute('aria-label', 'Toggle theme');
  toggle.setAttribute('type', 'button');
  toggle.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="lucide lucide-sun" viewBox="0 0 24 24" style="display: none; width: 1.2rem; height: 1.2rem;">
      <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="lucide lucide-moon" viewBox="0 0 24 24" style="display: none; width: 1.2rem; height: 1.2rem;">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  `;

  // Insert before search button or search label
  const searchLabel = paletteForm.parentElement.querySelector('label[for="__search"]');
  if (searchLabel) {
    searchLabel.parentElement.insertBefore(toggle, searchLabel);
  } else {
    paletteForm.parentElement.appendChild(toggle);
  }

  // Toggle icon state
  const sunIcon = toggle.querySelector('.lucide-sun');
  const moonIcon = toggle.querySelector('.lucide-moon');

  function updateIcons() {
    const isDark = document.body.getAttribute('data-md-color-scheme') === 'slate';
    if (sunIcon && moonIcon) {
      sunIcon.style.display = isDark ? 'block' : 'none';
      moonIcon.style.display = isDark ? 'none' : 'block';
    }
  }

  // Handle click event to switch scheme
  toggle.addEventListener('click', function(e) {
    e.preventDefault();
    const isDark = document.body.getAttribute('data-md-color-scheme') === 'slate';
    const target = isDark ? radios[0] : radios[1];
    target.checked = true;
    target.dispatchEvent(new Event('change', { bubbles: true }));
  });

  // Watch for scheme changes on body
  const observer = new MutationObserver(updateIcons);
  observer.observe(document.body, { attributes: true, attributeFilter: ['data-md-color-scheme'] });

  // Initial update
  updateIcons();
});
