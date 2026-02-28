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
    const newTag = categoryInput.value.trim();
    if (newTag !== "") {
        tagsArray.push(newTag); // ใส่เข้า Array
        categoryInput.value = ''; // เคลียร์ช่องพิมพ์
        renderTags(); // วาดใหม่
    }
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
            // เด้งกลับไปหน้า Inventory (เปลี่ยน URL ตรงนี้ให้ตรงกับ Route ของเพื่อนนะ)
            window.location.href = '/inventory'; 
        }
    });
}

// กดบันทึก
if (btnSave) {
    btnSave.addEventListener('click', () => {
        // อนาคตเพื่อนจะเอา Ajax/Fetch มาต่อตรงนี้เพื่อส่งเข้า Database
        alert('เพิ่มสินค้าสำเร็จ!');
    });
}

// ตอนเปิดหน้ามาครั้งแรก ให้วาดหมวดหมู่รอไว้เลย
renderTags();