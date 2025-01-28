import { db } from "@/server/db";

export const POST = async (req: Request) => {
    const { data } = await req.json();
    console.log("[CLERK] - WEBHOOK /POST:", data)
    const emailAddress = data.email_addresses[0].email_address;
    const firstName = data.first_name;
    const lastName = data.last_name;
    const imageUrl = data.image_url;
    const id = data.id;

    await db.user.upsert({
        where: { id },
        update: { emailAddress, firstName, lastName, imageUrl },
        create: { id, emailAddress, firstName, lastName, imageUrl },
    });

    console.log("[CLERK] - WEBHOOK:", data)

    return new Response('Webhook received', { status: 200 });
}