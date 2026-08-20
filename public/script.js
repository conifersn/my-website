/* ============================================================
   T-licX Chatbot — Sales Script v1.0
   Kịch bản: sales_script.md
   Form mua/tư vấn: https://forms.gle/QaoG18nbWeuzT3J37
   ============================================================ */

(function () {
  'use strict';

  /* ── Cấu hình ─────────────────────────────────────────── */
  var FORM_URL = 'https://forms.gle/QaoG18nbWeuzT3J37';
  var BOT_DELAY_SHORT = 600;   // ms — delay ngắn trước khi trả lời
  var BOT_DELAY_LONG  = 1100;  // ms — delay dài cho câu trả lời phức tạp
  var GREETING_DELAY  = 1200;  // ms — delay trước khi chào lần đầu

  /* ── Dữ liệu kịch bản ────────────────────────────────── */

  // Câu chào lần đầu
  var MSG_GREETING = 'Chào bạn! 👋 Mình là T-licX — đội ngũ tư vấn license Windows cho doanh nghiệp nhỏ và startup.\n\nBạn đang phân vân chọn gói Windows cho team, hay muốn tham khảo bảng giá theo số máy? Mình sẽ tư vấn nhanh, không rắc rối, không bán hàng ép. Cứ hỏi thoải mái nhé!';

  // Quick reply gợi ý ban đầu
  var QUICK_INITIAL = [
    { text: '💰 Xem bảng giá', key: 'gia' },
    { text: '🔍 Pro vs Home?', key: 'pro_vs_home' },
    { text: '🔑 Key có hợp lệ không?', key: 'kich_hoat' },
    { text: '🖥️ Cài đặt + hỗ trợ', key: 'cai_dat' },
    { text: '🧾 Có xuất VAT không?', key: 'vat' },
    { text: '📦 Key điện tử vs hộp FPP', key: 'esd_vs_fpp' },
    { text: '🖥️ Dùng Mac có cần mua không?', key: 'mac' },
    { text: '🔢 1 key dùng nhiều máy?', key: 'nhieu_may' },
    { text: '🏆 Tại sao chọn T-licX?', key: 'tai_sao' },
    { text: '📋 Điền form tư vấn', key: 'form' },
  ];

  // Kho câu trả lời theo kịch bản
  var RESPONSES = {
    kich_hoat: {
      text: 'Key của T-licX là bản quyền chính hãng từ kênh phân phối được Microsoft ủy quyền. Kích hoạt thành công 100% ngay lần đầu.\n\nNếu bạn gặp lỗi, đội ngũ support sẽ xử lý trong vòng 24h. Cam kết hoàn tiền nếu key không kích hoạt được.\n\nMình có khách hàng mua từ năm ngoái, dùng tới giờ vẫn ngon lành. Không lo bị khóa đâu. 😊',
      cta: true
    },
    pro_vs_home: {
      text: 'Pro hơn Home 3 tính năng quan trọng với doanh nghiệp:\n\n🔐 <b>BitLocker</b> — mã hóa ổ cứng, bảo vệ dữ liệu nếu mất máy\n🖥️ <b>Remote Desktop</b> — nhân viên làm việc từ xa dễ dàng\n🏢 <b>Domain Join + Group Policy</b> — quản lý tập trung nhiều máy\n\nVới team từ 5 người trở lên, Pro đáng giá hơn số tiền chênh. Bạn không muốn đến lúc cần mới phát hiện Home không hỗ trợ và phải nâng cấp tốn gấp đôi.\n\nBạn đang có bao nhiêu máy? Mình tính luôn cho xem.',
      cta: true
    },
    esd_vs_fpp: {
      text: '📧 <b>Key điện tử (ESD)</b>: nhận key qua email, kích hoạt ngay. Tiện, nhanh, rẻ hơn.\n\n📦 <b>Hộp FPP (Retail)</b>: có hộp đẹp, tem chống giả. Dễ chuyển sang máy khác khi đổi thiết bị.\n\nT-licX có cả hai hình thức. Nếu bạn cần xuất hóa đơn và tem phân phối chính ngạch — chọn FPP. Nếu cần nhanh và tiện — chọn key điện tử.\n\nTùy nhu cầu thôi, mình tư vấn giải pháp phù hợp cho bạn. 😊',
      cta: true
    },
    nhieu_may: {
      text: 'Không bạn ơi. Mỗi license Windows chỉ dùng cho 1 máy.\n\nNếu bạn cần quản lý nhiều máy, T-licX có gói Volume Licensing với giá ưu đãi theo số lượng. Điền form bên dưới để mình tư vấn giải pháp phù hợp nhé!',
      cta: true
    },
    mac: {
      text: 'Có, nếu bạn cài Windows song song (Bootcamp) hoặc dùng máy ảo (Parallels, VMware) để chạy phần mềm chỉ có trên Windows.\n\nMỗi máy ảo hoặc phân vùng Windows cần 1 license riêng. T-licX hỗ trợ tư vấn cách cài đặt và kích hoạt trên Mac — khách hàng Mac của mình làm nhiều rồi, không khó đâu. 😉',
      cta: true
    },
    gia: {
      text: 'Có bảng giá công khai luôn đây:\n\n<b>Windows 11 Pro:</b>\n• 1 máy lẻ: 4.000.000₫\n• Gói 5–20 máy: 3.800.000₫/máy\n• Gói 21–50 máy: 3.600.000₫/máy\n\n<b>Combo Win 11 Pro + Office 2021:</b>\n• 1 máy lẻ: 7.500.000₫\n• Gói 5–20 máy: 7.000.000₫/máy\n• Gói 21–50 máy: 6.500.000₫/máy\n\nGiá đã bao gồm VAT, hỗ trợ cài đặt, bảo hành trọn đời. Không phí ẩn.\n\nTeam bạn bao nhiêu máy? Mình tính tổng chi phí cụ thể cho bạn luôn. 👇',
      cta: true
    },
    vat: {
      text: 'Có bạn. T-licX xuất hóa đơn VAT đỏ đầy đủ, có tem phân phối chính ngạch.\n\nKhách hàng của mình toàn doanh nghiệp, đi kiểm toán không lo gì đâu. Bạn cần hóa đơn thì mình xuất ngay sau khi thanh toán. 👍',
      cta: true
    },
    kiem_tra: {
      text: 'Cách kiểm tra siêu nhanh:\n\nMở CMD (Command Prompt) và gõ:\n<code>slmgr /dli</code>\n\nSẽ hiện ra dòng "Product Name" — nếu thấy "Home" mà team bạn trên 5 người, khả năng cao bạn nên nâng cấp lên Pro đấy.\n\nCần kiểm tra dùm không? Gửi mình ảnh màn hình, mình đọc giúp cho. 😊',
      cta: false
    },
    cai_dat: {
      text: 'Có chứ! T-licX hỗ trợ cài đặt từ xa, hướng dẫn từng bước. Khách hàng startup của mình nhiều bạn không có IT riêng, vẫn cài ngon lành.\n\n💬 <i>"Bọn mình là startup, không có IT riêng, sợ nhất là mua xong không biết cài. T-licX support tận tình, cài từ xa, hướng dẫn từng bước."</i>\n\nBạn cứ yên tâm, mình support tới khi nào chạy được mới thôi. 💪',
      cta: true
    },
    tai_sao: {
      text: '3 lý do đơn giản thôi:\n\n📊 <b>Giá niêm yết công khai</b> — bạn biết ngay tổng chi phí, không phải chờ báo giá 2–3 ngày.\n\n🔧 <b>Support đầy đủ</b> — cài đặt, bảo hành, xử lý lỗi. Không có IT riêng cũng không sao.\n\n🧾 <b>Minh bạch</b> — VAT, hóa đơn, tem phân phối chính ngạch rõ ràng.\n\nNhiều chỗ giá rẻ hơn nhưng không hóa đơn, không support, key không rõ nguồn gốc. T-licX làm khác ở chỗ bạn biết mình đang mua gì, giá bao nhiêu, và được hỗ trợ gì.',
      cta: true
    },
    form: {
      text: 'Mình có form đăng ký tư vấn riêng:\n\nĐiền thông tin cơ bản — mình gửi trước cho bạn bảng giá chi tiết và bản so sánh Home vs Pro. Không bắt mua, không gọi điện spam, chỉ gửi tài liệu để bạn tham khảo.\n\nSau đó bạn có thể quyết định sau — không áp lực. Ok nha? 👇',
      cta: true,
      forceCta: true
    },
    so_sanh: {
      text: 'Mình hiểu. Nhưng nếu bạn chỉ so giá mà không so chất lượng, rất dễ mua nhầm.\n\nT-licX có giá niêm yết rõ ràng, bao gồm VAT và support trọn đời. Bạn mua rẻ hơn vài trăm nghìn nhưng không hóa đơn, không support, rủi ro về sau — tính lại thấy không đáng.\n\n💬 <i>"Hóa đơn đầy đủ, hỗ trợ cài đặt nhanh gọn. Sẽ tiếp tục hợp tác."</i>\n\nNếu bạn muốn, mình so sánh chi tiết hai lựa chọn cho bạn xem. Ok không?',
      cta: true
    },
    giao_hang: {
      text: '⚡ <b>Key điện tử</b>: gửi ngay trong vòng 15 phút sau thanh toán.\n\n📦 <b>Hộp FPP</b>: giao hàng 1–2 ngày tùy khu vực.\n\nNhiều khách hàng startup mua key điện tử vì cần kích hoạt ngay. Bạn cần gấp không? Mình ưu tiên xử lý nhanh cho bạn. 🚀',
      cta: true
    },
    suy_nghi: {
      text: 'Ok bạn. Mình không thúc ép. Nhưng để bạn có đủ thông tin trước khi quyết định, mình gửi thêm:\n\n📄 Bảng so sánh Home vs Pro chi tiết (có số tiền cụ thể)\n💰 Bảng giá tổng hợp cho team bạn\n\nChốt: bạn cứ tham khảo, khi nào sẵn sàng mình support tiếp nhé.',
      cta: true
    },
    default: {
      text: 'Cảm ơn bạn đã nhắn! 😊 Để mình hỗ trợ tốt hơn, bạn có thể chọn một trong các chủ đề bên dưới, hoặc để lại thông tin — mình sẽ liên hệ tư vấn trực tiếp nhé.',
      cta: true
    }
  };

  /* ── Từ khóa nhận diện ───────────────────────────────── */
  var KEYWORDS = [
    { keys: ['kích hoạt', 'kich hoat', 'có hợp lệ', 'bị khóa', 'key có', 'nguồn gốc', 'thật không', 'hợp lệ', 'chính hãng', 'bản quyền'], res: 'kich_hoat' },
    { keys: ['pro', 'home', 'khác nhau', 'hơn home', 'nâng cấp', 'bitlocker', 'remote desktop', 'domain'], res: 'pro_vs_home' },
    { keys: ['key điện tử', 'esd', 'fpp', 'hộp', 'hoa don', 'tem', 'phân phối'], res: 'esd_vs_fpp' },
    { keys: ['nhiều máy', 'nhieu may', 'dùng chung', '1 key', 'một key', 'share', 'chia sẻ'], res: 'nhieu_may' },
    { keys: ['mac', 'macbook', 'apple', 'bootcamp', 'parallels', 'vmware', 'máy ảo'], res: 'mac' },
    { keys: ['giá', 'gia', 'bao nhiêu', 'bảng giá', 'chi phí', 'cost', 'price', 'tiền', 'tien', 'rẻ', 're', 'mấy', 'may tiền'], res: 'gia' },
    { keys: ['vat', 'hóa đơn', 'hoa don', 'thuế', 'kiểm toán', 'xuất hóa đơn', 'invoice'], res: 'vat' },
    { keys: ['kiểm tra', 'kiem tra', 'slmgr', 'cmd', 'đang dùng', 'bản gì', 'version'], res: 'kiem_tra' },
    { keys: ['cài đặt', 'cai dat', 'hỗ trợ', 'ho tro', 'support', 'không có it', 'it riêng', 'hướng dẫn', 'huong dan', 'giúp cài'], res: 'cai_dat' },
    { keys: ['tại sao', 'tai sao', 'vì sao', 'vi sao', 'lý do', 'khác biệt', 'why', 'so với', 'đối thủ', 'khác chỗ'], res: 'tai_sao' },
    { keys: ['form', 'đăng ký', 'dang ky', 'tư vấn', 'tu van', 'để lại', 'de lai', 'liên hệ', 'lien he', 'thông tin', 'thong tin'], res: 'form' },
    { keys: ['chỗ khác', 'bên kia', 'rẻ hơn', 're hon', 'so sánh', 'cạnh tranh', 'compare'], res: 'so_sanh' },
    { keys: ['giao hàng', 'giao hang', 'bao lâu', 'bao lau', 'khi nào', 'khi nao', 'nhanh', 'gấp', 'gap', 'delivery'], res: 'giao_hang' },
    { keys: ['suy nghĩ', 'suy nghi', 'để sau', 'de sau', 'chưa quyết', 'chua quyet', 'tham khảo', 'cân nhắc'], res: 'suy_nghi' },
    { keys: ['xin chào', 'chao', 'hello', 'hi ', 'hey'], res: '_greet' },
    { keys: ['cảm ơn', 'cam on', 'thank', 'ok', 'được', 'duoc rồi', 'hiểu rồi'], res: '_thanks' },
    { keys: ['mua', 'đặt hàng', 'dat hang', 'đặt', 'order', 'mình muốn', 'minh muon', 'cần mua', 'quan tâm', 'quan tam'], res: '_buy' },
  ];

  /* ── State ───────────────────────────────────────────── */
  var state = {
    opened: false,
    greeted: false,
    messageCount: 0
  };

  /* ── DOM refs ─────────────────────────────────────────── */
  var toggleBtn   = document.getElementById('chat-toggle');
  var chatWindow  = document.getElementById('chat-window');
  var closeBtn    = document.getElementById('chat-close');
  var messagesEl  = document.getElementById('chat-messages');
  var quickWrap   = document.getElementById('chat-quick-wrap');
  var inputEl     = document.getElementById('chat-input');
  var sendBtn     = document.getElementById('chat-send');
  var badge       = document.getElementById('chat-badge');

  if (!toggleBtn || !chatWindow) return; // guard

  /* ── Helpers ─────────────────────────────────────────── */
  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showBadge() {
    if (!state.opened) badge.classList.add('visible');
  }

  function hideBadge() {
    badge.classList.remove('visible');
  }

  // Thêm bubble tin nhắn
  function addBubble(text, sender) {
    var div = document.createElement('div');
    div.className = 'chat-bubble ' + sender;
    // Cho phép HTML đơn giản trong câu bot (bold, italic, code)
    if (sender === 'bot') {
      div.innerHTML = text.replace(/\n/g, '<br>');
    } else {
      div.textContent = text;
    }
    messagesEl.appendChild(div);
    scrollToBottom();
    return div;
  }

  // Hiển thị typing indicator rồi xóa sau delay
  function showTyping(delay, callback) {
    var typing = document.createElement('div');
    typing.className = 'chat-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    typing.id = 'chat-typing-indicator';
    messagesEl.appendChild(typing);
    scrollToBottom();
    setTimeout(function () {
      var el = document.getElementById('chat-typing-indicator');
      if (el) el.remove();
      callback();
    }, delay);
  }

  // CTA button HTML
  function buildCtaHTML(forceCta) {
    if (forceCta) {
      return '<br><a class="chat-cta-btn" href="' + FORM_URL + '" target="_blank" rel="noopener">📋 Điền form tư vấn ngay</a>';
    }
    return '<br><a class="chat-cta-btn" href="' + FORM_URL + '" target="_blank" rel="noopener">✍️ Đăng ký tư vấn miễn phí</a>';
  }

  // Render quick reply buttons
  function renderQuickReplies(items) {
    quickWrap.innerHTML = '';
    items.forEach(function (item) {
      var btn = document.createElement('button');
      btn.className = 'chat-quick-btn';
      btn.textContent = item.text;
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        handleUserInput(item.text, item.key);
      });

      quickWrap.appendChild(btn);
    });
  }

  function clearQuickReplies() {
    quickWrap.innerHTML = '';
  }

  // Quick replies sau khi bot trả lời
  var QUICK_FOLLOWUP = [
    { text: '💰 Bảng giá', key: 'gia' },
    { text: '📋 Đăng ký tư vấn', key: 'form' },
    { text: '🔑 Key có hợp lệ không?', key: 'kich_hoat' },
    { text: '🏆 Tại sao chọn T-licX?', key: 'tai_sao' },
  ];

  /* ── Logic tìm câu trả lời ───────────────────────────── */
  function findResponse(text, forceKey) {
    if (forceKey) {
      if (forceKey === '_buy' || forceKey === '_greet' || forceKey === '_thanks') {
        return forceKey;
      }
      if (RESPONSES[forceKey]) return forceKey;
    }

    var lower = text.toLowerCase();
    for (var i = 0; i < KEYWORDS.length; i++) {
      var entry = KEYWORDS[i];
      for (var j = 0; j < entry.keys.length; j++) {
        if (lower.indexOf(entry.keys[j]) !== -1) {
          return entry.res;
        }
      }
    }
    return 'default';
  }

  /* ── Xử lý input người dùng ─────────────────────────── */
  function handleUserInput(text, forceKey) {
    var trimmed = (text || '').trim();
    if (!trimmed) return;

    clearQuickReplies();
    addBubble(trimmed, 'user');
    inputEl.value = '';
    state.messageCount++;

    var resKey = findResponse(trimmed, forceKey);

    // Special responses
    if (resKey === '_greet') {
      showTyping(BOT_DELAY_SHORT, function () {
        addBubble('Chào bạn! 👋 Mình có thể giúp gì cho bạn hôm nay?', 'bot');
        renderQuickReplies(QUICK_INITIAL);
      });
      return;
    }

    if (resKey === '_thanks') {
      showTyping(BOT_DELAY_SHORT, function () {
        addBubble('Không có gì bạn ơi! 😊 Nếu cần thêm thông tin, cứ hỏi mình nhé. Chúc bạn ngày tốt lành!', 'bot');
        renderQuickReplies(QUICK_FOLLOWUP);
      });
      return;
    }

    if (resKey === '_buy') {
      showTyping(BOT_DELAY_LONG, function () {
        var bubble = document.createElement('div');
        bubble.className = 'chat-bubble bot';
        bubble.innerHTML = 'Tuyệt vời! 🎉 Bạn có thể đăng ký tư vấn để mình tính tổng chi phí cụ thể và tư vấn giải pháp phù hợp nhé.'
          + buildCtaHTML(true);
        messagesEl.appendChild(bubble);
        scrollToBottom();
        renderQuickReplies(QUICK_FOLLOWUP);
      });
      return;
    }

    // Normal responses
    var resp = RESPONSES[resKey] || RESPONSES['default'];
    var delay = (resKey === 'default') ? BOT_DELAY_SHORT : BOT_DELAY_LONG;

    showTyping(delay, function () {
      var bubble = document.createElement('div');
      bubble.className = 'chat-bubble bot';
      var html = resp.text.replace(/\n/g, '<br>');
      if (resp.cta) {
        html += buildCtaHTML(resp.forceCta || false);
      }
      bubble.innerHTML = html;
      messagesEl.appendChild(bubble);
      scrollToBottom();
      renderQuickReplies(QUICK_FOLLOWUP);
    });
  }

  /* ── Mở / đóng chat window ───────────────────────────── */
  function openChat() {
    chatWindow.classList.add('open');
    state.opened = true;
    hideBadge();
    inputEl.focus();

    // Chào lần đầu
    if (!state.greeted) {
      state.greeted = true;
      showTyping(GREETING_DELAY, function () {
        addBubble(MSG_GREETING, 'bot');
        renderQuickReplies(QUICK_INITIAL);
      });
    }
  }

  function closeChat() {
    chatWindow.classList.remove('open');
  }

  /* ── Event listeners ─────────────────────────────────── */
  toggleBtn.addEventListener('click', function () {
    if (chatWindow.classList.contains('open')) {
      closeChat();
    } else {
      openChat();
    }
  });

  closeBtn.addEventListener('click', closeChat);

  sendBtn.addEventListener('click', function () {
    handleUserInput(inputEl.value);
  });

  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUserInput(inputEl.value);
    }
  });

  // Đóng khi click ngoài
  document.addEventListener('click', function (e) {
    if (
      chatWindow.classList.contains('open') &&
      !chatWindow.contains(e.target) &&
      !toggleBtn.contains(e.target)
    ) {
      closeChat();
    }
  });

  /* ── Badge: hiện sau 3 giây nếu chưa mở chat ─────────── */
  setTimeout(function () {
    if (!state.opened) {
      showBadge();
    }
  }, 3000);

  /* ── Waitlist form - call API /api/waitlist ──────────── */
  var emailForm = document.getElementById('email-registration-form');
  if (emailForm) {
    emailForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var name    = document.getElementById('b2b-name').value.trim();
      var email   = document.getElementById('b2b-email').value.trim();
      var phone   = document.getElementById('b2b-phone').value.trim();
      var message = document.getElementById('b2b-message').value.trim();

      try {
        const response = await fetch('/api/waitlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: name,
            email: email,
            phone: phone,
            message: message,
            source: 'website_waitlist'
          })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          alert('Cảm ơn bạn đã đăng ký! Đội ngũ T-licX sẽ liên hệ với bạn trong vòng 24 giờ.');
          emailForm.reset();
        } else {
          alert('Có lỗi xảy ra: ' + (result.message || 'Vui lòng thử lại sau.'));
        }
      } catch (error) {
        console.error('Lỗi khi gửi form:', error);
        alert('Lỗi kết nối: ' + error.message + '. Vui lòng thử lại hoặc gửi email trực tiếp đến conifers.n@gmail.com');
      }
    });
  }

})();
