/* ============================================
   APP.JS — Main Application Logic
   ============================================ */

let allData = [];
let filteredData = [];
let mainSwiper = null;
let thumbSwiper = null;

// ── Fetch Data ───────────────────────────────
async function fetchData() {
  try {
    const res = await fetch(CONFIG.API_URL);
    const json = await res.json();
    if (json.status === "success") {
      allData = json.data;
      filteredData = [...allData];
      return true;
    }
    console.error("API Error:", json.message);
    return false;
  } catch (err) {
    console.error("Fetch failed:", err);
    return false;
  }
}

// ── Get Photo URL ────────────────────────────
function getPhoto(item) {
  const link = item["Link Foto"];
  if (link && link !== "") return link;
  return CONFIG.DEFAULT_AVATAR + encodeURIComponent(item["Nama Lengkap"] || item["Nama_Amil"]);
}

// ── Render Slides ────────────────────────────
function renderSlides(data) {
  const wrapper = document.getElementById("swiperWrapper");
  const thumbWrap = document.getElementById("thumbWrapper");

  wrapper.innerHTML = "";
  thumbWrap.innerHTML = "";

  if (data.length === 0) {
    wrapper.innerHTML = `<div class="swiper-slide"><div class="char-card empty-card"><p>Tidak ada data ditemukan</p></div></div>`;
    updateStats(null);
    document.getElementById("totalSlides").textContent = "0";
    document.getElementById("currentSlide").textContent = "0";
    document.getElementById("counterNum").textContent = "0";
    return;
  }

  data.forEach(function (item, idx) {
    const photo = getPhoto(item);
    const nama = item["Nama Lengkap"] || item["Nama_Amil"] || "—";
    const status = item["Status"] || "—";
    const statusClass = status === "Aktif" ? "aktif" : "nonaktif";
    const gender = (item["Jenis Kelamin"] || "").toLowerCase();
    const genderClass = gender === "male" ? "male" : "female";

    // Main slide
    const slide = document.createElement("div");
    slide.className = "swiper-slide";
    slide.innerHTML = `
      <div class="char-card ${genderClass}">
        <div class="card-glow"></div>
        <div class="card-photo-wrap">
          <img class="card-photo" src="${photo}" alt="${nama}" loading="lazy" onerror="this.src='${CONFIG.DEFAULT_AVATAR}${encodeURIComponent(nama)}'" />
        </div>
        <div class="card-bottom">
          <span class="card-status ${statusClass}">${status.toUpperCase()}</span>
          <h3 class="card-name">${nama}</h3>
          <p class="card-role">${item["Posisi"] || "—"}</p>
        </div>
      </div>
    `;
    wrapper.appendChild(slide);

    // Thumbnail
    const thumb = document.createElement("div");
    thumb.className = "swiper-slide";
    thumb.innerHTML = `
      <div class="thumb-card ${idx === 0 ? "active" : ""}">
        <img src="${photo}" alt="${nama}" loading="lazy" onerror="this.src='${CONFIG.DEFAULT_AVATAR}${encodeURIComponent(nama)}'" />
      </div>
    `;
    thumbWrap.appendChild(thumb);
  });

  document.getElementById("totalSlides").textContent = data.length;
  document.getElementById("counterNum").textContent = data.length;

  initSwipers(data);
  updateStats(data[0]);
}

// ── Init Swipers ─────────────────────────────
function initSwipers(data) {
  if (mainSwiper) mainSwiper.destroy(true, true);
  if (thumbSwiper) thumbSwiper.destroy(true, true);

  thumbSwiper = new Swiper(".thumb-swiper", {
    slidesPerView: "auto",
    spaceBetween: 8,
    freeMode: true,
    watchSlidesProgress: true,
  });

  mainSwiper = new Swiper(".character-swiper", {
    effect: "coverflow",
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: 1.4,
    loop: false,
    coverflowEffect: {
      rotate: 0,
      stretch: 60,
      depth: 200,
      modifier: 1,
      slideShadows: false,
    },
    thumbs: {
      swiper: thumbSwiper,
    },
    keyboard: { enabled: true },
    on: {
      slideChange: function () {
        var idx = this.activeIndex;
        document.getElementById("currentSlide").textContent = idx + 1;
        updateStats(data[idx]);
        updateThumbActive(idx);
      },
    },
    breakpoints: {
      320: { slidesPerView: 1.05, coverflowEffect: { stretch: 10, depth: 80 } },
      640: { slidesPerView: 1.2, coverflowEffect: { stretch: 30, depth: 120 } },
      1024: { slidesPerView: 1.4, coverflowEffect: { stretch: 60, depth: 200 } },
    },
  });

  document.getElementById("prevBtn").onclick = function () { mainSwiper.slidePrev(); };
  document.getElementById("nextBtn").onclick = function () { mainSwiper.slideNext(); };
  document.getElementById("currentSlide").textContent = "1";
}

// ── Update Thumbnail Active ──────────────────
function updateThumbActive(idx) {
  document.querySelectorAll(".thumb-card").forEach(function (el, i) {
    el.classList.toggle("active", i === idx);
  });
}

// ── Update Stats Panel ───────────────────────
function updateStats(item) {
  var panel = document.getElementById("statsPanel");

  if (!item) {
    panel.classList.add("empty");
    return;
  }
  panel.classList.remove("empty");

  // Animate in
  panel.classList.remove("animate-in");
  void panel.offsetWidth; // reflow
  panel.classList.add("animate-in");

  var nama = item["Nama Lengkap"] || "—";
  var alias = item["Nama_Amil"] || "—";
  var posisi = item["Posisi"] || "—";
  var divisi = item["Divisi / Wilayah Kerja"] || "—";
  var pendidikan = item["Instansi Pendidikan"] || "—";
  var email = item["Email"] || "—";
  var status = item["Status"] || "—";
  var level = item["Level Jabatan"] || "—";
  var gender = item["Jenis Kelamin"] || "—";

  document.getElementById("statsName").textContent = nama;
  document.getElementById("statsAlias").textContent = alias !== nama ? '"' + alias + '"' : "";
  document.getElementById("statPosisi").textContent = posisi;
  document.getElementById("statDivisi").textContent = divisi;
  document.getElementById("statPendidikan").textContent = pendidikan;
  document.getElementById("statEmail").textContent = email;

  var badge = document.getElementById("statusBadge");
  badge.textContent = status.toUpperCase();
  badge.className = "status-badge " + (status === "Aktif" ? "aktif" : "nonaktif");

  // Stat bars
  var levelPct = level === "Staff" ? 40 : level === "Assistant Manager" ? 60 : level === "Manager" ? 80 : 20;
  animateBar("barLevel", levelPct);
  document.getElementById("barLevelText").textContent = level;

  var genderPct = gender === "Male" ? 70 : gender === "Female" ? 70 : 50;
  var genderBar = document.getElementById("barGender");
  genderBar.className = "bar-fill gender-bar " + (gender === "Male" ? "male" : "female");
  animateBar("barGender", genderPct);
  document.getElementById("barGenderText").textContent = gender;

  // Divisi tag
  document.getElementById("divisiTag").textContent = divisi;
}

function animateBar(id, pct) {
  var el = document.getElementById(id);
  el.style.width = "0%";
  setTimeout(function () { el.style.width = pct + "%"; }, 100);
}

// ── Filter & Search ──────────────────────────
function applyFilters() {
  var activeBtn = document.querySelector(".filter-btn.active");
  var filterVal = activeBtn ? activeBtn.dataset.filter : "all";
  var searchVal = document.getElementById("searchInput").value.toLowerCase().trim();

  filteredData = allData.filter(function (item) {
    var matchStatus = filterVal === "all" || item["Status"] === filterVal;
    var matchSearch = searchVal === "" ||
      (item["Nama Lengkap"] || "").toLowerCase().indexOf(searchVal) !== -1 ||
      (item["Nama_Amil"] || "").toLowerCase().indexOf(searchVal) !== -1 ||
      (item["Posisi"] || "").toLowerCase().indexOf(searchVal) !== -1 ||
      (item["Divisi / Wilayah Kerja"] || "").toLowerCase().indexOf(searchVal) !== -1;
    return matchStatus && matchSearch;
  });

  renderSlides(filteredData);
}

// ── Event Listeners ──────────────────────────
function setupEvents() {
  // Filter buttons
  document.querySelectorAll(".filter-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".filter-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      applyFilters();
    });
  });

  // Search
  var searchTimeout;
  document.getElementById("searchInput").addEventListener("input", function () {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(applyFilters, 300);
  });

  // Keyboard navigation
  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft" && mainSwiper) mainSwiper.slidePrev();
    if (e.key === "ArrowRight" && mainSwiper) mainSwiper.slideNext();
  });
}

// ── Init App ─────────────────────────────────
async function init() {
  var success = await fetchData();
  if (success) {
    renderSlides(allData);
    setupEvents();
  }

  // Hide loader
  document.getElementById("loader").classList.add("fade-out");
  setTimeout(function () {
    document.getElementById("loader").style.display = "none";
    document.getElementById("app").classList.remove("hidden");
  }, 600);
}

// Start
document.addEventListener("DOMContentLoaded", init);
