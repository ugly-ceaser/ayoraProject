'use server';

import { NextResponse } from 'next/server';
import axios from 'axios';
import type { EmailMessage } from './types';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/server/db';
import { FREE_ACCOUNTS_PER_USER, PRO_ACCOUNTS_PER_USER } from '@/app/constants';

export const getNylasAuthorizationUrl = async (serviceType: 'Google' | 'Office365') => {
    try {
        // Get user ID from authentication
        const { userId } = await auth();
        if (!userId) throw new Error('User not found in authentication.');

        // Get user role from the database
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        if (!user) throw new Error('User data not found in database.');

        // Check environment variables
        if (!process.env.NYLAS_CLIENT_ID || !process.env.NEXT_PUBLIC_URL) {
            throw new Error('Missing required environment variables.');
        }

        // Generate the authorization URL

        console.log('gettting url 1')
        const params = new URLSearchParams({
            client_id: 'd3557661-4e20-4aeb-915b-8eaa05e02bac' as string,
            redirect_uri: `${process.env.NEXT_PUBLIC_URL}/api/nylas/callback`,
            response_type: 'code',
            scopes: 'email.read_only email.send email.modify',
        });

        const authUrl = `https://api.nylas.com/oauth/authorize?${params.toString()}`;

        // Validate the URL format
        try {
            new URL(authUrl);
        } catch (error) {
            throw new Error('Failed to generate a valid authorization URL.');
        }

        return authUrl;
    } catch (error) {
        throw new Error(`Error in getNylasAuthorizationUrl: ${error instanceof Error ? error.message : error}`);
    }
};

export const getNylasToken = async (code: string) => {
    try {
        if (!process.env.NYLAS_CLIENT_ID || !process.env.NYLAS_CLIENT_SECRET) {
            throw new Error('Missing client ID or secret in environment variables.');
        }

        const response = await axios.post('https://api.nylas.com/oauth/token', {
            client_id: process.env.NYLAS_CLIENT_ID,
            client_secret: process.env.NYLAS_CLIENT_SECRET,
            code,
        });

        return response.data as {
            access_token: string;
            account_id: string;
            provider: string;
        };
    } catch (error) {
        throw new Error(`Error fetching Nylas token: ${error instanceof Error ? error.message : error}`);
    }
};

export const getAccountDetails = async (accessToken: string) => {
    try {
        const response = await axios.get('https://api.nylas.com/account', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        return response.data as {
            email: string;
            name: string;
        };
    } catch (error) {
        throw new Error(`Error fetching account details: ${error instanceof Error ? error.message : error}`);
    }
};

// Exported HTTP method handlers
export const POST = async (req: Request) => {
    try {
        const { code } = await req.json();

        if (!code) {
            return NextResponse.json({ error: 'Authorization code is missing.' }, { status: 400 });
        }

        // Exchange the code for an access token
        const tokenData = await getNylasToken(code);

        // Fetch account details using the access token
        const accountDetails = await getAccountDetails(tokenData.access_token);

        return NextResponse.json({ success: true, accountDetails });
    } catch (error) {
        return NextResponse.json(
            { error: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error.'}` },
            { status: 500 }
        );
    }
};

export const GET = async () => {
    return NextResponse.json({ message: 'Nylas callback API is working.' });
};
