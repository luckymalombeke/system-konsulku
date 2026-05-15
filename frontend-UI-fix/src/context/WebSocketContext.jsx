import React, { createContext, useContext, useEffect, useState } from 'react';
import { WS_BASE_URL } from '../api';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Buka koneksi WebSocket ke Backend
    // Kita kirim token lewat protokol websocket (biasanya via subprotocol atau query)
    // Di sini kita gunakan query param agar simpel
    const ws = new WebSocket(`${WS_BASE_URL}/api/ws?token=${token}`);

    ws.onopen = () => {
      console.log('✅ WebSocket Connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('📩 New Message from Server:', data);
      setLastMessage(data);
      
      // Trigger event custom agar bisa didengar komponen lain
      const customEvent = new CustomEvent('wsMessage', { detail: data });
      window.dispatchEvent(customEvent);
    };

    ws.onclose = () => {
      console.log('❌ WebSocket Disconnected');
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ socket, lastMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
