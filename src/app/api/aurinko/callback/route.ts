'use server';
import axios from 'axios';
import type { EmailMessage } from './types';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/server/db';
import { FREE_ACCOUNTS_PER_USER, PRO_ACCOUNTS_PER_USER } from '@/app/constants';

export const getAurinkoAuthorizationUrl = async (serviceType: 'Google' | 'Office365') => {
    try {
        // 1. Get user ID from authentication
        const { userId } = await auth();
        if (!userId) throw new Error('User not found in authentication.');

        console.log('User ID fetched:', userId);

        // 2. Get user role from the database
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        if (!user) throw new Error('User data not found in database.');

        console.log('User role:', user.role);

        // 3. Check environment variables
        if (!process.env.AURINKO_CLIENT_ID || !process.env.NEXT_PUBLIC_URL) {
            throw new Error('Missing required environment variables.');
        }
        console.log('Environment variables checked:');
        console.log('AURINKO_CLIENT_ID:', process.env.AURINKO_CLIENT_ID);
        console.log('NEXT_PUBLIC_URL:', process.env.NEXT_PUBLIC_URL);

        // 4. Optional: Subscription logic (commented out for now)
        // const isSubscribed = await getSubscriptionStatus();
        // const accounts = await db.account.count({ where: { userId } });
        // if (user.role === 'user') {
        //     if (isSubscribed) {
        //         if (accounts >= PRO_ACCOUNTS_PER_USER) {
        //             throw new Error('Maximum number of accounts for your subscription reached.');
        //         }
        //     } else {
        //         if (accounts >= FREE_ACCOUNTS_PER_USER) {
        //             throw new Error('Maximum number of free accounts reached.');
        //         }
        //     }
        // }

        // 5. Generate the authorization URL
        const params = new URLSearchParams({
            clientId: process.env.AURINKO_CLIENT_ID as string,
            serviceType,
            scopes: 'Mail.Read Mail.ReadWrite Mail.Send Mail.Drafts Mail.All',
            responseType: 'code',
            returnUrl: `${process.env.NEXT_PUBLIC_URL}/api/aurinko/callback`,
        });

        const authUrl = `https://api.aurinko.io/v1/auth/authorize?${params.toString()}`;

        // 6. Validate the URL format
        try {
            new URL(authUrl);
            console.log('Generated Authorization URL:', authUrl);
        } catch (error) {
            console.error('Invalid Authorization URL:', error instanceof Error ? error.message : error);
            throw new Error('Failed to generate a valid authorization URL.');
        }

        return authUrl;
    } catch (error) {
        console.error('Error in getAurinkoAuthorizationUrl:', error instanceof Error ? error.message : error);
        throw error;
    }
};

export const getAurinkoToken = async (code: string) => {
    try {
        console.log('Fetching Aurinko Token with code:', code);

        // 1. Ensure environment variables are available
        if (!process.env.AURINKO_CLIENT_ID || !process.env.AURINKO_CLIENT_SECRET) {
            throw new Error('Missing client ID or secret in environment variables.');
        }

        console.log('Using AURINKO_CLIENT_ID:', process.env.AURINKO_CLIENT_ID);

        // 2. Make the request to get the token
        const response = await axios.post(
            `https://api.aurinko.io/v1/auth/token/${code}`,
            {},
            {
                auth: {
                    username: process.env.AURINKO_CLIENT_ID as string,
                    password: process.env.AURINKO_CLIENT_SECRET as string,
                },
            }
        );

        console.log('Token response received:', response.data);
        return response.data as {
            accountId: number;
            accessToken: string;
            userId: string;
            userSession: string;
        };
    } catch (error) {
        console.error('Error fetching Aurinko token:', error instanceof Error ? error.message : error);
        if (axios.isAxiosError(error) && error.response) {
            console.error('Axios error details:', error.response.data);
        }
        throw error;
    }
};

export const getAccountDetails = async (accessToken: string) => {
    try {
        console.log('Fetching account details with accessToken:', accessToken);

        const response = await axios.get('https://api.aurinko.io/v1/account', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        console.log('Account details received:', response.data);
        return response.data as {
            email: string;
            name: string;
        };
    } catch (error) {
        console.error('Error fetching account details:', error instanceof Error ? error.message : error);
        if (axios.isAxiosError(error) && error.response) {
            console.error('Axios error details:', error.response.data);
        }
        throw error;
    }
};

export const getEmailDetails = async (accessToken: string, emailId: string) => {
    try {
        console.log('Fetching email details for emailId:', emailId);

        const response = await axios.get<EmailMessage>(`https://api.aurinko.io/v1/email/messages/${emailId}`, {
            params: {
                loadInlines: true,
            },
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        console.log('Email details received:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching email details:', error instanceof Error ? error.message : error);
        if (axios.isAxiosError(error) && error.response) {
            console.error('Axios error details:', error.response.data);
        }
        throw error;
    }
};
