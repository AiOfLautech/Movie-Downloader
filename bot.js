const { Telegraf, Markup } = require("telegraf");
const axios = require("axios");

// Load the bot token from environment variables
const bot = new Telegraf(process.env.BOT_TOKEN);

// Command: /start
bot.start((ctx) => {
  ctx.reply(
    "👋 Welcome to CineMindBot!\n\nUse the following commands:\n" +
      "🎥 `/download <movie_name>` - Search and download movies\n" +
      "🙋 `/owner` - Get bot owner's contact info\n\n" +
      "_Powered by AI Of Lautech_",
    { parse_mode: "Markdown" }
  );
});

// Command: /owner
bot.command("owner", (ctx) => {
  ctx.reply(
    "🤖 *Bot Owner:*\n*AI Of Lautech*\n📞 WhatsApp: +2348089336992",
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

    // Step 1: Search for movies using the first API
    const searchUrl = `https://api-site-2.vercel.app/api/sinhalasub/search?q=${encodeURIComponent(movieName)}`;
    const searchResponse = await axios.get(searchUrl);
    const movies = searchResponse.data.result || [];

    if (movies.length === 0) {
      return ctx.reply(`⚠️ No results found for "${movieName}".`);
    }

    // Step 2: Display search results with inline buttons
    const buttons = movies.slice(0, 5).map((movie, index) => {
      return [
        Markup.button.callback(
          `${index + 1}. ${movie.title} (${movie.year})`,
          `movie_${index}`
        ),
      ];
    });

    // Store movie details in a session (temporary in-memory storage)
    ctx.session = { movies };

    ctx.reply(
      `🎥 *Search Results for "${movieName}":*\n\n_Select a movie to get the download link._`,
      {
        parse_mode: "Markdown",
        reply_markup: Markup.inlineKeyboard(buttons),
      }
    );
  } catch (error) {
    console.error("Error fetching movies:", error.message);
    ctx.reply("❌ An error occurred while searching. Please try again.");
  }
});

// Step 3: Handle inline button clicks to fetch the download link
bot.action(/movie_(\d+)/, async (ctx) => {
  const movieIndex = parseInt(ctx.match[1]); // Extract movie index from callback data
  const selectedMovie = ctx.session.movies[movieIndex]; // Get movie details

  if (!selectedMovie) {
    return ctx.reply("❌ Movie details not found. Please search again.");
  }

  try {
    ctx.reply(`🔗 Fetching download links for "${selectedMovie.title}"...`);

    // Step 4: Fetch download links from the second API
    const pixeldrainLink = `https://pixeldrain.com/api/file/${selectedMovie.fileId}?download`;

    ctx.reply(
      `🎥 *Download Links for "${selectedMovie.title}":*\n\n` +
        `1️⃣ [Direct Download](${pixeldrainLink})\n` +
        `2️⃣ [Watch on SinhalaSub](${selectedMovie.link})\n\n` +
        "_Powered by AI Of Lautech_",
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    console.error("Error fetching download link:", error.message);
    ctx.reply("❌ An error occurred while fetching the download link. Please try again.");
  }
});

// Middleware: Handle session storage
bot.use((ctx, next) => {
  if (!ctx.session) ctx.session = {};
  return next();
});

// Launch the bot using long polling
bot.launch().then(() => {
  console.log("🤖 CineMindBot is running!");
});
