import { useEffect, useState, useCallback, useRef, useContext } from 'react';
import { Context } from '../../..';

export function useWebSocket() {
  const { store } = useContext(Context);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const receivedMessages = useRef(new Set());
  const userId = store.user.id;

  const connectWebSocket = useCallback(() => {
    const newSocket = new WebSocket('ws://localhost:5000');

    newSocket.onopen = () => {
      console.log('WebSocket connected, readyState:', newSocket.readyState);
      if (userId) {
        const registerMsg = JSON.stringify({
          type: 'REGISTER',
          userId: userId
        });
        console.log('Sending registration:', registerMsg);
        newSocket.send(registerMsg);
      }
    };

    newSocket.onmessage = async (event) => {
      try {
        // Усиленная проверка входящих данных
        if (!event.data || typeof event.data !== 'string') {
          console.warn('Received non-string message, ignoring');
          return;
        }
    
        const trimmedData = event.data.trim();
        if (!trimmedData) {
          console.warn('Received empty message, ignoring');
          return;
        }
    
        let message;
        try {
          message = JSON.parse(trimmedData);
        } catch (parseError) {
          console.error('Failed to parse WebSocket message:', {
            rawData: event.data,
            error: parseError.message
          });
          return;
        }
    
        // Добавляем проверку структуры сообщения
        if (!message || !message.type) {
          console.warn('Malformed message structure:', message);
          return;
        }
        
        if (message.type === 'NOTIFICATION') {
          // Жёсткая проверка получателя
          if (message.data.forUser && message.data.forUser !== userId) {
            console.log(`Blocked notification for user ${message.data.forUser} (current user ${userId})`);
            return;
          }
          
          // Дополнительная проверка на тип и сеанс
          if (message.data.type === 'CANCELLATION'  || message.data.type === 'RESCHEDULE') {
            console.log(message.data.type);
            console.log(userId, message.data.seanceId);
            if (!store.userHasTicketForSeance(userId, message.data.seanceId)) {
              console.log(`User ${userId} has no ticket for seance ${message.data.seanceId}`);
              return;
            }
          }
    
          const notificationId = `${message.data.id}_${userId}`;
          
          if (!receivedMessages.current.has(notificationId)) {
            receivedMessages.current.add(notificationId);
            
            const newNotification = {
              id: notificationId,
              message: message.data.text,
              read: false,
              timestamp: message.data.timestamp,
              type: message.data.type,
              seanceId: message.data.seanceId,
              oldTime: message.data.oldTime,
            newTime: message.data.newTime
            };
    
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            const getSavedNotifications = () => {
              try {
                const item = localStorage.getItem(`notifications_${userId}`);
                return item ? JSON.parse(item) : [];
              } catch (e) {
                console.error('Failed to read notifications from localStorage:', e);
                return [];
              }
            };
            
            const saved = getSavedNotifications();

            // const saved = JSON.parse(localStorage.getItem(`notifications_${userId}`) || []);
             localStorage.setItem(`notifications_${userId}`, JSON.stringify([newNotification, ...saved]));
          }
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    };

    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    newSocket.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      setSocket(null);
      // Переподключаемся через 5 секунд
      setTimeout(connectWebSocket, 5000);
    };

    return newSocket;
  }, [userId]);

  // Подключаемся при монтировании
  useEffect(() => {
    const ws = connectWebSocket();
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [connectWebSocket]);

  // Загружаем сохраненные уведомления
  useEffect(() => {
    // Загружаем только уведомления для текущего пользователя
    const saved = JSON.parse(localStorage.getItem(`notifications_${userId}`) || '[]')
      .filter(n => {
        // Для уведомлений об отмене проверяем наличие билета
        if (n.type === 'CANCELLATION' || n.type === 'RESCHEDULE') {
          return store.userHasTicketForSeance(userId, n.seanceId);
        }
        return true;
      });
      
    receivedMessages.current = new Set(saved.map(n => n.id));
    setNotifications(saved);
    setUnreadCount(saved.filter(n => !n.read).length);
  }, [userId]);


  const markAsRead = (id) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      // Сохраняем обновленные уведомления
      localStorage.setItem(`notifications_${userId}`, JSON.stringify(updated));
      return updated;
    });
    
    setUnreadCount(prev => {
      const newCount = Math.max(0, prev - 1);
      return newCount;
    });
  };

  const clearAllNotifications = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem(`notifications_${userId}`, JSON.stringify(updated));
      return updated;
    });
    setUnreadCount(0);
  };

  const deleteNotification = (id) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      localStorage.setItem(`notifications_${userId}`, JSON.stringify(updated));
      return updated;
    });
    
    setUnreadCount(prev => {
      const notification = notifications.find(n => n.id === id);
      return notification && !notification.read ? Math.max(0, prev - 1) : prev;
    });
  };
  
  const deleteAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem(`notifications_${userId}`);
  };

  return { 
    notifications, 
    unreadCount, 
    markAsRead, 
    clearAllNotifications, 
    deleteNotification, 
    deleteAllNotifications 
  };
}