document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('warehouse-container');

    try {
        const response = await fetch('/api/v1/warehouses');
        const result = await response.json(); // จะได้ Object { status, message, data }

        // 1. เช็ค status จาก JSON ที่เราออกแบบไว้
        if (result.status === 'success') {
            const warehouses = result.data; // ข้อมูลจริงจะอยู่ที่ .data

            if (warehouses.length > 0) {
                container.innerHTML = ''; 

                warehouses.forEach(item => {
                    const card = document.createElement('div');
                    card.className = 'card';
                    card.innerHTML = `
                        <img src="/images/select-warehouse-pic.svg">
                        <h1>${item.warehouse_name}</h1>
                        <button onclick="selectWarehouse('${item.warehouse_id}')">เลือก</button>
                    `;
                    container.appendChild(card);
                });
            } else {
                container.innerHTML = '<p>ไม่มีข้อมูลคลังสินค้าในระบบ</p>';
            }
        } else {
            // 2. ถ้า status เป็น error (ตามที่เขียนใน server.js)
            console.log('เกิดข้อผิดพลาด: ' + result.message);
        }

    } catch (error) {
        console.error('Fetch error:', error);
    }
});