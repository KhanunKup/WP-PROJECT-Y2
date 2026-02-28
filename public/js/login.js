// ดึง Element ของฟอร์มมาเตรียมไว้
const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');

// ดักจับเหตุการณ์เมื่อผู้ใช้กดปุ่ม "เข้าสู่ระบบ" (Submit)
loginForm.addEventListener('submit', async function(event) {
    // 1. หยุดการทำงานปกติของฟอร์ม (ป้องกันไม่ให้หน้าเว็บรีเฟรช)
    event.preventDefault();

    // 2. ดึงค่าจากช่อง Input
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        // 3. ยิง Request ไปหา API ด้วยคำสั่ง fetch
        const response = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' // บอก Server ว่าส่งข้อมูลเป็น JSON นะ
            },
            body: JSON.stringify({ username: username, password: password }) // แปลงข้อมูลเป็น JSON String
        });

        // 4. รอรับคำตอบจาก Server (ที่ Controller พ่นออกมา)
        const result = await response.json();

        // 5. เช็ค status ว่าสำเร็จ หรือ มี Error
        if (response.ok && result.status === 'success') {
            // ถ้ายิง API สำเร็จ (200 OK)
            alert(result.message); // แจ้งเตือน: "เข้าสู่ระบบสำเร็จ"
            
            // เปลี่ยนหน้าเว็บไปที่หน้า Dashboard (ตารางสินค้า)
            window.location.href = '/dashboard'; 
        } else {
            // ถ้ามี Error (เช่น 400, 401)
            alert(result.message); // เอากล่อง Error มาโชว์
        }

    } catch (error) {
        // กรณีที่พังแบบ Server ล่ม หรือเน็ตหลุด
        console.error('Error:', error);
        errorMessage.textContent = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้';
        errorMessage.style.display = 'block';
    }
});