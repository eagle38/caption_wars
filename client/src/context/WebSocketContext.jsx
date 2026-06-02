import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

const WebSocketContext = createContext(null);

const WS_URL = import.meta.env.VITE_WS_URL || `ws://${window.location.hostname}:8080`;

export function WebSocketProvider({ children }) {
  const wsRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const listenersRef = useRef({});

  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => setIsConnected(true);
      ws.onclose = () => {
        setIsConnected(false);
        // Auto-reconnect after 2s
        setTimeout(connect, 2000);
      };
      ws.onmessage = (event) => {
        let msg;
        try { msg = JSON.parse(event.data); } catch { return; }
        const handlers = listenersRef.current[msg.type] || [];
        handlers.forEach((fn) => fn(msg.payload));
      };
    };

    connect();
    return () => wsRef.current?.close();
  }, []);

  const send = useCallback((type, payload = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  const subscribe = useCallback((type, callback) => {
    if (!listenersRef.current[type]) listenersRef.current[type] = [];
    listenersRef.current[type].push(callback);
    return () => {
      listenersRef.current[type] = listenersRef.current[type].filter(fn => fn !== callback);
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ send, subscribe, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWS() { return useContext(WebSocketContext); }