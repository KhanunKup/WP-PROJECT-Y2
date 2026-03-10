document.addEventListener('DOMContentLoaded', async () => {
    const pathParts = window.location.pathname.split('/');
    const locationId = pathParts.pop();
    const productId = pathParts.pop();

    const goodInput = document.getElementById('inputGoodQty');
    const damagedInput = document.getElementById('inputDamagedQty');
    const locationInput = document.getElementById('inputLocation'); // ช่องที่พิมพ์แก้ได้ (ตอนนี้เป็น Hidden)

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

            // 🌟 ส่วนที่จัดเก็บ: นำค่าเดิมมาใส่ช่องซ่อน และนำไปแตกใส่ช่องต่างๆ
            const locName = data.location_name || '';
            locationInput.value = locName;
            initialLocationName = locName; // จำชื่อเดิมไว้เช็คตอนย้ายที่

            // 🌟 ระบบแตกไฟล์: แยกข้อความ 'A-01-02-03' ไปใส่ใน 4 ช่อง
            if (locName) {
                const parts = locName.split('-');
                if (parts.length === 4) {
                    const selectZone = document.getElementById('zoneSelect');
                    const customZone = document.getElementById('customZoneInput');
                    
                    // เช็กว่าเป็นโซน A, B หรือโซนที่พิมพ์เอง
                    if (parts[0] === 'A' || parts[0] === 'B') {
                        selectZone.value = parts[0];
                    } else {
                        selectZone.value = 'custom';
                        customZone.style.display = 'block';
                        customZone.value = parts[0];
                    }
                    
                    document.getElementById('inputAisle').value = parts[1];
                    document.getElementById('inputShelf').value = parts[2];
                    document.getElementById('inputLevel').value = parts[3];
                    
                    // อัปเดตพรีวิวข้อความด้านล่างสุด
                    if (typeof updatePreview === 'function') {
                        updatePreview();
                    } else {
                        document.getElementById('locationPreview').innerText = locName;
                    }
                }
            }

            // ส่วนจำนวนสินค้า (ดี/เสีย)
            goodInput.value = data.good_qty || 0;
            damagedInput.value = data.damaged_qty || 0;
            goodInput.dataset.old = data.good_qty || 0;
            damagedInput.dataset.old = data.damaged_qty || 0;

            // ตั้งค่าลิมิตยอดรวม (ถ้าต้องการใช้ระบบ Balance ยอด)
            let totalInventoryLimit = (parseInt(data.good_qty) || 0) + (parseInt(data.damaged_qty) || 0);
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

    goodInput.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '');
    });
    damagedInput.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '');
    });

    // ปุ่มยกเลิก
    document.getElementById('btnCancel').addEventListener('click', () => {
        Swal.fire({
            title: 'ยืนยันการยกเลิก',
            text: `คุณเเน่ใจที่จะยกเลิกการแก้ไข? ข้อมูลจะไม่ถูกบันทึก`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#09a00e',
            cancelButtonColor: '#d33',
            confirmButtonText: 'ยืนยันการยกเลิก',
            cancelButtonText: 'เเก้ไขสินค้าต่อ'
        }).then(async (Result) => {
            if (Result.isConfirmed) {
                window.location.href = `/product-details/${productId}`;
            }
        })
    });

    // ปุ่มลบ
    document.getElementById('btnDelete').addEventListener('click', async () => {
        Swal.fire({
            title: 'ยืนยันการลบ',
            text: `คุณเเน่ใจที่จะยืนยันการลบสินค้ารายการนี้?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#09a00e',
            cancelButtonColor: '#d33',
            confirmButtonText: 'ยืนยันการลบสินค้า',
            cancelButtonText: 'ยกเลิก'
        }).then(async (Result) => {
            if (Result.isConfirmed) {
                try {
                    const oldG = parseInt(goodInput.dataset.old) || 0;
                    const oldD = parseInt(damagedInput.dataset.old) || 0;

                    //
                    if (oldG > 0) await sendTrans('ปกติ', Math.abs(oldG), 'เบิกจ่ายสินค้า', initialLocationName);
                    if (oldD > 0) await sendTrans('เสียหาย', Math.abs(oldD), 'เบิกจ่ายสินค้า', initialLocationName);
                
                    Swal.fire({
                        title: "สำเร็จ!",
                        text: "ลบรายการสำเร็จ!",
                        icon: "success",
                        confirmButtonText: "ตกลง"
                    }).then(async (ResultSuccess) => {
                        if (ResultSuccess.isConfirmed) {
                            window.location.href = `/product-details/${productId}`;
                        }
                    });

                } catch (e) { alert('เกิดข้อผิดพลาด'); }
            }
        })
    });

    // ปุ่มบันทึก
    document.getElementById('btnSave').addEventListener('click', async () => {
        const newLocationName = locationInput.value.trim();
        const newGood = parseInt(goodInput.value) || 0;
        const newDamaged = parseInt(damagedInput.value) || 0;
        const oldGood = parseInt(goodInput.dataset.old) || 0;
        const oldDamaged = parseInt(damagedInput.dataset.old) || 0;

        // ถ้ากรอกค่า 4 ช่องไม่ครบจะถือว่าค่าว่าง
        if (!newLocationName) {
            Swal.fire({
                title: 'แจ้งเตือน',
                text: 'กรุณาระบุที่อยู่จัดเก็บ (โซน, แถว, ชั้นวาง, ชั้น) ให้ครบถ้วน',
                icon: 'warning',
                confirmButtonText: 'ตกลง',
                confirmButtonColor: '#E67E22'
            });
            return;
        }

        Swal.fire({
            title: 'ยืนยันการบันทึก',
            text: `คุณเเน่ใจที่จะบันทึกการเปลี่ยนแปลง?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#09a00e',
            cancelButtonColor: '#d33',
            confirmButtonText: 'บันทึกสินค้า',
            cancelButtonText: 'ยกเลิก'
        }).then(async (Result) => {
            if (Result.isConfirmed) {
                try {
                    //ถ้าย้ายที่เก็บ จะต้องบันทึกการเคลื่อนไหวทั้งที่เก่าและที่ใหม่
                    if (newLocationName !== initialLocationName) {
                        // หักที่เก่าออกให้หมด
                        if (oldGood > 0) await sendTrans('ปกติ', Math.abs(oldGood), 'เคลื่อนย้ายสินค้าออก', initialLocationName);
                        if (oldDamaged > 0) await sendTrans('เสียหาย', Math.abs(oldDamaged), 'เคลื่อนย้ายสินค้าออก', initialLocationName);
                        // เพิ่มเข้าที่ใหม่ตามจำนวนที่กรอกมา
                        if (newGood > 0) await sendTrans('ปกติ', Math.abs(newGood), 'เคลื่อนย้ายสินค้าเข้า', newLocationName);
                        if (newDamaged > 0) await sendTrans('เสียหาย', Math.abs(newDamaged), 'เคลื่อนย้ายสินค้าเข้า', newLocationName);
                    } 
                    //ถ้าไม่ย้ายที่ ก็แค่บันทึกความเปลี่ยนแปลงของจำนวนในที่เดิม
                    else {
                        //ใหม่ดีมากกว่า - เก่าดี
                        const diffG = newGood - oldGood;
                        const diffD = newDamaged - oldDamaged;
                        if (diffG > 0) {
                            await sendTrans('ปกติ', Math.abs(diffG), 'นำเข้าสินค้า', newLocationName)
                        } else if (diffG < 0) {
                            await sendTrans('ปกติ', Math.abs(diffG), 'เบิกจ่ายสินค้า', newLocationName)
                        };
                        if (diffD > 0) {
                            await sendTrans('เสียหาย', Math.abs(diffD), 'นำเข้าสินค้า', newLocationName)
                        } else if (diffD < 0) {
                            await sendTrans('เสียหาย', Math.abs(diffD), 'เบิกจ่ายสินค้า', newLocationName)
                        };
                    }

                    Swal.fire({
                        title: "สำเร็จ!",
                        text: "บันทึกการเเก้ไขจำนวนสินค้าหรือที่อยู่สำเร็จ!",
                        icon: "success",
                        confirmButtonText: "ตกลง"
                    }).then(async (ResultSuccess) => {
                        if (ResultSuccess.isConfirmed) {
                            window.location.href = `/product-details/${productId}`;
                        }
                    });
                } catch (e) { alert('เกิดข้อผิดพลาด'); }
            }
        })
    });
});