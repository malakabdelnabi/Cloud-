import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications appear when app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationService = {
  // Request permission from the user
  async requestPermissions() {
    if (Platform.OS === 'web') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  },

  // Send an in-app notification
  async sendLocalNotification(title: string, body: string) {
    if (Platform.OS === 'web') {
      // Use browser notifications on web
      if ('Notification' in window) {
        const permission = await window.Notification.requestPermission();
        if (permission === 'granted') {
          new window.Notification(title, { body });
        }
      }
      return;
    }
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: null, // Send immediately
    });
  },

  // Notification presets for issues
  async notifyIssueSubmitted(issueTitle: string) {
    await this.sendLocalNotification(
      '✅ Issue Submitted',
      `Your issue "${issueTitle}" has been submitted successfully and is now Pending review.`
    );
  },

  async notifyIssueStatusChanged(issueTitle: string, newStatus: string) {
    await this.sendLocalNotification(
      '🔔 Issue Status Updated',
      `Your issue "${issueTitle}" is now ${newStatus}.`
    );
  },
};