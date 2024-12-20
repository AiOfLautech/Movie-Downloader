const { Telegraf } = require("telegraf");
const axios = require("axios");

// Load the bot token from environment variables
const bot = new Telegraf(process.env.BOT_TOKEN);

// Command: /start
bot.start((ctx) => {
  ctx.reply(
    "👋 Welcome to CineMindBot!\n\nUse the following commands:\n" +
    "🎥 `/download <movie_name>` - Search and download movies\n" +
    "🙋 `/owner` - Get bot owner's contact info"
  );
});

// Command: /owner
bot.command("owner", (ctx) => {
  ctx.reply("🤖 Bot Owner:\n*AI Of Lautech*\n📞 WhatsApp: +2348089336992", { parse_mode: "Markdown" });
});

// Command: /download
bot.command("download", async (ctx) => {
  const movieName = ctx.message.text.split(" ").slice(1).join(" ");
  if (!movieName) {
    return ctx.reply("⚠️ Please provide a movie name! Example: `/download Deadpool`");
  }

  try {
    ctx.reply(`🔍 Searching for "${movieName}"...`);

    // Search for movies
    const searchUrl = `https://api-site-2.vercel.app/api/sinhalasub/search?query=${encodeURIComponent(movieName)}`;
    const searchResponse = await axios.get(searchUrl);
    const movies = searchResponse.data.result || [];

    if (movies.length === 0) {
      return ctx.reply(`⚠️ No results found for "${movieName}".`);
    }

    // Display search results
    let movieList = `🎥 *Search Results for "${movieName}":*\n\n`;
    movies.slice(0, 10).forEach((movie, index) => {
      movieList += `${index + 1}. *${movie.title}*\n🔗 [Link](${movie.link})\n\n`;
    });

    ctx.replyWithMarkdown(movieList);
  } catch (error) {
    console.error("Error during movie search:", error.message);
    ctx.reply("❌ An error occurred while searching for the movie. Please try again.");
  }
});

// Launch the bot using long polling
bot.launch().then(() => {
  console.log("🤖 CineMindBot is running!");
});
