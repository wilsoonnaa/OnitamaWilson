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