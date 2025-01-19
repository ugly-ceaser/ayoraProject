'use server'
import axios from 'axios'
import type { EmailMessage } from './types';
import { auth } from '@clerk/nextjs/server';
import { getSubscriptionStatus } from './stripe-actions';
import { db } from '@/server/db';
import { FREE_ACCOUNTS_PER_USER, PRO_ACCOUNTS_PER_USER } from '@/app/constants';

export const getAurinkoAuthorizationUrl = async (serviceType: 'Google' | 'Office365') => {
    const { userId } = await auth();
    if (!userId) throw new Error('User not found');

    const user = await db.user.findUnique({
        where: { id: userId },
        select: { role: true },
    });
    if (!user) throw new Error('User not found');

    // Check required environment variables
    if (!process.env.AURINKO_CLIENT_ID) {
        throw new Error("Missing AURINKO_CLIENT_ID in environment variables.");
    }
    if (!process.env.NEXT_PUBLIC_URL) {
        throw new Error("Missing NEXT_PUBLIC_URL in environment variables.");
    }

    // Uncomment and use subscription logic if necessary
    // const isSubscribed = await getSubscriptionStatus();
    // const accounts = await db.account.count({ where: { userId } });

    // if (user.role === 'user') {
    //     if (isSubscribed) {
    //         if (accounts >= PRO_ACCOUNTS_PER_USER) {
    //             throw new Error('You have reached the maximum number of accounts for your subscription');
    //         }
    //     } else {
    //         if (accounts >= FREE_ACCOUNTS_PER_USER) {
    //             throw new Error('You have reached the maximum number of accounts for your subscription');
    //         }
    //     }
    // }

    console.log('Environment Variables:');
    console.log('AURINKO_CLIENT_ID:', process.env.AURINKO_CLIENT_ID);
    console.log('NEXT_PUBLIC_URL:', process.env.NEXT_PUBLIC_URL);

    // Generate URL parameters
    const params = new URLSearchParams({
        clientId: process.env.AURINKO_CLIENT_ID as string,
        serviceType,
        scopes: 'Mail.Read Mail.ReadWrite Mail.Send Mail.Drafts Mail.All',
        responseType: 'code',
        returnUrl: `${process.env.NEXT_PUBLIC_URL}/api/aurinko/callback`,
    });

    // Construct the full authorization URL
    const authUrl = `https://api.aurinko.io/v1/auth/authorize?${params.toString()}`;

    console.log("URL:",  authUrl)
    console.log("PARAM:",  params.toString())

    // Validate the URL format
    try {
        new URL(authUrl);
        console.log('Generated Authorization URL:', authUrl);
    } catch (error) {
        if (error instanceof Error) {
            console.error('Invalid Authorization URL:', error.message);
            throw new Error('Failed to generate a valid authorization URL.');
        } else {
            console.error('Unknown error:', error);
            throw new Error('An unknown error occurred while generating the authorization URL.');
        }
    }

    return authUrl;
};


export const getAurinkoToken = async (code: string) => {
    try {

        console.log('cliId', process.env.AURINKO_CLIENT_ID)

        console.log('clisec',process.env.AURINKO_CLIENT_SECRET)

        const response = await axios.post(
            `https://api.aurinko.io/v1/auth/token/${code}`,
            {},
            {
                auth: {
                    username: process.env.AURINKO_CLIENT_ID as string,
                    password: process.env.AURINKO_CLIENT_SECRET as string,
                }
            }
        );

        return response.data as {
            accountId: number;
            accessToken: string;
            userId: string;
            userSession: string;
        };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            // Log detailed error for Axios errors
            console.error('Error fetching Aurinko token:');
            console.error('Message:', error.message);
            if (error.response) {
                console.error('Response Status:', error.response.status);
                console.error('Response Data:', error.response.data);
                console.error('Response Headers:', error.response.headers);
            }
            console.error('Request Config:', error.config);
        } else {
            // Log for non-Axios errors
            console.error('Unexpected error fetching Aurinko token:', error);
        }
    }
};

export const getAccountDetails = async (accessToken: string) => {
    try {
        const response = await axios.get('https://api.aurinko.io/v1/account', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        return response.data as {
            email: string,
            name: string
        };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error fetching account details:', error.response?.data);
        } else {
            console.error('Unexpected error fetching account details:', error);
        }
        throw error;
    }
}

export const getEmailDetails = async (accessToken: string, emailId: string) => {
    try {
        const response = await axios.get<EmailMessage>(`https://api.aurinko.io/v1/email/messages/${emailId}`, {
            params: {
                loadInlines: true
            },
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        return response.data
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error fetching email details:', error.response?.data);
        } else {
            console.error('Unexpected error fetching email details:', error);
        }
        throw error;
    }
}