/**
 * lib/emailTemplates.js
 * Quản lý nội dung và định dạng HTML cho chuỗi 3 email của T-licX
 */

function wrapEmailHtml(content, title = '') {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      border: 1px solid #e2e8f0;
    }
    .email-header {
      background: #0f172a;
      color: #ffffff;
      padding: 24px 32px;
      text-align: left;
    }
    .email-header h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .email-header .tagline {
      font-size: 13px;
      color: #94a3b8;
      margin-top: 4px;
    }
    .email-body {
      padding: 32px;
      font-size: 15px;
    }
    .email-body p {
      margin: 0 0 16px 0;
    }
    .highlight-box {
      background-color: #f1f5f9;
      border-left: 4px solid #3b82f6;
      padding: 16px 20px;
      margin: 20px 0;
      border-radius: 0 6px 6px 0;
    }
    .highlight-box ol, .highlight-box ul {
      margin: 0;
      padding-left: 20px;
    }
    .highlight-box li {
      margin-bottom: 8px;
    }
    .highlight-box li:last-child {
      margin-bottom: 0;
    }
    .product-card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 16px;
      background: #fafafa;
    }
    .product-card h3 {
      margin: 0 0 8px 0;
      font-size: 16px;
      color: #0f172a;
    }
    .product-price {
      font-size: 14px;
      color: #334155;
      margin-bottom: 6px;
    }
    .btn-cta {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 15px;
      padding: 12px 28px;
      border-radius: 6px;
      margin: 20px 0 10px 0;
      text-align: center;
    }
    .email-footer {
      background: #f8fafc;
      padding: 20px 32px;
      border-top: 1px solid #e2e8f0;
      font-size: 13px;
      color: #64748b;
      line-height: 1.5;
    }
    .email-footer a {
      color: #2563eb;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-header">
      <h1>T-licX</h1>
      <div class="tagline">Bản quyền phần mềm chính hãng cho doanh nghiệp</div>
    </div>
    <div class="email-body">
      ${content}
    </div>
    <div class="email-footer">
      <strong>Đội ngũ T-licX</strong><br>
      Email: <a href="mailto:hello@t-licx.com">hello@t-licx.com</a> | Website: <a href="https://t-licx.com">https://t-licx.com</a><br>
      Tư vấn trực tiếp & Triển khai nhanh trong 30 phút.
    </div>
  </div>
</body>
</html>`;
}

/**
 * Lấy Subject và HTML cho từng bước trong sequence
 * @param {number} step - 1, 2, hoặc 3
 * @param {string} customerName - Tên khách hàng
 * @param {string} baseUrl - Base URL của website
 */
function getEmailTemplate(step, customerName = '', baseUrl = 'https://t-licx.com') {
  const name = customerName ? customerName.trim() : 'bạn';
  const checkoutUrl = `${baseUrl.replace(/\/$/, '')}/checkout.html`;

  switch (step) {
    case 1:
      return {
        step: 1,
        subject: `Cảm ơn ${name} đã ghé T-licX — Mình đã nhận được thông tin!`,
        html: wrapEmailHtml(`
          <p>Chào <strong>${name}</strong>,</p>
          <p>Cảm ơn bạn đã để lại thông tin tại T-licX. Mình đã nhận được và sẽ sớm phản hồi đúng nhu cầu của bạn.</p>
          <p>Mình là người trực tiếp phụ trách T-licX. Dự án này ra đời từ một lý do rất đơn giản: mình thấy hầu hết các bên bán bản quyền phần mềm ở Việt Nam đều bắt khách hàng phải <em>"inbox để nhận báo giá"</em>, hỏi qua hỏi lại 3-4 vòng mới biết con số, trong khi bạn chỉ cần biết chính xác: <strong>"Team 15-20 máy của mình tốn bao nhiêu tiền để dùng yên tâm?"</strong>.</p>
          
          <div class="highlight-box">
            <strong>Ở T-licX, mình làm việc theo 3 nguyên tắc rõ ràng:</strong>
            <ol style="margin-top: 8px;">
              <li><strong>Giá công khai từng đồng</strong> — không phí ẩn, đã tính sẵn VAT và hỗ trợ cài đặt.</li>
              <li><strong>Đúng nhu cầu</strong> — cần bao nhiêu máy mua bấy nhiêu, không chèo kéo mua thêm gói thừa.</li>
              <li><strong>Hỗ trợ trực tiếp</strong> — bạn mua xong, mình hỗ trợ cài từ xa đến khi từng máy chạy mượt mà.</li>
            </ol>
          </div>

          <p>Trong 1-2 ngày tới, mình sẽ gửi bạn một chia sẻ ngắn về cách tối ưu chi phí bản quyền khi quy mô công ty từ 10 đến 50 máy (rất nhiều bên bị lãng phí chỗ này).</p>
          <p>Nếu bạn đang cần gấp để duyệt ngân sách hoặc kích hoạt máy ngay hôm nay, cứ phản hồi trực tiếp email này hoặc nhắn mình nhé.</p>
          <p>Chúc bạn và công ty một ngày làm việc hiệu quả!</p>
          <p>Thân mến,<br><strong>Đội ngũ T-licX</strong></p>
        `, `Chào mừng bạn đến với T-licX`)
      };

    case 2:
      return {
        step: 2,
        subject: `1 sai lầm khiến startup 10–30 máy tốn gấp đôi tiền bản quyền Windows`,
        html: wrapEmailHtml(`
          <p>Chào <strong>${name}</strong>,</p>
          <p>Hôm trước mình có hứa chia sẻ một insight nhỏ về chi phí bản quyền phần mềm cho doanh nghiệp nhỏ và startup.</p>
          <p>Khi đi làm việc với nhiều anh em quản lý và founder công ty tầm 10–50 máy, mình thấy có một bẫy chi phí rất phổ biến: <strong>Mua nhầm loại license hoặc chọn giải pháp thuê bao không cần thiết.</strong></p>

          <p>Dưới đây là 3 điểm thực tế bạn nên nắm rõ trước khi chi tiền:</p>

          <div class="highlight-box">
            <p><strong>1. Đừng trả tiền thuê bao hàng tháng nếu chỉ dùng Word/Excel cơ bản</strong><br>
            Nhiều bên tư vấn gói thuê bao đám mây định kỳ hàng tháng/năm cho toàn bộ nhân sự. Nhưng thực tế, với 70% vị trí trong công ty (kế toán, hành chính, kho, sales), một bản quyền Office vĩnh viễn (như Office 2021 Pro Plus mua 1 lần dùng mãi) giúp doanh nghiệp tiết kiệm từ <strong>40% đến 60%</strong> ngân sách sau 3 năm.</p>
            
            <p style="margin-top: 12px;"><strong>2. Cảnh giác với key giá rẻ vài chục nghìn trên mạng</strong><br>
            Nhiều bên bán key cá nhân giá rất rẻ nhưng bản chất là key kích hoạt dùng chung (VL/MSDN). Sau 3–6 tháng Microsoft quét là bị khóa hàng loạt, mất thời gian cài lại, và quan trọng nhất: <strong>không có hóa đơn VAT hợp lệ</strong> khi cơ quan thuế hay kiểm toán vào kiểm tra.</p>
            
            <p style="margin-top: 12px; margin-bottom: 0;"><strong>3. Tính đúng theo từng máy thực tế</strong><br>
            Không phải máy nào trong văn phòng cũng cần bản Enterprise cồng kềnh. Với startup và doanh nghiệp nhỏ, <strong>Windows 11 Pro</strong> là lựa chọn chuẩn nhất: đủ BitLocker bảo mật dữ liệu, Remote Desktop làm việc từ xa, quản lý tập trung và chi phí cực kỳ hợp lý.</p>
          </div>

          <p>Hi vọng chia sẻ ngắn gọn này giúp bạn có thêm góc nhìn thực tế khi lập bảng dự toán IT cho công ty.</p>
          <p>Ngày mai mình sẽ gửi bạn bảng tổng hợp chi phí trọn gói theo số lượng máy cụ thể để bạn dễ so sánh và cân đối nhé.</p>
          <p>Chúc bạn một ngày làm việc thuận lợi!</p>
          <p>Thân mến,<br><strong>Đội ngũ T-licX</strong></p>
        `, `Chia sẻ kinh nghiệm tối ưu chi phí bản quyền`)
      };

    case 3:
      return {
        step: 3,
        subject: `Bảng chi phí bản quyền trọn gói cho team của bạn (Đã gồm VAT & Hỗ trợ cài đặt)`,
        html: wrapEmailHtml(`
          <p>Chào <strong>${name}</strong>,</p>
          <p>Như đã hẹn hôm qua, hôm nay mình gửi bạn giải pháp bản quyền trọn gói tại T-licX — thiết kế chuẩn cho doanh nghiệp và startup cần tính nhanh, làm chuẩn, không rườm rà.</p>
          <p>Tại T-licX, toàn bộ gói sản phẩm đều là <strong>bản quyền chính hãng, kích hoạt vĩnh viễn và có hóa đơn VAT đầy đủ</strong>:</p>

          <div class="product-card">
            <h3>🪟 1. Windows 11 Pro (Key bản quyền chính hãng vĩnh viễn)</h3>
            <p style="font-size: 13px; color: #64748b; margin-bottom: 8px;">Đầy đủ tính năng bảo mật doanh nghiệp (BitLocker, Remote Desktop, Hyper-V).</p>
            <div class="product-price">• <strong>1 máy lẻ:</strong> 4.000.000₫</div>
            <div class="product-price">• <strong>Gói team 5–20 máy:</strong> 3.800.000₫/máy</div>
            <div class="product-price">• <strong>Gói team 21–50 máy:</strong> 3.600.000₫/máy</div>
          </div>

          <div class="product-card">
            <h3>📦 2. Combo Windows 11 Pro + Office 2021 Pro Plus (Tiết kiệm nhất)</h3>
            <p style="font-size: 13px; color: #64748b; margin-bottom: 8px;">Trọn bộ hệ điều hành + bộ ứng dụng văn phòng vĩnh viễn, không lo phí thuê bao định kỳ.</p>
            <div class="product-price">• <strong>1 máy lẻ:</strong> 7.500.000₫</div>
            <div class="product-price">• <strong>Gói team 5–20 máy:</strong> 7.000.000₫/máy</div>
            <div class="product-price">• <strong>Gói team 21–50 máy:</strong> 6.500.000₫/máy</div>
          </div>

          <div class="highlight-box">
            <strong>✨ 3 cam kết thực tế khi bạn đặt tại T-licX:</strong>
            <ul style="margin-top: 8px;">
              <li>Tổng chi phí rõ ràng ngay từ đầu — giá đã bao gồm VAT và toàn bộ bảo hành.</li>
              <li>Hỗ trợ cài đặt từ xa trọn gói — bạn chỉ cần mở máy, bên mình lo phần kỹ thuật.</li>
              <li>Bảo hành key trọn đời theo phần cứng máy — lỗi đổi ngay lập tức.</li>
            </ul>
          </div>

          <div style="text-align: center;">
            <a href="${checkoutUrl}" class="btn-cta">👉 ĐẶT HÀNG & THANH TOÁN TẠI ĐÂY</a>
          </div>

          <p style="font-size: 13px; color: #64748b; text-align: center;">Link đặt hàng trực tiếp: <a href="${checkoutUrl}">${checkoutUrl}</a></p>

          <p>Nếu team bạn có số lượng máy đặc thù hoặc cần xuất hóa đơn công ty ngay trong ngày, cứ trả lời email này hoặc liên hệ qua Zalo/Hotline, mình sẽ gửi hóa đơn và triển khai ngay trong 30 phút.</p>
          <p>Cảm ơn bạn đã tin tưởng đồng hành cùng T-licX!</p>
          <p>Thân mến,<br><strong>Đội ngũ T-licX</strong></p>
        `, `Bảng giá trọn gói Windows & Office`)
      };

    default:
      throw new Error(`Invalid email step: ${step}`);
  }
}

/**
 * Email xác nhận đơn hàng
 * @param {Object} options
 * @param {string} options.customerName - Tên khách hàng
 * @param {Array} options.productDetails - Mảng thông tin sản phẩm [{name, price, quantity, subtotal}]
 * @param {string} options.amount - Số tiền đã thanh toán
 * @param {string} options.orderId - Mã đơn hàng
 * @param {string} options.baseUrl - Base URL của website
 */
function getOrderConfirmationEmail({ customerName, productDetails, amount, orderId = '', baseUrl = 'https://t-licx.com' }) {
  const name = customerName ? customerName.trim() : 'bạn';
  const checkoutUrl = `${baseUrl.replace(/\/$/, '')}/checkout.html`;

  // Xây dựng bảng sản phẩm
  const productRows = productDetails.map(p => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;">${p.name}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;text-align:center;">${p.quantity}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;text-align:right;">${Number(p.price).toLocaleString()}₫</td>
      <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;">${Number(p.subtotal).toLocaleString()}₫</td>
    </tr>
  `).join('');

  const productsTable = productDetails.length > 1 ? `
    <table style="width:100%;border-collapse:collapse;margin:20px 0;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="padding:12px 16px;text-align:left;font-weight:600;color:#334155;">Sản phẩm</th>
          <th style="padding:12px 16px;text-align:center;font-weight:600;color:#334155;">SL</th>
          <th style="padding:12px 16px;text-align:right;font-weight:600;color:#334155;">Đơn giá</th>
          <th style="padding:12px 16px;text-align:right;font-weight:600;color:#334155;">Thành tiền</th>
        </tr>
      </thead>
      <tbody>
        ${productRows}
      </tbody>
    </table>
  ` : '';

  return {
    subject: `Đơn hàng #${orderId || 'T-licX'} của bạn đã được ghi nhận - T-licX`,
    html: wrapEmailHtml(`
      <p>Chào <strong>${name}</strong>,</p>
      
      <p>Cảm ơn bạn đã tin tưởng T-licX. Đơn hàng của bạn đã được ghi nhận. Vui lòng hoàn tất thanh toán ở bước tiếp theo để đơn được xử lý.</p>
      
      <div style="background:#f1f5f9;border-left:4px solid #3b82f6;padding:20px;margin:20px 0;border-radius:0 6px 6px 0;">
        <h3 style="margin:0 0 16px 0;color:#0f172a;">📦 Đơn hàng #${orderId || 'T-licX'}</h3>
        ${productsTable}
        <div style="border-top:2px solid #cbd5e1;margin-top:12px;padding-top:12px;text-align:right;">
          <p style="margin:0;font-size:18px;font-weight:700;color:#0f172a;">Tổng cộng: <span style="color:#3b82f6;">${amount}</span></p>
        </div>
        <p style="margin:12px 0 0 0;color:#64748b;"><strong>Trạng thái:</strong> Chờ thanh toán</p>
      </div>
      
      <p><strong>Hướng dẫn nhận hàng:</strong></p>
      <p>Sau khi đơn hàng được xử lý, key bản quyền sẽ được gửi qua email của bạn trong vòng 24 giờ. Nếu bạn chưa nhận được, vui lòng kiểm tra mục spam hoặc phản hồi lại email này.</p>
      
      <p>Nếu cần hỗ trợ kích hoạt hoặc có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với mình qua email này hoặc qua Zalo/Telegram - đội ngũ T-licX luôn sẵn sàng hỗ trợ.</p>
      
      <div style="text-align:center;margin:30px 0;">
        <a href="${checkoutUrl}" class="btn-cta" style="background:#0a84ff;">Kiểm tra trạng thái đơn hàng</a>
      </div>
      
      <p>Một lần nữa, cảm ơn bạn đã lựa chọn T-licX. Mình mong muốn không chỉ bán cho bạn một key bản quyền, mà còn mang lại sự yên tâm tuyệt đối về pháp lý cho doanh nghiệp của bạn.</p>
      
      <p>Chúc bạn và công ty một ngày làm việc hiệu quả!</p>
      <p>Thân mến,<br><strong>Đội ngũ T-licX</strong></p>
      <p style="font-size:14px;color:#64748b;">Email: hello@t-licx.com | Website: https://t-licx.com</p>
    `, `Đơn hàng của bạn đã được ghi nhận - T-licX`)
  };
}

module.exports = {
  getEmailTemplate,
  wrapEmailHtml,
  getOrderConfirmationEmail
};
