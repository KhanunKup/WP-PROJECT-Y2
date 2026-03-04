const userForm = document.getElementById('add-users-form');

userForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const firstname = document.getElementById('firstname').value;
    const lastname = document.getElementById('lastname').value;
    const email = document.getElementById('email').value;
    const phone_number = document.getElementById('phone_number').value;
    const role = document.getElementById('role').value;
    try {
        const response = await fetch('/api/v1/users',{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' // บอก Server ว่าส่งข้อมูลเป็น JSON นะ
            },
            body: JSON.stringify({ username: username, password: password, firstname: firstname, lastname: lastname, email: email, phone_number: phone_number, role: role}) // แปลงข้อมูลเป็น JSON String
        });

        const result = await response.json();
        if(response.ok && result.status === 'success'){
            alert(result.message);
            window.location.href = '/users';
        }else{
            alert(result.message);
        }

    } catch (error) {
        console.error('Error:', error);
    }
})