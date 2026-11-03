# Reusable Prompt: Create Study Website from Course Materials

---

## 📋 Master Prompt

> **Role**: You are a technical documentation engineer. Create a complete, deployable static study website from course materials (markdown/PDF/notes) for any subject.
>
> **Input**: 
> - Course directory with raw materials (PDFs, lecture notes, textbook chapters, lab code)
> - Subject name, course code, exam date
> - Textbook references
>
> **Output**: 
> - Organized markdown topics (one per lecture/concept)
> - Static site with Zensical (Material theme)
> - Dark/light toggle, search, tasklists, code copy
> - Deployed to GitHub Pages
> - GitHub repo with full history

---

## 🔄 Step-by-Step Instructions

### Phase 1: Extract & Structure Content
```
1. Scan input directory for all materials (PDF, .txt, .md, slides)
2. Read textbooks (identify chapters) + lecture slides (identify topics)
3. Create 1 markdown file per lecture/topic (numbered: 01_, 02_, etc.)
4. Each topic file must include:
   - Source references (lecture #, textbook chapter)
   - Key concepts with tables/diagrams
   - Code patterns from labs (with line-by-line explanations)
   - Numerical examples with full traces
   - Key formulas (boxed/memorize)
   - Quick self-test Q&A table
   - Exam-relevant MCQ patterns (from practice materials)
5. Create index.md with navigation, checklist, study strategy
```

### Phase 2: Generate Topic Files
```bash
mkdir -p docs/ os_topics/
# Write each topic to os_topics/NN_topic-name.md
# Copy to docs/ for site build
```

### Phase 3: Configure Zensical Site
**Create `zensical.yml`:**
```yaml
site_name: {SUBJECT} Exam Prep — {COURSE_CODE}
site_description: Complete study guide for {SUBJECT} covering Units 1-N
theme:
  name: zensical
  custom_dir: overrides
  palette:
    - scheme: default
      primary: indigo
      accent: indigo
    - scheme: slate
      primary: indigo
      accent: indigo
  features:
    - navigation.tabs
    - navigation.sections
    - navigation.expand
    - navigation.top
    - search.highlight
    - search.share
    - content.code.copy
    - content.code.annotate
    - toc.follow
    - content.tabs.link
    - color.mode
extra_javascript:
  - assets/javascripts/theme-toggle.js
nav: (auto-generated from topic files)
markdown_extensions:
  - pymdownx.tasklist: {custom_checkbox: true}
  - pymdownx.superfences
  - pymdownx.tabbed: {alternate_style: true}
  - toc: {permalink: true}
```

### Phase 4: Add Dark/Light Toggle (Zensical fix)
```bash
mkdir -p overrides/assets/javascripts
# Write theme-toggle.js (injects ☀️/🌙 button into header)
```

### Phase 5: Build & Deploy
```bash
# Build
~/.local/bin/zensical build --config-file zensical.yml

# Git init & commit
git init && git add . && git commit -m "Initial commit: {SUBJECT} study site"

# Create GitHub repo & push
gh repo create {REPO_NAME} --public --source=. --remote=origin --push

# Deploy to GitHub Pages (gh-pages branch)
git subtree push --prefix site origin gh-pages

# Enable Pages via API (if not auto)
gh api repos/{USER}/{REPO}/pages --method POST -f source[branch]=gh-pages -f source[path]="/"
```

---

## 🎯 Customization Variables

| Variable | Example |
|----------|---------|
| `{SUBJECT}` | Operating Systems / Computer Networks / DBMS |
| `{COURSE_CODE}` | UE25CS242A / CS301 / EE450 |
| `{UNITS}` | Units 1-3 / Chapters 1-8 / Modules A-D |
| `{TEXTBOOKS}` | Silberschatz 10e, Stallings 9e, Stevens & Rago 3e |
| `{EXAM_DATE}` | Oct 28, 2026 |
| `{REPO_NAME}` | UE25CS242A-SEM3-STUDY-MATERIAL |
| `{GITHUB_USER}` | imyash0722 |

---

## ✅ Verification Checklist

- [ ] All topic files created (sequential numbering)
- [ ] `index.md` has full nav + study checklist
- [ ] `zensical.yml` has `custom_dir: overrides` + `extra_javascript`
- [ ] `overrides/assets/javascripts/theme-toggle.js` exists
- [ ] `zensical build` succeeds (no errors)
- [ ] `git push` completes (large files may need `http.postBuffer`)
- [ ] `git subtree push --prefix site origin gh-pages` works
- [ ] GitHub Pages shows "built" status
- [ ] Live site: dark/light toggle visible in top-right
- [ ] Search works, tasklists render, code blocks copyable

---

## 📦 One-Command Version (After First Setup)

```bash
cd /path/to/course && \
~/.local/bin/zensical build --config-file zensical.yml && \
git add -A && git commit -m "Update: {description}" && \
git push origin main && \
git subtree push --prefix site origin gh-pages
```

---

## 🔑 Key Learnings to Encode

1. **Zensical needs `custom_dir: overrides` + `extra_javascript` for theme toggle**
2. **Large repos need `git config http.postBuffer 524288000` before push**
3. **`git subtree push --prefix site` deploys only the built site**
4. **Topic files must be in `docs/` for nav, but can live in `os_topics/` for authoring**
5. **MCQ patterns from practice exams go in each topic's "Exam-Relevant MCQ Patterns" section**

---

## 🎨 theme-toggle.js (Save as `overrides/assets/javascripts/theme-toggle.js`)

```javascript
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
```