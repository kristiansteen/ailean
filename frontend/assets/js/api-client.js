/**
 * vimpl API Client
 * Handles all communication with the backend API.
 * Set BACKEND_URL to your deployed backend URL (Railway, etc.)
 */

const BACKEND_URL = 'https://backend-eight-rho-46.vercel.app';

class ApiClient {
    constructor(baseURL) {
        if (baseURL) {
            this.baseURL = baseURL;
        } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            this.baseURL = 'http://localhost:3001/api/v1';
        } else {
            this.baseURL = `${BACKEND_URL}/api/v1`;
        }
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = { 'Content-Type': 'application/json', ...options.headers };

        const token = this.getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;

        try {
            const response = await fetch(url, { ...options, headers });
            const data = await response.json();

            if (!response.ok) {
                throw new ApiError(data.message || 'Request failed', response.status, data);
            }

            if (data.accessToken) this.setToken(data.accessToken);

            return data;
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(error.message || 'Network Error', 500, error);
        }
    }

    // Auth
    async register(email, password, name) {
        return this.request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) });
    }

    async login(email, password) {
        return this.request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    }

    async logout() {
        this.clearToken();
        return Promise.resolve({ message: 'Logged out' });
    }

    async getCurrentUser() {
        return this.request('/auth/me');
    }

    // Boards
    async getBoards() {
        return this.request('/boards');
    }

    async getBoard(boardId) {
        return this.request(`/boards/${boardId}`);
    }

    async createBoard(title, description = '', gridData = null) {
        return this.request('/boards', { method: 'POST', body: JSON.stringify({ title, description, gridData }) });
    }

    async updateBoard(boardId, data) {
        return this.request(`/boards/${boardId}`, { method: 'PUT', body: JSON.stringify(data) });
    }

    async deleteBoard(boardId) {
        return this.request(`/boards/${boardId}`, { method: 'DELETE' });
    }

    async shareBoard(boardId, email) {
        return this.request(`/boards/${boardId}/share`, { method: 'POST', body: JSON.stringify({ email }) });
    }

    // Sections
    async createSection(boardId, sectionData) {
        return this.request(`/boards/${boardId}/sections`, { method: 'POST', body: JSON.stringify(sectionData) });
    }

    async updateSection(boardId, sectionId, data) {
        return this.request(`/boards/${boardId}/sections/${sectionId}`, { method: 'PUT', body: JSON.stringify(data) });
    }

    async deleteSection(boardId, sectionId) {
        return this.request(`/boards/${boardId}/sections/${sectionId}`, { method: 'DELETE' });
    }

    // Post-its
    async createPostit(boardId, postitData) {
        return this.request(`/boards/${boardId}/postits`, { method: 'POST', body: JSON.stringify(postitData) });
    }

    async updatePostit(boardId, postitId, data) {
        return this.request(`/boards/${boardId}/postits/${postitId}`, { method: 'PUT', body: JSON.stringify(data) });
    }

    async deletePostit(boardId, postitId) {
        return this.request(`/boards/${boardId}/postits/${postitId}`, { method: 'DELETE' });
    }

    // Token management
    getToken() { return localStorage.getItem('accessToken'); }
    setToken(token) { localStorage.setItem('accessToken', token); }
    clearToken() { localStorage.removeItem('accessToken'); }
    isAuthenticated() { return !!this.getToken(); }

    getUserIdFromToken() {
        const token = this.getToken();
        if (!token) return null;
        try {
            const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(decodeURIComponent(atob(base64).split('').map(c =>
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join('')));
            return payload.id || payload.userId || null;
        } catch {
            return null;
        }
    }
}

class ApiError extends Error {
    constructor(message, status, data = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ApiClient, ApiError };
}
