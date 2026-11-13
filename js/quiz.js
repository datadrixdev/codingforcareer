/**
 * CodingForCareer — Practice & Quizzes Engine
 * Provides interactive quizzes with immediate evaluation, streak tracking, and XP awards.
 */

class CodingForCareerQuizEngine {
  constructor() {
    this.container = document.getElementById("quiz-cards-container");
    this.filterButtons = document.querySelectorAll(".quiz-cat-btn");
    this.statAnswered = document.getElementById("quiz-stat-answered");
    this.statAccuracy = document.getElementById("quiz-stat-accuracy");
    this.statStreak = document.getElementById("quiz-stat-streak");
    this.userXpElem = document.getElementById("user-xp");

    this.currentCategory = "all";
    this.answeredQuestions = new Set();
    this.correctCount = 0;
    this.totalAnswered = 0;
    this.currentStreak = 1;

    this.loadStats();
    this.bindEvents();
    this.render();
  }

  loadStats() {
    try {
      const saved = JSON.parse(localStorage.getItem("codingforcareer_quiz_stats") || "{}");
      this.totalAnswered = saved.totalAnswered || 0;
      this.correctCount = saved.correctCount || 0;
      this.currentStreak = saved.currentStreak || 1;
      this.updateStatsDisplay();
    } catch {
      // ignore
    }
  }

  saveStats() {
    try {
      localStorage.setItem("codingforcareer_quiz_stats", JSON.stringify({
        totalAnswered: this.totalAnswered,
        correctCount: this.correctCount,
        currentStreak: this.currentStreak
      }));
    } catch {
      // ignore
    }
  }

  updateStatsDisplay() {
    if (this.statAnswered) this.statAnswered.textContent = this.totalAnswered;
    if (this.statAccuracy) {
      const acc = this.totalAnswered > 0 ? Math.round((this.correctCount / this.totalAnswered) * 100) : 100;
      this.statAccuracy.textContent = `${acc}%`;
    }
    if (this.statStreak) {
      this.statStreak.textContent = `🔥 ${this.currentStreak}`;
    }
  }

  bindEvents() {
    this.filterButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        this.filterButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.currentCategory = btn.getAttribute("data-cat");
        this.render();
      });
    });
  }

  render() {
    if (!this.container) return;

    const filtered = CODINGFORCAREER_DATA.quizzes.filter(q => {
      if (this.currentCategory === "all") return true;
      return q.track === this.currentCategory;
    });

    if (filtered.length === 0) {
      this.container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-light);">
          <p>No questions found in this category right now. Check back soon!</p>
        </div>
      `;
      return;
    }

    this.container.innerHTML = filtered.map(q => `
      <div class="quiz-card" id="quiz-card-${q.id}" data-id="${q.id}">
        <div class="quiz-card-header">
          <span class="quiz-track-badge">${q.trackName}</span>
          <span class="quiz-difficulty">Level: ${q.difficulty}</span>
        </div>

        <h3 class="quiz-question-text">${q.question}</h3>

        ${q.code ? `<pre class="quiz-code-block"><code>${this.escapeHtml(q.code)}</code></pre>` : ""}

        <div class="quiz-options-list">
          ${q.options.map((opt, i) => `
            <div class="quiz-option-item" data-quiz-id="${q.id}" data-index="${i}">
              <div class="option-marker">${String.fromCharCode(65 + i)}</div>
              <span class="option-label">${this.escapeHtml(opt)}</span>
            </div>
          `).join("")}
        </div>

        <div class="quiz-explanation-box" id="explanation-${q.id}">
          <strong>💡 Explanation:</strong> ${q.explanation}
        </div>
      </div>
    `).join("");

    // Attach click events
    this.container.querySelectorAll(".quiz-option-item").forEach(item => {
      item.addEventListener("click", (e) => this.handleOptionClick(e.currentTarget));
    });
  }

  handleOptionClick(selectedElem) {
    const quizId = selectedElem.getAttribute("data-quiz-id");
    const selectedIdx = parseInt(selectedElem.getAttribute("data-index"), 10);

    if (this.answeredQuestions.has(quizId)) return; // Already answered
    this.answeredQuestions.add(quizId);

    const question = CODINGFORCAREER_DATA.quizzes.find(q => q.id === quizId);
    if (!question) return;

    const card = document.getElementById(`quiz-card-${quizId}`);
    const options = card.querySelectorAll(".quiz-option-item");
    const explanation = document.getElementById(`explanation-${quizId}`);

    const isCorrect = selectedIdx === question.correctIndex;
    this.totalAnswered++;

    if (isCorrect) {
      this.correctCount++;
      this.currentStreak++;
      selectedElem.classList.add("correct");
      window.codingForCareerApp?.awardXP(50);
      window.codingForCareerApp?.showToast("🎉 Correct! +50 XP awarded!");
    } else {
      this.currentStreak = Math.max(1, this.currentStreak - 1);
      selectedElem.classList.add("incorrect");
      // Highlight the correct answer
      options[question.correctIndex]?.classList.add("correct");
      window.codingForCareerApp?.showToast("Not quite! Check out the explanation.");
    }

    if (explanation) {
      explanation.classList.add("visible");
    }

    this.saveStats();
    this.updateStatsDisplay();
  }

  escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

window.CodingForCareerQuizEngine = CodingForCareerQuizEngine;
