/* =========================================================
   STUDYFLOW - APP.JS
   BẢN SỬA HOÀN CHỈNH
   ========================================================= */

const KEY = 'studyDashboardDataV6';
const PROFILE_KEY = 'studyFlowProfile';
const CURRENT_USER_KEY = 'studyFlowCurrentUser';
const THEME_KEY = 'studyFlowTheme';

const DEFAULT_SUBJECTS = [
    {
        key: 'toan',
        name: 'Toán học',
        icon: '∑',
        tag: 'Tư duy',
        description: 'Ôn luyện công thức, bài tập và kỹ năng giải quyết vấn đề.',
        custom: false
    },
    {
        key: 'ly',
        name: 'Vật lý',
        icon: '⚡',
        tag: 'Khám phá',
        description: 'Tìm hiểu các quy luật tự nhiên qua lý thuyết và thí nghiệm.',
        custom: false
    },
    {
        key: 'hoa',
        name: 'Hóa học',
        icon: '⚗',
        tag: 'Thực hành',
        description: 'Ghi nhớ phản ứng, nguyên tố và vận dụng vào bài tập.',
        custom: false
    }
];

const defaultData = {
    name: 'Bạn',

    subjects: DEFAULT_SUBJECTS.map(subject => ({
        ...subject
    })),

    progress: {
        toan: 0,
        ly: 0,
        hoa: 0
    },

    studyDuration: 3,
    studyUnit: 'minutes',
    studyDurationSeconds: 180,

    activeSession: null,

    studySeconds: {
        toan: 0,
        ly: 0,
        hoa: 0
    }
};

let studyTimer = null;


/* =========================================================
   DỮ LIỆU HỌC TẬP
   ========================================================= */

function getData() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(KEY) || '{}'
        );

        const data = {
            ...defaultData,
            ...saved,

            subjects: Array.isArray(saved.subjects)
                ? saved.subjects
                : DEFAULT_SUBJECTS.map(subject => ({
                    ...subject
                })),

            progress: {
                ...defaultData.progress,
                ...(saved.progress || {})
            },

            studySeconds: {
                ...defaultData.studySeconds,
                ...(saved.studySeconds || {})
            }
        };

        data.subjects.forEach(subject => {
            if (data.progress[subject.key] === undefined) {
                data.progress[subject.key] = 0;
            }

            if (data.studySeconds[subject.key] === undefined) {
                data.studySeconds[subject.key] = 0;
            }
        });

        return data;

    } catch (error) {
        console.warn('Không thể đọc dữ liệu StudyFlow.', error);

        return JSON.parse(
            JSON.stringify(defaultData)
        );
    }
}


function saveData(data) {
    localStorage.setItem(
        KEY,
        JSON.stringify(data)
    );
}


/* =========================================================
   PROFILE
   ========================================================= */

function getProfile() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(PROFILE_KEY) || 'null'
        );

        if (saved && typeof saved === 'object') {
            return {
                name: saved.name || '',
                email: saved.email || '',
                password: saved.password || '',
                theme:
                    saved.theme ||
                    localStorage.getItem(THEME_KEY) ||
                    'light'
            };
        }

    } catch (error) {
        console.warn(
            'Không thể đọc thông tin tài khoản.',
            error
        );
    }

    const data = getData();

    return {
        name: data.name !== 'Bạn'
            ? data.name
            : '',
        email: '',
        password: '',
        theme:
            localStorage.getItem(THEME_KEY) ||
            'light'
    };
}


function saveProfile(profile) {
    localStorage.setItem(
        PROFILE_KEY,
        JSON.stringify(profile)
    );

    if (profile.theme) {
        localStorage.setItem(
            THEME_KEY,
            profile.theme
        );
    }
}


/* =========================================================
   THEME
   ========================================================= */

function applyTheme() {
    const profile = getProfile();

    const theme =
        profile.theme === 'dark'
            ? 'dark'
            : 'light';

    document.documentElement.setAttribute(
        'data-theme',
        theme
    );

    localStorage.setItem(
        THEME_KEY,
        theme
    );

    const darkToggle =
        document.querySelector('#darkModeToggle');

    if (darkToggle) {
        darkToggle.checked =
            theme === 'dark';
    }

    document
        .querySelectorAll('[data-theme-choice]')
        .forEach(button => {
            button.classList.toggle(
                'selected',
                button.dataset.themeChoice === theme
            );
        });
}


/* =========================================================
   TOAST
   ========================================================= */

function toast(message) {
    const element =
        document.querySelector('.toast');

    if (!element) {
        alert(message);
        return;
    }

    element.textContent = message;
    element.classList.add('show');

    clearTimeout(toast.timer);

    toast.timer = setTimeout(() => {
        element.classList.remove('show');
    }, 2200);
}


/* =========================================================
   TIỆN ÍCH
   ========================================================= */

function subjectLabel(key) {
    const subject = getData()
        .subjects
        .find(item => item.key === key);

    return subject
        ? subject.name
        : 'Môn học';
}


function escapeHTML(value) {
    return String(value)
        .replace(
            /[&<>'"]/g,
            char => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[char])
        );
}


function formatTime(total) {
    total = Math.max(
        0,
        Math.floor(total)
    );

    const hours =
        Math.floor(total / 3600);

    const minutes =
        Math.floor((total % 3600) / 60);

    const seconds =
        total % 60;

    return [
        hours,
        minutes,
        seconds
    ]
        .map(value =>
            String(value).padStart(2, '0')
        )
        .join(':');
}


/* =========================================================
   HEADER
   ========================================================= */

function updateHeader() {
    const profile = getProfile();
    const data = getData();

    const name =
        profile.name ||
        data.name ||
        'Bạn';

    const email =
        profile.email ||
        '';

    const avatar =
        name.charAt(0).toUpperCase() ||
        'B';

    document
        .querySelectorAll('[data-user]')
        .forEach(element => {
            element.textContent = name;
        });

    document
        .querySelectorAll('[data-email]')
        .forEach(element => {
            element.textContent =
                email || 'Chưa có email';
        });

    document
        .querySelectorAll('[data-avatar]')
        .forEach(element => {
            element.textContent = avatar;
        });

    document
        .querySelectorAll('[data-profile-name]')
        .forEach(element => {
            element.textContent = name;
        });

    document
        .querySelectorAll('[data-profile-email]')
        .forEach(element => {
            element.textContent = email;
        });
}


/* =========================================================
   POPUP TÀI KHOẢN
   ========================================================= */

function initAccountMenu() {

    const accountButton =
        document.querySelector('#accountButton') ||
        document.querySelector('.user-account-button');

    const accountMenu =
        document.querySelector('#accountMenu') ||
        document.querySelector('.account-menu');

    if (!accountButton || !accountMenu) {
        return;
    }

    if (
        accountButton.dataset.menuReady === 'true'
    ) {
        return;
    }

    accountButton.dataset.menuReady = 'true';


    /* MỞ / ĐÓNG */

    accountButton.addEventListener(
        'click',
        event => {

            event.preventDefault();
            event.stopPropagation();

            const opened =
                accountMenu.classList.contains('show');

            if (opened) {
                accountMenu.classList.remove('show');
                accountButton.classList.remove('active');
            } else {
                updateHeader();

                accountMenu.classList.add('show');
                accountButton.classList.add('active');
            }
        }
    );


    /* Không đóng khi click trong popup */

    accountMenu.addEventListener(
        'click',
        event => {
            event.stopPropagation();
        }
    );


    /* Click ra ngoài */

    document.addEventListener(
        'click',
        event => {

            if (
                !accountMenu.contains(event.target) &&
                !accountButton.contains(event.target)
            ) {

                accountMenu.classList.remove('show');

                accountButton.classList.remove('active');
            }
        }
    );


    /* ESC */

    document.addEventListener(
        'keydown',
        event => {

            if (event.key === 'Escape') {

                accountMenu.classList.remove('show');

                accountButton.classList.remove('active');
            }
        }
    );


    /* DARK MODE */

    const darkToggle =
        document.querySelector('#darkModeToggle');

    if (darkToggle) {

        darkToggle.checked =
            getProfile().theme === 'dark';

        darkToggle.addEventListener(
            'change',
            () => {

                const profile = getProfile();

                profile.theme =
                    darkToggle.checked
                        ? 'dark'
                        : 'light';

                saveProfile(profile);

                applyTheme();
                updateHeader();
            }
        );
    }


    /* ĐĂNG XUẤT */

    const logoutButton =
        document.querySelector('#menuLogout');

    if (logoutButton) {

        logoutButton.addEventListener(
            'click',
            event => {

                event.preventDefault();
                event.stopPropagation();

                const answer = confirm(
                    'Bạn có chắc muốn đăng xuất không?'
                );

                if (!answer) {
                    return;
                }

                localStorage.removeItem(
                    CURRENT_USER_KEY
                );

                location.href = 'index.html';
            }
        );
    }
}


/* =========================================================
   MÔN HỌC TÙY CHỈNH
   ========================================================= */

function renderCustomSubjects() {

    const container =
        document.querySelector('#mon-hoc');

    const addCard =
        document.querySelector('#addSubjectCard');

    if (!container || !addCard) {
        return;
    }

    container
        .querySelectorAll('[data-custom-subject]')
        .forEach(card => card.remove());

    getData()
        .subjects
        .filter(subject => subject.custom)
        .forEach(subject => {

            const card =
                document.createElement('article');

            card.className = 'subject';

            card.dataset.subject =
                subject.key;

            card.dataset.customSubject =
                'true';

            card.innerHTML = `
                <div class="subject-top">
                    <div class="subject-icon">
                        ${escapeHTML(subject.icon)}
                    </div>

                    <span class="tag">
                        ${escapeHTML(subject.tag)}
                    </span>
                </div>

                <h2>
                    ${escapeHTML(subject.name)}
                </h2>

                <p>
                    ${escapeHTML(subject.description)}
                </p>

                <div class="progress-head">
                    <span>Tiến độ</span>
                    <span data-value>0%</span>
                </div>

                <div class="bar">
                    <span></span>
                </div>

                <div class="subject-actions">
                    <button
                        class="primary"
                        type="button"
                        data-study-button
                        data-subject-key="${escapeHTML(subject.key)}">
                        Bắt đầu học
                    </button>
                </div>
            `;

            container.insertBefore(
                card,
                addCard
            );
        });
}


/* =========================================================
   THÊM MÔN
   ========================================================= */

function addSubject(event) {

    event.preventDefault();

    const nameInput =
        document.querySelector('#newSubjectName');

    const descriptionInput =
        document.querySelector('#newSubjectDescription');

    const iconInput =
        document.querySelector('#newSubjectIcon');

    const tagInput =
        document.querySelector('#newSubjectTag');

    const name =
        nameInput
            ? nameInput.value.trim()
            : '';

    const description =
        descriptionInput
            ? descriptionInput.value.trim()
            : '';

    const icon =
        iconInput
            ? iconInput.value.trim()
            : '📘';

    const tag =
        tagInput
            ? tagInput.value.trim()
            : 'Tự học';

    if (!name || !description) {
        toast(
            'Vui lòng nhập tên và mô tả môn học'
        );
        return;
    }

    const data = getData();

    const key =
        'custom_' + Date.now();

    data.subjects.push({
        key,
        name,
        icon: icon || '📘',
        tag: tag || 'Tự học',
        description,
        custom: true
    });

    data.progress[key] = 0;
    data.studySeconds[key] = 0;

    saveData(data);

    closeSubjectModal();

    renderCustomSubjects();

    updateHome();

    updateDashboard();

    toast(
        'Đã thêm môn ' + name
    );

    if (event.target) {
        event.target.reset();
    }

    if (iconInput) {
        iconInput.value = '📘';
    }

    if (tagInput) {
        tagInput.value = 'Tự học';
    }
}


function openSubjectModal() {

    const modal =
        document.querySelector('#subjectModal');

    if (modal) {
        modal.classList.add('show');
    }

    const input =
        document.querySelector('#newSubjectName');

    if (input) {
        input.focus();
    }
}


function closeSubjectModal() {

    const modal =
        document.querySelector('#subjectModal');

    if (modal) {
        modal.classList.remove('show');
    }
}


/* =========================================================
   THỜI GIAN HỌC
   ========================================================= */

function saveStudyTime() {

    const input =
        document.querySelector('#studyDuration');

    const select =
        document.querySelector('#studyUnit');

    if (!input || !select) {
        return;
    }

    const duration =
        Number(input.value);

    const unit =
        select.value;

    if (
        !Number.isInteger(duration) ||
        duration < 1
    ) {
        toast(
            'Vui lòng nhập số nguyên lớn hơn 0'
        );
        return;
    }

    if (
        (
            unit === 'minutes' &&
            duration > 300
        ) ||
        (
            unit === 'hours' &&
            duration > 24
        )
    ) {
        toast(
            unit === 'hours'
                ? 'Thời gian tối đa là 24 giờ'
                : 'Thời gian tối đa là 300 phút'
        );
        return;
    }

    const data = getData();

    if (data.activeSession) {
        toast(
            'Hãy kết thúc môn đang học trước'
        );

        updateStudyTimeDisplay();
        return;
    }

    data.studyDuration = duration;
    data.studyUnit = unit;

    data.studyDurationSeconds =
        unit === 'hours'
            ? duration * 3600
            : duration * 60;

    saveData(data);

    updateStudyTimeDisplay();

    toast(
        `Đã đặt thời gian ${duration} ${
            unit === 'hours'
                ? 'giờ'
                : 'phút'
        }`
    );
}


function updateStudyTimeDisplay() {

    const data = getData();

    const input =
        document.querySelector('#studyDuration');

    const select =
        document.querySelector('#studyUnit');

    const text =
        document.querySelector('#currentStudyTime');

    if (input) {
        input.value =
            data.studyDuration;
    }

    if (select) {
        select.value =
            data.studyUnit;
    }

    if (text) {
        text.textContent =
            `${data.studyDuration} ${
                data.studyUnit === 'hours'
                    ? 'giờ'
                    : 'phút'
            }`;
    }
}


/* =========================================================
   ĐỒNG BỘ TIẾN ĐỘ
   ========================================================= */

function synchronizeProgress() {

    const data = getData();

    if (!data.activeSession) {
        return data;
    }

    const session =
        data.activeSession;

    const elapsed =
        Math.floor(
            (
                Date.now() -
                session.startTime
            ) / 1000
        );

    const totalSeconds =
        Math.max(
            1,
            session.totalSeconds || 1
        );

    const ratio =
        Math.min(
            1,
            elapsed / totalSeconds
        );

    data.progress[session.subject] =
        Math.min(
            100,
            Math.floor(
                session.startProgress +
                (
                    100 -
                    session.startProgress
                ) * ratio
            )
        );

    if (elapsed >= totalSeconds) {

        const key =
            session.subject;

        data.progress[key] = 100;

        data.studySeconds[key] =
            (
                data.studySeconds[key] || 0
            ) + totalSeconds;

        data.activeSession = null;

        if (studyTimer) {
            clearInterval(studyTimer);
            studyTimer = null;
        }

        toast(
            `${subjectLabel(key)} đã hoàn thành 100%`
        );
    }

    saveData(data);

    return data;
}


/* =========================================================
   HOME
   ========================================================= */

function updateHome() {

    const data =
        synchronizeProgress();

    document
        .querySelectorAll('[data-subject]')
        .forEach(card => {

            const key =
                card.dataset.subject;

            if (!(key in data.progress)) {
                return;
            }

            const value =
                data.progress[key] || 0;

            const bar =
                card.querySelector('.bar span');

            const text =
                card.querySelector('[data-value]');

            if (bar) {
                bar.style.width =
                    value + '%';
            }

            if (text) {
                text.textContent =
                    value + '%';
            }
        });

    const values =
        data.subjects.map(
            subject =>
                data.progress[subject.key] || 0
        );

    const average =
        values.length
            ? Math.round(
                values.reduce(
                    (a, b) => a + b,
                    0
                ) / values.length
            )
            : 0;

    const avg =
        document.querySelector('#avg');

    if (avg) {
        avg.textContent =
            average + '%';
    }

    updateStudyButtons();
}


/* =========================================================
   NÚT HỌC
   ========================================================= */

function updateStudyButtons() {

    const data = getData();

    document
        .querySelectorAll('[data-study-button]')
        .forEach(button => {

            const key =
                button.dataset.subjectKey;

            if (!data.activeSession) {

                const progress =
                    data.progress[key] || 0;

                button.textContent =
                    progress >= 100
                        ? 'Đã hoàn thành'
                        : 'Bắt đầu học';

                button.disabled =
                    progress >= 100;

                return;
            }

            if (
                data.activeSession.subject === key
            ) {

                const remaining =
                    Math.max(
                        0,
                        data.activeSession.totalSeconds -
                        Math.floor(
                            (
                                Date.now() -
                                data.activeSession.startTime
                            ) / 1000
                        )
                    );

                button.textContent =
                    'Kết thúc • Còn ' +
                    formatTime(remaining);

                button.disabled = false;

            } else {

                button.textContent =
                    'Đang học môn khác';

                button.disabled = true;
            }
        });
}


/* =========================================================
   BẮT ĐẦU HỌC
   ========================================================= */

function startStudy(key) {

    const data = getData();

    if (data.activeSession) {
        toast(
            'Bạn đang học một môn khác'
        );
        return;
    }

    if (
        !data.subjects.some(
            subject =>
                subject.key === key
        )
    ) {
        toast(
            'Không tìm thấy môn học'
        );
        return;
    }

    if (
        (data.progress[key] || 0) >= 100
    ) {
        toast(
            subjectLabel(key) +
            ' đã hoàn thành'
        );
        return;
    }

    data.activeSession = {
        subject: key,
        startTime: Date.now(),
        startProgress:
            data.progress[key] || 0,

        totalSeconds:
            Math.max(
                1,
                data.studyDurationSeconds || 180
            ),

        studyDuration:
            data.studyDuration,

        studyUnit:
            data.studyUnit
    };

    saveData(data);

    toast(
        `Bắt đầu học ${subjectLabel(key)} trong ${
            data.studyDuration
        } ${
            data.studyUnit === 'hours'
                ? 'giờ'
                : 'phút'
        }`
    );

    startRealtimeTimer();

    updateHome();
}


/* =========================================================
   KẾT THÚC HỌC
   ========================================================= */

function endStudy() {

    let data =
        synchronizeProgress();

    if (!data.activeSession) {
        return;
    }

    const session =
        data.activeSession;

    const elapsed =
        Math.floor(
            (
                Date.now() -
                session.startTime
            ) / 1000
        );

    data.studySeconds[session.subject] =
        (
            data.studySeconds[session.subject] ||
            0
        ) +
        Math.min(
            elapsed,
            session.totalSeconds
        );

    const name =
        subjectLabel(session.subject);

    data.activeSession = null;

    saveData(data);

    if (studyTimer) {
        clearInterval(studyTimer);
        studyTimer = null;
    }

    updateHome();
    updateDashboard();

    toast(
        'Đã kết thúc học ' + name
    );
}


/* =========================================================
   TIMER
   ========================================================= */

function startRealtimeTimer() {

    if (studyTimer) {
        clearInterval(studyTimer);
    }

    studyTimer =
        setInterval(() => {

            updateHome();
            updateDashboard();

            if (!getData().activeSession) {

                clearInterval(studyTimer);

                studyTimer = null;
            }

        }, 1000);
}


/* =========================================================
   DASHBOARD
   ========================================================= */

function renderDashboardSubjects(data) {

    const chart =
        document.querySelector('.bars-chart');

    const legend =
        document.querySelector('.legend');

    if (!chart || !legend) {
        return;
    }

    chart
        .querySelectorAll('[data-dynamic-dashboard]')
        .forEach(item => item.remove());

    legend
        .querySelectorAll('[data-dynamic-dashboard]')
        .forEach(item => item.remove());

    data.subjects
        .filter(subject => subject.custom)
        .forEach(subject => {

            const column =
                document.createElement('div');

            column.className = 'chart-col';

            column.dataset.dynamicDashboard =
                'true';

            column.innerHTML = `
                <div
                    class="chart-bar"
                    data-chart="${escapeHTML(subject.key)}">
                </div>

                <span>
                    ${escapeHTML(subject.name)}
                </span>
            `;

            chart.appendChild(column);


            const row =
                document.createElement('div');

            row.className = 'legend-row';

            row.dataset.dynamicDashboard =
                'true';

            row.innerHTML = `
                <span>
                    ${escapeHTML(subject.name)}
                </span>

                <span
                    data-score="${escapeHTML(subject.key)}">
                    0%
                </span>
            `;

            legend.appendChild(row);
        });
}


function updateDashboard() {

    if (!document.querySelector('#dashboard')) {
        return;
    }

    const data =
        synchronizeProgress();

    renderDashboardSubjects(data);

    const values =
        data.subjects.map(
            subject =>
                data.progress[subject.key] || 0
        );

    const average =
        values.length
            ? Math.round(
                values.reduce(
                    (a, b) => a + b,
                    0
                ) / values.length
            )
            : 0;

    const overall =
        document.querySelector('#overall');

    const ringOverall =
        document.querySelector('#ringOverall');

    const ring =
        document.querySelector('.ring');

    if (overall) {
        overall.textContent =
            average + '%';
    }

    if (ringOverall) {
        ringOverall.textContent =
            average + '%';
    }

    if (ring) {
        ring.style.setProperty(
            '--pct',
            average + '%'
        );
    }

    data.subjects.forEach(subject => {

        const value =
            data.progress[subject.key] || 0;

        const bar =
            document.querySelector(
                `[data-chart="${subject.key}"]`
            );

        const score =
            document.querySelector(
                `[data-score="${subject.key}"]`
            );

        if (bar) {
            bar.style.height =
                value + '%';
        }

        if (score) {
            score.textContent =
                value + '%';
        }
    });

    const done =
        document.querySelector('#doneCount');

    if (done) {
        done.textContent =
            values.filter(
                value => value >= 100
            ).length;
    }

    const lessons =
        document.querySelector('#lessonCount');

    if (lessons) {
        lessons.textContent =
            Math.floor(
                values.reduce(
                    (a, b) => a + b,
                    0
                ) / 10
            );
    }
}


/* =========================================================
   PROFILE PAGE
   ========================================================= */

function initProfilePage() {

    const profileForm =
        document.querySelector('#profileForm');

    const passwordButton =
        document.querySelector('#showPasswordForm');

    const passwordForm =
        document.querySelector('#changePasswordForm');

    const cancelPasswordButton =
        document.querySelector('#cancelPasswordChange');

    const passwordConfirmButton =
        document.querySelector('#confirmPasswordChange');

    const logoutButton =
        document.querySelector('#logoutButton');

    if (
        !profileForm &&
        !passwordButton &&
        !passwordForm
    ) {
        return;
    }

    const profile =
        getProfile();

    const nameInput =
        document.querySelector('#profileName');

    const emailInput =
        document.querySelector('#profileEmail');

    const displayName =
        document.querySelector('#profileDisplayName');

    const displayEmail =
        document.querySelector('#profileDisplayEmail');

    const avatar =
        document.querySelector('#profileAvatarLarge');

    if (nameInput) {
        nameInput.value =
            profile.name;
    }

    if (emailInput) {
        emailInput.value =
            profile.email;
    }

    if (displayName) {
        displayName.textContent =
            profile.name || 'Bạn';
    }

    if (displayEmail) {
        displayEmail.textContent =
            profile.email ||
            'Chưa cập nhật email';
    }

    if (avatar) {
        avatar.textContent =
            (
                profile.name ||
                'Bạn'
            )
                .charAt(0)
                .toUpperCase();
    }


    /* LƯU PROFILE */

    if (profileForm) {

        profileForm.addEventListener(
            'submit',
            event => {

                event.preventDefault();

                const newName =
                    nameInput
                        ? nameInput.value.trim()
                        : '';

                const newEmail =
                    emailInput
                        ? emailInput.value.trim().toLowerCase()
                        : '';

                const message =
                    document.querySelector(
                        '#profileMessage'
                    );

                if (!newName || !newEmail) {

                    if (message) {
                        message.textContent =
                            'Vui lòng nhập đầy đủ tên và Gmail';

                        message.className =
                            'profile-message error';
                    }

                    return;
                }

                if (
                    !newEmail.endsWith('@gmail.com')
                ) {

                    if (message) {
                        message.textContent =
                            'Vui lòng nhập địa chỉ Gmail hợp lệ';

                        message.className =
                            'profile-message error';
                    }

                    return;
                }

                const newProfile =
                    getProfile();

                newProfile.name =
                    newName;

                newProfile.email =
                    newEmail;

                saveProfile(newProfile);

                const data =
                    getData();

                data.name =
                    newName;

                saveData(data);

                updateHeader();

                if (displayName) {
                    displayName.textContent =
                        newName;
                }

                if (displayEmail) {
                    displayEmail.textContent =
                        newEmail;
                }

                if (avatar) {
                    avatar.textContent =
                        newName
                            .charAt(0)
                            .toUpperCase();
                }

                if (message) {
                    message.textContent =
                        'Đã cập nhật thông tin tài khoản';

                    message.className =
                        'profile-message success';
                }

                toast(
                    'Đã cập nhật thông tin tài khoản'
                );
            }
        );
    }


    /* MỞ FORM ĐỔI MẬT KHẨU */

    if (passwordButton) {

        passwordButton.addEventListener(
            'click',
            () => {

                if (passwordForm) {
                    passwordForm.classList.add('show');
                }

                const oldPassword =
                    document.querySelector('#oldPassword');

                if (oldPassword) {
                    oldPassword.focus();
                }
            }
        );
    }


    /* HỦY */

    if (cancelPasswordButton) {

        cancelPasswordButton.addEventListener(
            'click',
            () => {

                if (passwordForm) {
                    passwordForm.classList.remove('show');
                }

                const oldPassword =
                    document.querySelector('#oldPassword');

                const newPassword =
                    document.querySelector('#newPassword');

                const confirmPassword =
                    document.querySelector('#confirmPassword');

                if (oldPassword) {
                    oldPassword.value = '';
                }

                if (newPassword) {
                    newPassword.value = '';
                }

                if (confirmPassword) {
                    confirmPassword.value = '';
                }

                const message =
                    document.querySelector(
                        '#passwordMessage'
                    );

                if (message) {
                    message.textContent = '';
                }
            }
        );
    }


    /* ĐỔI MẬT KHẨU */

    if (passwordConfirmButton) {

        passwordConfirmButton.addEventListener(
            'click',
            () => {

                const oldPassword =
                    document.querySelector('#oldPassword');

                const newPassword =
                    document.querySelector('#newPassword');

                const confirmPassword =
                    document.querySelector('#confirmPassword');

                const message =
                    document.querySelector(
                        '#passwordMessage'
                    );

                const oldValue =
                    oldPassword
                        ? oldPassword.value
                        : '';

                const newValue =
                    newPassword
                        ? newPassword.value
                        : '';

                const confirmValue =
                    confirmPassword
                        ? confirmPassword.value
                        : '';

                const currentProfile =
                    getProfile();


                if (
                    oldValue !==
                    currentProfile.password
                ) {

                    if (message) {
                        message.textContent =
                            'Mật khẩu cũ không chính xác';

                        message.className =
                            'profile-message error';
                    }

                    return;
                }


                if (
                    !newValue ||
                    newValue.length < 4
                ) {

                    if (message) {
                        message.textContent =
                            'Mật khẩu mới phải có ít nhất 4 ký tự';

                        message.className =
                            'profile-message error';
                    }

                    return;
                }


                if (
                    newValue !==
                    confirmValue
                ) {

                    if (message) {
                        message.textContent =
                            'Mật khẩu xác nhận không khớp';

                        message.className =
                            'profile-message error';
                    }

                    return;
                }


                if (
                    newValue ===
                    oldValue
                ) {

                    if (message) {
                        message.textContent =
                            'Mật khẩu mới phải khác mật khẩu cũ';

                        message.className =
                            'profile-message error';
                    }

                    return;
                }


                currentProfile.password =
                    newValue;

                saveProfile(currentProfile);


                if (oldPassword) {
                    oldPassword.value = '';
                }

                if (newPassword) {
                    newPassword.value = '';
                }

                if (confirmPassword) {
                    confirmPassword.value = '';
                }

                if (passwordForm) {
                    passwordForm.classList.remove('show');
                }

                if (message) {
                    message.textContent =
                        'Đổi mật khẩu thành công';

                    message.className =
                        'profile-message success';
                }

                toast(
                    'Đổi mật khẩu thành công'
                );
            }
        );
    }


    /* THEME */

    document
        .querySelectorAll('[data-theme-choice]')
        .forEach(button => {

            button.addEventListener(
                'click',
                () => {

                    const newTheme =
                        button.dataset.themeChoice;

                    const newProfile =
                        getProfile();

                    newProfile.theme =
                        newTheme;

                    saveProfile(newProfile);

                    applyTheme();
                    updateHeader();

                    toast(
                        newTheme === 'dark'
                            ? 'Đã bật chế độ tối'
                            : 'Đã chuyển sang chế độ sáng'
                    );
                }
            );
        });


    /* ĐĂNG XUẤT */

    if (logoutButton) {

        logoutButton.addEventListener(
            'click',
            () => {

                const answer =
                    confirm(
                        'Bạn có chắc muốn đăng xuất không?'
                    );

                if (!answer) {
                    return;
                }

                localStorage.removeItem(
                    CURRENT_USER_KEY
                );

                location.href =
                    'index.html';
            }
        );
    }
}


/* =========================================================
   ĐĂNG NHẬP / ĐĂNG KÝ
   ========================================================= */

function initAuth() {

    const auth =
        document.querySelector('#authForm');

    if (!auth) {
        return;
    }

    let signup = false;

    const title =
        document.querySelector('#authTitle');

    const confirmField =
        document.querySelector('#confirmField');

    const toggle =
        document.querySelector('#toggleAuth');

    const submit =
        document.querySelector('#authSubmit');


    if (toggle) {

        toggle.onclick = () => {

            signup = !signup;

            if (title) {
                title.textContent =
                    signup
                        ? 'Tạo tài khoản'
                        : 'Đăng nhập';
            }

            if (confirmField) {
                confirmField.classList.toggle(
                    'hidden',
                    !signup
                );
            }

            if (submit) {
                submit.textContent =
                    signup
                        ? 'Tạo tài khoản'
                        : 'Đăng nhập';
            }

            toggle.textContent =
                signup
                    ? 'Đã có tài khoản? Đăng nhập'
                    : 'Chưa có tài khoản? Đăng ký';
        };
    }


    auth.onsubmit =
        event => {

            event.preventDefault();

            const nameInput =
                document.querySelector('#name');

            const emailInput =
                document.querySelector('#email');

            const passwordInput =
                document.querySelector('#password');

            const confirmInput =
                document.querySelector('#confirm');

            const name =
                nameInput
                    ? nameInput.value.trim()
                    : '';

            const email =
                emailInput
                    ? emailInput.value.trim().toLowerCase()
                    : '';

            const password =
                passwordInput
                    ? passwordInput.value
                    : '';

            const confirm =
                confirmInput
                    ? confirmInput.value
                    : '';


            if (!name || !email || !password) {

                alert(
                    'Vui lòng nhập đầy đủ thông tin.'
                );

                return;
            }


            if (!email.endsWith('@gmail.com')) {

                alert(
                    'Vui lòng nhập địa chỉ Gmail hợp lệ.'
                );

                return;
            }


            /* ĐĂNG KÝ */

            if (signup) {

                if (password.length < 4) {

                    alert(
                        'Mật khẩu phải có ít nhất 4 ký tự.'
                    );

                    return;
                }


                if (password !== confirm) {

                    alert(
                        'Mật khẩu xác nhận không khớp.'
                    );

                    return;
                }


                const oldProfile =
                    getProfile();

                if (oldProfile.email) {

                    alert(
                        'Tài khoản đã tồn tại. Hãy đăng nhập.'
                    );

                    return;
                }


                const profile = {

                    name,
                    email,
                    password,

                    theme:
                        localStorage.getItem(
                            THEME_KEY
                        ) || 'light'
                };

                saveProfile(profile);


                const data =
                    getData();

                data.name = name;

                saveData(data);


                localStorage.setItem(
                    CURRENT_USER_KEY,
                    email
                );


                alert(
                    'Tạo tài khoản thành công!'
                );

                location.href =
                    'home.html';

                return;
            }


            /* ĐĂNG NHẬP */

            const profile =
                getProfile();

            if (
                !profile.email ||
                !profile.password
            ) {

                alert(
                    'Chưa có tài khoản. Vui lòng đăng ký trước.'
                );

                return;
            }


            if (name !== profile.name) {

                alert(
                    'Tên tài khoản không chính xác.'
                );

                return;
            }


            if (email !== profile.email) {

                alert(
                    'Gmail không chính xác.'
                );

                return;
            }


            if (password !== profile.password) {

                alert(
                    'Mật khẩu không chính xác.'
                );

                return;
            }


            const data =
                getData();

            data.name =
                profile.name;

            saveData(data);


            localStorage.setItem(
                CURRENT_USER_KEY,
                profile.email
            );


            location.href =
                'home.html';
        };
}


/* =========================================================
   SỰ KIỆN TOÀN TRANG
   ========================================================= */

function initGlobalEvents() {

    const saveTimeButton =
        document.querySelector('#saveStudyTime');

    if (saveTimeButton) {
        saveTimeButton.addEventListener(
            'click',
            saveStudyTime
        );
    }


    const addCard =
        document.querySelector('#addSubjectCard');

    if (addCard) {

        addCard.addEventListener(
            'click',
            openSubjectModal
        );

        addCard.addEventListener(
            'keydown',
            event => {

                if (
                    event.key === 'Enter' ||
                    event.key === ' '
                ) {

                    event.preventDefault();

                    openSubjectModal();
                }
            }
        );
    }


    const cancelAdd =
        document.querySelector('#cancelAddSubject');

    if (cancelAdd) {
        cancelAdd.addEventListener(
            'click',
            closeSubjectModal
        );
    }


    const modal =
        document.querySelector('#subjectModal');

    if (modal) {

        modal.addEventListener(
            'click',
            event => {

                if (
                    event.target.id ===
                    'subjectModal'
                ) {
                    closeSubjectModal();
                }
            }
        );
    }


    const subjectForm =
        document.querySelector('#addSubjectForm');

    if (subjectForm) {

        subjectForm.addEventListener(
            'submit',
            addSubject
        );
    }


    document.addEventListener(
        'click',
        event => {

            const button =
                event.target.closest(
                    '[data-study-button]'
                );

            if (!button) {
                return;
            }

            const key =
                button.dataset.subjectKey;

            const data =
                getData();

            if (
                data.activeSession &&
                data.activeSession.subject === key
            ) {

                endStudy();

            } else {

                startStudy(key);
            }
        }
    );
}


/* =========================================================
   KHỞI ĐỘNG
   ========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    () => {

        applyTheme();

        updateHeader();

        renderCustomSubjects();

        updateStudyTimeDisplay();

        initGlobalEvents();

        initAuth();

        initAccountMenu();

        initProfilePage();

        updateHome();

        updateDashboard();

        if (getData().activeSession) {
            startRealtimeTimer();
        }
    }
);
