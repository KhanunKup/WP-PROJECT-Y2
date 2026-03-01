// controllers/authController.js
const db = require('../config/database'); // นำเข้าฐานข้อมูลมาใช้

exports.login = (req, res) => {
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
            db.run(insert, [username, 'Login', 'Login Success'], (err) => { if (err) { console.error("บันทึก Log เข้าสู่ระบบไม่สำเร็จ:", err.message); } })
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
            db.run(insert, [username, 'Login', 'Login Rejected'], (err) => { if (err) { console.error("บันทึก Log เข้าสู่ระบบไม่สำเร็จ:", err.message); } })
            return res.status(401).json({ status: "error", message: "ไม่พบผู้ใช้", data: null });
        }
    });
};

exports.selectwh = (req, res) => {
    const query = 'SELECT * FROM Warehouses'; 
    db.all(query, (err, rows) => {
        if (err) {
            console.log(err.message);
        }
        console.log(rows);
        res.render('warehouseSelect', { data: rows });
    });
};