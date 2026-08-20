const fs = require('fs');
const path = require('path');
const { Resend } = require('resend');

let apiKey = '';

// Đường dẫn tới resend_config.txt ở thư mục gốc của project
const configPath = path.join(__dirname, '..', 'resend_config.txt');

try {
  if (fs.existsSync(configPath)) {
    apiKey = fs.readFileSync(configPath, 'utf8').trim();
    console.log('✅ Đã đọc Resend API Key từ resend_config.txt');
  } else {
    console.warn('⚠️  Không tìm thấy file resend_config.txt ở thư mục gốc, thử sử dụng biến môi trường RESEND_API_KEY');
    apiKey = process.env.RESEND_API_KEY || '';
  }
} catch (error) {
  console.error('❌ Lỗi khi đọc file resend_config.txt:', error.message);
  apiKey = process.env.RESEND_API_KEY || '';
}

if (!apiKey) {
  console.warn('⚠️  Resend API Key trống. Gửi email sẽ không hoạt động cho đến khi cấu hình API Key.');
}

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
