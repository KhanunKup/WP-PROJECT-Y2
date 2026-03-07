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

const isAuth = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/');
    }
}

const isAdmin = (req, res, next) => {
    if (req.session.userId && req.session.role_id == 1 || req.session.role == 2) {
        next();
    } else {
        return res.redirect('/dashboard');
    }
}

const warehouseSelect = (req,res, next) => {
    if (req.session.warehouseId) {
        next()
    }else{
        // ถ้ายังไม่ได้เลือก ให้กลับไปหน้าเลือกคลังสินค้าก่อน
        return res.redirect('/warehouses');
    }
}

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use('/sweetalert', express.static(__dirname + '/node_modules/sweetalert2/dist'));
app.use('/chartjs', express.static(__dirname + '/node_modules/chart.js/dist'));
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

app.get('/warehouses',isAuth ,(req,res) => {
    // สั่ง render ไฟล์ views/warehouseSelect.ejs
    res.render('warehouseSelect',{
        username: req.session.username,
        role_id: req.session.role_id
    });
});

app.get('/create-warehouse',isAuth ,isAdmin ,(req, res) => {
    res.sendFile(path.join(__dirname, "/public/create-warehouse.html"),{
        username: req.session.username,
        role_id: req.session.role_id
    });
});

app.get('/delete-warehouse',isAuth ,isAdmin ,(req, res) => {
    // สั่ง render ไฟล์ views/warehouseDelete.ejs
    res.render('warehouseDelete',{
        username: req.session.username,
        role_id: req.session.role_id
    });
});

app.get('/dashboard',isAuth ,warehouseSelect ,(req, res) => {
    if (!req.session.warehouseId) {
        // ถ้ายังไม่ได้เลือก ให้กลับไปหน้าเลือกคลังสินค้าก่อน
        return res.redirect('/warehouses');
    }
    res.render('dashboard', {
        username: req.session.username,
        warehouseName: req.session.warehouseName,
        role_id: req.session.role_id
    });
});

app.get('/product-list',isAuth ,warehouseSelect ,(req, res) => {
    // สั่ง render ไฟล์ views/product-list
    res.render('product-list', {
        username: req.session.username,
        warehouseName: req.session.warehouseName,
        role_id: req.session.role_id
    });
});

app.get('/add-product',isAuth ,warehouseSelect ,(req, res) => {
    // สั่ง render ไฟล์ views/add-product.ejs
    res.render('add-product', {
        username: req.session.username,
        warehouseName: req.session.warehouseName,
        role_id: req.session.role_id
    });
});

app.get('/edit-product/:id',isAuth ,warehouseSelect ,(req, res) => {
    // สั่ง render ไฟล์ views/edit-product.ejs
    res.render('edit-product', {
        username: req.session.username,
        warehouseName: req.session.warehouseName,
        role_id: req.session.role_id
    });
});

app.get('/edit-item/:productId/:locationId',isAuth ,warehouseSelect ,(req, res) => {
    // สั่ง render ไฟล์ views/edit-item.ejs
    res.render('edit-item', {
        username: req.session.username,
        warehouseName: req.session.warehouseName,
        role_id: req.session.role_id
    });
});

app.get('/history',isAuth ,warehouseSelect ,(req, res) => {
    res.render('order-history', {
        username: req.session.username,
        warehouseName: req.session.warehouseName,
        role_id: req.session.role_id
    });;
});

app.get('/receive-log',isAuth ,warehouseSelect ,(req, res) => {
    res.render('order-receive-log', {
        username: req.session.username,
        warehouseName: req.session.warehouseName,
        role_id: req.session.role_id
    });;
});

app.get('/export-log',isAuth ,warehouseSelect ,(req, res) => {
    res.render('order-export-log', {
        username: req.session.username,
        warehouseName: req.session.warehouseName,
        role_id: req.session.role_id
    });;
});

app.get('/product-details/:id',isAuth ,warehouseSelect ,(req, res) => {
    // สั่ง render ไฟล์ views/product-details
    res.render('product-details', {
        username: req.session.username,
        role_id: req.session.role_id
    });
});

app.get('/users',isAuth ,isAdmin ,(req, res) => {
    // สั่ง render ไฟล์ views/userManage.ejs
    res.render('userManage', {
        username: req.session.username,
        role_id: req.session.role_id
    });
});

app.get('/edit-user',isAuth ,isAdmin ,(req, res) => {
    // สั่ง render ไฟล์ views/editUsers.ejs
    res.render('editUsers', {
        username: req.session.username,
        role_id: req.session.role_id
    });
});

app.get('/add-users',isAuth ,isAdmin ,(req, res) => {
    // สั่ง render ไฟล์ views/userManage.ejs
    res.render('add-users', {
        username: req.session.username,
        role_id: req.session.role_id
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
            if (isMatch) {
                req.session.userId = row.user_id;
                req.session.username = row.username;
                req.session.role_id = row.role_id;

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

app.post('/api/v1/add-warehouse', (req, res) => {
    // 1. รับค่าที่ Frontend ส่งมา
    const { warehouse_name, warehouse_add } = req.body;

    // 2. ตรวจสอบเบื้องต้น
    if (!warehouse_name || !warehouse_add) {
        return res.status(400).json({
            status: "error",
            message: "กรุณากรอกข้อมูลให้ครบถ้วน",
            data: null
        });
    }

    const sql = `INSERT INTO Warehouses (warehouse_name, warehouse_address) VALUES (?, ?)`;
    db.run(sql, [warehouse_name, warehouse_add], (err) => {
        if (err) {
            console.error("Database Error:", err.message);
            return res.status(500).json({ status: "error", message: "เพิ่มข้อมูลคลังสินค้าไม่สำเร็จ" });
        }

        return res.status(200).json({
            status: "success",
            message: "เพิ่มคลังสินค้าสำเร็จ"
        });
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
    // 1. รับค่า 3 อย่างจากหน้าเว็บ
    const { search, category, status } = req.query;
    const currentWarehouseId = req.session.warehouseId;

    if (!currentWarehouseId) {
        return res.status(400).json({ status: "error", message: "ไม่พบข้อมูลคลังสินค้าปัจจุบัน" });
    }

    let params = [currentWarehouseId];

    // 2. ใช้ JOIN เพื่อดึงชื่อหมวดหมู่ (c.category_name) และคำนวณสต็อกรวม (total_stock)
    let sql = `
        SELECT 
            p.*,
            c.category_name,
            IFNULL(SUM(sb.quantity), 0) AS total_stock
        FROM Products p
        LEFT JOIN Categories c ON p.category_id = c.category_id
        JOIN Stock_Balances sb ON p.product_id = sb.product_id
        JOIN Locations l ON sb.location_id = l.location_id
        WHERE l.warehouse_id = ?
    `;

    // 3. กรองตามชื่อสินค้า
    if (search) {
        sql += ` AND p.name LIKE ?`;
        params.push(`%${search}%`);
    }

    // 4. กรองตามชื่อหมวดหมู่ (เทียบกับ c.category_name แทน)
    if (category && category !== 'all') {
        sql += ` AND c.category_name = ?`;
        params.push(category);
    }

    // 5. จัดกลุ่มข้อมูลสินค้าแต่ละตัวก่อนเช็คสต็อก
    sql += ` GROUP BY p.product_id`;

    // 6. กรองตามสถานะสต็อก (ต้องใช้ HAVING เพราะเป็นการเช็คผลรวมหลัง GROUP BY)
    if (status === 'instock') {
        sql += ` HAVING total_stock > 0`;
    } else if (status === 'outstock') {
        sql += ` HAVING total_stock <= 0`;
    }

    // 7. สั่งรัน Database
    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error("Database Error:", err.message);
            return res.status(500).json({ status: "error", message: "ดึงข้อมูลไม่สำเร็จ" });
        }
        return res.status(200).json({ status: "success", data: rows });
    });
});

app.get('/api/v1/product-details/:id', (req, res) => {
    const productId = req.params.id;
    const currentWarehouseId = req.session.warehouseId;

    // คำสั่งที่ 1: ดึงข้อมูลหลักของสินค้า (รายละเอียดครึ่งบน)
    const sqlProduct = `
        SELECT 
            p.*, 
            IFNULL(SUM(sb.quantity), 0) AS total_stock
        FROM Products p
        LEFT JOIN Stock_Balances sb ON p.product_id = sb.product_id
        LEFT JOIN Locations l ON sb.location_id = l.location_id
        WHERE p.product_id = ? AND l.warehouse_id = ?
        GROUP BY p.product_id;
    `;

    // คำสั่งที่ 2: ดึงข้อมูลรายการสต็อกย่อย โดยคำนวณสดจากตารางประวัติ
    const sqlStock = `
        SELECT 
            p.product_code,
            l.area,
            it.product_status,
            l.location_id,
            -- คำนวณยอดรวม: ถ้าเป็น 'นำเข้าสินค้า' ให้บวกยอด ถ้าเป็นอย่างอื่น (เช่น เบิกออก) ให้ลบยอด
            SUM(CASE WHEN it.transaction_type = 'นำเข้าสินค้า' THEN it.quantity ELSE -it.quantity END) AS quantity
        FROM Inventory_Transactions it
        JOIN Products p ON it.product_id = p.product_id
        JOIN Locations l ON it.location_id = l.location_id
        WHERE it.product_id = ? AND l.warehouse_id = ?
        GROUP BY p.product_code, l.area, it.product_status
        -- กรองเอาเฉพาะกลุ่มที่คำนวณแล้วยังมียอดคงเหลือมากกว่า 0
        HAVING quantity > 0;
    `;

    // 1. สั่งรันคำสั่งแรก (ดึงข้อมูลหลัก)
    db.get(sqlProduct, [productId, currentWarehouseId], (err, productRow) => {
        if (err) return res.status(500).json({ status: "error", message: err.message, data: null });
        if (!productRow) return res.status(404).json({ status: "error", message: "ไม่พบสินค้า", data: null });

        // 2. ถ้าเจอสินค้า ให้สั่งรันคำสั่งที่สองต่อ (ดึงรายการสต็อก)
        db.all(sqlStock, [productId, currentWarehouseId], (err, stockRows) => {
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

    const { mode, name, category_id, cost, price, condition, location } = req.body;
    const currentUserId = req.session.userId || 1; //รับค่าจาก session หรือ default เป็น 1 ถ้ายังไม่มีระบบ login
    const currentWarehouseId = req.session.warehouseId;

    try {
        //หา location_id จากชื่อพื้นที่จัดเก็บ ถ้าไม่มีให้สร้างใหม่
        const locationId = await new Promise((resolve, reject) => {
            db.get(`SELECT location_id FROM Locations WHERE area = ? AND warehouse_id = ?`, [location, currentWarehouseId], (err, row) => {
                if (row) return resolve(row.location_id);
                db.run(`INSERT INTO Locations (warehouse_id, area) VALUES (?, ?)`, [currentWarehouseId, location], function (err) {
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

                    db.run(sqlP, [pCode, name, category_id, cost, price], function (err) {
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
            const sqlT = `INSERT INTO Inventory_Transactions (product_id, product_status, user_id, quantity, transaction_type, location_id) VALUES (?, ?, ?, 1, 'นำเข้าสินค้า', ?)`;
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
        db.run(`INSERT INTO System_Logs (user_id, warehouse_id, action, description) VALUES (?, ?, ?, ?)`,
            [currentUserId, currentWarehouseId, 'นำเข้าสินค้า', `รับสินค้า ID:${productId} ${name} เข้าที่จัดเก็บ: ${location}`]);

        res.status(201).json({ status: "success", message: "บันทึกข้อมูลและรันรหัสสินค้าเรียบร้อย!" });

    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
});

app.put('/api/v1/products/:id', upload.single('image'), async (req, res) => {
    const productId = req.params.id;
    const { name, category_id, cost, price } = req.body; 
    const currentUserId = req.session.userId || 1; //รับค่าจาก session หรือ ใช้ 1 เป็นค่าเริ่มต้น ถ้ายังไม่มีระบบ login
    const currentWarehouseId = req.session.warehouseId;

    try {
        // อัปเดตข้อมูลหลักของสินค้า (Products)
        const sqlUpdate = `UPDATE Products SET name = ?, category_id = ?, cost_price = ?, selling_price = ? WHERE product_id = ?`;

        await new Promise((resolve, reject) => {
            db.run(sqlUpdate, [name, category_id, cost, price, productId], function (err) {
                if (err) return reject(err);
                resolve();
            });
        });

        // ถ้ามีการอัปโหลดไฟล์รูปภาพมา ให้ทำการเปลี่ยนชื่อและย้ายไฟล์
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

        //บันทึกการกระทำลง System_Logs
        db.run(`INSERT INTO System_Logs (user_id, warehouse_id, action, description) VALUES (?, ?, ?, ?)`, 
            [currentUserId, currentWarehouseId, 'แก้ไขข้อมูลสินค้า', `แก้ไขข้อมูลหลักของสินค้า ID:${productId} ${name}`]);

        res.status(200).json({ status: "success", message: "อัปเดตข้อมูลสำเร็จ" });

    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
});

app.get('/api/v1/stocks/:productId/:locationId', (req, res) => {
    const { productId, locationId } = req.params;
    const currentWarehouseId = req.session.warehouseId;

    const sql = `
        SELECT 
            p.product_id, p.product_code, p.name, p.selling_price, p.image_url, 
            c.category_name,
            l.area AS location_name,
            (SELECT SUM(CASE WHEN transaction_type = 'นำเข้าสินค้า' THEN quantity ELSE -quantity END) 
             FROM Inventory_Transactions 
             WHERE product_id = p.product_id AND location_id = l.location_id 
             AND product_status = 'ปกติ') AS good_qty,
            (SELECT SUM(CASE WHEN transaction_type = 'นำเข้าสินค้า' THEN quantity ELSE -quantity END) 
             FROM Inventory_Transactions 
             WHERE product_id = p.product_id AND location_id = l.location_id 
             AND product_status = 'เสียหาย') AS damaged_qty
        FROM Products p
        LEFT JOIN Categories c ON p.category_id = c.category_id
        LEFT JOIN Locations l ON l.location_id = ? AND l.warehouse_id = ?
        WHERE p.product_id = ?;
    `;
    
    db.get(sql, [locationId, currentWarehouseId, productId], (err, row) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        if (!row) return res.status(404).json({ status: "error", message: "ไม่พบข้อมูล" });
        
        // เติม 0 ป้องกันค่า null
        row.good_qty = row.good_qty || 0;
        row.damaged_qty = row.damaged_qty || 0;
        
        res.status(200).json({ status: "success", data: row });
    });
});

app.post('/api/v1/transactions', async (req, res) => {
    const { product_id, product_status, quantity, transaction_type, location_name } = req.body;
    const user_id = req.session.userId || 1;
    const currentWarehouseId = req.session.warehouseId;

    try {
        //หา location_id จากชื่อที่พิมพ์มา (ถ้าไม่มีให้สร้างใหม่เหมือนหน้า add-product)
        const locationId = await new Promise((resolve, reject) => {
            db.get(`SELECT location_id FROM Locations WHERE area = ? AND warehouse_id = ?`, [location_name, currentWarehouseId], (err, row) => {
                if (row) return resolve(row.location_id);
                // ถ้าไม่เจอชื่อ ให้สร้างใหม่ในคลังที่ 1
                db.run(`INSERT INTO Locations (warehouse_id, area) VALUES (?, ?)`, [currentWarehouseId, location_name], function(err) {
                    if (err) return reject(err);
                    resolve(this.lastID);
                });
            });
        });

        //บันทึก Transaction และ Update Stock ด้วย locationId ที่หามาได้
        const sqlInsertTrans = `INSERT INTO Inventory_Transactions (product_id, location_id, quantity, product_status, transaction_type, user_id) VALUES (?, ?, ?, ?, ?, ?)`;
        db.run(sqlInsertTrans, [product_id, locationId, quantity, product_status, transaction_type, user_id], function(err) {
            if (err) throw err;
            
            const adjustQty = transaction_type === 'เบิกจ่าย' ? -quantity : quantity;

            const sqlUpdateStock = `UPDATE Stock_Balances SET quantity = quantity + ? WHERE product_id = ? AND location_id = ?`;
            db.run(sqlUpdateStock, [adjustQty, product_id, locationId], function(err2) {
                if (this.changes === 0) {
                    db.run(`INSERT INTO Stock_Balances (product_id, location_id, quantity) VALUES (?, ?, ?)`, [product_id, locationId, quantity]);
                }

                const logDescription = `$ปรับปรุงสต๊อกสินค้า ID:${product_id} สถานะ: ${product_status} จำนวน ${quantity} ชิ้น ที่ ${location_name}`;
                db.run(`INSERT INTO System_Logs (user_id, warehouse_id, action, description) VALUES (?, ?, ?, ?)`,
                    [user_id, currentWarehouseId, transaction_type, logDescription], 
                    (logErr) => {
                        if (logErr) {
                            console.error("บันทึก System_Logs ไม่สำเร็จ:", logErr.message);
                        }
                        res.status(201).json({ status: "success", message: "บันทึกสำเร็จ" });
                    }
                );
            });
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

app.get('/api/v1/categories', (req, res) => {
    const sql = `SELECT * FROM Categories ORDER BY category_name ASC`;
    db.all(sql, [], (err, rows) => {
        if (err) {
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
                "status": "error",
                "message": "ไม่สามารถดึงข้อมูลคลังสินค้าได้",
                "data": null
            })
        }
        return res.status(200).json({
            "status": "success",
            "message": "ดึงข้อมูลคลังสินค้าสำเร็จ",
            "data": rows
        })
    });
});

app.post('/api/v1/delete-warehouse', function (req, res) {
    const {warehouse_id} = req.body;
    const query = `DELETE FROM Warehouses WHERE warehouse_id = ?`;

    if (!warehouse_id) {
        return res.status(400).json({
            status: "error",
            message: "ไม่พบไอดีคลังสินค้า"
        });
    }

    db.run(query, [warehouse_id], (err) => {
        if (err) {
            return res.status(500).json({
                "status": "error",
                "message": "ไม่สามารถลบข้อมูลคลังสินค้าได้",
            })
        }
        return res.status(200).json({
            "status": "success",
            "message": "ลบข้อมูลคลังสินค้าสำเร็จ",
        })
    });
});

app.post('/api/v1/select-warehouse', function (req, res) {
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
    const queryUser = `SELECT * FROM Users INNER JOIN Roles ON Users.role_id = Roles.role_id`;
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

app.post('/api/v1/users', async function (req, res) {
    const { username, password, firstname, lastname, email, phone_number, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const sql = `INSERT INTO Users(username, password, firstname, lastname, email, phone_number, role_id) VALUES(?, ?, ?, ?, ?, ?, ?)`
    db.run(sql, [username, hashedPassword, firstname, lastname, email, phone_number, role], function (err) {
        if (err) {
            if (err.message.includes("UNIQUE")) {
                return res.status(409).json({
                    "status": "error",
                    "message": "ชื่อผู้ใช้งานหรืออีเมลนี้มีอยู่ในระบบแล้ว",
                    "data": null
                })
            } else if (err.message.includes("NOT NULL")) {
                return res.status(400).json({
                    "status": "error",
                    "message": "กรุณากรอกข้อมูลให้ครบ",
                    "data": null
                })
            }
        }
        return res.status(201).json({
            "status": "success",
            "message": "เพิ่มข้อมูลผู้ใช้ใหม่สำเร็จ",
            "data": {
                "user_id": this.lastID,
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

app.delete('/api/v1/users/:id', function (req, res) {
    const sql = `DELETE FROM Users WHERE user_id = ?`;
    db.run(sql, [req.params.id], (err, rows) => {
        if (err) {
            return res.status(400).json({
                "status": "error",
                "message": "ไม่สามารถลบได้",
                "data": null
            })
        }
        return res.status(200).json({
            "status": "success",
            "message": "ลบข้อมูลผู้ใช้สำเร็จ",
            "data": rows
        })
    })
});

app.get('/editUser/:id', (req, res) => {
    req.session.edit_id = req.params.id;
    console.log(`session is ${req.session.edit_id}`)
    res.redirect('/edit-user');
});

app.get('/api/v1/editUser', function (req, res) {
    const sql = `SELECT * FROM Users WHERE user_id = ?`;
    db.get(sql, [req.session.edit_id], (err, rows) => {
        if (err) {
            return res.status(400).json({
                "status": "error",
                "message": "ไม่สามารถเเก้ไขได้",
                "data": null
            })
        }
        return res.status(200).json({
            "status": "success",
            "message": "เเก้ไขข้อมูลพนักงานสำเร็จ",
            "data": rows
        })
    })
});

app.post('/api/v1/updateUser', async function (req, res) {
    const { username, password, firstname, lastname, email, phone_number, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const sql = `UPDATE Users SET username = ?, password = ?, firstname = ?, lastname = ?, email = ?, phone_number = ?, role_id = ? WHERE user_id = ${req.session.edit_id}`
    db.run(sql, [username, hashedPassword, firstname, lastname, email, phone_number, role], function (err) {
        if (err) {
            if (err.message.includes("NOT NULL")) {
                return res.status(400).json({
                    "status": "error",
                    "message": "กรุณากรอกข้อมูลให้ครบ",
                    "data": null
                })
            }
        }
        return res.status(201).json({
            "status": "success",
            "message": "เเก้ไขข้อมูลผู้ใช้สำเร็จ",
            "data": {
                "user_id": this.lastID,
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

app.get('/api/v1/all-order', (req, res) => {
    const currentWarehouseId = req.session.warehouseId;
    // send data to
    const sql = `select datetime(date, '+7 hours') as date, u.username as username, concat(u.firstname ,' ', u.lastname) as fullname,
                concat('ชื่อสินค้า: ',p.name,' ,จำนวน: ',quantity,' ,สถานะ: ',product_status) as detail,
                transaction_type as action,u.email as email, r.role_name as role
                
                from Inventory_Transactions as it
                left join Users as u
                on it.user_id = u.user_id
                left join Products as p
                on it.product_id = p.product_id
                left join Roles as r
                on u.role_id = r.role_id
                left join Locations l
                on it.location_id = l.location_id
                where l.warehouse_id = ?
                
                union all
                select datetime(created_at, '+7 hours') as date, us.username, concat(us.firstname,' ',us.lastname) as fullname,  description as detail, action, us.email as email, ro.role_name as role
                from System_Logs as sl
                left join Users as us
                on sl.user_id = us.user_id
                left join Roles as ro
                on us.role_id = ro.role_id
                where sl.warehouse_id = ? OR sl.warehouse_id IS NULL
                order by date desc;`
    // (db.all) pull every column and [] is blank waiting for param (in this case is no parameter)
    db.all(sql, [currentWarehouseId,currentWarehouseId], (err, rows) => {
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

// 
app.get('/api/v1/dashboard-summary', (req, res) => {
    const currentWarehouseId = req.session.warehouseId;
    // pull status to add at top of dashboard (4 card) totalStock, lowStock,addThisMonth, exportThisMonth
    const cardTop = `select (select sum(quantity) from Stock_Balances sb join Locations l on sb.location_id = l.location_id where l.warehouse_id = ?) as TotalStock, 
                    (select count(*) from Stock_Balances sb join Locations l on sb.location_id = l.location_id where quantity <= 20 and l.warehouse_id = ?) as LowStock,
                    ifnull((select sum(quantity) from Inventory_Transactions it join Locations l on it.location_id = l.location_id 
                        where transaction_type = 'นำเข้าสินค้า' and l.warehouse_id = ?
                        and strftime('%Y-%m', date) = strftime('%Y-%m', 'now')),0) as stockInMonth,
                    ifnull((select sum(quantity) from Inventory_Transactions  it join Locations l on it.location_id = l.location_id 
                        where transaction_type = 'เบิกจ่ายสินค้า' and l.warehouse_id = ?
                        and strftime('%Y-%m', date) = strftime('%Y-%m', 'now')),0) as stockOutMonth`;
    // get only 1 row
    db.get(cardTop,[currentWarehouseId,currentWarehouseId,currentWarehouseId,currentWarehouseId],(err,stats)=>{
        if (err) {
            console.error(err.message);
            return res.status(500).json({ status: "error", message: "Server Error", data: null });
        }
        // map quantity to category (use in chart histogram) -> (อุปกรณ์เสริม, 290)
        const chartBar = `select c.category_name, ifnull(sum(quantity),0) as quantity 
                            from Categories c
                            left join Products p 
                            on c.category_id = p.category_id
                            left join Stock_Balances sb 
                            on p.product_id = sb.product_id
                            left join Locations l
                            on sb.location_id = l.location_id
                            where l.warehouse_id = ?
                            group by c.category_id, c.category_name`
        db.all(chartBar,[currentWarehouseId],(err,quantityByCategory)=>{
            if (err) {
                console.error(err.message);
                return res.status(500).json({ status: "error", message: "Server Error", data: null });
            }
            // show low stock list (will equal to lowStock at the top of card)
            const lowStockProduct= `select p.product_code, name, c.category_name, l.area ,sb.quantity
                                    from Products p
                                    left join Stock_Balances sb 
                                    on p.product_id = sb.product_id
                                    left join Categories c 
                                    on p.category_id = c.category_id
                                    left join Locations l
                                    on l.location_id = sb.location_id
                                    where sb.quantity <= 20 and l.warehouse_id = ?
                                    order by p.product_id;`
            db.all(lowStockProduct,[currentWarehouseId],(err,products)=>{
                if (err) {
                    console.error(err.message);
                    return res.status(500).json({ status: "error", message: "Server Error", data: null });
                }
                // pull lastest activity in sys_log data (limit 10 rows) exclude login-logout activity
                const activity = `select datetime(sl.created_at, '+7 hours') as date, 
                                        us.username,
                                        sl.description
                                    from System_Logs as sl
                                    left join Users as us
                                    on sl.user_id = us.user_id
                                    where sl.description != '-' AND (sl.warehouse_id = ? OR sl.warehouse_id IS NULL)
                                    order by 1 desc limit 10;`
                db.all(activity,[currentWarehouseId],(err,log)=>{
                    if (err) {
                        console.error(err.message);
                        return res.status(500).json({ status: "error", message: "Server Error", data: null });
                    }
                    // pull value of product base on price (group by category)
                    const value = `select c.category_name as name, ifnull(sum(sb.quantity * p.cost_price), 0) as total_value
                                    from Categories c
                                    left join Products p
                                    on c.category_id = p.category_id
                                    left join Stock_Balances sb
                                    on p.product_id = sb.product_id
                                    left join Locations l
                                    on sb.location_id = l.location_id
                                    WHERE l.warehouse_id = ?
                                    group by c.category_id, category_name
                                    order by total_value desc;`
                        db.all(value,[currentWarehouseId],(err,price)=>{
                            res.status(200).json({
                            status: "success",
                            message: "ดึงข้อมูลได้สำเร็จ",
                            // send data
                            data: {
                                stats: stats,
                                chart: quantityByCategory,
                                lowStock: products,
                                activity: log,
                                value: price
                            }
                        });
                    });
                });
            });
            
        });
            
    });
});

// Start the server
app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
});