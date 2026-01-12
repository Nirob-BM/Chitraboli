import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NotificationConfig {
  orderId: string;
  customerPhone: string;
  customerName: string;
  riderName: string;
  thresholdKm?: number;
}

export const useDeliveryNotifications = () => {
  const [notificationsSent, setNotificationsSent] = useState<Set<string>>(new Set());
  const lastNotificationTime = useRef<Map<string, number>>(new Map());
  
  // Minimum time between notifications (5 minutes)
  const MIN_NOTIFICATION_INTERVAL = 5 * 60 * 1000;

  const canSendNotification = (orderId: string): boolean => {
    const lastTime = lastNotificationTime.current.get(orderId);
    if (!lastTime) return true;
    return Date.now() - lastTime >= MIN_NOTIFICATION_INTERVAL;
  };

  const sendNearbyNotification = useCallback(
    async (config: NotificationConfig, distanceKm: number, etaMinutes: number) => {
      const { orderId, customerPhone, customerName, riderName } = config;
      const threshold = config.thresholdKm || 0.5;

      // Check if already notified and within cooldown
      if (notificationsSent.has(orderId) || !canSendNotification(orderId)) {
        return { sent: false, reason: "Already notified or cooldown active" };
      }

      // Only send if within threshold
      if (distanceKm > threshold) {
        return { sent: false, reason: "Rider not near enough" };
      }

      try {
        // Prepare notification message in Bangla
        const message = `প্রিয় ${customerName}, আপনার ডেলিভারি রাইডার ${riderName} আপনার কাছে পৌঁছাতে প্রায় ${etaMinutes} মিনিট সময় লাগবে। অনুগ্রহ করে প্রস্তুত থাকুন! - চিত্রাবলী`;

        // Send SMS via edge function
        const { error } = await supabase.functions.invoke("send-order-sms", {
          body: {
            phone: customerPhone,
            message,
            type: "delivery_nearby",
          },
        });

        if (error) {
          console.warn("SMS notification failed:", error);
          // Don't throw - graceful fallback
          toast.info("Rider is nearby!", {
            description: `${riderName} will arrive in about ${etaMinutes} minutes`,
          });
        } else {
          toast.success("Customer notified!", {
            description: `SMS sent to ${customerPhone}`,
          });
        }

        // Mark as sent
        setNotificationsSent((prev) => new Set(prev).add(orderId));
        lastNotificationTime.current.set(orderId, Date.now());

        return { sent: true };
      } catch (err) {
        console.error("Notification error:", err);
        return { sent: false, reason: "Failed to send notification" };
      }
    },
    [notificationsSent]
  );

  const sendArrivedNotification = useCallback(
    async (config: NotificationConfig) => {
      const { orderId, customerPhone, customerName, riderName } = config;
      const arrivedKey = `${orderId}-arrived`;

      if (notificationsSent.has(arrivedKey)) {
        return { sent: false, reason: "Already notified arrival" };
      }

      try {
        const message = `প্রিয় ${customerName}, আপনার ডেলিভারি রাইডার ${riderName} আপনার ঠিকানায় পৌঁছে গেছেন! অনুগ্রহ করে আপনার অর্ডার গ্রহণ করুন। - চিত্রাবলী`;

        const { error } = await supabase.functions.invoke("send-order-sms", {
          body: {
            phone: customerPhone,
            message,
            type: "delivery_arrived",
          },
        });

        if (error) {
          console.warn("Arrival SMS notification failed:", error);
          toast.info("Rider has arrived!", {
            description: "Please receive your order",
          });
        } else {
          toast.success("Customer notified of arrival!");
        }

        setNotificationsSent((prev) => new Set(prev).add(arrivedKey));
        return { sent: true };
      } catch (err) {
        console.error("Arrival notification error:", err);
        return { sent: false, reason: "Failed to send notification" };
      }
    },
    [notificationsSent]
  );

  const resetNotifications = useCallback((orderId?: string) => {
    if (orderId) {
      setNotificationsSent((prev) => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        newSet.delete(`${orderId}-arrived`);
        return newSet;
      });
      lastNotificationTime.current.delete(orderId);
    } else {
      setNotificationsSent(new Set());
      lastNotificationTime.current.clear();
    }
  }, []);

  return {
    sendNearbyNotification,
    sendArrivedNotification,
    resetNotifications,
    notificationsSent,
  };
};
