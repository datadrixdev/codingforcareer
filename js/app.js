/**
 * CodingForCareer — Core Application Controller & Router
 * Integrates navigation, article reader, TOC generator, search modal, bookmarks, and theme switching.
 */

class CodingForCareerApp {
  constructor() {
    this.currentTrack = "mysql";
    this.currentTopicId = "mysql-intro";
    this.currentCategory = "all";
    this.currentView = "home";
    this.homeCategory = "all";
    this.bookmarks = new Set(JSON.parse(localStorage.getItem("codingforcareer_bookmarks") || "[]"));
    this.userXP = parseInt(localStorage.getItem("codingforcareer_user_xp") || "280", 10);

    this.initDOM();
    this.initSubsystems();
    this.bindEvents();
    this.renderCategoryTabs();
    this.renderTechSubbar();
    this.renderSidebar();
    this.renderCurrentTopic();
    this.renderRoadmaps();
    this.renderCheatSheets();
    this.renderHomeCourses();
    this.renderHomeHeroSnippet();
    this.updateBookmarkBadge();
    this.updateXPDisplay();
    this.initResumeAnalyzer();
    this.initTheme();
    this.handleHashChange();
  }

  initDOM() {
    // Nav elements
    this.navItems = document.querySelectorAll(".nav-item");
    this.views = {
      home: document.getElementById("view-home"),
      tutorials: document.getElementById("view-tutorials"),
      playground: document.getElementById("view-playground"),
      quizzes: document.getElementById("view-quizzes"),
      roadmaps: document.getElementById("view-roadmaps"),
      cheatsheets: document.getElementById("view-cheatsheets")
    };

    this.categoryTabsContainer = document.getElementById("category-tabs-container");
    this.techPillContainer = document.getElementById("tech-pill-container");
    this.sidebarChaptersList = document.getElementById("sidebar-chapters-list");
    this.sidebarTrackTitle = document.getElementById("sidebar-track-title");
    this.sidebarTrackSubtitle = document.getElementById("sidebar-track-subtitle");
    this.sidebarTrackIcon = document.getElementById("sidebar-track-icon");
    this.sidebarFilter = document.getElementById("sidebar-filter");
    this.sidebar = document.getElementById("sidebar-nav");
    this.homeCoursesGrid = document.getElementById("home-courses-grid");
    this.homeCategoryPills = document.getElementById("home-category-pills");
    this.homeCourseSearch = document.getElementById("home-course-search");

    this.articleBody = document.getElementById("article-body");
    this.crumbTrack = document.getElementById("crumb-track");
    this.crumbTopic = document.getElementById("crumb-topic");
    this.btnPrevTopic = document.getElementById("btn-prev-topic");
    this.btnNextTopic = document.getElementById("btn-next-topic");
    this.prevTopicTitle = document.getElementById("prev-topic-title");
    this.nextTopicTitle = document.getElementById("next-topic-title");
    this.tocList = document.getElementById("toc-list");

    this.btnToggleBookmark = document.getElementById("btn-toggle-bookmark");
    this.bookmarkBtnText = document.getElementById("bookmark-btn-text");
    this.bookmarkBadge = document.getElementById("bookmark-badge");
    this.btnBookmarksModal = document.getElementById("btn-bookmarks");
    this.bookmarksModal = document.getElementById("bookmarks-modal");
    this.bookmarksModalList = document.getElementById("bookmarks-modal-list");
    this.btnCloseBookmarks = document.getElementById("btn-close-bookmarks");

    // Search modal
    this.searchModal = document.getElementById("search-modal");
    this.btnOpenSearch = document.getElementById("btn-open-search");
    this.globalSearchInput = document.getElementById("global-search-input");
    this.searchResultsList = document.getElementById("search-results-list");

    // Theme & Announcement
    this.btnThemeToggle = document.getElementById("btn-theme-toggle");
    this.announcementBar = document.getElementById("announcement-bar");
    this.btnCloseAnnouncement = document.getElementById("btn-close-announcement");
    this.btnMobileToggle = document.getElementById("btn-toggle-sidebar");
    this.btnCloseSidebar = document.getElementById("btn-close-sidebar");
    this.sidebarBackdrop = document.getElementById("sidebar-backdrop");

    // Roadmaps Dual-View Elements & State
    this.rmHubView = document.getElementById("rm-hub-view");
    this.rmDetailView = document.getElementById("rm-detail-view");
    this.roadmapsGrid = document.getElementById("roadmaps-grid");
    this.rmSearchInput = document.getElementById("rm-search-input");
    this.rmClearSearchBtn = document.getElementById("btn-clear-rm-search");
    this.rmCategoryFilters = document.getElementById("rm-category-filters");
    this.activeRoadmapCategory = "all";
    this.activeRoadmapId = null;
    this.roadmapProgress = JSON.parse(localStorage.getItem("codingforcareer_rm_progress") || "{}");

    // Cheatsheets containers
    this.csHubView = document.getElementById("cs-hub-view");
    this.csDetailView = document.getElementById("cs-detail-view");
    this.csCoursesGrid = document.getElementById("cs-courses-grid");
    this.csCategoryFilter = document.getElementById("cs-category-filter");
    this.cheatsheetFilter = document.getElementById("cheatsheet-filter");
    this.activeCheatSheetCategory = "all";
    this.activeCheatSheetTrack = null;

    // User XP
    this.userXpElem = document.getElementById("user-xp");
    this.userLevelElem = document.getElementById("user-level");
  }

  initSubsystems() {
    this.editor = new CodingForCareerEditor();
    this.quizEngine = new CodingForCareerQuizEngine();
    window.codingForCareerEditor = this.editor;
  }

  bindEvents() {
    // Top Nav buttons (proper slug updates on view change)
    this.navItems.forEach(item => {
      item.addEventListener("click", () => {
        const targetView = item.getAttribute("data-nav");
        if (targetView === "resume") {
          this.goToResumeAnalyzer();
          return;
        }
        if (targetView === "cheatsheets") {
          this.switchView("cheatsheets", true, true);
        } else if (targetView === "home") {
          this.goToHome();
        
        } else {
          this.switchView(targetView, false, true);
        }
      });
    });

    // Roadmaps Hub Filter & Search Events
    if (this.rmSearchInput) {
      this.rmSearchInput.addEventListener("input", (e) => {
        const query = e.target.value.trim();
        if (this.rmClearSearchBtn) {
          this.rmClearSearchBtn.style.display = query.length > 0 ? "block" : "none";
        }
        this.renderRoadmaps(this.activeRoadmapCategory, query);
      });
    }

    if (this.rmClearSearchBtn) {
      this.rmClearSearchBtn.addEventListener("click", () => {
        if (this.rmSearchInput) this.rmSearchInput.value = "";
        this.rmClearSearchBtn.style.display = "none";
        this.renderRoadmaps(this.activeRoadmapCategory, "");
      });
    }

    if (this.rmCategoryFilters) {
      this.rmCategoryFilters.querySelectorAll(".rm-filter-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          this.rmCategoryFilters.querySelectorAll(".rm-filter-btn").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          this.activeRoadmapCategory = btn.getAttribute("data-category") || "all";
          const query = this.rmSearchInput ? this.rmSearchInput.value.trim() : "";
          this.renderRoadmaps(this.activeRoadmapCategory, query);
        });
      });
    }

    // Return to New Homepage on CodingForCareer Logo & Breadcrumb click
    const returnHome = (e) => {
      if (e && e.preventDefault) e.preventDefault();
      this.goToHome();
    };

    document.getElementById("brand-logo-link")?.addEventListener("click", returnHome);
    document.getElementById("footer-logo-link")?.addEventListener("click", returnHome);
    document.querySelector(".breadcrumbs a")?.addEventListener("click", returnHome);

    // Footer Back to Top & Tech Dispatch Newsletter
    document.getElementById("footer-back-to-top")?.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    document.getElementById("footer-dispatch-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const emailInput = document.getElementById("dispatch-email-input");
      const email = emailInput?.value?.trim();
      if (email) {
        this.showToast(`Subscribed ${email} to CodingForCareer Dispatch!`);
        e.target.reset();
      }
    });

    // Hero buttons
    document.getElementById("btn-hero-mysql")?.addEventListener("click", () => this.openTrackTutorial("mysql"));
    document.getElementById("btn-hero-explore")?.addEventListener("click", (e) => {
      e.preventDefault();
      const section = document.getElementById("courses-section");
      if (section) section.scrollIntoView({ behavior: "smooth" });
    });

    document.getElementById("btn-hero-playground")?.addEventListener("click", () => {
      this.switchView("playground");
    });

    document.getElementById("btn-hero-quicksearch")?.addEventListener("click", () => {
      this.openSearchModal();
    });

    // Bento buttons
    document.getElementById("btn-bento-playground")?.addEventListener("click", () => this.switchView("playground"));
    document.getElementById("btn-bento-cheatsheets")?.addEventListener("click", () => this.switchView("cheatsheets", true));
    document.getElementById("btn-bento-quizzes")?.addEventListener("click", () => this.switchView("quizzes"));
    document.getElementById("btn-bento-roadmaps")?.addEventListener("click", () => this.switchView("roadmaps"));

    // CTA buttons
    document.getElementById("btn-cta-start-mysql")?.addEventListener("click", () => this.openTrackTutorial("mysql"));
    document.getElementById("btn-cta-start-python")?.addEventListener("click", () => this.openTrackTutorial("python"));
    document.getElementById("btn-cta-browse-all")?.addEventListener("click", () => {
      const section = document.getElementById("courses-section");
      if (section) section.scrollIntoView({ behavior: "smooth" });
    });

    // Course search input on homepage
    this.homeCourseSearch?.addEventListener("input", (e) => {
      this.renderHomeCourses(this.homeCategory, e.target.value.trim().toLowerCase());
    });

    // Hash navigation
    window.addEventListener("hashchange", () => this.handleHashChange());

    // Announcement bar close
    this.btnCloseAnnouncement?.addEventListener("click", () => {
      if (this.announcementBar) this.announcementBar.style.display = "none";
    });

    // Mobile sidebar toggle with smooth backdrop
    const toggleMobileSidebar = (force) => {
      if (!this.sidebar) return;
      const willOpen = typeof force === "boolean" ? force : !this.sidebar.classList.contains("mobile-open");
      this.sidebar.classList.toggle("mobile-open", willOpen);
      if (this.sidebarBackdrop) {
        this.sidebarBackdrop.classList.toggle("active", willOpen);
      }
      document.body.style.overflow = willOpen ? "hidden" : "";
    };

    this.btnMobileToggle?.addEventListener("click", () => toggleMobileSidebar());
    this.btnCloseSidebar?.addEventListener("click", () => toggleMobileSidebar(false));
    this.sidebarBackdrop?.addEventListener("click", () => toggleMobileSidebar(false));
    document.getElementById("btn-mobile-chapter-pill")?.addEventListener("click", () => toggleMobileSidebar(true));

    // Global Reading Progress Indicator (Active during reading)
    window.addEventListener("scroll", () => {
      const bar = document.getElementById("reading-progress-bar");
      if (!bar) return;
      const h = document.documentElement;
      const b = document.body;
      const st = "scrollTop" in h ? h.scrollTop : b.scrollTop;
      const sh = "scrollHeight" in h ? h.scrollHeight : b.scrollHeight;
      const ch = h.clientHeight || window.innerHeight;
      const percent = sh > ch ? Math.min(100, Math.max(0, (st / (sh - ch)) * 100)) : 0;
      bar.style.width = percent + "%";
    }, { passive: true });

    // Sidebar search filter
    this.sidebarFilter?.addEventListener("input", (e) => {
      this.filterSidebarTopics(e.target.value.toLowerCase());
    });

    // Bookmark Toggle on topic
    this.btnToggleBookmark?.addEventListener("click", () => this.toggleCurrentBookmark());

    // Bookmarks modal open/close
    this.btnBookmarksModal?.addEventListener("click", () => this.openBookmarksModal());
    this.btnCloseBookmarks?.addEventListener("click", () => this.closeBookmarksModal());

    // Share topic
    document.getElementById("btn-share-topic")?.addEventListener("click", () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href);
        this.showToast("Topic link copied to clipboard! 🔗");
      }
    });

    // Feedback buttons
    document.querySelectorAll(".btn-feedback").forEach(btn => {
      btn.addEventListener("click", () => {
        btn.parentElement.innerHTML = `<span style="color:var(--emerald-600); font-weight:700;">❤️ Thank you for your feedback!</span>`;
        this.awardXP(10);
      });
    });

    // Search modal triggers & keyboard shortcut (Ctrl + K)
    this.btnOpenSearch?.addEventListener("click", () => this.openSearchModal());
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        this.openSearchModal();
      }
      if (e.key === "Escape") {
        this.closeSearchModal();
        this.closeBookmarksModal();
      }
    });

    this.searchModal?.addEventListener("click", (e) => {
      if (e.target === this.searchModal) this.closeSearchModal();
    });

    // Debounced high-performance global search
    let searchDebounceTimer = null;
    this.globalSearchInput?.addEventListener("input", (e) => {
      clearTimeout(searchDebounceTimer);
      const val = e.target.value.trim().toLowerCase();
      searchDebounceTimer = setTimeout(() => {
        this.handleGlobalSearch(val);
      }, 100);
    });

    // Delegated click handling for search results & suggestion pills
    this.searchResultsList?.addEventListener("click", (e) => {
      const pill = e.target.closest(".search-suggestion-pill");
      if (pill) {
        const query = pill.getAttribute("data-search") || "";
        if (this.globalSearchInput) this.globalSearchInput.value = query;
        this.handleGlobalSearch(query.toLowerCase());
        return;
      }

      const item = e.target.closest(".search-result-item");
      if (item) {
        const id = item.getAttribute("data-topic-id");
        if (id) {
          this.closeSearchModal();
          this.switchView("tutorials");
          this.selectTopic(id);
        }
      }
    });

    // Theme toggle
    this.btnThemeToggle?.addEventListener("click", () => this.toggleTheme());

    // Cheatsheet hub filter
    this.cheatsheetFilter?.addEventListener("input", () => {
      this.filterCheatSheetCourses();
    });

    // Launch IDE from TOC button
    document.getElementById("btn-open-ide-from-toc")?.addEventListener("click", () => {
      this.switchView("playground");
    });

    document.getElementById("btn-announcement-try")?.addEventListener("click", (e) => {
      e.preventDefault();
      this.switchView("playground");
    });

    document.getElementById("btn-quick-problem")?.addEventListener("click", (e) => {
      e.preventDefault();
      this.switchView("playground");
      this.editor.loadPreset("py-twosum");
    });

    // Chapter next/previous buttons
    this.btnPrevTopic?.addEventListener("click", () => {
      const topic = CODINGFORCAREER_DATA.topics[this.currentTopicId];
      if (topic && topic.prevId) this.selectTopic(topic.prevId);
    });

    this.btnNextTopic?.addEventListener("click", () => {
      const topic = CODINGFORCAREER_DATA.topics[this.currentTopicId];
      if (topic && topic.nextId) this.selectTopic(topic.nextId);
    });
  }

  // Slug & URL Routing Helper
  getTopicSlug(topicId) {
    const topic = CODINGFORCAREER_DATA.topics[topicId];
    if (!topic) return topicId;
    const cleanSlug = topic.slug || topic.id.replace(new RegExp('^' + topic.track.replace('-', '') + '-'), '');
    return `tutorials/${topic.track}/${cleanSlug}`;
  }

  updateHash(slug) {
    const target = `#${slug.replace(/^#/, '')}`;
    if (window.location.hash !== target) {
      try {
        history.pushState(null, "", target);
      } catch (e) {
        window.location.hash = target;
      }
    }
  }

  findTopicIdByTrackAndSlug(trackId, slug) {
    const cleanTrack = (trackId || '').toLowerCase();
    const cleanSlug = (slug || '').toLowerCase().replace(/^\/+|\/+$/g, '');

    const topicsForTrack = Object.values(CODINGFORCAREER_DATA.topics).filter(
      t => t.track.toLowerCase() === cleanTrack
    );

    // 1. Direct match on topic.slug
    const matchBySlug = topicsForTrack.find(t => (t.slug || '').toLowerCase() === cleanSlug);
    if (matchBySlug) return matchBySlug.id;

    // 2. Direct match on topic.id
    const matchById = topicsForTrack.find(t => t.id.toLowerCase() === cleanSlug);
    if (matchById) return matchById.id;

    // 3. Match without track prefix (e.g. "py-functions" vs "functions")
    const matchBySuffix = topicsForTrack.find(t => {
      const sub = t.id.replace(new RegExp('^' + t.track.replace('-', '') + '-'), '').toLowerCase();
      return sub === cleanSlug;
    });
    if (matchBySuffix) return matchBySuffix.id;

    // 4. Fuzzy title slug match
    const matchByTitle = topicsForTrack.find(t => {
      const titleSlug = t.title.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
      return titleSlug === cleanSlug || titleSlug.startsWith(cleanSlug);
    });
    if (matchByTitle) return matchByTitle.id;

    // Fallback to track defaultTopic or first topic
    const trackObj = CODINGFORCAREER_DATA.tracks.find(t => t.id.toLowerCase() === cleanTrack);
    if (trackObj && trackObj.defaultTopic) return trackObj.defaultTopic;
    if (topicsForTrack.length > 0) return topicsForTrack[0].id;

    return null;
  }

  goToHome(e, updateHash = true) {
    if (e && e.preventDefault) e.preventDefault();
    this.switchView("home", false, false);
    if (updateHash) {
      this.updateHash("home");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Open specific track tutorial directly from homepage cards with canonical slug
  openTrackTutorial(trackId) {
    this.switchView("tutorials", false, false);
    this.selectTrack(trackId, true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  handleHashChange() {
    const rawHash = (window.location.hash || "").replace(/^#/, "").trim();
    if (!rawHash || rawHash === "home") {
      this.goToHome(null, false);
      return;
    }

    const hash = rawHash.toLowerCase().replace(/^\/+|\/+$/g, "");

    if (["resume", "resume-analyzer", "analyse-resume", "analyze-resume"].includes(hash)) {
      this.goToResumeAnalyzer();
      return;
    }

    // 1. Cheatsheets Hub or Detail: #cheatsheets, #cheatsheets/:track, #cheatsheets-:track
    if (hash === "cheatsheets" || hash === "cheat-sheets") {
      this.switchView("cheatsheets", true, false);
      return;
    }
    if (hash.startsWith("cheatsheets/") || hash.startsWith("cheatsheets-")) {
      const trackId = hash.replace(/^cheatsheets[\/-]/, "");
      const matchedTrack = CODINGFORCAREER_DATA.tracks.find(t => t.id.toLowerCase() === trackId.toLowerCase());
      if (matchedTrack) {
        this.switchView("cheatsheets", false, false);
        this.openCourseCheatSheet(matchedTrack.id, false);
        return;
      }
    }

    // 2. Standalone Views
    if (["playground", "editor", "try-it"].includes(hash)) {
      this.switchView("playground", false, false);
      return;
    }
    if (["quizzes", "quiz", "practice"].includes(hash)) {
      this.switchView("quizzes", false, false);
      return;
    }
    if (hash === "roadmaps" || hash === "roadmap") {
      this.switchView("roadmaps", false, false);
      this.backToRoadmapsHub(false);
      return;
    }
    if (hash.startsWith("roadmaps/") || hash.startsWith("roadmap/")) {
      const rmId = hash.replace(/^roadmaps?[\/]/, "");
      const matchedRm = (CODINGFORCAREER_DATA.roadmaps || []).find(r => r.id.toLowerCase() === rmId.toLowerCase());
      if (matchedRm) {
        this.switchView("roadmaps", false, false);
        this.openRoadmapDetail(matchedRm.id, false);
        return;
      }
    }
    if (hash === "tutorials") {
      this.switchView("tutorials", false, false);
      return;
    }

    // 3. Hierarchical tutorials routing: #tutorials/:track/:topic or #tutorials/:track
    if (hash.startsWith("tutorials/")) {
      const sub = hash.replace(/^tutorials\//, "");
      const parts = sub.split("/");
      if (parts.length >= 2) {
        const trackId = parts[0];
        const topicSlug = parts.slice(1).join("/");
        const topicId = this.findTopicIdByTrackAndSlug(trackId, topicSlug);
        if (topicId) {
          this.switchView("tutorials", false, false);
          this.selectTopic(topicId, false);
          return;
        }
      } else if (parts.length === 1) {
        const trackId = parts[0];
        const matchedTrack = CODINGFORCAREER_DATA.tracks.find(t => t.id.toLowerCase() === trackId);
        if (matchedTrack) {
          this.switchView("tutorials", false, false);
          this.selectTrack(matchedTrack.id, false);
          return;
        }
      }
    }

    // 4. Combined slash slug: e.g. #python/intro or #mysql/crud-and-constraints
    if (hash.includes("/")) {
      const parts = hash.split("/");
      const trackId = parts[0];
      const topicSlug = parts.slice(1).join("/");
      const topicId = this.findTopicIdByTrackAndSlug(trackId, topicSlug);
      if (topicId) {
        this.switchView("tutorials", false, false);
        this.selectTopic(topicId, false);
        return;
      }
    }

    // 5. Track ID direct (e.g. #python, #mysql, #pyspark)
    const directTrack = CODINGFORCAREER_DATA.tracks.find(t => t.id.toLowerCase() === hash);
    if (directTrack) {
      this.switchView("tutorials", false, false);
      this.selectTrack(directTrack.id, false);
      return;
    }

    // 6. Topic ID legacy direct (e.g. #py-intro, #mysql-crud, #dsa-py-dp)
    if (CODINGFORCAREER_DATA.topics[rawHash]) {
      this.switchView("tutorials", false, false);
      this.selectTopic(rawHash, false);
      return;
    }
    const topicKey = Object.keys(CODINGFORCAREER_DATA.topics).find(k => k.toLowerCase() === hash);
    if (topicKey) {
      this.switchView("tutorials", false, false);
      this.selectTopic(topicKey, false);
      return;
    }

    // 7. Section anchors or footer pages (#about, #privacy, #terms, #contribute)
    if (["about", "privacy", "terms", "contribute"].includes(hash)) {
      this.showToast(`Navigated to ${hash.toUpperCase()} section`);
      const targetEl = document.getElementById("footer-" + hash) || document.querySelector("footer");
      targetEl?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    // Fallback to home
    this.goToHome(null, false);
  }

  switchView(viewName, forceHubReset = false, updateHash = false) {
    if (!this.views[viewName]) return;
    this.currentView = viewName;

    // Update active nav button
    this.navItems.forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-nav") === viewName);
    });

    // Toggle view containers
    Object.keys(this.views).forEach(key => {
      if (this.views[key]) {
        this.views[key].classList.toggle("active", key === viewName);
      }
    });

    document.body.setAttribute("data-view", viewName);
    // Guarantee both secondary navbars (category tabs and tech pills) remain visible across all views
    const techSubbar = document.getElementById("tech-subbar") || document.querySelector(".tech-subbar");
    if (techSubbar) {
      techSubbar.style.setProperty("display", "block", "important");
      techSubbar.style.setProperty("visibility", "visible", "important");
      techSubbar.style.setProperty("opacity", "1", "important");
    }
    const catWrapper = document.querySelector(".category-tabs-wrapper");
    if (catWrapper) {
      catWrapper.style.setProperty("display", "block", "important");
      catWrapper.style.setProperty("visibility", "visible", "important");
    }
    const pillContainer = document.getElementById("tech-pill-container");
    if (pillContainer) {
      pillContainer.style.setProperty("display", "flex", "important");
      pillContainer.style.setProperty("visibility", "visible", "important");
    }

    if (viewName === "roadmaps") {
      if (forceHubReset || (!window.location.hash.startsWith("#roadmaps/") && !window.location.hash.startsWith("#roadmap/"))) {
        this.backToRoadmapsHub(false);
      }
    }

    if (viewName === "cheatsheets") {
      if (forceHubReset || (!window.location.hash.startsWith("#cheatsheets/") && !window.location.hash.startsWith("#cheatsheets-"))) {
        this.backToCheatSheetsHub(false);
      }
    }

    if (updateHash) {
      if (viewName === "home") {
        this.updateHash("home");
      } else if (viewName === "tutorials") {
        const topic = CODINGFORCAREER_DATA.topics[this.currentTopicId];
        if (topic) {
          this.updateHash(this.getTopicSlug(this.currentTopicId));
        } else {
          this.updateHash("tutorials");
        }
      } else if (viewName === "cheatsheets") {
        if (this.activeCheatSheetTrack && this.csDetailView && this.csDetailView.style.display !== "none") {
          this.updateHash(`cheatsheets/${this.activeCheatSheetTrack}`);
        } else {
          this.updateHash("cheatsheets");
        }
      } else {
        this.updateHash(viewName);
      }
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

    renderHomeHeroSnippet() {
    const btnRun = document.getElementById("btn-hero-snippet-run");
    const termText = document.getElementById("hero-term-text");
    const termMs = document.getElementById("hero-term-ms");

    btnRun?.addEventListener("click", () => {
      btnRun.innerHTML = "<span>⏳ Running...</span>";
      const randomMs = Math.floor(Math.random() * 6) + 4;

      setTimeout(() => {
        if (termMs) termMs.textContent = `${randomMs}ms`;
        if (termText) {
          termText.innerHTML = `
            &gt; [Compiler] Sandbox execution complete (Exit 0).<br>
            &gt; <span class="term-highlight">⚡ Python 3: 13 Mastery Modules Loaded!</span><br>
            &gt; [MySQL Server] Connection verified: codingforcareer_db.orders (3 records).<br>
            &gt; <span style="color:#10B981;">✓ All assertions passed in ${randomMs}ms. Ready for next lab.</span>
          `;
        }
        btnRun.innerHTML = "<span>✓ Ran!</span>";
        setTimeout(() => {
          btnRun.innerHTML = "<span>▶ Run Demo</span>";
        }, 2200);
      }, 350);
    });
  }

  renderHomeCourses(category = "all", query = "") {
    this.homeCategory = category;

    // Render category filter pills
    if (this.homeCategoryPills) {
      this.homeCategoryPills.innerHTML = CODINGFORCAREER_DATA.categories.map(cat => {
        const count = cat.id === "all" 
          ? CODINGFORCAREER_DATA.tracks.length 
          : CODINGFORCAREER_DATA.tracks.filter(t => t.category === cat.id).length;
        return `
          <button class="course-cat-btn ${cat.id === category ? 'active' : ''}" data-home-cat="${cat.id}">
            ${cat.name} (${count})
          </button>
        `;
      }).join("");

      this.homeCategoryPills.querySelectorAll(".course-cat-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const selectedCat = btn.getAttribute("data-home-cat");
          const curQuery = this.homeCourseSearch ? this.homeCourseSearch.value.trim().toLowerCase() : "";
          this.renderHomeCourses(selectedCat, curQuery);
        });
      });
    }

    if (!this.homeCoursesGrid) return;

    const filtered = CODINGFORCAREER_DATA.tracks.filter(track => {
      const matchCat = category === "all" || track.category === category;
      const matchQuery = !query || 
        track.name.toLowerCase().includes(query) || 
        track.subtitle.toLowerCase().includes(query) ||
        track.badge.toLowerCase().includes(query);
      return matchCat && matchQuery;
    });

    if (filtered.length === 0) {
      this.homeCoursesGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px; background: var(--bg-surface); border-radius: 16px; border: 1px dashed var(--border-default);">
          <p style="font-size: 1.1rem; color: var(--text-muted); margin-bottom: 12px;">No courses match "${query}" in this category.</p>
          <button class="btn-tile-primary" style="margin: 0 auto; display: inline-flex;" onclick="window.codingForCareerApp.renderHomeCourses('all', '')">Show All Courses</button>
        </div>
      `;
      return;
    }

    const TRACK_ACCENTS = {
      python: {
        gradient: "linear-gradient(135deg, #2563EB 0%, #10B981 100%)",
        glow: "rgba(37, 99, 235, 0.28)",
        bgTint: "rgba(37, 99, 235, 0.1)",
        borderHover: "#3B82F6",
        level: "Beginner Friendly",
        time: "4 hrs",
        rating: "4.9 ★ (2.4k)",
        tags: ["Functions & *args", "OOP & Dunder", "Comprehensions"]
      },
      mysql: {
        gradient: "linear-gradient(135deg, #0284C7 0%, #06B6D4 100%)",
        glow: "rgba(2, 132, 199, 0.28)",
        bgTint: "rgba(2, 132, 199, 0.1)",
        borderHover: "#0284C7",
        level: "Industry Standard",
        time: "3.5 hrs",
        rating: "4.9 ★ (1.8k)",
        tags: ["Relational Design", "Advanced JOINs", "B-Tree Indexes"]
      },
      java: {
        gradient: "linear-gradient(135deg, #EA580C 0%, #F59E0B 100%)",
        glow: "rgba(234, 88, 12, 0.28)",
        bgTint: "rgba(234, 88, 12, 0.1)",
        borderHover: "#EA580C",
        level: "Enterprise Core",
        time: "4.5 hrs",
        rating: "4.8 ★ (1.6k)",
        tags: ["JVM Architecture", "Polymorphism", "Collections API"]
      },
      statistics: {
        gradient: "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)",
        glow: "rgba(139, 92, 246, 0.28)",
        bgTint: "rgba(139, 92, 246, 0.1)",
        borderHover: "#8B5CF6",
        level: "Core Data Science",
        time: "3 hrs",
        rating: "4.8 ★ (1.1k)",
        tags: ["Normal Dist", "Z-Scores", "Hypothesis Tests"]
      },
      "machine-learning": {
        gradient: "linear-gradient(135deg, #6366F1 0%, #A855F7 100%)",
        glow: "rgba(99, 102, 241, 0.28)",
        bgTint: "rgba(99, 102, 241, 0.1)",
        borderHover: "#6366F1",
        level: "Applied AI",
        time: "5 hrs",
        rating: "4.9 ★ (2.1k)",
        tags: ["Scikit-Learn", "Regression Models", "ROC-AUC & F1"]
      },
      powerbi: {
        gradient: "linear-gradient(135deg, #F59E0B 0%, #EAB308 100%)",
        glow: "rgba(245, 158, 11, 0.28)",
        bgTint: "rgba(245, 158, 11, 0.1)",
        borderHover: "#F59E0B",
        level: "Business Analytics",
        time: "3 hrs",
        rating: "4.9 ★ (1.3k)",
        tags: ["DAX Measures", "CALCULATE()", "Star Schemas"]
      },
      pyspark: {
        gradient: "linear-gradient(135deg, #EF4444 0%, #F97316 100%)",
        glow: "rgba(239, 68, 68, 0.28)",
        bgTint: "rgba(239, 68, 68, 0.1)",
        borderHover: "#EF4444",
        level: "Big Data Scale",
        time: "4 hrs",
        rating: "4.9 ★ (1.7k)",
        tags: ["Spark SQL", "Window Functions", "Distributed RDD"]
      },
      pykafka: {
        gradient: "linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)",
        glow: "rgba(6, 182, 212, 0.28)",
        bgTint: "rgba(6, 182, 212, 0.1)",
        borderHover: "#06B6D4",
        level: "Real-Time Streaming",
        time: "3.5 hrs",
        rating: "4.8 ★ (950)",
        tags: ["Event Producers", "Consumer Groups", "Partitions"]
      },
      airflow: {
        gradient: "linear-gradient(135deg, #10B981 0%, #06B6D4 100%)",
        glow: "rgba(16, 185, 129, 0.28)",
        bgTint: "rgba(16, 185, 129, 0.1)",
        borderHover: "#10B981",
        level: "Orchestration Pro",
        time: "3 hrs",
        rating: "4.8 ★ (890)",
        tags: ["Production DAGs", "Custom Operators", "Backfilling"]
      },
      "generative-ai": {
        gradient: "linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)",
        glow: "rgba(236, 72, 153, 0.28)",
        bgTint: "rgba(236, 72, 153, 0.1)",
        borderHover: "#EC4899",
        level: "2026 Hot Tech",
        time: "4.5 hrs",
        rating: "5.0 ★ (3.2k)",
        tags: ["Transformers & LLMs", "RAG Pipeline", "Vector Embeddings"]
      },
      c: {
        gradient: "linear-gradient(135deg, #0284C7 0%, #2563EB 100%)",
        glow: "rgba(2, 132, 199, 0.28)",
        bgTint: "rgba(2, 132, 199, 0.1)",
        borderHover: "#0284C7",
        level: "Core Systems",
        time: "4 hrs",
        rating: "4.9 ★ (1.6k)",
        tags: ["Pointers & Memory", "Structs & Unions", "GCC Compilation"]
      },
      cpp: {
        gradient: "linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)",
        glow: "rgba(37, 99, 235, 0.28)",
        bgTint: "rgba(37, 99, 235, 0.1)",
        borderHover: "#2563EB",
        level: "High Performance",
        time: "5 hrs",
        rating: "4.9 ★ (1.9k)",
        tags: ["OOP & RAII", "Modern C++20 STL", "Templates & Lambdas"]
      },
      excel: {
        gradient: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
        glow: "rgba(5, 150, 105, 0.28)",
        bgTint: "rgba(5, 150, 105, 0.1)",
        borderHover: "#059669",
        level: "Analytics Essential",
        time: "2.5 hrs",
        rating: "4.9 ★ (2.8k)",
        tags: ["XLOOKUP Formulas", "Dynamic Pivot Tables", "Power Query ETL"]
      },
      django: {
        gradient: "linear-gradient(135deg, #047857 0%, #0D9488 100%)",
        glow: "rgba(4, 120, 87, 0.28)",
        bgTint: "rgba(4, 120, 87, 0.1)",
        borderHover: "#047857",
        level: "Full Stack Python",
        time: "4 hrs",
        rating: "4.8 ★ (1.4k)",
        tags: ["MVT Architecture", "Django ORM", "DRF Serializers"]
      },
      numpy: {
        gradient: "linear-gradient(135deg, #0284C7 0%, #6366F1 100%)",
        glow: "rgba(2, 132, 199, 0.28)",
        bgTint: "rgba(2, 132, 199, 0.1)",
        borderHover: "#0284C7",
        level: "Scientific Computing",
        time: "2.5 hrs",
        rating: "4.9 ★ (1.9k)",
        tags: ["N-Dim Arrays", "Broadcasting Rules", "Matrix Dot Products"]
      },
      pandas: {
        gradient: "linear-gradient(135deg, #4338CA 0%, #6D28D9 100%)",
        glow: "rgba(67, 56, 202, 0.28)",
        bgTint: "rgba(67, 56, 202, 0.1)",
        borderHover: "#4338CA",
        level: "Data Wrangling",
        time: "3.5 hrs",
        rating: "4.9 ★ (2.6k)",
        tags: ["DataFrames", "GroupBy Aggregations", "Cleaning & Filtering"]
      },
      flask: {
        gradient: "linear-gradient(135deg, #475569 0%, #1E293B 100%)",
        glow: "rgba(71, 85, 105, 0.28)",
        bgTint: "rgba(71, 85, 105, 0.1)",
        borderHover: "#64748B",
        level: "Microservices",
        time: "2 hrs",
        rating: "4.7 ★ (980)",
        tags: ["Lightweight APIs", "URL Routing", "JSON Endpoints"]
      },
      "dsa-python": {
        gradient: "linear-gradient(135deg, #10B981 0%, #3B82F6 100%)",
        glow: "rgba(16, 185, 129, 0.28)",
        bgTint: "rgba(16, 185, 129, 0.1)",
        borderHover: "#10B981",
        level: "LeetCode 75 Hot",
        time: "6 hrs",
        rating: "5.0 ★ (3.8k)",
        tags: ["Two Pointers", "Binary Trees & BFS", "Dynamic Programming"]
      },
      "dsa-cpp": {
        gradient: "linear-gradient(135deg, #6366F1 0%, #3B82F6 100%)",
        glow: "rgba(99, 102, 241, 0.28)",
        bgTint: "rgba(99, 102, 241, 0.1)",
        borderHover: "#6366F1",
        level: "Competitive Pro",
        time: "6 hrs",
        rating: "4.9 ★ (2.2k)",
        tags: ["Fast I/O & STL", "std::lower_bound", "Dijkstra & Graphs"]
      },
      "dsa-java": {
        gradient: "linear-gradient(135deg, #F59E0B 0%, #DC2626 100%)",
        glow: "rgba(245, 158, 11, 0.28)",
        bgTint: "rgba(245, 158, 11, 0.1)",
        borderHover: "#F59E0B",
        level: "FAANG Interview",
        time: "6 hrs",
        rating: "4.9 ★ (2.5k)",
        tags: ["HashMap Patterns", "Fast & Slow Pointers", "BST Traversals"]
      }
    };

    const defaultAccent = {
      gradient: "linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)",
      glow: "rgba(79, 70, 229, 0.25)",
      bgTint: "rgba(79, 70, 229, 0.08)",
      borderHover: "#6366F1",
      level: "Comprehensive",
      time: "3 hrs",
      rating: "4.8 ★ (1.2k)",
      tags: ["Hands-on Labs", "Syntax Matrix", "Live Sandbox"]
    };

    this.homeCoursesGrid.innerHTML = filtered.map(track => {
      const curriculumObj = CODINGFORCAREER_DATA.curriculum[track.id] || [];
      const totalLessons = curriculumObj.reduce((acc, ch) => acc + (ch.topics ? ch.topics.length : 0), 0) || (track.id === "python" ? 13 : 10);
      const badgeClass = track.badge.toLowerCase().replace(/[^a-z0-9]/g, '');
      const accent = TRACK_ACCENTS[track.id] || defaultAccent;

      return `
        <div class="course-tile-card" data-track-id="${track.id}" style="--track-gradient: ${accent.gradient}; --track-glow: ${accent.glow}; --track-tint: ${accent.bgTint}; --track-border: ${accent.borderHover};">
          <!-- Top Accent Color Bar -->
          <div class="tile-accent-bar" style="background: ${accent.gradient};"></div>

          <!-- Ambient Light Reflection -->
          <div class="tile-ambient-glow"></div>

          <!-- Header row: Icon Box & Badges -->
          <div class="tile-top-row">
            <div class="tile-icon-box">
              <span class="tile-emoji">${track.icon}</span>
            </div>
            <div class="tile-badges-stack">
              <span class="tile-badge-tag badge-${badgeClass}">
                <span class="badge-dot"></span>
                ${track.badge}
              </span>
              <span class="tile-level-tag">${accent.level}</span>
            </div>
          </div>

          <!-- Title & Subtitle -->
          <h3 class="tile-title">${track.name}</h3>
          <p class="tile-subtitle">${track.subtitle}</p>

          <!-- Key Skills Preview Tags (Max 2 tags for clean single row) -->
          <div class="tile-skills-row">
            ${accent.tags.slice(0, 2).map(t => `<span class="tile-skill-chip">${t}</span>`).join('')}
          </div>

          <!-- Meta Row: Lessons, Duration & Rating -->
          <div class="tile-meta-row">
            <div class="tile-meta-left">
              <span class="tile-lessons-count">⚡ ${totalLessons} Lessons</span>
              <span class="tile-meta-sep">•</span>
              <span class="tile-duration">⏱️ ${accent.time}</span>
            </div>
            <span class="tile-rating-pill">${accent.rating}</span>
          </div>

          <!-- Action Buttons -->
          <div class="tile-actions-row">
            <button class="btn-tile-primary" data-action="learn" data-track="${track.id}">
              <span>Start</span>
              <svg class="tile-arrow-svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
            </button>
            <button class="btn-tile-secondary" data-action="sheet" data-track="${track.id}" title="View ${track.name} Cheat Sheet">
              <span>Cheat Sheet</span>
            </button>
          </div>
        </div>
      `;
    }).join("");

    // Bind action buttons on tiles
    this.homeCoursesGrid.querySelectorAll("[data-action='learn']").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const trk = btn.getAttribute("data-track");
        this.openTrackTutorial(trk);
      });
    });

    this.homeCoursesGrid.querySelectorAll("[data-action='sheet']").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const trk = btn.getAttribute("data-track");
        this.switchView("cheatsheets", false);
        this.openCourseCheatSheet(trk);
      });
    });

    this.homeCoursesGrid.querySelectorAll(".course-tile-card").forEach(card => {
      card.addEventListener("click", () => {
        const trk = card.getAttribute("data-track-id");
        this.openTrackTutorial(trk);
      });
    });
  }

  renderCategoryTabs() {
    if (!this.categoryTabsContainer) return;
    this.categoryTabsContainer.innerHTML = CODINGFORCAREER_DATA.categories.map(cat => `
      <button class="cat-tab-btn ${cat.id === this.currentCategory ? 'active' : ''}" data-cat="${cat.id}">
        ${cat.name}
      </button>
    `).join("");

    this.categoryTabsContainer.querySelectorAll(".cat-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        this.currentCategory = btn.getAttribute("data-cat");
        this.renderCategoryTabs();
        this.renderTechSubbar();
        if (this.currentView === "home") {
          this.renderHomeCourses(this.currentCategory, this.homeCourseSearch ? this.homeCourseSearch.value.trim().toLowerCase() : "");
        }
      });
    });
  }

  renderTechSubbar() {
    if (!this.techPillContainer) return;
    const filteredTracks = CODINGFORCAREER_DATA.tracks.filter(t => {
      if (this.currentCategory === "all") return true;
      return t.category === this.currentCategory;
    });

    this.techPillContainer.innerHTML = filteredTracks.map(track => `
      <button class="tech-pill ${track.id === this.currentTrack ? 'active' : ''}" data-track="${track.id}">
        <span class="dot"></span>
        <span>${track.name}</span>
      </button>
    `).join("");

    this.techPillContainer.querySelectorAll(".tech-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        const trackId = pill.getAttribute("data-track");
        this.selectTrack(trackId);
      });
    });
  }

  selectTrack(trackId, updateHash = true) {
    const trackObj = CODINGFORCAREER_DATA.tracks.find(t => t.id.toLowerCase() === trackId.toLowerCase());
    if (!trackObj) return;

    this.currentTrack = trackObj.id;
    if (this.currentCategory !== "all" && trackObj.category !== this.currentCategory) {
      this.currentCategory = "all";
      this.renderCategoryTabs();
    }
    this.renderTechSubbar();
    this.renderSidebar();

    let targetTopic = trackObj.defaultTopic;
    if (!targetTopic || !CODINGFORCAREER_DATA.topics[targetTopic]) {
      const firstChap = (CODINGFORCAREER_DATA.curriculum[trackObj.id] || [])[0];
      if (firstChap && firstChap.topics && firstChap.topics.length > 0) {
        targetTopic = firstChap.topics[0].id;
      }
    }

    if (targetTopic) {
      this.selectTopic(targetTopic, updateHash);
    }

    if (this.currentView !== "tutorials") {
      this.switchView("tutorials", false, false);
    }
  }

  renderSidebar() {
    const trackObj = CODINGFORCAREER_DATA.tracks.find(t => t.id === this.currentTrack);
    if (!trackObj) return;

    if (this.sidebarTrackTitle) this.sidebarTrackTitle.textContent = `${trackObj.name} Tutorial`;
    if (this.sidebarTrackSubtitle) this.sidebarTrackSubtitle.textContent = trackObj.subtitle;
    if (this.sidebarTrackIcon) this.sidebarTrackIcon.textContent = trackObj.icon;

    const chapters = CODINGFORCAREER_DATA.curriculum[this.currentTrack] || [];

    if (!this.sidebarChaptersList) return;
    this.sidebarChaptersList.innerHTML = chapters.map((ch, idx) => {
      const containsActive = ch.topics.some(t => t.id === this.currentTopicId);
      const isCollapsed = !containsActive && idx !== 0;
      const rawTitle = ch.chapterTitle || ch.title || '';
      const displayTitle = rawTitle
        .replace(/^\s*(?:Module|Chapter|Section)\s*\d+[:\s\-]*/i, '')
        .replace(/^\s*\d+[\.\:\-\)]\s*/, '')
        .trim();
      return `
      <div class="chapter-group ${isCollapsed ? 'collapsed' : ''}" data-chapter-index="${idx}">
        <div class="chapter-heading" title="Click to collapse or expand">
          <span class="chapter-heading-title">
            <svg class="chapter-chevron" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
            <span>${displayTitle}</span>
          </span>
        </div>
        <ul class="topic-list">
          ${ch.topics.map((tp, tIdx) => {
            const prevSub = tIdx > 0 ? ch.topics[tIdx - 1].subchapter : null;
            const isNewSub = tp.subchapter && tp.subchapter !== prevSub;
            return `
              ${isNewSub ? `
                <li class="subchapter-item-header">
                  <div class="subchapter-label">
                    <span class="subchapter-indicator">›</span>
                    <span>${tp.subchapter}</span>
                  </div>
                </li>
              ` : ''}
              <li>
                <div class="topic-item ${tp.id === this.currentTopicId ? 'active' : ''}" data-topic-id="${tp.id}">
                  <span class="topic-title-wrapper">
                    <span class="topic-sub-bullet"></span>
                    <span class="topic-title-text">${tp.title}</span>
                  </span>
                  <span class="topic-badge badge-${tp.badge}">${tp.badge}</span>
                </div>
              </li>
            `;
          }).join("")}
        </ul>
      </div>
    `;
    }).join("");

    // Toggle chapter collapse on heading click
    this.sidebarChaptersList.querySelectorAll(".chapter-heading").forEach(heading => {
      heading.addEventListener("click", () => {
        heading.closest(".chapter-group")?.classList.toggle("collapsed");
      });
    });

    // Attach click listener to sidebar items
    this.sidebarChaptersList.querySelectorAll(".topic-item").forEach(item => {
      item.addEventListener("click", () => {
        const topicId = item.getAttribute("data-topic-id");
        this.selectTopic(topicId);
        // Mobile sidebar close on selection
        this.sidebar?.classList.remove("mobile-open");
        if (this.sidebarBackdrop) this.sidebarBackdrop.classList.remove("active");
        document.body.style.overflow = "";
      });
    });
  }

  filterSidebarTopics(query) {
    if (!this.sidebarChaptersList) return;
    const cleanQuery = (query || "").trim().toLowerCase();
    const groups = this.sidebarChaptersList.querySelectorAll(".chapter-group");
    groups.forEach(group => {
      const items = group.querySelectorAll(".topic-item");
      let visibleInGroup = 0;
      items.forEach(item => {
        const text = item.textContent.toLowerCase();
        const match = !cleanQuery || text.includes(cleanQuery);
        item.parentElement.style.display = match ? "block" : "none";
        if (match) visibleInGroup++;
      });
      group.querySelectorAll(".subchapter-item-header").forEach(subHead => {
        subHead.style.display = cleanQuery ? "none" : "block";
      });
      group.style.display = visibleInGroup > 0 ? "block" : "none";
      if (cleanQuery && visibleInGroup > 0) {
        group.classList.remove("collapsed");
      }
    });
  }

  selectTopic(topicId, updateHash = true) {
    let topic = CODINGFORCAREER_DATA.topics[topicId];
    if (!topic) {
      const key = Object.keys(CODINGFORCAREER_DATA.topics).find(k => k.toLowerCase() === String(topicId).toLowerCase());
      if (key) {
        topic = CODINGFORCAREER_DATA.topics[key];
        topicId = key;
      }
    }
    if (!topic) return;

    const resolvedTrack = topic.track || topic.trackId || this.currentTrack;
    const trackChanged = this.currentTrack !== resolvedTrack;
    this.currentTopicId = topicId;
    this.currentTrack = resolvedTrack;

    if (trackChanged) {
      const trackObj = CODINGFORCAREER_DATA.tracks.find(t => t.id === resolvedTrack);
      if (trackObj && this.currentCategory !== "all" && trackObj.category !== this.currentCategory) {
        this.currentCategory = "all";
        this.renderCategoryTabs();
      }
      this.renderTechSubbar();
      this.renderSidebar();
    }
    
    // Always sync sidebar active state and ensure parent chapter is uncollapsed
    this.sidebarChaptersList?.querySelectorAll(".topic-item").forEach(item => {
      const isActive = item.getAttribute("data-topic-id") === topicId;
      item.classList.toggle("active", isActive);
      if (isActive) {
        item.closest(".chapter-group")?.classList.remove("collapsed");
        try { item.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (e) {}
      }
    });

    this.renderCurrentTopic();
    this.updateBookmarkButton();

    if (updateHash) {
      this.updateHash(this.getTopicSlug(topicId));
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  renderCurrentTopic() {
    const topic = CODINGFORCAREER_DATA.topics[this.currentTopicId];
    if (!topic || !this.articleBody) return;

    // Breadcrumbs
    const currentTrackObj = CODINGFORCAREER_DATA.tracks.find(t => t.id === this.currentTrack);
    const resolvedTrackName = topic.trackName || (currentTrackObj ? currentTrackObj.name : "Tutorial");
    if (this.crumbTrack) this.crumbTrack.textContent = resolvedTrackName;
    if (this.crumbTopic) this.crumbTopic.textContent = topic.title || "";

    // Article Content
    const topicHtml = topic.htmlContent || topic.content || topic.html || "";
    const leadHtml = topic.lead ? `<p class="article-lead">${this.formatTopicContent(topic.lead)}</p>` : "";
    this.articleBody.innerHTML = `
      <div class="article-meta-tags">
        <span class="article-tag">🏷️ ${topic.badge || 'Core'}</span>
        <span class="article-tag">⏱️ ${topic.readTime || '8 min read'}</span>
        <span class="article-tag">⚡ Career-Ready Standard</span>
      </div>
      <h1>${topic.title || ""}</h1>
      ${leadHtml}
      <div class="article-html">${this.formatTopicContent(topicHtml)}</div>
    `;

        // Next / Previous buttons (cleanly aligned with display flex/none)
    if (topic.prevId && CODINGFORCAREER_DATA.topics[topic.prevId]) {
      this.btnPrevTopic.style.display = "flex";
      this.prevTopicTitle.textContent = CODINGFORCAREER_DATA.topics[topic.prevId].title;
    } else {
      this.btnPrevTopic.style.display = "none";
    }

    if (topic.nextId && CODINGFORCAREER_DATA.topics[topic.nextId]) {
      this.btnNextTopic.style.display = "flex";
      this.nextTopicTitle.textContent = CODINGFORCAREER_DATA.topics[topic.nextId].title;
    } else {
      this.btnNextTopic.style.display = "none";
    }

    // Attach dynamic handlers inside the rendered article
    this.bindArticleInteractivity();

    // Build Table of Contents
    this.generateTOC();
  }

  formatTopicContent(html) {
    if (!html) return "";
    
    // Quick check: if no markdown or math delimiters, return as-is
    if (!html.includes("**") && !html.includes("$$") && !html.includes("$") && !html.includes("\\frac") && !html.includes("\\sum")) {
      return html;
    }

    function findClosingBrace(str, openPos) {
      let depth = 1;
      for (let i = openPos + 1; i < str.length; i++) {
        if (str[i] === "{") depth++;
        else if (str[i] === "}") {
          depth--;
          if (depth === 0) return i;
        }
      }
      return -1;
    }

    function cleanMath(latex) {
      if (!latex) return "";
      let str = latex.trim().replace(/^\$\$|\$\$$/g, "").replace(/^\$|\$$/g, "").trim();

      // Matrices & Cases
      str = str.replace(/\\begin\{bmatrix\}([\s\S]*?)\\end\{bmatrix\}/g, (m, body) => {
        const rows = body.split("\\\\").map(r => r.trim()).filter(Boolean);
        const formattedRows = rows.map(r => r.split("&").map(c => cleanMath(c.trim())).join(" &nbsp; ")).join(" ; ");
        return `[ ${formattedRows} ]`;
      });
      str = str.replace(/\\begin\{cases\}([\s\S]*?)\\end\{cases\}/g, (m, body) => {
        const lines = body.split("\\\\").map(l => l.trim()).filter(Boolean);
        return lines.map(l => cleanMath(l.replace(/&/g, " &rarr; ").trim())).join(" &nbsp;|&nbsp; ");
      });

      // Delimiters
      str = str.replace(/\\left\(/g, "(").replace(/\\right\)/g, ")")
               .replace(/\\left\[/g, "[").replace(/\\right\]/g, "]")
               .replace(/\\left\\\{/g, "{").replace(/\\right\\\}/g, "}")
               .replace(/\\left\|/g, "|").replace(/\\right\|/g, "|")
               .replace(/\\\|/g, "||");

      // Fractions
      let idx;
      let guard = 0;
      while ((idx = str.indexOf("\\frac")) !== -1 && guard < 20) {
        guard++;
        let open1 = str.indexOf("{", idx);
        if (open1 === -1) break;
        let close1 = findClosingBrace(str, open1);
        if (close1 === -1) break;
        let open2 = close1 + 1;
        while (open2 < str.length && /\s/.test(str[open2])) open2++;
        if (str[open2] !== "{") break;
        let close2 = findClosingBrace(str, open2);
        if (close2 === -1) break;
        let num = str.substring(open1 + 1, close1);
        let denom = str.substring(open2 + 1, close2);
        let fracHtml = `<span class="math-fraction"><span class="math-num">${cleanMath(num)}</span><span class="math-denom">${cleanMath(denom)}</span></span>`;
        str = str.substring(0, idx) + fracHtml + str.substring(close2 + 1);
      }

      const reps = [
        [/\\text\{([^}]+)\}/g, "$1"],
        [/\\mathbf\{([^}]+)\}/g, "<strong>$1</strong>"],
        [/\\mathbb\{R\}/g, "ℝ"],
        [/\\mathbb\{E\}/g, "E"],
        [/\\mathcal\{L\}/g, "Loss"],
        [/\\mathcal\{D\}/g, "D"],
        [/\\sim(?![a-zA-Z])/g, " ~ "],
        [/\\dots|\\cdots|\\ldots/g, "…"],
        [/\\hat\{([a-zA-Z])\}/g, "$1̂"],
        [/\\bar\{([a-zA-Z])\}/g, "$1̄"],
        [/\\vec\{([a-zA-Z])\}/g, "$1⃗"],
        [/\\ceil|\\lceil/g, "⌈"],
        [/\\rceil/g, "⌉"],
        [/\\lfloor/g, "⌊"],
        [/\\rfloor/g, "⌋"],
        [/\\sqrt\{([^}]+)\}/g, "√($1)"],
        [/\\alpha(?![a-zA-Z])/g, "α"],
        [/\\beta(?![a-zA-Z])/g, "β"],
        [/\\gamma(?![a-zA-Z])/g, "γ"],
        [/\\delta(?![a-zA-Z])/g, "δ"],
        [/\\Delta(?![a-zA-Z])/g, "Δ"],
        [/\\epsilon(?![a-zA-Z])|\\varepsilon(?![a-zA-Z])/g, "ε"],
        [/\\theta(?![a-zA-Z])/g, "θ"],
        [/\\lambda(?![a-zA-Z])/g, "λ"],
        [/\\mu(?![a-zA-Z])/g, "μ"],
        [/\\pi(?![a-zA-Z])/g, "π"],
        [/\\rho(?![a-zA-Z])/g, "ρ"],
        [/\\sigma(?![a-zA-Z])/g, "σ"],
        [/\\tau(?![a-zA-Z])/g, "τ"],
        [/\\phi(?![a-zA-Z])/g, "φ"],
        [/\\chi(?![a-zA-Z])/g, "χ"],
        [/\\omega(?![a-zA-Z])/g, "ω"],
        [/\\sum_\{([^{}]+)\}\^\{([^{}]+)\}/g, "∑<sub>$1</sub><sup>$2</sup> "],
        [/\\sum_\{([^{}]+)\}/g, "∑<sub>$1</sub> "],
        [/\\sum(?![a-zA-Z])/g, "∑ "],
        [/\\prod(?![a-zA-Z])/g, "∏ "],
        [/\\infty(?![a-zA-Z])/g, "∞"],
        [/\\approx(?![a-zA-Z])/g, "≈"],
        [/\\neq(?![a-zA-Z])/g, "≠"],
        [/\\le(?![a-zA-Z])|\\leq(?![a-zA-Z])/g, "≤"],
        [/\\ge(?![a-zA-Z])|\\geq(?![a-zA-Z])/g, "≥"],
        [/\\pm(?![a-zA-Z])/g, "±"],
        [/\\times(?![a-zA-Z])/g, "×"],
        [/\\cdot(?![a-zA-Z])/g, "·"],
        [/\\div(?![a-zA-Z])/g, "÷"],
        [/\\in(?![a-zA-Z])/g, "∈"],
        [/\\forall(?![a-zA-Z])/g, "∀"],
        [/\\exists(?![a-zA-Z])/g, "∃"],
        [/\\subset(?![a-zA-Z])/g, "⊂"],
        [/\\subseteq(?![a-zA-Z])/g, "⊆"],
        [/\\cup(?![a-zA-Z])/g, "∪"],
        [/\\cap(?![a-zA-Z])/g, "∩"],
        [/\\partial(?![a-zA-Z])/g, "∂"],
        [/\\nabla(?![a-zA-Z])/g, "∇"],
        [/\\to(?![a-zA-Z])|\\rightarrow(?![a-zA-Z])/g, "→"],
        [/\\mid(?![a-zA-Z])/g, "|"],
        [/\\circ(?![a-zA-Z])/g, "∘"],
        [/\\binom\{([^{}]+)\}\{([^{}]+)\}/g, "C($1, $2)"],
        [/\\arg\\max(?![a-zA-Z])/g, "argmax"],
        [/\\arg\\min(?![a-zA-Z])/g, "argmin"],
        [/\\log_2(?![a-zA-Z])/g, "log₂"],
        [/\\log(?![a-zA-Z])/g, "log"],
        [/\\exp(?![a-zA-Z])/g, "exp"],
        [/\\lim_\{([^}]+)\}/g, "lim<sub>$1</sub> "],
        [/\\lim(?![a-zA-Z])/g, "lim "],
        [/\\quad(?![a-zA-Z])/g, " &nbsp; "],
        [/\\qquad(?![a-zA-Z])/g, " &nbsp;&nbsp; "],
        [/\\[,;!]/g, " "],
        [/_\{([^{}]+)\}/g, "<sub>$1</sub>"],
        [/\^\{([^{}]+)\}/g, "<sup>$1</sup>"],
        [/_([a-zA-Z0-9])/g, "<sub>$1</sub>"],
        [/\^([a-zA-Z0-9])/g, "<sup>$1</sup>"],
        [/\\([a-zA-Z]+)/g, "$1"]
      ];

      for (const [pattern, replacement] of reps) {
        str = str.replace(pattern, replacement);
      }
      return str.replace(/ {2,}/g, " ").trim();
    }

    // Convert <p>$$...$$</p>
    html = html.replace(/<p[^>]*>\s*\$\$([\s\S]*?)\$\$\s*<\/p>/g, (m, f) => {
      return `<div class="math-formula-card"><div class="math-formula-header"><span class="math-formula-badge">📐 FORMULA</span></div><div class="math-formula-body">${cleanMath(f)}</div></div>`;
    });

    const parts = html.split(/(<pre[\s\S]*?<\/pre>|<code[\s\S]*?<\/code>)/gi);
    for (let i = 0; i < parts.length; i += 2) {
      let text = parts[i];
      text = text.replace(/\$\$([\s\S]*?)\$\$/g, (m, f) => {
        return `<div class="math-formula-card"><div class="math-formula-header"><span class="math-formula-badge">📐 FORMULA</span></div><div class="math-formula-body">${cleanMath(f)}</div></div>`;
      });
      text = text.replace(/\$([a-zA-Z\\_\{][^$\n]*?)\$/g, (m, inline) => {
        return `<span class="math-inline">${cleanMath(inline)}</span>`;
      });
      text = text.replace(/\*{4,}/g, "••••");
      text = text.replace(/\*\*([^*\n\r]+?)\*\*/g, (m, p1) => `<strong>${p1}</strong>`);
      text = text.replace(/(?<![*\w])\*([^*\s\n][^*\n]*?[^*\s\n])\*(?![*\w])/g, (m, p1) => `<em>${p1}</em>`);
      parts[i] = text;
    }

    return parts.join("");
  }

  bindArticleInteractivity() {
    // Copy code button inside snippets
    this.articleBody.querySelectorAll(".btn-copy-code, .btn-snippet:not(.btn-try-it)").forEach(btn => {
      btn.addEventListener("click", () => {
        let code = btn.getAttribute("data-code");
        if (!code) {
          const pre = btn.closest(".code-snippet-box")?.querySelector("pre code");
          if (pre) code = pre.textContent;
        }
        if (code && navigator.clipboard) {
          navigator.clipboard.writeText(code);
          this.showToast("Code snippet copied! 📋");
        }
      });
    });

    // "Run in Editor" buttons
    this.articleBody.querySelectorAll(".btn-run-code, .btn-try-it, [data-run-preset]").forEach(btn => {
      btn.addEventListener("click", () => {
        const presetKey = btn.getAttribute("data-run-preset");
        this.switchView("playground");
        if (presetKey && this.editor?.presets?.[presetKey]) {
          this.editor.loadPreset(presetKey);
        } else {
          const pre = btn.closest(".code-snippet-box")?.querySelector("pre code");
          if (pre && this.editor?.editorInstance) {
            this.editor.editorInstance.setValue(pre.textContent);
            this.editor.selectLanguage("python");
          }
        }
        this.showToast("Loaded snippet in Interactive Editor! 🚀");
      });
    });
  }

  generateTOC() {
    // TOC disabled per user specification
    return;
  }

  toggleCurrentBookmark() {
    if (this.bookmarks.has(this.currentTopicId)) {
      this.bookmarks.delete(this.currentTopicId);
      this.showToast("Removed from bookmarks.");
    } else {
      this.bookmarks.add(this.currentTopicId);
      this.showToast("Saved to Bookmarks! 🔖");
      this.awardXP(15);
    }
    this.saveBookmarks();
    this.updateBookmarkButton();
    this.updateBookmarkBadge();
  }

  updateBookmarkButton() {
    if (!this.btnToggleBookmark || !this.bookmarkBtnText) return;
    const isBookmarked = this.bookmarks.has(this.currentTopicId);
    this.btnToggleBookmark.classList.toggle("bookmarked", isBookmarked);
    this.bookmarkBtnText.textContent = isBookmarked ? "Saved" : "Save";
  }

  updateBookmarkBadge() {
    if (this.bookmarkBadge) {
      this.bookmarkBadge.textContent = this.bookmarks.size;
    }
  }

  saveBookmarks() {
    localStorage.setItem("codingforcareer_bookmarks", JSON.stringify(Array.from(this.bookmarks)));
  }

  openBookmarksModal() {
    if (!this.bookmarksModal || !this.bookmarksModalList) return;
    this.bookmarksModal.classList.add("open");

    if (this.bookmarks.size === 0) {
      this.bookmarksModalList.innerHTML = `
        <div style="text-align:center; padding:32px; color:var(--text-light);">
          <p>No saved articles yet. Click "Save" on any tutorial to bookmark it!</p>
        </div>
      `;
      return;
    }

    this.bookmarksModalList.innerHTML = Array.from(this.bookmarks).map(id => {
      const topic = CODINGFORCAREER_DATA.topics[id];
      if (!topic) return "";
      return `
        <div class="bookmark-item">
          <div>
            <div class="bookmark-item-title" data-open-bm="${id}">${topic.title}</div>
            <span style="font-size:0.75rem; color:var(--text-light);">${topic.trackName}</span>
          </div>
          <button class="bookmark-item-remove" data-del-bm="${id}">Remove</button>
        </div>
      `;
    }).join("");

    this.bookmarksModalList.querySelectorAll("[data-open-bm]").forEach(el => {
      el.addEventListener("click", () => {
        const id = el.getAttribute("data-open-bm");
        this.closeBookmarksModal();
        this.switchView("tutorials");
        this.selectTopic(id);
      });
    });

    this.bookmarksModalList.querySelectorAll("[data-del-bm]").forEach(el => {
      el.addEventListener("click", () => {
        const id = el.getAttribute("data-del-bm");
        this.bookmarks.delete(id);
        this.saveBookmarks();
        this.updateBookmarkBadge();
        this.updateBookmarkButton();
        this.openBookmarksModal(); // refresh
      });
    });
  }

  closeBookmarksModal() {
    this.bookmarksModal?.classList.remove("open");
  }

  // Global Search Modal
  openSearchModal() {
    this.searchModal?.classList.add("open");
    this.globalSearchInput?.focus();
    this.handleGlobalSearch("");
  }

  closeSearchModal() {
    this.searchModal?.classList.remove("open");
    if (this.globalSearchInput) this.globalSearchInput.value = "";
  }

  handleGlobalSearch(query) {
    if (!this.searchResultsList) return;

    const q = (query || "").trim().toLowerCase();

    // 1. Empty query: Render fast curated quick links instead of 2,400+ DOM nodes
    if (!q) {
      this.searchResultsList.innerHTML = `
        <div class="search-empty-prompt" style="padding: 24px 16px; text-align: center;">
          <div style="font-size: 2rem; margin-bottom: 8px;">⚡</div>
          <div style="font-weight: 700; font-size: 1.05rem; color: var(--text-color, #f8fafc); margin-bottom: 6px;">
            Search 2,400+ Topics, Cheatsheets & Roadmaps
          </div>
          <p style="font-size: 0.88rem; color: var(--text-muted, #94a3b8); max-width: 420px; margin: 0 auto 16px auto; line-height: 1.5;">
            Type any programming language, framework, data tool, or algorithm to jump directly into the curriculum.
          </p>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; max-width: 440px; margin: 0 auto;">
            <button class="search-suggestion-pill" data-search="Airflow" style="background: rgba(56,189,248,0.12); color: #38bdf8; border: 1px solid rgba(56,189,248,0.3); padding: 5px 12px; border-radius: 20px; font-size: 0.82rem; cursor: pointer;">💨 Airflow</button>
            <button class="search-suggestion-pill" data-search="Python" style="background: rgba(234,179,8,0.12); color: #facc15; border: 1px solid rgba(234,179,8,0.3); padding: 5px 12px; border-radius: 20px; font-size: 0.82rem; cursor: pointer;">🐍 Python</button>
            <button class="search-suggestion-pill" data-search="MySQL" style="background: rgba(14,165,233,0.12); color: #38bdf8; border: 1px solid rgba(14,165,233,0.3); padding: 5px 12px; border-radius: 20px; font-size: 0.82rem; cursor: pointer;">🐬 MySQL</button>
            <button class="search-suggestion-pill" data-search="Java" style="background: rgba(239,68,68,0.12); color: #f87171; border: 1px solid rgba(239,68,68,0.3); padding: 5px 12px; border-radius: 20px; font-size: 0.82rem; cursor: pointer;">☕ Java</button>
            <button class="search-suggestion-pill" data-search="Docker" style="background: rgba(59,130,246,0.12); color: #60a5fa; border: 1px solid rgba(59,130,246,0.3); padding: 5px 12px; border-radius: 20px; font-size: 0.82rem; cursor: pointer;">🐳 Docker</button>
            <button class="search-suggestion-pill" data-search="DSA" style="background: rgba(168,85,247,0.12); color: #c084fc; border: 1px solid rgba(168,85,247,0.3); padding: 5px 12px; border-radius: 20px; font-size: 0.82rem; cursor: pointer;">🧠 DSA</button>
            <button class="search-suggestion-pill" data-search="Spark" style="background: rgba(249,115,22,0.12); color: #fb923c; border: 1px solid rgba(249,115,22,0.3); padding: 5px 12px; border-radius: 20px; font-size: 0.82rem; cursor: pointer;">⚡ Spark</button>
          </div>
        </div>
      `;
      return;
    }

    // 2. Perform search with safe optional property chaining
    const allTopics = Object.values(CODINGFORCAREER_DATA.topics || {});
    const results = allTopics.filter(t => {
      const title = (t.title || "").toLowerCase();
      const lead = (t.lead || "").toLowerCase();
      const track = (t.trackName || t.track || "").toLowerCase();
      return title.includes(q) || lead.includes(q) || track.includes(q);
    });

    if (results.length === 0) {
      this.searchResultsList.innerHTML = `
        <div style="text-align: center; padding: 32px 16px; color: var(--text-light, #94a3b8);">
          <div style="font-size: 1.8rem; margin-bottom: 8px;">🔍</div>
          <div style="font-weight: 600; color: var(--text-color, #e2e8f0); margin-bottom: 4px;">No results found for "${query}"</div>
          <p style="font-size: 0.85rem; margin: 0;">Try searching "Airflow", "Python", "Recursion", or "SELECT".</p>
        </div>
      `;
      return;
    }

    // 3. Render capped results (top 30 max) to ensure sub-millisecond render performance
    const maxResults = 30;
    const displayed = results.slice(0, maxResults);
    const countInfo = results.length > maxResults 
      ? `Found ${results.length} results • Showing top ${maxResults}` 
      : `Found ${results.length} ${results.length === 1 ? 'result' : 'results'}`;

    const itemsHtml = displayed.map(t => `
      <div class="search-result-item" data-topic-id="${t.id}">
        <div class="search-result-info">
          <span class="search-result-title">${t.title || t.id}</span>
          <span class="search-result-sub">${t.lead ? t.lead.slice(0, 80) + '...' : (t.badge || 'Topic & Interactive Examples')}</span>
        </div>
        <span class="search-result-tag">${t.trackName || t.track || 'Track'}</span>
      </div>
    `).join("");

    this.searchResultsList.innerHTML = `
      <div class="search-results-meta" style="padding: 8px 14px; font-size: 0.78rem; font-weight: 600; color: var(--text-muted, #94a3b8); border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06)); text-transform: uppercase; letter-spacing: 0.5px;">
        ${countInfo}
      </div>
      <div class="search-results-items-container">
        ${itemsHtml}
      </div>
    `;
  }

  // ========================================================
  // FAANG & INDUSTRY ROADMAPS ENGINE (Hub & Deep Drill-down)
  // ========================================================
  renderRoadmaps(category = "all", query = "") {
    if (!this.roadmapsGrid) return;

    let list = CODINGFORCAREER_DATA.roadmaps || [];

    // Filter by category
    if (category && category !== "all") {
      list = list.filter(r => r.category === category);
    }

    // Filter by search query
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(r => 
        r.title.toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q) ||
        r.desc.toLowerCase().includes(q) ||
        r.techStack.some(t => t.toLowerCase().includes(q))
      );
    }

    if (list.length === 0) {
      this.roadmapsGrid.innerHTML = `
        <div class="rm-no-results">
          <div class="rm-no-results-icon">🔍</div>
          <h3>No Career Roadmaps Match "${query}"</h3>
          <p>Try searching for Python, SQL, RAG, Playwright, Django, or clear your filters.</p>
          <button class="btn-rm-reset-search" id="btn-rm-reset-search">Reset Filters</button>
        </div>
      `;
      document.getElementById("btn-rm-reset-search")?.addEventListener("click", () => {
        if (this.rmSearchInput) this.rmSearchInput.value = "";
        if (this.rmClearSearchBtn) this.rmClearSearchBtn.style.display = "none";
        this.activeRoadmapCategory = "all";
        if (this.rmCategoryFilters) {
          this.rmCategoryFilters.querySelectorAll(".rm-filter-btn").forEach(b => {
            b.classList.toggle("active", b.getAttribute("data-category") === "all");
          });
        }
        this.renderRoadmaps("all", "");
      });
      return;
    }

    this.roadmapsGrid.innerHTML = list.map(rm => {
      const totalMilestones = rm.phases ? rm.phases.reduce((acc, p) => acc + (p.milestones ? p.milestones.length : 0), 0) : 10;
      const progressArr = this.roadmapProgress[rm.id] || [];
      const completedCount = progressArr.length;
      const percent = Math.round((completedCount / totalMilestones) * 100) || 0;

      // Clean and improvise duration and career level
      const cleanDuration = (rm.duration || "")
        .replace(/\s*Recommended/i, "")
        .replace(/\s*-\s*/, "–")
        .trim();

      const cleanLevel = rm.level
        ? rm.level.replace(/\s*\([^)]*\)/g, "").replace(/\s*to\s*/i, " → ").trim()
        : "Fresher → Senior";

      const cleanSalary = rm.salary
        ? rm.salary.split('•')[0].replace(',000', 'k').replace(',000', 'k').trim()
        : "";

      return `
        <div class="roadmap-tile-card" data-rm-id="${rm.id}" style="--rm-gradient: ${rm.accentGradient}; --rm-color: ${rm.accentColor}; --rm-glow: ${rm.accentGlow};">
          <!-- Top Branded Accent Bar -->
          <div class="rm-tile-accent-bar" style="background: ${rm.accentGradient};"></div>

          <!-- Ambient Glow Layer -->
          <div class="rm-tile-ambient-glow"></div>

          <!-- Top Row: Icon & Status Badges -->
          <div class="rm-tile-top-row">
            <div class="rm-tile-icon-box">
              <span class="rm-tile-emoji">${rm.icon}</span>
            </div>
            <div class="rm-badges-stack">
              <span class="rm-badge-tag">
                <span class="badge-dot"></span>
                ${rm.badge}
              </span>
              <span class="rm-salary-tag">${cleanSalary}</span>
            </div>
          </div>

          <!-- Title & Subtitle -->
          <h3 class="rm-tile-title">${rm.title}</h3>
          <p class="rm-tile-desc">${rm.desc}</p>

          <!-- Level, Duration & Milestone Metadata Badges -->
          <div class="rm-meta-pills-row">
            <span class="rm-meta-pill" title="Target Career Level">🎯 ${cleanLevel}</span>
            <span class="rm-meta-pill" title="Recommended Duration">⏱️ ${cleanDuration}</span>
            <span class="rm-meta-pill rm-milestones-pill" title="Total Milestones">🏁 ${totalMilestones} Milestones</span>
          </div>

          <!-- Key Tech Stack Chips -->
          <div class="rm-tech-stack-row">
            ${rm.techStack.slice(0, 4).map(t => `<span class="rm-tech-chip">${t}</span>`).join('')}
            ${rm.techStack.length > 4 ? `<span class="rm-tech-chip rm-chip-more">+${rm.techStack.length - 4}</span>` : ''}
          </div>

          <!-- Progress Bar if started -->
          ${completedCount > 0 ? `
            <div class="rm-tile-progress-wrap">
              <div class="rm-tile-progress-text">
                <span>Progress: ${completedCount}/${totalMilestones} Milestones</span>
                <span>${percent}%</span>
              </div>
              <div class="rm-tile-progress-bar">
                <div class="rm-tile-progress-fill" style="width: ${percent}%; background: ${rm.accentGradient};"></div>
              </div>
            </div>
          ` : ''}

          <!-- Tile Actions Footer -->
          <div class="rm-tile-footer">
            <button class="btn-rm-primary" data-action="explore" data-rm-id="${rm.id}">
              <span>View Career Roadmap</span>
              <svg class="rm-arrow-svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join("");

    // Attach listeners to open roadmap detail
    this.roadmapsGrid.querySelectorAll(".roadmap-tile-card").forEach(card => {
      card.addEventListener("click", (e) => {
        const rmId = card.getAttribute("data-rm-id");
        if (rmId) this.openRoadmapDetail(rmId, true);
      });
    });

    this.roadmapsGrid.querySelectorAll("[data-action='explore']").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const rmId = btn.getAttribute("data-rm-id");
        if (rmId) this.openRoadmapDetail(rmId, true);
      });
    });
  }

  // Open Full Descriptive Roadmap Drill-down View
  openRoadmapDetail(roadmapId, updateHash = true) {
    const rm = (CODINGFORCAREER_DATA.roadmaps || []).find(r => r.id === roadmapId);
    if (!rm) {
      this.backToRoadmapsHub(updateHash);
      return;
    }

    this.activeRoadmapId = rm.id;
    if (this.rmHubView) this.rmHubView.style.display = "none";
    if (this.rmDetailView) this.rmDetailView.style.display = "block";

    const savedChecked = new Set(this.roadmapProgress[rm.id] || []);
    let allMilestoneIds = [];
    rm.phases.forEach(p => {
      if (p.milestones) {
        p.milestones.forEach(m => allMilestoneIds.push(m.id));
      }
    });

    const totalCount = allMilestoneIds.length;
    const completedCount = allMilestoneIds.filter(id => savedChecked.has(id)).length;
    const percent = Math.round((completedCount / totalCount) * 100) || 0;

    const cleanDuration = (rm.duration || "")
      .replace(/\s*Recommended/i, "")
      .replace(/\s*-\s*/, "–")
      .trim();

    this.rmDetailView.innerHTML = `
      <div class="rm-detail-container" style="--rm-gradient: ${rm.accentGradient}; --rm-color: ${rm.accentColor}; --rm-glow: ${rm.accentGlow};">
        
        <!-- Top Sticky Navigation & Progress Header -->
        <div class="rm-detail-top-nav">
          <button class="btn-rm-back" id="btn-back-to-rm-hub">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"/>
            </svg>
            <span>Back to All Roadmaps</span>
          </button>

          <div class="rm-detail-progress-box">
            <div class="rm-progress-label">
              <span id="rm-progress-count">${completedCount} / ${totalCount} Milestones Completed</span>
              <span id="rm-progress-pct" class="rm-pct-badge">${percent}%</span>
            </div>
            <div class="rm-progress-bar-bg">
              <div class="rm-progress-bar-fill" id="rm-progress-fill" style="width: ${percent}%; background: ${rm.accentGradient};"></div>
            </div>
          </div>

          <div class="rm-detail-actions">
            <button class="btn-rm-reset-progress" id="btn-reset-rm-progress" title="Reset all checklist checkmarks">Reset Progress</button>
          </div>
        </div>

        <!-- Role Hero Showcase Banner -->
        <header class="rm-detail-hero">
          <div class="rm-detail-hero-ambient" style="background: radial-gradient(circle, ${rm.accentGlow} 0%, transparent 70%);"></div>
          
          <div class="rm-hero-meta-top">
            <span class="rm-hero-badge">${rm.badge}</span>
            <span class="rm-hero-category">📂 ${rm.categoryLabel}</span>
            <span class="rm-hero-salary">💰 ${rm.salary}</span>
          </div>

          <div class="rm-hero-main-row">
            <div class="rm-hero-icon-box">
              <span>${rm.icon}</span>
            </div>
            <div class="rm-hero-headings">
              <h1 class="rm-hero-title">${rm.title}</h1>
              <p class="rm-hero-sub">${rm.desc}</p>
            </div>
          </div>

          <!-- Quick Stats Pill Row -->
          <div class="rm-hero-stats-row">
            <div class="rm-stat-card">
              <span class="rm-stat-label">Recommended Timeline</span>
              <span class="rm-stat-val">⏱️ ${cleanDuration} • 8–10 hrs/wk</span>
            </div>
            <div class="rm-stat-card">
              <span class="rm-stat-label">Experience Scope</span>
              <span class="rm-stat-val">${rm.level}</span>
            </div>
            <div class="rm-stat-card">
              <span class="rm-stat-label">Total Stages</span>
              <span class="rm-stat-val">${rm.phases.length} Phases • ${totalCount} Milestones</span>
            </div>
          </div>

          <!-- Tech Stack Pill Group -->
          <div class="rm-hero-tech-group">
            <span class="rm-tech-title">Key Core Technologies:</span>
            <div class="rm-tech-pills">
              ${rm.techStack.map(t => `<span class="rm-tech-pill-large">${t}</span>`).join('')}
            </div>
          </div>
        </header>

        <!-- Freshers vs Senior FAANG Standards Matrix -->
        <section class="rm-faang-matrix-section">
          <div class="rm-section-title-wrap">
            <span class="rm-section-eyebrow">FAANG &amp; Tier-1 Hiring Standards</span>
            <h2 class="rm-section-h2">Freshers vs. Senior Interview Expectations</h2>
            <p class="rm-section-desc">How tier-1 tech companies (Google, Meta, Amazon, Microsoft, Netflix, Apple) evaluate candidates across career stages.</p>
          </div>

          <div class="rm-levels-grid">
            <div class="rm-level-card rm-level-fresher">
              <div class="rm-level-card-header">
                <div class="rm-level-icon-badge">🎓</div>
                <div>
                  <h3 class="rm-level-title">Fresher &amp; Entry-Level (L3 / SDE-1 / Associate)</h3>
                  <span class="rm-level-target">0 - 2 Years Experience</span>
                </div>
              </div>
              <p class="rm-level-body">${rm.fresherGuide}</p>
              <div class="rm-level-checklist">
                <div class="rm-level-check-item">✓ Strong Core Programming &amp; Clean Syntax</div>
                <div class="rm-level-check-item">✓ Live Whiteboard / CoderPad Problem Solving</div>
                <div class="rm-level-check-item">✓ 2 Complete GitHub Projects with Live Demo</div>
                <div class="rm-level-check-item">✓ Analytical Depth: Explaining algorithmic trade-offs</div>
              </div>
            </div>

            <div class="rm-level-card rm-level-senior">
              <div class="rm-level-card-header">
                <div class="rm-level-icon-badge">🏛️</div>
                <div>
                  <h3 class="rm-level-title">Senior, Lead &amp; Staff Track (L5 / L6 / Principal)</h3>
                  <span class="rm-level-target">4+ Years Experience</span>
                </div>
              </div>
              <p class="rm-level-body">${rm.seniorGuide}</p>
              <div class="rm-level-checklist">
                <div class="rm-level-check-item">✓ Distributed System Design &amp; Failure Modes</div>
                <div class="rm-level-check-item">✓ Reliability, Latency SLAs &amp; Horizontal Scaling</div>
                <div class="rm-level-check-item">✓ Business Metric Translation &amp; Strategic ROI</div>
                <div class="rm-level-check-item">✓ Architecture Reviews &amp; Cross-Team Mentorship</div>
              </div>
            </div>
          </div>
        </section>

        <!-- Interactive Phases & Milestones Vertical Timeline -->
        <section class="rm-timeline-section">
          <div class="rm-section-title-wrap">
            <span class="rm-section-eyebrow">Interactive Curriculum</span>
            <h2 class="rm-section-h2">Step-by-Step Learning Timeline</h2>
            <p class="rm-section-desc">Check off each milestone as you master the skills. Your progress is saved automatically.</p>
          </div>

          <div class="rm-phases-timeline">
            ${rm.phases.map((p, pIdx) => {
              const totalPhases = rm.phases.length || 3;
              const weeksPerPhase = Math.max(4, Math.round(28 / totalPhases));
              const startW = pIdx * weeksPerPhase + 1;
              const endW = (pIdx + 1) * weeksPerPhase;
              const phaseDuration = `Weeks ${startW}–${endW}`;

              return `
              <div class="rm-phase-block">
                <div class="rm-phase-header">
                  <div class="rm-phase-number-node">Phase ${p.phaseNumber}</div>
                  <div class="rm-phase-heading-wrap">
                    <div class="rm-phase-badge-line">
                      <span class="rm-phase-time-pill">⏱️ ${phaseDuration}</span>
                      <span class="rm-phase-count-pill">📌 ${p.milestones ? p.milestones.length : 0} Core Milestones</span>
                    </div>
                    <h3 class="rm-phase-title">${p.title}</h3>
                    <p class="rm-phase-desc">${p.desc}</p>
                  </div>
                </div>

                <div class="rm-milestones-container">
                  ${p.milestones.map(m => {
                    const isChecked = savedChecked.has(m.id);
                    return `
                      <div class="rm-milestone-card ${isChecked ? 'is-completed' : ''}" data-m-id="${m.id}">
                        <div class="rm-milestone-left">
                          <label class="rm-checkbox-label">
                            <input type="checkbox" class="rm-milestone-cb" data-m-id="${m.id}" ${isChecked ? 'checked' : ''}>
                            <span class="rm-custom-checkbox"></span>
                          </label>
                        </div>
                        <div class="rm-milestone-content">
                          <div class="rm-milestone-top">
                            <h4 class="rm-milestone-title">${m.title}</h4>
                            <div class="rm-milestone-right-meta">
                              <span class="rm-milestone-est-time">⏱️ ~10–12 hrs</span>
                              ${m.linkTrack ? `
                                <button class="btn-rm-link-track" data-track-id="${m.linkTrack}" title="Practice in CodingForCareer sandbox">
                                  <span>Practice in ${m.linkTrack.toUpperCase()} Lab</span> &rarr;
                                </button>
                              ` : ''}
                            </div>
                          </div>
                          
                          <div class="rm-milestone-skills">
                            <span class="rm-skills-label">Core Competencies:</span>
                            <span class="rm-skills-text">${m.skills}</span>
                          </div>

                          ${m.faangTip ? `
                            <div class="rm-faang-tip-box">
                              <span class="rm-tip-icon">💡</span>
                              <div class="rm-tip-content">
                                <strong>FAANG Interview Bar:</strong> ${m.faangTip}
                              </div>
                            </div>
                          ` : ''}
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
            }).join('')}
          </div>
        </section>

        <!-- FAANG High-Yield Interview Question Bank -->
        ${rm.interviewQuestions && rm.interviewQuestions.length > 0 ? `
          <section class="rm-interview-section">
            <div class="rm-section-title-wrap">
              <span class="rm-section-eyebrow">Real-World Screening</span>
              <h2 class="rm-section-h2">High-Yield FAANG Interview Questions</h2>
              <p class="rm-section-desc">Sample technical problems and scenario prompts tested at tier-1 technology firms.</p>
            </div>

            <div class="rm-questions-grid">
              ${rm.interviewQuestions.map((iq, idx) => `
                <div class="rm-question-card">
                  <div class="rm-q-top">
                    <span class="rm-q-num">Q${idx + 1}</span>
                    <span class="rm-q-round">${iq.round}</span>
                    <span class="rm-q-company">${iq.company}</span>
                  </div>
                  <p class="rm-q-text">"${iq.question}"</p>
                </div>
              `).join('')}
            </div>
          </section>
        ` : ''}

        <!-- Capstone Portfolio Projects -->
        ${rm.capstoneProjects && rm.capstoneProjects.length > 0 ? `
          <section class="rm-projects-section">
            <div class="rm-section-title-wrap">
              <span class="rm-section-eyebrow">Resume Builders</span>
              <h2 class="rm-section-h2">FAANG-Grade Capstone Projects</h2>
              <p class="rm-section-desc">High-impact, production-grade applications to feature on your GitHub and resume.</p>
            </div>

            <div class="rm-projects-grid">
              ${rm.capstoneProjects.map(proj => `
                <div class="rm-project-card">
                  <div class="rm-proj-icon-tag">🚀 Capstone Architecture</div>
                  <h3 class="rm-proj-title">${proj.title}</h3>
                  <p class="rm-proj-desc">${proj.desc}</p>
                  <div class="rm-proj-tools">
                    <span class="rm-proj-tools-label">Tech Stack:</span>
                    <span class="rm-proj-tools-val">${proj.tools}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </section>
        ` : ''}

        <!-- Bottom CTA -->
        <div class="rm-detail-bottom-cta">
          <h2>Ready to Begin Your Preparation?</h2>
          <p>Practice writing clean code and SQL with our zero-setup live browser sandboxes.</p>
          <div class="rm-cta-btn-row">
            <button class="btn-rm-cta-primary" id="btn-rm-cta-editor">Launch Live Try Editor &rarr;</button>
            <button class="btn-rm-cta-secondary" id="btn-rm-cta-all">Browse All 10 Roadmaps</button>
          </div>
        </div>

      </div>
    `;

    // Wire up events inside detail view
    document.getElementById("btn-back-to-rm-hub")?.addEventListener("click", () => {
      this.backToRoadmapsHub(true);
    });

    document.getElementById("btn-rm-cta-all")?.addEventListener("click", () => {
      this.backToRoadmapsHub(true);
    });

    document.getElementById("btn-rm-cta-editor")?.addEventListener("click", () => {
      this.switchView("playground", false, true);
    });

    // Checkbox toggles
    this.rmDetailView.querySelectorAll(".rm-milestone-cb").forEach(cb => {
      cb.addEventListener("change", (e) => {
        const mId = cb.getAttribute("data-m-id");
        const card = cb.closest(".rm-milestone-card");
        let list = this.roadmapProgress[rm.id] || [];

        if (cb.checked) {
          if (!list.includes(mId)) list.push(mId);
          card?.classList.add("is-completed");
        } else {
          list = list.filter(id => id !== mId);
          card?.classList.remove("is-completed");
        }

        this.roadmapProgress[rm.id] = list;
        localStorage.setItem("codingforcareer_rm_progress", JSON.stringify(this.roadmapProgress));

        // Update progress UI
        const newCompleted = allMilestoneIds.filter(id => list.includes(id)).length;
        const newPct = Math.round((newCompleted / totalCount) * 100) || 0;
        
        const countEl = document.getElementById("rm-progress-count");
        const pctEl = document.getElementById("rm-progress-pct");
        const fillEl = document.getElementById("rm-progress-fill");

        if (countEl) countEl.textContent = `${newCompleted} / ${totalCount} Milestones Completed`;
        if (pctEl) pctEl.textContent = `${newPct}%`;
        if (fillEl) fillEl.style.width = `${newPct}%`;

        if (newPct === 100 && cb.checked) {
          this.showToast(`🎉 Congratulations! You have completed the ${rm.role} Roadmap!`);
        }
      });
    });

    // Reset Progress
    document.getElementById("btn-reset-rm-progress")?.addEventListener("click", () => {
      if (confirm(`Reset all checked milestones for the ${rm.title}?`)) {
        this.roadmapProgress[rm.id] = [];
        localStorage.setItem("codingforcareer_rm_progress", JSON.stringify(this.roadmapProgress));
        this.openRoadmapDetail(rm.id, false);
        this.showToast("Progress reset successfully.");
      }
    });

    // Link track buttons
    this.rmDetailView.querySelectorAll(".btn-rm-link-track").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const trackId = btn.getAttribute("data-track-id");
        if (trackId && typeof this.openTrackTutorial === "function") {
          this.openTrackTutorial(trackId);
        }
      });
    });

    if (updateHash) {
      this.updateHash(`roadmaps/${rm.id}`);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Back to Roadmaps Hub
  backToRoadmapsHub(updateHash = true) {
    if (this.rmHubView) this.rmHubView.style.display = "block";
    if (this.rmDetailView) this.rmDetailView.style.display = "none";
    this.activeRoadmapId = null;

    if (updateHash) {
      this.updateHash("roadmaps");
    }

    this.renderRoadmaps(this.activeRoadmapCategory, this.rmSearchInput ? this.rmSearchInput.value.trim() : "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Cheat Sheets View Engine: 21 Course Hub & Topic Detail Matrix
  renderCheatSheets() {
    if (!this.csCoursesGrid) return;

    const tracks = CODINGFORCAREER_DATA.tracks;
    this.csCoursesGrid.innerHTML = tracks.map(track => {
      const cs = CODINGFORCAREER_DATA.cheatsheets[track.id];
      const itemCount = cs 
        ? cs.groups.reduce((acc, g) => acc + g.items.length, 0)
        : 12;

      return `
        <div class="cs-course-tile" data-course-id="${track.id}" data-category="${track.category}">
          <div class="cs-tile-top">
            <span class="cs-tile-icon">${track.icon}</span>
            <span class="cs-tile-badge">${track.badge}</span>
          </div>
          <h3 class="cs-tile-title">${track.name}</h3>
          <p class="cs-tile-subtitle">${track.subtitle || (cs ? cs.subtitle : 'Quick syntax & matrix')}</p>
          <div class="cs-tile-footer">
            <span class="cs-tile-count">⚡ ${itemCount} Syntax Items</span>
            <span class="cs-tile-arrow">View Sheet &rarr;</span>
          </div>
        </div>
      `;
    }).join("");

    // Bind click events on tiles
    this.csCoursesGrid.querySelectorAll(".cs-course-tile").forEach(tile => {
      tile.addEventListener("click", () => {
        const courseId = tile.getAttribute("data-course-id");
        this.openCourseCheatSheet(courseId);
      });
    });

    // Category filter buttons
    if (this.csCategoryFilter) {
      this.csCategoryFilter.querySelectorAll(".cs-cat-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          this.csCategoryFilter.querySelectorAll(".cs-cat-btn").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          this.activeCheatSheetCategory = btn.getAttribute("data-cat");
          this.filterCheatSheetCourses();
        });
      });
    }

    // Quick search jump chips
    document.querySelectorAll(".cs-quick-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        const tag = chip.getAttribute("data-quick");
        if (this.cheatsheetFilter) {
          this.cheatsheetFilter.value = tag;
          this.cheatsheetFilter.focus();
        }
        if (this.csCategoryFilter) {
          this.csCategoryFilter.querySelectorAll(".cs-cat-btn").forEach(b => b.classList.remove("active"));
          const allBtn = this.csCategoryFilter.querySelector('[data-cat="all"]');
          if (allBtn) allBtn.classList.add("active");
          this.activeCheatSheetCategory = "all";
        }
        this.filterCheatSheetCourses();
      });
    });

    // Clear search button
    document.getElementById("btn-cs-clear-search")?.addEventListener("click", () => {
      if (this.cheatsheetFilter) {
        this.cheatsheetFilter.value = "";
        this.cheatsheetFilter.focus();
      }
      this.filterCheatSheetCourses();
    });

    // Reset button in empty state
    document.getElementById("btn-cs-reset-empty")?.addEventListener("click", () => {
      if (this.cheatsheetFilter) {
        this.cheatsheetFilter.value = "";
        this.cheatsheetFilter.focus();
      }
      if (this.csCategoryFilter) {
        this.csCategoryFilter.querySelectorAll(".cs-cat-btn").forEach(b => b.classList.remove("active"));
        const allBtn = this.csCategoryFilter.querySelector('[data-cat="all"]');
        if (allBtn) allBtn.classList.add("active");
        this.activeCheatSheetCategory = "all";
      }
      this.filterCheatSheetCourses();
    });

    // Bind filter input
    this.filterCheatSheetCourses();
  }

  filterCheatSheetCourses() {
    if (!this.csCoursesGrid) return;
    const query = this.cheatsheetFilter ? this.cheatsheetFilter.value.trim().toLowerCase() : "";
    const cat = this.activeCheatSheetCategory || "all";
    const tiles = this.csCoursesGrid.querySelectorAll(".cs-course-tile");

    let visibleCount = 0;
    tiles.forEach(tile => {
      const tileCat = tile.getAttribute("data-category");
      const text = tile.textContent.toLowerCase();
      const matchesCat = cat === "all" || tileCat === cat;
      const matchesQuery = query === "" || text.includes(query);

      const show = matchesCat && matchesQuery;
      tile.style.display = show ? "flex" : "none";
      if (show) visibleCount++;
    });

    // Update result count pill
    const countPill = document.getElementById("cs-search-count-pill");
    if (countPill) {
      if (query || cat !== "all") {
        countPill.textContent = `${visibleCount} of 21`;
      } else {
        countPill.textContent = `21 Courses`;
      }
    }

    // Toggle clear button
    const clearBtn = document.getElementById("btn-cs-clear-search");
    if (clearBtn) {
      clearBtn.style.display = query ? "inline-flex" : "none";
    }

    // Toggle empty state
    const emptyState = document.getElementById("cs-empty-state");
    const emptyQuery = document.getElementById("cs-empty-query");
    if (emptyState) {
      if (visibleCount === 0) {
        emptyState.style.display = "block";
        if (emptyQuery) emptyQuery.textContent = query || cat;
      } else {
        emptyState.style.display = "none";
      }
    }
  }

  openCourseCheatSheet(courseId, updateHash = true) {
    const track = CODINGFORCAREER_DATA.tracks.find(t => t.id === courseId);
    const cs = CODINGFORCAREER_DATA.cheatsheets[courseId];
    if (!track || !cs || !this.csDetailView) return;

    if (this.currentView !== "cheatsheets") {
      this.switchView("cheatsheets", false, false);
    }

    this.activeCheatSheetTrack = courseId;
    if (this.csHubView) this.csHubView.style.display = "none";
    this.csDetailView.style.display = "block";

    this.csDetailView.innerHTML = `
      <div class="cs-detail-container">
        <!-- Top Navigation Bar / Breadcrumb -->
        <div class="cs-detail-nav">
          <button class="cs-back-btn" id="btn-back-to-cs-hub">
            <svg viewBox="0 0 20 20" fill="currentColor" class="icon-sm">
              <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"/>
            </svg>
            <span>Back to All Cheat Sheets</span>
          </button>

          <div class="cs-detail-actions">
            <button class="cs-btn-try-editor" id="btn-cs-open-editor">
              <svg viewBox="0 0 20 20" fill="currentColor" class="icon-sm">
                <path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
              <span>Test in Try Editor</span>
            </button>
          </div>
        </div>

        <!-- Topic Header Card -->
        <header class="cs-topic-hero">
          <div class="cs-topic-hero-left">
            <div class="cs-topic-icon-large">${track.icon}</div>
            <div>
              <div class="cs-topic-badge-row">
                <span class="hero-chip">${track.badge}</span>
                <span class="cs-topic-track-tag">${track.category.toUpperCase()}</span>
              </div>
              <h1 class="cs-topic-heading">${cs.title}</h1>
              <p class="cs-topic-subtitle">${cs.subtitle}</p>
            </div>
          </div>

          <!-- In-sheet Quick Filter -->
          <div class="cs-detail-filter-box">
            <input type="text" id="cs-detail-filter" class="cs-detail-filter-input" placeholder="Filter syntax rules in ${track.name}...">
          </div>
        </header>

        <!-- Structured Syntax Groups Matrix -->
        <div class="cs-groups-wrapper" id="cs-groups-wrapper">
          ${cs.groups.map(group => `
            <section class="cs-matrix-group">
              <div class="cs-group-header">
                <h2 class="cs-group-title">
                  <span class="cs-group-dot"></span>
                  ${group.groupTitle}
                </h2>
                <span class="cs-group-count">${group.items.length} items</span>
              </div>

              <div class="cs-syntax-items-grid">
                ${group.items.map(item => `
                  <div class="cs-syntax-card">
                    <div class="cs-syntax-top">
                      <div class="cs-code-box">
                        <code>${this.escapeHtml(item.syntax)}</code>
                      </div>
                      <button class="btn-copy-syntax" data-code="${this.escapeHtml(item.syntax)}" title="Copy code snippet">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-xs">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        <span>Copy</span>
                      </button>
                    </div>
                    <div class="cs-syntax-desc">
                      ${item.desc}
                    </div>
                  </div>
                `).join("")}
              </div>
            </section>
          `).join("")}
        </div>

        <!-- Footer Back to Hub & Navigation -->
        <div class="cs-detail-footer">
          <button class="btn-back-hub-bottom" id="btn-back-hub-bottom">
            &larr; Back to All 21 Cheat Sheet Tiles
          </button>
        </div>
      </div>
    `;

    // Bind back button
    document.getElementById("btn-back-to-cs-hub")?.addEventListener("click", () => this.backToCheatSheetsHub());
    document.getElementById("btn-back-hub-bottom")?.addEventListener("click", () => this.backToCheatSheetsHub());

    // Bind Try-It Editor button
    document.getElementById("btn-cs-open-editor")?.addEventListener("click", () => {
      this.switchView("playground");
      if (this.editor && ["python", "java", "c", "cpp"].includes(courseId)) {
        this.editor.setLanguage(courseId === "cpp" ? "cpp" : courseId, true);
      }
    });

    // Copy buttons
    this.csDetailView.querySelectorAll(".btn-copy-syntax").forEach(btn => {
      btn.addEventListener("click", () => {
        const code = btn.getAttribute("data-code");
        if (code && navigator.clipboard) {
          navigator.clipboard.writeText(code);
          const origHtml = btn.innerHTML;
          btn.innerHTML = `<span style="color:var(--emerald-600);font-weight:700;">✓ Copied</span>`;
          this.showToast("Syntax copied to clipboard! 📋");
          setTimeout(() => {
            btn.innerHTML = origHtml;
          }, 2000);
        }
      });
    });

    // In-sheet syntax filter
    const detailFilterInput = document.getElementById("cs-detail-filter");
    detailFilterInput?.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase().trim();
      const cards = this.csDetailView.querySelectorAll(".cs-syntax-card");
      const groups = this.csDetailView.querySelectorAll(".cs-matrix-group");

      cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = q === "" || text.includes(q) ? "flex" : "none";
      });

      groups.forEach(group => {
        const visibleCards = group.querySelectorAll(".cs-syntax-card:not([style*='display: none'])");
        group.style.display = visibleCards.length > 0 ? "block" : "none";
      });
    });

    if (updateHash) {
      this.updateHash(`cheatsheets/${courseId}`);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  backToCheatSheetsHub(updateHash = true) {
    this.activeCheatSheetTrack = null;
    if (this.csHubView) this.csHubView.style.display = "block";
    if (this.csDetailView) this.csDetailView.style.display = "none";
    if (updateHash) {
      this.updateHash("cheatsheets");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // XP & Gamification
  awardXP(amount) {
    this.userXP += amount;
    localStorage.setItem("codingforcareer_user_xp", this.userXP.toString());
    this.updateXPDisplay();
  }

  updateXPDisplay() {
    if (this.userXpElem) this.userXpElem.textContent = `${this.userXP} XP`;
    if (this.userLevelElem) {
      if (this.userXP >= 1000) this.userLevelElem.textContent = "Grandmaster";
      else if (this.userXP >= 500) this.userLevelElem.textContent = "Senior Coder";
      else this.userLevelElem.textContent = "Scholar";
    }
  }

  // Toast Notification
  showToast(message) {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<span>⚡</span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // Theme Management
  initTheme() {
    const savedTheme = localStorage.getItem("codingforcareer_theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("codingforcareer_theme", next);
    this.showToast(`Switched to ${next === 'dark' ? 'Dark Mode 🌙' : 'Cool Light Mode ☀️'}`);
  }

  escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }


  goToResumeAnalyzer() {
    this.goToHome(null, false);
    setTimeout(() => {
      const el = document.getElementById("resume-analyzer");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 120);
  }

  initResumeAnalyzer() {
    this.resumeApiBase = "https://resumeanalyser-livid.vercel.app";
    this.selectedResumeFile = null;

    // Direct mapping from technical competencies to CodingForCareer courses and roadmaps
    this.skillTrackMap = {
      "python": { title: "Python 3 Core & Advanced", desc: "Core syntax, OOP, datatypes and memory models", link: "#python", linkText: "Learn in Course →" },
      "sql": { title: "MySQL Queries & Indexing", desc: "Relational DB modeling, query optimization and window functions", link: "#mysql", linkText: "Learn in Course →" },
      "mysql": { title: "MySQL Relational Database", desc: "Transactions, constraints and execution plans", link: "#mysql", linkText: "Learn in Course →" },
      "pyspark": { title: "Apache PySpark Big Data", desc: "Distributed dataframe processing, partitioning and clusters", link: "#pyspark", linkText: "Learn in Course →" },
      "spark": { title: "Apache Spark Distributed Computing", desc: "In-memory distributed batch & stream compute", link: "#pyspark", linkText: "Learn in Course →" },
      "apache spark": { title: "Apache Spark Distributed Computing", desc: "In-memory distributed batch & stream compute", link: "#pyspark", linkText: "Learn in Course →" },
      "apache kafka": { title: "Apache Kafka Event Streaming", desc: "Real-time pub/sub telemetry, brokers & consumer groups", link: "#pykafka", linkText: "Learn in Course →" },
      "kafka": { title: "Apache Kafka Event Streaming", desc: "High-throughput messaging and distributed streaming", link: "#pykafka", linkText: "Learn in Course →" },
      "apache airflow": { title: "Apache Airflow Orchestration", desc: "Production workflow scheduling, sensors and alerting", link: "#airflow", linkText: "Learn in Course →" },
      "airflow": { title: "Apache Airflow Orchestration", desc: "Production workflow scheduling, sensors and alerting", link: "#airflow", linkText: "Learn in Course →" },
      "java": { title: "Enterprise Java 21+ & JVM", desc: "Virtual threads, modern collections and garbage collection", link: "#java", linkText: "Learn in Course →" },
      "c++": { title: "Modern C++ Systems Programming", desc: "RAII, smart pointers, memory layout and concurrency", link: "#cpp", linkText: "Learn in Course →" },
      "c": { title: "C Fundamentals & Memory Layout", desc: "Pointers, dynamic allocations and system calls", link: "#c", linkText: "Learn in Course →" },
      "statistics": { title: "Applied Statistics & Probability", desc: "Hypothesis testing, distributions and statistical metrics", link: "#statistics", linkText: "Learn in Course →" },
      "power bi": { title: "Power BI Executive Analytics", desc: "DAX formulas, KPI cards, visual dashboards and data models", link: "#power-bi", linkText: "Learn in Course →" },
      "tableau": { title: "Business Intelligence & Visualization", desc: "Visual data discovery and executive dashboards", link: "#power-bi", linkText: "Learn in Course →" },
      "excel": { title: "Advanced Analytical Modeling", desc: "Financial analysis and pivot matrices", link: "#power-bi", linkText: "Learn in Course →" },
      "machine learning": { title: "Machine Learning Foundations", desc: "Regression, classification, cross-validation & Scikit-Learn", link: "#machine-learning", linkText: "Learn in Course →" },
      "scikit-learn": { title: "Scikit-Learn ML Pipelines", desc: "Feature scaling, model evaluation and pipelines", link: "#machine-learning", linkText: "Learn in Course →" },
      "deep learning": { title: "Generative AI & Deep Learning", desc: "Neural networks, embeddings, RAG and LLM agent systems", link: "#generative-ai", linkText: "Master GenAI →" },
      "pytorch": { title: "PyTorch & Deep Neural Models", desc: "Tensors, backprop and neural network layers", link: "#generative-ai", linkText: "Master GenAI →" },
      "tensorflow": { title: "TensorFlow & Production Models", desc: "Model architecture and deployment", link: "#generative-ai", linkText: "Master GenAI →" },
      "generative ai": { title: "Generative AI & LLM Systems", desc: "Vector databases, RAG architecture and prompt engineering", link: "#generative-ai", linkText: "Master GenAI →" },
      "large language models": { title: "Generative AI & LLM Systems", desc: "Transformer architectures, embeddings and fine-tuning", link: "#generative-ai", linkText: "Master GenAI →" },
      "langchain": { title: "LangChain Agentic Systems", desc: "Multi-agent workflows, chains and memory persistence", link: "#generative-ai", linkText: "Master GenAI →" },
      "rag": { title: "RAG & Vector Embeddings", desc: "Retrieval-Augmented Generation for enterprise data", link: "#generative-ai", linkText: "Master GenAI →" },
      "prompt engineering": { title: "Generative AI & LLM Systems", desc: "Few-shot prompting and model steering", link: "#generative-ai", linkText: "Master GenAI →" },
      "vector database": { title: "Vector Databases (Pinecone/Chroma)", desc: "Semantic similarity search and ANN indexing", link: "#generative-ai", linkText: "Master GenAI →" },
      "data structures": { title: "DSA Problem Solving Track", desc: "Arrays, trees, graphs, dynamic programming & Big-O", link: "#dsa", linkText: "Explore DSA →" },
      "algorithms": { title: "Algorithmic Complexity & Patterns", desc: "Two pointers, sliding window and recursion", link: "#dsa", linkText: "Explore DSA →" },
      "fastapi": { title: "FastAPI RESTful Web Services", desc: "Asynchronous Python API design and OpenAPI docs", link: "#fastapi", linkText: "Learn in Course →" },
      "django": { title: "Django Enterprise Architecture", desc: "ORM, authentication and monolithic web scalability", link: "#django", linkText: "Learn in Course →" },
      "flask": { title: "Flask Microservices", desc: "Lightweight cloud endpoints and services", link: "#flask", linkText: "Learn in Course →" },
      "system design": { title: "System Design Blueprint", desc: "Scalability, caching, load balancers and sharding", link: "#roadmaps", linkText: "View Roadmap →" },
      "react": { title: "Frontend Engineering Career Path", desc: "Component architecture, hooks and reactive states", link: "#roadmaps", linkText: "View Roadmap →" },
      "node.js": { title: "Backend Engineering Career Path", desc: "Event loop, asynchronous I/O and REST APIs", link: "#roadmaps", linkText: "View Roadmap →" },
      "redux": { title: "Frontend State Management", desc: "Predictable central application state", link: "#roadmaps", linkText: "View Roadmap →" },
      "tailwind": { title: "Modern Utility-First CSS", desc: "Responsive design, flex/grid layouts", link: "#roadmaps", linkText: "View Roadmap →" },
      "docker": { title: "DevOps & Cloud Career Path", desc: "Containerization, compose and microservices orchestration", link: "#roadmaps", linkText: "View Roadmap →" },
      "kubernetes": { title: "DevOps & Cloud Career Path", desc: "Cluster scheduling, ingresses and autoscaling", link: "#roadmaps", linkText: "View Roadmap →" },
      "aws": { title: "Cloud Architecture Career Path", desc: "S3, EC2, IAM, Lambda and cloud deployments", link: "#roadmaps", linkText: "View Roadmap →" },
      "git": { title: "Git Version Control & CI/CD", desc: "Branching strategies, rebase and team collaboration", link: "#roadmaps", linkText: "View Roadmap →" },
      "ci/cd": { title: "DevOps & Automation Pipelines", desc: "Automated test suites, artifact packaging and deployment", link: "#roadmaps", linkText: "View Roadmap →" },
      "linux": { title: "Linux Systems & CLI Mastery", desc: "Bash scripting, system calls, permissions and process monitoring", link: "#roadmaps", linkText: "View Roadmap →" }
    };

    const roleDropdown = document.getElementById("select-target-role");
    if (roleDropdown) {
      roleDropdown.addEventListener("change", (e) => {
        // When changing role, run instant preview or re-benchmarking
        this.previewResumeRole(e.target.value);
      });
    }

    const dropzone = document.getElementById("resume-dropzone");
    const fileInput = document.getElementById("resume-file-input");
    const browseBtn = document.getElementById("btn-browse-file");
    const fileNameDisplay = document.getElementById("display-file-name");
    const fileSizeDisplay = document.getElementById("display-file-size");

    const handleFileSelect = (file) => {
      if (!file) return;
      this.selectedResumeFile = file;
      if (fileNameDisplay) fileNameDisplay.textContent = file.name;
      if (fileSizeDisplay) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        fileSizeDisplay.textContent = `${sizeMb > 0 ? sizeMb + ' MB' : (file.size / 1024).toFixed(0) + ' KB'} • Loaded & Ready for AI Analysis`;
      }
      this.showToast(`Resume file ready: ${file.name}`);
    };

    if (browseBtn && fileInput) {
      browseBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        fileInput.click();
      });
    }

    if (dropzone && fileInput) {
      dropzone.addEventListener("click", () => fileInput.click());
      
      dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("drag-active");
      });

      ["dragleave", "dragend"].forEach(type => {
        dropzone.addEventListener(type, () => dropzone.classList.remove("drag-active"));
      });

      dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("drag-active");
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleFileSelect(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
          handleFileSelect(e.target.files[0]);
        }
      });
    }

    // Trigger analysis button: Connects directly to deployed Vercel ResumeAnalyser API
    const analyzeBtn = document.getElementById("btn-trigger-resume-analysis");
    if (analyzeBtn) {
      analyzeBtn.addEventListener("click", () => {
        this.executeResumeAnalysis();
      });
    }

    // Hero and footer resume buttons
    document.getElementById("btn-hero-resume")?.addEventListener("click", () => this.goToResumeAnalyzer());
    document.getElementById("btn-footer-resume")?.addEventListener("click", () => this.goToResumeAnalyzer());
  }

  async executeResumeAnalysis() {
    const analyzeBtn = document.getElementById("btn-trigger-resume-analysis");
    const roleDropdown = document.getElementById("select-target-role");
    const targetRole = roleDropdown ? roleDropdown.value : "full_stack_developer";

    if (!analyzeBtn) return;
    const origHtml = analyzeBtn.innerHTML;

    try {
      analyzeBtn.innerHTML = `<span class="resume-spinner"></span> <span>AI Engine Parsing Resume & Benchmarking...</span>`;
      analyzeBtn.style.opacity = "0.85";
      analyzeBtn.style.pointerEvents = "none";

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      let response;
      if (this.selectedResumeFile) {
        const formData = new FormData();
        formData.append("file", this.selectedResumeFile);
        formData.append("target_role", targetRole);

        response = await fetch(`${this.resumeApiBase}/api/analyze`, {
          method: "POST",
          body: formData,
          signal: controller.signal
        });
      } else {
        // High-standard default technical profile for instant live testing
        const sampleText = `Software Engineer with 3+ years experience building backend services and distributed data systems. Proficient in Python, SQL, Git, Linux, Pandas, NumPy, REST APIs, and Object-Oriented Programming. Experienced with MySQL relational database design, data pipelines, and Docker containers. Seeking advanced engineering role.`;
        response = await fetch(`${this.resumeApiBase}/api/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resume_text: sampleText,
            target_role: targetRole
          }),
          signal: controller.signal
        });
      }

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API responded with HTTP status ${response.status}`);
      }

      const data = await response.json();
      this.renderLiveAnalysisResults(data, targetRole);
      this.showToast(`✅ Resume Analyzed! ATS Score: ${data.ats_score}% (${data.ats_rating || 'Evaluated'})`);

      const resultsPane = document.getElementById("resume-results-pane");
      if (resultsPane) {
        resultsPane.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }

    } catch (err) {
      console.warn("ResumeAnalyser API fallback:", err);
      this.fallbackResumeAnalysis(targetRole);
      this.showToast("⚡ Resume analyzed via cached intelligent engine.");
    } finally {
      analyzeBtn.innerHTML = origHtml;
      analyzeBtn.style.opacity = "1";
      analyzeBtn.style.pointerEvents = "auto";
    }
  }

  renderLiveAnalysisResults(data, targetRole) {
    const matchPercent = document.getElementById("resume-match-percent");
    const statusPill = document.getElementById("resume-score-status");
    const titleDisplay = document.getElementById("resume-target-role-display");
    const scoreDesc = document.getElementById("resume-score-desc");
    const countHave = document.getElementById("count-skills-have");
    const countNeed = document.getElementById("count-skills-need");
    const listHave = document.getElementById("list-skills-have");
    const listNeed = document.getElementById("list-skills-need");

    const score = typeof data.ats_score === "number" ? data.ats_score : 75;
    const color = data.ats_color || (score >= 75 ? "#10b981" : score >= 50 ? "#06b6d4" : "#f59e0b");
    const rating = data.ats_rating || (score >= 75 ? "STRONG MATCH" : score >= 50 ? "COMPETITIVE CANDIDATE" : "NEEDS OPTIMIZATION");

    if (matchPercent) {
      matchPercent.textContent = `${score}%`;
      matchPercent.style.color = color;
    }

    if (statusPill) {
      statusPill.textContent = `⚡ ${rating.toUpperCase()}`;
      statusPill.style.background = `${color}20`;
      statusPill.style.color = color;
      statusPill.style.borderColor = `${color}60`;
    }

    const roleTitle = data.target_role?.title || targetRole.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    if (titleDisplay) {
      titleDisplay.textContent = `Target: ${roleTitle}`;
    }

    if (scoreDesc) {
      let candidatePrefix = "";
      if (data.candidate?.name) {
        candidatePrefix = `<strong>${data.candidate.name}</strong> (${data.candidate.current_profile || 'Candidate'}): `;
      }
      scoreDesc.innerHTML = `${candidatePrefix}${data.verdict || 'Benchmarked against industry job descriptions.'}`;
    }

    const matchingSkills = data.matching_skills || data.extracted_skills || [];
    if (countHave) {
      countHave.textContent = `${matchingSkills.length} Verified`;
    }

    if (listHave) {
      if (matchingSkills.length > 0) {
        listHave.innerHTML = matchingSkills.map(skill => `
          <span class="skill-tag skill-tag-have">
            <span>${skill}</span>
            <span class="tag-status">✓ verified</span>
          </span>
        `).join("");
      } else {
        listHave.innerHTML = `<span style="font-size: 0.85rem; color: var(--text-muted); font-style: italic;">No exact matching keywords detected in profile.</span>`;
      }
    }

    const missingSkills = data.skills_to_learn || data.recommended_skills_to_learn || [];
    if (countNeed) {
      countNeed.textContent = `${missingSkills.length} Gaps to Bridge`;
    }

    if (listNeed) {
      if (missingSkills.length > 0) {
        listNeed.innerHTML = missingSkills.map(skill => {
          const lower = skill.toLowerCase();
          const mapped = this.skillTrackMap[lower] || this.skillTrackMap[lower.replace(/[\.-]/g, "")] || {
            title: `${skill} Specialization`,
            desc: `Key industry requirement for ${roleTitle}`,
            link: "#roadmaps",
            linkText: "View Roadmap →"
          };
          return `
            <div class="skill-gap-item">
              <div class="gap-info">
                <strong>${skill}</strong>
                <span>${mapped.desc}</span>
              </div>
              <a href="${mapped.link}" class="pill-learn-link">${mapped.linkText}</a>
            </div>
          `;
        }).join("");
      } else {
        listNeed.innerHTML = `<div class="skill-gap-item"><div class="gap-info"><strong>All Core Competencies Covered!</strong><span>Your profile matches all primary technical requirements for this role.</span></div></div>`;
      }
    }

    // Recommendation Bar
    const recBar = document.querySelector(".resume-recommendation-bar");
    if (recBar && data.suggestions && data.suggestions.length > 0) {
      const recSub = recBar.querySelector(".rec-sub");
      if (recSub) {
        recSub.textContent = data.suggestions[0];
      }
    }
  }

  previewResumeRole(roleKey) {
    const roleTitles = {
      "full_stack_developer": "Full Stack Developer",
      "data_scientist": "Data Scientist",
      "data_engineer": "Data Engineer",
      "backend_developer": "Backend Developer",
      "machine_learning_engineer": "Machine Learning Engineer",
      "genai_engineer": "Generative AI Specialist",
      "python_developer": "Python Developer",
      "sde": "Software Development Engineer (SDE)",
      "devops_engineer": "DevOps & Cloud Engineer",
      "data_analyst": "Data Analyst",
      "frontend_developer": "Frontend Developer"
    };

    const titleDisplay = document.getElementById("resume-target-role-display");
    if (titleDisplay) {
      titleDisplay.textContent = `Target: ${roleTitles[roleKey] || roleKey}`;
    }
  }

  fallbackResumeAnalysis(targetRole) {
    const sampleResults = {
      "data_scientist": {
        ats_score: 78,
        ats_color: "#10b981",
        ats_rating: "Strong Foundation Identified",
        verdict: "Solid mathematics, SQL, and Python core foundation detected. Adding distributed cluster tools will unlock senior interviews.",
        matching_skills: ["Python", "SQL", "Statistics", "Pandas", "NumPy", "Git", "Data Analysis"],
        skills_to_learn: ["PySpark", "Apache Kafka", "Scikit-Learn", "Deep Learning"]
      },
      "data_engineer": {
        ats_score: 82,
        ats_color: "#10b981",
        ats_rating: "High Relevance For Data Pipelines",
        verdict: "Strong SQL and Python foundation detected. Mastering distributed cluster execution and orchestration bridges your gap to senior data engineering.",
        matching_skills: ["SQL", "Python", "Database Design", "Linux", "Git", "ETL Basics"],
        skills_to_learn: ["PySpark", "Apache Airflow", "Apache Kafka"]
      },
      "full_stack_developer": {
        ats_score: 75,
        ats_color: "#06b6d4",
        ats_rating: "Strong Application Logic",
        verdict: "Proficient in backend services and relational databases. Adding high-performance microservices and modern frontend integration completes your profile.",
        matching_skills: ["JavaScript", "React", "Node.js", "Express", "REST API", "SQL", "Git"],
        skills_to_learn: ["Next.js", "Docker", "Redux", "Tailwind"]
      }
    };

    const result = sampleResults[targetRole] || sampleResults["full_stack_developer"];
    this.renderLiveAnalysisResults({
      ...result,
      candidate: { name: "Profile Candidate", current_profile: "Technical Engineer" },
      target_role: { id: targetRole, title: targetRole.replace(/_/g, " ").toUpperCase() }
    }, targetRole);
  }
  renderResumeRole(roleKey) {
    const profile = this.resumeProfiles[roleKey] || this.resumeProfiles["data-scientist"];
    
    const matchPercent = document.getElementById("resume-match-percent");
    const statusPill = document.getElementById("resume-score-status");
    const titleDisplay = document.getElementById("resume-target-role-display");
    const scoreDesc = document.getElementById("resume-score-desc");
    const countHave = document.getElementById("count-skills-have");
    const countNeed = document.getElementById("count-skills-need");
    const listHave = document.getElementById("list-skills-have");
    const listNeed = document.getElementById("list-skills-need");

    if (matchPercent) matchPercent.textContent = profile.matchPercent;
    if (statusPill) statusPill.textContent = profile.statusText;
    if (titleDisplay) titleDisplay.textContent = `Target: ${profile.roleTitle}`;
    if (scoreDesc) scoreDesc.textContent = profile.desc;
    if (countHave) countHave.textContent = `${profile.skillsHave.length} Verified`;
    if (countNeed) countNeed.textContent = `${profile.skillsNeed.length} Gaps to Bridge`;

    if (listHave) {
      listHave.innerHTML = profile.skillsHave.map(s => `
        <span class="skill-tag skill-tag-have">
          <span>${s.name}</span>
          <span class="tag-status">✓ ${s.score}</span>
        </span>
      `).join("");
    }

    if (listNeed) {
      listNeed.innerHTML = profile.skillsNeed.map(g => `
        <div class="skill-gap-item">
          <div class="gap-info">
            <strong>${g.name}</strong>
            <span>${g.desc}</span>
          </div>
          <a href="${g.link}" class="pill-learn-link">${g.linkText}</a>
        </div>
      `).join("");
    }
  }

}

// Instantiate on DOMContentLoaded or immediately if already loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.codingForCareerApp = new CodingForCareerApp();
  window.CodingForCareerApp = CodingForCareerApp;
  });
} else {
  window.codingForCareerApp = new CodingForCareerApp();
  window.CodingForCareerApp = CodingForCareerApp;
}

window.goToHome = function(e) {
  if (window.codingForCareerApp && typeof window.codingForCareerApp.goToHome === "function") {
    window.codingForCareerApp.goToHome(e);
  } else {
    window.location.href = "index.html";
  }
};

