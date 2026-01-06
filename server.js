const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Указываем путь к файлу базы данных
const DB_PATH = path.join(__dirname, 'data.json');

// Настройки: позволяем серверу читать JSON и статические HTML файлы
app.use(express.json());
app.use(express.static(__dirname)); 

// 1. Маршрут: Получить всех людей (для таблицы)
app.get('/users', (req, res) => {
    if (!fs.existsSync(DB_PATH)) {
        return res.json([]); // Если файла нет, возвращаем пустой массив
    }
    const data = fs.readFileSync(DB_PATH, 'utf8');
    res.json(JSON.parse(data || "[]"));
});

// 2. Маршрут: Добавить нового человека
app.post('/save-user', (req, res) => {
    const newUser = req.body; // Получаем имя и фамилию из формы

    let users = [];
    
    // Проверяем, существует ли файл, и читаем его
    if (fs.existsSync(DB_PATH)) {
        const fileContent = fs.readFileSync(DB_PATH, 'utf8');
        users = JSON.parse(fileContent || "[]");
    }

    // Добавляем нового человека в массив
    users.push(newUser);

    // Записываем обновленный массив обратно в файл
    fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2), 'utf8');

    console.log('Добавлен новый пользователь:', newUser);
    res.json({ message: "Данные успешно сохранены!" });
});

// Эта строка разрешает доступ ко всем файлам и подпапкам в текущей директории
app.use(express.static(__dirname)); 

// Маршрут для удаления человека по индексу
app.post('/delete-user', (req, res) => {
    const { index, adminLogin, adminPass } = req.body;
    const ADMINS_FILE = './admins.json';
    const DB_PATH = './data.json';

    // 1. Сначала проверяем пароль админа
    const admins = JSON.parse(fs.readFileSync(ADMINS_FILE, 'utf8') || "[]");
    const isAuth = admins.find(a => a.login === adminLogin && a.pass === adminPass);

    if (!isAuth) {
        return res.json({ success: false, message: "Неверный пароль администратора!" });
    }

    // 2. Если пароль верен, удаляем запись
    if (fs.existsSync(DB_PATH)) {
        let users = JSON.parse(fs.readFileSync(DB_PATH, 'utf8') || "[]");
        users.splice(index, 1);
        fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
        res.json({ success: true, message: "Запись успешно удалена" });
    } else {
        res.json({ success: false, message: "Файл данных не найден" });
    }
});


// 1. Проверка входа
app.post('/update-admin', (req, res) => {
    const { oldLogin, oldPass, newLogin, newPass } = req.body;
    let admins = JSON.parse(fs.readFileSync('./admins.json', 'utf8'));

    // Ищем админа по старым данным
    let adminIndex = admins.findIndex(a => a.login === oldLogin && a.pass === oldPass);

    if (adminIndex !== -1) {
        // Проверяем, не занят ли НОВЫЙ логин кем-то другим
        const loginTaken = admins.find((a, index) => a.login === newLogin && index !== adminIndex);
        if (loginTaken) {
            return res.json({ success: false, message: "Этот логин уже занят другим админом!" });
        }

        // Обновляем данные
        admins[adminIndex].login = newLogin;
        admins[adminIndex].pass = newPass;

        fs.writeFileSync('./admins.json', JSON.stringify(admins, null, 2));
        res.json({ success: true, message: "Данные профиля изменены! Войдите снова." });
    } else {
        res.json({ success: false, message: "Неверный текущий пароль!" });
    }
});


// Маршрут для входа администратора
app.post('/admin-login', (req, res) => {
    const { login, pass } = req.body;
    const ADMINS_FILE = './admins.json';

    // Читаем файл с админами
    if (fs.existsSync(ADMINS_FILE)) {
        const admins = JSON.parse(fs.readFileSync(ADMINS_FILE, 'utf8') || "[]");
        
        // Ищем совпадение
        const found = admins.find(a => a.login === login && a.pass === pass);
        
        if (found) {
            return res.json({ success: true });
        }
    }
    
    // Если не нашли или файла нет
    res.json({ success: false });
});


// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен! Адрес: http://localhost:${PORT}`);
});
