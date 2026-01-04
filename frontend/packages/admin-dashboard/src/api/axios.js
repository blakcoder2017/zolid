import axios from 'axios';

// Create Axios Instance
const api = axios.create({
    baseURL: 'http://localhost:8000/api/v1/admin', // Points to Admin Routes
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor: Attach Token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor: Handle 401 (Unauthorized) -> Auto Logout
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;