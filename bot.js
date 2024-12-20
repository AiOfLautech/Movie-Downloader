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
  ctx.reply(
    "🤖 Bot Owner:\n*AI Of Lautech*\n📞 WhatsApp: +2348089336992",
    { parse_mode: "Markdown" }
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

    // Correct API URL with `q` parameter
    const searchUrl = `https://api-site-2.vercel.app/api/sinhalasub/search?q=${encodeURIComponent(movieName)}`;
    const searchResponse = await axios.get(searchUrl);

    // Get the results
    const movies = searchResponse.data.result || [];

    if (movies.length === 0) {
      return ctx.reply(`⚠️ No results found for "${movieName}".`);
    }

    // Format and display the results
    let movieList = `🎥 *Search Results for "${movieName}":*\n\n`;
    movies.slice(0, 10).forEach((movie, index) => {
      movieList += `${index + 1}. *${movie.title}* (${movie.year})\n`;
      movieList += `   🎞️ IMDb: ${movie.imdb}\n`;
      movieList += `   🔗 [Watch Here](${movie.link})\n\n`;
    });

    ctx.replyWithMarkdown(movieList);
  } catch (error) {
    console.error("Error during movie search:", error.message);
    if (error.response) {
      console.error("API response error:", error.response.data);
    }
    ctx.reply("❌ An error occurred while searching for the movie. Please try again.");
  }
});

// Launch the bot using long polling
bot.launch().then(() => {
  console.log("🤖 CineMindBot is running!");
});
