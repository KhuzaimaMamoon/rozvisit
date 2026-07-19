export function assertNotificationChannel(channel) {
  if (typeof channel.send !== 'function') {
    throw new TypeError('NotificationChannel must provide send(message).');
  }

  return channel;
}
