import { db, isFirebaseConfigured } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

interface NtfyPayload {
  title: string;
  message: string;
  priority?: "min" | "low" | "default" | "high" | "urgent";
  tags?: string;
}

export async function sendNtfyNotification({ title, message, priority = "default", tags }: NtfyPayload) {
  try {
    let topic = "thakur_yograj_alerts";

    // Try to get dynamic topic from Firebase storeSettings
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(doc(db, "config", "storeSettings"));
        const data = snap.exists() ? snap.data() : null;
        if (data && data.ntfyTopic) {
          topic = data.ntfyTopic.trim();
        }
      } catch (err) {
        console.warn("[Ntfy] Failed to read store settings from Firestore:", err);
      }
    }

    // Fallback to env variable if present
    const envTopic = (import.meta as any).env?.VITE_NTFY_TOPIC || (process as any).env?.VITE_NTFY_TOPIC;
    if (envTopic) {
      topic = envTopic.trim();
    }

    if (!topic) {
      console.warn("[Ntfy] No topic name configured, skipping notification.");
      return;
    }

    console.log(`[Ntfy] Sending push notification to topic: "${topic}"...`);

    const urlParams = new URLSearchParams();
    urlParams.set("title", title);
    urlParams.set("priority", priority);
    if (tags) {
      urlParams.set("tags", tags);
    }

    const response = await fetch(`https://ntfy.sh/${topic}?${urlParams.toString()}`, {
      method: "POST",
      body: message,
    });

    if (!response.ok) {
      console.error("[Ntfy] Failed to send notification:", response.statusText);
    } else {
      console.log("[Ntfy] Notification sent successfully!");
    }
  } catch (error) {
    console.error("[Ntfy] Error in sendNtfyNotification:", error);
  }
}
