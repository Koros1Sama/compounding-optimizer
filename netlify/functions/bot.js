// Netlify Serverless Telegram Bot Handler
exports.handler = async (event) => {
  // Only process POST requests from Telegram Webhook
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Alpha Calc Bot Webhook is running 🚀' }),
    };
  }

  const token = process.env.BOT_TOKEN;
  if (!token) {
    console.error('BOT_TOKEN environment variable is missing.');
    return { statusCode: 200, body: JSON.stringify({ error: 'BOT_TOKEN is not set' }) };
  }

  const WEB_APP_URL = 'https://velvety-axolotl-3e7cba.netlify.app/?v=1787318764';

  try {
    const update = JSON.parse(event.body || '{}');

    // Helper: Send Telegram API Request
    async function sendTg(method, data) {
      const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
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
        const helpText = `ℹ️ *دليل استخدام محسّن Alpha Calc:*\n\n` +
          `🎯 *الهدف الأساسي:* حساب التوقيت الرياضي المثالي لإعادة تدوير الأرباح وتفادي استنزاف الرسوم.\n\n` +
          `📌 *كيف يعمل المحسّن؟*\n` +
          `1️⃣ *أدخل رأس المال:* المبلغ الإجمالي المستثمر حالياً.\n` +
          `2️⃣ *أدخل العائد اليومي:* نسبة الأرباح اليومية المتوقعة (%).\n` +
          `3️⃣ *أدخل رسوم المعاملة ($):* تكلفة سحب أو إعادة تدوير الأرباح.\n\n` +
          `⚡ *النتائج الفورية:* يحسب لك النظام بدقة عدد الأيام والساعات المثالية للتدوير، وكم يوماً تحتاج لمضاعفة محفظتك (2X / 4X / 8X).\n\n` +
          `✍️ *إعداد وشرح الدليل:* حسام الأحمدي (@x\_a\_l\_p\_h\_a)\n\n` +
          `👇 اضغط على الزر أدناه لتجربة الحاسبة الآن:`;

        await sendTg('sendMessage', {
          chat_id: chatId,
          text: helpText,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🚀 فتح تطبيق Alpha Calc', web_app: { url: WEB_APP_URL } }],
              [{ text: '« العودة للرئيسية', callback_data: 'start' }],
            ],
          },
        });
      } else if (data === 'start') {
        const name = cb.from?.first_name || 'صديقنا';
        await sendWelcomeMessage(chatId, name);
      }

      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    // 2. Handle Messages
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat?.id;
      const text = (msg.text || '').trim();
      const name = msg.from?.first_name || 'صديقنا';

      if (!chatId) return { statusCode: 200, body: JSON.stringify({ ok: true }) };

      if (text.startsWith('/start')) {
        await sendWelcomeMessage(chatId, name);
      } else if (text.startsWith('/app')) {
        await sendTg('sendMessage', {
          chat_id: chatId,
          text: `⚡ *تطبيق Alpha Calc جاهز!*\n\nاضغط على الزر أدناه لفتح الحاسبة بكامل مميزاتها:`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🚀 فتح الحاسبة الآن', web_app: { url: WEB_APP_URL } }],
            ],
          },
        });
      } else if (text.startsWith('/help')) {
        const helpText = `ℹ️ *دليل استخدام محسّن Alpha Calc:*\n\n` +
          `🎯 *الهدف الأساسي:* حساب التوقيت الرياضي المثالي لإعادة تدوير الأرباح وتفادي استنزاف الرسوم.\n\n` +
          `📌 *المعادلات المدمجة:* تعتمد على التحليل الرياضي لحساب العائد المركب الصافي مع خصم رسوم الشبكة.\n\n` +
          `👇 اضغط لفتح الحاسبة مباشرة:`;

        await sendTg('sendMessage', {
          chat_id: chatId,
          text: helpText,
          parse_mode: 'Markdown',
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
          text: `مرحباً ${name}! 👋\n\nأنا بوت *Alpha Calc* المخصص لحساب الفائدة المركبة ومضاعفة الأرباح.\n\n👇 يمكنك فتح الحاسبة مباشرة عبر الزر أدناه:`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🚀 فتح تطبيق Alpha Calc', web_app: { url: WEB_APP_URL } }],
              [{ text: 'ℹ️ شرح طريقة الاستخدام', callback_data: 'help' }],
            ],
          },
        });
      }
    }

    async function sendWelcomeMessage(chatId, firstName) {
      const welcome = `مرحباً بك يا *${firstName}* في *Alpha Calc* 🤖⚡\n\n` +
        `أداتك الذكية لتحليل وتخطيط استراتيجيات النمو المالي ومضاعفة رأس المال وإعادة التدوير المركب بأعلى دقة رياضية.\n\n` +
        `✨ *المميزات الرئيسية:*\n` +
        `• حساب توقيت التدوير المثالي بالساعات والأيام.\n` +
        `• خصم تكلفة الرسوم تلقائياً من العائد.\n` +
        `• جدول تفصيلي لمسار مضاعفة المحفظة (2X, 4X...).\n` +
        `• رسوم بيانية تفاعلية متجاوبة.\n\n` +
        `✍️ *إعداد وشرح الدليل:* حسام الأحمدي (@x\_a\_l\_p\_h\_a)\n\n` +
        `👇 *ابدأ الآن بضغطة واحدة:*`;

      await sendTg('sendMessage', {
        chat_id: chatId,
        text: welcome,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🚀 فتح حاسبة Alpha Calc', web_app: { url: WEB_APP_URL } }],
            [{ text: 'ℹ️ شرح الاستخدام والمعادلات', callback_data: 'help' }],
          ],
        },
      });
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (error) {
    console.error('Webhook error:', error);
    return { statusCode: 200, body: JSON.stringify({ error: error.message }) };
  }
};
