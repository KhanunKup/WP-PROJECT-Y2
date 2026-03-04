//เขียนให้มันอัปโหลดรูปยังไงวะ

//-----------------------------------------------------------------------------------------------

let tagsArray = []; // ข้อมูลเริ่มต้น
const tagsContainer = document.getElementById('tagsContainer');
const categoryInput = document.getElementById('categoryInput');
const btnAddCategory = document.getElementById('btnAddCategory');

function renderTags() {
    if (!tagsContainer) return;
    tagsContainer.innerHTML = '';
    tagsArray.forEach((tag, index) => {
        tagsContainer.innerHTML += `
            <span class="tag tag-blue">
                ${tag} 
                <button type="button" class="btn-close" onclick="removeTag(${index})">×</button>
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
            alert('คุณเลือกหมวดหมู่นี้ไปแล้วครับ!');
        }
    } else {
        alert('กรุณาเลือกหมวดหมู่จากเมนูก่อนกดเพิ่มครับ');
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

        //Validation
        if (!name) {
            alert('กรุณากรอกชื่อสินค้า');
            nameInput.focus();
            return;
        }
        if (tagsArray.length === 0) {
            alert('กรุณาเพิ่มหมวดหมู่อย่างน้อย 1 หมวดหมู่');
            document.getElementById('categoryInput').focus();
            return;
        }
        if (isNaN(cost) || cost < 0) {
            alert('กรุณากรอกต้นทุนให้ถูกต้อง');
            costInput.focus();
            return;
        }
        if (isNaN(price) || price < 0) {
            alert('กรุณากรอกราคาขายให้ถูกต้อง');
            priceInput.focus();
            return;
        }
        if (!location) {
            alert('กรุณากรอกที่จัดเก็บสินค้า');
            locationInput.focus();
            return;
        }

        const productData = { name, category: categories, cost, price, condition, location };

        try {
            const response = await fetch('/api/v1/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });

            const result = await response.json();

            if (response.ok) {
                alert(result.message);
                window.location.href = '/add-product'; // รีเฟรชหน้าใหม่
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
        }
    });
}

// ตอนเปิดหน้ามาครั้งแรก ให้วาดหมวดหมู่รอไว้เลย
renderTags();