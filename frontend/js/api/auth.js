// frontend/js/api/auth.js
export const login = async (loginData) => {
    try {
        const response = await fetch('https://se.ifmo.ru/~s341995/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Login failed');
        }
        
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('available_games', JSON.stringify(data.available_games));
        return data;
    } catch (error) {
        throw error;
    }
}

export const register = async (registerData) => {
    try {
        const response = await fetch('https://se.ifmo.ru/~s341995/api/users/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registerData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Registration failed');
        }
        
        return await response.json();
    } catch (error) {
        throw error;
    }
}