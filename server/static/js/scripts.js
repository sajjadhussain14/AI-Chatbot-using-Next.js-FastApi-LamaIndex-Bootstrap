document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const input = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');

    const setInitialChatHeight = () => {
        chatMessages.style.height = `${window.innerHeight - 200}px`; // Adjust as needed
    };

    const sendMessage = async () => {
        const query = input.value.trim();
        if (!query) return;

        addMessage('You: ' + query, 'sent');
        input.value = '';

        addMessage(`
            <button class="btn border-0 outline-0 border-none" type="button" disabled>
                Agent is typing 
                <span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>
            </button>
        `, 'received');

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const response = await fetch(`/query?query=${encodeURIComponent(query)}`);
            const data = await response.json();

            chatMessages.removeChild(chatMessages.lastChild);



            if (data.results === "Empty Response") {
                data.results = "Data for ingestion is missing. Please proceed to the admin page to upload your knowledge base or enable the AI agent to provide responses!";
            }

            addMessage('Agent: ' + data.results, 'received');
        } catch (error) {
            addMessage('Failed to get response', 'received');
        }
    };

    input.addEventListener('keypress', async (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    sendButton.addEventListener('click', async () => {
        sendMessage();
    });

    const addMessage = (text, type) => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', type);
        messageDiv.innerHTML = `<p>${text}</p><p class="timestamp">${getCurrentTime()}</p>`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const getCurrentTime = () => {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    setInitialChatHeight();
});
