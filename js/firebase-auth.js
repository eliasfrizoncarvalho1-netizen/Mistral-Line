import { auth, db } from "./firebase-config.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const loginForm = document.querySelector(".login-card");
const registerForm = document.querySelector(".register-card");

const googleLoginBtn = document.getElementById("googleLoginBtn");
const googleRegisterBtn = document.getElementById("googleRegisterBtn");

const googleProvider = new GoogleAuthProvider();

function mostrarErro(mensagem) {
    alert(mensagem);
}

function limparTexto(valor) {
    return valor ? valor.trim() : "";
}

async function salvarUsuarioGoogle(user) {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        await setDoc(userRef, {
            uid: user.uid,
            name: user.displayName || "Cliente Mistral Line",
            email: user.email,
            phone: "",
            provider: "google",
            photoURL: user.photoURL || "",
            createdAt: serverTimestamp()
        });
    }
}

async function entrarComGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        await salvarUsuarioGoogle(user);

        alert("Login com Google realizado com sucesso.");
        window.location.href = "/pages/home.html";

    } catch (error) {
        console.error(error);

        if (error.code === "auth/popup-closed-by-user") {
            mostrarErro("Login cancelado.");
        } else if (error.code === "auth/popup-blocked") {
            mostrarErro("O navegador bloqueou o popup. Libere popup para este site.");
        } else {
            mostrarErro("Erro ao entrar com Google.");
        }
    }
}

if (googleLoginBtn) {
    googleLoginBtn.addEventListener("click", entrarComGoogle);
}

if (googleRegisterBtn) {
    googleRegisterBtn.addEventListener("click", entrarComGoogle);
}

if (registerForm) {
    const registerButton = registerForm.querySelector("button:not(.google-btn)");

    registerButton.addEventListener("click", async () => {
        const name = limparTexto(document.getElementById("name").value);
        const email = limparTexto(document.getElementById("email").value).toLowerCase();
        const phone = limparTexto(document.getElementById("phone").value);
        const password = limparTexto(document.getElementById("password").value);
        const confirmPassword = limparTexto(document.getElementById("confirm-password").value);

        if (!name || !email || !password || !confirmPassword) {
            mostrarErro("Preencha todos os campos obrigatórios.");
            return;
        }

        if (password.length < 6) {
            mostrarErro("A senha precisa ter no mínimo 6 caracteres.");
            return;
        }

        if (password !== confirmPassword) {
            mostrarErro("As senhas não são iguais.");
            return;
        }

        try {
            registerButton.disabled = true;
            registerButton.textContent = "Criando...";

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await updateProfile(user, {
                displayName: name
            });

            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: name,
                email: email,
                phone: phone,
                provider: "email",
                createdAt: serverTimestamp()
            });

            alert("Conta criada com sucesso.");
            window.location.href = "/pages/login.html";

        } catch (error) {
            console.error(error);

            if (error.code === "auth/email-already-in-use") {
                mostrarErro("Esse e-mail já está cadastrado.");
            } else if (error.code === "auth/invalid-email") {
                mostrarErro("E-mail inválido.");
            } else if (error.code === "auth/weak-password") {
                mostrarErro("Senha fraca. Use pelo menos 6 caracteres.");
            } else {
                mostrarErro("Erro ao criar conta.");
            }

            registerButton.disabled = false;
            registerButton.textContent = "Criar conta";
        }
    });
}

if (loginForm) {
    const loginButton = loginForm.querySelector("button:not(.google-btn)");

    loginButton.addEventListener("click", async () => {
        const email = limparTexto(document.getElementById("email").value).toLowerCase();
        const password = limparTexto(document.getElementById("password").value);

        if (!email || !password) {
            mostrarErro("Preencha e-mail e senha.");
            return;
        }

        try {
            loginButton.disabled = true;
            loginButton.textContent = "Entrando...";

            await signInWithEmailAndPassword(auth, email, password);

            alert("Login realizado com sucesso.");
            window.location.href = "/pages/home.html";

        } catch (error) {
            console.error(error);

            if (error.code === "auth/invalid-email") {
                mostrarErro("E-mail inválido.");
            } else if (
                error.code === "auth/user-not-found" ||
                error.code === "auth/wrong-password" ||
                error.code === "auth/invalid-credential"
            ) {
                mostrarErro("E-mail ou senha incorretos.");
            } else {
                mostrarErro("Erro ao fazer login.");
            }

            loginButton.disabled = false;
            loginButton.textContent = "Entrar";
        }
    });
}