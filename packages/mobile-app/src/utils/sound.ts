// Web Audio API Chime & Beep Synthesizer for Lock Screen & In-App Alerts
// Operates 100% offline with zero external audio assets required

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Play a pleasant two-tone school notification chime
 */
export function playNotificationSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // First harmonic tone (High E - 659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second harmonic tone (A - 880 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.2, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch (err) {
    console.warn('Unable to play notification chime:', err);
  }
}

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * Request Notification permission and configure background/lock screen handling.
 * Supports both Native Android (via Capacitor) and Web/PWA browsers.
 */
export async function requestAppNotificationPermission(): Promise<NotificationPermission> {
  // 1. Native Android APK via Capacitor
  if (Capacitor.isNativePlatform()) {
    try {
      const check = await LocalNotifications.checkPermissions();
      if (check.display === 'granted') {
        return 'granted';
      }
      const requested = await LocalNotifications.requestPermissions();
      if (requested.display === 'granted') {
        try {
          await LocalNotifications.createChannel({
            id: 'mitra_alerts_channel',
            name: 'School Alerts & Notices',
            description: 'Institutional alerts, attendance, and homework notifications with audio chime',
            importance: 5,
            visibility: 1,
            vibration: true,
            lights: true,
            lightColor: '#7c3aed',
          });
        } catch {}
        playNotificationSound();
        return 'granted';
      }
      return requested.display === 'denied' ? 'denied' : 'default';
    } catch (err) {
      console.warn('Native Capacitor notification permission error:', err);
    }
  }

  // 2. Standard Web / PWA browser fallback
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  try {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      playNotificationSound();
    }
    return perm;
  } catch {
    return Notification.permission;
  }
}

/**
 * Trigger an OS / Lock Screen Notification with sound and vibration
 */
export async function showSystemNotification(title: string, body: string, icon?: string): Promise<void> {
  playNotificationSound();

  // 1. Native Android APK via Capacitor
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Math.random() * 1000000) + 1,
            title,
            body,
            schedule: { at: new Date(Date.now() + 100) },
            channelId: 'mitra_alerts_channel',
            sound: undefined,
            smallIcon: 'ic_launcher',
          },
        ],
      });
      return;
    } catch (err) {
      console.warn('Capacitor LocalNotifications schedule error:', err);
    }
  }

  // 2. Standard Web / Browser Fallback
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    const options: NotificationOptions = {
      body,
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200, 100, 250],
      tag: `anvimitra-${Date.now()}`,
      requireInteraction: false,
    };

    // If Service Worker is active, use showNotification so it shows on Android lock screen
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, options).catch(() => {
          new Notification(title, options);
        });
      }).catch(() => {
        new Notification(title, options);
      });
    } else {
      new Notification(title, options);
    }
  }
}
