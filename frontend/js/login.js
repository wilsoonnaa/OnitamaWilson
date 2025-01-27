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

// Token verification for index page
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    
    if (token) {
        try {
            const response = await fetch('https://se.ifmo.ru/~s341995/api/users/verify-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: token
                })
            });
            
            const data = await response.json();
            
            if (data.status === 'valid') {
                window.location.href = './pages/games.html';
                return;
            }
            
            // Clear invalid token
            localStorage.removeItem('token');
        } catch (error) {
            console.error('Token verification error:', error);
            localStorage.removeItem('token');
        }
    }
});