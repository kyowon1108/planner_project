import { useAuth } from '../contexts/AuthContext';

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Function[]> = new Map();

  connect(userId: number) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/api/v1/ws';
    
    try {
      this.ws = new WebSocket(`${wsUrl}/${userId}`);
      
      this.ws.onopen = () => {
        console.log('WebSocket 연결됨');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('WebSocket 메시지 파싱 오류:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket 연결 끊어짐');
        this.attemptReconnect(userId);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket 오류:', error);
      };

    } catch (error) {
      console.error('WebSocket 연결 실패:', error);
    }
  }

  private attemptReconnect(userId: number) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`WebSocket 재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.connect(userId);
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('WebSocket 재연결 실패 - 최대 시도 횟수 초과');
    }
  }

  private handleMessage(data: any) {
    const { type, ...payload } = data;
    
    if (this.listeners.has(type)) {
      this.listeners.get(type)?.forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          console.error('WebSocket 리스너 오류:', error);
        }
      });
    }
  }

  addListener(type: string, callback: Function) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)?.push(callback);
  }

  removeListener(type: string, callback: Function) {
    if (this.listeners.has(type)) {
      const callbacks = this.listeners.get(type)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// 싱글톤 인스턴스
export const websocketService = new WebSocketService();

// React Hook
export const useWebSocket = () => {
  const { user } = useAuth();

  const connect = () => {
    if (user?.id) {
      websocketService.connect(user.id);
    }
  };

  const disconnect = () => {
    websocketService.disconnect();
  };

  const addListener = (type: string, callback: Function) => {
    websocketService.addListener(type, callback);
  };

  const removeListener = (type: string, callback: Function) => {
    websocketService.removeListener(type, callback);
  };

  return {
    connect,
    disconnect,
    addListener,
    removeListener,
    isConnected: websocketService.isConnected(),
  };
}; 