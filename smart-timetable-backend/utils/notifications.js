import fetch from "node-fetch";

export async function sendExpoPush(pushToken, title, message) {
  if (!pushToken) return;
  const body = {
    to: pushToken,
    title,
    body: message,
  };
  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
