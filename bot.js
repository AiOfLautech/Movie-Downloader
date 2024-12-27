require("dotenv").config();
const { Telegraf } = require("telegraf");
const axios = require("axios");

const bot = new Telegraf(process.env.BOT_TOKEN);

// Store user data
const users = {};

// Owner's Telegram ID (replace with your Telegram ID)
const OWNER_ID = process.env.OWNER_ID;

// Command: /start
bot.start((ctx) => {
  const userId = ctx.from.id;
  const username = ctx.from.username || ctx.from.first_name || "User";
  
  if (!users[userId]) {
    users[userId] = { id: userId, username: username };
  }

  ctx.reply(
    "👋 Welcome to CineMindBot!\n\n" +
    "Here are the available commands:\n" +
    "🎥 `/download <movie_name>` - Search and download movies\n" +
    "📜 `/subtitle <movie_name>` - Download subtitles for movies\n" +
    "🔥 `/recommend` - Get trending movie recommendations\n" +
    "🎬 `/info <movie_name>` - Get detailed movie information\n" +
    "🌐 `/language` - View or change language preferences\n" +
    "📝 `/feedback` - Provide feedback or suggestions\n" +
    "🙋 `/owner` - Get bot owner's contact info\n" +
    "💳 `/donate` - Get donation details"
  );
});

// Command: /owner
bot.command("owner", (ctx) => {
  ctx.reply("🤖 Bot Owner:\nAI Of Lautech\n📞 WhatsApp: +2348089336992");
});

// Command: /feedback
bot.command("feedback", (ctx) => {
  ctx.reply(
    "We'd love your feedback! Please reply with one of the following:\n" +
    "- `Good` - If you like the bot\n" +
    "- `Bad` - If you dislike the bot\n" +
    "- `Suggestion <your_message>` - To share suggestions"
  );
});

// Handle feedback and send it to the owner's DM
bot.on("text", async (ctx) => {
  const userId = ctx.from.id;
  const message = ctx.message.text.toLowerCase();

  if (message === "good" || message === "bad" || message.startsWith("suggestion")) {
    const feedbackMessage = `Feedback received from ${ctx.from.username || ctx.from.first_name}:\n` + 
      `Message: ${ctx.message.text}`;
    await bot.telegram.sendMessage(OWNER_ID, feedbackMessage);
    ctx.reply("Thank you for your feedback! Your message has been sent to the bot owner.");
  }
});

// Command: /language
bot.command("language", (ctx) => {
  const userId = ctx.from.id;
  const currentLang = users[userId]?.language || "not set";
  
  ctx.reply(
    `🌐 Your current language preference is: ${currentLang}\n\n` +
    "Reply with one of the following to set your language:\n" +
    "- `English`\n" +
    "- `French`\n" +
    "- `Spanish`\n" +
    "- `German`\n" +
    "- `Hindi`"
  );
});

// Handle language change
bot.on("text", (ctx) => {
  const userId = ctx.from.id;
  const languages = ["english", "french", "spanish", "german", "hindi"];
  const text = ctx.message.text.toLowerCase();

  if (languages.includes(text)) {
    users[userId] = { ...users[userId], language: text };
    ctx.reply(`✅ Language preference updated to: ${text}`);
  }
});

// Command: /users (owner only)
bot.command("users", (ctx) => {
  if (ctx.from.id === parseInt(OWNER_ID)) {
    const userList = Object.values(users)
      .map((user) => `ID: ${user.id}, Username: ${user.username}`)
      .join("\n");
    ctx.reply(`👥 Registered Users:\n\n${userList || "No users found."}`);
  } else {
    ctx.reply("❌ This command is restricted to the bot owner.");
  }
});

// Command: /donate
bot.command("donate", (ctx) => {
  ctx.reply(
    "💳 If you'd like to donate, here are the details:\n" +
    "Bank Name: Moniepoint\n" +
    "Account Number: 8089336992\n" +
    "Account Name: Babalola Hephzibah Samuel\n\n" +
    "Thank you for your support! 🙏"
  );
});

// Command: /download
bot.command("download", async (ctx) => {
  const movieName = ctx.message.text.split(" ").slice(1).join(" ");
  if (!movieName) {
    return ctx.reply("⚠️ Please provide a movie name! Example: `/download Deadpool`");
  }

  try {
    ctx.reply(`🔍 Searching for "${movieName}"...`);

    const searchUrl = `https://api-site-2.vercel.app/api/sinhalasub/search?q=${encodeURIComponent(movieName)}`;
    const response = await axios.get(searchUrl);
    const movies = response.data.result || [];

    if (movies.length === 0) {
      return ctx.reply(`⚠️ No results found for "${movieName}".`);
    }

    const movieList = movies
      .slice(0, 10)
      .map(
        (movie, index) =>
          `${index + 1}. ${movie.title}\n🔗 Movie Link: ${movie.link}\n🔗 Download Link: https://pixeldrain.com/api/file/${movie.link}?download`
      )
      .join("\n\n");

    ctx.reply(`🎥 Search Results for "${movieName}":\n\n${movieList}`);
  } catch (error) {
    console.error("Error during movie search:", error.message);
    ctx.reply("❌ An error occurred while searching for the movie. Please try again.");
  }
});

// Command: /subtitle
bot.command("subtitle", async (ctx) => {
  const movieName = ctx.message.text.split(" ").slice(1).join(" ");
  if (!movieName) {
    return ctx.reply("⚠️ Please provide a movie name! Example: `/subtitle Deadpool`");
  }

  try {
    ctx.reply(`🔍 Searching subtitles for "${movieName}"...`);

    const searchUrl = `https://api.opensubtitles.com/api/v1/subtitles?query=${encodeURIComponent(movieName)}`;
    const response = await axios.get(searchUrl, {
      headers: { "Api-Key": process.env.OPENSUBTITLES_API_KEY },
    });
    const subtitles = response.data.data || [];

    if (subtitles.length === 0) {
      return ctx.reply(`⚠️ No subtitles found for "${movieName}".`);
    }

    const subtitleList = subtitles
      .slice(0, 10)
      .map(
        (subtitle, index) =>
          `${index + 1}. *${subtitle.attributes.language}*\n🔗 [Download Link](${subtitle.attributes.url})`
      )
      .join("\n\n");

    ctx.replyWithMarkdown(`📜 *Subtitle Results for "${movieName}":*\n\n${subtitleList}`);
  } catch (error) {
    console.error("Error during subtitle search:", error.message);
    ctx.reply("❌ An error occurred while searching for subtitles. Please try again.");
  }
});

// Webhook support for Render
if (process.env.RENDER_EXTERNAL_URL) {
  bot.telegram.setWebhook(`${process.env.RENDER_EXTERNAL_URL}/webhook`);
  bot.startWebhook("/webhook", null, process.env.PORT || 3000);
  console.log("🤖 CineMindBot running with webhook!");
} else {
  bot.launch().then(() => console.log("🤖 CineMindBot running with long polling!"));
}

// Graceful shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
