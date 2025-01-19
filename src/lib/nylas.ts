'use server';

import axios from 'axios';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/server/db';
import type { EmailMessage } from './types';

// Constants for subscription limits
import { FREE_ACCOUNTS_PER_USER, PRO_ACCOUNTS_PER_USER } from '@/app/constants';

/**
 * Helper function to handle Axios errors.
 */
const handleAxiosError = (error: unknown) => {
    if (axios.isAxiosError(error)) {
        console.error('Axios Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
            console.error('Headers:', error.response.headers);
        }
        console.error('Request Config:', error.config);
    } else {
        console.error('Unexpected Error:', error);
    }
};

/**
 * Generates the Nylas OAuth Authorization URL.
 * 
 * @returns {Promise<string>} The authorization URL.
 * @throws {Error} If user information or required environment variables are missing.
 */
export const getNylasAuthorizationUrl = async (): Promise<string> => {
    const { userId } = await auth();
    if (!userId) throw new Error('User not found');

    const user = await db.user.findUnique({
        where: { id: userId },
        select: { role: true },
    });

    if (!user) throw new Error('User not found');

    // Ensure required environment variables are set
    const clientId = process.env.NYLAS_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_URL}/api/nylas/callback/`;
    const scopes = process.env.NYLAS_SCOPES || 'email.modify,email.send,email.read_only';

    if (!clientId || !redirectUri) {
        throw new Error('Missing NYLAS_CLIENT_ID or redirect URI in environment variables.');
    }

    // Construct URL parameters
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scopes,
    });

    const authUrl = `https://api.nylas.com/oauth/authorize?${params.toString()}`;

    // Validate the URL format
    try {
        new URL(authUrl);
        console.log('Generated Authorization URL:', authUrl);
        return authUrl;
    } catch (error) {
        console.error('Invalid Authorization URL:', error instanceof Error ? error.message : error);
        throw new Error('Failed to generate a valid authorization URL.');
    }
};

/**
 * Fetches the Nylas access token using the authorization code.
 * 
 * @param {string} code - The authorization code.
 * @returns {Promise<{ access_token: string; account_id: string; provider: string; email_address: string; }>} The token response.
 * @throws {Error} If the request to Nylas fails.
 */
export const getNylasToken = async (code: string): Promise<{
    access_token: string;
    account_id: string;
    provider: string;
    email_address: string;
}> => {
    try {
        const clientId = process.env.NYLAS_CLIENT_ID;
        const clientSecret = process.env.NYLAS_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            throw new Error('Missing NYLAS_CLIENT_ID or NYLAS_CLIENT_SECRET in environment variables.');
        }

        const response = await axios.post('https://api.nylas.com/oauth/token', {
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'authorization_code',
            code,
        });

        return response.data;
    } catch (error) {
        handleAxiosError(error);
        throw new Error('Failed to fetch the Nylas token.');
    }
};

/**
 * Fetches account details from Nylas.
 * 
 * @param {string} accessToken - The access token.
 * @returns {Promise<{ email_address: string; provider: string; sync_state: string; }>} Account details.
 * @throws {Error} If the request to Nylas fails.
 */
export const getAccountDetails = async (accessToken: string): Promise<{
    email_address: string;
    provider: string;
    sync_state: string;
}> => {
    try {
        const response = await axios.get('https://api.nylas.com/account', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        return response.data;
    } catch (error) {
        handleAxiosError(error);
        throw new Error('Failed to fetch account details from Nylas.');
    }
};

/**
 * Fetches email details by ID.
 * 
 * @param {string} accessToken - The access token.
 * @param {string} emailId - The email ID.
 * @returns {Promise<EmailMessage>} Email details.
 * @throws {Error} If the request to Nylas fails.
 */
export const getEmailDetails = async (accessToken: string, emailId: string): Promise<EmailMessage> => {
    try {
        const response = await axios.get(`https://api.nylas.com/messages/${emailId}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        return response.data;
    } catch (error) {
        handleAxiosError(error);
        throw new Error('Failed to fetch email details from Nylas.');
    }
};
