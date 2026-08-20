try {
  const { getOrderConfirmationEmail } = require('./lib/emailTemplates');
  console.log('✅ Module loaded successfully');
  
  const emailContent = getOrderConfirmationEmail({
    customerName: 'Nguyễn Văn A',
    productDetails: [{
      name: 'Windows 10/11 Pro Key',
      price: 2000,
      quantity: 1,
      subtotal: 2000
    }],
    amount: '2,000₫',
    orderId: 'T-123'
  });
  
  console.log('✅ Email content generated');
  console.log('Subject:', emailContent.subject);
  console.log('HTML length:', emailContent.html.length);
} catch (err) {
  console.error('❌ Error:', err.message);
  console.error('Stack:', err.stack);
}
