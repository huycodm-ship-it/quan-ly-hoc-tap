const KEY = 'studyDashboardDataV6';
const DEFAULT_SUBJECTS = [
  { key: 'toan', name: 'Toán học', icon: '∑', tag: 'Tư duy', description: 'Ôn luyện công thức, bài tập và kỹ năng giải quyết vấn đề.', custom: false },
  { key: 'ly', name: 'Vật lý', icon: '⚡', tag: 'Khám phá', description: 'Tìm hiểu các quy luật tự nhiên qua lý thuyết và thí nghiệm.', custom: false },
  { key: 'hoa', name: 'Hóa học', icon: '⚗', tag: 'Thực hành', description: 'Ghi nhớ phản ứng, nguyên tố và vận dụng vào bài tập.', custom: false }
];
const defaultData = { name: 'Bạn', subjects: DEFAULT_SUBJECTS, progress: { toan: 0, ly: 0, hoa: 0 }, studyDuration: 3, studyUnit: 'minutes', studyDurationSeconds: 180, activeSession: null, studySeconds: { toan: 0, ly: 0, hoa: 0 } };
let studyTimer = null;

function getData() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    const data = { ...defaultData, ...saved, subjects: Array.isArray(saved.subjects) ? saved.subjects : DEFAULT_SUBJECTS, progress: { ...defaultData.progress, ...(saved.progress || {}) }, studySeconds: { ...defaultData.studySeconds, ...(saved.studySeconds || {}) } };
    data.subjects.forEach(subject => { if (data.progress[subject.key] === undefined) data.progress[subject.key] = 0; if (data.studySeconds[subject.key] === undefined) data.studySeconds[subject.key] = 0 });
    return data;
  } catch { return JSON.parse(JSON.stringify(defaultData)) }
}
function saveData(data) { localStorage.setItem(KEY, JSON.stringify(data)) }
function subjectLabel(key) { const subject = getData().subjects.find(item => item.key === key); return subject ? subject.name : 'Môn học' }
function escapeHTML(value) { return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])) }
function toast(message) { const element = document.querySelector('.toast'); if (!element) return; element.textContent = message; element.classList.add('show'); setTimeout(() => element.classList.remove('show'), 2200) }
function updateHeader() { const data = getData(); document.querySelectorAll('[data-user]').forEach(element => element.textContent = data.name || 'Bạn') }
function formatTime(total) { total = Math.max(0, Math.floor(total)); return [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60].map(value => String(value).padStart(2, '0')).join(':') }

function renderCustomSubjects() {
  const container = document.querySelector('#mon-hoc'); const addCard = document.querySelector('#addSubjectCard'); if (!container || !addCard) return;
  container.querySelectorAll('[data-custom-subject]').forEach(card => card.remove());
  getData().subjects.filter(subject => subject.custom).forEach(subject => {
    const card = document.createElement('article'); card.className = 'subject'; card.dataset.subject = subject.key; card.dataset.customSubject = 'true';
    card.innerHTML = `<div class="subject-top"><div class="subject-icon">${escapeHTML(subject.icon)}</div><span class="tag">${escapeHTML(subject.tag)}</span></div><h2>${escapeHTML(subject.name)}</h2><p>${escapeHTML(subject.description)}</p><div class="progress-head"><span>Tiến độ</span><span data-value>0%</span></div><div class="bar"><span></span></div><div class="subject-actions"><button class="primary" type="button" data-study-button data-subject-key="${escapeHTML(subject.key)}">Bắt đầu học</button></div>`;
    container.insertBefore(card, addCard);
  });
}

function addSubject(event) {
  event.preventDefault(); const name = document.querySelector('#newSubjectName').value.trim(); const description = document.querySelector('#newSubjectDescription').value.trim(); const icon = document.querySelector('#newSubjectIcon').value.trim() || '📘'; const tag = document.querySelector('#newSubjectTag').value.trim() || 'Tự học';
  if (!name || !description) { toast('Vui lòng nhập tên và mô tả môn học'); return }
  const data = getData(); const key = 'custom_' + Date.now(); data.subjects.push({ key, name, icon, tag, description, custom: true }); data.progress[key] = 0; data.studySeconds[key] = 0; saveData(data);
  closeSubjectModal(); renderCustomSubjects(); updateHome(); toast('Đã thêm môn ' + name); event.target.reset(); document.querySelector('#newSubjectIcon').value = '📘'; document.querySelector('#newSubjectTag').value = 'Tự học';
}
function openSubjectModal() { document.querySelector('#subjectModal')?.classList.add('show'); document.querySelector('#newSubjectName')?.focus() }
function closeSubjectModal() { document.querySelector('#subjectModal')?.classList.remove('show') }

function saveStudyTime() {
  const input = document.querySelector('#studyDuration'), select = document.querySelector('#studyUnit'); if (!input || !select) return; const duration = Number(input.value), unit = select.value;
  if (!Number.isInteger(duration) || duration < 1) { toast('Vui lòng nhập số nguyên lớn hơn 0'); return }
  if ((unit === 'minutes' && duration > 300) || (unit === 'hours' && duration > 24)) { toast(unit === 'hours' ? 'Thời gian tối đa là 24 giờ' : 'Thời gian tối đa là 300 phút'); return }
  const data = getData(); if (data.activeSession) { toast('Hãy kết thúc môn đang học trước'); updateStudyTimeDisplay(); return }
  data.studyDuration = duration; data.studyUnit = unit; data.studyDurationSeconds = unit === 'hours' ? duration * 3600 : duration * 60; saveData(data); updateStudyTimeDisplay(); toast(`Đã đặt thời gian ${duration} ${unit === 'hours' ? 'giờ' : 'phút'}`);
}
function updateStudyTimeDisplay() { const data = getData(), input = document.querySelector('#studyDuration'), select = document.querySelector('#studyUnit'), text = document.querySelector('#currentStudyTime'); if (input) input.value = data.studyDuration; if (select) select.value = data.studyUnit; if (text) text.textContent = `${data.studyDuration} ${data.studyUnit === 'hours' ? 'giờ' : 'phút'}` }

function synchronizeProgress() {
  const data = getData(); if (!data.activeSession) return data; const session = data.activeSession; const elapsed = Math.floor((Date.now() - session.startTime) / 1000); const ratio = Math.min(1, elapsed / session.totalSeconds); data.progress[session.subject] = Math.min(100, Math.floor(session.startProgress + (100 - session.startProgress) * ratio));
  if (elapsed >= session.totalSeconds) { const key = session.subject; data.progress[key] = 100; data.studySeconds[key] = (data.studySeconds[key] || 0) + session.totalSeconds; data.activeSession = null; if (studyTimer) { clearInterval(studyTimer); studyTimer = null } toast(`${subjectLabel(key)} đã hoàn thành 100%`) }
  saveData(data); return data;
}
function updateHome() {
  const data = synchronizeProgress(); document.querySelectorAll('[data-subject]').forEach(card => { const key = card.dataset.subject; if (!(key in data.progress)) return; const value = data.progress[key] || 0; const bar = card.querySelector('.bar span'), text = card.querySelector('[data-value]'); if (bar) bar.style.width = value + '%'; if (text) text.textContent = value + '%' });
  const values = data.subjects.map(subject => data.progress[subject.key] || 0); const avg = document.querySelector('#avg'); if (avg) avg.textContent = (values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0) + '%'; updateStudyButtons();
}
function updateStudyButtons() {
  const data = getData(); document.querySelectorAll('[data-study-button]').forEach(button => { const key = button.dataset.subjectKey; if (!data.activeSession) { button.textContent = (data.progress[key] || 0) >= 100 ? 'Đã hoàn thành' : 'Bắt đầu học'; button.disabled = (data.progress[key] || 0) >= 100; return } if (data.activeSession.subject === key) { const remaining = Math.max(0, data.activeSession.totalSeconds - Math.floor((Date.now() - data.activeSession.startTime) / 1000)); button.textContent = 'Kết thúc • Còn ' + formatTime(remaining); button.disabled = false } else { button.textContent = 'Đang học môn khác'; button.disabled = true } });
}
function startStudy(key) {
  const data = getData(); if (data.activeSession) { toast('Bạn đang học một môn khác'); return } if ((data.progress[key] || 0) >= 100) { toast(subjectLabel(key) + ' đã hoàn thành'); return }
  data.activeSession = { subject: key, startTime: Date.now(), startProgress: data.progress[key] || 0, totalSeconds: data.studyDurationSeconds, studyDuration: data.studyDuration, studyUnit: data.studyUnit }; saveData(data); toast(`Bắt đầu học ${subjectLabel(key)} trong ${data.studyDuration} ${data.studyUnit === 'hours' ? 'giờ' : 'phút'}`); startRealtimeTimer(); updateHome();
}
function endStudy() {
  let data = synchronizeProgress(); if (!data.activeSession) return; const session = data.activeSession; data.studySeconds[session.subject] = (data.studySeconds[session.subject] || 0) + Math.floor((Date.now() - session.startTime) / 1000); const name = subjectLabel(session.subject); data.activeSession = null; saveData(data); if (studyTimer) { clearInterval(studyTimer); studyTimer = null } updateHome(); updateDashboard(); toast('Đã kết thúc học ' + name);
}
function startRealtimeTimer() { if (studyTimer) clearInterval(studyTimer); studyTimer = setInterval(() => { updateHome(); updateDashboard(); if (!getData().activeSession) { clearInterval(studyTimer); studyTimer = null } }, 1000) }

function renderDashboardSubjects(data) {
  const chart = document.querySelector('.bars-chart'), legend = document.querySelector('.legend'); if (!chart || !legend) return;
  chart.querySelectorAll('[data-dynamic-dashboard]').forEach(item => item.remove()); legend.querySelectorAll('[data-dynamic-dashboard]').forEach(item => item.remove());
  data.subjects.filter(subject => subject.custom).forEach(subject => { const column = document.createElement('div'); column.className = 'chart-col'; column.dataset.dynamicDashboard = 'true'; column.innerHTML = `<div class="chart-bar" data-chart="${escapeHTML(subject.key)}"></div><span>${escapeHTML(subject.name)}</span>`; chart.appendChild(column); const row = document.createElement('div'); row.className = 'legend-row'; row.dataset.dynamicDashboard = 'true'; row.innerHTML = `<span>${escapeHTML(subject.name)}</span><span data-score="${escapeHTML(subject.key)}">0%</span>`; legend.appendChild(row) });
}
function updateDashboard() {
  if (!document.querySelector('#dashboard')) return; const data = synchronizeProgress(); renderDashboardSubjects(data); const values = data.subjects.map(subject => data.progress[subject.key] || 0); const average = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  const overall = document.querySelector('#overall'), ringOverall = document.querySelector('#ringOverall'), ring = document.querySelector('.ring'); if (overall) overall.textContent = average + '%'; if (ringOverall) ringOverall.textContent = average + '%'; if (ring) ring.style.setProperty('--pct', average + '%');
  data.subjects.forEach(subject => { const value = data.progress[subject.key] || 0, bar = document.querySelector(`[data-chart="${subject.key}"]`), score = document.querySelector(`[data-score="${subject.key}"]`); if (bar) bar.style.height = value + '%'; if (score) score.textContent = value + '%' });
  const done = document.querySelector('#doneCount'); if (done) { done.textContent = values.filter(value => value >= 100).length; if (done.nextSibling) done.nextSibling.nodeValue = '/' + data.subjects.length } const lessons = document.querySelector('#lessonCount'); if (lessons) lessons.textContent = Math.floor(values.reduce((a, b) => a + b, 0) / 10);
}

document.addEventListener('DOMContentLoaded', () => {
  updateHeader(); renderCustomSubjects(); updateStudyTimeDisplay();
  document.querySelector('#saveStudyTime')?.addEventListener('click', saveStudyTime);
  document.querySelector('#addSubjectCard')?.addEventListener('click', openSubjectModal);
  document.querySelector('#addSubjectCard')?.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openSubjectModal() } });
  document.querySelector('#cancelAddSubject')?.addEventListener('click', closeSubjectModal);
  document.querySelector('#subjectModal')?.addEventListener('click', event => { if (event.target.id === 'subjectModal') closeSubjectModal() });
  document.querySelector('#addSubjectForm')?.addEventListener('submit', addSubject);
  document.addEventListener('click', event => { const button = event.target.closest('[data-study-button]'); if (!button) return; const data = getData(), key = button.dataset.subjectKey; if (data.activeSession?.subject === key) endStudy(); else startStudy(key) });
  const auth = document.querySelector('#authForm'); if (auth) { let signup = false; const title = document.querySelector('#authTitle'), confirmField = document.querySelector('#confirmField'), toggle = document.querySelector('#toggleAuth'), submit = document.querySelector('#authSubmit'); toggle.onclick = () => { signup = !signup; title.textContent = signup ? 'Tạo tài khoản' : 'Đăng nhập'; confirmField.classList.toggle('hidden', !signup); submit.textContent = signup ? 'Tạo tài khoản' : 'Đăng nhập'; toggle.textContent = signup ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký' }; auth.onsubmit = event => { event.preventDefault(); const data = getData(); data.name = document.querySelector('#name').value.trim() || 'Bạn'; saveData(data); location.href = 'home.html' } }
  updateHome(); updateDashboard(); if (getData().activeSession) startRealtimeTimer();
});
