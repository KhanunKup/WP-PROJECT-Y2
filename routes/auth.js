// routes/auth.js
const express = require('express');
const router = express.Router();

// นำเข้า Controller ที่มีโค้ดการทำงานหลักอยู่
const authController = require('../controllers/authController');

// เมื่อมีการยิง POST มาที่ /api/v1/auth/login 
// ให้เรียกใช้ฟังก์ชัน login ที่อยู่ใน authController
router.post('/login', authController.login);
router.get('/select-warehouse', authController.selectwh);
// router.post('/logout', authController.logout);

module.exports = router; // ส่งออกไปให้ server.js เรียกใช้