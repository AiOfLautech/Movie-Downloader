require("dotenv").config(); // Load environment variables from .env
const { Telegraf, Markup } = require("telegraf");
const axios = require("axios");

// Initialize the bot
const bot = new Telegraf(process.env.BOT_TOKEN); // Telegram bot token

// API keys
const tmdbApiKey = process.env.TMDB_API_KEY;    // TMDB API key
const omdbApiKey = process.env.OMDB_API_KEY;    // OMDB API key
const opensubtitlesApiKey = process.env.OPENSUBTITLES_API_KEY; // OpenSubtitles API key

// Middleware to handle session storage
bot.use((ctx, next) => {
  if (!ctx.session) ctx.session = {};
  return next();
});

// Command: /start
bot.start((ctx) => {
  ctx.reply(
    "👋 Welcome to CineMindBot!\n\n" +
      "Here are the available commands:\n" +
      "🎥 `/download <movie_name>` - Search and download movies.\n" +
      "🔥 `/recommend` - Get trending movie recommendations.\n" +
      "🎬 `/info <movie_name>` - Get detailed movie information.\n" +
      "📜 `/subtitle <movie_name>` - Search for subtitles.\n" +
      "📝 `/feedback` - Provide feedback or suggestions.\n" +
      "🌐 `/language` - Change your preferred language.\n" +
      "🙋 `/owner` - Get bot owner's contact info.\n\n" +
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
    const searchUrl = `https://api-site-2.vercel.app/api/sinhalasub/search?q=${encodeURIComponent(movieName)}`;
    const response = await axios.get(searchUrl);
    const movies = response.data.result || [];

    if (movies.length === 0) {
      return ctx.reply(`⚠️ No results found for "${movieName}".`);
    }

    ctx.session.movies = movies;
    const buttons = movies.slice(0, 5).map((movie, index) => [
      Markup.button.callback(`${index + 1}. ${movie.title} (${movie.year})`, `movie_${index}`),
    ]);

    ctx.reply(
      `🎥 *Search Results for "${movieName}":*\n\n_Select a movie below to get the download link._`,
      { parse_mode: "Markdown", reply_markup: Markup.inlineKeyboard(buttons) }
    );
  } catch (error) {
    console.error("Error fetching movie data:", error.message);
    ctx.reply("❌ An error occurred while searching. Please try again.");
  }
});

// Handle movie selection
bot.action(/movie_(\d+)/, async (ctx) => {
  const movieIndex = parseInt(ctx.match[1]);
  const selectedMovie = ctx.session.movies[movieIndex];

  if (!selectedMovie) {
    return ctx.reply("❌ Movie details not found. Please search again.");
  }

  try {
    ctx.reply(`🔗 Fetching download links for "${selectedMovie.title}"...`);
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

// Command: /recommend
bot.command("recommend", async (ctx) => {
  try {
    const url = `https://api.themoviedb.org/3/trending/movie/day?api_key=${tmdbApiKey}`;
    const response = await axios.get(url);
    const trendingMovies = response.data.results || [];

    if (trendingMovies.length === 0) {
      return ctx.reply("⚠️ No trending movies found.");
    }

    ctx.session.trendingMovies = trendingMovies;
    const buttons = trendingMovies.slice(0, 5).map((movie, index) => [
      Markup.button.callback(`${index + 1}. ${movie.title} (${movie.release_date.substring(0, 4)})`, `recommend_${index}`),
    ]);

    ctx.reply(
      "🔥 *Trending Movies Today:*\n\n_Select a movie below to get more details._",
      { parse_mode: "Markdown", reply_markup: Markup.inlineKeyboard(buttons) }
    );
  } catch (error) {
    console.error("Error fetching trending movies:", error.message);
    ctx.reply("❌ An error occurred while fetching trending movies.");
  }
});

// Command: /info
bot.command("info", async (ctx) => {
  const movieName = ctx.message.text.split(" ").slice(1).join(" ");
  if (!movieName) {
    return ctx.reply("⚠️ Please provide a movie name! Example: `/info Deadpool`");
  }

  try {
    const url = `http://www.omdbapi.com/?t=${encodeURIComponent(movieName)}&apikey=${omdbApiKey}`;
    const response = await axios.get(url);
    const movie = response.data;

    if (movie.Response === "False") {
      return ctx.reply("⚠️ No movie found with that name.");
    }

    ctx.reply(
      `🎬 *${movie.Title}*\n` +
        `⭐ IMDb Rating: ${movie.imdbRating}\n` +
        `📅 Year: ${movie.Year}\n` +
        `📝 Genre: ${movie.Genre}\n` +
        `📖 Plot: ${movie.Plot}\n` +
        `📺 [Watch Trailer](https://www.youtube.com/results?search_query=${encodeURIComponent(movie.Title)}+trailer)`,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    console.error("Error fetching movie info:", error.message);
    ctx.reply("❌ An error occurred while fetching movie info.");
  }
});

// Command: /subtitle
bot.command("subtitle", async (ctx) => {
  const movieName = ctx.message.text.split(" ").slice(1).join(" ");
  if (!movieName) {
    return ctx.reply("⚠️ Please provide a movie name! Example: `/subtitle Inception`");
  }

  try {
    const url = `https://api.opensubtitles.com/api/v1/subtitles?query=${encodeURIComponent(movieName)}`;
    const response = await axios.get(url, {
      headers: { "Api-Key": opensubtitlesApiKey },
    });

    const subtitles = response.data.data || [];
    if (subtitles.length === 0) {
      return ctx.reply(`⚠️ No subtitles found for "${movieName}".`);
    }

    const buttons = subtitles.slice(0, 5).map((sub, index) => [
      Markup.button.url(
        `${index + 1}. ${sub.attributes.language} - ${sub.attributes.release}`,
        sub.attributes.url
      ),
    ]);

    ctx.reply(
      `📜 *Available Subtitles for "${movieName}":*\n\n_Select a link below to download._`,
      { reply_markup: Markup.inlineKeyboard(buttons) }
    );
  } catch (error) {
    console.error("Error fetching subtitles:", error.message);
    ctx.reply("❌ An error occurred while fetching subtitles. Please try again.");
  }
});

// Webhook setup for Render deployment
if (process.env.RENDER_EXTERNAL_URL) {
  bot.telegram.setWebhook(`${process.env.RENDER_EXTERNAL_URL}/webhook`);
  bot.startWebhook("/webhook", null, process.env.PORT || 3000);
} else {
  // Fallback to long polling
  bot.launch().then(() => {
    console.log("🤖 CineMindBot is running!");
  });
}

// Graceful shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
