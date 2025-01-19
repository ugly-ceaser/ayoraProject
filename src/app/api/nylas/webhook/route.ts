import { NextRequest } from "next/server";
import crypto from "crypto";
import axios from "axios";
import { db } from "@/server/db";
import { waitUntil } from "@vercel/functions";
import Account from "@/lib/account";

// Your Nylas Webhook Secret
const NYLAS_WEBHOOK_SECRET = process.env.NYLAS_WEBHOOK_SECRET;

export const POST = async (req: NextRequest) => {
  console.log("POST request received");

  // Handle validation token
  const query = req.nextUrl.searchParams;
  const validationToken = query.get("validationToken");
  if (validationToken) {
    return new Response(validationToken, { status: 200 });
  }

  // Verify required headers
  const timestamp = req.headers.get("X-Nylas-Request-Timestamp");
  const signature = req.headers.get("X-Nylas-Signature");
  const body = await req.text();

  if (!timestamp || !signature || !body) {
    return new Response("Bad Request", { status: 400 });
  }

  // Validate the request signature
  const baseString = `v0:${timestamp}:${body}`;
  const expectedSignature = crypto
    .createHmac("sha256", NYLAS_WEBHOOK_SECRET!)
    .update(baseString)
    .digest("hex");

  if (signature !== expectedSignature) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Define the type for the Nylas webhook payload
  type NylasNotification = {
    deltas: {
      type: string;
      object_data: {
        id: string;
        attributes: Record<string, any>;
      };
    }[];
  };

  const payload = JSON.parse(body) as NylasNotification;
  console.log("Received notification:", JSON.stringify(payload, null, 2));

  // Process the notification payload
  for (const delta of payload.deltas) {
    if (delta.type === "message.created") {
      const messageId = delta.object_data.id;
      const threadId = delta.object_data.attributes.thread_id;

      console.log(`New message created. ID: ${messageId}, Thread ID: ${threadId}`);

      // Optionally fetch account or process data further
      const accountId = "some_account_id"; // Replace with actual logic to fetch account ID
      const account = await db.account.findUnique({
        where: {
          id: accountId,
        },
      });

      if (account) {
        console.log(`Account found for ID: ${accountId}`);
        const acc = new Account(account.token);
        waitUntil(acc.syncEmails().then(() => console.log("Synced emails")));
      } else {
        console.error(`Account not found for ID: ${accountId}`);
      }
    } else {
      console.log("Unhandled event type:", delta.type);
    }
  }

  return new Response(null, { status: 200 });
};
