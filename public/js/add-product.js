//เขียนให้มันอัปโหลดรูปยังไงวะ

//-----------------------------------------------------------------------------------------------

// ประกาศตัวแปรเก็บสินค้าทั้งหมดไว้ จะได้เรียกใช้ทีหลังได้ง่ายๆ
let allProducts = [];

async function loadProductsDropdown() {
    try {
        // วิ่งไปเรียก API ดึงรายการสินค้าของคุณ
        const response = await fetch('/api/v1/products');
        const result = await response.json();

        if (result.status === 'success') {
            allProducts = result.data; // เก็บข้อมูลทั้งหมดลงตัวแปร
            const select = document.getElementById('productSelect');

            // วนลูปเอาชื่อสินค้ามาสร้างเป็นตัวเลือก <option>
            allProducts.forEach(product => {
                const option = document.createElement('option');
                option.value = product.product_id;
                option.textContent = `รหัส ${product.product_id} : ${product.name}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error("โหลดรายการสินค้าไม่สำเร็จ", error);
    }
}

// สั่งให้ฟังก์ชันทำงานทันทีที่โหลดหน้าเว็บเสร็จ
loadProductsDropdown();

// ดักฟังว่ามีการกดเปลี่ยน Dropdown หรือเปล่า
document.getElementById('productSelect').addEventListener('change', function(e) {
    const selectedValue = e.target.value;
    
    // ดึง Element ของส่วนหมวดหมู่มาเตรียมไว้
    const categoryInput = document.getElementById('categoryInput');
    const btnAddCategory = document.getElementById('btnAddCategory');
    const nameInput = document.querySelector('input[placeholder="กรุณากรอกชื่อสินค้า..."]');

    if (selectedValue === 'new') {
        // --- โค้ดเดิมของแกที่มีอยู่แล้ว ---
        nameInput.readOnly = false;
        nameInput.value = ''; // แนะนำให้เติมบรรทัดนี้เพื่อล้างชื่อเก่าออกด้วย
        if (categoryInput) categoryInput.disabled = false;
        if (btnAddCategory) btnAddCategory.disabled = false;
        
        tagsArray = [];
        renderTags();

        // 🌟 ส่วนที่ต้องเพิ่ม: เสกปุ่มและไอคอนกลับมา 🌟
        uploadBtn.style.display = 'block'; // สั่งให้ปุ่มกลับมาโชว์
        
        // คืนค่าไอคอน SVG และข้อความในกล่องสีส้ม (ก๊อปจากหน้า HTML ของแกมาเลย)
        uploadBox.innerHTML = `
            <div class="upload-icon">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
            </div>
            <h2>เลือกรูปภาพ</h2>
        `;
    } else {
        // --- กรณีสินค้าเก่า: ล็อกให้หมด ---
        const selectedProduct = allProducts.find(p => p.product_id == selectedValue);
        
        nameInput.value = selectedProduct.name;
        nameInput.readOnly = true;
        
        // 🌟 เพิ่ม 2 บรรทัดนี้: ล็อกส่วนการเพิ่มหมวดหมู่
        if (categoryInput) categoryInput.disabled = true;  // 🔒 ห้ามเลือก
        if (btnAddCategory) btnAddCategory.disabled = true; // 🔒 ห้ามกดเพิ่ม

        inputCost.value = selectedProduct.cost_price;
        inputCost.readOnly = true;

        inputPrice.value = selectedProduct.selling_price;
        inputPrice.readOnly = true;

        // ดึงหมวดหมู่เดิมมาโชว์
        if (selectedProduct.category) {
            tagsArray = selectedProduct.category.split(', ');
            renderTags();
        }

        if (selectedProduct.image_url) {
            uploadBox.innerHTML = `<img src="${selectedProduct.image_url}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
        }
        uploadBtn.style.display = 'none';
    }
});

const imageInput = document.getElementById('imageInput'); // input file ที่ซ่อนอยู่
const uploadBox = document.querySelector('.image-upload-box'); // กล่องสีส้ม
const uploadBtn = document.querySelector('.btn-upload'); // ปุ่มอัปโหลด

// พอกดกล่องสีส้ม หรือ ปุ่มอัปโหลด ให้ไปคลิก input file
uploadBox.addEventListener('click', () => {
    // ให้กดได้เฉพาะตอนที่เลือก "สร้างสินค้าใหม่" เท่านั้น
    if(document.getElementById('productSelect').value === 'new') {
        imageInput.click();
    }
});
uploadBtn.addEventListener('click', () => imageInput.click());

// พอเลือกรูปเสร็จ ให้เอารูปมาโชว์ทับกล่อง
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


let tagsArray = []; // ข้อมูลเริ่มต้น
const tagsContainer = document.getElementById('tagsContainer');
const categoryInput = document.getElementById('categoryInput');
const btnAddCategory = document.getElementById('btnAddCategory');

function renderTags() {
    if (!tagsContainer) return;
    tagsContainer.innerHTML = '';
    
    // เช็กว่าตอนนี้เลือกสินค้าเก่าอยู่หรือไม่
    const isLocked = document.getElementById('productSelect').value !== 'new';

    tagsArray.forEach((tag, index) => {
        tagsContainer.innerHTML += `
            <span class="tag tag-blue">
                ${tag} 
                ${isLocked ? '' : `<button type="button" class="btn-close" onclick="removeTag(${index})">×</button>`}
            </span>
        `;
    });
}

// ฟังก์ชันลบ Tag (เมื่อกดกากบาท) - ต้องประกาศให้เป็น Global เพื่อให้ปุ่ม HTML เรียกใช้ได้
window.removeTag = function(index) {
    tagsArray.splice(index, 1); // เอาออกจาก Array
    renderTags(); // วาดใหม่
}

// ฟังก์ชันเพิ่ม Tag (เมื่อกดปุ่มเพิ่ม หรือกด Enter)
function addTag() {
    if (!categoryInput) return;
    
    const newTag = categoryInput.value;

    // 1. เช็กว่าเลือกตัวเลือกหรือยัง (ต้องไม่ใช่ค่าว่าง)
    if (newTag !== "") {
        // 2. เช็กว่าหมวดหมู่นี้ถูกเลือกไปแล้วหรือยัง (กันซ้ำ)
        if (!tagsArray.includes(newTag)) {
            tagsArray.push(newTag); // ใส่เข้า Array
            renderTags(); // วาด Tag ใหม่
        } else {
            alert('คุณเลือกหมวดหมู่นี้ไปแล้ว!');
        }
    } else {
        alert('กรุณาเลือกหมวดหมู่');
    }

    // 3. รีเซ็ต Dropdown กลับไปที่ตัวเลือกแรก ("-- เลือกหมวดหมู่ไอที --")
    categoryInput.value = "";
}

// ผูก Event ให้ปุ่ม "เพิ่ม"
if (btnAddCategory) {
    btnAddCategory.addEventListener('click', addTag);
}

// ผูก Event ให้กด Enter ในช่องพิมพ์ได้
if (categoryInput) {
    categoryInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault(); // กันฟอร์มเด้ง (ถ้าอยู่ใน <form>)
            addTag();
        }
    });
}

// สภาพสินค้า เลือกอันไหนอันนั้นขึ้นสี อันไม่เลือกเป็นสีเทา
const conditionBtns = document.querySelectorAll('.btn-condition');

conditionBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        // ลบสีออกจากทุกปุ่มก่อน (ให้เป็นสีเทา)
        conditionBtns.forEach(b => b.classList.remove('active'));
        // เติมสีให้ปุ่มที่เพิ่งโดนกด (CSS จะแยกสีน้ำเงิน/ส้ม จากคลาส btn-perfect, btn-damaged ที่เราใส่ไว้)
        this.classList.add('active');
    });
});

//ปุ่มบันทึกและยกเลิก
const btnCancel = document.querySelector('.btn-cancel');
const btnSave = document.querySelector('.btn-save');

// กดยกเลิก
if (btnCancel) {
    btnCancel.addEventListener('click', () => {
        if(confirm('คุณต้องการยกเลิกการเปลี่ยนแปลง และกลับไปหน้ารายการสินค้าใช่หรือไม่?')) {
            window.location.href = '/product-list'; // กลับไปหน้ารายการสินค้า
        }
    });
}

// กดบันทึก
if (btnSave) {
    btnSave.addEventListener('click', async () => {
        // 1. เช็กโหมดจาก Dropdown (เป็น 'new' หรือเป็น ID เช่น '1')
        const selectedMode = document.getElementById('productSelect').value;

        const nameInput = document.querySelector('.input-area[placeholder="กรุณากรอกชื่อสินค้า..."]');
        const costInput = document.getElementById('inputCost');
        const priceInput = document.getElementById('inputPrice');
        const locationInput = document.querySelector('textarea.input-area');

        const name = nameInput ? nameInput.value.trim() : '';
        const cost = parseFloat(costInput.value);
        const price = parseFloat(priceInput.value);
        const location = locationInput ? locationInput.value.trim() : '';
        const categories = tagsArray.join(', '); 
        
        const activeConditionBtn = document.querySelector('.btn-condition.active');
        const condition = activeConditionBtn ? activeConditionBtn.innerText : 'สภาพสมบูรณ์';

        // --- Validation เช็กความถูกต้อง ---
        if (selectedMode === 'new' && (!imageInput || !imageInput.files[0])) {
            alert('กรุณาอัปโหลดรูปภาพสินค้าด้วยครับ');
            return;
        }
        if (!name) { alert('กรุณากรอกชื่อสินค้า'); nameInput.focus(); return; }
        if (tagsArray.length === 0) { alert('กรุณาเพิ่มหมวดหมู่'); return; }
        if (!location) { alert('กรุณากรอกที่จัดเก็บสินค้า'); locationInput.focus(); return; }

        // 🌟 2. ใช้ FormData แพ็กของเตรียมส่ง 🌟
        const formData = new FormData();
        
        // แนบไฟล์รูป (เฉพาะตอนสร้างใหม่)
        if (selectedMode === 'new') {
            formData.append('image', imageInput.files[0]);
        }
        
        // ส่งบอกหลังบ้านด้วยว่าเป็นการสร้างใหม่ หรือเพิ่มของเก่า
        formData.append('mode', selectedMode); 
        
        // แนบข้อมูลตัวหนังสืออื่นๆ
        formData.append('name', name);
        formData.append('category', categories);
        formData.append('cost', cost || 0);
        formData.append('price', price || 0);
        formData.append('condition', condition);
        formData.append('location', location);

        try {
            btnSave.innerHTML = '⏳ กำลังบันทึก...';
            btnSave.disabled = true;

            const response = await fetch('/api/v1/products', {
                method: 'POST',
                body: formData //
            });

            const result = await response.json();

            if (result.status === 'success') {
                alert('บันทึกข้อมูลสำเร็จ!');
                window.location.href = '/add-product'; // กลับไปหน้ารายการสินค้า
            } else {
                alert(`เกิดข้อผิดพลาด: ${result.message}`); // แสดงข้อความผิดพลาดจากเซิร์ฟเวอร์
            }
        } catch (error) {
            console.error('Error:', error);
            alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
        } finally {
            btnSave.innerHTML = 'บันทึก';
            btnSave.disabled = false;
        }
    });
}

// ตอนเปิดหน้ามาครั้งแรก ให้วาดหมวดหมู่รอไว้เลย
renderTags();