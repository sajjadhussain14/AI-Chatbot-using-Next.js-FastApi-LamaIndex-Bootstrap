// src/api/chat_api.js

const endpoint = "http://localhost:8000";

export const fetchResponse = async (query) => {
    const response = await fetch(`${endpoint}/query?query=${encodeURIComponent(query)}`);
    const data = await response.json();
    return data;
};
