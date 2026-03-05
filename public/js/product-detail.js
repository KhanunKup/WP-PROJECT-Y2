document.addEventListener('DOMContentLoaded', async () => {
    // ดึง Product ID จาก URL (เช่น /product-details/1)
    const productId = window.location.pathname.split('/').pop();

    try {
        const response = await fetch(`/api/v1/product-details/${productId}`);
        const result = await response.json();

        if (result.status === 'success') {
            const product = result.data;

            // นำข้อมูลไปแสดงผล
            document.getElementById('productName').innerText = product.name;
            document.getElementById('productImage').src = product.image_url;
            document.getElementById('inputCost').value = product.cost_price;
            document.getElementById('inputPrice').value = product.selling_price;
            document.getElementById('inputStock').value = product.total_stock;
        } else {
            console.error(result.message);
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
});

const editBtn = document.querySelector('.btn-save');

editBtn.addEventListener('click', () => {
    // productId ได้จากการดึงค่าจาก URL ในปัจจุบัน
    const productId = window.location.pathname.split('/').pop(); 
    window.location.href = `/edit-product/${productId}`;
});