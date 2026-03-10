const userForm = document.getElementById('createForm');

userForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const warehouse_name = document.getElementById('wh-name').value;
    const warehouse_add = document.getElementById('wh-add').value;

    Swal.fire({
        title: "คุณเเน่ใจที่จะเพิ่มคลังสินค้า?",
        text: "คลังสินค้าจะถูกเพิ่มลงในระบบ",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#09a00e",
        cancelButtonColor: "#d33",
        confirmButtonText: "ยืนยัน",
        cancelButtonText: "ยกเลิก"
    }).then(async (result) => {
        
        if (result.isConfirmed) {
            try {
                const response = await fetch('/api/v1/add-warehouse', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ warehouse_name: warehouse_name, warehouse_add: warehouse_add })
                });

                const resData = await response.json();
                
                if (response.ok && resData.status === 'success') {
                    Swal.fire({
                        title: "เพิ่มคลังสินค้าสำเร็จ!",
                        text: "คลังสินค้าถูกเพิ่มในระบบเรียบร้อย",
                        icon: "success",
                        confirmButtonText: "ตกลง"
                    }).then(() => {
                        window.location.href = '/warehouses';
                    });
                } else {
                    // กรณีเซิร์ฟเวอร์ Error หรือชื่อซ้ำ
                    Swal.fire("เกิดข้อผิดพลาด!", resData.message, "error");
                }

            } catch (error) {
                console.error('Error:', error);
            }
        }
    });
});