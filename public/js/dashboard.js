// do this function immediately when web loaded
document.addEventListener('DOMContentLoaded', () =>{
    fetchLogsAndOrders();
});

async function fetchLogsAndOrders(){
    try {
        // fetch data from this api (response is all header combind with data - response object) we just want data
        const response = await fetch('/api/v1/dashboard-summary');
        const result = await response.json();

        // status must match with backend (success)
        if (result.status === 'success'){
            // access to data section (this is what we want)
            const dataArray = result.data;

            // ----- 4 card stats ------
            document.getElementById('total-stock').innerHTML = dataArray.stats.TotalStock;
            document.getElementById('total-stock-change').innerHTML = dataArray.stats.stockInMonth - dataArray.stats.stockOutMonth;

            // use insertAdjacentHTML with afterbegin attribute (insert right inside element) to prevent override with <span> in <div>
            document.getElementById('low-stock').insertAdjacentHTML('afterbegin', dataArray.stats.LowStock);
            document.getElementById('import-stock').insertAdjacentHTML('afterbegin', '+'+ dataArray.stats.stockInMonth);
            document.getElementById('export-stock').insertAdjacentHTML('afterbegin', '-'+ dataArray.stats.stockOutMonth);
            // --------------------------

            // ----- low stock ------
            const tableBody = document.getElementById('table-body');
            dataArray.lowStock.forEach((item) => {
                const row = `
                <tr>
                    <td>${item.product_code}</td>
                    <td>${item.name}</td>
                    <td>${item.category_name}</td>
                    <td>${item.quantity}</td>
                </tr>
                `
                tableBody.insertAdjacentHTML('beforeend', row);
            });
            // ----- low stock ------

            // ----- lastest activity ------
            const activityUl = document.getElementById('activity-list');
            dataArray.activity.forEach((item) => {
                const li = `
                <li>${item.date} ${item.description}</li>
                `
                activityUl.insertAdjacentHTML('beforeend', li);
            });
            // ----- lastest activity ------
        }
    } catch (error) {
        console.log('Fetch error:', error);
    }
}