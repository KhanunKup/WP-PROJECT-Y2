document.addEventListener('DOMContentLoaded', () => {
    // 1. โหลดข้อมูลผู้ใช้มาแสดงในตารางทันทีที่เปิดหน้า
    fetchUsers();

    // 2. ใช้ Event Delegation ดักจับการคลิกที่ "ตาราง" 
    // เพื่อหาปุ่ม Delete (ป้องกันปัญหาปุ่มกดไม่ได้เวลาโหลดข้อมูลใหม่)
    const tableBody = document.getElementById('user-table');
    
    tableBody.addEventListener('click', (e) => {
        // ตรวจสอบว่าสิ่งที่คลิกคือปุ่มที่มี class 'delete-btn' ไหม
        const deleteBtn = e.target.closest('.delete-btn');
        
        if (deleteBtn) {
            const userId = deleteBtn.dataset.id;
            const username = deleteBtn.dataset.username; // ดึงชื่อมาโชว์ใน Alert
            confirmDelete(userId, username);
        }
    });
});

// --- ฟังก์ชันดึงข้อมูลและสร้างตาราง ---
async function fetchUsers() {
    try {
        const response = await fetch('/api/v1/users');
        const result = await response.json();

        // ตรวจสอบ status แทนการเช็ค result.users โดยตรง
        if (result.status === 'success') {
            const userData = result.data; // เข้าถึง object data ก่อน

            // อัปเดตตัวเลขจำนวนผู้ใช้/ผู้จัดการบน Card
            document.getElementById('total-user').innerText = userData.total;
            document.getElementById('total-admin').innerText = userData.totalAdmin;

            const tableBody = document.getElementById('user-table');
            tableBody.innerHTML = ''; 

            // วนลูปจาก userData.users
            userData.users.forEach((item, index) => {
                const row = `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${item.username}</td>
                        <td>${item.firstname} ${item.lastname}</td>
                        <td>${item.email}</td>
                        <td>${item.role}</td>
                        <td style="display: flex; padding: 22px; justify-content: right; gap: 20px;">
                            <button class="delete-btn" 
                                    data-id="${item.user_id}" 
                                    data-username="${item.username}"
                                    style="border: none; background: transparent; color: red; cursor: pointer; font-size: 18px;">
                                Delete
                            </button>
                            <a href="/editUser/${item.user_id}"><img src="/images/manageuser-edit.svg"></a>
                        </td>
                    </tr>
                `;
                tableBody.insertAdjacentHTML('beforeend', row);
            });
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

// --- ฟังก์ชันยืนยันและสั่งลบ ---
function confirmDelete(userId, username) {
    Swal.fire({
        title: 'ยืนยันการลบ?',
        text: `คุณกำลังจะลบผู้ใช้: ${username} ข้อมูลนี้จะหายไปถาวร!`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'ใช่, ลบเลย!',
        cancelButtonText: 'ยกเลิก'
    }).then(async (swalResult) => {
        if (swalResult.isConfirmed) {
            try {
                // ยิง API ลบข้อมูล
                const response = await fetch(`/api/v1/users/${userId}`, {
                    method: 'DELETE' // ต้องตรงกับใน server.js
                });

                // รับ JSON ที่ออกแบบไว้ (status, message)
                const apiResult = await response.json();

                if (apiResult.status === 'success') {
                    // กรณีลบสำเร็จ
                    await Swal.fire({
                        title: 'สำเร็จ!',
                        text: apiResult.message,
                        icon: 'success'
                    });
                    fetchUsers(); // รีโหลดตารางเพื่ออัปเดตข้อมูลล่าสุด
                } else {
                    // กรณีลบไม่ได้ (เช่น ติด Error 400)
                    Swal.fire({
                        title: 'เกิดข้อผิดพลาด!',
                        text: apiResult.message,
                        icon: 'error'
                    });
                }
            } catch (error) {
                Swal.fire('Error!', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'error');
            }
        }
    });
}