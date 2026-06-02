const STORAGE_KEY = "med-utopia-beta-records";

const formConfigs = {
  case: {
    eyebrow: "Case Lab",
    title: "提交脱敏病例",
    typeLabel: "病例",
    netlifyName: "case-submission",
    fields: [
      { name: "title", label: "病例标题", placeholder: "例如：围手术期抗凝方案复盘", required: true },
      { name: "specialty", label: "所属专科", placeholder: "肿瘤内科 / 影像 / 麻醉 / 其他", required: true },
      { name: "summary", label: "病程摘要", type: "textarea", placeholder: "只写脱敏后的关键病程、检查与处理经过", required: true },
      { name: "question", label: "想复盘的问题", type: "textarea", placeholder: "你希望专家重点点评哪个决策节点？", required: true },
      { name: "files", label: "附件说明", placeholder: "例如：已脱敏 CT 截图 2 张、PPT 草稿 1 份" }
    ]
  },
  consult: {
    eyebrow: "Academic Booking",
    title: "发起学术挂号",
    typeLabel: "挂号",
    netlifyName: "consult-booking",
    fields: [
      { name: "title", label: "咨询主题", placeholder: "例如：III 期肺癌辅助治疗路径选择", required: true },
      { name: "expert", label: "希望咨询的专家方向", placeholder: "肿瘤 KOL / 临床统计 / 科研设计", required: true },
      { name: "budget", label: "预算范围", placeholder: "例如：300-800 元，内测可先填人工沟通" },
      { name: "question", label: "标准化问题单", type: "textarea", placeholder: "背景、已有证据、你卡住的选择点", required: true }
    ]
  },
  bounty: {
    eyebrow: "Technical Bounty",
    title: "发布技术悬赏",
    typeLabel: "悬赏",
    netlifyName: "bounty-task",
    fields: [
      { name: "title", label: "任务标题", placeholder: "例如：生存曲线配色与注释重排", required: true },
      { name: "reward", label: "悬赏金额", placeholder: "例如：800 元", required: true },
      { name: "deadline", label: "截止时间", placeholder: "例如：本周五 22:00" },
      { name: "question", label: "交付要求", type: "textarea", placeholder: "说明原始材料、目标格式、验收标准", required: true }
    ]
  },
  waitlist: {
    eyebrow: "Join Med-Utopia",
    title: "申请加入",
    typeLabel: "申请",
    netlifyName: "beta-waitlist",
    fields: [
      { name: "title", label: "姓名或昵称", placeholder: "例如：小宝 / Dr. Chen", required: true },
      { name: "role", label: "你的身份", placeholder: "医学生 / 医生 / 专家 / 药企 / 投资人", required: true },
      { name: "contact", label: "联系方式", placeholder: "微信、邮箱或手机号", required: true },
      { name: "question", label: "关注的功能", type: "textarea", placeholder: "病例复盘、学术挂号、悬赏、医学美学引擎等" }
    ]
  }
};

const demoRecords = [
  {
    id: "demo-1",
    type: "case",
    typeLabel: "病例",
    title: "围手术期抗凝方案复盘",
    specialty: "心血管外科",
    question: "希望复盘术前停药与术后桥接的关键节点。",
    status: "审核中",
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: "demo-2",
    type: "bounty",
    typeLabel: "悬赏",
    title: "指南证据等级可视化",
    reward: "1200 元",
    question: "把指南推荐强度做成适合汇报的图谱。",
    status: "已进入策展",
    createdAt: new Date(Date.now() - 3600000).toISOString()
  }
];

const state = {
  activeType: "case",
  filter: "all",
  query: ""
};

const modalBackdrop = document.querySelector("#modalBackdrop");
const modalTitle = document.querySelector("#modalTitle");
const modalEyebrow = document.querySelector("#modalEyebrow");
const formFields = document.querySelector("#formFields");
const betaForm = document.querySelector("#betaForm");
const toast = document.querySelector("#toast");

function getRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function openModal(type) {
  const config = formConfigs[type];
  if (!config) return;
  state.activeType = type;
  modalTitle.textContent = config.title;
  modalEyebrow.textContent = config.eyebrow;
  formFields.innerHTML = config.fields.map(renderField).join("");
  betaForm.reset();
  modalBackdrop.hidden = false;
  document.body.classList.add("modal-open");
  const firstInput = formFields.querySelector("input, textarea");
  firstInput?.focus();
}

function closeModal() {
  modalBackdrop.hidden = true;
  document.body.classList.remove("modal-open");
}

function renderField(field) {
  const required = field.required ? "required" : "";
  const marker = field.required ? "<span>必填</span>" : "";
  if (field.type === "textarea") {
    return `
      <label class="field">
        <span>${field.label}${marker}</span>
        <textarea name="${field.name}" placeholder="${field.placeholder || ""}" ${required}></textarea>
      </label>
    `;
  }
  return `
    <label class="field">
      <span>${field.label}${marker}</span>
      <input name="${field.name}" placeholder="${field.placeholder || ""}" ${required} />
    </label>
  `;
}

async function handleSubmit(event) {
  event.preventDefault();
  const config = formConfigs[state.activeType];
  const formData = new FormData(betaForm);
  const record = Object.fromEntries(formData.entries());
  record.id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
  record.type = state.activeType;
  record.typeLabel = config.typeLabel;
  record.status = "新提交";
  record.createdAt = new Date().toISOString();
  delete record.consent;

  const records = [record, ...getRecords()];
  saveRecords(records);
  const sent = await submitToNetlify(config.netlifyName, record);
  closeModal();
  renderAll();
  showToast(sent ? `${config.typeLabel}已提交，Netlify 后台可查看` : `${config.typeLabel}已本机保存；上线到 Netlify 后会进入后台`);
}

async function submitToNetlify(formName, record) {
  if (!["http:", "https:"].includes(window.location.protocol)) return false;

  const body = new URLSearchParams();
  body.set("form-name", formName);
  Object.entries(record).forEach(([key, value]) => {
    if (["id", "type", "typeLabel", "status"].includes(key)) return;
    body.set(key, value || "");
  });

  try {
    const response = await fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString()
    });
    return response.ok;
  } catch {
    return false;
  }
}

function renderAll() {
  const records = getRecords();
  renderCounts(records);
  renderFeed(records);
  renderRecords(records);
}

function renderCounts(records) {
  const queue = records.filter((record) => record.status !== "已进入策展").length;
  document.querySelector("#queueCount").textContent = queue;
  document.querySelector("#draftCount").textContent = records.filter((record) => record.status === "新提交").length;
  document.querySelector("#reviewCount").textContent = records.filter((record) => record.status === "审核中").length;
  document.querySelector("#doneCount").textContent = records.filter((record) => record.status === "已进入策展").length;
}

function renderFeed(records) {
  const feed = document.querySelector("#curationFeed");
  const visible = records.slice(0, 4);
  if (!visible.length) {
    feed.innerHTML = `
      <div class="empty-state">
        <strong>还没有提交内容</strong>
        <p>提交病例、挂号或悬赏后，这里会出现策展流。</p>
      </div>
    `;
    return;
  }

  feed.innerHTML = visible.map((record, index) => `
    <div class="case-item ${index === 0 ? "highlighted" : ""}">
      <div>
        <strong>${escapeHtml(record.title || "未命名提交")}</strong>
        <p>${escapeHtml(record.question || record.summary || "等待补充描述")}</p>
      </div>
      <span>${record.status}</span>
    </div>
  `).join("");
}

function renderRecords(records) {
  const list = document.querySelector("#recordList");
  const filtered = records.filter((record) => {
    const matchType = state.filter === "all" || record.type === state.filter;
    const haystack = `${record.title || ""} ${record.typeLabel || ""} ${record.question || ""} ${record.summary || ""}`.toLowerCase();
    const matchQuery = !state.query || haystack.includes(state.query.toLowerCase());
    return matchType && matchQuery;
  });

  if (!filtered.length) {
    list.innerHTML = `
      <div class="empty-state">
        <strong>没有匹配记录</strong>
        <p>提交一次表单，或切换筛选条件查看记录。</p>
      </div>
    `;
    return;
  }

  list.innerHTML = filtered.map((record) => `
    <article class="record-card">
      <div>
        <span class="pill">${record.typeLabel}</span>
        <h3>${escapeHtml(record.title || "未命名提交")}</h3>
        <p>${escapeHtml(record.question || record.summary || "暂无详细描述")}</p>
        <small>${formatDate(record.createdAt)}</small>
      </div>
      <div class="record-actions">
        <span class="status-badge">${record.status}</span>
        <button type="button" class="ghost-button small" data-advance="${record.id}">演示流转</button>
      </div>
    </article>
  `).join("");
}

function advanceStatus(id) {
  const records = getRecords();
  const order = ["新提交", "审核中", "已进入策展"];
  const nextRecords = records.map((record) => {
    if (record.id !== id) return record;
    const current = order.indexOf(record.status);
    return { ...record, status: order[(current + 1) % order.length] };
  });
  saveRecords(nextRecords);
  renderAll();
}

function seedDemoRecords() {
  const records = getRecords();
  const hasDemo = records.some((record) => String(record.id).startsWith("demo-"));
  if (hasDemo) {
    showToast("演示数据已经存在");
    return;
  }
  saveRecords([...demoRecords, ...records]);
  renderAll();
  showToast("已生成演示数据");
}

function clearRecords() {
  if (!confirm("确认清空当前记录？")) return;
  saveRecords([]);
  renderAll();
  showToast("记录已清空");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2200);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.querySelectorAll("[data-open-modal]").forEach((button) => {
  button.addEventListener("click", () => openModal(button.dataset.openModal));
});

document.querySelector("#closeModal").addEventListener("click", closeModal);
document.querySelector("#cancelForm").addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", (event) => {
  if (event.target === modalBackdrop) closeModal();
});
betaForm.addEventListener("submit", handleSubmit);

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    state.filter = tab.dataset.filter;
    renderRecords(getRecords());
  });
});

document.querySelector("#recordList").addEventListener("click", (event) => {
  const button = event.target.closest("[data-advance]");
  if (button) advanceStatus(button.dataset.advance);
});

document.querySelector("#globalSearch").addEventListener("input", (event) => {
  state.query = event.target.value.trim();
  renderRecords(getRecords());
});

document.querySelector("#seedDemo").addEventListener("click", seedDemoRecords);
document.querySelector("#clearRecords").addEventListener("click", clearRecords);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modalBackdrop.hidden) closeModal();
});

document.querySelectorAll(".hero-card, .glass-card, .panel, .record-card, .anatomy-stage, .paper-chip").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    card.style.setProperty("--mx", `${(x / rect.width) * 100}%`);
    card.style.setProperty("--my", `${(y / rect.height) * 100}%`);
    card.style.setProperty("--tx", `${(x / rect.width - 0.5) * 10}px`);
    card.style.setProperty("--ty", `${(y / rect.height - 0.5) * 10}px`);
  });
  card.addEventListener("pointerleave", () => {
    card.style.removeProperty("--tx");
    card.style.removeProperty("--ty");
  });
});

const anatomyStage = document.querySelector("#anatomyStage");
document.querySelectorAll(".paper-chip").forEach((chip) => {
  const activate = () => {
    document.querySelectorAll(".paper-chip").forEach((item) => item.classList.remove("active"));
    chip.classList.add("active");
    anatomyStage.dataset.active = chip.dataset.focus;
  };
  chip.addEventListener("mouseenter", activate);
  chip.addEventListener("focus", activate);
  chip.addEventListener("click", activate);
});

renderAll();
