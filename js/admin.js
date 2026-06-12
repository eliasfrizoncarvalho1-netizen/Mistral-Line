import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const ADMIN_EMAIL = "eliasfrizoncarvalho1@gmail.com";

const adminEmail = document.getElementById("adminEmail");
const logoutBtn = document.getElementById("logoutBtn");
const refreshBtn = document.getElementById("refreshBtn");

const totalOrders = document.getElementById("totalOrders");
const totalUsers = document.getElementById("totalUsers");
const totalRevenue = document.getElementById("totalRevenue");
const ordersTable = document.getElementById("ordersTable");

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

async function loadAdminData() {
    ordersTable.innerHTML = `
        <tr>
            <td colspan="5">Carregando pedidos...</td>
        </tr>
    `;

    const ordersRef = collection(db, "orders");
    const ordersQuery = query(ordersRef, orderBy("createdAt", "desc"));
    const ordersSnapshot = await getDocs(ordersQuery);

    let ordersCount = 0;
    let revenue = 0;
    let html = "";

    ordersSnapshot.forEach((doc) => {
        const order = doc.data();

        ordersCount++;
        revenue += Number(order.total || 0);

        html += `
            <tr>
                <td>${order.customer?.name || "Sem nome"}</td>
                <td>${order.customer?.phone || "Sem telefone"}</td>
                <td>${formatMoney(order.total)}</td>
                <td><span class="status">${order.status || "novo"}</span></td>
                <td>${formatDate(order.createdAt)}</td>
            </tr>
        `;
    });

    if (!html) {
        html = `
            <tr>
                <td colspan="5">Nenhum pedido encontrado.</td>
            </tr>
        `;
    }

    ordersTable.innerHTML = html;
    totalOrders.textContent = ordersCount;
    totalRevenue.textContent = formatMoney(revenue);

    const usersSnapshot = await getDocs(collection(db, "users"));
    totalUsers.textContent = usersSnapshot.size;
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "/pages/login.html";
        return;
    }

    if (user.email !== ADMIN_EMAIL) {
        alert("Acesso negado. Essa área é apenas para o administrador.");
        window.location.href = "/pages/home.html";
        return;
    }

    adminEmail.textContent = user.email;

    try {
        await loadAdminData();
    } catch (error) {
        console.error(error);
        ordersTable.innerHTML = `
            <tr>
                <td colspan="5">Erro ao carregar dados.</td>
            </tr>
        `;
    }
});

logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "/pages/login.html";
});

refreshBtn.addEventListener("click", async () => {
    await loadAdminData();
});