import { useEffect, useRef, useState, useCallback } from "react";

export function useWebSocket(url) {
  const ws = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);

  // Connect WebSocket
  const connect = useCallback(() => {
    if (ws.current) {
      ws.current.close();
    }

    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      setIsConnected(true);
      setError(null);
      console.log("WebSocket connected");
    };

    ws.current.onmessage = (event) => {
      setLastMessage(event.data);
    };

    ws.current.onerror = (err) => {
      setError(err);
      console.error("WebSocket error", err);
    };

    ws.current.onclose = () => {
      setIsConnected(false);
      console.log("WebSocket disconnected");
    };
  }, [url]);

  // Send message
  const sendMessage = useCallback((message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(message);
    } else {
      console.warn(
        "WebSocket is not open. ReadyState:",
        ws.current?.readyState
      );
    }
  }, []);

  // Close socket manually if needed
  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close();
    }
  }, []);

  // Auto-connect on mount, disconnect on unmount or url change
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { isConnected, lastMessage, sendMessage, disconnect, error };
}

/*
import React, { useEffect } from 'react';
import { useWebSocket } from './useWebSocket';

function MyWebSocketComponent() {
  const { isConnected, lastMessage, sendMessage, error } = useWebSocket('wss://example.com/socket');

  useEffect(() => {
    if (lastMessage) {
      console.log('New message:', lastMessage);
    }
  }, [lastMessage]);

  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      {error && <p>Error: {error.message}</p>}
      <button onClick={() => sendMessage('Hello Server!')} disabled={!isConnected}>
        Send Message
      </button>
      <p>Last message: {lastMessage}</p>
    </div>
  );
}

export default MyWebSocketComponent;

*/
