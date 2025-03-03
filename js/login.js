        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
        import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
        import {firebaseConfig} from './firebase-config.js';
    
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);

        document.getElementById("loginButton").addEventListener("click", async () => {
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            const errorMessage = document.getElementById("errorMessage");
            const spinner = document.getElementById("loadingSpinner");

            // Limpa a mensagem de erro
            errorMessage.textContent = "";

            if (!email || !password) {
                errorMessage.textContent = "Preencha todos os campos!";
                return;
            }

            // Mostrar spinner e desativar botão
            spinner.style.display = "inline-block";
            document.getElementById("loginButton").disabled = true;

            try {
                await signInWithEmailAndPassword(auth, email, password);
                sessionStorage.setItem("loggedIn", "true");
                window.location.href = "html/comunity.html";
            } catch (error) {
                console.error("Erro no login:", error.code, error.message);
                errorMessage.textContent = "Erro: " + error.message;
            }

            // Ocultar spinner e reativar botão após o login
            spinner.style.display = "none";
            document.getElementById("loginButton").disabled = false;
        });