// โหลดข้อมูล category ทั้งหมดมาแสดงใน Dropdown
async function loadCategories() {
    try {
        const response = await fetch('/api/v1/categories');
        const result = await response.json();
        
        if (result.status === 'success') {
            const categorySelect = document.getElementById('categoryInput');
            // ใส่ข้อมูลลงใน Dropdown
            result.data.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.category_id;
                option.textContent = cat.category_name;
                categorySelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error("โหลด category ไม่ได้:", error);
    }
}

loadCategories();

document.addEventListener('DOMContentLoaded', async () => {
    const productId = window.location.pathname.split('/').pop();

    const nameInput = document.getElementById('inputName');
    const categorySelect = document.getElementById('categoryInput');
    const costInput = document.getElementById('inputCost');
    const priceInput = document.getElementById('inputPrice');
    const totalStockInput = document.getElementById('inputTotalStock');
    
    const imageInput = document.getElementById('imageInput');
    const uploadBox = document.getElementById('uploadBox');
    const btnUpload = document.getElementById('btnUpload');
    const btnSave = document.getElementById('btnSave');
    const btnCancel = document.getElementById('btnCancel');

    //ดึงข้อมูลหมวดหมู่มาแสดงใน Dropdown
    try {
        const response = await fetch(`/api/v1/product-details/${productId}`);
        const result = await response.json();

        if (result.status === 'success') {
            const product = result.data.productInfo;
            nameInput.value = product.name;
            categorySelect.value = product.category_id; // เลือกหมวดหมู่ให้ตรง
            costInput.value = product.cost_price;
            priceInput.value = product.selling_price;
            totalStockInput.value = product.total_stock || 0;

            if (product.image_url) {
                uploadBox.innerHTML = `<img src="${product.image_url}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
            }
        }
    } catch (error) {
        console.error('Fetch error:', error);
        alert('ไม่สามารถดึงข้อมูลสินค้าได้');
    }

    // 🌟 3. จัดการการเปลี่ยนรูปภาพ
    uploadBox.addEventListener('click', () => imageInput.click());
    btnUpload.addEventListener('click', () => imageInput.click());

    imageInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                uploadBox.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
            }
            reader.readAsDataURL(file);
        }
    });

    //ปุ่มยกเลิก
    btnCancel.addEventListener('click', () => {
        if(confirm('ยกเลิกการแก้ไขและกลับไปหน้ารายละเอียดสินค้า?')) {
            window.location.href = `/product-details/${productId}`;
        }
    });

    //ปุ่มบันทึกข้อมูล
    btnSave.addEventListener('click', async () => {
        if (!nameInput.value.trim() || !categorySelect.value) {
            alert('กรุณากรอกชื่อสินค้าและเลือกหมวดหมู่ให้ครบถ้วน');
            return;
        }

        const formData = new FormData();
        formData.append('name', nameInput.value.trim());
        formData.append('category_id', categorySelect.value);
        formData.append('cost', costInput.value);
        formData.append('price', priceInput.value);
        formData.append('total_stock', totalStockInput.value);

        // ถ้ายูสเซอร์เลือกรูปใหม่ ค่อยแนบไป
        if (imageInput.files[0]) {
            formData.append('image', imageInput.files[0]);
        }

        try {
            btnSave.innerHTML = '⏳ กำลังบันทึก...';
            btnSave.disabled = true;

            // ส่ง PUT request ไปอัปเดตข้อมูล
            const response = await fetch(`/api/v1/products/${productId}`, {
                method: 'PUT',
                body: formData
            });

            const result = await response.json();
            if (result.status === 'success') {
                alert('อัปเดตข้อมูลสินค้าสำเร็จ!');
                window.location.href = `/product-details/${productId}`; // กลับไปหน้าโชว์รายละเอียด
            } else {
                alert(`เกิดข้อผิดพลาด: ${result.message}`);
            }
        } catch (error) {
            alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
        } finally {
            btnSave.innerHTML = '✎ บันทึกรายละเอียดสินค้า';
            btnSave.disabled = false;
        }
    });
});