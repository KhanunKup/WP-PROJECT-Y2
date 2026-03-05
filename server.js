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
    destination: (req, file, cb) => {
        const dir = 'public/images/product';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const productName = req.body.name || 'product';
        const safeName = productName.replace(/\s+/g, '-').replace(/[^\w\u0E00-\u0E7F-]/g, '');
        const uniqueSuffix = Date.now().toString().slice(-4); 
        cb(null, `${safeName}-${uniqueSuffix}${path.extname(file.originalname)}`);
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
    // if (!req.session.username) {
    //     // ถ้ายังไม่ได้ login ให้กลับไปหน้า login ก่อน
    //     return res.redirect('/');
    // }

    // if (!req.session.warehouseId) {
    //     // ถ้ายังไม่ได้เลือก ให้กลับไปหน้าเลือกคลังสินค้าก่อน
    //     return res.redirect('/warehouses');
    // }
    res.render('dashboard', {
        username: req.session.username,
        warehouseName: req.session.warehouseName 
    });
});

app.get('/product-list', (req, res) => {
    // สั่ง render ไฟล์ views/product-list
    res.render('product-list', {
        username: req.session.username,
        warehouseName: req.session.warehouseName 
    });
});

app.get('/add-product', (req, res) => {
    // สั่ง render ไฟล์ views/add-product.ejs
    res.render('add-product', {
        username: req.session.username,
        warehouseName: req.session.warehouseName 
    });
});

app.get('/edit-product/:id', (req, res) => {
    // สั่ง render ไฟล์ views/edit-product.ejs
    res.render('edit-product', {
        username: req.session.username,
        warehouseName: req.session.warehouseName
    });
});

app.get('/history', (req, res) => {
    res.render('order-history', {
        username: req.session.username,
        warehouseName: req.session.warehouseName 
    });;
});

app.get('/receive-log', (req, res) => {
    res.render('order-receive-log', {
        username: req.session.username,
        warehouseName: req.session.warehouseName 
    });;
});

app.get('/export-log', (req, res) => {
    res.render('order-export-log', {
        username: req.session.username,
        warehouseName: req.session.warehouseName 
    });;
});

app.get('/product-details/:id', (req, res) => {
    // สั่ง render ไฟล์ views/product-details
    res.render('product-details', {
        username: req.session.username,
    });
});

app.get('/warehouses', (req,res) => {
    // สั่ง render ไฟล์ views/warehouseSelect.ejs
    res.render('warehouseSelect');
});

app.get('/users', (req,res) => {
    // สั่ง render ไฟล์ views/userManage.ejs
    res.render('userManage', {
        username: req.session.username,
    });
});

app.get('/add-users', (req,res) => {
    // สั่ง render ไฟล์ views/userManage.ejs
    res.render('add-users', {
        username: req.session.username,
    });
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
    const insert = `insert into System_logs (user_id, action, description) values (?, ?, ?)`;
    db.get(sql, [username], async (err, row) => {
        if (err) {
            return res.status(500).json({ 
                status: "error", 
                message: "เซิร์ฟเวอร์มีปัญหา", 
                data: null 
            });
        }

        if (row) {
            const isMatch = await bcrypt.compare(password, row.password);
            if(isMatch){
                req.session.userId = row.user_id;
                req.session.username = row.username;
                req.session.role = row.role;

                //เก็บเข้า system_logs database
                db.run(insert, [row.user_id, 'เข้าสู่ระบบ', 'เข้าสู่ระบบสำเร็จ'], (err) => { 
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
            }else{
                db.run (insert, [row.user_id,'เข้าสู่ระบบ','เข้าสู่ระบบไม่สำเร็จ'],(err) => {
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
        } else {
            db.run (insert, [row.user_id,'เข้าสู่ระบบ','เข้าสู่ระบบไม่สำเร็จ'],(err) => {
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
    const userId = req.session ? req.session.userId : null;
    const insert = `insert into System_logs (user_id, action, description) values (?, ?, ?)`;
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error destroying session.');
        }
        db.run (insert, [userId,'ออกจากระบบ','ออกจากระบบสำเร็จ'],(err) => {
            if (err) {
                console.error("บันทึก Log ออกจากระบบไม่สำเร็จ:", err.message);
            }
        });
        res.clearCookie('connect.sid');
        
        res.status(200).json({
            status: "success", 
            message: "ออกจากระบบสำเร็จ"
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
    const productId = req.params.id;

    // คำสั่งที่ 1: ดึงข้อมูลหลักของสินค้า (รายละเอียดครึ่งบน)
    const sqlProduct = `
        SELECT 
            p.*, 
            IFNULL(SUM(sb.quantity), 0) AS total_stock
        FROM Products p
        LEFT JOIN Stock_Balances sb ON p.product_id = sb.product_id
        WHERE p.product_id = ?
        GROUP BY p.product_id;
    `;

    // คำสั่งที่ 2: ดึงข้อมูลรายการสต็อกย่อย โดยคำนวณสดจากตารางประวัติ
    const sqlStock = `
        SELECT 
            p.product_code,
            l.area,
            it.product_status,
            -- คำนวณยอดรวม: ถ้าเป็น 'นำเข้าสินค้า' ให้บวกยอด ถ้าเป็นอย่างอื่น (เช่น เบิกออก) ให้ลบยอด
            SUM(CASE WHEN it.transaction_type = 'นำเข้าสินค้า' THEN it.quantity ELSE -it.quantity END) AS quantity
        FROM Inventory_Transactions it
        JOIN Products p ON it.product_id = p.product_id
        JOIN Locations l ON it.location_id = l.location_id
        WHERE it.product_id = ?
        GROUP BY p.product_code, l.area, it.product_status
        -- กรองเอาเฉพาะกลุ่มที่คำนวณแล้วยังมียอดคงเหลือมากกว่า 0
        HAVING quantity > 0;
    `;

    // 1. สั่งรันคำสั่งแรก (ดึงข้อมูลหลัก)
    db.get(sqlProduct, [productId], (err, productRow) => {
        if (err) return res.status(500).json({ status: "error", message: err.message, data: null });
        if (!productRow) return res.status(404).json({ status: "error", message: "ไม่พบสินค้า", data: null });

        // 2. ถ้าเจอสินค้า ให้สั่งรันคำสั่งที่สองต่อ (ดึงรายการสต็อก)
        db.all(sqlStock, [productId], (err, stockRows) => {
            if (err) return res.status(500).json({ status: "error", message: err.message, data: null });

            // 3. จับข้อมูลทั้ง 2 ก้อน มัดรวมกันใน property "data" แล้วส่งกลับไป
            console.log("1. ข้อมูล Product:", productRow);
            console.log("2. ข้อมูล Stock List:", stockRows);
            res.status(200).json({
                status: "success",
                message: "ดึงข้อมูลสินค้าสำเร็จ",
                data: {
                    productInfo: productRow, // เป็น Object {...} สำหรับแสดงครึ่งบน
                    stockList: stockRows     // เป็น Array [...] สำหรับวนลูปโชว์ตารางครึ่งล่าง
                }
            });
        });
    });
});

//เพิ่มสินค้าใหม่ หรือ รับสินค้าเข้าคลัง
app.post('/api/v1/products', upload.single('image'), async (req, res) => {
    let sql = `
        SELECT p.*, c.category_name 
        FROM Products p
        LEFT JOIN Categories c ON p.category_id = c.category_id
        WHERE 1=1`;
    
    let params = [];

    const { mode, name, category_id, cost, price, condition, location } = req.body;
    const currentUserName = req.session.username || 'admin';
    const currentUserId = req.session.userId || 1;

    try {
        //หา location_id จากชื่อพื้นที่จัดเก็บ ถ้าไม่มีให้สร้างใหม่
        const locationId = await new Promise((resolve, reject) => {
            db.get(`SELECT location_id FROM Locations WHERE area = ?`, [location], (err, row) => {
                if (row) return resolve(row.location_id);
                db.run(`INSERT INTO Locations (warehouse_id, area) VALUES (?, ?)`, [1, location], function(err) {
                    if (err) return reject(err);
                    resolve(this.lastID);
                });
            });
        });

        let productId;

        if (mode === 'new') {
            productId = await new Promise((resolve, reject) => {
                db.get("SELECT MAX(product_id) as maxId FROM Products", (err, row) => {
                    const nextId = (row.maxId || 0) + 1;
                    const pCode = `P-${String(nextId).padStart(3, '0')}`;

                    // ใช้ category_id บันทึกลงตาราง Products 
                    const sqlP = `INSERT INTO Products (product_code, name, category_id, cost_price, selling_price) VALUES (?, ?, ?, ?, ?)`;
                    
                    db.run(sqlP, [pCode, name, category_id, cost, price], function(err) {
                        if (err) return reject(err);
                        const newId = this.lastID;

                        // ถ้ามีการอัปโหลดไฟล์รูปภาพมา ให้ทำการเปลี่ยนชื่อและย้ายไฟล์
                        if (req.file) {
                            const extension = path.extname(req.file.originalname);
                            const paddedFileName = String(newId).padStart(3, '0'); // ทำเป็น 011
                            const newFileName = `${paddedFileName}${extension}`;
                            
                            const oldPath = req.file.path;
                            const newPath = path.join(__dirname, 'public/images/product', newFileName);

                            fs.renameSync(oldPath, newPath);

                            // อัปเดต URL รูปในตาราง Products ให้ตรงกับชื่อใหม่
                            const imgUrl = `/images/product/${newFileName}`;
                            db.run(`UPDATE Products SET image_url = ? WHERE product_id = ?`, [imgUrl, newId]);
                        }
                        resolve(newId);
                    });
                });
            });
        } else {
            productId = mode;
        }

        // บันทึกการเคลื่อนไหวสินค้า (Inventory_Transactions)
        await new Promise((resolve, reject) => {
            const sqlT = `INSERT INTO Inventory_Transactions (product_id, product_status, user_id, quantity, transaction_type, location_id) VALUES (?, ?, ?, 1, 'รับสินค้าเข้าคลัง', ?)`;
            db.run(sqlT, [productId, condition, currentUserId, locationId], (err) => {
                if (err) return reject(err);
                resolve();
            });
        });

        // อัปเดตยอดคงเหลือในตาราง Stock_Balances
        db.get(`SELECT stock_id FROM Stock_Balances WHERE product_id = ? AND location_id = ?`, [productId, locationId], (err, row) => {
            if (row) {
                db.run(`UPDATE Stock_Balances SET quantity = quantity + 1 WHERE stock_id = ?`, [row.stock_id]);
            } else {
                db.run(`INSERT INTO Stock_Balances (product_id, location_id, quantity) VALUES (?, ?, 1)`, [productId, locationId]);
            }
        });

        // บันทึกการกระทำลง System_Logs
        db.run(`INSERT INTO System_Logs (user_id, action, description) VALUES (?, ?, ?)`, 
            [currentUserId, 'นำสินค้าเข้า', `รับสินค้า ID:${productId} ${name} เข้าที่จัดเก็บ: ${location}`]);

        res.status(201).json({ status: "success", message: "บันทึกข้อมูลและรันรหัสสินค้าเรียบร้อย!" });

    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
});

app.put('/api/v1/products/:id', upload.single('image'), async (req, res) => {
    const productId = req.params.id;
    const { name, category_id, cost, price } = req.body; 
    const currentUserId = req.session.userId || 1; // สมมติว่าได้จาก session มาแล้ว หรือใช้ 1 เป็นค่าเริ่มต้นสำหรับ admin

    try {
        // 1. อัปเดตข้อมูลหลักในตาราง Products
        const sqlUpdate = `UPDATE Products SET name = ?, category_id = ?, cost_price = ?, selling_price = ? WHERE product_id = ?`;
        
        await new Promise((resolve, reject) => {
            db.run(sqlUpdate, [name, category_id, cost, price, productId], function(err) {
                if (err) return reject(err);
                resolve();
            });
        });

        // 2. ถ้ามีการเลือกรูปใหม่มา ค่อยอัปเดตรูป
        if (req.file) {
            const ext = path.extname(req.file.originalname);
            const paddedId = String(productId).padStart(3, '0');
            const newFileName = `${paddedId}${ext}`;
            const newPath = path.join(__dirname, 'public/images/product', newFileName); 
            
            const fs = require('fs');
            // ย้ายและเปลี่ยนชื่อไฟล์รูปใหม่
            fs.renameSync(req.file.path, newPath);
            
            // อัปเดต path รูปใน Database
            db.run(`UPDATE Products SET image_url = ? WHERE product_id = ?`, [`/images/product/${newFileName}`, productId]);
        }

        // 3. บันทึก Log ว่าใครเป็นคนแก้
        db.run(`INSERT INTO System_Logs (user_id, action, description) VALUES (?, ?, ?)`, 
            [currentUserId, 'แก้ไขข้อมูลสินค้า', `แก้ไขข้อมูลหลักของสินค้า ID:${productId} ${name}`]);

        // ส่งสัญญาณบอกหน้าบ้านว่าเสร็จแล้ว
        res.status(200).json({ status: "success", message: "อัปเดตข้อมูลสำเร็จ" });

    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
});

app.get('/api/v1/categories', (req, res) => {
    const sql = `SELECT * FROM Categories ORDER BY category_name ASC`;
    db.all(sql, [], (err, rows) => {
        if (err){
            return res.status(500).json({
                status: "error",
                message: err.message,
                data: null
            });
        }
        res.status(200).json({
            status: "success",
            message: "ดึงข้อมูล category สำเร็จ",
            data: rows
        });
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

app.post('/api/v1/select-warehouse', function(req, res){
    const { warehouse_id } = req.body;

    if (!warehouse_id) {
        return res.status(400).json({
            status: "error",
            message: "ไม่พบไอดีคลังสินค้า"
        });
    }

    const sql = `SELECT warehouse_name FROM Warehouses WHERE warehouse_id = ?`;
    db.get(sql, [warehouse_id], (err, row) => {
        if (row) {
            req.session.warehouseId = warehouse_id;
            req.session.warehouseName = row.warehouse_name;
        }
        
        return res.status(200).json({
            status: "success",
            message: "เลือกคลังสินค้าสำเร็จ",
            data: { warehouse_id: warehouse_id }
        });
    });
});

app.get('/api/v1/users', function (req, res) {
    const queryTotal = 'SELECT COUNT(*) AS total FROM Users';
    const queryUser = 'SELECT * FROM Users';
    const queryAdmin = "SELECT COUNT(*) AS adminTotal FROM Users WHERE role_id = '1'";

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
    const sql = `INSERT INTO Users(username, password, firstname, lastname, email, phone_number, role_id) VALUES(?, ?, ?, ?, ?, ?, ?)`
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

app.get('/api/v1/all-order', (req, res) => {
    // send data to
    const sql = `select date, u.username as username, concat(u.firstname ,' ', u.lastname) as fullname,
                concat('ชื่อสินค้า: ',p.name,' ,จำนวน: ',quantity,' ,สถานะ: ',product_status) as detail,
                transaction_type as action,u.email as email, r.role_name as role
                
                from Inventory_Transactions as it
                left join Users as u
                on it.user_id = u.user_id
                left join Products as p
                on it.product_id = p.product_id
                left join Roles as r
                on u.role_id = r.role_id
                
                union all
                select created_at as date, us.username, concat(us.firstname,' ',us.lastname) as fullname,  description as detail, action, us.email as email, ro.role_name as role
                from System_Logs as sl
                left join Users as us
                on sl.user_id = us.user_id
                left join Roles as ro
                on us.role_id = ro.role_id
                order by created_at desc;`
    // (db.all) pull every column and [] is blank waiting for param (in this case is no parameter)
    db.all(sql,[], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ status: "error", message: "Server Error", data: null });
        }
        // status 200 is OK and .json({}) is trasnform data into json format
        res.status(200).json({
            status: "success",
            message: "ดึงข้อมูลสำเร็จ",
            data: rows // Send Array back (JSON)
            // row would look like this
            // {"status":"success","message":"ดึงข้อมูลสำเร็จ",data:[{"date":"2026-03-04 17:00:00","username":"admin","name":"-","detail":"Admin somchai logged out","action":"LOGOUT","email":"-","role":"-"}, {}, {} ]
        });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
});