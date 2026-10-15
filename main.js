
// TripCraft - main.js

"use strict";

// 1. 取得 HTML 元件
const tripForm = document.getElementById("trip-form");
const attractionForm = document.getElementById("attraction-form");

const tripMessage = document.getElementById("trip-message");
const attractionMessage = document.getElementById("attraction-message");

const tripSummary = document.getElementById("trip-summary");
const dayTabs = document.getElementById("day-tabs");
const attractionList = document.getElementById("attraction-list");
const emptyState = document.getElementById("empty-state");

const daySelect = document.getElementById("attraction-day");
const addButton = document.getElementById("add-attraction-btn");

const STORAGE_KEY = "tripcraft_data_v1";
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DAYS = 30;

// 2. 初始東京三日遊範例
const exampleTrip = {
  name: "東京三日遊",
  destination: "日本東京",
  startDate: "2026-11-06",
  endDate: "2026-11-08",
  attractions: [
    {
      id: "sample-1",
      day: 0,
      name: "明治神宮",
      time: "09:00",
      note: "在都市中的森林神社散步。"
    },
    {
      id: "sample-2",
      day: 0,
      name: "表參道",
      time: "13:00",
      note: "享受街道建築、咖啡廳與購物。"
    },
    {
      id: "sample-3",
      day: 1,
      name: "東京車站",
      time: "10:00",
      note: "欣賞歷史建築與周邊街景。"
    },
    {
      id: "sample-4",
      day: 1,
      name: "銀座",
      time: "14:00",
      note: "逛街、用餐及探索城市。"
    },
    {
      id: "sample-5",
      day: 2,
      name: "上野公園",
      time: "09:30",
      note: "漫步公園，感受東京的自然景觀。"
    }
  ]
};

// 3. 日期相關工具
function parseDate(dateString) {
  const parts = dateString.split("-").map(Number);
  return Date.UTC(parts[0], parts[1] - 1, parts[2]);
}

function getDayCount(start, end) {
  return Math.round(
    (parseDate(end) - parseDate(start)) / DAY_MS
  ) + 1;
}

function getDateForDay(start, dayIndex) {
  const date = new Date(parseDate(start) + dayIndex * DAY_MS);
  return date.toISOString().slice(0, 10);
}

function formatDate(dateString) {
  return dateString.replaceAll("-", "/");
}

// 4. 載入儲存資料
function loadTrip() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      if (
        parsed &&
        typeof parsed.name === "string" &&
        typeof parsed.destination === "string" &&
        typeof parsed.startDate === "string" &&
        typeof parsed.endDate === "string" &&
        Array.isArray(parsed.attractions) &&
        /^\d{4}-\d{2}-\d{2}$/.test(parsed.startDate) &&
        /^\d{4}-\d{2}-\d{2}$/.test(parsed.endDate) &&
        getDayCount(parsed.startDate, parsed.endDate) >= 1 &&
        getDayCount(parsed.startDate, parsed.endDate) <= MAX_DAYS
      ) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn("儲存資料讀取失敗", error);
  }

  return structuredClone(exampleTrip);
}

let trip = loadTrip();
let selectedDay = 0;

function saveTrip() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trip));
  } catch (error) {
    console.warn("無法儲存行程", error);
    tripMessage.textContent = "瀏覽器無法儲存資料，請確認儲存空間或隱私設定。";
  }
}

// 5. 顯示旅行摘要
function renderSummary() {
  tripSummary.hidden = false;

  document.getElementById("display-trip-name").textContent =
    trip.name;

  document.getElementById("display-destination").textContent =
    trip.destination;

  document.getElementById("display-dates").textContent =
    formatDate(trip.startDate) + " ～ " +
    formatDate(trip.endDate);

  document.getElementById("display-days").textContent =
    getDayCount(trip.startDate, trip.endDate) + " 天";
}

// 6. 產生 Day 1、Day 2 等按鈕
function renderDayTabs() {
  dayTabs.replaceChildren();

  const count = getDayCount(trip.startDate, trip.endDate);

  for (let i = 0; i < count; i++) {
    const button = document.createElement("button");

    button.type = "button";
    button.className =
      "day-tab" + (i === selectedDay ? " active" : "");

    button.textContent = "Day " + (i + 1);
    button.setAttribute(
      "aria-pressed",
      String(i === selectedDay)
    );

    button.addEventListener("click", () => {
      selectedDay = i;
      render();
    });

    dayTabs.appendChild(button);
  }
}

// 7. 景點卡片
function createAttractionCard(attraction) {
  const card = document.createElement("article");
  card.className = "attraction-card";

  const time = document.createElement("span");
  time.className = "attraction-time";
  time.textContent = "◷ " + attraction.time;

  const name = document.createElement("h4");
  name.className = "attraction-name";
  name.textContent = attraction.name;

  const note = document.createElement("p");
  note.className = "attraction-note";
  note.textContent = attraction.note || "沒有額外備註";

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-btn";
  deleteButton.textContent = "刪除景點";

  deleteButton.addEventListener("click", () => {
    const confirmed = confirm(
      "確定要刪除「" + attraction.name + "」嗎？"
    );

    if (!confirmed) return;

    trip.attractions = trip.attractions.filter(
      item => item.id !== attraction.id
    );

    saveTrip();
    render();
  });

  card.append(time, name, note, deleteButton);
  return card;
}

// 8. 顯示目前選擇日期的景點
function renderAttractions() {
  attractionList.replaceChildren();

  const currentDate = getDateForDay(
    trip.startDate,
    selectedDay
  );

  document.getElementById("selected-day-title").textContent =
    "Day " + (selectedDay + 1) + " 的旅程";

  document.getElementById("selected-day-date").textContent =
    formatDate(currentDate);

  const items = trip.attractions
    .filter(item => item.day === selectedDay)
    .sort((a, b) => a.time.localeCompare(b.time));

  emptyState.hidden = items.length > 0;

  const emptyTitle = emptyState.querySelector("h3");
  const emptyDescription = emptyState.querySelector("p");

  emptyTitle.textContent = "今天還沒有安排景點";
  emptyDescription.textContent =
    "在下方新增景點，開始安排這一天的旅行。";

  items.forEach(item => {
    attractionList.appendChild(createAttractionCard(item));
  });
}

// 9. 更新新增景點的日期選單
function renderDaySelect() {
  daySelect.replaceChildren();

  const count = getDayCount(trip.startDate, trip.endDate);

  for (let i = 0; i < count; i++) {
    const option = document.createElement("option");

    option.value = String(i);
    option.textContent =
      "Day " + (i + 1) + " — " +
      formatDate(getDateForDay(trip.startDate, i));

    daySelect.appendChild(option);
  }

  daySelect.value = String(selectedDay);
  daySelect.disabled = false;
  addButton.disabled = false;
}

// 10. 統一更新網頁
function render() {
  renderSummary();
  renderDayTabs();
  renderAttractions();
  renderDaySelect();
}

// 11. 建立新旅行
tripForm.addEventListener("submit", event => {
  event.preventDefault();

  const name = document.getElementById("trip-name").value.trim();
  const destination = document.getElementById("destination").value.trim();
  const startDate = document.getElementById("start-date").value;
  const endDate = document.getElementById("end-date").value;

  if (!name || !destination || !startDate || !endDate) {
    tripMessage.textContent = "請填寫完整旅行資訊。";
    return;
  }

  const days = getDayCount(startDate, endDate);

  if (!Number.isFinite(days) || days < 1) {
    tripMessage.textContent = "結束日期不能早於開始日期。";
    return;
  }

  if (days > MAX_DAYS) {
    tripMessage.textContent = "每次最多規劃 30 天的旅行。";
    return;
  }

  if (trip.attractions.length > 0) {
    const confirmed = confirm(
      "建立新旅行將取代目前行程，確定要繼續嗎？"
    );
    if (!confirmed) return;
  }

  trip = {
    name,
    destination,
    startDate,
    endDate,
    attractions: []
  };

  selectedDay = 0;
  saveTrip();
  render();

  tripMessage.textContent = "旅行建立成功！可以開始新增景點。";

  document.getElementById("itinerary").scrollIntoView({
    behavior: "smooth"
  });
});

// 12. 新增景點
attractionForm.addEventListener("submit", event => {
  event.preventDefault();

  const day = Number(daySelect.value);
  const name = document.getElementById("attraction-name").value.trim();
  const time = document.getElementById("attraction-time").value;
  const note = document.getElementById("attraction-note").value.trim();

  if (!name || !time || !Number.isInteger(day) ||
      day < 0 || day >= getDayCount(trip.startDate, trip.endDate)) {
    attractionMessage.textContent = "請填寫完整的景點資料。";
    return;
  }

  const id = crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now()) + "-" + Math.random();

  trip.attractions.push({
    id,
    day,
    name,
    time,
    note
  });

  selectedDay = day;

  saveTrip();
  render();

  attractionForm.reset();
  daySelect.value = String(selectedDay);

  attractionMessage.textContent = "景點新增成功！";

  document.getElementById("itinerary").scrollIntoView({
    behavior: "smooth"
  });
});

// 13. 首次載入
render();
