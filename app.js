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
      { name: "question", label: "关注的功能", type: "textarea", placeholder: "病例复盘、学术挂号、技术悬赏、文献图谱等" }
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
const introLoader = document.querySelector("#introLoader");
const genomeCorridor = document.querySelector(".genome-corridor");
const rotatingStory = document.querySelector(".rotating-story");
const storyPanels = Array.from(document.querySelectorAll("[data-story-panel]"));
const storyProgressItems = Array.from(document.querySelectorAll(".story-progress span"));
const genomeSections = Array.from(document.querySelectorAll(
  ".genome-corridor .literature-section, .genome-corridor > .section-head, .genome-corridor .workspace-grid, .genome-corridor .records-section"
));

if (introLoader) {
  const finishIntro = () => {
    document.body.classList.remove("intro-playing");
    document.body.classList.add("intro-done");
  };
  introLoader.addEventListener("animationend", (event) => {
    if (event.animationName === "introExit" || event.animationName === "cinematicExit") finishIntro();
  });
  window.setTimeout(finishIntro, 5400);
}

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
  const activeModules = new Set(records
    .filter((record) => ["case", "consult", "bounty"].includes(record.type))
    .map((record) => record.type));
  const bountyTotal = records
    .filter((record) => record.type === "bounty")
    .reduce((sum, record) => sum + parseMoney(record.reward), 0);

  document.querySelector("#queueCount").textContent = queue;
  document.querySelector("#bountyTotal").textContent = formatMoney(bountyTotal);
  document.querySelector("#activeModuleCount").textContent = `${activeModules.size}/3`;
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

function parseMoney(value) {
  const amount = Number(String(value || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

function formatMoney(value) {
  return `¥${Math.round(value).toLocaleString("zh-CN")}`;
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

document.querySelectorAll(".med-moss-landing, .landing-module, .story-panel, .hero-card, .glass-card, .panel, .record-card, .literature-card").forEach((card) => {
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

const medMossLanding = document.querySelector(".med-moss-landing");
if (medMossLanding) {
  medMossLanding.addEventListener("pointermove", (event) => {
    const rect = medMossLanding.getBoundingClientRect();
    const rx = event.clientX - rect.left;
    const ry = event.clientY - rect.top;
    const nx = rx / rect.width - 0.5;
    const ny = ry / rect.height - 0.5;
    medMossLanding.style.setProperty("--branch-x", `${nx * -34}px`);
    medMossLanding.style.setProperty("--branch-y", `${ny * -18}px`);
    medMossLanding.style.setProperty("--branch-r", `${nx * 1.2}deg`);
  });
  medMossLanding.addEventListener("pointerleave", () => {
    medMossLanding.style.removeProperty("--branch-x");
    medMossLanding.style.removeProperty("--branch-y");
    medMossLanding.style.removeProperty("--branch-r");
  });
}

function initMossGrowth() {
  const landing = document.querySelector(".med-moss-landing");
  const canvas = document.querySelector(".moss-growth-canvas");
  if (!landing || !canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let rect = landing.getBoundingClientRect();
  let dpr = 1;

  const resize = () => {
    rect = landing.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
  };

  const drawBlade = (x, y, seed) => {
    const length = 8 + Math.random() * 26;
    const lean = (Math.random() - 0.5) * 18;
    const hue = 92 + Math.random() * 70;
    const alpha = 0.18 + Math.random() * 0.42;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = `hsl(${hue} 48% ${28 + Math.random() * 28}%)`;
    ctx.lineWidth = 0.7 + Math.random() * 1.6;
    ctx.lineCap = "round";
    ctx.shadowColor = "rgba(120, 210, 116, 0.34)";
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + lean * 0.45, y - length * 0.56, x + lean, y - length);
    ctx.stroke();
    if (seed % 4 === 0) {
      ctx.fillStyle = "rgba(139, 232, 209, 0.22)";
      ctx.beginPath();
      ctx.arc(x + lean, y - length, 1.5 + Math.random() * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const growAt = (clientX, clientY) => {
    rect = landing.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const lowerZone = y > rect.height * 0.42;
    if (!lowerZone) return;

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    const patch = ctx.createRadialGradient(x, y, 0, x, y, 52);
    patch.addColorStop(0, "rgba(80, 136, 60, 0.2)");
    patch.addColorStop(0.45, "rgba(116, 188, 88, 0.12)");
    patch.addColorStop(1, "rgba(116, 188, 88, 0)");
    ctx.fillStyle = patch;
    ctx.beginPath();
    ctx.arc(x, y, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    for (let i = 0; i < 26; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 34;
      drawBlade(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius * 0.42 + 10, i);
    }
  };

  let lastDraw = 0;
  landing.addEventListener("pointermove", (event) => {
    const now = performance.now();
    if (now - lastDraw < 22) return;
    lastDraw = now;
    growAt(event.clientX, event.clientY);
  });

  landing.addEventListener("pointerenter", (event) => {
    growAt(event.clientX, event.clientY);
  });

  window.addEventListener("resize", resize);
  resize();
}

function initParticleDna() {
  const canvas = document.querySelector("[data-particle-dna]");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    particles = Array.from({ length: 2400 }, (_, index) => ({
      index,
      u: Math.random(),
      side: index % 2 === 0 ? 0 : Math.PI,
      spread: Math.random() ** 1.7,
      jitter: Math.random() * Math.PI * 2,
      size: 0.35 + Math.random() * 2.2,
      warm: Math.random() > 0.54,
      cloud: Math.random() > 0.36,
      offsetX: Math.random() - 0.5,
      offsetY: Math.random() - 0.5
    }));
  };

  const particleColor = (warm, alpha) => (
    warm
      ? `rgba(230, 103, 78, ${alpha})`
      : `rgba(70, 205, 232, ${alpha})`
  );

  const draw = (time) => {
    const t = time * 0.001;
    const progress = Number.parseFloat(genomeCorridor?.style.getPropertyValue("--corridor-progress")) || 0;
    ctx.clearRect(0, 0, width, height);

    const cx = width * 0.5;
    const cy = height * (0.48 - progress * 0.1);
    const dnaHeight = height * 1.28;
    const amp = Math.min(width * 0.16, 270);
    const turns = 2.72;

    const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(width, height) * 0.55);
    halo.addColorStop(0, "rgba(80, 210, 230, 0.18)");
    halo.addColorStop(0.44, "rgba(12, 37, 52, 0.18)");
    halo.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    particles.forEach((p) => {
      const u = (p.u + progress * 0.14 + Math.sin(t * 0.08 + p.jitter) * 0.01) % 1;
      const y = cy - dnaHeight / 2 + u * dnaHeight;
      const phase = u * Math.PI * 2 * turns + t * 0.18 + p.side;
      const depth = (Math.cos(phase) + 1) / 2;
      const radius = amp * (0.38 + depth * 0.84);
      const cloud = p.cloud ? 1 : 0.28;
      const scatter = p.offsetX * (42 + depth * 118) * cloud;
      const x = cx + Math.sin(phase) * radius + scatter;
      const yy = y + Math.cos(phase) * 26 + Math.sin(t + p.jitter) * 5 + p.offsetY * 52 * cloud;
      if (yy < -80 || yy > height + 80) return;

      const alpha = 0.1 + depth * 0.68;
      ctx.fillStyle = particleColor(p.warm, alpha);
      ctx.shadowColor = particleColor(p.warm, 0.55);
      ctx.shadowBlur = 12 + depth * 22;
      ctx.beginPath();
      ctx.arc(x, yy, p.size * (0.55 + depth), 0, Math.PI * 2);
      ctx.fill();
    });

    for (let i = 0; i < 58; i += 1) {
      const u = (i / 38 + progress * 0.12 + t * 0.01) % 1;
      const phase = u * Math.PI * 2 * turns + t * 0.18;
      const y = cy - dnaHeight / 2 + u * dnaHeight;
      const x1 = cx + Math.sin(phase) * amp;
      const x2 = cx + Math.sin(phase + Math.PI) * amp;
      const alpha = 0.06 + ((Math.cos(phase) + 1) / 2) * 0.18;
      ctx.strokeStyle = `rgba(128, 230, 238, ${alpha})`;
      ctx.lineWidth = 1.2;
      ctx.shadowColor = "rgba(96, 224, 244, 0.28)";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y + Math.cos(phase) * 28);
      ctx.stroke();
    }

    ctx.restore();
    requestAnimationFrame(draw);
  };

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(draw);
}

function updateStoryPanels() {
  if (genomeCorridor) {
    const corridorRect = genomeCorridor.getBoundingClientRect();
    const corridorTravel = Math.max(1, corridorRect.height - window.innerHeight);
    const corridorProgress = Math.min(1, Math.max(0, -corridorRect.top / corridorTravel));
    genomeCorridor.style.setProperty("--corridor-progress", corridorProgress.toFixed(3));
  }

  if (!rotatingStory || !storyPanels.length) return;
  const rect = rotatingStory.getBoundingClientRect();
  const travel = Math.max(1, rect.height - window.innerHeight);
  const progress = Math.min(1, Math.max(0, -rect.top / travel));
  const panelProgress = progress * (storyPanels.length - 1);
  const activeIndex = Math.round(panelProgress);
  const isCompact = window.innerWidth < 760;

  storyPanels.forEach((panel, index) => {
    const rawOffset = index - panelProgress;
    const offset = wrapStoryOffset(rawOffset, storyPanels.length);
    const distance = Math.abs(offset);
    const translateX = isCompact ? offset * 14 : offset * 118;
    const rotateX = offset * -4;
    const rotateY = isCompact ? 0 : offset * -3.5;
    const translateY = offset * (isCompact ? 280 : 330);
    const translateZ = -distance * (isCompact ? 120 : 280);
    const scale = Math.max(0.64, 1 - distance * 0.12);
    const opacity = Math.max(0.06, 1 - distance * 0.58);
    const blur = Math.min(distance * 4.5, 10);

    panel.style.transform = `translate(-50%, -50%) translate3d(${translateX}px, ${translateY}px, ${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;
    panel.style.opacity = opacity.toFixed(2);
    panel.style.filter = `blur(${blur.toFixed(1)}px)`;
    panel.style.zIndex = String(25 - Math.round(distance * 5));
    panel.classList.toggle("active", index === activeIndex);
    panel.setAttribute("aria-hidden", distance > 1.75 ? "true" : "false");
  });

  storyProgressItems.forEach((item, index) => {
    item.classList.toggle("active", index === activeIndex);
  });
}

function wrapStoryOffset(value, count) {
  const half = count / 2;
  let wrapped = ((value + half) % count + count) % count - half;
  if (wrapped === -half && value > 0) wrapped = half;
  return wrapped;
}

window.addEventListener("scroll", updateStoryPanels, { passive: true });
window.addEventListener("resize", updateStoryPanels);

if ("IntersectionObserver" in window) {
  const genomeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("genome-section-active", entry.isIntersecting);
    });
  }, { threshold: 0.18 });
  genomeSections.forEach((section) => genomeObserver.observe(section));
} else {
  genomeSections.forEach((section) => section.classList.add("genome-section-active"));
}

document.querySelectorAll(".literature-card").forEach((card) => {
  const activate = () => {
    document.querySelectorAll(".literature-card").forEach((item) => item.classList.remove("active"));
    card.classList.add("active");
  };
  card.addEventListener("mouseenter", activate);
  card.addEventListener("focus", activate);
  card.addEventListener("click", activate);
});

renderAll();
updateStoryPanels();
initMossGrowth();
initParticleDna();
