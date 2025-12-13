const cron = require('node-cron');
const { Seances, Tickets, Shows } = require("../models/models.js");
const { Op } = require('sequelize');

class NotificationService {
  constructor(wsServer) {
    this.wsServer = wsServer;
    this.sentNotifications = new Set();
    NotificationService.instance = this; // Сохраняем инстанс
  }

  sendCancelNotification(seance, userIds) {
     if (!this.wsServer) {
        console.error('WebSocket server not available!');
        return 0;
    }
    
    if (!seance || !seance.ID || !seance.Show || !seance.Show.Title || !seance.Start_time) {
        console.error('Invalid seance data:', seance);
        return 0;
    }
    const startTime = new Date(seance.Start_time).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
  const messageText = `Приносим извинения, сеанс "${seance.Show.Title}" (${startTime}) отменён.`;
    const now = Date.now();
    let successCount = 0;

    // Отправляем каждому пользователю индивидуальное уведомление
    userIds.forEach(userId => {
      const userNotificationId = `cancel_${seance.ID}_${userId}_${now}`;
      
      if (this.sentNotifications.has(userNotificationId)) {
        console.log(`Notification already sent to user ${userId}`);
        return;
      }

      const result = this.wsServer.sendToUsers(
        [userId],
        'NOTIFICATION',
        {
          id: userNotificationId,
          text: messageText,
          timestamp: new Date().toISOString(),
          type: 'CANCELLATION',
          forUser: userId,
          seanceId: seance.ID // Добавляем ID сеанса для дополнительной проверки
        }
      );

      if (result > 0) {
        successCount++;
        this.sentNotifications.add(userNotificationId);
        console.log(`Sent cancellation to user ${userId}, ID: ${userNotificationId}`);
      }
    });

    console.log(`Total delivered: ${successCount} of ${userIds.length}`);
    return successCount;
};

sendRescheduleNotification(seance, oldStartTime, userIds) {
  const newStartTime = new Date(seance.Start_time).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
  });
  
  const oldTimeFormatted = new Date(oldStartTime).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
  });

  const messageText = `Сеанс "${seance.Show.Title}" перенесён с ${oldTimeFormatted} на ${newStartTime}.`;
  const now = Date.now();
  let successCount = 0;

  userIds.forEach(userId => {
      const userNotificationId = `reschedule_${seance.ID}_${userId}_${now}`;
      
      if (this.sentNotifications.has(userNotificationId)) {
          console.log(`Notification already sent to user ${userId}`);
          return;
      }

      const result = this.wsServer.sendToUsers(
          [userId],
          'NOTIFICATION',
          {
              id: userNotificationId,
              text: messageText,
              timestamp: new Date().toISOString(),
              type: 'RESCHEDULE',
              forUser: userId,
              seanceId: seance.ID,
              newTime: seance.Start_time,
              oldTime: oldStartTime
          }
      );

      if (result > 0) {
          successCount++;
          this.sentNotifications.add(userNotificationId);
          console.log(`Sent reschedule to user ${userId}, ID: ${userNotificationId}`);
      }
  });

  console.log(`Total reschedule notifications delivered: ${successCount} of ${userIds.length}`);
  return successCount;
}

  async checkUpcomingSeances() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      const upcomingSeances = await Seances.findAll({
        where: {
          Start_time: {
            [Op.gte]: tomorrow,
            [Op.lt]: dayAfter
          },
          Status: 'Не проведён'
        },
        include: [{
          model: Shows,
          attributes: ['Title'] 
        }]
      });

      for (const seance of upcomingSeances) {
        if (!seance.ID) continue;

        const notificationKey = `seance_${seance.ID}`;
        
        if (!this.sentNotifications.has(notificationKey)) {
          const bookings = await Tickets.findAll({ 
            where: { 
              Seance_id: seance.ID
            },
            attributes: ['User_id'],
            group: ['User_id'] 
          });
          
          const startTime = new Date(seance.Start_time).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
          });

          const messageText = `Завтра в ${startTime} состоится "${seance.Show.Title}"`;
          
          this.wsServer.broadcastNotification(messageText);
          
          this.sentNotifications.add(notificationKey);
          console.log(`Уведомление отправлено для сеанса ${seance.ID}`);
        }
      }
    } catch (error) {
      console.error('Ошибка в checkUpcomingSeances:', error);
    }
  };

  initScheduler() {
    setInterval(() => this.checkUpcomingSeances(), 12*60*60*5000); 
   
  }
}

module.exports = NotificationService;