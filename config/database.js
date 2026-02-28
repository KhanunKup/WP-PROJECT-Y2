// config/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// ระบุที่อยู่ของไฟล์ Database.sqlite ที่อยู่โฟลเดอร์นอกสุด
const dbPath = path.resolve(__dirname, '../Database.db');

// ทำการเชื่อมต่อ
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ ไม่สามารถเชื่อมต่อฐานข้อมูลได้:', err.message);
    } else {
        console.log('✅ เชื่อมต่อฐานข้อมูล SQLite สำเร็จแล้ว!');
    }
});

// ส่งออกตัวแปร db ให้ไฟล์อื่นเอาไปใช้ (เช่น นำไปใช้ใน Controller)
module.exports = db;