// ตัวอย่างการตั้งค่าเบื้องต้น (ถ้ายังไม่มี)
const express = require('express');
const app = express();

app.set('view engine', 'ejs'); // บอกว่าใช้ EJS
app.use(express.static('public')); // บอกว่าไฟล์ CSS อยู่ในโฟลเดอร์ public

// Route สำหรับเปิดหน้ารายการสินค้า
app.get('/add-product', (req, res) => {
    // สั่ง render ไฟล์ views/add-product.ejs
    res.render('add-product'); 
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});