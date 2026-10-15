const crypto = require("crypto");

module.exports = async function (req, res) {
    // Cấu hình CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const { memberCode, taskID } = req.body || {};
        if (!memberCode || !taskID) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin memberCode hoặc taskID' });
        }

        const CLIENT_SECRET = process.env.OFFER_TASK_CLIENT_SECRET;
        if (!CLIENT_SECRET) {
            return res.status(500).json({ success: false, message: 'Chưa cấu hình OFFER_TASK_CLIENT_SECRET trên Vercel' });
        }

        const timestamp = Date.now();
        const nonce = crypto.randomBytes(16).toString("hex");
        
        // Ký HMAC an toàn từ server Vercel
        const signature = crypto
            .createHmac("sha256", CLIENT_SECRET)
            .update(`${memberCode}_${taskID}_${timestamp}_${nonce}`, "utf8")
            .digest("hex");

        // Gọi sang server chính mmx.today
        const response = await fetch("https://mmx.today/api/complete-task", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                memberCode: String(memberCode), 
                taskID: Number(taskID), 
                timestamp, 
                nonce, 
                signature 
            }),
        });

        const data = await response.json();
        return res.status(response.status).json(data);
    } catch (error) {
        console.error("Proxy error:", error);
        return res.status(500).json({ success: false, message: error.message || "Lỗi server nội bộ" });
    }
};
