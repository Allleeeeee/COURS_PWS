// services/PoiskkinoService.js
const axios = require('axios');

class PoiskKinoService {
    static apiKey = process.env.POISKKINO_API_KEY;
    static baseURL = 'https://api.poiskkino.dev/v1.4'; 
    
    static client = axios.create({
        baseURL: this.baseURL,
        headers: {
            'X-API-KEY': this.apiKey, 
            'Content-Type': 'application/json'
        }
    });

    static async searchPersons(query, page = 1, limit = 20) {
        try {
            const response = await this.client.get('/person/search', {
                params: { query, page, limit }
            });
            return response.data;
        } catch (error) {
            console.error('Error searching persons:', error.response?.data || error.message);
            throw error;
        }
    }

    static async getPersonDetails(personId) {
        try {
            console.log('API Key:', this.apiKey); // Добавь эту строку
            console.log('Request URL:', `/person/${personId}`);
            const response = await this.client.get(`/person/${personId}`);
            return response.data;
        } catch (error) {
            console.error('Error getting person details:', error.response?.data || error.message);
            throw error;
        }
    }

    static async searchMovies(query, page = 1, limit = 20) {
        try {
            const response = await this.client.get('/movie/search', {
                params: { query, page, limit }
            });
            return response.data;
        } catch (error) {
            console.error('Error searching movies:', error.response?.data || error.message);
            throw error;
        }
    }

    static async getMovieDetails(movieId) {
        try {
            const response = await this.client.get(`/movie/${movieId}`);
            return response.data;
        } catch (error) {
            console.error('Error getting movie details:', error.response?.data || error.message);
            throw error;
        }
    }

    static async getMovieCast(movieId) {
        try {
            const response = await this.client.get(`/movie/${movieId}/cast`);
            return response.data;
        } catch (error) {
            console.error('Error getting movie cast:', error.response?.data || error.message);
            throw error;
        }
    }
}

module.exports = PoiskKinoService;