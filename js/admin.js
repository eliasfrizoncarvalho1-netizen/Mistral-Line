import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    collection,
    getDocs,
    doc,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const ADMIN_EMAIL = "eliasfrizoncarvalho1@gmail.com";

const adminEmail = document.getElementById("adminEmail");
const settingEmail = document.getElementById("settingEmail");
const logoutBtn = document.getElementById("logoutBtn");
const refreshBtn = document.getElementById("refreshBtn");
const pageTitle = document.getElementById("pageTitle");

const menuItems = document.querySelectorAll(".menu-item");
const sectionPages = document.querySelectorAll(".section-page");
const quickButtons = document.querySelectorAll("[data-go]");

const totalOrders = document.getElementById("totalOrders");
const totalRevenue = document.getElementById("totalRevenue");
const totalUsers = document.getElementById("totalUsers");
const totalProducts = document.getElementById("totalProducts");

const statusNew = document.getElementById("statusNew");
const statusPending = document.getElementById("statusPending");
const statusApproved = document.getElementById("statusApproved");
const statusCanceled = document.getElementById("statusCanceled");

const recentOrdersTable = document.getElementById("recentOrdersTable");
const ordersTable = document.getElementById("ordersTable");
const usersTable = document.getElementById("usersTable");
const productsGrid = document.getElementById("productsGrid");
const messagesList = document.getElementById("messagesList");

const orderSearch = document.getElementById("orderSearch");
const orderStatusFilter = document.getElementById("orderStatusFilter");
const userSearch = document.getElementById("userSearch");
const productSearch = document.getElementById("productSearch");

const exportOrdersBtn = document.getElementById("exportOrdersBtn");

const productModal = document.getElementById("productModal");
const openProductModal = document.getElementById("openProductModal");
const closeProductModal = document.getElementById("closeProductModal");
const cancelProductBtn = document.getElementById("cancelProductBtn");
const productForm = document.getElementById("productForm");

const modalTitle = document.getElementById("modalTitle");
const productId = document.getElementById("productId");
const productName = document.getElementById("productName");
const productCategory = document.getElementById("productCategory");
const productPrice = document.getElementById("productPrice");
const productStock = document.getElementById("productStock");
const productImage = document.getElementById("productImage");
const productDescription = document.getElementById("productDescription");

let ordersData = [];
let usersData = [];
let productsData = [];
let messagesData = [];

function formatMoney(value) {
    return Number(value || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function formatDate(timestamp) {
    if (!timestamp) return "Sem data";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

    return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

function safeText(value) {
    return String(value || "").replace(/[<>&"]/g, "");
}

function goToSection(sectionId) {
    menuItems.forEach((item) => {
        item.classList.toggle("active", item.dataset.section === sectionId);
    });

    sectionPages.forEach((section) => {
        section.classList.toggle("active", section.id === sectionId);
    });

    const activeButton = document.querySelector(`[data-section="${sectionId}"]`);
    pageTitle.textContent = activeButton ? activeButton.textContent.replace(/[0-9]/g, "").trim() : "Admin";
}

menuItems.forEach((item) => {
    item.addEventListener("click", () => {
        goToSection(item.dataset.section);
    });
});

quickButtons.forEach((button) => {
    button.addEventListener("click", () => {
        goToSection(button.dataset.go);
    });
});

function getOrderItemsText(order) {
    if (!Array.isArray(order.items)) return "Sem itens";

    return order.items.map((item) => {
        return `${item.quantity || 1}x ${item.name || "Produto"}`;
    }).join(", ");
}

function normalizeStatus(status) {
    return String(status || "novo").toLowerCase();
}

function renderDashboard() {
    const revenue = ordersData.reduce((sum, order) => {
        return sum + Number(order.total || 0);
    }, 0);

    totalOrders.textContent = ordersData.length;
    totalRevenue.textContent = formatMoney(revenue);
    totalUsers.textContent = usersData.length;
    totalProducts.textContent = productsData.length;

    statusNew.textContent = ordersData.filter((order) => normalizeStatus(order.status) === "novo").length;
    statusPending.textContent = ordersData.filter((order) => normalizeStatus(order.status).includes("pending")).length;
    statusApproved.textContent = ordersData.filter((order) => normalizeStatus(order.status) === "approved").length;
    statusCanceled.textContent = ordersData.filter((order) => {
        const status = normalizeStatus(order.status);
        return status === "cancelled" || status === "canceled" || status === "cancelado";
    }).length;

    const recent = ordersData.slice(0, 5);

    if (recent.length === 0) {
        recentOrdersTable.innerHTML = `
            <tr>
                <td colspan="5">Nenhum pedido encontrado.</td>
            </tr>
        `;
        return;
    }

    recentOrdersTable.innerHTML = recent.map((order) => {
        return `
            <tr>
                <td>${safeText(order.customer?.name || "Sem nome")}</td>
                <td>${safeText(order.customer?.phone || "Sem telefone")}</td>
                <td>${formatMoney(order.total)}</td>
                <td><span class="status-badge">${safeText(order.status || "novo")}</span></td>
                <td>${formatDate(order.createdAt)}</td>
            </tr>
        `;
    }).join("");
}

function renderOrders() {
    const search = orderSearch.value.trim().toLowerCase();
    const filter = orderStatusFilter.value;

    let filtered = [...ordersData];

    if (search) {
        filtered = filtered.filter((order) => {
            const text = `
                ${order.customer?.name || ""}
                ${order.customer?.phone || ""}
                ${order.customer?.email || ""}
                ${order.status || ""}
            `.toLowerCase();

            return text.includes(search);
        });
    }

    if (filter) {
        filtered = filtered.filter((order) => normalizeStatus(order.status) === filter);
    }

    if (filtered.length === 0) {
        ordersTable.innerHTML = `
            <tr>
                <td colspan="7">Nenhum pedido encontrado.</td>
            </tr>
        `;
        return;
    }

    ordersTable.innerHTML = filtered.map((order) => {
        return `
            <tr>
                <td>${safeText(order.customer?.name || "Sem nome")}</td>
                <td>${safeText(order.customer?.phone || "Sem telefone")}</td>
                <td>${safeText(getOrderItemsText(order))}</td>
                <td>${formatMoney(order.total)}</td>
                <td><span class="status-badge">${safeText(order.status || "novo")}</span></td>
                <td>${formatDate(order.createdAt)}</td>
                <td>
                    <div class="table-actions">
                        <select data-order-status="${order.id}">
                            <option value="novo">Novo</option>
                            <option value="pending_payment">Pendente</option>
                            <option value="approved">Aprovado</option>
                            <option value="cancelled">Cancelado</option>
                            <option value="delivered">Entregue</option>
                        </select>

                        <button data-delete-order="${order.id}">Excluir</button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");

    document.querySelectorAll("[data-order-status]").forEach((select) => {
        const orderId = select.dataset.orderStatus;
        const order = ordersData.find((item) => item.id === orderId);

        if (order) {
            select.value = order.status || "novo";
        }

        select.addEventListener("change", async () => {
            await updateDoc(doc(db, "orders", orderId), {
                status: select.value,
                updatedAt: serverTimestamp()
            });

            await loadAllData();
        });
    });

    document.querySelectorAll("[data-delete-order]").forEach((button) => {
        button.addEventListener("click", async () => {
            const confirmDelete = confirm("Tem certeza que deseja excluir esse pedido?");

            if (!confirmDelete) return;

            await deleteDoc(doc(db, "orders", button.dataset.deleteOrder));
            await loadAllData();
        });
    });
}

function renderUsers() {
    const search = userSearch.value.trim().toLowerCase();

    let filtered = [...usersData];

    if (search) {
        filtered = filtered.filter((user) => {
            const text = `
                ${user.name || ""}
                ${user.email || ""}
                ${user.phone || ""}
            `.toLowerCase();

            return text.includes(search);
        });
    }

    if (filtered.length === 0) {
        usersTable.innerHTML = `
            <tr>
                <td colspan="5">Nenhum cliente encontrado.</td>
            </tr>
        `;
        return;
    }

    usersTable.innerHTML = filtered.map((user) => {
        return `
            <tr>
                <td>${safeText(user.name || "Sem nome")}</td>
                <td>${safeText(user.email || "Sem e-mail")}</td>
                <td>${safeText(user.phone || "Sem telefone")}</td>
                <td>${safeText(user.provider || "email")}</td>
                <td>${formatDate(user.createdAt)}</td>
            </tr>
        `;
    }).join("");
}

function renderProducts() {
    const search = productSearch.value.trim().toLowerCase();

    let filtered = [...productsData];

    if (search) {
        filtered = filtered.filter((product) => {
            const text = `
                ${product.name || ""}
                ${product.category || ""}
                ${product.description || ""}
            `.toLowerCase();

            return text.includes(search);
        });
    }

    if (filtered.length === 0) {
        productsGrid.innerHTML = `<p class="empty-text">Nenhum produto encontrado.</p>`;
        return;
    }

    productsGrid.innerHTML = filtered.map((product) => {
        return `
            <article class="admin-product-card">
                <img src="${safeText(product.image || "/img/logo.png")}" alt="${safeText(product.name || "Produto")}">

                <div class="admin-product-info">
                    <span>${safeText(product.category || "Produto")}</span>
                    <h4>${safeText(product.name || "Sem nome")}</h4>
                    <p>${safeText(product.description || "Sem descrição.")}</p>

                    <div class="admin-product-bottom">
                        <strong>${formatMoney(product.price)}</strong>
                        <small>Estoque: ${Number(product.stock || 0)}</small>
                    </div>

                    <div class="admin-product-actions">
                        <button data-edit-product="${product.id}">Editar</button>
                        <button data-delete-product="${product.id}">Excluir</button>
                    </div>
                </div>
            </article>
        `;
    }).join("");

    document.querySelectorAll("[data-edit-product]").forEach((button) => {
        button.addEventListener("click", () => {
            const product = productsData.find((item) => item.id === button.dataset.editProduct);

            if (product) {
                openModal(product);
            }
        });
    });

    document.querySelectorAll("[data-delete-product]").forEach((button) => {
        button.addEventListener("click", async () => {
            const confirmDelete = confirm("Tem certeza que deseja excluir esse produto?");

            if (!confirmDelete) return;

            await deleteDoc(doc(db, "products", button.dataset.deleteProduct));
            await loadAllData();
        });
    });
}

function renderMessages() {
    if (messagesData.length === 0) {
        messagesList.innerHTML = `<p class="empty-text">Nenhuma mensagem encontrada.</p>`;
        return;
    }

    messagesList.innerHTML = messagesData.map((message) => {
        return `
            <article class="message-card">
                <h4>${safeText(message.name || message.from_name || "Sem nome")}</h4>
                <span>${safeText(message.email || message.from_email || "Sem e-mail")} • ${formatDate(message.createdAt)}</span>
                <p>${safeText(message.message || "Sem mensagem.")}</p>
            </article>
        `;
    }).join("");
}

async function loadCollection(name, ordered = true) {
    try {
        const ref = collection(db, name);
        const q = ordered ? query(ref, orderBy("createdAt", "desc")) : ref;
        const snapshot = await getDocs(q);

        return snapshot.docs.map((item) => {
            return {
                id: item.id,
                ...item.data()
            };
        });
    } catch (error) {
        console.warn(`Erro ao carregar coleção ${name}:`, error);
        return [];
    }
}

async function loadAllData() {
    recentOrdersTable.innerHTML = `<tr><td colspan="5">Carregando...</td></tr>`;
    ordersTable.innerHTML = `<tr><td colspan="7">Carregando...</td></tr>`;
    usersTable.innerHTML = `<tr><td colspan="5">Carregando...</td></tr>`;
    productsGrid.innerHTML = `<p class="empty-text">Carregando produtos...</p>`;
    messagesList.innerHTML = `<p class="empty-text">Carregando mensagens...</p>`;

    ordersData = await loadCollection("orders");
    usersData = await loadCollection("users");
    productsData = await loadCollection("products");
    messagesData = await loadCollection("messages");

    renderDashboard();
    renderOrders();
    renderUsers();
    renderProducts();
    renderMessages();
}

function openModal(product = null) {
    productModal.classList.add("active");

    if (product) {
        modalTitle.textContent = "Editar produto";
        productId.value = product.id;
        productName.value = product.name || "";
        productCategory.value = product.category || "";
        productPrice.value = product.price || "";
        productStock.value = product.stock || "";
        productImage.value = product.image || "";
        productDescription.value = product.description || "";
    } else {
        modalTitle.textContent = "Novo produto";
        productForm.reset();
        productId.value = "";
    }
}

function closeModal() {
    productModal.classList.remove("active");
    productForm.reset();
    productId.value = "";
}

openProductModal.addEventListener("click", () => openModal());
closeProductModal.addEventListener("click", closeModal);
cancelProductBtn.addEventListener("click", closeModal);

productModal.addEventListener("click", (event) => {
    if (event.target === productModal) {
        closeModal();
    }
});

productForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = {
        name: productName.value.trim(),
        category: productCategory.value.trim(),
        price: Number(productPrice.value),
        stock: Number(productStock.value),
        image: productImage.value.trim(),
        description: productDescription.value.trim(),
        updatedAt: serverTimestamp()
    };

    if (!data.name || !data.category || !data.price || !data.image || !data.description) {
        alert("Preencha todos os campos.");
        return;
    }

    if (productId.value) {
        await updateDoc(doc(db, "products", productId.value), data);
    } else {
        await addDoc(collection(db, "products"), {
            ...data,
            createdAt: serverTimestamp()
        });
    }

    closeModal();
    await loadAllData();
});

orderSearch.addEventListener("input", renderOrders);
orderStatusFilter.addEventListener("change", renderOrders);
userSearch.addEventListener("input", renderUsers);
productSearch.addEventListener("input", renderProducts);

refreshBtn.addEventListener("click", loadAllData);

exportOrdersBtn.addEventListener("click", () => {
    if (ordersData.length === 0) {
        alert("Nenhum pedido para exportar.");
        return;
    }

    const header = ["Cliente", "Email", "Telefone", "Total", "Status", "Data", "Itens"];

    const rows = ordersData.map((order) => {
        return [
            order.customer?.name || "",
            order.customer?.email || "",
            order.customer?.phone || "",
            Number(order.total || 0).toFixed(2),
            order.status || "",
            formatDate(order.createdAt),
            getOrderItemsText(order)
        ];
    });

    const csv = [header, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
        .join("\n");

    const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "pedidos-mistral-line.csv";
    link.click();

    URL.revokeObjectURL(url);
});

logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "/pages/login.html";
});

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "/pages/login.html";
        return;
    }

    if (user.email !== ADMIN_EMAIL) {
        alert("Acesso negado. Apenas o administrador pode entrar.");
        window.location.href = "/pages/home.html";
        return;
    }

    adminEmail.textContent = user.email;
    settingEmail.textContent = user.email;

    await loadAllData();
});