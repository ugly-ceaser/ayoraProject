"use server";

import Nylas from "nylas";

const config = {
  clientId: process.env.NYLAS_CLIENT_ID!,
  callbackUri: `http://localhost:3000/api/auth/callback/nylas`,
  apiKey: process.env.NYLAS_API_KEY!,
  apiUri: process.env.NYLAS_API_URI ?? "https://api.us.nylas.com",
};

const nylas = new Nylas({
  apiKey: config.apiKey,
  apiUri: config.apiUri,
});

export const getNylas = async () => {
  return nylas;
};

export const initializeAuthentication = async () => {
  const authUrl = nylas.auth.urlForOAuth2({
    redirectUri: config.callbackUri,
    clientId: config.clientId,
    provider: 'google',
  });
  return authUrl;
};
