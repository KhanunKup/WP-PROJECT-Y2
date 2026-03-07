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
                    <td>${item.area}</td>
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
                <li>${item.date} ${item.username} ${item.description}</li>
                `
                activityUl.insertAdjacentHTML('beforeend', li);
            });
            // ----- lastest activity ------

            // ----- chart.js (doughnut) -----
            const labels = dataArray.chart.map(item => item.category_name);
            const dataValues = dataArray.chart.map(item => item.quantity);

            // draw a graph
            const ctx = document.getElementById('categoryChart').getContext('2d');
            new Chart(ctx, {
                type: 'doughnut', // select type of chart (bar,doughnut,pie)
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'จำนวนสินค้า (ชิ้น)',
                        data: dataValues,
                        // color of each chart
                        backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b'], 
                        borderRadius: 4   // border-radius of chart
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
            // -----------

            // ----- chart.js (pie) -----
            const pieLabels = dataArray.value.map(item => item.name);
            const pieDataValues = dataArray.value.map(item => item.total_value);
            const ctxPie = document.getElementById('valueChart').getContext('2d');
            new Chart(ctxPie, {
                type: 'pie', 
                data: {
                    labels: pieLabels,
                    datasets: [{
                        label: 'มูลค่า (บาท)',
                        data: pieDataValues,
                        backgroundColor: ['#e74a3b', '#f6c23e', '#1cc88a', '#36b9cc', '#4e73df', '#858796'],
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'right'
                        }
                    }
                }
            });
            // ----------------------
        }
    } catch (error) {
        console.log('Fetch error:', error);
    }
}