/************************************
 * AI STUDY PLANNER - FRONTEND LOGIC
 * app.js
 ************************************/

const API_URL = "http://localhost:3000/api/generate-plan";

/* ========== DARK / LIGHT MODE ========== */
const themeToggle = document.getElementById("theme-toggle");
const body = document.body;

// load saved theme
if (localStorage.getItem("theme") === "light") {
  body.classList.add("light");
}

themeToggle?.addEventListener("click", () => {
  body.classList.toggle("light");
  localStorage.setItem(
    "theme",
    body.classList.contains("light") ? "light" : "dark"
  );
});

/* ========== GET FORM DATA ========== */
function getSelectedSubjects() {
  return Array.from(
    document.querySelectorAll(".subject-item input:checked")
  ).map((cb) => cb.value);
}

function getLevels() {
  const levels = {};
  document.querySelectorAll(".level-slider").forEach((slider) => {
    const subject = slider.dataset.subject;
    levels[subject] = parseFloat(slider.value);
  });
  return levels;
}

/* ========== FORM SUBMIT ========== */
const form = document.getElementById("study-form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    goal: document.getElementById("goal").value,
    block: document.getElementById("block").value.trim(),
    subjects: getSelectedSubjects(),
    levels: getLevels(),
    freeTime: parseFloat(document.getElementById("freeTime").value),
    weakPoints: document.getElementById("weakPoints").value.trim(),
    days: parseInt(document.getElementById("days").value),
  };

  /* ===== VALIDATION ===== */
  if (!data.block) {
    alert("Vui lòng nhập khối thi!");
    return;
  }

  if (data.subjects.length === 0) {
    alert("Vui lòng chọn ít nhất 1 môn học!");
    return;
  }

  if (!data.freeTime || data.freeTime <= 0) {
    alert("Thời gian rảnh mỗi ngày phải > 0");
    return;
  }

  /* ===== LOADING STATE ===== */
  const btn = document.getElementById("submit-btn");
  btn.disabled = true;
  btn.innerText = "⏳ Đang tạo lịch...";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Backend error");

    const plan = await res.json();

    // save result & redirect
    localStorage.setItem("studyPlan", JSON.stringify(plan));
    window.location.href = "result.html";
  } catch (err) {
    alert("Không thể tạo lịch học. Kiểm tra backend!");
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.innerText = "🚀 Tạo lịch học";
  }
});
