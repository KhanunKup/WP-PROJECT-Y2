const userForm = document.getElementById('add-users-form');

document.addEventListener('DOMContentLoaded', async () => {
    // โค้ดส่วนนี้จะทำงานทันทีเมื่อหน้าแก้ไขโหลดเสร็จ
    try {
        // ยิงไปหา API ที่เราเพิ่งสร้างใหม่
        const response = await fetch('/api/v1/editUser');
        const result = await response.json();

        if (response.ok && result.status === 'success') {
            const user = result.data;
            // เอาข้อมูลที่ได้ มาหยอดทิ้งไว้ในฟอร์ม
            document.getElementById('username').value = user.username;
            document.getElementById('firstname').value = user.firstname;
            document.getElementById('lastname').value = user.lastname;
            document.getElementById('email').value = user.email;
            document.getElementById('phone').value = user.phone_number;

        } else {
            Swal.fire('ข้อผิดพลาด', result.message, 'error');
        }

    } catch (error) {
        console.error('Fetch error:', error);
    }
});

userForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const firstname = document.getElementById('firstname').value;
    const lastname = document.getElementById('lastname').value;
    const email = document.getElementById('email').value;
    const phone_number = document.getElementById('phone').value;
    //const role = document.getElementById('role').value;
    const roleElement = document.querySelector('input[name="role"]:checked');

    if (!username || !password || !firstname || !lastname || !email || !phone_number || !roleElement) {
        Swal.fire({
            title: 'แจ้งเตือน',
            text: 'กรุณากรอกข้อมูลและเลือกสิทธิ์ผู้ใช้งานให้ครบถ้วน',
            icon: 'warning',
            confirmButtonText: 'ตกลง',
            confirmButtonColor: '#E67E22'
        });
        return;
    }

    const role = roleElement.value

    Swal.fire({
        title: "คุณเเน่ใจที่จะเเก้ไขข้อมูลผู้ใช้?",
        text: "ข้อมูลผู้ใช้จะถูกเเก้ไขเเละบันทึกในระบบ",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#09a00e",
        cancelButtonColor: "#d33",
        confirmButtonText: "ยืนยัน",
        cancelButtonText: "ยกเลิก"
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch('/api/v1/updateUser/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json' // บอก Server ว่าส่งข้อมูลเป็น JSON นะ
                    },
                    body: JSON.stringify({ username: username, password: password, firstname: firstname, lastname: lastname, email: email, phone_number: phone_number, role: role }) // แปลงข้อมูลเป็น JSON String
                });

                const result = await response.json();
                if (response.ok && result.status === 'success') {
                    Swal.fire({
                        title: "สำเร็จ!",
                        text: result.message,
                        icon: "success",
                        confirmButtonText: "ตกลง"
                    }).then(() => {
                        window.location.href = '/users';
                    });
                } else {
                    Swal.fire("เกิดข้อผิดพลาด!", result.message, "error");
                }

        } catch (error) {
            console.error('Error:', error);
        }
    }
    })
});
