document.addEventListener('DOMContentLoaded', async () => {
    const productId = window.location.pathname.split('/').pop();

    try {
        // ยิง API แค่เส้นเดียวจบ!
        const response = await fetch(`/api/v1/product-details/${productId}`);
        const result = await response.json();

        if (result.status === 'success') {
            // แกะกล่องข้อมูลที่ Backend มัดรวมมาให้
            const product = result.data.productInfo; // ข้อมูลหลัก (Object)
            const stockList = result.data.stockList; // ข้อมูลตาราง (Array)

            // 1. เอาข้อมูลหลักไปแสดงผลครึ่งบน
            document.getElementById('productName').innerText = product.name;
            document.getElementById('productImage').src = product.image_url || '/images/default.png';
            document.getElementById('inputCost').value = product.cost_price;
            document.getElementById('inputPrice').value = product.selling_price;
            document.getElementById('inputStock').value = product.total_stock;

            // 2. เอาข้อมูลรายการสต็อกไปวนลูป (forEach) สร้างตารางครึ่งล่าง
            const tableBody = document.getElementById('product-table');
            tableBody.innerHTML = ''; 

            stockList.forEach(item => {
                // เพิ่มเงื่อนไขเช็คสถานะ เพื่อสลับสีป้ายแคปซูล
                const statusName = item.product_status || 'สภาพสมบูรณ์';
                const isDamaged = statusName.includes('ชำรุด') || statusName.includes('เสีย');
                const badgeClass = isDamaged ? 'status-damaged' : 'status-perfect';

                // แก้ไข <tr> ให้แยกเป็น 5 <td> ตามหัวตาราง และใส่คลาส CSS
                const row = `
                    <tr>
                        <td>${item.product_code}</td>
                        <td>${item.area}</td>
                        <td><span class="status-pill ${badgeClass}">${statusName}</span></td>
                        <td><span class="qty-text">${item.quantity} ชิ้น</span></td>
                        <td><a href="/edit-item/${productId}/${item.location_id}" class="edit-link">📝 แก้ไขที่อยู่เเละจำนวนสินค้า</a></td>
                    </tr>
                `;
                tableBody.insertAdjacentHTML('beforeend', row);
            });
        } else {
            console.error(result.message);
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
});

const editBtn = document.querySelector('.btn-save');
if (editBtn) {
    editBtn.addEventListener('click', () => {
        const productId = window.location.pathname.split('/').pop(); 
        window.location.href = `/edit-product/${productId}`;
    });
}