// do this function immediately when web loaded
document.addEventListener('DOMContentLoaded', () =>{
    fetchLogsAndOrders();
});

async function fetchLogsAndOrders(){
    try {
        // fetch data from this api (response is all header combind with data - response object) we just want data
        // res.status(200).json({       
        //     status: "success",              <-- response.json (result)  - status,message,data 
        //     message: "ดึงข้อมูลสำเร็จ",
        //     data: rows
        // });
        const response = await fetch('/api/v1/all-order');
        const result = await response.json();

        // status must match with backend (success)
        if (result.status === 'success'){
            // *****accesss to data array ([{},{}])*****
            const dataArray = result.data;

            // pull element from <tbody>
            const tableBody = document.getElementById('table-body');
            tableBody.innerHTML = '';

            let index =  1;
            dataArray.forEach((item) => {
                // ternary Operator (condition ? if true : if false) if system will be grey text
                const displayName = `<span style="color: gray;">${item.fullname}</span>`;

                const displayEmail = `<a href="mailto:${item.email}" style="color: #2563eb; text-decoration: none;">${item.email}</a>`;
                
                // style action base from text
                let actionClass = 'action-system'; // system will be blue
                const actionText = (item.action || '').toUpperCase(); // prevent LOGIN <-> Login
                if (actionText === 'นำเข้าสินค้า') {
                    actionClass = 'action-in';
                } else if (actionText === 'เบิกจ่ายสินค้า') {
                    actionClass = 'action-out';
                } else if (actionText === 'เข้าสู่ระบบ' || actionText === 'ออกจากระบบ' || actionText === 'เข้าสู่ระบบไม่สำเร็จ') {
                    actionClass = 'action-login-logout'
                }

                let roleClass = 'role-none'; // base role style is grey
                const roleText = (item.role || '');
                if (roleText === 'ผู้ดูแลระบบ') {
                    roleClass = 'role-admin';
                } else if (roleText === 'ผู้จัดการ') {
                    roleClass = 'role-manager';
                } else if (roleText === 'พนักงาน') 
                    roleClass = 'role-staff';

                const row = `
                    <tr>
                        <td style="color: #6b7280; text-align: center;">${index}</td>
                        <td style="font-size: 13px; color: #4b5563;">${item.date}</td>
                        <td><b>${item.username}</b></td>
                        <td>${displayName}</td>
                        <td><span class="action-badge ${actionClass}">${item.action}</span></td>
                        <td style="text-align: left;">${item.detail}</td>
                        <td>${displayEmail}</td>
                        <td><span class="role-badge ${roleClass}">${item.role}</span></td>
                    </tr>
                `;
                // insert row to <tbody> 'beforeend' is where to add rows, in this case is before </tbody> close
                tableBody.insertAdjacentHTML('beforeend', row);
                index += 1;
            });
        }
    } catch (error) {
        console.log('Fetch error:', error);
    }
}