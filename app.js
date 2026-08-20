require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const { runQuery, allQuery, getQuery, pool } = require('./db');
const { sendEmail } = require('./lib/email');

const app = express();
const PORT = process.env.PORT || 3000;
const brainDbPath = path.join(__dirname, 'my-brain', 'brain.db');

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

function brainAllQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(brainDbPath);
    db.all(sql, params, (err, rows) => {
      db.close((closeErr) => {
        if (err) reject(err);
        else if (closeErr) reject(closeErr);
        else resolve(rows);
      });
    });
  });
}

function isDatabaseUnavailable(err) {
  return err?.code === 'ECONNREFUSED' || String(err?.message || '').includes('ECONNREFUSED');
}

function brainRunQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(brainDbPath);
    db.run(sql, params, function(err) {
      const result = { lastID: this?.lastID, changes: this?.changes || 0 };
      db.close((closeErr) => {
        if (err) reject(err);
        else if (closeErr) reject(closeErr);
        else resolve(result);
      });
    });
  });
}

async function ensureBrainCustomerColumn(columnName, definition) {
  const columns = await brainAllQuery('PRAGMA table_info(customers)');
  if (!columns.some((column) => column.name === columnName)) {
    await brainRunQuery(`ALTER TABLE customers ADD COLUMN ${columnName} ${definition}`);
  }
}

async function initBrainDatabase() {
  await brainRunQuery(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      company TEXT,
      message TEXT,
      source TEXT DEFAULT 'website_waitlist',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await ensureBrainCustomerColumn('email', 'TEXT');
  await ensureBrainCustomerColumn('phone', 'TEXT');
  await ensureBrainCustomerColumn('company', 'TEXT');
  await ensureBrainCustomerColumn('message', 'TEXT');
  await ensureBrainCustomerColumn('source', "TEXT DEFAULT 'website_waitlist'");

  console.log('✅ brain.db customers ready');
}

async function insertCustomerRecord({ name, email, phone, company, message = '', source = 'manual_admin' }) {
  let postgresId = null;

  try {
    const result = await runQuery(
      'INSERT INTO customers (name, email, phone, company) VALUES ($1,$2,$3,$4) RETURNING id',
      [name, email || '', phone || '', company || '']
    );
    postgresId = result.lastID || null;
  } catch (err) {
    if (!isDatabaseUnavailable(err)) {
      throw err;
    }
    console.warn('PostgreSQL unavailable, saving customer only to brain.db');
  }

  const brainResult = await brainRunQuery(
    'INSERT INTO customers (name, email, phone, company, message, source) VALUES (?,?,?,?,?,?)',
    [name, email || '', phone || '', company || '', message || '', source]
  );

  return { postgresId, brainId: brainResult.lastID };
}

// ====== MERCHANT INFO (ưu tiên env vars, fallback hardcode cho local dev) ======
const MERCHANT_ID = process.env.MERCHANT_ID || 'SP-LIVE-NN443574';
const SECRET_KEY  = process.env.SECRET_KEY  || 'spsk_live_WaDAG3dZgKdbsD8jfhxczqwdfZRoCKT3';
const SEPAY_URL   = 'https://pay.sepay.vn/v1/checkout/init';
const BASE_URL    = process.env.BASE_URL    || 'https://t-licx1.vercel.app';

// ====== POSTGRESQL DATABASE ======
async function initDatabase() {
  await initBrainDatabase();

  try {
    await runQuery(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        stock INTEGER DEFAULT 0,
        type TEXT CHECK(type IN ('physical','digital','service')) DEFAULT 'physical',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await runQuery(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        company TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await runQuery(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL,
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        notes TEXT,
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      )
    `);

    await runQuery(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    await runQuery(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        order_id INTEGER,
        transaction_id TEXT,
        gateway TEXT DEFAULT 'sepay',
        amount REAL,
        status TEXT,
        raw_payload TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database initialized');
  } catch (err) {
    console.log('PostgreSQL unavailable, continuing with brain.db only:', err.message || err);
  }
}

initDatabase();

// ====== API ROUTES ======

// ---------- PRODUCTS ----------
app.get('/api/products', async (req, res) => {
  try {
    const products = await allQuery('SELECT * FROM products ORDER BY id DESC');
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, description, price, stock, type } = req.body;
    if (!name || price == null || price <= 0) {
      return res.status(400).json({ success: false, message: 'Tên và giá là bắt buộc' });
    }
    const result = await runQuery(
      'INSERT INTO products (name, description, price, stock, type) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [name, description || '', price, stock || 0, type || 'physical']
    );
    res.json({ success: true, message: 'Thêm sản phẩm thành công', id: result.lastID });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});
app.put('/api/products/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, price, stock, type } = req.body;
    if (!name || price == null || price <= 0) {
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
    }
    await runQuery(
      'UPDATE products SET name=$1, description=$2, price=$3, stock=$4, type=$5, updated_at=CURRENT_TIMESTAMP WHERE id=$6',
      [name, description || '', price, stock || 0, type || 'physical', id]
    );
    res.json({ success: true, message: 'Cập nhật thành công' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await runQuery('DELETE FROM products WHERE id=$1', [id]);
    res.json({ success: true, message: 'Xóa sản phẩm thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- CUSTOMERS ----------
app.post('/api/waitlist', async (req, res) => {
  try {
    const { name, email, phone, company, message } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Tên và email là bắt buộc' });
    }

    const customerResult = await insertCustomerRecord({
      name,
      email,
      phone,
      company,
      message,
      source: 'website_waitlist'
    });

    // Gửi email sequence
    const isTestEmail = email.toLowerCase().includes('+test');
    
    try {
      const { getEmailTemplate } = require('./lib/emailTemplates');
      
      // Email 1: Chào mừng (gửi ngay lập tức)
      const email1 = getEmailTemplate(1, name);
      await sendEmail({
        to: email,
        subject: email1.subject,
        html: email1.html
      });

      // Nếu là +test email, gửi ngay cả 3 email
      if (isTestEmail) {
        const email2 = getEmailTemplate(2, name);
        await sendEmail({
          to: email,
          subject: email2.subject,
          html: email2.html
        });

        const email3 = getEmailTemplate(3, name);
        await sendEmail({
          to: email,
          subject: email3.subject,
          html: email3.html
        });
      }

      // Email thông báo admin
      await sendEmail({
        to: 'conifers.n@gmail.com',
        subject: `[T-licX] Khách hàng mới đăng ký tư vấn - ${name}`,
        html: `
          <!DOCTYPE html>
          <html><body>
          <h2>Khách hàng mới đăng ký tư vấn</h2>
          <p><strong>Tên:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>SĐT:</strong> ${phone || 'Không có'}</p>
          <p><strong>Công ty:</strong> ${company || 'Không có'}</p>
          <p><strong>Nhu cầu:</strong> ${message || 'Không có'}</p>
          <p><strong>Source:</strong> website_waitlist</p>
          <hr>
          <p>ID khách hàng: ${customerResult.postgresId || customerResult.brainId}</p>
          ${isTestEmail ? '<p style="color:red;"><strong>⚠️ Đây là email +test - gửi ngay 3 email sequence</strong></p>' : ''}
          </body></html>
        `
      });
    } catch (emailErr) {
      console.error('❌ Lỗi khi gửi email:', emailErr.message);
      // Không trả lỗi nếu email thất bại - form vẫn được ghi nhận
    }

    res.json({
      success: true,
      message: isTestEmail 
        ? 'Đã nhận thông tin waitlist thành công. Đã gửi 3 email sequence ngay lập tức.' 
        : 'Đã nhận thông tin waitlist thành công. Đội ngũ T-licX sẽ liên hệ với bạn trong vòng 24 giờ.',
      id: customerResult.postgresId || customerResult.brainId
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/customers', async (req, res) => {
  try {
    const customers = await allQuery('SELECT * FROM customers ORDER BY id DESC');
    res.json({ success: true, data: customers });
  } catch (err) {
    if (!isDatabaseUnavailable(err)) {
      return res.status(500).json({ success: false, message: err.message });
    }

    const customers = await brainAllQuery('SELECT * FROM customers ORDER BY id DESC');
    res.json({ success: true, data: customers });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const { name, email, phone, company } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Tên khách hàng là bắt buộc' });
    }

    const result = await insertCustomerRecord({
      name,
      email,
      phone,
      company,
      source: 'manual_admin'
    });

    res.json({ success: true, message: 'Thêm khách hàng thành công', id: result.postgresId || result.brainId });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message || String(err) });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, email, phone, company } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Tên khách hàng là bắt buộc' });
    }

    try {
      await runQuery(
        'UPDATE customers SET name=$1, email=$2, phone=$3, company=$4 WHERE id=$5',
        [name, email || '', phone || '', company || '', id]
      );
    } catch (err) {
      if (!isDatabaseUnavailable(err)) {
        throw err;
      }
    }

    await brainRunQuery(
      'UPDATE customers SET name=?, email=?, phone=?, company=? WHERE id=?',
      [name, email || '', phone || '', company || '', id]
    );

    res.json({ success: true, message: 'Cập nhật thành công' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message || String(err) });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    try {
      await runQuery('DELETE FROM customers WHERE id=$1', [id]);
    } catch (err) {
      if (!isDatabaseUnavailable(err)) {
        throw err;
      }
    }

    await brainRunQuery('DELETE FROM customers WHERE id=?', [id]);

    res.json({ success: true, message: 'Xóa khách hàng thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- ORDERS ----------
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await allQuery(`
      SELECT orders.*, customers.name as customer_name
      FROM orders
      LEFT JOIN customers ON orders.customer_id = customers.id
      ORDER BY orders.id DESC
    `);
    for (let order of orders) {
      const items = await allQuery(`
        SELECT order_items.*, products.name as product_name
        FROM order_items
        LEFT JOIN products ON order_items.product_id = products.id
        WHERE order_items.order_id = $1
      `, [order.id]);
      order.items = items;
    }
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  const { customer_id, items, status, notes } = req.body;
  if (!customer_id || !items || !items.length) {
    return res.status(400).json({ success: false, message: 'Khách hàng và sản phẩm là bắt buộc' });
  }
try {
    let total = 0;
    const orderItems = [];
    const productDetails = [];

    for (const item of items) {
      const product = await getQuery('SELECT * FROM products WHERE id = $1', [item.product_id]);
      if (!product) {
        throw new Error(`Sản phẩm ID ${item.product_id} không tồn tại`);
      }
      if (product.type === 'physical' && product.stock < item.quantity) {
        throw new Error(`Sản phẩm ${product.name} không đủ hàng (còn ${product.stock})`);
      }
      const price = product.price;
      total += price * item.quantity;
      orderItems.push({
        product_id: product.id,
        quantity: item.quantity,
        price: price,
        type: product.type
      });
      productDetails.push({
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        subtotal: price * item.quantity
      });
    }

    await runQuery('BEGIN');

    const orderResult = await runQuery(
      'INSERT INTO orders (customer_id, total, status, notes) VALUES ($1,$2,$3,$4) RETURNING id',
      [customer_id, total, status || 'pending', notes || '']
    );
    const orderId = orderResult.lastID;

    for (const item of orderItems) {
      await runQuery(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1,$2,$3,$4)',
        [orderId, item.product_id, item.quantity, item.price]
      );
      if (item.type === 'physical') {
        await runQuery(
          'UPDATE products SET stock = stock - $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }
    }

    await runQuery('COMMIT');

    // Chỉ xác nhận checkout thành công sau khi email xác nhận đã được Resend nhận.
    // Nhờ vậy frontend không chuyển sang Sepay nếu khách chưa được gửi email.
    try {
      const { getOrderConfirmationEmail } = require('./lib/emailTemplates');
      const customer = await getQuery('SELECT * FROM customers WHERE id = $1', [customer_id]);
      if (customer) {
        const customerName = customer.name || 'Khách';
        const customerEmail = customer.email;
        
        const emailContent = getOrderConfirmationEmail({
          customerName,
          productDetails,
          amount: `${total.toLocaleString()}₫`,
          orderId: `T-${orderId}`,
          baseUrl: process.env.BASE_URL || 'https://t-licx.com'
        });
        
        await sendEmail({
          to: customerEmail,
          subject: emailContent.subject,
          html: emailContent.html
        });
      }
    } catch (emailErr) {
      console.error('❌ Lỗi khi gửi email xác nhận đơn hàng:', emailErr.message);
      // Không trả lỗi nếu email thất bại - đơn hàng vẫn được tạo
    }

    res.json({ success: true, message: 'Tạo đơn hàng thành công. Email xác nhận đã được gửi.', orderId });
  } catch (err) {
    await runQuery('ROLLBACK');
    res.status(400).json({ success: false, message: err.message });
  }
});

app.put('/api/orders/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, notes } = req.body;
    await runQuery(
      'UPDATE orders SET status=$1, notes=$2 WHERE id=$3',
      [status || 'pending', notes || '', id]
    );
    res.json({ success: true, message: 'Cập nhật đơn hàng thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await runQuery('DELETE FROM order_items WHERE order_id=$1', [id]);
    await runQuery('DELETE FROM orders WHERE id=$1', [id]);
    res.json({ success: true, message: 'Xóa đơn hàng thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ====== CREATE CHECKOUT ORDER ======
app.post('/api/checkout', async (req, res) => {
  try {
    const { fullName, email, phone, amount, product } = req.body;

    if (!fullName || !email || !phone || !amount) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin' });
    }

    // Tạo invoice number tại đây (một lần duy nhất) để lưu vào DB
    // và dùng lại ở /generate-signature — đảm bảo khớp khi webhook tìm order
    const invoiceNumber = 'T-LICX-' + Date.now().toString(36).toUpperCase();

    // Tạo customer
    const customerResult = await runQuery(
      'INSERT INTO customers (name, email, phone, company) VALUES ($1,$2,$3,$4) RETURNING id',
      [fullName, email, phone, '']
    );
    const customerId = customerResult.lastID;

    // Tạo order pending — notes lưu cả invoice number để webhook tìm được
    const orderResult = await runQuery(
      'INSERT INTO orders (customer_id, total, status, notes) VALUES ($1,$2,$3,$4) RETURNING id',
      [customerId, amount, 'pending', `Product: ${product} | Invoice: ${invoiceNumber}`]
    );
    const orderId = orderResult.lastID;

    // Gửi email xác nhận đơn hàng
    try {
      const { getOrderConfirmationEmail } = require('./lib/emailTemplates');
      const emailContent = getOrderConfirmationEmail({
        customerName: fullName,
        productDetails: [{
          name: product || 'Windows License',
          price: amount,
          quantity: 1,
          subtotal: amount
        }],
        amount: `${amount.toLocaleString()}₫`,
        orderId: `T-${orderId}`,
        baseUrl: process.env.BASE_URL || 'https://t-licx.com'
      });
      
      const emailResult = await sendEmail({
        to: email,
        subject: emailContent.subject,
        html: emailContent.html
      });
      if (!emailResult.success) {
        throw new Error(emailResult.error || 'Không thể gửi email xác nhận');
      }
    } catch (emailErr) {
      console.error('❌ Lỗi khi gửi email xác nhận đơn hàng:', emailErr.message);
      return res.status(502).json({
        success: false,
        orderId,
        invoiceNumber,
        message: 'Đơn hàng đã được tạo nhưng chưa gửi được email xác nhận. Vui lòng thử lại hoặc liên hệ hỗ trợ.'
      });
    }

    // Trả invoiceNumber về frontend để dùng khi gọi /generate-signature
    res.json({ success: true, orderId, customerId, invoiceNumber });
  } catch (err) {
    console.error('Error creating checkout order:', err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// ====== SEPAY WEBHOOK ======
// Webhook URL cấu hình trong Sepay Dashboard:
//   https://t-licx1.vercel.app/api/webhook/sepay
//
// Xác thực: HMAC-SHA256
// Header: X-SePay-Signature: sha256={hex}  |  X-SePay-Timestamp: {unix_seconds}
// Chuỗi ký: {timestamp}.{raw_body}
//
// Payload thực tế từ Sepay (docs: https://developer.sepay.vn/vi/sepay-webhooks/tich-hop-webhook):
//   id              – ID giao dịch trên Sepay (dùng làm khóa chống trùng)
//   gateway         – Tên ngân hàng
//   transactionDate – YYYY-MM-DD HH:mm:ss
//   accountNumber   – Số tài khoản
//   transferAmount  – Số tiền (VNĐ, luôn dương)
//   transferType    – "in" hoặc "out"
//   content         – Nội dung chuyển khoản gốc (dùng để tìm order)
//   code            – Mã thanh toán trích từ nội dung (null nếu không khớp)
//   subAccount      – VA khớp giao dịch (rỗng nếu không có)
//   referenceCode   – Mã tham chiếu ngân hàng
//   description     – Mô tả đầy đủ từ ngân hàng
//   accumulated     – Số dư sau giao dịch (0 nếu ngân hàng không hỗ trợ)

// Middleware đọc raw body TRƯỚC express.json() — bắt buộc để verify HMAC
// (nếu body đã parse rồi serialize lại thì chữ ký sẽ lệch)
app.use('/api/webhook/sepay', express.raw({ type: 'application/json' }));

app.post('/api/webhook/sepay', async (req, res) => {
  // raw body là Buffer từ express.raw()
  const rawBody = req.body instanceof Buffer ? req.body.toString('utf8') : JSON.stringify(req.body);
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid JSON body' });
  }

  console.log('📩 Sepay webhook received — txn id:', payload.id);

  try {
    // ── 1. Chỉ xử lý giao dịch TIỀN VÀO ────────────────────────────────
    if (payload.transferType !== 'in') {
      console.log(`ℹ️  transferType="${payload.transferType}" — bỏ qua (chỉ xử lý "in")`);
      return res.json({ success: true });
    }

    // ── 2. Verify HMAC-SHA256 (header-based, raw body) ───────────────────
    const SEPAY_WEBHOOK_SECRET = process.env.SEPAY_WEBHOOK_SECRET || SECRET_KEY;
    const receivedSig  = req.headers['x-sepay-signature'] || '';
    const timestamp    = parseInt(req.headers['x-sepay-timestamp'] || '0', 10);

    if (receivedSig) {
      // Kiểm tra timestamp chống replay (±5 phút)
      const now = Math.floor(Date.now() / 1000);
      if (Math.abs(now - timestamp) > 300) {
        console.warn('⚠️  Webhook timestamp quá cũ — replay attack?', { timestamp, now });
        return res.status(401).json({ success: false, message: 'Request expired' });
      }

      // Tái tạo chữ ký: sha256=HMAC-SHA256("{timestamp}.{rawBody}", secret)
      const expectedSig = 'sha256=' + crypto
        .createHmac('sha256', SEPAY_WEBHOOK_SECRET)
        .update(`${timestamp}.${rawBody}`)
        .digest('hex');

      if (receivedSig !== expectedSig) {
        console.warn('❌ HMAC signature không hợp lệ');
        console.warn('   received:', receivedSig);
        console.warn('   expected:', expectedSig);
        await runQuery(
          `INSERT INTO transactions (order_id, transaction_id, gateway, amount, status, raw_payload)
           VALUES ($1,$2,$3,$4,'signature_invalid',$5)`,
          [null, String(payload.id || ''), payload.gateway || 'sepay',
           payload.transferAmount || 0, rawBody]
        );
        return res.status(401).json({ success: false, message: 'Invalid signature' });
      }
    } else {
      // Không có header → chỉ chấp nhận nếu đang trong môi trường dev/test
      console.warn('⚠️  Không có X-SePay-Signature header — chạy không xác thực (chỉ OK khi test)');
    }

    // ── 3. Chống trùng lặp (idempotency) ────────────────────────────────
    // Dùng payload.id (ID giao dịch Sepay) làm khóa UNIQUE
    const sepayTxnId = String(payload.id || '');
    if (sepayTxnId) {
      const existing = await getQuery(
        "SELECT id FROM transactions WHERE transaction_id = $1 AND status = 'paid'",
        [sepayTxnId]
      );
      if (existing) {
        console.log(`ℹ️  Giao dịch #${sepayTxnId} đã xử lý — idempotent skip`);
        return res.json({ success: true, message: 'Already processed' });
      }
    }

    // ── 4. Tìm order khớp với giao dịch ────────────────────────────────
    // Sepay không gửi order_id trực tiếp.
    // Cách match: dùng payload.code (mã trích từ nội dung CK) hoặc tìm trong content.
    //
    // Ví dụ nội dung CK: "T-LICX-ABC123 Windows Key"
    // → Cấu hình "Cấu trúc mã thanh toán" trong Sepay Dashboard để tự trích payload.code
    const matchCode    = payload.code    || '';   // mã Sepay trích tự động
    const matchContent = payload.content || '';   // nội dung CK gốc

    let order = null;

    // Thử tìm theo code trước (chính xác nhất)
    if (matchCode) {
      order = await getQuery(
        "SELECT * FROM orders WHERE notes LIKE $1 AND status='pending' ORDER BY id DESC LIMIT 1",
        [`%${matchCode}%`]
      );
    }

    // Fallback: tìm theo nội dung CK chứa invoice number (T-licX-...)
    if (!order && matchContent) {
      // Lấy token từ content có dạng T-LICX-XXXXXXX
      const invoiceMatch = matchContent.match(/T-LICX-[A-Z0-9]+/i);
      if (invoiceMatch) {
        order = await getQuery(
          "SELECT * FROM orders WHERE notes LIKE $1 AND status='pending' ORDER BY id DESC LIMIT 1",
          [`%${invoiceMatch[0]}%`]
        );
      }
    }

    // Fallback cuối: lấy order pending mới nhất (chỉ khi amount khớp chính xác)
    if (!order) {
      order = await getQuery(
        "SELECT * FROM orders WHERE status='pending' AND total=$1 ORDER BY id DESC LIMIT 1",
        [payload.transferAmount]
      );
      if (order) {
        console.warn(`⚠️  Không tìm được order theo mã, fallback theo amount=${payload.transferAmount} → order #${order.id}`);
      }
    }

    if (!order) {
      console.warn('⚠️  Không tìm thấy order pending cho webhook. content:', matchContent, 'code:', matchCode);
      await runQuery(
        `INSERT INTO transactions (order_id, transaction_id, gateway, amount, status, raw_payload)
         VALUES ($1,$2,$3,$4,'order_not_found',$5)`,
        [null, sepayTxnId, payload.gateway || 'sepay', payload.transferAmount || 0, rawBody]
      );
      // Trả 200 để Sepay không retry liên tục với giao dịch không liên quan
      return res.json({ success: true, message: 'No matching order' });
    }

    // ── 5. Verify amount ≥ total đơn hàng ───────────────────────────────
    const paidAmount  = parseInt(payload.transferAmount || 0, 10);
    const orderTotal  = parseFloat(order.total);
    if (paidAmount < orderTotal) {
      console.warn(`⚠️  Thiếu tiền: paid=${paidAmount} < expected=${orderTotal} — order #${order.id}`);
      await runQuery(
        `INSERT INTO transactions (order_id, transaction_id, gateway, amount, status, raw_payload)
         VALUES ($1,$2,$3,$4,'amount_mismatch',$5)`,
        [order.id, sepayTxnId, payload.gateway || 'sepay', paidAmount, rawBody]
      );
      return res.json({ success: true, message: 'Amount insufficient, pending review' });
    }

    // ── 6. Update order → paid ───────────────────────────────────────────
    await runQuery(
      `UPDATE orders
       SET status='paid',
           notes=COALESCE(notes,'') || $1
       WHERE id=$2`,
      [`\n[Paid ${paidAmount}đ via ${payload.gateway || 'Sepay'} | txn:${sepayTxnId} | ${payload.transactionDate || ''}]`,
       order.id]
    );
    console.log(`✅ Order #${order.id} → paid | txn: ${sepayTxnId} | amount: ${paidAmount}`);

    // ── 7. Log transaction ───────────────────────────────────────────────
    await runQuery(
      `INSERT INTO transactions (order_id, transaction_id, gateway, amount, status, raw_payload)
       VALUES ($1,$2,$3,$4,'paid',$5)`,
      [order.id, sepayTxnId, payload.gateway || 'sepay', paidAmount, rawBody]
    );

    // Sepay yêu cầu trả ĐÚNG {"success": true} — không thêm field khác cũng OK
    return res.json({ success: true });

  } catch (err) {
    console.error('❌ Webhook error:', err);
    // Trả 500 để Sepay sẽ retry sau
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ====== GENERATE SIGNATURE FOR SEPAY ======
app.post('/generate-signature', async (req, res) => {
  try {
    const { fullName, email, phone, amount, product, orderId, invoiceNumber } = req.body;

    if (!fullName || !email || !phone || !amount || !orderId || !invoiceNumber) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }

    // Chỉ ký yêu cầu Sepay cho order vừa tạo từ /api/checkout.
    // invoiceNumber và orderId phải cùng thuộc một đơn pending.
    const order = await getQuery(
      "SELECT orders.id, orders.total, orders.status, orders.notes, customers.email " +
      "FROM orders JOIN customers ON customers.id = orders.customer_id " +
      "WHERE orders.id = $1",
      [orderId]
    );
    if (!order || order.status !== 'pending' || !String(order.notes || '').includes(invoiceNumber) || order.email !== email) {
      return res.status(400).json({ success: false, message: 'Đơn hàng không hợp lệ hoặc không còn chờ thanh toán' });
    }
    if (Number(order.total) !== Number(amount)) {
      return res.status(400).json({ success: false, message: 'Số tiền thanh toán không khớp đơn hàng' });
    }

    const successUrl = `${BASE_URL}/thank-you.html`;
    const cancelUrl = `${BASE_URL}/cancel.html`;
    const errorUrl = `${BASE_URL}/error.html`;

    const fields = {
      order_amount: amount,
      merchant: MERCHANT_ID,
      currency: 'VND',
      operation: 'PURCHASE',
      order_description: `${product || 'Thanh toan don hang'} | Order #${orderId}`,
      order_invoice_number: invoiceNumber,
      customer_id: email,
      success_url: successUrl,
      error_url: errorUrl,
      cancel_url: cancelUrl
    };

    const signedFields = [
      'order_amount', 'merchant', 'currency', 'operation',
      'order_description', 'order_invoice_number', 'customer_id',
      'success_url', 'error_url', 'cancel_url'
    ];
    const signedString = signedFields
      .map(f => `${f}=${fields[f]}`)
      .join(',');

    const signature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(signedString)
      .digest('base64');
res.json({
      success: true,
      sepayUrl: SEPAY_URL,
      fields: {
        ...fields,
        signature: signature
      }
    });

  } catch (err) {
    console.error('Error generating signature:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ====== TEST EMAIL CONNECTION ======
app.get('/test-email', async (req, res) => {
  try {
    const to = 'admin@t-licx.com';
    const subject = 'Test Resend Connection';
    const html = `
      <h1>Kết nối Resend thành công!</h1>
      <p>Đây là email thử nghiệm gửi từ hệ thống website <strong>t-licx.com</strong>.</p>
      <p>Thời gian gửi: ${new Date().toLocaleString()}</p>
    `;

    const result = await sendEmail({ to, subject, html });

    if (result.success) {
      res.json({
        success: true,
        message: `Email thử nghiệm đã được gửi tới ${to} thành công!`,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Gửi email thử nghiệm thất bại.',
        error: result.error
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi gửi email.',
      error: err.message
    });
  }
});

// ====== START SERVER ======
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin.html`);
  console.log(`Checkout: http://localhost:${PORT}/checkout.html`);
});
