const Store = {

  getUsers() {
    return JSON.parse(localStorage.getItem('il_users') || '[]');
  },
  saveUsers(users) {
    localStorage.setItem('il_users', JSON.stringify(users));
  },

  getSession() {
    return JSON.parse(sessionStorage.getItem('il_session') || 'null');
  },
  setSession(user) {
    sessionStorage.setItem('il_session', JSON.stringify(user));
  },
  clearSession() {
    sessionStorage.removeItem('il_session');
  },

  getWorkouts(username) {
    const all = JSON.parse(localStorage.getItem('il_workouts') || '[]');
    return all.filter(w => w.username === username)
              .sort((a, b) => new Date(b.date) - new Date(a.date));
  },
  saveWorkout(workout) {
    const all = JSON.parse(localStorage.getItem('il_workouts') || '[]');
    all.push(workout);
    localStorage.setItem('il_workouts', JSON.stringify(all));
  },
  deleteWorkout(id) {
    const all = JSON.parse(localStorage.getItem('il_workouts') || '[]');
    localStorage.setItem('il_workouts', JSON.stringify(all.filter(w => w.id !== id)));
  },
};

function makeInitials(name) {
  return name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function totalVolume(workout) {
  return workout.exercises.reduce((sum, ex) => {
    return sum + (parseFloat(ex.weight) || 0) * (parseInt(ex.sets) || 0) * (parseInt(ex.reps) || 0);
  }, 0);
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const months = ['ЯНВ','ФЕВ','МАР','АПР','МАЙ','ИЮН','ИЮЛ','АВГ','СЕН','ОКТ','НОЯ','ДЕК'];
  return { day: d.getDate(), mon: months[d.getMonth()] };
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function greetingTime() {
  const h = new Date().getHours();
  if (h < 12) return 'ДОБРОЕ УТРО';
  if (h < 18) return 'ДОБРЫЙ ДЕНЬ';
  return 'ДОБРЫЙ ВЕЧЕР';
}

function dayOfWeekStr() {
  const days = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
  const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  const d = new Date();
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
}


function handleLogin(e) {
  e?.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const err = document.getElementById('authError');

  if (!username || !password) { showError(err, 'Заполните все поля'); return; }

  const user = Store.getUsers().find(u => u.username === username && u.password === password);
  if (!user) { showError(err, 'Неверный логин или пароль'); return; }

  Store.setSession(user);
  window.location.href = 'dashboard.html';
}

function handleRegister(e) {
  e?.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const err = document.getElementById('authError');

  if (!username || !password) { showError(err, 'Заполните все поля'); return; }
  if (username.length < 3)    { showError(err, 'Логин минимум 3 символа'); return; }
  if (password.length < 4)    { showError(err, 'Пароль минимум 4 символа'); return; }

  const users = Store.getUsers();
  if (users.find(u => u.username === username)) { showError(err, 'Такой логин уже занят'); return; }

  const newUser = { username, password, initials: makeInitials(username) };
  users.push(newUser);
  Store.saveUsers(users);
  Store.setSession(newUser);
  window.location.href = 'dashboard.html';
}

function handleLogout() {
  Store.clearSession();
  window.location.href = 'login.html';
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

function requireAuth() {
  const session = Store.getSession();
  if (!session) { window.location.href = 'login.html'; return null; }
  return session;
}

function redirectIfAuth() {
  if (Store.getSession()) window.location.href = 'dashboard.html';
}



function showTab(tabName, clickedEl) {
  // скрываем все табы
  document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
  // показываем нужный
  const tab = document.getElementById('tab-' + tabName);
  if (tab) tab.style.display = '';

  // синхронизируем ДЕСКТОП навбар
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  // синхронизируем МОБИЛЬНЫЙ bottom nav
  document.querySelectorAll('.bottom-nav-item').forEach(n => n.classList.remove('active'));

  if (clickedEl) {
    clickedEl.classList.add('active');
  } else {
    // активируем по data-tab в обоих навбарах
    const desktopItems = document.querySelectorAll('.nav-item');
    const mobileItems = document.querySelectorAll('.bottom-nav-item');
    [...desktopItems, ...mobileItems].forEach(n => {
      if (n.getAttribute('onclick')?.includes("'" + tabName + "'")) {
        n.classList.add('active');
      }
    });
  }

  if (tabName === 'charts') {
    const user = Store.getSession();
    if (user) renderProgressChart(Store.getWorkouts(user.username));
  }

  if (tabName === 'history') {
    const user = Store.getSession();
    if (user) renderHistoryFull(Store.getWorkouts(user.username));
  }

  const mainEl = document.querySelector('main');
  if (mainEl) mainEl.scrollTop = 0;
  window.scrollTo(0, 0);
}


function initDashboard() {
  const user = requireAuth();
  if (!user) return;

  document.querySelectorAll('.js-username').forEach(el => el.textContent = user.username.toUpperCase());
  document.querySelectorAll('.js-initials').forEach(el => el.textContent = user.initials || makeInitials(user.username));
  document.querySelectorAll('.js-greeting').forEach(el => el.textContent = greetingTime());
  document.querySelectorAll('.js-date').forEach(el => el.textContent = dayOfWeekStr());

  renderAll(user.username);
}

function renderAll(username) {
  const workouts = Store.getWorkouts(username);
  renderStats(workouts);
  renderHistory(workouts);
  renderProgressChart(workouts);
  renderWeekChart(workouts);
  renderRecords(workouts);
  renderStreak(workouts);
}


function renderStats(workouts) {
  const total = workouts.length;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekVol = workouts
    .filter(w => new Date(w.date) >= weekAgo)
    .reduce((s, w) => s + totalVolume(w), 0);

  const streak = calcStreak(workouts);

  let bestBench = 0;
  workouts.forEach(w => {
    w.exercises.forEach(ex => {
      if (/жим\s*лёжа|bench/i.test(ex.name)) {
        const kg = parseFloat(ex.weight) || 0;
        if (kg > bestBench) bestBench = kg;
      }
    });
  });

  setText('statTotal', total);
  setText('statVolume', weekVol >= 1000 ? Math.round(weekVol / 1000) + ' т' : Math.round(weekVol) + ' кг');
  setText('statStreak', streak);
  setText('statBench', bestBench ? bestBench + ' кг' : '—');
}

function calcStreak(workouts) {
  if (!workouts.length) return 0;
  const dates = [...new Set(workouts.map(w => w.date))].sort().reverse();
  let streak = 0;
  let cur = new Date();
  cur.setHours(0,0,0,0);
  for (const d of dates) {
    const wd = new Date(d);
    wd.setHours(0,0,0,0);
    const diff = Math.round((cur - wd) / 86400000);
    if (diff <= 1) { streak++; cur = wd; }
    else break;
  }
  return streak;
}

function workoutItemHTML(w) {
  const { day, mon } = formatDate(w.date);
  const vol = Math.round(totalVolume(w));
  const tags = w.exercises.slice(0, 2).map(ex =>
    `<span class="tag neon">${ex.name} ${ex.weight}кг</span>`
  ).join('');
  return `
    <div class="workout-item">
      <div class="w-date"><div class="day">${day}</div><div class="mon">${mon}</div></div>
      <div class="w-info">
        <div class="w-name">${escHtml(w.name)}</div>
        <div class="w-tags">
          ${tags}
          <span class="tag">${w.exercises.length} упр.</span>
          ${w.duration ? `<span class="tag">${w.duration} мин</span>` : ''}
        </div>
      </div>
      <div class="w-vol">
        <div class="vol-num">${vol.toLocaleString('ru')}</div>
        <div class="vol-kg">кг объём</div>
      </div>
    </div>`;
}

function renderHistory(workouts) {
  const container = document.getElementById('historyList');
  if (!container) return;
  if (!workouts.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🏋️</div>
        <div class="empty-title">Тренировок пока нет</div>
        <div class="empty-sub">Нажми «+ Новая тренировка» — и твой путь начнётся</div>
      </div>`;
    return;
  }
  container.innerHTML = workouts.slice(0, 6).map(workoutItemHTML).join('');
}

function renderHistoryFull(workouts) {
  const container = document.getElementById('historyListFull');
  if (!container) return;
  if (!workouts.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🏋️</div>
        <div class="empty-title">Тренировок пока нет</div>
        <div class="empty-sub">Нажми «+ Новая тренировка» — и твой путь начнётся</div>
      </div>`;
    return;
  }
  container.innerHTML = workouts.map(workoutItemHTML).join('');
}


function renderRecords(workouts) {
  const container = document.getElementById('recordsList');
  if (!container) return;

  const map = {};
  workouts.forEach(w => {
    w.exercises.forEach(ex => {
      const kg = parseFloat(ex.weight) || 0;
      if (!map[ex.name] || kg > map[ex.name].kg) {
        map[ex.name] = { kg, date: w.date };
      }
    });
  });

  const sorted = Object.entries(map).sort((a, b) => b[1].kg - a[1].kg).slice(0, 10);

  if (!sorted.length) {
    container.innerHTML = `<div class="empty-state" style="padding:30px"><div class="empty-icon">🏆</div><div class="empty-title" style="font-size:16px">Нет рекордов</div></div>`;
    return;
  }

  container.innerHTML = sorted.map(([name, { kg, date }]) => {
    const { day, mon } = formatDate(date);
    return `
      <div class="pr-item">
        <div>
          <div class="pr-exer">${escHtml(name)}</div>
          <div class="pr-meta">${day} ${mon}</div>
        </div>
        <div>
          <span class="pr-weight">${kg}</span>
          <span class="pr-unit">кг</span>
        </div>
      </div>`;
  }).join('');
}

function renderStreak(workouts) {
  const streak = calcStreak(workouts);
  setText('streakNum', streak);

  const bars = document.getElementById('streakBars');
  if (!bars) return;

  const trainedDates = new Set(workouts.map(w => w.date));
  let html = '';
  for (let i = 20; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const active = trainedDates.has(key);
    html += `<div style="flex:1;height:6px;border-radius:3px;background:${active ? 'rgba(184,255,87,.85)' : 'var(--s3)'}"></div>`;
  }
  bars.innerHTML = html;
}


let progressChartInst = null;

function renderProgressChart(workouts) {
  const canvas = document.getElementById('progressChart');
  if (!canvas) return;

  const select = document.getElementById('exSelect');
  const keyword = select ? select.value : '';

  const points = {};
  workouts.forEach(w => {
    w.exercises.forEach(ex => {
      if (!keyword || ex.name.toLowerCase().includes(keyword.toLowerCase())) {
        const kg = parseFloat(ex.weight) || 0;
        if (!points[w.date] || kg > points[w.date]) points[w.date] = kg;
      }
    });
  });

  const sorted = Object.entries(points).sort((a, b) => new Date(a[0]) - new Date(b[0]));
  const labels = sorted.map(([d]) => {
    const dt = new Date(d);
    return `${dt.getDate()}.${String(dt.getMonth()+1).padStart(2,'0')}`;
  });
  const data = sorted.map(([, v]) => v);

  const ctx = canvas.getContext('2d');
  if (progressChartInst) { progressChartInst.destroy(); progressChartInst = null; }

  if (!data.length) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(90,90,122,0.4)';
    ctx.font = '14px Barlow, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Добавь тренировки с этим упражнением', canvas.width / 2, canvas.height / 2);
    return;
  }

  const grad = ctx.createLinearGradient(0, 0, 0, 200);
  grad.addColorStop(0, 'rgba(184,255,87,.22)');
  grad.addColorStop(1, 'rgba(184,255,87,0)');

  progressChartInst = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data,
        borderColor: '#b8ff57',
        borderWidth: 2,
        pointBackgroundColor: '#b8ff57',
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        backgroundColor: grad,
        tension: .35,
      }],
    },
    options: chartOptions('кг'),
  });
}

let weekChartInst = null;

function renderWeekChart(workouts) {
  const canvas = document.getElementById('weekChart');
  if (!canvas) return;

  const days = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
  const volumes = [0,0,0,0,0,0,0];

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  weekAgo.setHours(0,0,0,0);

  workouts.forEach(w => {
    const d = new Date(w.date);
    if (d < weekAgo) return;
    let dow = d.getDay() - 1;
    if (dow < 0) dow = 6;
    volumes[dow] += totalVolume(w);
  });

  const colors = volumes.map(v => v > 0 ? 'rgba(184,255,87,.72)' : 'rgba(184,255,87,.08)');

  const ctx = canvas.getContext('2d');
  if (weekChartInst) { weekChartInst.destroy(); weekChartInst = null; }

  weekChartInst = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: days,
      datasets: [{
        data: volumes,
        backgroundColor: colors,
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: tooltipStyle('кг') },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#5a5a7a', font: { size: 11 } } },
        y: { display: false },
      },
    },
  });
}

function chartOptions(unit) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: tooltipStyle(unit) },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#5a5a7a', font: { size: 11 } } },
      y: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#5a5a7a', font: { size: 11 }, callback: v => v + ' ' + unit } },
    },
  };
}

function tooltipStyle(unit) {
  return {
    backgroundColor: '#1c1c2e',
    borderColor: 'rgba(255,255,255,.1)',
    borderWidth: 1,
    titleColor: '#eeeef8',
    bodyColor: '#7a7a9a',
    callbacks: { label: ctx => `  ${Math.round(ctx.parsed.y).toLocaleString('ru')} ${unit}` },
  };
}



let exCount = 0;

function openModal() {
  document.getElementById('wName').value = '';
  document.getElementById('wDate').value = todayStr();
  document.getElementById('wDuration').value = '';
  document.getElementById('wNotes').value = '';
  document.getElementById('exList').innerHTML = '';
  exCount = 0;
  addExercise();
  document.getElementById('modalBg').classList.add('open');
}

function closeModal() {
  document.getElementById('modalBg').classList.remove('open');
}

function closeModalBg(e) {
  if (e.target === document.getElementById('modalBg')) closeModal();
}

function addExercise() {
  exCount++;
  const id = exCount;
  const row = document.createElement('div');
  row.className = 'exercise-row';
  row.id = 'ex-' + id;
  row.innerHTML = `
    <div>
      <div class="ex-label">Упражнение</div>
      <input class="form-input" type="text" placeholder="Жим лёжа" style="padding:8px 10px;font-size:13px" id="exName${id}">
    </div>
    <div>
      <div class="ex-label">Подходы</div>
      <input class="form-input" type="number" placeholder="4" min="1" style="padding:8px 10px;font-size:13px" id="exSets${id}">
    </div>
    <div>
      <div class="ex-label">Повторы</div>
      <input class="form-input" type="number" placeholder="8" min="1" style="padding:8px 10px;font-size:13px" id="exReps${id}">
    </div>
    <div>
      <div class="ex-label">Вес (кг)</div>
      <input class="form-input" type="number" placeholder="100" min="0" step="2.5" style="padding:8px 10px;font-size:13px" id="exWeight${id}">
    </div>
    <button class="rm-btn" onclick="removeEx(${id})">✕</button>
  `;
  document.getElementById('exList').appendChild(row);
}

function removeEx(id) {
  const el = document.getElementById('ex-' + id);
  if (el) el.remove();
}

function saveWorkout() {
  const user = Store.getSession();
  if (!user) return;

  const name = document.getElementById('wName').value.trim();
  const date = document.getElementById('wDate').value;
  const duration = document.getElementById('wDuration').value;
  const notes = document.getElementById('wNotes').value.trim();

  if (!name) { alert('Введите название тренировки'); return; }
  if (!date) { alert('Выберите дату'); return; }

  const exercises = [];
  for (let i = 1; i <= exCount; i++) {
    const nameEl = document.getElementById('exName' + i);
    if (!nameEl) continue;
    const exName = nameEl.value.trim();
    if (!exName) continue;
    exercises.push({
      name: exName,
      sets: document.getElementById('exSets' + i)?.value || '',
      reps: document.getElementById('exReps' + i)?.value || '',
      weight: document.getElementById('exWeight' + i)?.value || '0',
    });
  }

  if (!exercises.length) { alert('Добавь хотя бы одно упражнение'); return; }

  Store.saveWorkout({
    id: Date.now().toString(),
    username: user.username,
    name, date, duration, notes, exercises,
  });

  closeModal();
  renderAll(user.username);
}


function setNavActive(el) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  el.classList.add('active');
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}