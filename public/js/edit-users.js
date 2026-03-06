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

userForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    // const username = document.getElementById('username').value;
    // const password = document.getElementById('password').value;
    // const firstname = document.getElementById('firstname').value;
    // const lastname = document.getElementById('lastname').value;
    // const email = document.getElementById('email').value;
    // const phone_number = document.getElementById('phone_number').value;
    // //const role = document.getElementById('role').value;
    // const role = document.querySelector('input[name="role"]:checked').value;
    // try {
    //     const response = await fetch('/api/v1/editUser/',{
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json' // บอก Server ว่าส่งข้อมูลเป็น JSON นะ
    //         },
    //         body: JSON.stringify({ username: username, password: password, firstname: firstname, lastname: lastname, email: email, phone_number: phone_number, role: role}) // แปลงข้อมูลเป็น JSON String
    //     });

    //     const result = await response.json();
    //     if(response.ok && result.status === 'success'){
    //         alert(result.message);
    //         window.location.href = '/users';
    //     }else{
    //         alert(result.message);
    //     }

    // } catch (error) {
    //     console.error('Error:', error);
    // }

})