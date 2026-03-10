document.addEventListener('DOMContentLoaded', () => {
    fetchUsers();

    const tableBody = document.getElementById('user-table');

    tableBody.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-btn');

        if (deleteBtn) {
            const userId = deleteBtn.dataset.id;
            const username = deleteBtn.dataset.username;
            confirmDelete(userId, username);
        }
    });
});

async function fetchUsers() {
    try {
        const response = await fetch('/api/v1/users');
        const result = await response.json();

        if (result.status === 'success') {
            const userData = result.data;

            document.getElementById('total-user').innerText = userData.total;
            document.getElementById('total-admin').innerText = userData.totalAdmin;

            const tableBody = document.getElementById('user-table');
            tableBody.innerHTML = '';
            userData.users.forEach((item, index) => {
                let roleBgColor = '#E0E0E0';
                let roleTextColor = '#333333';

                if (item.role_name === 'ผู้ดูเเลระบบ' || item.role_name === 'Admin') {
                    roleBgColor = '#ffebee';
                    roleTextColor = '#c62828';
                } else if (item.role_name === 'ผู้จัดการ' || item.role_name === 'Manager') {
                    roleBgColor = '#fff3e0';
                    roleTextColor = '#ef6c00';
                } else if (item.role_name === 'พนักงาน' || item.role_name === 'Staff') {
                    roleBgColor = '#e8f5e9';
                    roleTextColor = '#2e7d32';
                }
                const row = `
                    <tr>
                        <td style="vertical-align: middle;">${index + 1}</td>
                        <td style="vertical-align: middle;">${item.username}</td>
                        <td style="vertical-align: middle;">${item.firstname} ${item.lastname}</td>
                        <td style="vertical-align: middle;">${item.email}</td>
                        <td style="vertical-align: middle;">
                            <span style="background-color: ${roleBgColor}; color: ${roleTextColor}; padding: 6px 16px; border-radius: 10px; font-size: 16px; font-weight: bold; display: inline-block; text-align: center; white-space: nowrap;">
                                ${item.role_name}
                            </span>
                        </td>
                        
                        <td style="vertical-align: middle;">
                            <div style="display: flex; align-items: center; justify-content: flex-end; gap: 20px;">
                                <button class="delete-btn" 
                                        data-id="${item.user_id}" 
                                        data-username="${item.username}"
                                        style="border: none; background: transparent; color: red; cursor: pointer; font-size: 18px; font-weight: bold; padding: 0;">
                                    Delete
                                </button>
                                <a href="/editUser/${item.user_id}" style="display: flex; align-items: center;">
                                    <img src="/images/manageuser-edit.svg" alt="Edit" style="width: 24px; height: 24px;">
                                </a>
                            </div>
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
        text: `คุณกำลังจะลบผู้ใช้: ${username} ข้อมูลนี้จะหายไปถาวร`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#09a00e',
        cancelButtonColor: '#d33',
        confirmButtonText: 'ยืนยัน',
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

const searchInput = document.getElementById('searchInput');

if (searchInput) {
    searchInput.addEventListener('keyup', function () {
        const filter = this.value.toLowerCase();

        const rows = document.querySelectorAll('#user-table tr');

        rows.forEach(row => {
            const username = row.cells[1].textContent.toLowerCase();
            const fullname = row.cells[2].textContent.toLowerCase();

            if (username.includes(filter) || fullname.includes(filter)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
}