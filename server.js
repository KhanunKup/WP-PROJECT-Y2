// server.js
const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const session = require("express-session");
const cookieParser = require("cookie-parser");
const sqlite3 = require('sqlite3').verbose();
// Middleware setup
app.use(cookieParser());
app.use(session({
  secret: 'your-secret-key-for-your-store', 
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 10 * 60000 } 
}));

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // ให้ระบบอ่าน JSON ที่ Frontend ส่งมาได้
app.use(express.urlencoded({ extended: true }));


// Connect to database
let db = new sqlite3.Database('Database.db', (err) => {    
  if (err) {
      return console.error(err.message);
  }
  console.log('Connected to the SQlite database.');
});

// 2. ตั้งค่า Middleware ต่างๆ

// --- ส่วนของการ Render หน้าเว็บ (EJS) ---
// ถ้าผู้ใช้พิมพ์ localhost:3000/login ให้โชว์ไฟล์ views/login.ejs
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "/public/login.html"));
});

app.get('/product-list',(req,res)=>{
    res.render('product-list');
});

app.get('/dashboard', (req, res) => {
    // สั่ง render ไฟล์ views/dashboard.ejs
    res.render('dashboard');
});
// Route สำหรับเปิดหน้ารายการสินค้า
app.get('/add-product', (req, res) => {
    // สั่ง render ไฟล์ views/add-product.ejs
    res.render('add-product'); 
});

//api login
app.post('/api/v1/auth/login',(req, res) => {
    // 1. รับค่าที่ Frontend ส่งมา
    const { username, password } = req.body;

    // 2. ตรวจสอบเบื้องต้น
    if (!username || !password) {
        return res.status(400).json({
            status: "error",
            message: "กรุณากรอกข้อมูลให้ครบถ้วน",
            data: null
        });
    }

    // 3. ไปค้นหาใน Database
    const sql = `SELECT * FROM Users WHERE username = ?`;
    const insert = `insert into System_logs (username, action, description) values (?, ?, ?)`;
    db.get(sql, [username], (err, row) => {
        if (err) {
            return res.status(500).json({ status: "error", message: "Server Error", data: null });
        }
        
        // (สมมติว่าเช็ครหัสผ่านผ่านแล้ว)
        if (row) {
            //เก็บเข้า system_logs database
            db.run (insert, [username,'Login','Login Success'],(err) => {if (err) {console.error("บันทึก Log เข้าสู่ระบบไม่สำเร็จ:", err.message);}})
            // ตอบ JSON Success กลับไป
            return res.status(200).json({
                status: "success",
                message: "เข้าสู่ระบบสำเร็จ",
                data: {
                    user_id: row.user_id,
                    username: row.username,
                    firstname: row.firstname
                }
            });
        } else {
            db.run (insert, [username,'Login','Login Rejected'],(err) => {if (err) {console.error("บันทึก Log เข้าสู่ระบบไม่สำเร็จ:", err.message);}})
            return res.status(401).json({ status: "error", message: "ไม่พบผู้ใช้", data: null });
        }
    });
});

//api getproduct
app.get('/api/v1/products',(req, res) => {
    // 1. รับพารามิเตอร์ที่หน้าเว็บส่งมาผ่าน URL (Query String)
    const { search, category } = req.query;

    // 2. เตรียมประโยค SQL พื้นฐาน (ใช้ 1=1 เพื่อให้ต่อต่อง่ายๆ)
    let sql = `SELECT * FROM Products WHERE 1=1`;
    let params = []; // เอาไว้เก็บค่าที่จะเอาไปแทนที่เครื่องหมาย ?

    // 3. สร้างเงื่อนไขแบบยืดหยุ่น (Dynamic SQL)
    // ถ้ามีการพิมพ์คำค้นหามา
    if (search) {
        sql += ` AND name LIKE ?`;
        // ใช้ % หน้าหลัง เพื่อให้ค้นหาคำที่ซ่อนอยู่ตรงกลางได้ (เช่น พิมพ์ "ใส่" ก็เจอ "ออกัสใส่ไข่")
        params.push(`%${search}%`); 
    }

    // ถ้ามีการเลือกหมวดหมู่ และไม่ได้เลือกคำว่า "all"
    if (category && category !== 'all') {
        sql += ` AND category = ?`;
        params.push(category);
    }

    // 4. สั่ง Database ให้ค้นหาข้อมูล (ใช้ db.all เพราะผลลัพธ์อาจมีหลายแถว)
    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error("Database Error:", err.message);
            return res.status(500).json({ status: "error", message: "ดึงข้อมูลไม่สำเร็จ" });
        }

        // 5. ส่งผลลัพธ์กลับไปให้หน้าเว็บ
        return res.status(200).json({
            status: "success",
            data: rows
        });
    });
});
// 5. สั่งให้เซิร์ฟเวอร์เริ่มทำงาน
app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
});