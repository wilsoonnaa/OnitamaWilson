// frontend/js/login.js
import { login } from './api/auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await login({
                    login: document.getElementById('login').value,
                    password: document.getElementById('password').value
                });
                window.location.href = './pages/games.html';
            } catch (error) {
                alert('Login failed. Please try again.');
            }
        });
    }
});