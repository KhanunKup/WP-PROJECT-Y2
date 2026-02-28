// server.js
const express = require('express');
const app = express();
const port = 3000;

// 1. นำเข้าไฟล์เชื่อมต่อ Database (เพื่อให้มันแสดง log ว่าเชื่อมสำเร็จตอนรันเซิร์ฟเวอร์)
require('./config/database');

// 2. ตั้งค่า Middleware ต่างๆ
app.set('view engine', 'ejs'); // ให้ระบบรู้ว่าจะใช้ EJS เป็นหน้าเว็บ
app.use(express.static('public')); // ให้เปิดไฟล์รูป หรือ css ในโฟลเดอร์ public ได้
app.use(express.json()); // ให้ระบบอ่าน JSON ที่ Frontend ส่งมาได้
app.use(express.urlencoded({ extended: true }));

// 3. นำเข้าไฟล์ Routes (เส้นทาง API)
const authRoutes = require('./routes/auth');
// const userRoutes = require('./routes/users');

// 4. ผูก URL เข้ากับ Routes 
// ถ้ามีคนเรียก /api/v1/auth/... ให้โยนงานไปให้ authRoutes จัดการ
app.use('/api/v1/auth', authRoutes);

// --- ส่วนของการ Render หน้าเว็บ (EJS) ---
// ถ้าผู้ใช้พิมพ์ localhost:3000/login ให้โชว์ไฟล์ views/login.ejs
app.get('/', (req, res) => {
    res.render('login'); 
});

// Route สำหรับเปิดหน้ารายการสินค้า
app.get('/add-product', (req, res) => {
    // สั่ง render ไฟล์ views/add-product.ejs
    res.render('add-product'); 
});

// 5. สั่งให้เซิร์ฟเวอร์เริ่มทำงาน
app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
});