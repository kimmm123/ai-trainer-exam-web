const bankMetaEl = document.getElementById('bankMeta');
const setupSummaryEl = document.getElementById('setupSummary');

const setupPanel = document.getElementById('setupPanel');
const examPanel = document.getElementById('examPanel');
const resultPanel = document.getElementById('resultPanel');

const scopeSelect = document.getElementById('scopeSelect');
const modeSelect = document.getElementById('modeSelect');
const chapterSelect = document.getElementById('chapterSelect');
const judgeCountInput = document.getElementById('judgeCount');
const singleCountInput = document.getElementById('singleCount');
const durationInput = document.getElementById('duration');
const orderSelect = document.getElementById('orderSelect');

const startBtn = document.getElementById('startBtn');
const loadWrongBtn = document.getElementById('loadWrongBtn');
const clearWrongBtn = document.getElementById('clearWrongBtn');

const progressEl = document.getElementById('progress');
const answeredCountEl = document.getElementById('answeredCount');
const timerEl = document.getElementById('timer');
const qMetaEl = document.getElementById('qMeta');
const questionTextEl = document.getElementById('questionText');
const optionsEl = document.getElementById('options');

const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const jumpInput = document.getElementById('jumpInput');
const jumpBtn = document.getElementById('jumpBtn');

const scoreLineEl = document.getElementById('scoreLine');
const scoreGridEl = document.getElementById('scoreGrid');
const reviewWrongBtn = document.getElementById('reviewWrongBtn');
const restartBtn = document.getElementById('restartBtn');
const wrongListEl = document.getElementById('wrongList');

const STORAGE_WRONG = 'ai4_wrong_book_v1';

let bank = [];
let examList = [];
let cursor = 0;
let answers = {};
let timerId = null;
let remainingSeconds = 0;
let submitted = false;
let lastResult = null;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function getWrongBook() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_WRONG) || '[]');
  } catch {
    return [];
  }
}

function setWrongBook(items) {
  localStorage.setItem(STORAGE_WRONG, JSON.stringify(items));
}

function mergeWrongItems(newItems) {
  const old = getWrongBook();
  const map = new Map();
  [...old, ...newItems].forEach((q) => {
    map.set(`${q.type}-${q.id}`, q);
  });
  setWrongBook([...map.values()]);
}

function applyModeDefaults() {
  const m = modeSelect.value;
  if (m === 'exam200') {
    judgeCountInput.value = 50;
    singleCountInput.value = 150;
  }
  if (m === 'judgeOnly') {
    judgeCountInput.value = 50;
    singleCountInput.value = 0;
  }
  if (m === 'singleOnly') {
    judgeCountInput.value = 0;
    singleCountInput.value = 150;
  }
}

function filterChapter(list, chapter) {
  if (!chapter || chapter === 'all') return list;
  return list.filter((q) => q.chapter === chapter);
}

function filterScope(list, scope) {
  if (scope === 'official') return list.filter((q) => q.answer_source === 'official');
  if (scope === 'heuristic') return list.filter((q) => q.answer_source === 'heuristic');
  return list;
}

function buildPaperFromBank(source, judgeCount, singleCount, order) {
  const judgePool = source.filter((q) => q.type === 'judge');
  const singlePool = source.filter((q) => q.type === 'single');
  const jCount = Math.min(judgeCount, judgePool.length);
  const sCount = Math.min(singleCount, singlePool.length);

  const jSelected = order === 'random'
    ? shuffle(judgePool).slice(0, jCount)
    : [...judgePool].sort((a, b) => a.id - b.id).slice(0, jCount);

  const sSelected = order === 'random'
    ? shuffle(singlePool).slice(0, sCount)
    : [...singlePool].sort((a, b) => a.id - b.id).slice(0, sCount);

  return [...jSelected, ...sSelected];
}

function renderSetupSummary() {
  const chapterList = filterChapter(bank, chapterSelect.value);
  const scopeList = filterScope(chapterList, scopeSelect.value);
  const j = scopeList.filter((q) => q.type === 'judge').length;
  const s = scopeList.filter((q) => q.type === 'single').length;
  const official = scopeList.filter((q) => q.answer_source === 'official').length;
  const heuristic = scopeList.length - official;
  setupSummaryEl.textContent = `当前范围可用：判断 ${j} 题，单选 ${s} 题，共 ${scopeList.length} 题。官方答案 ${official}，推断答案 ${heuristic}。`;
}

function updateAnsweredCount() {
  answeredCountEl.textContent = Object.keys(answers).length;
}

function renderQuestion() {
  const q = examList[cursor];
  if (!q) return;

  progressEl.textContent = `第 ${cursor + 1} / ${examList.length} 题`;
  qMetaEl.innerHTML = `题型：${q.type === 'judge' ? '判断题' : '单选题'} | 题号：${q.id} | 答案来源：${q.answer_source === 'official' ? '官方' : '推断'} | 置信度：${q.confidence}`;
  questionTextEl.textContent = q.question;

  optionsEl.innerHTML = '';
  const selected = answers[q.uid];

  if (q.type === 'judge') {
    ['√', '×'].forEach((opt) => {
      const el = document.createElement('div');
      el.className = `opt ${selected === opt ? 'selected' : ''}`;
      el.innerHTML = `<div class="letter">${opt}</div><div>${opt === '√' ? '正确' : '错误'}</div>`;
      el.onclick = () => {
        answers[q.uid] = opt;
        renderQuestion();
        updateAnsweredCount();
      };
      optionsEl.appendChild(el);
    });
  } else {
    ['A', 'B', 'C', 'D'].forEach((k) => {
      const el = document.createElement('div');
      el.className = `opt ${selected === k ? 'selected' : ''}`;
      el.innerHTML = `<div class="letter">${k}</div><div>${q.options[k]}</div>`;
      el.onclick = () => {
        answers[q.uid] = k;
        renderQuestion();
        updateAnsweredCount();
      };
      optionsEl.appendChild(el);
    });
  }
}

function hideAllPanels() {
  setupPanel.classList.add('hidden');
  examPanel.classList.add('hidden');
  resultPanel.classList.add('hidden');
}

function startTimer(minutes) {
  remainingSeconds = Math.max(1, Math.floor(minutes * 60));
  timerEl.textContent = formatTime(remainingSeconds);

  clearInterval(timerId);
  timerId = setInterval(() => {
    remainingSeconds -= 1;
    timerEl.textContent = formatTime(Math.max(0, remainingSeconds));
    if (remainingSeconds <= 0) {
      clearInterval(timerId);
      if (!submitted) submitExam(true);
    }
  }, 1000);
}

function startExamWithList(list, minutes) {
  submitted = false;
  examList = list.map((q) => ({ ...q, uid: `${q.type}-${q.id}` }));
  answers = {};
  cursor = 0;

  hideAllPanels();
  examPanel.classList.remove('hidden');

  updateAnsweredCount();
  renderQuestion();
  startTimer(minutes);
}

function startExam() {
  const chapterList = filterChapter(bank, chapterSelect.value);
  const scopeList = filterScope(chapterList, scopeSelect.value);
  let judgeCount = Number(judgeCountInput.value || 0);
  let singleCount = Number(singleCountInput.value || 0);

  if (modeSelect.value === 'exam200') {
    judgeCount = 50;
    singleCount = 150;
  }
  if (modeSelect.value === 'judgeOnly') {
    singleCount = 0;
  }
  if (modeSelect.value === 'singleOnly') {
    judgeCount = 0;
  }

  const paper = buildPaperFromBank(scopeList, judgeCount, singleCount, orderSelect.value);
  if (!paper.length) {
    alert('当前配置下没有可用题目，请调整范围或题量。');
    return;
  }

  const minutes = Number(durationInput.value || 90);
  startExamWithList(paper, minutes);
}

function submitExam(isAuto = false) {
  if (submitted) return;
  submitted = true;
  clearInterval(timerId);

  let correct = 0;
  let judgeCorrect = 0;
  let singleCorrect = 0;
  let officialTotal = 0;
  let officialCorrect = 0;
  let heuristicTotal = 0;
  let heuristicCorrect = 0;

  const wrong = [];

  examList.forEach((q) => {
    const user = answers[q.uid] || '';
    const ok = user === q.answer;
    if (ok) {
      correct += 1;
      if (q.type === 'judge') judgeCorrect += 1;
      if (q.type === 'single') singleCorrect += 1;
      if (q.answer_source === 'official') officialCorrect += 1;
      if (q.answer_source === 'heuristic') heuristicCorrect += 1;
    } else {
      wrong.push({ ...q, userAnswer: user || '未作答' });
    }

    if (q.answer_source === 'official') officialTotal += 1;
    else heuristicTotal += 1;
  });

  const total = examList.length;
  const score = (correct / total) * 100;
  const judgeTotal = examList.filter((q) => q.type === 'judge').length;
  const singleTotal = examList.filter((q) => q.type === 'single').length;

  mergeWrongItems(wrong);

  lastResult = {
    total,
    correct,
    wrongCount: wrong.length,
    score,
    judgeTotal,
    singleTotal,
    judgeCorrect,
    singleCorrect,
    officialTotal,
    officialCorrect,
    heuristicTotal,
    heuristicCorrect,
    wrong,
    auto: isAuto,
  };

  renderResult();
}

function renderResult() {
  hideAllPanels();
  resultPanel.classList.remove('hidden');

  const r = lastResult;
  scoreLineEl.textContent = `${r.auto ? '时间到自动交卷，' : ''}总分 ${r.score.toFixed(1)} 分（${r.correct}/${r.total}）`;

  scoreGridEl.innerHTML = '';
  const cards = [
    ['判断题正确', `${r.judgeCorrect} / ${r.judgeTotal}`],
    ['单选题正确', `${r.singleCorrect} / ${r.singleTotal}`],
    ['官方答案题正确', `${r.officialCorrect} / ${r.officialTotal}`],
    ['推断答案题正确', `${r.heuristicCorrect} / ${r.heuristicTotal}`],
  ];

  cards.forEach(([k, v]) => {
    const card = document.createElement('div');
    card.className = 'scoreCard';
    card.innerHTML = `<div class="k">${k}</div><div class="v">${v}</div>`;
    scoreGridEl.appendChild(card);
  });

  wrongListEl.innerHTML = '';
}

function renderWrongItems(list) {
  wrongListEl.innerHTML = '';
  if (!list.length) {
    wrongListEl.innerHTML = '<div class="hint">没有错题，做得很好。</div>';
    return;
  }

  list.forEach((q, idx) => {
    const item = document.createElement('div');
    item.className = 'wrongItem';

    let optionsHtml = '';
    if (q.type === 'single') {
      optionsHtml = ['A', 'B', 'C', 'D'].map((k) => `<div>${k}. ${q.options[k]}</div>`).join('');
    } else {
      optionsHtml = '<div>√. 正确</div><div>×. 错误</div>';
    }

    const sourceBadge = q.answer_source === 'official'
      ? '<span class="badge official">官方答案</span>'
      : '<span class="badge heuristic">推断答案</span>';

    const confBadge = q.confidence === 'low'
      ? '<span class="badge low">低置信度</span>'
      : `<span class="badge">${q.confidence === 'high' ? '高置信度' : '中置信度'}</span>`;

    item.innerHTML = `
      <div><strong>${idx + 1}. [${q.type === 'judge' ? '判断' : '单选'} ${q.id}]</strong> ${sourceBadge}${confBadge}</div>
      <div style="margin:8px 0; line-height:1.6;">${q.question}</div>
      <div style="color:#4b5b62; line-height:1.5;">${optionsHtml}</div>
      <div style="margin-top:8px;">你的答案：<strong>${q.userAnswer}</strong>，正确答案：<strong>${q.answer}</strong></div>
    `;
    wrongListEl.appendChild(item);
  });
}

async function init() {
  const resp = await fetch('./data/question_bank.json');
  const data = await resp.json();
  bank = data.questions || [];

  bankMetaEl.textContent = `已加载：判断 ${data.meta.judge_count}，单选 ${data.meta.single_count}，共 ${bank.length} 题`;
  renderSetupSummary();
}

startBtn.onclick = startExam;
scopeSelect.onchange = renderSetupSummary;
chapterSelect.onchange = renderSetupSummary;
modeSelect.onchange = () => {
  applyModeDefaults();
  renderSetupSummary();
};

prevBtn.onclick = () => {
  if (cursor > 0) cursor -= 1;
  renderQuestion();
};

nextBtn.onclick = () => {
  if (cursor < examList.length - 1) cursor += 1;
  renderQuestion();
};

jumpBtn.onclick = () => {
  const n = Number(jumpInput.value || 0);
  if (!Number.isInteger(n) || n < 1 || n > examList.length) {
    alert('请输入有效序号');
    return;
  }
  cursor = n - 1;
  renderQuestion();
};

submitBtn.onclick = () => {
  const unanswered = examList.length - Object.keys(answers).length;
  const ok = confirm(unanswered > 0 ? `还有 ${unanswered} 题未作答，确认交卷？` : '确认交卷？');
  if (ok) submitExam(false);
};

reviewWrongBtn.onclick = () => {
  if (!lastResult) return;
  renderWrongItems(lastResult.wrong);
};

restartBtn.onclick = () => {
  hideAllPanels();
  setupPanel.classList.remove('hidden');
  renderSetupSummary();
};

loadWrongBtn.onclick = () => {
  const wrong = getWrongBook();
  if (!wrong.length) {
    alert('错题本为空。');
    return;
  }
  const order = orderSelect.value;
  const list = order === 'random' ? shuffle(wrong) : [...wrong].sort((a, b) => (a.type === b.type ? a.id - b.id : a.type.localeCompare(b.type)));
  startExamWithList(list, Number(durationInput.value || 90));
};

clearWrongBtn.onclick = () => {
  const ok = confirm('确认清空错题本？');
  if (!ok) return;
  setWrongBook([]);
  alert('错题本已清空。');
};

window.addEventListener('beforeunload', (e) => {
  if (!submitted && !setupPanel.classList.contains('hidden')) return;
  if (!submitted && !examPanel.classList.contains('hidden')) {
    e.preventDefault();
    e.returnValue = '';
  }
});

init().catch((err) => {
  console.error(err);
  bankMetaEl.textContent = '题库加载失败，请检查 data/question_bank.json';
});
