const WebSocket = require('ws');

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ noServer: true });
    this.userConnections = new Map(); // { userId: WebSocket }
    this.messageQueue = new Map();   // { userId: Array<message> }
    this.initialize(server);
  }

  initialize(server) {
    server.on('upgrade', (request, socket, head) => {
      console.log('[WS] New connection attempt');
      this.wss.handleUpgrade(request, socket, head, (ws) => {
        this.wss.emit('connection', ws, request);
      });
    });

    this.wss.on('connection', (ws, request) => {
      this.handleConnection(ws, request);
    });
  }

  handleConnection(ws, request) {
    console.log('[WS] Connection established');
    
    // Heartbeat для проверки соединения
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data);
        if (msg.type === 'REGISTER' && msg.userId) {
          this.registerUser(ws, msg.userId);
        }
      } catch (e) {
        console.error('[WS] Message parse error:', e);
      }
    });

    ws.on('close', () => this.handleDisconnect(ws));
    ws.on('error', (err) => this.handleError(ws, err));

    // Отправляем подтверждение подключения
    this.sendToClient(ws, 'CONNECTION_ESTABLISHED', {
      message: 'WebSocket connection successful',
      time: new Date().toISOString()
    });
  }

  registerUser(ws, userId) {
    // Закрываем предыдущее соединение если есть
    if (this.userConnections.has(userId)) {
      this.userConnections.get(userId).close();
    }

    this.userConnections.set(userId, ws);
    ws.userId = userId;
    console.log(`[WS] User ${userId} registered`);

    // Отправляем все сообщения из очереди
    this.processQueue(userId);
  }

  processQueue(userId) {
    if (this.messageQueue.has(userId)) {
      const ws = this.userConnections.get(userId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        const messages = this.messageQueue.get(userId);
        messages.forEach(msg => {
          this.sendToClient(ws, msg.type, msg.data);
        });
        this.messageQueue.delete(userId);
      }
    }
  }

  handleDisconnect(ws) {
    console.log(`[WS] Connection closed for user ${ws.userId}`);
    if (ws.userId) {
      this.userConnections.delete(ws.userId);
    }
  }

  handleError(ws, err) {
    console.error(`[WS] Error for user ${ws.userId}:`, err);
    this.handleDisconnect(ws);
  }

  sendToClient(ws, type, data) {
    if (ws?.readyState === WebSocket.OPEN) {
      try {
        const message = JSON.stringify({ type, data });
        ws.send(message);
        return true;
      } catch (error) {
        console.error(`[WS] Send error to ${ws.userId}:`, error);
        return false;
      }
    }
    return false;
  }

  sendToUser(userId, type, data) {
    const ws = this.userConnections.get(userId);
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      return this.sendToClient(ws, type, data);
    } else {
      // Сохраняем в очередь если пользователь не подключен
      if (!this.messageQueue.has(userId)) {
        this.messageQueue.set(userId, []);
      }
      this.messageQueue.get(userId).push({ type, data });
      console.log(`[WS] Message queued for user ${userId}`);
      return false;
    }
  }

  sendToUsers(userIds, type, data) {
    let successCount = 0;
    userIds.forEach(userId => {
      if (this.sendToUser(userId, type, data)) {
        successCount++;
      }
    });
    return successCount;
  }

  // Ping-проверка активных соединений
  startHeartbeat(interval = 30000) {
    setInterval(() => {
      this.userConnections.forEach((ws, userId) => {
        if (ws.isAlive === false) {
          console.log(`[WS] Terminating dead connection for ${userId}`);
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping(null, false, (err) => {
          if (err) console.error(`[WS] Ping error for ${userId}:`, err);
        });
      });
    }, interval);
  }
}

module.exports = WebSocketServer;