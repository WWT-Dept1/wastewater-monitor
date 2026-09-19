const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";

const ALERTS = {
  test: {
    title: "ทดสอบระบบแจ้งเตือน",
    status: "TEST",
    value: "12.5 m³/h",
    detail: "ระบบ Wastewater Monitor เชื่อมต่อ LINE สำเร็จ"
  },

  flow_low: {
    title: "ตรวจพบ Flow ต่ำผิดปกติ",
    status: "LOW FLOW",
    value: "2.8 m³/h",
    detail: "กรุณาตรวจสอบ Pump / Valve / ท่อ / สัญญาณ Flowmeter"
  },

  flow_high: {
    title: "ตรวจพบ Flow สูงผิดปกติ",
    status: "HIGH FLOW",
    value: "28.6 m³/h",
    detail: "กรุณาตรวจสอบ Inlet Flow / Pump / Valve Setting"
  },

  flow_nosignal: {
    title: "ไม่พบข้อมูล Flow",
    status: "NO FLOW / NO SIGNAL",
    value: "ไม่มีข้อมูล",
    detail: "กรุณาตรวจสอบ MV110 / สาย 4–20 mA / ESP32 / Wi-Fi"
  },

  flow_rapid: {
    title: "Flow เปลี่ยนแปลงรวดเร็วผิดปกติ",
    status: "RAPID CHANGE",
    value: "+16.4 m³/h",
    detail: "กรุณาตรวจสอบ Pump / Valve และสภาวะน้ำเข้า"
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}

export async function POST(request) {
  const accessToken =
    process.env.LINE_CHANNEL_ACCESS_TOKEN;

  const userId =
    process.env.LINE_USER_ID;

  if (!accessToken || !userId) {
    return json(
      {
        ok: false,
        error: "missing_line_environment_variables"
      },
      500
    );
  }

  let body = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const type = body.type || "test";
  const alert = ALERTS[type];

  if (!alert) {
    return json(
      {
        ok: false,
        error: "unsupported_alert_type"
      },
      400
    );
  }

  const now = new Intl.DateTimeFormat(
    "th-TH",
    {
      timeZone: "Asia/Bangkok",
      dateStyle: "medium",
      timeStyle: "medium"
    }
  ).format(new Date());

  const message =
`🚨 Wastewater Monitor

${alert.title}

สถานะ: ${alert.status}
Flow: ${alert.value}
จุดตรวจ: FM-01
เวลา: ${now}

${alert.detail}`;

  const lineResponse = await fetch(
    LINE_PUSH_URL,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },

      body: JSON.stringify({
        to: userId,

        messages: [
          {
            type: "text",
            text: message
          }
        ]
      })
    }
  );

  const responseText =
    await lineResponse.text();

  if (!lineResponse.ok) {

    console.error(
      "LINE push failed:",
      lineResponse.status,
      responseText
    );

    return json(
      {
        ok: false,
        error: "line_push_failed",
        status: lineResponse.status
      },
      502
    );
  }

  return json({
    ok: true,
    type,
    sent_to_line: true
  });
}

export function GET() {

  return json({
    ok: true,
    service:
      "Wastewater Monitor LINE Alert API",
    method: "POST"
  });
}
