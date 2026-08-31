const fs = require('fs');
const path = require('path');
const { Resend } = require('resend');

const apiKey = process.env.RESEND_API_KEY || '';
if (!apiKey) console.warn('⚠️  RESEND_API_KEY chưa được cấu hình trong .env; gửi email sẽ không hoạt động.');
const resend = new Resend(apiKey);

/**
 * Gửi email tự động thông qua Resend
 * @param {Object} options
 * @param {string|string[]} options.to - Địa chỉ email người nhận
 * @param {string} options.subject - Tiêu đề email
 * @param {string} options.html - Nội dung email dạng HTML
 */
async function sendEmail({ to, subject, html }) {
  try {
    if (!apiKey) {
      throw new Error('Chưa cấu hình API Key cho Resend. Vui lòng tạo file resend_config.txt ở thư mục gốc hoặc cấu hình RESEND_API_KEY trong .env');
    }

    const { data, error } = await resend.emails.send({
      from: 'hello@t-licx.com',
      to: to,
      subject: subject,
      html: html
    });

    if (error) {
      throw new Error(error.message || JSON.stringify(error));
    }

    console.log(`✅ Email đã được gửi thành công đến ${to}. ID:`, data.id);
    return { success: true, data };
  } catch (error) {
    console.error(`❌ Gửi email đến ${to} thất bại:`, error.message || error);
    return { success: false, error: error.message || error };
  }
}

module.exports = {
  sendEmail
};
