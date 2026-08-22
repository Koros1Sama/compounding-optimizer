// Vercel Serverless Telegram Bot Handler
module.exports = async function handler(req, res) {
  // Only process POST requests from Telegram Webhook
  if (req.method !== 'POST') {
    return res.status(200).json({ message: 'Alpha Calc Bot Webhook is running on Vercel 🚀' });
  }

  const token = process.env.BOT_TOKEN;
  if (!token) {
    console.error('BOT_TOKEN environment variable is missing.');
    return res.status(500).json({ error: 'BOT_TOKEN is not set' });
  }

  // Dynamically generate the Web App URL from the request host to avoid hardcoding
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'compounding-optimizer.vercel.app';
  const WEB_APP_URL = `https://${host}/`;

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  try {
    // Vercel automatically parses JSON bodies
    const update = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    // Helper: Send Telegram API Request
    async function sendTg(method, data) {
      const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!result.ok) {
        console.error(`Telegram API error on ${method}:`, result);
      }
      return result;
    }

    // Helper: Answer Callback Query
    async function answerCallback(id) {
      if (!id) return;
      await sendTg('answerCallbackQuery', { callback_query_id: id });
    }

    // 1. Handle Callback Queries (Button clicks)
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message?.chat?.id;
      const data = cb.data;

      await answerCallback(cb.id);

      if (data === 'help') {
        const helpText = `💡 <b>دليل استخدام حاسبة Alpha Calc:</b>\n\n` +
          `🎯 <b>الهدف الأساسي:</b> حساب التوقيت الرياضي المثالي لإعادة تدوير الأرباح وتفادي استنزاف الرسوم.\n\n` +
          `💰 <b>الرقم المستهدف:</b> هنا تضع الحد المثالي الذي تريد أن تتوقف عنده (سحب الأرباح وضمها لرأس المال لتسريع التضاعف وتفادي هدر الرسوم).\n\n` +
          `📈 <b>العائد اليومي:</b> اختياري، اكتب نسبة الأرباح اليومية التقريبية.\n` +
          `💸 <b>رسوم المعاملة ($):</b> تكلفة سحب أو إعادة تدوير الأرباح (1$).\n\n` +
          `⚡ <b>النتائج الفورية:</b> يحسب لك النظام بدقة عدد الأيام والساعات المثالية للتدوير، وكم يوماً تحتاج لمضاعفة محفظتك (2X / 4X / 8X).\n\n` +
          `✍️ <b>شرح الدليل:</b> حسام الأحمدي (@x_a_l_p_h_a)\n\n` +
          `👇 اضغط على الزر أدناه لتجربة الحاسبة الآن:`;

        await sendTg('sendMessage', {
          chat_id: chatId,
          text: helpText,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🚀 فتح حاسبة Alpha Calc', web_app: { url: WEB_APP_URL } }],
              [{ text: '🔄 العودة للقائمة الرئيسية', callback_data: 'start' }],
            ],
          },
        });
      } else if (data === 'start') {
        const name = cb.from?.first_name || 'صديقنا';
        await sendWelcomeMessage(chatId, name);
      }

      return res.status(200).json({ ok: true });
    }

    // 2. Handle Messages
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat?.id;
      const text = (msg.text || '').trim();
      const name = msg.from?.first_name || 'صديقنا';

      if (!chatId) return res.status(200).json({ ok: true });

      if (text.startsWith('/start')) {
        await sendWelcomeMessage(chatId, name);
      } else if (text.startsWith('/app')) {
        await sendTg('sendMessage', {
          chat_id: chatId,
          text: `⚡ <b>حاسبة Alpha Calc جاهزة!</b>\n\nاضغط على الزر أدناه لفتح الحاسبة بكامل مميزاتها:`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🚀 فتح حاسبة Alpha Calc', web_app: { url: WEB_APP_URL } }],
            ],
          },
        });
      } else if (text.startsWith('/help')) {
        const helpText = `💡 <b>دليل استخدام حاسبة Alpha Calc:</b>\n\n` +
          `💰 <b>الرقم المستهدف:</b> هنا تضع الحد المثالي الذي تريد أن تتوقف عنده (سحب الأرباح يفضل أن يكون عند الوصول إليه لتجنب هدر الرسوم).\n\n` +
          `📝 <b>المتغيرات الأخرى:</b> يرجى الرجوع إلى الدليل التفاعلي داخل الحاسبة لمزيد من الشرح المفصل.\n\n` +
          `👇 اضغط لفتح الحاسبة مباشرة:`;

        await sendTg('sendMessage', {
          chat_id: chatId,
          text: helpText,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🚀 فتح حاسبة Alpha Calc', web_app: { url: WEB_APP_URL } }],
            ],
          },
        });
      } else {
        // Any other text
        await sendTg('sendMessage', {
          chat_id: chatId,
          text: `مرحباً بك ${escapeHtml(name)}! 👋\n\nأنا بوت <b>Alpha Calc</b> المخصص لحساب التراكم المالي ومضاعفة الأرباح.\n\n👇 يمكنك فتح الحاسبة مباشرة بالضغط على الزر أدناه:`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🚀 فتح حاسبة Alpha Calc', web_app: { url: WEB_APP_URL } }],
              [{ text: '💡 عرض دليل الاستخدام', callback_data: 'help' }],
            ],
          },
        });
      }
    }

    async function sendWelcomeMessage(chatId, firstName) {
      const safeName = escapeHtml(firstName || 'صديقنا');
      const welcome = `مرحباً بك يا <b>${safeName}</b> في <b>Alpha Calc</b> 👋✨\n\n` +
        `أداة الذكاء المالي لحساب وتطوير استراتيجيتك الاستثمارية للنمو السريع ومضاعفة رأس المال بأفضل تكلفة ووقت ممكنين.\n\n` +
        `📌 <b>المميزات الأساسية:</b>\n` +
        `• حساب دقيق لأوقات التدوير والسحب المثالية.\n` +
        `• خصم تكلفة الرسوم تلقائياً من العائد.\n` +
        `• جدول تفصيلي لمسار مضاعفة المحفظة (2X, 4X...).\n` +
        `• رسوم بيانية تفاعلية متجاوبة.\n\n` +
        `👇 <b>ابدأ الآن بضغطة واحدة:</b>`;

      await sendTg('sendMessage', {
        chat_id: chatId,
        text: welcome,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🚀 فتح حاسبة Alpha Calc', web_app: { url: WEB_APP_URL } }],
            [{ text: '💡 عرض دليل الاستخدام والمصطلحات', callback_data: 'help' }],
          ],
        },
      });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
};
