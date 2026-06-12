const navToggle = document.getElementById("navToggle");
const menu = document.getElementById("menu");
const links = document.querySelectorAll("#menu a");

function abrirMenu() {
    menu.classList.add("active");
    navToggle.classList.add("active");
    document.body.style.overflow = "hidden";
}

function fecharMenu() {
    menu.classList.remove("active");
    navToggle.classList.remove("active");
    document.body.style.overflow = "";
}

function alternarMenu() {
    if (menu.classList.contains("active")) {
        fecharMenu();
    } else {
        abrirMenu();
    }
}

navToggle.addEventListener("click", alternarMenu);

links.forEach((link) => {
    link.addEventListener("click", fecharMenu);
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        fecharMenu();
    }
});

window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
        fecharMenu();
    }
});