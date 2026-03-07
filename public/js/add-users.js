const userForm = document.getElementById('add-users-form');

userForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const firstname = document.getElementById('firstname').value;
    const lastname = document.getElementById('lastname').value;
    const email = document.getElementById('email').value;
    const phone_number = document.getElementById('phone_number').value;
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
    const role = roleElement.value;

    Swal.fire({
        title: 'ยืนยันการบันทึก',
        text: `คุณต้องการที่จะบันทึกข้อมูลผู้ใช้งานหรือไม่?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#09a00e',
        cancelButtonColor: '#d33',
        confirmButtonText: 'บันทึก',
        cancelButtonText: 'ยกเลิก'
    }).then(async (Result) => {
        if (Result.isConfirmed) {
            try {
                const response = await fetch('/api/v1/users', {
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
                    Swal.fire({
                        icon: "error",
                        title: "เกิดช้อผิดพลาด!",
                        text: result.message,
                    })
                }

            } catch (error) {
                console.error('Error:', error);
            }
        }
    })
})