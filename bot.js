const { Telegraf } = require("telegraf");
const axios = require("axios");

// Load the bot token from environment variables
const bot = new Telegraf(process.env.BOT_TOKEN);

// Command: /start
bot.start((ctx) => {
  ctx.reply(
    "👋 Welcome to CineMindBot!\n\nUse the following commands:\n" +
    "🎥 `/download <movie_name>` - Search and download movies\n" +
    "📜 `/subtitle <movie_name>` - Download subtitles for movies\n" +
    "🙋 `/owner` - Get bot owner's contact info"
  );
});

// Command: /owner
bot.command("owner", (ctx) => {
  ctx.reply("🤖 Bot Owner:\n*David Cyril*\n📞 WhatsApp: +1234567890", { parse_mode: "Markdown" });
});

// Command: /download
bot.command("download", async (ctx) => {
  const movieName = ctx.message.text.split(" ").slice(1).join(" ");
  if (!movieName) {
    return ctx.reply("⚠️ Please provide a movie name! Example: `/download Deadpool`");
  }

  try {
    ctx.reply(`🔍 Searching for "${movieName}"...`);

    // Fetch movie search results
    const searchUrl = `https://api-site-2.vercel.app/api/sinhalasub/search?q=${encodeURIComponent(movieName)}`;
    const response = await axios.get(searchUrl);
    const movies = response.data.result || [];

    if (movies.length === 0) {
      return ctx.reply(`⚠️ No results found for "${movieName}".`);
    }

    // Display results as direct links
    let movieList = `🎥 *Search Results for "${movieName}":*\n\n`;
    movies.slice(0, 10).forEach((movie, index) => {
      movieList += `${index + 1}. *${movie.title}*\n🔗 [Download Link](${movie.link})\n\n`;
    });

    ctx.replyWithMarkdown(movieList);
  } catch (error) {
    console.error("Error during movie search:", error.message);
    ctx.reply("❌ An error occurred while searching for the movie. Please try again later.");
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

    // Fetch subtitles using OpenSubtitles API
    const searchUrl = `https://api.opensubtitles.com/api/v1/subtitles?query=${encodeURIComponent(movieName)}`;
    const response = await axios.get(searchUrl, {
      headers: { "Api-Key": process.env.OPENSUBTITLES_API_KEY },
    });
    const subtitles = response.data.data || [];

    if (subtitles.length === 0) {
      return ctx.reply(`⚠️ No subtitles found for "${movieName}".`);
    }

    // Display subtitle links
    let subtitleList = `📜 *Subtitle Results for "${movieName}":*\n\n`;
    subtitles.slice(0, 10).forEach((subtitle, index) => {
      subtitleList += `${index + 1}. *${subtitle.attributes.language}*\n🔗 [Download Link](${subtitle.attributes.url})\n\n`;
    });

    ctx.replyWithMarkdown(subtitleList);
  } catch (error) {
    console.error("Error during subtitle search:", error.message);
    ctx.reply("❌ An error occurred while searching for subtitles. Please try again later.");
  }
});

// Configure webhook for Render
if (process.env.RENDER_EXTERNAL_URL) {
  const webhookUrl = `${process.env.RENDER_EXTERNAL_URL}/webhook`;
  bot.telegram.setWebhook(webhookUrl).then(() => {
    console.log(`🤖 Webhook set to: ${webhookUrl}`);
  });

  bot.startWebhook("/webhook", null, process.env.PORT || 3000);
} else {
  // Fallback to long polling if webhook URL isn't set
  bot.launch().then(() => {
    console.log("🤖 CineMindBot is running with long polling!");
  });
}

// Graceful shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
