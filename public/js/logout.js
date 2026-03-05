const logout = document.getElementById('logout');

logout.addEventListener('click', async function (event) {
    event.preventDefault(); // ป้องกันการเปลี่ยนหน้าจากแท็ก <a>
    const response = await fetch('/api/v1/auth/logout', { 
        method: 'POST' 
    });

    const result = await response.json();

    if (response.ok && result.status === 'success'){
        window.location.href = '/'
    };
})