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
        const helpText = `💡 <b>دليل استخدام منظومة Alpha Calc:</b>\n\n` +
          `🎯 <b>1. الرقم المستهدف (Target):</b>\n` +
          `الرقم الذهبي الذي تحسبه الخوارزمية؛ عند وصول أرباحك في البوت لهذا الرقم، تسحبها فوراً وتعيد إيداعها لتنضم لرأس المال وتسرّع وتيرة التضاعف.\n\n` +
          `💵 <b>2. رأس المال الأساسي (CAPITAL):</b>\n` +
          `إجمالي المبلغ المستثمر حالياً؛ انسخه من تحت كلمة CAPITAL في البوت. (يجب تحديثه بعد كل عملية تدوير).\n\n` +
          `📈 <b>3. العائد اليومي التقريبي (%):</b>\n` +
          `حقل اختياري يتيح للحاسبة تقدير عدد الأيام والشهور المتوقعة لاكتمال الدورة ومضاعفة المحفظة.\n\n` +
          `💸 <b>4. رسوم المعاملة ($1):</b>\n` +
          `الخوارزمية تأخذ دولار السحب الثابت بالحسبان وتخصمه تلقائياً لضمان حسابات أرباح صافية 100%.\n\n` +
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
        const helpText = `💡 <b>دليل استخدام منظومة Alpha Calc:</b>\n\n` +
          `🎯 <b>1. الرقم المستهدف (Target):</b>\n` +
          `الرقم الذهبي الذي تحسبه الخوارزمية؛ عند وصول أرباحك في البوت لهذا الرقم، تسحبها فوراً وتعيد إيداعها لتنضم لرأس المال وتسرّع وتيرة التضاعف.\n\n` +
          `💵 <b>2. رأس المال الأساسي (CAPITAL):</b>\n` +
          `إجمالي المبلغ المستثمر حالياً؛ انسخه من تحت كلمة CAPITAL في البوت. (يجب تحديثه بعد كل عملية تدوير).\n\n` +
          `📈 <b>3. العائد اليومي التقريبي (%):</b>\n` +
          `حقل اختياري يتيح للحاسبة تقدير عدد الأيام والشهور المتوقعة لاكتمال الدورة ومضاعفة المحفظة.\n\n` +
          `💸 <b>4. رسوم المعاملة ($1):</b>\n` +
          `الخوارزمية تأخذ دولار السحب الثابت بالحسبان وتخصمه تلقائياً لضمان حسابات أرباح صافية 100%.\n\n` +
          `✍️ <b>شرح الدليل:</b> حسام الأحمدي (@x_a_l_p_h_a)\n\n` +
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
      const welcome = `مرحباً بك يا <b>${safeName}</b> في <b>Alpha Calc</b> 🚀✨\n\n` +
        `أداة الذكاء المالي لحساب <b>الحد الرياضي الأمثل لإعادة تدوير الأرباح</b> وتحقيق أقصى وتيرة نمو تراكمي (الأرباح المركبة).\n\n` +
        `🔬 <b>الخوارزمية والمعادلة الرياضية:</b>\n` +
        `• <b>معضلة رسوم السحب ($1):</b> في بوتات التداول، الأرباح اليومية تتوقف عن التوليد إذا بقيت في خانة الأرباح، ولكن سحبها إلى Binance ثم إعادتها يخصم $1 كرسوم ثابتة.\n` +
        `• السحب المبكر يلتهم أرباحك في الرسوم، والتأخر الزائد يفوّت عليك تضاعف الأرباح.\n` +
        `• <b>المعادلة المتبعة:</b> ?\n` +
        `  لتحدد لك بدقة متناهية الرقم المستهدف (بالدولار) والوقت المثالي لإعادة التدوير بأعلى عائد صافٍ وتفادي هدر الرسوم.\n\n` +
        `📊 <b>مميزات الأداة:</b>\n` +
        `• حساب فوري للرقم الذهبي المستهدف.\n` +
        `• جدول تفصيلي ومسار زمني لمضاعفة رأس المال (2X, 4X, 8X...).\n` +
        `• رسم بياني تفاعلي يقارن نموك مع التدوير وبدونه.\n` +
        `• حاسبة متابعة حية لتقدم أرباحك الحالية.\n\n` +
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
