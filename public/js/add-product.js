
let allProducts = [];
const productSelect = document.getElementById('productSelect');
const categorySelect = document.getElementById('categoryInput');
const nameInput = document.querySelector('input[placeholder="กรุณากรอกชื่อสินค้า..."]');
const costInput = document.getElementById('inputCost'); // อย่าลืมแก้ ID ใน EJS ให้ตรงนะแก!
const priceInput = document.getElementById('inputPrice');
const uploadBox = document.querySelector('.image-upload-box');
const uploadBtn = document.querySelector('.btn-upload');
const imageInput = document.getElementById('imageInput');

const preventNegativeInput = (e) => {
    if (e.key === '-' || e.key === 'e') {
        e.preventDefault();
    }
};

// ดักจับการกดคีย์บอร์ด
if (costInput) costInput.addEventListener('keydown', preventNegativeInput);
if (priceInput) priceInput.addEventListener('keydown', preventNegativeInput);

// ดักจับการก็อปปี้เลขติดลบมาวาง
if (costInput) {
    costInput.addEventListener('input', function() {
        if (this.value < 0) this.value = 0;
    });
}
if (priceInput) {
    priceInput.addEventListener('input', function() {
        if (this.value < 0) this.value = 0;
    });
}

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

productSelect.addEventListener('change', function (e) {
    const selectedValue = e.target.value;

    if (selectedValue === 'new') {
        // Reset ฟอร์มสำหรับสร้างสินค้าใหม่
        nameInput.value = ''; nameInput.readOnly = false;
        if (costInput) { costInput.value = ''; costInput.readOnly = false; }
        if (priceInput) { priceInput.value = ''; priceInput.readOnly = false; }
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
        if (costInput) { costInput.value = p.cost_price; costInput.readOnly = true; }
        if (priceInput) { priceInput.value = p.selling_price; priceInput.readOnly = true; }

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
    if (productSelect.value === 'new') imageInput.click();
});
if (uploadBtn) uploadBtn.addEventListener('click', () => imageInput.click());

imageInput.addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            uploadBox.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
        }
        reader.readAsDataURL(file);
    }
});

const btnCancel = document.querySelector('.btn-cancel');
if (btnCancel) {
    btnCancel.addEventListener('click', () => {
        Swal.fire({
            title: 'ยืนยันการยกเลิก',
            text: `คุณต้องการยกเลิกการเพิ่มสินค้านี้หรือไม่?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#09a00e',
            cancelButtonColor: '#d33',
            confirmButtonText: 'ยืนยันการยกเลิก',
            cancelButtonText: 'เพิ่มสินค้าต่อ'
        }).then(async (Result) => {
            if (Result.isConfirmed) {
                window.location.href = '/product-list'; // กลับไปหน้ารายการสินค้า
            }
        })
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
        
        // ดึงค่าที่เป็น Text ยาวๆ ของ Location จาก input
        const location = document.getElementById('inputLocation').value.trim();

        // Validation ตรวจสอบข้อมูล
        if (!name) {
            Swal.fire({
                title: 'แจ้งเตือน',
                text: 'กรุณากรอกชื่อสินค้า',
                icon: 'warning',
                confirmButtonText: 'ตกลง',
                confirmButtonColor: '#E67E22'
            });
            return;
        }
        else if (!categoryId) {
            Swal.fire({
                title: 'แจ้งเตือน',
                text: 'กรุณาเลือกหมวดหมู่สินค้า',
                icon: 'warning',
                confirmButtonText: 'ตกลง',
                confirmButtonColor: '#E67E22'
            });
            return;
        }
        else if (!location) {
            Swal.fire({
                title: 'แจ้งเตือน',
                text: 'กรุณาระบุที่อยู่จัดเก็บ (โซน, แถว, ชั้นวาง, ชั้น) ให้ครบถ้วน',
                icon: 'warning',
                confirmButtonText: 'ตกลง',
                confirmButtonColor: '#E67E22'
            });
            return;
        }

        const formData = new FormData();
        if (selectedMode === 'new' && imageInput.files[0]) {
            formData.append('image', imageInput.files[0]);
        }
        formData.append('mode', selectedMode);
        formData.append('name', name);
        formData.append('category_id', categoryId); 
        formData.append('cost', cost);
        formData.append('price', price);
        formData.append('condition', document.querySelector('.btn-condition.active').value);
        
        // ส่งค่าที่เป็น Text ยาวๆ ของ Location ไปด้วยใน FormData เพื่อส่งไปที่ Server ผ่าน API
        formData.append('location', location);

        Swal.fire({
            title: 'ยืนยันการบันทึก',
            text: `คุณต้องการที่จะบันทึกรายละเอียดเพื่อเพิ่มสินค้าใช่หรือไม่?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#09a00e',
            cancelButtonColor: '#d33',
            confirmButtonText: 'บันทึกสินค้า',
            cancelButtonText: 'ยกเลิก'
        }).then(async (Result) => {
            if (Result.isConfirmed) {
                try {
                    btnSave.innerHTML = '⏳ กำลังบันทึก...';
                    btnSave.disabled = true;

                    const response = await fetch('/api/v1/products', {
                        method: 'POST',
                        body: formData
                    });

                    const result = await response.json();
                    if (result.status === 'success') {
                        Swal.fire({
                            title: "สำเร็จ!",
                            text: result.message,
                            icon: "success",
                            confirmButtonText: "ตกลง"
                        }).then(() => {
                            window.location.reload(); 
                        });
                    } else {
                        Swal.fire('เกิดข้อผิดพลาด', result.message, 'error');
                    }
                } catch (error) {
                    Swal.fire('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'error');
                } finally {
                    btnSave.innerHTML = '✎ บันทึกสินค้า';
                    btnSave.disabled = false;
                }
            }
        });
    });
}

//เลือกสภาพสินค้า
document.querySelectorAll('.btn-condition').forEach(btn => {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.btn-condition').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
    });
});