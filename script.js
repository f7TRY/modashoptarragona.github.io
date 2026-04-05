const KEYS = {
    PRODUCTS: 'modashop_products',
    CATEGORIES: 'modashop_categories',
    ADMIN_AUTH: 'modashop_admin'
};

function initData() {
    if (!localStorage.getItem(KEYS.CATEGORIES)) {
        const defaultCategories = ['Camisetas', 'Pantalones', 'Accesorios Espaciales'];
        localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(defaultCategories));
    }
    if (!localStorage.getItem(KEYS.PRODUCTS)) {
        localStorage.setItem(KEYS.PRODUCTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.ADMIN_AUTH)) {
        const defaultAdmin = {
            user: 'admin',
            pass: 'root',
            isFirstLogin: true
        };
        localStorage.setItem(KEYS.ADMIN_AUTH, JSON.stringify(defaultAdmin));
    }
}

const getStorage = (key) => JSON.parse(localStorage.getItem(key));
const setStorage = (key, data) => localStorage.setItem(key, JSON.stringify(data));

let isLoggedIn = false;
let editingProductId = null;

const DOM = {
    publicView: document.getElementById('public-view'),
    adminView: document.getElementById('admin-view'),
    
    publicFilter: document.getElementById('public-category-filter'),
    btnLogout: document.getElementById('btn-logout'),
    btnShowLogin: document.getElementById('btn-show-login'),
    
    modalLogin: document.getElementById('modal-login'),
    formLogin: document.getElementById('form-login'),
    formChangePass: document.getElementById('form-change-pass'),
    loginError: document.getElementById('login-error'),
    
    modalProduct: document.getElementById('modal-product'),
    formProduct: document.getElementById('form-product'),
    btnShowAddProduct: document.getElementById('btn-show-add-product'),
    
    productGrid: document.getElementById('product-grid'),
    adminCategoryList: document.getElementById('admin-category-list'),
    adminProductList: document.getElementById('admin-product-list'),
    formCategory: document.getElementById('form-category'),
    
    pId: document.getElementById('prod-id'),
    pName: document.getElementById('prod-name'),
    pCat: document.getElementById('prod-category'),
    pDesc: document.getElementById('prod-desc'),
    pImg: document.getElementById('prod-img'),
    pStock: document.getElementById('prod-stock')
};

function renderPublicCatalog() {
    const products = getStorage(KEYS.PRODUCTS);
    const filter = DOM.publicFilter.value;
    
    DOM.productGrid.innerHTML = '';
    
    const filteredProducts = filter === 'all' 
        ? products 
        : products.filter(p => p.category === filter);

    if (filteredProducts.length === 0) {
        DOM.productGrid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#94a3b8;">No hay productos en esta categoría.</p>';
        return;
    }

    filteredProducts.forEach(prod => {
        const stockClass = prod.inStock ? 'in-stock' : 'out-stock';
        const stockText = prod.inStock ? 'Disponible' : 'Sin stock';
        
        const fallbackImg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%231e293b'/%3E%3Ctext x='50' y='50' fill='%2394a3b8' text-anchor='middle' alignment-baseline='middle'%3EImagen%3C/text%3E%3C/svg%3E";

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <img src="${prod.img}" alt="${prod.name}" class="card-img" onerror="this.src='${fallbackImg}'">
            <div class="card-content">
                <span class="card-cat">${prod.category}</span>
                <h3 class="card-title">${prod.name}</h3>
                <p class="card-desc">${prod.desc}</p>
                <div>
                    <span class="status-badge ${stockClass}">${stockText}</span>
                </div>
            </div>
        `;
        DOM.productGrid.appendChild(card);
    });
}

function updateCategorySelects() {
    const categories = getStorage(KEYS.CATEGORIES);
    const currentValue = DOM.publicFilter.value;
    
    DOM.publicFilter.innerHTML = '<option value="all">Todas las categorías</option>';
    categories.forEach(cat => {
        DOM.publicFilter.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
    DOM.publicFilter.value = categories.includes(currentValue) ? currentValue : 'all';

    DOM.pCat.innerHTML = '';
    categories.forEach(cat => {
        DOM.pCat.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
}

function renderAdminPanel() {
    const categories = getStorage(KEYS.CATEGORIES);
    const products = getStorage(KEYS.PRODUCTS);

    DOM.adminCategoryList.innerHTML = '';
    categories.forEach(cat => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${cat}</span>
            <button class="btn outline" style="padding: 0.2rem 0.5rem; color: var(--stock-out); border-color: var(--stock-out);" onclick="deleteCategory('${cat}')">Eliminar</button>
        `;
        DOM.adminCategoryList.appendChild(li);
    });

    DOM.adminProductList.innerHTML = '';
    products.forEach(prod => {
        const tr = document.createElement('tr');
        const fallbackImg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50'%3E%3Crect width='50' height='50' fill='%231e293b'/%3E%3C/svg%3E";
        
        tr.innerHTML = `
            <td><img src="${prod.img}" onerror="this.src='${fallbackImg}'"></td>
            <td>${prod.name}</td>
            <td>${prod.category}</td>
            <td style="color: ${prod.inStock ? 'var(--stock-ok)' : 'var(--stock-out)'}">${prod.inStock ? 'Disponible' : 'Sin stock'}</td>
            <td class="action-btns">
                <button class="btn outline" onclick="openEditProduct('${prod.id}')">Editar</button>
                <button class="btn outline" style="color: var(--stock-out); border-color: var(--stock-out);" onclick="deleteProduct('${prod.id}')">Borrar</button>
            </td>
        `;
        DOM.adminProductList.appendChild(tr);
    });
}

DOM.formCategory.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('new-category-name');
    const newCat = input.value.trim();
    
    if (newCat) {
        const categories = getStorage(KEYS.CATEGORIES);
        if (!categories.includes(newCat)) {
            categories.push(newCat);
            setStorage(KEYS.CATEGORIES, categories);
            input.value = '';
            updateCategorySelects();
            renderAdminPanel();
            renderPublicCatalog();
        } else {
            alert('Esta categoría ya existe.');
        }
    }
});

window.deleteCategory = (catName) => {
    if (confirm(`¿Seguro que deseas eliminar la categoría "${catName}"?`)) {
        let categories = getStorage(KEYS.CATEGORIES);
        categories = categories.filter(c => c !== catName);
        setStorage(KEYS.CATEGORIES, categories);
        updateCategorySelects();
        renderAdminPanel();
        renderPublicCatalog();
    }
};

DOM.formProduct.addEventListener('submit', (e) => {
    e.preventDefault();
    const products = getStorage(KEYS.PRODUCTS);
    
    const productData = {
        id: DOM.pId.value || 'prod_' + Date.now(),
        name: DOM.pName.value,
        category: DOM.pCat.value,
        desc: DOM.pDesc.value,
        img: DOM.pImg.value,
        inStock: DOM.pStock.checked
    };

    if (editingProductId) {
        const index = products.findIndex(p => p.id === editingProductId);
        if (index !== -1) products[index] = productData;
    } else {
        products.push(productData);
    }

    setStorage(KEYS.PRODUCTS, products);
    closeModals();
    renderAdminPanel();
    renderPublicCatalog();
});

window.openEditProduct = (id) => {
    const products = getStorage(KEYS.PRODUCTS);
    const prod = products.find(p => p.id === id);
    if (!prod) return;

    editingProductId = id;
    DOM.pId.value = prod.id;
    DOM.pName.value = prod.name;
    DOM.pCat.value = prod.category;
    DOM.pDesc.value = prod.desc;
    DOM.pImg.value = prod.img;
    DOM.pStock.checked = prod.inStock;
    
    document.getElementById('product-modal-title').textContent = 'Editar Producto';
    DOM.modalProduct.classList.remove('hidden');
};

window.deleteProduct = (id) => {
    if (confirm('¿Eliminar este producto permanentemente?')) {
        let products = getStorage(KEYS.PRODUCTS);
        products = products.filter(p => p.id !== id);
        setStorage(KEYS.PRODUCTS, products);
        renderAdminPanel();
        renderPublicCatalog();
    }
};

DOM.formLogin.addEventListener('submit', (e) => {
    e.preventDefault();
    const adminData = getStorage(KEYS.ADMIN_AUTH);
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;

    if (user === adminData.user && pass === adminData.pass) {
        DOM.loginError.classList.add('hidden');
        if (adminData.isFirstLogin) {
            DOM.formLogin.classList.add('hidden');
            DOM.formChangePass.classList.remove('hidden');
        } else {
            successLogin();
        }
    } else {
        DOM.loginError.classList.remove('hidden');
    }
});

DOM.formChangePass.addEventListener('submit', (e) => {
    e.preventDefault();
    const newPass = document.getElementById('new-admin-pass').value;
    const adminData = getStorage(KEYS.ADMIN_AUTH);
    
    adminData.pass = newPass;
    adminData.isFirstLogin = false;
    setStorage(KEYS.ADMIN_AUTH, adminData);
    successLogin();
});

function successLogin() {
    isLoggedIn = true;
    closeModals();
    DOM.publicView.classList.replace('active', 'hidden');
    DOM.adminView.classList.replace('hidden', 'active');
    DOM.btnShowLogin.classList.add('hidden');
    DOM.btnLogout.classList.remove('hidden');
    DOM.publicFilter.classList.add('hidden');
    renderAdminPanel();
}

DOM.btnLogout.addEventListener('click', () => {
    isLoggedIn = false;
    DOM.adminView.classList.replace('active', 'hidden');
    DOM.publicView.classList.replace('hidden', 'active');
    DOM.btnShowLogin.classList.remove('hidden');
    DOM.btnLogout.classList.add('hidden');
    DOM.publicFilter.classList.remove('hidden');
    
    DOM.formLogin.reset();
    DOM.formChangePass.reset();
    DOM.formLogin.classList.remove('hidden');
    DOM.formChangePass.classList.add('hidden');
    DOM.loginError.classList.add('hidden');
});

DOM.publicFilter.addEventListener('change', renderPublicCatalog);

DOM.btnShowLogin.addEventListener('click', () => {
    DOM.modalLogin.classList.remove('hidden');
});

DOM.btnShowAddProduct.addEventListener('click', () => {
    editingProductId = null;
    DOM.formProduct.reset();
    DOM.pId.value = '';
    document.getElementById('product-modal-title').textContent = 'Añadir Nuevo Producto';
    DOM.modalProduct.classList.remove('hidden');
});

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', closeModals);
});

function closeModals() {
    DOM.modalLogin.classList.add('hidden');
    DOM.modalProduct.classList.add('hidden');
}

const canvas = document.getElementById('space-canvas');
const ctx = canvas.getContext('2d');
let stars = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function initStars() {
    stars = [];
    for (let i = 0; i < 200; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 1.5,
            speed: (Math.random() * 0.5) + 0.1,
            opacity: Math.random()
        });
    }
}

function animateStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    stars.forEach(star => {
        star.y -= star.speed;
        
        star.opacity += (Math.random() - 0.5) * 0.05;
        if (star.opacity < 0.2) star.opacity = 0.2;
        if (star.opacity > 1) star.opacity = 1;

        if (star.y < 0) {
            star.y = canvas.height;
            star.x = Math.random() * canvas.width;
        }

        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });

    requestAnimationFrame(animateStars);
}

window.addEventListener('resize', () => {
    resizeCanvas();
    initStars();
});

initData();
resizeCanvas();
initStars();
animateStars();
updateCategorySelects();
renderPublicCatalog();
