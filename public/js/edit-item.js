document.addEventListener('DOMContentLoaded', async () => {
    const pathParts = window.location.pathname.split('/');
    const locationId = pathParts.pop();
    const productId = pathParts.pop();

    const goodInput = document.getElementById('inputGoodQty');
    const damagedInput = document.getElementById('inputDamagedQty');
    const locationInput = document.getElementById('inputLocation'); // ช่องที่พิมพ์แก้ได้
    
    let initialLocationName = ""; //ตัวแปรเก็บชื่อเดิมไว้เช็กการย้ายที่
    try {
        const response = await fetch(`/api/v1/stocks/${productId}/${locationId}`);
        const result = await response.json();

        if (result.status === 'success') {
            const data = result.data;
            
            // 🌟 คืนค่าส่วนที่หายไป: แสดงข้อมูลฝั่งซ้าย (Badge, รูป, หมวดหมู่)
            document.getElementById('displayCode').innerText = `รหัสสินค้า: ${data.product_code || '-'}`;
            document.getElementById('displayImage').src = data.image_url || '/images/default.png';
            document.getElementById('displayCategory').innerText = data.category_name || 'ทั่วไป';
            
            // 🌟 คืนค่าส่วนที่หายไป: แสดงข้อมูลฝั่งขวา (ชื่อ, รหัส, ราคา)
            document.getElementById('inputName').value = data.name || '';
            document.getElementById('inputItemCode').value = data.product_code || '';
            // เช็คราคาว่ามีมั้ย ถ้ามีให้ทำ toLocaleString() เพื่อความสวยงาม
            document.getElementById('inputPrice').value = data.selling_price ? data.selling_price.toLocaleString() : '0';

            // ส่วนที่จัดเก็บ (ที่แกพิมพ์แก้ได้)
            locationInput.value = data.location_name || '';
            initialLocationName = data.location_name || ''; // จำชื่อเดิมไว้เช็คตอนย้ายที่

            // ส่วนจำนวนสินค้า (ดี/เสีย)
            goodInput.value = data.good_qty || 0;
            damagedInput.value = data.damaged_qty || 0;
            goodInput.dataset.old = data.good_qty || 0;
            damagedInput.dataset.old = data.damaged_qty || 0;

            // ตั้งค่าลิมิตยอดรวม (ถ้าต้องการใช้ระบบ Balance ยอด)
            totalInventoryLimit = (parseInt(data.good_qty) || 0) + (parseInt(data.damaged_qty) || 0);
        }
    } catch (error) { 
        console.error("Fetch Data Error:", error); 
    }

    //เพิ่มฟังก์ชัน sendTrans ไว้ท้ายสุดของบล็อก DOMContentLoaded
    async function sendTrans(status, qty, type, locName) {
        return fetch('/api/v1/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                product_id: productId,
                product_status: status,
                quantity: qty,
                transaction_type: type,
                location_name: locName //ส่งเป็นชื่อไปให้ Server จัดการ
            })
        });
    }

    // ปุ่มยกเลิก
    document.getElementById('btnSave').addEventListener('click', async () => {
        const newLocationName = locationInput.value.trim();
        const newGood = parseInt(goodInput.value) || 0;
        const newDamaged = parseInt(damagedInput.value) || 0;
        const oldGood = parseInt(goodInput.dataset.old) || 0;
        const oldDamaged = parseInt(damagedInput.dataset.old) || 0;

        if (confirm('ยืนยันการบันทึกการเปลี่ยนแปลง?')) {
            try {
                //ถ้าย้ายที่เก็บ จะต้องบันทึกการเคลื่อนไหวทั้งที่เก่าและที่ใหม่
                if (newLocationName !== initialLocationName) {
                    // หักที่เก่าออกให้หมด
                    if (oldGood > 0) await sendTrans('สภาพสมบูรณ์', -oldGood, 'ย้ายออกจากที่เดิม', initialLocationName);
                    if (oldDamaged > 0) await sendTrans('ชำรุด/เสียหาย', -oldDamaged, 'ย้ายออกจากที่เดิม', initialLocationName);
                    // เพิ่มเข้าที่ใหม่ตามจำนวนที่กรอกมา
                    if (newGood > 0) await sendTrans('สภาพสมบูรณ์', newGood, 'ย้ายเข้าที่ใหม่', newLocationName);
                    if (newDamaged > 0) await sendTrans('ชำรุด/เสียหาย', newDamaged, 'ย้ายเข้าที่ใหม่', newLocationName);
                } 
                //ถ้าไม่ย้ายที่ ก็แค่บันทึกความเปลี่ยนแปลงของจำนวนในที่เดิม
                else {
                    const diffG = newGood - oldGood;
                    const diffD = newDamaged - oldDamaged;
                    if (diffG !== 0) await sendTrans('สภาพสมบูรณ์', diffG, 'ปรับปรุงสต็อก', newLocationName);
                    if (diffD !== 0) await sendTrans('ชำรุด/เสียหาย', diffD, 'ปรับปรุงสต็อก', newLocationName);
                }
                alert('บันทึกสำเร็จ!');
                window.location.href = `/product-details/${productId}`;
            } catch (e) { alert('เกิดข้อผิดพลาด'); }
        }
    });
});