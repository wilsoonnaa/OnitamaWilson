// frontend/js/register.js
import { register } from './api/auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            await register({
                login: document.getElementById('register-login').value,
                password: document.getElementById('register-password').value
            });
            window.location.href = '../pages/games.html';
            
        } catch (error) {
            alert('Registration failed. Please try again.');
        }
    });
});

// Token verification for register page
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
                window.location.href = './games.html';
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