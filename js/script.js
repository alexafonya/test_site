// Функция инициализации панели админа
function setupAdminPanel() {
    console.log("Настройка панели администратора...");

    // 1. Проверка: вошел ли пользователь (Admin)
    if (sessionStorage.getItem('isAdmin') !== 'true') {
        window.location.href = "login.html";
        return;
    }

    // 2. Вывод имени администратора
    const adminName = sessionStorage.getItem('currentAdmin');
    const nameDisplay = document.getElementById('currentAdminName');
    if (nameDisplay) {
        nameDisplay.textContent = adminName || "Администратор";
    }

    // 3. Кнопка ВЫХОД
    const btnLogout = document.getElementById('logoutBtn');
    if (btnLogout) {
        btnLogout.onclick = function (e) {
            e.preventDefault(); // Остановить стандартное поведение
            sessionStorage.clear();
            window.location.href = "login.html";
        };
    }

    // 4. Кнопка ПРОФИЛЬ (Смена пароля)
    const btnProfile = document.getElementById('changeAdminBtn');
    if (btnProfile) {
        btnProfile.onclick = function (e) {
            e.preventDefault();
            // Вызываем функцию смены пароля
            runUpdateProfile();
        };
    }
}

// ФУНКЦИЯ СМЕНЫ ЛОГИНА И ПАРОЛЯ


// ЗАПУСК: Ждем, пока браузер полностью построит страницу (DOM)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupAdminPanel);
} else {
    setupAdminPanel();
}


// Находим все элементы
const personForm = document.getElementById('personForm');
const tableBody = document.querySelector('#peopleTable tbody');
const modal = document.getElementById('myModal');
const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const dragItem = document.getElementById('draggableWindow');
const modalHeader = document.getElementById('modalHeader');

// --- 1. ЛОГИКА ОКНА (ОТКРЫТЬ/ЗАКРЫТЬ) ---

openModalBtn.onclick = () => {
    modal.style.display = "block";
    loadPeople(); // Загружаем данные при открытии
    // Центрируем окно
    dragItem.style.top = "100px";
    dragItem.style.left = "50%";
    dragItem.style.transform = "translateX(-50%)";
};

closeModalBtn.onclick = () => {
    modal.style.display = "none";
};

// --- 2. ЛОГИКА ПЕРЕТАСКИВАНИЯ (DRAG & DROP) ---

let active = false;
let currentX, currentY, initialX, initialY;
let xOffset = 0, yOffset = 0;

modalHeader.addEventListener("mousedown", dragStart);
document.addEventListener("mousemove", drag);
document.addEventListener("mouseup", dragEnd);

function dragStart(e) {
      if (window.innerWidth < 900) return; 

    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    if (e.target === modalHeader || modalHeader.contains(e.target)) {
        active = true;
    }
}

function dragEnd() {
    initialX = currentX;
    initialY = currentY;
    active = false;
}

function drag(e) {
    if (active) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        xOffset = currentX;
        yOffset = currentY;
        // Двигаем окно
        dragItem.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translateX(-50%)`;
    }
}

// --- 3. РАБОТА С ДАННЫМИ (SERVER) ---

// Функция загрузки данных
async function loadPeople() {
    try {
        // Убедитесь, что путь '/users' совпадает с вашим серверным роутом
        const response = await fetch('/users');
        const people = await response.json();

        const tableBody = document.querySelector('#peopleTable tbody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        people.forEach((person, index) => {
            // 1. Форматируем дату (День.Месяц.Год)
            const formattedDate = person.birthDate 
                ? new Date(person.birthDate).toLocaleDateString('ru-RU') 
                : '—';

            // 2. Создаем строку с атрибутами data-label для адаптивности
            // ВАЖНО: Проверьте, что ключи (firstName, lastName и т.д.) такие же, как в вашем JSON
            const row = `
        <tr>
            <td><input type="checkbox" class="user-checkbox" data-index="${index}"></td>
            <td data-label="Имя">${person.firstName}</td>
            <td data-label="Фамилия">${person.lastName}</td>
            <td data-label="Дата рожд.">${formattedDate}</td>
            <td data-label="Город">${person.city}</td>
            <td data-label="Адрес">${person.address}</td>
            <td data-label="Телефон">${person.phone}</td>
            <td>
                <button class="del-btn" onclick="deletePerson(${index})">Удалить запись</button>
            </td>
        </tr>`;
            
            tableBody.insertAdjacentHTML('beforeend', row);
        });
         applyColumnVisibility(); 

        // Обновляем видимость колонок после загрузки, если у вас есть чекбоксы скрытия
        if (typeof applyColumnVisibility === "function") {
            applyColumnVisibility();
        }

    } catch (error) {
        console.error("Ошибка загрузки JSON:", error);
        alert("Не удалось загрузить данные из базы.");
    }
}



// Отправка формы
personForm.onsubmit = async (e) => {
    e.preventDefault();

    const person = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        birthDate: document.getElementById('birthDate').value,
        city: document.getElementById('city').value,
        address: document.getElementById('address').value,
        phone: document.getElementById('phone').value
    };

    const response = await fetch('/save-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(person)
    });

    if (response.ok) {
        personForm.reset();
        alert("Человек добавлен в базу!");
        if (modal.style.display === "block") loadPeople();
    }
};

const searchBtn = document.getElementById('searchBtn');

searchBtn.onclick = () => {
    // 1. Собираем данные из полей (те, что не пустые)
    const searchData = {
        firstName: document.getElementById('firstName').value.toLowerCase(),
        lastName: document.getElementById('lastName').value.toLowerCase(),
        birthDate: document.getElementById('birthDate').value,
        city: document.getElementById('city').value.toLowerCase(),
        address: document.getElementById('address').value.toLowerCase(),
        phone: document.getElementById('phone').value.toLowerCase()
    };

    // 2. Открываем модальное окно
    modal.style.display = "block";
    loadPeople().then(() => {
        // 3. Фильтруем таблицу после загрузки
        const rows = tableBody.getElementsByTagName('tr');

        for (let i = 0; i < rows.length; i++) {
            const cells = rows[i].getElementsByTagName('td');

            // Проверяем совпадение по каждому полю (если поле в форме заполнено)
            const match =
                (!searchData.firstName || cells[0].innerText.toLowerCase().includes(searchData.firstName)) &&
                (!searchData.lastName || cells[1].innerText.toLowerCase().includes(searchData.lastName)) &&
                (!searchData.birthDate || cells[2].innerText.includes(searchData.birthDate)) &&
                (!searchData.city || cells[3].innerText.toLowerCase().includes(searchData.city)) &&
                (!searchData.address || cells[4].innerText.toLowerCase().includes(searchData.address)) &&
                (!searchData.phone || cells[5].innerText.toLowerCase().includes(searchData.phone));

            rows[i].style.display = match ? "" : "none";
        }
    });
};

async function updateAdminProfile() {
    const currentLogin = sessionStorage.getItem('currentAdmin'); // Тот, под кем вошли
    const oldPass = prompt("Введите ТЕКУЩИЙ пароль для подтверждения:");
    if (!oldPass) return;

    const newLogin = prompt("Введите НОВЫЙ логин (имя):", currentLogin);
    const newPass = prompt("Введите НОВЫЙ пароль:");

    if (!newLogin || !newPass) {
        alert("Поля не могут быть пустыми!");
        return;
    }

    const response = await fetch('/update-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            oldLogin: currentLogin,
            oldPass: oldPass,
            newLogin: newLogin,
            newPass: newPass
        })
    });

    const res = await response.json();
    alert(res.message);

    if (res.success) {
        // Обновляем данные в сессии и выходим, чтобы войти заново с новыми данными
        sessionStorage.clear();
        window.location.href = "login.html";
    }
}

const modalSearchInput = document.getElementById('modalSearchInput');

modalSearchInput.addEventListener('input', function () {
    const filter = this.value.toLowerCase();
    const rows = tableBody.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        const text = rows[i].innerText.toLowerCase();
        // Если текст в строке совпадает с поиском, показываем строку
        rows[i].style.display = text.includes(filter) ? "" : "none";
    }
});

function applyColumnVisibility() {
    const checkboxes = document.querySelectorAll('.column-toggle input');
    const table = document.getElementById('peopleTable');
    const rows = table.rows;

    checkboxes.forEach(cb => {
        const colIndex = parseInt(cb.getAttribute('data-column'));
        const isVisible = cb.checked;

        for (let i = 0; i < rows.length; i++) {
            const cell = rows[i].cells[colIndex];
            if (cell) {
                cell.style.display = isVisible ? '' : 'none';
            }
        }
    });
}

document.querySelectorAll('.column-toggle input').forEach(checkbox => {
    checkbox.addEventListener('change', applyColumnVisibility);
});




const resetBtn = document.getElementById('resetBtn');

resetBtn.onclick = () => {
    // 1. Форма очистится сама из-за type="reset" в HTML

    // 2. Сбрасываем фильтрацию в таблице, чтобы снова видеть всех
    const rows = tableBody.getElementsByTagName('tr');
    for (let i = 0; i < rows.length; i++) {
        rows[i].style.display = "";
    }
    document.getElementById('firstName').focus(); // Курсор прыгнет в поле "Имя"
};

// --- ЭКСПОРТ И ПЕЧАТЬ ---

// 1. Сохранение в PDF
document.getElementById('downloadPdfBtn').onclick = function() {
    // 1. ПРОВЕРКА БИБЛИОТЕКИ (ОБЯЗАТЕЛЬНО ДЛЯ 2026)
    if (typeof window.html2pdf === 'undefined') {
        alert("Ошибка: Библиотека PDF еще не загружена. Пожалуйста, проверьте интернет-соединение или обновите страницу.");
        return;
    }

    const table = document.getElementById('peopleTable');
    if (!table) return;

    // 2. ПОЛУЧЕНИЕ НАСТРОЕК (Ориентация из радиокнопок)
    const orientationOption = document.querySelector('input[name="pdfOrientation"]:checked');
    const orientation = orientationOption ? orientationOption.value : 'portrait';

    // 3. ЛОГИКА ВЫБОРА ЧЕКБОКСАМИ (ТОЛЬКО ОТМЕЧЕННЫЕ)
    const checkboxes = document.querySelectorAll('.user-checkbox');
    const hasChecked = Array.from(checkboxes).some(cb => cb.checked);

    if (hasChecked) {
        checkboxes.forEach(cb => {
            const row = cb.closest('tr');
            if (!cb.checked) {
                row.setAttribute('data-temp-hidden', 'true');
                row.style.display = 'none';
            }
        });
    }

    // 4. СКРЫТИЕ КОЛОНОК (Чекбоксы и Действия) ДЛЯ ЧИСТОГО PDF
    // Скрываем первую колонку (чекбоксы) и последнюю (кнопки удаления)
    const allRows = table.querySelectorAll('tr');
    allRows.forEach(row => {
        const cells = row.cells;
        if (cells.length > 0) {
            cells[0].style.display = 'none'; // Скрываем чекбокс выбора
            cells[cells.length - 1].style.display = 'none'; // Скрываем кнопку удаления
        }
    });

    // 5. НАСТРОЙКИ ГЕНЕРАЦИИ
    const opt = {
        margin: 0.5,
        filename: hasChecked ? 'selected_report_2026.pdf' : 'full_report_2026.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            useCORS: true,
            logging: false 
        },
        jsPDF: { 
            unit: 'in', 
            format: 'letter', 
            orientation: orientation 
        }
    };

    // 6. ЗАПУСК И ВОЗВРАТ ВИДИМОСТИ
    window.html2pdf().set(opt).from(table).save().then(() => {
        // Возвращаем видимость колонок
        allRows.forEach(row => {
            const cells = row.cells;
            if (cells.length > 0) {
                cells[0].style.display = '';
                cells[cells.length - 1].style.display = '';
            }
        });

        // Возвращаем строки, которые скрыли из-за отсутствия галочек
        if (hasChecked) {
            document.querySelectorAll('tr[data-temp-hidden="true"]').forEach(row => {
                row.style.display = '';
                row.removeAttribute('data-temp-hidden');
            });
        }
    }).catch(err => {
        console.error("PDF Error:", err);
        alert("Произошла ошибка при формировании PDF. Попробуйте еще раз.");
    });
};




// 2. Печать таблицы
document.getElementById('printBtn').onclick = () => {
    const table = document.getElementById('peopleTable');
    if (!table) return;

    // Клонируем таблицу, чтобы не испортить оригинал на странице
    const tableClone = table.cloneNode(true);
    
    const newWin = window.open("");
    newWin.document.write(`
        <html>
            <head>
                <title>Печать базы данных</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 12px; }
                    th { background: #eee; }
                    
                    /* СКРЫВАЕМ ПЕРВУЮ КОЛОНКУ (чекбоксы) И ПОСЛЕДНЮЮ (кнопки) */
                    /* nth-child(1) - это первый столбец, last-child - последний */
                    th:nth-child(1), td:nth-child(1),
                    th:last-child, td:last-child { 
                        display: none !important; 
                    }

                    h2 { text-align: center; }
                </style>
            </head>
            <body>
                <h2>Прихожане церкви</h2>
                ${tableClone.outerHTML}
            </body>
        </html>
    `);
    newWin.document.close();
    
    // Даем браузеру время отрендерить таблицу перед печатью
    setTimeout(() => {
        newWin.print();
        newWin.close();
    }, 500);
};




// Функция удаления
async function deletePerson(index) {
    // 1. Спрашиваем пароль для подтверждения
    const passwordConfirm = prompt("ВНИМАНИЕ! Для удаления записи введите ваш текущий пароль администратора:");
    
    // Если пользователь нажал "Отмена" или ввел пустоту — выходим
    if (!passwordConfirm) return; 

    // 2. Берем логин текущего админа из памяти браузера
    const currentAdmin = sessionStorage.getItem('currentAdmin');

    try {
        // 3. Отправляем запрос на сервер
        const response = await fetch('/delete-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                index: index, 
                adminLogin: currentAdmin, 
                adminPass: passwordConfirm 
            })
        });

        const result = await response.json();

        // 4. Проверяем ответ сервера
        if (result.success) {
            alert("Запись успешно удалена из базы данных.");
            
            // 5. САМОЕ ВАЖНОЕ: запускаем загрузку таблицы заново, 
            // чтобы изменения сразу отобразились в модальном окне
            if (typeof loadPeople === "function") {
                loadPeople(); 
            }
        } else {
            // Если пароль неверный или произошла ошибка на сервере
            alert("ОШИБКА: " + result.message);
        }
    } catch (error) {
        console.error("Ошибка при отправке запроса на удаление:", error);
        alert("Произошла системная ошибка при связи с сервером.");
    }
}

    


 // Кнопка для смены логина и пароля (добавьте в конец script.js)
   // 1. Сама функция (добавьте сюда sessionStorage.clear())
async function updateProfile() {
    const oldPass = prompt("Введите ТЕКУЩИЙ пароль для подтверждения:");
    if (!oldPass) return;

    const newLog = prompt("Введите НОВЫЙ логин (имя):", sessionStorage.getItem('currentAdmin'));
    const newPass = prompt("Введите НОВЫЙ пароль:");

    if (!newLog || !newPass) {
        alert("Поля не могут быть пустыми!");
        return;
    }

    const response = await fetch('/update-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            oldLogin: sessionStorage.getItem('currentAdmin'),
            oldPass, 
            newLogin: newLog, 
            newPass
        })
    });

    const res = await response.json();
    alert(res.message);

    if (res.success) {
        // Очищаем сессию, чтобы старые данные не мешали
        sessionStorage.clear(); 
        window.location.href = "login.html";
    }
}

// 2. Привязка к кнопке (проверьте, чтобы имя совпадало!)
const changeBtn = document.getElementById('changeAdminBtn');
if (changeBtn) {
    changeBtn.onclick = updateProfile; // Используем имя без run
}


    // 2. Кнопка смены пароля (у вас функция уже есть, просто привязываем)
    document.getElementById('changeAdminBtn').onclick = updateProfile;

    // 1. Отображаем имя админа из сессии
    const adminName = sessionStorage.getItem('currentAdmin');
    document.getElementById('currentAdminName').textContent = adminName || 'Неизвестно';

    // 3. Кнопка выхода
    document.getElementById('logoutBtn').onclick = () => {
         // Удаляем данные о входе
        window.location.href = "login.html"; // Уходим на страницу логина
    };
