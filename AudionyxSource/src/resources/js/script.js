document.addEventListener('DOMContentLoaded', () => {
    // Ensure CSS is applied
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = '/resources/css/loginstyles.css';
    document.head.appendChild(cssLink);

    // Ensure logo is displayed in the navbar
    const navbarBrand = document.querySelector('.navbar-brand img');
    if (navbarBrand) {
        navbarBrand.src = '../images/logo3.png';
        navbarBrand.alt = 'Audionyx Logo';
        navbarBrand.title = 'Audionyx';
    }
});
