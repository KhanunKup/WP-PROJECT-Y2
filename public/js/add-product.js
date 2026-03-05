
let allProducts = [];
const productSelect = document.getElementById('productSelect');
const categorySelect = document.getElementById('categoryInput');
const nameInput = document.querySelector('input[placeholder="กรุณากรอกชื่อสินค้า..."]');
const costInput = document.getElementById('inputCost'); // อย่าลืมแก้ ID ใน EJS ให้ตรงนะแก!
const priceInput = document.getElementById('inputPrice');
const uploadBox = document.querySelector('.image-upload-box');
const uploadBtn = document.querySelector('.btn-upload');
const imageInput = document.getElementById('imageInput');

// โหลดข้อมูลสินค้าทั้งหมดมาแสดงใน Dropdown
async function loadProductsDropdown() {
    try {
        const response = await fetch('/api/v1/products');
        const result = await response.json();

        if (result.status === 'success') {
            allProducts = result.data;
            productSelect.innerHTML = '<option value="new">สร้างสินค้าชนิดใหม่...</option>'; // ล้างค่าเก่า
            
            allProducts.forEach(product => {
                const option = document.createElement('option');
                option.value = product.product_id;
                option.textContent = `รหัส ${product.product_id} : ${product.name}`;
                productSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error("โหลดรายการสินค้าไม่สำเร็จ", error);
    }
}

loadProductsDropdown();

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

productSelect.addEventListener('change', function(e) {
    const selectedValue = e.target.value;

    if (selectedValue === 'new') {
        // Reset ฟอร์มสำหรับสร้างสินค้าใหม่
        nameInput.value = ''; nameInput.readOnly = false;
        if(costInput) { costInput.value = ''; costInput.readOnly = false; }
        if(priceInput) { priceInput.value = ''; priceInput.readOnly = false; }
        categorySelect.value = ''; categorySelect.disabled = false;
        
        uploadBtn.style.display = 'block';
        uploadBox.innerHTML = `
            <div class="upload-icon">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
            </div>
            <h2>เลือกรูปภาพ</h2>`;
    } else {
        // auto-fill ข้อมูล เมื่อเลือกสินค้าที่มีอยู่แล้ว
        const p = allProducts.find(item => item.product_id == selectedValue);
        if (!p) return;

        nameInput.value = p.name; nameInput.readOnly = true;
        if(costInput) { costInput.value = p.cost_price; costInput.readOnly = true; }
        if(priceInput) { priceInput.value = p.selling_price; priceInput.readOnly = true; }
        
        categorySelect.value = p.category_id;
        categorySelect.disabled = true;

        if (p.image_url) {
            uploadBox.innerHTML = `<img src="${p.image_url}" style="width:100%; height:100%; object-fit:cover; border-radius: 8px;">`;
        }
        uploadBtn.style.display = 'none';
    }
});

//การอัปโหลดรูปภาพ
uploadBox.addEventListener('click', () => {
    if(productSelect.value === 'new') imageInput.click();
});
if(uploadBtn) uploadBtn.addEventListener('click', () => imageInput.click());

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

const btnCancel = document.querySelector('.btn-cancel');
if (btnCancel) {
    btnCancel.addEventListener('click', () => {
        if (confirm('คุณต้องการยกเลิกการเพิ่ม/แก้ไขสินค้านี้หรือไม่?')) {
            window.location.href = '/product-list'; // กลับไปหน้ารายการสินค้า
        }
    });
}

//ปุ่มบันทึกสินค้า
const btnSave = document.querySelector('.btn-save');
if (btnSave) {
    btnSave.addEventListener('click', async () => {
        const selectedMode = productSelect.value;
        const name = nameInput.value.trim();
        const categoryId = categorySelect.value;
        const cost = costInput ? parseFloat(costInput.value) : 0;
        const price = priceInput ? parseFloat(priceInput.value) : 0;
        const location = document.querySelector('textarea.input-area').value.trim();

        // Validation
        if (!name) { alert('กรุณากรอกชื่อสินค้า'); return; }
        if (!categoryId) { alert('กรุณาเลือกหมวดหมู่สินค้า'); return; }
        if (!location) { alert('กรุณากรอกที่จัดเก็บสินค้า'); return; }

        const formData = new FormData();
        if (selectedMode === 'new') {
            formData.append('image', imageInput.files[0]);
        }
        formData.append('mode', selectedMode);
        formData.append('name', name);
        formData.append('category_id', categoryId); // ส่งแค่ category_id ไปให้ Server
        formData.append('cost', cost);
        formData.append('price', price);
        formData.append('condition', document.querySelector('.btn-condition.active').innerText);
        formData.append('location', location);

        try {
            btnSave.innerHTML = '⏳ กำลังบันทึก...';
            btnSave.disabled = true;

            const response = await fetch('/api/v1/products', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            if (result.status === 'success') {
                alert('บันทึกข้อมูลสำเร็จ!');
                window.location.reload(); // รีเฟรชหน้าเพื่อล้างข้อมูล
            } else {
                alert(`เกิดข้อผิดพลาด: ${result.message}`);
            }
        } catch (error) {
            alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
        } finally {
            btnSave.innerHTML = 'บันทึกสินค้า';
            btnSave.disabled = false;
        }
    });
}

//เลือกสภาพสินค้า
document.querySelectorAll('.btn-condition').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.btn-condition').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
    });
});