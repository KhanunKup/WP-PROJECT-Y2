const userForm = document.getElementById('createForm');

userForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    const warehouse_name = document.getElementById('wh-name').value;
    const warehouse_add = document.getElementById('wh-add').value;
    try {
        const response = await fetch('/api/v1/add-warehouse',{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ warehouse_name: warehouse_name, warehouse_add: warehouse_add}) // แปลงข้อมูลเป็น JSON String
        });

        const result = await response.json();
        if(response.ok && result.status === 'success'){
            alert(result.message);
            window.location.href = '/warehouses';
        }else{
            alert(result.message);
        }

    } catch (error) {
        console.error('Error:', error);
    }
})