function filterAlpha(input) {
    input.value = input.value.replace(/[^A-Za-z]/g, '').toUpperCase();
    updatePreview();
}

function filterNumber(input) {
    input.value = input.value.replace(/[^0-9]/g, '');
    updatePreview();
}

function padZero(input) {
    if (input.value !== "" && input.value.length === 1) {
        input.value = input.value.padStart(2, '0');
    }
    updatePreview();
}

function checkCustomZone() {
    const select = document.getElementById('zoneSelect');
    const customInput = document.getElementById('customZoneInput');

    if (select.value === 'custom') {
        customInput.style.display = 'block';
        customInput.focus();
    } else {
        customInput.style.display = 'none';
        customInput.value = '';
    }
    updatePreview();
}

function updatePreview() {
    const select = document.getElementById('zoneSelect');
    const customZone = document.getElementById('customZoneInput').value.toUpperCase();
    const zone = select.value === 'custom' ? customZone : select.value;

    const aisleInput = document.getElementById('inputAisle').value;
    const shelfInput = document.getElementById('inputShelf').value;
    const levelInput = document.getElementById('inputLevel').value;

    const aisle = aisleInput.padStart(2, '0');
    const shelf = shelfInput.padStart(2, '0');
    const level = levelInput.padStart(2, '0');

    const hiddenLocation = document.getElementById('inputLocation');

    if (zone && aisleInput && shelfInput && levelInput) {
        const finalFormat = `${zone}-${aisle}-${shelf}-${level}`;
        document.getElementById('locationPreview').innerText = finalFormat;
        hiddenLocation.value = finalFormat;
    } else {
        document.getElementById('locationPreview').innerText = "--";
        hiddenLocation.value = "";
    }
}