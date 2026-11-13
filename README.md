# 🚀 CodingForCareer — Premier Interactive Tech Learning Platform

<p align="center">
  <img src="assets/logo.png" alt="CodingForCareer Logo" width="160" />
</p>

<p align="center">
  <strong>Master Coding, Data Structures, Modern Frameworks & FAANG Career Roadmaps</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Web%20%7C%20PWA-0056D2?style=for-the-badge" alt="Platform" />
  <img src="https://img.shields.io/badge/Courses-25%2B%20Tracks-00C49F?style=for-the-badge" alt="Courses" />
  <img src="https://img.shields.io/badge/Topics-2%2C400%2B%20Lessons-6C5CE7?style=for-the-badge" alt="Topics" />
  <img src="https://img.shields.io/badge/Playground-Monaco%20IDE%20%26%20Interactive%20Execution-E84393?style=for-the-badge" alt="Playground" />
</p>

---

## 🌟 Highlights & Features

- 🎓 **25+ Comprehensive Tech Curriculums**: Deep-dive courses covering Apache Airflow, Python, SQL, Java, C, C++, Data Structures & Algorithms, Pandas, NumPy, Kafka, Django, Flask, GenAI, and more.
- ⚡ **Interactive Try-It-Yourself Playgrounds**: Live code execution environments powered by Monaco editor with syntax highlighting, custom themes, and instant console feedback.
- 🧠 **Interactive Quizzes**: Instant knowledge checks and chapter assessments with score calculations and detailed explanations.
- 📱 **Progressive Web App (PWA)**: Offline-ready, installable on Android, iOS, and desktop devices via `manifest.json`.
- 🔍 **Instant Omnisearch (Ctrl+K / Cmd+K)**: Blazing fast indexed search with quick suggestion pills across 2,400+ technical topics.
- 🎨 **Modern High-Contrast Design System**: Custom vanilla CSS design system with light/dark themes, glassmorphism, responsive navigation, and accessible typography.
- 🚀 **Zero-Dependency Production Architecture**: Ultra-fast load times with pre-compiled content modules and minified stylesheets.

---

## 📂 Project Architecture

```
codingforcareer/
├── assets/                  # High-resolution logos, favicons, and graphic assets
├── css/
│   ├── styles.css           # Core design system & theme variables
│   └── styles.min.css       # Production minified stylesheet (106 KB)
├── js/
│   ├── data.js              # Full curriculum & 2,400+ topic content database
│   ├── app.js               # Application router, state management, search & sidebar
│   ├── editor.js            # Monaco-powered interactive code playground
│   └── quiz.js              # Quiz assessment engine & score tracking
├── index.html               # Main SPA entry point with SEO, OG, & Twitter tags
├── manifest.json            # PWA manifest configuration
├── sitemap.xml              # Search engine index with 37+ track routes
├── robots.txt               # SEO bot crawling instructions
├── vercel.json              # Vercel deployment configuration
├── _headers                 # Cloudflare / Netlify security & caching headers
├── _redirects               # Single-page application routing fallback
└── .htaccess                # Apache / cPanel Gzip compression & caching rules
```

---

## 💻 Local Development

Run with any local HTTP server:

```powershell
# Using Python
python -m http.server 8000

# Using Node.js npx
npx serve .
```

Then navigate to `http://localhost:8000` in your browser.

---

## 🚢 Deploying to Production

This project is pre-configured for instant zero-configuration deployment on:
- **Vercel**: Import repository directly; `vercel.json` provides route rewriting.
- **Netlify / Cloudflare Pages**: Automatic fallback with `_redirects` and optimized caching with `_headers`.
- **GitHub Pages**: Go to **Settings > Pages** and set source branch to `main`.
- **Apache / Shared Hosting**: Works out-of-the-box with `.htaccess`.

---

## 📄 License

Proprietary © 2026 [CodingForCareer](https://codingforcareer.com). All rights reserved.
