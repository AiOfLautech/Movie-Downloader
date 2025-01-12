require("dotenv").config(); // Load environment variables
const { Telegraf } = require("telegraf");
const axios = require("axios");

const bot = new Telegraf(process.env.BOT_TOKEN);
const ownerId = process.env.OWNER_ID; // Bot owner's Telegram user ID

// Temporary storage for user preferences (e.g., language)
const userLanguages = {};

// Command: /start
bot.start((ctx) => {
  ctx.reply(
    `👋 Welcome, ${ctx.from.first_name}!\n\n` +
      "This bot allows you to:\n" +
      "📽️ Search for movies with Sinhala subtitles.\n" +
      "📥 Get direct download links from PixelDrain.\n" +
      "💬 Send feedback and suggestions.\n\n" +
      "Use /help to see all available commands."
  );
});

// Command: /help
bot.help((ctx) => {
  ctx.reply(
    "📖 *Available Commands:*\n\n" +
      "1️⃣ /start - Start the bot\n" +
      "2️⃣ /help - View all commands\n" +
      "3️⃣ /language - Set your preferred language\n" +
      "4️⃣ /feedback - Send feedback or suggestions\n" +
      "5️⃣ /download <movie_name> - Search for movies and download links\n"
  );
});

// Command: /language
bot.command("language", (ctx) => {
  ctx.reply(
    "🌐 *Available Languages:*\n" +
      "1️⃣ English\n" +
      "2️⃣ Sinhala\n\n" +
      "Reply with your choice (e.g., 'English')."
  );
});

// Handle language selection
bot.on("text", (ctx) => {
  const text = ctx.message.text.toLowerCase();
  if (text === "english" || text === "sinhala") {
    userLanguages[ctx.from.id] = text;
    ctx.reply(`✅ Language set to ${text.charAt(0).toUpperCase() + text.slice(1)}.`);
  }
});

// Command: /feedback
bot.command("feedback", (ctx) => {
  ctx.reply(
    "📝 *We value your feedback!*\n\n" +
      "1️⃣ Reply 'Good' if you like the bot.\n" +
      "2️⃣ Reply 'Bad' if you dislike the bot.\n" +
      "3️⃣ Reply 'Suggestion <your_message>' to share your suggestions."
  );
});

// Handle feedback replies
bot.on("text", (ctx) => {
  const userId = ctx.from.id;
  const message = ctx.message.text.toLowerCase();

  if (message === "good") {
    ctx.reply("✅ Thank you for your positive feedback!");
    if (ownerId) bot.telegram.sendMessage(ownerId, `👍 Feedback from user ${userId}: Good`);
  } else if (message === "bad") {
    ctx.reply("⚠️ Sorry to hear that. Please share how we can improve.");
    if (ownerId) bot.telegram.sendMessage(ownerId, `👎 Feedback from user ${userId}: Bad`);
  } else if (message.startsWith("suggestion")) {
    const suggestion = message.split(" ").slice(1).join(" ");
    if (suggestion) {
      ctx.reply("✅ Thank you for your suggestion!");
      if (ownerId) bot.telegram.sendMessage(ownerId, `💡 Suggestion from user ${userId}: ${suggestion}`);
    } else {
      ctx.reply("⚠️ Please provide a suggestion. Example: 'Suggestion Add more features'.");
    }
  }
});

// Command: /download
bot.command("download", async (ctx) => {
  const movieName = ctx.message.text.split(" ").slice(1).join(" ");
  if (!movieName) {
    return ctx.reply("⚠️ Please provide a movie name! Example: `/download Deadpool`");
  }

  try {
    ctx.reply(`🔍 Searching for "${movieName}"...`);

    // Step 1: Fetch movie data from SinhalaSub API
    const sinhalaSearchUrl = `https://api-site-2.vercel.app/api/sinhalasub/search?q=${encodeURIComponent(movieName)}`;
    const sinhalaResponse = await axios.get(sinhalaSearchUrl);
    const movies = sinhalaResponse.data.result || [];

    if (movies.length === 0) {
      return ctx.reply(`⚠️ No results found for "${movieName}".`);
    }

    // Step 2: Display search results
    let movieList = "🎥 *Search Results:*\n\n";
    movies.forEach((movie, index) => {
      movieList += `*${index + 1}.* ${movie.title} (${movie.year})\n🔗 [More Info](${movie.link})\n\n`;
    });

    ctx.replyWithMarkdown(movieList);

    // Step 3: Prompt user for a file field (PixelDrain integration)
    ctx.reply("📥 *Do you have a file field (e.g., 'ABC123DEF') for PixelDrain?*\n\nIf yes, reply with the field to get the direct download link.");
  } catch (error) {
    console.error("Error during /download command:", error.message);
    ctx.reply("❌ An error occurred while searching for the movie. Please try again later.");
  }
});

// Handle PixelDrain field and provide a download link
bot.on("text", async (ctx) => {
  const field = ctx.message.text.trim();
  const fieldRegex = /^[A-Za-z0-9]{9}$/; // PixelDrain file field format

  if (fieldRegex.test(field)) {
    try {
      const pixelDrainUrl = `https://pixeldrain.com/api/file/${field}?download`;
      const response = await axios.get(pixelDrainUrl);

      if (response.data.success === false) {
        return ctx.reply("⚠️ The requested file could not be found. Please check the field and try again.");
      }

      ctx.replyWithMarkdown(
        `📥 *Direct Download Link:*\n\n[Click here to download](${pixelDrainUrl})`,
        { disable_web_page_preview: true }
      );
    } catch (error) {
      console.error("Error fetching PixelDrain file:", error.message);
      ctx.reply("❌ An error occurred while fetching the file. Please try again later.");
    }
  }
});

// Webhook configuration for Render deployment
if (process.env.RENDER) {
  const express = require("express");
  const app = express();

  app.use(bot.webhookCallback("/webhook"));
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`🚀 Bot is running on port ${PORT}`);
  });

  bot.telegram.setWebhook(`${process.env.RENDER_EXTERNAL_URL}/webhook`);
} else {
  bot.launch();
  console.log("🚀 Bot started with polling!");
}

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
