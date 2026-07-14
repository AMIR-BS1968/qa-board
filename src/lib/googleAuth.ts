import { prisma } from "./prisma";

export async function getAccessTokenForUser(userId: string): Promise<string> {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: "google",
    },
  });

  if (!account || !account.access_token) {
    throw new Error("No Google account linked or access token found for user");
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const expiresAt = account.expires_at ?? 0;

  // Refresh if token is expired or expires in the next 2 minutes
  if (expiresAt - nowSeconds < 120) {
    if (!account.refresh_token) {
      console.warn(`Access token for user ${userId} is expired and no refresh token is available.`);
      return account.access_token;
    }

    try {
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID || "",
          client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
          grant_type: "refresh_token",
          refresh_token: account.refresh_token,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error_description || data.error || "Failed to refresh token");
      }

      const updatedAccessToken = data.access_token;
      const updatedExpiresAt = Math.floor(Date.now() / 1000) + data.expires_in;
      const updatedRefreshToken = data.refresh_token || account.refresh_token;

      await prisma.account.update({
        where: { id: account.id },
        data: {
          access_token: updatedAccessToken,
          expires_at: updatedExpiresAt,
          refresh_token: updatedRefreshToken,
        },
      });

      return updatedAccessToken;
    } catch (err) {
      console.error(`Failed to refresh access token for user ${userId}:`, err);
      return account.access_token;
    }
  }

  return account.access_token;
}
