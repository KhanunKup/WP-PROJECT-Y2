const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const statusFilter = document.getElementById('statusFilter'); // เพิ่มตัวแปรรับค่ากล่องสถานะ
const productContainer = document.getElementById('productContainer');

async function fetchProducts() {
    const searchText = searchInput.value;
    const category = categoryFilter.value;
    const status = statusFilter.value; // ดึงค่าจากกล่องสถานะ

    // ส่ง params ทั้ง 3 ตัวไปให้ Backend
    const url = `/api/v1/products?search=${encodeURIComponent(searchText)}&category=${encodeURIComponent(category)}&status=${encodeURIComponent(status)}`;

    try {
        const response = await fetch(url);
        const result = await response.json();

        if (result.status === 'success') {
            renderProducts(result.data);
        }
    } catch (error) {
        console.error("ดึงข้อมูลสินค้าล้มเหลว:", error);
    }
}

function renderProducts(products) {
    productContainer.innerHTML = ''; 

    if (products.length === 0) {
        productContainer.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; padding: 50px 0; font-size: 18px; color: #666;">ไม่พบสินค้าที่คุณค้นหา</p>';
        return;
    }

    products.forEach(product => {
        // เช็คว่าของหมดหรือเปล่า เพื่อเปลี่ยนสีป้ายโชว์ในการ์ด
        const stockText = product.total_stock > 0 
            ? `<span style="color: #15803d; font-size: 0.9rem;">● มีสินค้า (${product.total_stock})</span>` 
            : `<span style="color: #b91c1c; font-size: 0.9rem;">● สินค้าหมด</span>`;

        const cardHTML = `
            <div class="product-card" style="display: flex; flex-direction: column; align-items: center; padding: 15px; border: 1px solid #ddd; border-radius: 10px;">
                <img src="${product.image_url || '/images/default-product.png'}" alt="${product.name}" style="width: 100%; height: 150px; object-fit: contain; margin-bottom: 10px;">
                <h4 class="product-name" style="margin-bottom: 5px; text-align: center;">${product.name}</h4>
                <div style="margin-bottom: 15px;">${stockText}</div>
                <a href="/product-details/${product.product_id}" style="width: 100%;">
                    <button>รายละเอียด</button>
                </a>
            </div>
        `;
        productContainer.innerHTML += cardHTML;
    });
}

// ผูก Event Listener ให้ทำงานเมื่อมีการพิมพ์ หรือเปลี่ยน Dropdown
searchInput.addEventListener('input', fetchProducts);
categoryFilter.addEventListener('change', fetchProducts);
statusFilter.addEventListener('change', fetchProducts); // ดักจับตอนเปลี่ยนสถานะ

window.onload = fetchProducts;