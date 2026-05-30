const API_BASE_AUTH = 'http://127.0.0.1:8081/api/auth';
const API_BASE_DJANGO = 'http://127.0.0.1:8000';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const authService = {
    login: async (username, password) => {
        const response = await fetch(`${API_BASE_AUTH}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!response.ok) throw new Error('Login failed');
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        return data;
    },
    register: async (userData) => {
        const response = await fetch(`${API_BASE_AUTH}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        if (!response.ok) throw new Error('Registration failed');
        return response.text();
    },
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
    },
    isAuthenticated: () => !!localStorage.getItem('token')
};

export const productService = {
    analyzeLink: async (url) => {
        const response = await fetch(`${API_BASE_DJANGO}/analyze/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ url })
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Analysis failed');
        }
        return response.json();
    },
    searchProducts: async (query, userId = "guest") => {
        const response = await fetch(`${API_BASE_DJANGO}/search/?q=${query}&user_id=${userId}`);
        const data = await response.json();
        return { products: data.products || [] };
    },
    getProductsByCategory: async (category) => {
        const response = await fetch(`${API_BASE_DJANGO}/products/category/?category=${category}`);
        const data = await response.json();
        return { products: data.products || [] };
    }
};
