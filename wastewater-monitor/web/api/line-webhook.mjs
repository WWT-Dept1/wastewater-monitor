import crypto from "node:crypto";

const LINE_REPLY_URL =
  "https://api.line.me/v2/bot/message/reply";

function json(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "content-type":
          "application/json; charset=utf-8"
      }
    }
  );
}

function verifySignature(
  rawBody,
  signature,
  channelSecret
) {
  const expected = crypto
    .createHmac("sha256", channelSecret)
    .update(rawBody, "utf8")
    .digest("base64");

  try {
    const a =
      Buffer.from(signature || "", "base64");

    const b =
      Buffer.from(expected, "base64");

    return (
      a.length === b.length &&
      crypto.timingSafeEqual(a, b)
    );
  } catch {
    return false;
  }
}

async function replyLine(
  replyToken,
  text,
  accessToken
) {
  const res = await fetch(
    LINE_REPLY_URL,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        "Authorization":
          `Bearer ${accessToken}`
      },

      body: JSON.stringify({
        replyToken,

        messages: [
          {
            type: "text",
            text
          }
        ]
      })
    }
  );

  if (!res.ok) {
    console.error(
      "LINE reply error:",
      res.status,
      await res.text()
    );
  }
}

export async function POST(request) {

  const channelSecret =
    process.env.LINE_CHANNEL_SECRET;

  const accessToken =
    process.env.LINE_CHANNEL_ACCESS_TOKEN;


  if (!channelSecret || !accessToken) {

    return json(
      {
        ok: false,
        error:
          "LINE environment variables missing"
      },
      500
    );
  }


  const rawBody =
    await request.text();

  const signature =
    request.headers.get(
      "x-line-signature"
    ) || "";


  if (
    !verifySignature(
      rawBody,
      signature,
      channelSecret
    )
  ) {

    return json(
      {
        ok: false,
        error:
          "Invalid LINE signature"
      },
      401
    );
  }


  let body;

  try {

    body =
      JSON.parse(rawBody);

  } catch {

    return json(
      {
        ok: false,
        error:
          "Invalid JSON"
      },
      400
    );
  }


  const events =
    body.events || [];


  for (const event of events) {

    const sourceType =
      event?.source?.type;

    const userId =
      event?.source?.userId;

    const groupId =
      event?.source?.groupId;

    const roomId =
      event?.source?.roomId;

    const replyToken =
      event?.replyToken;


    console.log(
      "SOURCE TYPE:",
      sourceType
    );

    if (userId) {
      console.log(
        "LINE_USER_ID:",
        userId
      );
    }

    if (groupId) {
      console.log(
        "LINE_GROUP_ID:",
        groupId
      );
    }

    if (roomId) {
      console.log(
        "LINE_ROOM_ID:",
        roomId
      );
    }


    // มีคนส่งข้อความในกลุ่ม
    if (
      event.type === "message" &&
      event.message?.type === "text" &&
      replyToken
    ) {

      // ถ้ามาจาก GROUP
      if (
        sourceType === "group" &&
        groupId
      ) {

        await replyLine(
          replyToken,

          `✅ Wastewater Monitor

เชื่อมต่อกลุ่มสำเร็จ

LINE GROUP ID คือ:

${groupId}

ให้นำรหัสนี้ไปใส่ใน Vercel

Environment Variable:
LINE_GROUP_ID`,

          accessToken
        );

        continue;
      }


      // ถ้ามาจากแชตส่วนตัว
      if (
        sourceType === "user" &&
        userId
      ) {

        await replyLine(
          replyToken,

          `✅ Wastewater Monitor

นี่คือแชตส่วนตัว

LINE USER ID:

${userId}

ถ้าต้องการ Group ID
ให้พิมพ์ test ในกลุ่ม LINE`,

          accessToken
        );

        continue;
      }
    }


    // ตอน Bot ถูกเพิ่มเข้ากลุ่ม
    if (
      event.type === "join" &&
      sourceType === "group" &&
      groupId
    ) {

      console.log(
        "BOT JOINED GROUP:",
        groupId
      );
    }
  }


  return json({
    ok: true
  });
}


export function GET() {

  return json({
    ok: true,

    service:
      "Wastewater Monitor LINE Webhook",

    message:
      "Webhook endpoint is online"
  });
}
