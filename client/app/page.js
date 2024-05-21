"use client"
// src/Chatbot.js
import React, { useState, useEffect, useRef } from 'react';
import { fetchResponse } from '../app/api/chat_api';

const Chatbot = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const chatMessagesRef = useRef(null);

  useEffect(() => {
      const setInitialChatHeight = () => {
          if (chatMessagesRef.current) {
              chatMessagesRef.current.style.height = `${window.innerHeight - 200}px`; // Adjust as needed
          }
      };
      setInitialChatHeight();
      window.addEventListener('resize', setInitialChatHeight);
      return () => window.removeEventListener('resize', setInitialChatHeight);
  }, []);

  useEffect(() => {
      if (chatMessagesRef.current) {
          // Scroll to the bottom of the chat container
          chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
      }
  }, [messages]);

  const sendMessage = async () => {
      const query = inputValue.trim();
      if (!query) return;

      addMessage(`You: ${query}`, 'sent');
      setInputValue('');

      addMessage('Agent is typing', 'received');

      try {
          await new Promise(resolve => setTimeout(resolve, 1000));

          const data = await fetchResponse(query);

          setMessages(prevMessages => prevMessages.slice(0, -1)); // Remove typing indicator

          if (data.results === "Empty Response") {
              data.results = "Data for ingestion is missing. Please proceed to the admin page to upload your knowledge base or enable the AI agent to provide responses!";
          }

          addMessage(`Agent: ${data.results}`, 'received');
      } catch (error) {
          addMessage('Failed to get response', 'received');
      }
  };

  const addMessage = (text, type) => {
      const newMessage = {
          text: text,
          type: type,
          timestamp: getCurrentTime()
      };

      if (text.includes('Agent is typing')) {
          const spinnerElement = (
              <button className="btn border-0 outline-0 border-none" type="button" disabled>
                  Agent is typing 
                  <span className="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>
              </button>
          );
          newMessage.text = spinnerElement;
      }

      setMessages(prevMessages => [...prevMessages, newMessage]);
  };

  const getCurrentTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
  };

  const handleInputChange = (event) => {
      setInputValue(event.target.value);
  };

  const handleInputKeyPress = async (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          sendMessage();
      }
  };

  const handleMinimize = () => {
      setIsMinimized(true);
  };

  const handleMaximize = () => {
      setIsMinimized(false);
  };

  const handleClose = () => {
    const chatContainer = document.querySelector(".chat-container");
    if (chatContainer) {
        chatContainer.remove();
    }
};

  return (
      <div className="container chat-container" style={{ width: isMinimized ? 'auto' : '500px', top: isMinimized ? 'auto' : '20px', right:  '20px'  }}>
          <div className="chat-header">
              <h4>Live Chat</h4>
              <div className="chat-controls">
                  <button className="btn btn-primary" onClick={handleMinimize} style={{ display: isMinimized ? 'none' : 'inline-block' }}><i className="fas fa-minus"></i></button>
                  <button className="btn btn-primary" onClick={handleMaximize} style={{ display: isMinimized ? 'inline-block' : 'none' }}><i className="fas fa-expand"></i></button>
                  <button className="btn btn-primary" onClick={handleClose}><i className="fas fa-times"></i></button>
              </div>
          </div>
          <div className={`chat-content ${isMinimized ? 'minimized' : ''}`}>
              <div className="chat-messages" ref={chatMessagesRef}>
                  {messages.map((message, index) => (
                      <div className={`message ${message.type}`} key={index}>
                          {typeof message.text === 'string' ? <p>{message.text}</p> : message.text} {/* Render HTML elements directly */}
                          <p className="timestamp">{message.timestamp}</p>
                      </div>
                  ))}
              </div>
              {!isMinimized && (
                  <div className="chat-input">
                      <textarea className="form-control" placeholder="Type your message here..." value={inputValue} onChange={handleInputChange} onKeyPress={handleInputKeyPress}></textarea>
<button className="btn btn-primary" onClick={sendMessage}><i className="fas fa-paper-plane"></i></button>
</div>
)}
</div>
</div>
);
};

export default Chatbot;






