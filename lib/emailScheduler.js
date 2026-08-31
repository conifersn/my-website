/**
 * lib/emailScheduler.js
 * Quản lý lập lịch, gửi tự động chuỗi 3 email và xử lý chế độ test (+test)
 */

const { sendEmail } = require('./email');
const { getEmailTemplate } = require('./emailTemplates');
const { runQuery, allQuery, getQuery } = require('../db');

function runSql(sql, params = []) {
  return runQuery(sql, params);
}

function allSql(sql, params = []) {
  return allQuery(sql, params);
}

/**
 * Khởi tạo bảng email_queue nếu chưa tồn tại
 */
async function initEmailScheduler() {
  try {
    await runSql(`
      CREATE TABLE IF NOT EXISTS email_queue (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER,
        email TEXT NOT NULL,
        name TEXT,
        step INTEGER NOT NULL,
        scheduled_at TIMESTAMP NOT NULL,
        sent_at TIMESTAMP,
        status TEXT DEFAULT 'pending',
        error TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Bảng email_queue sẵn sàng');

    // Chạy worker kiểm tra hàng đợi mỗi 60 giây
    setInterval(() => {
      processEmailQueue().catch(err => console.error('Error processing email queue:', err.message));
    }, 60 * 1000);

    // Chạy một lần ngay khi khởi động
    setTimeout(() => {
      processEmailQueue().catch(err => console.error('Initial email queue check error:', err.message));
    }, 5000);

  } catch (err) {
    console.error('❌ Không thể khởi tạo email_queue:', err.message);
  }
}

/**
 * Lập lịch hoặc gửi chuỗi email khi có khách hàng đăng ký waitlist
 * @param {Object} customer - { customerId, email, name }
 * @param {string} baseUrl - Base URL của website
 */
async function scheduleEmailSequence({ customerId, email, name }, baseUrl = 'https://t-licx.com') {
  if (!email) return;

  const isTest = String(email).toLowerCase().includes('+test');

  if (isTest) {
    console.log(`🧪 Phát hiện chế độ test (+test) cho email: ${email} -> Gửi ngay lập tức cả 3 email!`);

    // Gửi lần lượt 3 email ngay lập tức
    for (let step = 1; step <= 3; step++) {
      try {
        const { subject, html } = getEmailTemplate(step, name, baseUrl);
        console.log(`📤 [Test Mode] Đang gửi Email ${step} đến ${email}...`);
        
        const sendResult = await sendEmail({ to: email, subject, html });

        const nowIso = new Date().toISOString();
        if (sendResult.success) {
          await runSql(
            `INSERT INTO email_queue (customer_id, email, name, step, scheduled_at, sent_at, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'sent')`,
            [customerId || null, email, name || '', step, nowIso, nowIso]
          );
          console.log(`✅ [Test Mode] Email ${step} gửi thành công đến ${email}`);
        } else {
          await runSql(
            `INSERT INTO email_queue (customer_id, email, name, step, scheduled_at, status, error)
             VALUES ($1, $2, $3, $4, $5, 'failed', $6)`,
            [customerId || null, email, name || '', step, nowIso, sendResult.error || 'Failed to send']
          );
          console.error(`❌ [Test Mode] Email ${step} gửi thất bại đến ${email}:`, sendResult.error);
        }

        // Tạm dừng 1.5 giây giữa các email test để tránh rate limit
        await new Promise(res => setTimeout(res, 1500));
      } catch (err) {
        console.error(`❌ [Test Mode] Lỗi xử lý Email ${step} cho ${email}:`, err.message);
      }
    }

    return { isTest: true, message: 'Đã gửi ngay 3 email thử nghiệm qua Resend' };
  }

  // --- Chế độ thông thường ---
  console.log(`📅 Lập lịch chuỗi email chuẩn cho ${email} (Email 1 ngay, Email 2 sau 2 ngày, Email 3 sau 3 ngày)`);

  const now = new Date();
  const nowIso = now.toISOString();

  // 1. Gửi Email 1 ngay lập tức
  try {
    const template1 = getEmailTemplate(1, name, baseUrl);
    console.log(`📤 Đang gửi Email 1 (Chào mừng) đến ${email}...`);
    const sendResult = await sendEmail({ to: email, subject: template1.subject, html: template1.html });

    if (sendResult.success) {
      await runSql(
        `INSERT INTO email_queue (customer_id, email, name, step, scheduled_at, sent_at, status)
         VALUES ($1, $2, $3, 1, $4, $5, 'sent')`,
        [customerId || null, email, name || '', nowIso, nowIso]
      );
      console.log(`✅ Email 1 (Chào mừng) đã gửi thành công đến ${email}`);
    } else {
      await runSql(
        `INSERT INTO email_queue (customer_id, email, name, step, scheduled_at, status, error)
         VALUES ($1, $2, $3, 1, $4, 'failed', $5)`,
        [customerId || null, email, name || '', nowIso, sendResult.error || 'Failed']
      );
    }
  } catch (err) {
    console.error(`❌ Lỗi gửi Email 1 cho ${email}:`, err.message);
  }

  // 2. Lập lịch Email 2 sau 2 ngày (48 giờ)
  const scheduledTimeStep2 = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
  await runSql(
    `INSERT INTO email_queue (customer_id, email, name, step, scheduled_at, status)
     VALUES ($1, $2, $3, 2, $4, 'pending')`,
    [customerId || null, email, name || '', scheduledTimeStep2]
  );
  console.log(`⏳ Đã lên lịch Email 2 cho ${email} vào lúc ${scheduledTimeStep2}`);

  // 3. Lập lịch Email 3 sau 3 ngày (72 giờ = 1 ngày sau Email 2)
  const scheduledTimeStep3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
  await runSql(
    `INSERT INTO email_queue (customer_id, email, name, step, scheduled_at, status)
     VALUES ($1, $2, $3, 3, $4, 'pending')`,
    [customerId || null, email, name || '', scheduledTimeStep3]
  );
  console.log(`⏳ Đã lên lịch Email 3 cho ${email} vào lúc ${scheduledTimeStep3}`);

  return { isTest: false, message: 'Đã gửi Email 1 và lên lịch Email 2 & Email 3' };
}

/**
 * Worker xử lý các email đến hạn gửi
 */
async function processEmailQueue(baseUrl = 'https://t-licx.com') {
  const nowIso = new Date().toISOString();
    const pendingEmails = await allSql(
      `SELECT * FROM email_queue 
       WHERE status = 'pending' AND scheduled_at <= $1
       ORDER BY scheduled_at ASC LIMIT 10`,
      [nowIso]
    );

  if (!pendingEmails || pendingEmails.length === 0) {
    return;
  }

  console.log(`📬 Đang xử lý ${pendingEmails.length} email đến hạn gửi...`);

  for (const item of pendingEmails) {
    try {
      const { subject, html } = getEmailTemplate(item.step, item.name, baseUrl);
      console.log(`📤 Gửi Email ${item.step} theo lịch đến ${item.email}...`);

      const result = await sendEmail({ to: item.email, subject, html });
      const sentTime = new Date().toISOString();

        if (result.success) {
        await runSql(
          `UPDATE email_queue SET status = 'sent', sent_at = $1, error = NULL WHERE id = $2`,
          [sentTime, item.id]
        );
        console.log(`✅ Email ${item.step} gửi thành công theo lịch đến ${item.email}`);
      } else {
        await runSql(
          `UPDATE email_queue SET status = 'failed', error = $1 WHERE id = $2`,
          [result.error || 'Send failed', item.id]
        );
        console.error(`❌ Email ${item.step} gửi thất bại theo lịch đến ${item.email}:`, result.error);
      }
    } catch (err) {
      console.error(`❌ Lỗi xử lý item ${item.id} cho ${item.email}:`, err.message);
      await runSql(
        `UPDATE email_queue SET status = 'failed', error = $1 WHERE id = $2`,
        [err.message, item.id]
      );
    }
  }
}

/**
 * Lấy danh sách hàng đợi email để kiểm tra
 */
async function getEmailQueue() {
  return await allSql(`SELECT * FROM email_queue ORDER BY id DESC LIMIT 50`);
}

module.exports = {
  initEmailScheduler,
  scheduleEmailSequence,
  processEmailQueue,
  getEmailQueue
};
