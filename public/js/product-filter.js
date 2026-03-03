const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const productContainer = document.getElementById('productContainer'); // กล่องครอบการ์ดทั้งหมด

// ฟังก์ชันสำหรับไปดึงข้อมูลจาก Server
async function fetchProducts() {
    // 1. ดึงค่าปัจจุบันจากช่องค้นหาและ Dropdown
    const searchText = searchInput.value;
    const category = categoryFilter.value;

    // 2. ประกอบ URL พร้อมส่ง Query String ไปหา API
    // ใช้ encodeURIComponent เพื่อป้องกัน Error เวลาพิมพ์ภาษาไทยหรือเว้นวรรค
    const url = `/api/v1/products?search=${encodeURIComponent(searchText)}&category=${encodeURIComponent(category)}`;

    try {
        const response = await fetch(url);
        const result = await response.json();

        if (result.status === 'success') {
            // 3. ส่งข้อมูลไปวาดลงหน้าเว็บ
            renderProducts(result.data);
        }
    } catch (error) {
        console.error("ดึงข้อมูลสินค้าล้มเหลว:", error);
    }
}

// ฟังก์ชันสำหรับวาด HTML การ์ดสินค้าใหม่
function renderProducts(products) {
    productContainer.innerHTML = ''; // ล้างการ์ดเก่าออกให้หมดก่อน

    if (products.length === 0) {
        productContainer.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; padding: 50px 0; font-size: 18px; color: #666;">ไม่พบสินค้าที่คุณค้นหา</p>';
        return;
    }

    // เอาข้อมูล Array ที่ได้จาก Database มาวนลูปสร้าง HTML
    products.forEach(product => {
        const cardHTML = `
            <div class="product-card">
                <img src="${product.image_url || '/images/default-product.png'}" alt="${product.name}">
                <h4 class="product-name">${product.name}</h4>
                <a href="/product-details/${product.product_id}"><button>รายละเอียด</button></a>
            </div>
        `;
        // ยัด HTML ใหม่ลงไปใน Container
        productContainer.innerHTML += cardHTML;
    });
}

// สั่งให้ดึงข้อมูลใหม่ทุกครั้งที่ผู้ใช้ พิมพ์ หรือ เปลี่ยน Dropdown
searchInput.addEventListener('input', fetchProducts);
categoryFilter.addEventListener('change', fetchProducts);

// โหลดข้อมูลทั้งหมดมาโชว์ 1 ครั้ง ตอนเปิดหน้าเว็บแรกสุด
window.onload = fetchProducts;