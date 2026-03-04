// server.js
const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const session = require("express-session");
const cookieParser = require("cookie-parser");
const sqlite3 = require('sqlite3').verbose();

// สำหรับ hash password
const bcrypt = require('bcrypt');
const saltRounds = 10;

// สำหรับรับไฟล์รูปภาพจากฟอร์ม
const multer = require('multer');
const fs = require('fs');

//ตั้งค่าการเก็บไฟล์แบบละเอียด
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'public/images/product'; // ระบุเส้นทาง
        
        // ถ้าไม่มีโฟลเดอร์ ให้สร้างขึ้นมาทันที
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); 
    }
});

const upload = multer({ storage: storage });

// Middleware setup
app.use(cookieParser());
app.use(session({
    secret: 'your-secret-key-for-your-store',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 10 * 60000 }
}));

const isAuth = (req,res,next) => {
    if(req.session.userId){
        next();
    }else{
        res.redirect('/');
    }
}

const isAdmin = (req,res,next) => {
    if(req.session.userId && req.session.role == 'admin' || req.session.role == 'manager'){
        next();
    }else{
        return res.redirect('/dashboard');
    }
}

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use('/sweetalert', express.static(__dirname + '/node_modules/sweetalert2/dist'));
app.use(express.json()); // ให้ระบบอ่าน JSON ที่ Frontend ส่งมาได้
app.use(express.urlencoded({ extended: true }));


// Connect to database
let db = new sqlite3.Database('Database.db', (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to the SQlite database.');
});

// --- ส่วนของการ Render หน้าเว็บ (EJS) ---
// ถ้าผู้ใช้พิมพ์ localhost:3000/login ให้โชว์ไฟล์ views/login.ejs
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "/public/login.html"));
});

app.get('/dashboard', (req, res) => {
    // สั่ง render ไฟล์ views/dashboard.ejs
    res.render('dashboard');
});

app.get('/product-list', (req, res) => {
    // สั่ง render ไฟล์ views/product-list
    res.render('product-list');
});

// Route สำหรับเปิดหน้ารายการสินค้า
app.get('/add-product', (req, res) => {
    // สั่ง render ไฟล์ views/add-product.ejs
    res.render('add-product');
});

app.get('/product-details/:id', (req, res) => {
    // สั่ง render ไฟล์ views/product-details
    res.render('product-details'); 
});

app.get('/warehouses', (req,res) => {
    // สั่ง render ไฟล์ views/warehouseSelect.ejs
    res.render('warehouseSelect');
});

app.get('/users', (req,res) => {
    // สั่ง render ไฟล์ views/userManage.ejs
    res.render('userManage');
});

app.get('/add-users', (req,res) => {
    // สั่ง render ไฟล์ views/userManage.ejs
    res.render('add-users');
});

//api login
app.post('/api/v1/auth/login', (req, res) => {
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
    db.get(sql, [username], async (err, row) => {
        if (err) {
            return res.status(500).json({ 
                status: "error", 
                message: "Server Error", 
                data: null 
            });
        }

        // (สมมติว่าเช็ครหัสผ่านผ่านแล้ว)
        if (row) {
            const isMatch = await bcrypt.compare(password, row.password);
            if(isMatch){
                req.session.userId = row.user_id;
                req.session.username = row.username;
                req.session.role = row.role;

                //เก็บเข้า system_logs database
                db.run(insert, [username, 'Login', 'Login Success'], (err) => { 
                    if (err) { 
                        console.error("บันทึก Log เข้าสู่ระบบไม่สำเร็จ:", err.message); 
                    } 
                });
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
            }
        } else {
            db.run (insert, [username,'Login','Login Rejected'],(err) => {
                if (err) {
                    console.error("บันทึก Log เข้าสู่ระบบไม่สำเร็จ:", err.message);
                }
            });
            return res.status(401).json({ 
                status: "error", 
                message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", 
                data: null 
            });
        }
    });
});

app.post('/api/v1/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error destroying session.');
        }
        res.clearCookie('connect.sid');
        
        res.status(200).json({
            status: "success", 
            message: "Logout successful"
        });
    });
});

//api getproduct
app.get('/api/v1/products', (req, res) => {
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

app.get('/api/v1/product-details/:id', (req, res) => {
    const sql = `SELECT 
            p.*, 
            IFNULL(SUM(sb.quantity), 0) AS total_stock,
            IFNULL(GROUP_CONCAT(DISTINCT l.area), 'ยังไม่ได้กำหนด') AS area
        FROM Products p
        LEFT JOIN Stock_Balances sb ON p.product_id = sb.product_id
        LEFT JOIN Locations l ON sb.location_id = l.location_id
        WHERE p.product_id = ?
        GROUP BY p.product_id;`;
    const id = req.params.id;
    db.get(sql, [id], (err, row) => {
        if (err) {
            return res.status(500).json({
                status: "error",
                message: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า",
                data: null
            });
        }
        if (row) {
            res.status(200).json({
                status: "success",
                message: "ดึงข้อมูลสินค้าสำเร็จ",
                data: row
            });
        } else {
            res.status(404).json({
                status: "error",
                message: "ไม่พบสินค้าที่ระบุ",
                data: null
            });
        }
    });
});

app.get('/api/v1/warehouses', function (req, res) {
    const query = 'SELECT * FROM Warehouses ';
    db.all(query, (err, rows) => {
        if (err) {
            return res.status(500).json({
                "status" : "error",
                "message": "ไม่สามารถดึงข้อมูลคลังสินค้าได้",
                "data": null
            })
        }
        return res.status(200).json({
                "status" : "success",
                "message": "ดึงข้อมูลคลังสินค้าสำเร็จ",
                "data": rows
            })
    });
});

app.get('/api/v1/users', function (req, res) {
    const queryTotal = 'SELECT COUNT(*) AS total FROM Users';
    const queryUser = 'SELECT * FROM Users';
    const queryAdmin = "SELECT COUNT(*) AS adminTotal FROM Users WHERE role = 'manager'";

    db.get(queryTotal, (err, countRow) => {
        if (err) {
            return res.status(500).json({ status: "error", message: "Error counting users", data: null });
        }

        db.all(queryUser, (err, userRows) => {
            if (err) {
                return res.status(500).json({ status: "error", message: "Error fetching users", data: null });
            }

            db.get(queryAdmin, (err, adminRow) => {
                if (err) {
                    return res.status(500).json({ status: "error", message: "Error counting admins", data: null });
                }

                // --- ส่ง Response กลับไปหา Fetch ---
                res.status(200).json({
                    status: "success",
                    message: "ดึงข้อมูลผู้ใช้สำเร็จ",
                    data: {
                        users: userRows,
                        total: countRow.total,
                        totalAdmin: adminRow.adminTotal
                    }
                });
            });
        });
    });
});

app.post('/api/v1/users', async function(req,res){
    const { username, password, firstname, lastname, email, phone_number, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const sql = `INSERT INTO Users(username, password, firstname, lastname, email, phone_number, role) VALUES(?, ?, ?, ?, ?, ?, ?)`
    db.run(sql,[username, hashedPassword, firstname, lastname, email, phone_number, role], function(err){
        if(err){
            if(err.message.includes("UNIQUE")){
                return res.status(409).json({
                    "status" : "error",
                    "message" : "ชื่อผู้ใช้งานนี้มีอยู่ในระบบแล้ว",
                    "data" : null
                })
            }else if(err.message.includes("NOT NULL")){
                return res.status(400).json({
                    "status" : "error",
                    "message" : "กรุณากรอกข้อมูลให้ครบ",
                    "data" : null
                })
            }
        }
        return res.status(201).json({
                "status" : "success",
                "message": "เพิ่มข้อมูลพนักงานใหม่สำเร็จ",
                "data": {
                    "user_id" : this.lastID,
                    "username": username,
                    "firstname": firstname,
                    "lastname": lastname,
                    "email": email,
                    "phone_number": phone_number,
                    "role": role 
                }
            })
    });
});

app.delete('/api/v1/users/:id', function (req,res) {
    const sql = `DELETE FROM Users WHERE user_id = ?`;
    db.run(sql,[req.params.id], (err, rows) => {
        if (err) {
            return res.status(400).json({
                "status" : "error",
                "message": "ไม่สามารถลบได้",
                "data": null
            })
        }
        return res.status(200).json({
                "status" : "success",
                "message": "ลบข้อมูลพนักงานสำเร็จ",
                "data": rows
            })
    })
});


app.post('/api/v1/products', upload.single('image'), async (req, res) => {    
    const { mode, name, category, cost, price, condition, location } = req.body;
    const user_id = 1; 
    const warehouse_id = 1; // อิงตามโครงสร้าง Warehouses

    try {
        //จัดการ Location ID 
        const locationId = await new Promise((resolve, reject) => {
            db.get(`SELECT location_id FROM Locations WHERE area = ?`, [location], (err, row) => {
                if (row) return resolve(row.location_id);
                db.run(`INSERT INTO Locations (warehouse_id, area) VALUES (?, ?)`, [warehouse_id, location], function(err) {
                    if (err) return reject(err);
                    resolve(this.lastID);
                });
            });
        });

        //จัดการ Product ID 
        let finalProductId;
        if (mode === 'new') {
            finalProductId = await new Promise((resolve, reject) => {
                const productCode = 'P-' + Date.now();
                const sqlProduct = `INSERT INTO Products (product_code, name, category, cost_price, selling_price) VALUES (?, ?, ?, ?, ?)`;
                db.run(sqlProduct, [productCode, name, category, cost, price], function(err) {
                    if (err) return reject(err);
                    const newId = this.lastID;
                    if (req.file) {
                        const imageUrl = `/images/product/${req.file.filename}`;
                        db.run(`UPDATE Products SET image_url = ? WHERE product_id = ?`, [imageUrl, newId]);
                    }
                    resolve(newId);
                });
            });
        } else {
            finalProductId = mode;
        }

        //บันทึก Transaction 
        await new Promise((resolve, reject) => {
            const sqlTrans = `INSERT INTO Inventory_Transactions (product_id, product_status, quantity, transaction_type, location_id, user_id, date) VALUES (?, ?, 1, 'Stock In', ?, ?, DATETIME('now'))`;
            db.run(sqlTrans, [finalProductId, condition, locationId, user_id], (err) => {
                if (err) return reject(err);
                resolve();
            });
        });

        // อัปเดตตาราง Stock_Balances
        // เช็กก่อนว่ามี "สินค้านี้ ในที่เก็บนี้" หรือยัง
        db.get(`SELECT quantity FROM Stock_Balances WHERE product_id = ? AND location_id = ?`, [finalProductId, locationId], (err, row) => {
            if (row) {
                // กรณีมีอยู่แล้ว -> อัปเดตบวกเพิ่ม
                db.run(`UPDATE Stock_Balances SET quantity = quantity + 1 WHERE product_id = ? AND location_id = ?`, [finalProductId, locationId]);
            } else {
                // กรณีเป็นของใหม่ในโซนนี้ -> สร้างแถวใหม่
                db.run(`INSERT INTO Stock_Balances (product_id, location_id, quantity) VALUES (?, ?, 1)`, [finalProductId, locationId]);
            }
            
            // บันทึก Log และส่งคำตอบกลับ
            db.run(`INSERT INTO System_Logs (username, action, description) VALUES (?, ?, ?)`, ['Admin', 'Add Stock', `เพิ่มสินค้า ID: ${finalProductId} เข้าคลังสำเร็จ`]);
            res.status(201).json({ status: "success", message: "บันทึกสินค้าและอัปเดตยอดสต็อกเรียบร้อย!" });
        });

    } catch (error) {
        console.error("❌ SQL Error:", error.message);
        res.status(500).json({ status: "error", message: "เกิดข้อผิดพลาด: " + error.message });
    }
});

// 5. สั่งให้เซิร์ฟเวอร์เริ่มทำงาน
app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
});