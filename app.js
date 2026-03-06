// Telegram Web App init
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Firebase konfiguratsiyasi (sizning maʼlumotlaringiz)
const firebaseConfig = {
  apiKey: "AIzaSyAwMERQQ9dzxrcrmsFTA7BI2Ow7SwegTL4",
  authDomain: "tg-dokon.firebaseapp.com",
  databaseURL: "https://tg-dokon-default-rtdb.firebaseio.com",
  projectId: "tg-dokon",
  storageBucket: "tg-dokon.firebasestorage.app",
  messagingSenderId: "611375396358",
  appId: "1:611375396358:web:8b6efbe48f54cb0f7ef587"
};

// Firebase Initialize (compat usulida)
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Global o'zgaruvchilar
let products = [];
let categories = [];
let orders = [];
let cart = [];
let currentCategory = 'all';
let currentProductId = null; // quick view uchun

// DOM elementlar
const usernameSpan = document.getElementById('username');
const productGrid = document.getElementById('product-grid');
const categoryList = document.getElementById('category-list');
const searchInput = document.getElementById('search-input');
const cartCountSpan = document.getElementById('cart-count');
const cartTotalInfo = document.getElementById('cart-total-info');
const cartItemsUl = document.getElementById('cart-items');
const totalPriceDisplay = document.getElementById('total-price-display');
const orderComment = document.getElementById('order-comment');
const statusBar = document.getElementById('status-bar');
const orderStatusText = document.getElementById('order-status-text');
const dots = [document.getElementById('dot-1'), document.getElementById('dot-2'), document.getElementById('dot-3')];

// Admin panel elementlari
const adminModal = document.getElementById('admin-modal');
const pName = document.getElementById('p-name');
const pPrice = document.getElementById('p-price');
const pSalePrice = document.getElementById('p-sale-price');
const pCatSelect = document.getElementById('p-cat-select');
const pDesc = document.getElementById('p-desc');
const pImageInput = document.getElementById('p-image-input');
const imagePreview = document.getElementById('image-preview');
const adminProdList = document.getElementById('admin-prod-list');
const newCatInput = document.getElementById('new-cat-input');
const adminCatList = document.getElementById('admin-cat-list');
const adminOrdersList = document.getElementById('admin-orders-list');
const totalRevenueSpan = document.getElementById('total-revenue');
const totalOrdersSpan = document.getElementById('total-orders-count');

// Quick view elementlari
const quickModal = document.getElementById('quick-view-modal');
const qvImg = document.getElementById('qv-img');
const qvName = document.getElementById('qv-name');
const qvPrice = document.getElementById('qv-price');
const qvDesc = document.getElementById('qv-desc');
const qvAddBtn = document.getElementById('qv-add-btn');

// Cart modal
const cartModal = document.getElementById('cart-modal');

// ==================== Foydalanuvchi ma'lumoti ====================
if (tg.initDataUnsafe?.user) {
    const user = tg.initDataUnsafe.user;
    usernameSpan.textContent = user.first_name + (user.last_name ? ' ' + user.last_name : '');
} else {
    usernameSpan.textContent = 'Mehmon';
}

// ==================== MA'LUMOTLARNI O'QISH ====================
function loadCategories() {
    db.ref('categories').on('value', snapshot => {
        categories = [];
        const data = snapshot.val();
        for (let id in data) {
            categories.push({ id, ...data[id] });
        }
        renderCategories();
        fillCategorySelect();
    });
}

function loadProducts() {
    db.ref('products').on('value', snapshot => {
        products = [];
        const data = snapshot.val();
        for (let id in data) {
            products.push({ id, ...data[id] });
        }
        filterAndRenderProducts();
    });
}

function loadOrders() {
    db.ref('orders').on('value', snapshot => {
        orders = [];
        const data = snapshot.val();
        for (let id in data) {
            orders.push({ id, ...data[id] });
        }
        updateAdminOrders();
        updateStatistics();
    });
}

// ==================== KATEGORIYALAR ====================
function renderCategories() {
    let html = '<div class="category-item active" data-cat="all" onclick="filterCategory(\'all\')">Barchasi</div>';
    categories.forEach(cat => {
        html += `<div class="category-item" data-cat="${cat.id}" onclick="filterCategory('${cat.id}')">${cat.name}</div>`;
    });
    categoryList.innerHTML = html;
}

function filterCategory(catId) {
    currentCategory = catId;
    document.querySelectorAll('.category-item').forEach(el => {
        if (el.dataset.cat === catId) el.classList.add('active');
        else el.classList.remove('active');
    });
    filterAndRenderProducts();
}

function fillCategorySelect() {
    let options = '<option value="">Tanlang</option>';
    categories.forEach(cat => {
        options += `<option value="${cat.id}">${cat.name}</option>`;
    });
    pCatSelect.innerHTML = options;
}

// ==================== MAHSULOTLAR ====================
function filterAndRenderProducts() {
    let filtered = products;
    if (currentCategory !== 'all') {
        filtered = filtered.filter(p => p.category === currentCategory);
    }
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm));
    }
    renderProducts(filtered);
}

function renderProducts(productsArray) {
    if (!productsArray.length) {
        productGrid.innerHTML = '<p style="text-align:center; color:#999; padding:20px;">Mahsulot topilmadi</p>';
        return;
    }
    let html = '';
    productsArray.forEach(p => {
        const price = p.salePrice ? `<span>${p.salePrice.toLocaleString()} so'm</span> <span class="old-price">${p.price.toLocaleString()} so'm</span>` : `${p.price.toLocaleString()} so'm`;
        html += `
            <div class="product-card" onclick="openQuickView('${p.id}')">
                <img src="${p.image || 'https://via.placeholder.com/150'}" alt="${p.name}" class="product-image" loading="lazy">
                <div class="product-info">
                    <div class="product-name">${p.name}</div>
                    <div class="product-price">${price}</div>
                </div>
            </div>
        `;
    });
    productGrid.innerHTML = html;
}

function searchProducts(value) {
    filterAndRenderProducts();
}

// ==================== QUICK VIEW ====================
window.openQuickView = function(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    currentProductId = productId;
    qvImg.src = product.image || 'https://via.placeholder.com/250';
    qvName.textContent = product.name;
    qvDesc.textContent = product.desc || '';
    const price = product.salePrice ? `<span style="color:#0088cc;">${product.salePrice.toLocaleString()} so'm</span> <span style="text-decoration:line-through; color:#999;">${product.price.toLocaleString()} so'm</span>` : `${product.price.toLocaleString()} so'm`;
    qvPrice.innerHTML = price;
    qvAddBtn.onclick = () => addToCart(productId);
    quickModal.hidden = false;
};

window.closeQuickView = function() {
    quickModal.hidden = true;
};

// ==================== SAVAT ====================
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: product.name,
            price: product.salePrice || product.price,
            quantity: 1,
            image: product.image
        });
    }
    updateCartUI();
    closeQuickView();
    tg.HapticFeedback.impactOccurred('light');
}

function updateCartUI() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartCountSpan.textContent = count;
    cartTotalInfo.textContent = total.toLocaleString() + ' so\'m';
    
    // Cart modalni yangilash
    let itemsHtml = '';
    cart.forEach(item => {
        itemsHtml += `
            <li class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">${item.price.toLocaleString()} so'm x ${item.quantity}</div>
                </div>
                <div class="cart-item-actions">
                    <button onclick="changeQuantity('${item.id}', -1)">➖</button>
                    <span>${item.quantity}</span>
                    <button onclick="changeQuantity('${item.id}', 1)">➕</button>
                    <button onclick="removeFromCart('${item.id}')">🗑️</button>
                </div>
            </li>
        `;
    });
    if (!cart.length) itemsHtml = '<p style="text-align:center; color:#999;">Savat bo‘sh</p>';
    cartItemsUl.innerHTML = itemsHtml;
    totalPriceDisplay.textContent = total.toLocaleString();
}

window.changeQuantity = function(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
        cart = cart.filter(i => i.id !== productId);
    }
    updateCartUI();
};

window.removeFromCart = function(productId) {
    cart = cart.filter(i => i.id !== productId);
    updateCartUI();
};

window.toggleCart = function() {
    if (cartModal.hidden) {
        cartModal.hidden = false;
    } else {
        cartModal.hidden = true;
    }
};

// ==================== BUYURTMA BERISH ====================
window.checkout = function() {
    if (!cart.length) {
        alert('Savat bo‘sh');
        return;
    }
    const comment = orderComment.value.trim();
    if (!comment) {
        alert('Iltimos, manzil yoki telefon raqamingizni yozing');
        return;
    }

    const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const order = {
        items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        total: total,
        comment: comment,
        status: 'pending', // pending, preparing, ready
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        userId: tg.initDataUnsafe?.user?.id || 'anonymous',
        userName: usernameSpan.textContent
    };

    db.ref('orders').push(order).then(() => {
        cart = [];
        updateCartUI();
        toggleCart();
        orderComment.value = '';
        tg.HapticFeedback.notificationOccurred('success');
        // Status barni ko'rsatish
        statusBar.hidden = false;
        orderStatusText.textContent = 'Qabul qilindi';
        updateStatusDots(1);
    }).catch(err => {
        console.error(err);
        alert('Xatolik yuz berdi');
    });
};

// Status dots
function updateStatusDots(activeStep) {
    dots.forEach((dot, index) => {
        if (index < activeStep) dot.classList.add('active');
        else dot.classList.remove('active');
    });
}

// ==================== ADMIN PANEL ====================
window.openAdmin = function() {
    adminModal.hidden = false;
    loadAdminProducts();
    loadAdminCategories();
    loadAdminOrders();
};

window.closeAdmin = function() {
    adminModal.hidden = true;
};

// Tablar
window.showTab = function(tabId, btn) {
    document.querySelectorAll('.tab-body').forEach(tab => tab.hidden = true);
    document.getElementById(tabId).hidden = false;
    document.querySelectorAll('.tab-link').forEach(link => link.classList.remove('active'));
    btn.classList.add('active');
};

// Mahsulot qo'shish
window.addNewProduct = function() {
    const name = pName.value.trim();
    const price = parseFloat(pPrice.value);
    const salePrice = pSalePrice.value ? parseFloat(pSalePrice.value) : null;
    const category = pCatSelect.value;
    const desc = pDesc.value.trim();

    if (!name || !price || !category) {
        alert('Narx va kategoriya majburiy');
        return;
    }

    // Rasmni base64 qilib olish (soddalashtirilgan)
    let imageUrl = '';
    if (pImageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
            imageUrl = e.target.result;
            saveProduct({ name, price, salePrice, category, desc, image: imageUrl });
        };
        reader.readAsDataURL(pImageInput.files[0]);
    } else {
        saveProduct({ name, price, salePrice, category, desc, image: '' });
    }
};

function saveProduct(product) {
    db.ref('products').push(product).then(() => {
        pName.value = '';
        pPrice.value = '';
        pSalePrice.value = '';
        pDesc.value = '';
        pImageInput.value = '';
        imagePreview.innerHTML = '';
        tg.HapticFeedback.impactOccurred('light');
    });
}

// Admin mahsulotlar ro'yxati
function loadAdminProducts() {
    db.ref('products').once('value', snapshot => {
        let html = '';
        snapshot.forEach(child => {
            const p = child.val();
            html += `
                <div class="admin-item">
                    <span><b>${p.name}</b> (${p.price} so'm)</span>
                    <div class="admin-item-actions">
                        <button onclick="editProduct('${child.key}')">✏️</button>
                        <button onclick="deleteProduct('${child.key}')">🗑️</button>
                    </div>
                </div>
            `;
        });
        adminProdList.innerHTML = html || '<p class="loading-placeholder">Mahsulot yo‘q</p>';
    });
}

window.deleteProduct = function(id) {
    if (confirm("O‘chirilsinmi?")) {
        db.ref('products/' + id).remove();
    }
};

// Kategoriya qo'shish
window.addNewCategory = function() {
    const name = newCatInput.value.trim();
    if (!name) return;
    db.ref('categories').push({ name }).then(() => {
        newCatInput.value = '';
    });
};

function loadAdminCategories() {
    db.ref('categories').once('value', snapshot => {
        let html = '';
        snapshot.forEach(child => {
            const cat = child.val();
            html += `
                <div class="admin-item">
                    <span>${cat.name}</span>
                    <div class="admin-item-actions">
                        <button onclick="deleteCategory('${child.key}')">🗑️</button>
                    </div>
                </div>
            `;
        });
        adminCatList.innerHTML = html || '<p class="loading-placeholder">Kategoriya yo‘q</p>';
    });
}

window.deleteCategory = function(id) {
    if (confirm("Ushbu kategoriya va unga bog‘liq mahsulotlar o‘chirilsinmi?")) {
        db.ref('categories/' + id).remove();
        // Mahsulotlardan ham olib tashlash kerak (ixtiyoriy)
    }
};

// Buyurtmalar
function loadAdminOrders() {
    db.ref('orders').orderByChild('timestamp').once('value', snapshot => {
        let html = '';
        const ordersArray = [];
        snapshot.forEach(child => {
            ordersArray.push({ id: child.key, ...child.val() });
        });
        ordersArray.reverse().forEach(order => {
            const statusMap = { pending: '⏳ Kutilmoqda', preparing: '👨‍🍳 Tayyorlanmoqda', ready: '✅ Tayyor' };
            html += `
                <div class="admin-item" style="flex-direction:column; align-items:stretch;">
                    <div style="display:flex; justify-content:space-between;">
                        <span><b>${order.userName}</b> - ${new Date(order.timestamp).toLocaleString()}</span>
                        <span>${order.total.toLocaleString()} so'm</span>
                    </div>
                    <div style="margin:5px 0;">${order.comment}</div>
                    <div style="display:flex; gap:5px;">
                        <select onchange="updateOrderStatus('${order.id}', this.value)">
                            <option value="pending" ${order.status==='pending'?'selected':''}>Kutilmoqda</option>
                            <option value="preparing" ${order.status==='preparing'?'selected':''}>Tayyorlanmoqda</option>
                            <option value="ready" ${order.status==='ready'?'selected':''}>Tayyor</option>
                        </select>
                        <button onclick="deleteOrder('${order.id}')">🗑️</button>
                    </div>
                </div>
            `;
        });
        adminOrdersList.innerHTML = html || '<p class="loading-placeholder">Buyurtmalar yo‘q</p>';
    });
}

window.updateOrderStatus = function(orderId, status) {
    db.ref('orders/' + orderId).update({ status });
};

window.deleteOrder = function(orderId) {
    if (confirm("Buyurtma o‘chirilsinmi?")) {
        db.ref('orders/' + orderId).remove();
    }
};

// Statistika
function updateStatistics() {
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    totalRevenueSpan.textContent = totalRevenue.toLocaleString() + ' so\'m';
    totalOrdersSpan.textContent = orders.length;
}

// ==================== BOSHLANG'ICH YUKLASH ====================
loadCategories();
loadProducts();
loadOrders();

// Escape tugmasi bilan modalni yopish
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        if (!adminModal.hidden) closeAdmin();
        if (!quickModal.hidden) closeQuickView();
        if (!cartModal.hidden) toggleCart();
    }
});

// Modal tashqarisiga bosish bilan yopish (ixtiyoriy)
adminModal.addEventListener('click', e => {
    if (e.target === adminModal) closeAdmin();
});
quickModal.addEventListener('click', e => {
    if (e.target === quickModal) closeQuickView();
});
cartModal.addEventListener('click', e => {
    if (e.target === cartModal) toggleCart();
});