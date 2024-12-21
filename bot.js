require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");
const axios = require("axios");

// Initialize the bot with your token
const bot = new Telegraf(process.env.BOT_TOKEN);

// API Keys and Base URLs
const tmdbApiKey = process.env.TMDB_API_KEY; // TMDB API Key
const omdbApiKey = process.env.OMDB_API_KEY; // OMDB API Key
const sinhalaSubBaseURL = "https://api-site-2.vercel.app/api/sinhalasub";

// Middleware for session handling
bot.use((ctx, next) => {
  if (!ctx.session) ctx.session = {};
  return next();
});

// Command: /start
bot.start((ctx) => {
  ctx.reply(
    "👋 *Welcome to CineMindBot!*\n\n" +
      "Here are the available commands:\n\n" +
      "🎥 `/download <movie_name>` - Search and download movies.\n" +
      "🔥 `/recommend` - Get trending movies.\n" +
      "📝 `/feedback` - Provide feedback or suggestions.\n" +
      "📜 `/history` - View your search history.\n" +
      "🌐 `/language` - Change your preferred language.\n" +
      "🎬 `/info <movie_name>` - Get more movie details.\n" +
      "🙋 `/owner` - Get the bot owner's contact info.\n\n" +
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

// Command: /recommend - Trending Movies
bot.command("recommend", async (ctx) => {
  try {
    const trendingUrl = `https://api.themoviedb.org/3/trending/movie/day?api_key=${tmdbApiKey}`;
    const trendingResponse = await axios.get(trendingUrl);
    const trendingMovies = trendingResponse.data.results || [];

    if (trendingMovies.length === 0) {
      return ctx.reply("⚠️ No trending movies found.");
    }

    const buttons = trendingMovies.slice(0, 5).map((movie, index) => [
      Markup.button.callback(
        `${index + 1}. ${movie.title} (${movie.release_date.substring(0, 4)})`,
        `recommend_${index}`
      ),
    ]);

    ctx.session.trendingMovies = trendingMovies;

    ctx.reply(
      "🔥 *Trending Movies Today:*\n\n_Select a movie below to get more details._",
      {
        parse_mode: "Markdown",
        reply_markup: Markup.inlineKeyboard(buttons),
      }
    );
  } catch (error) {
    console.error("Error fetching trending movies:", error.message);
    ctx.reply("❌ An error occurred while fetching trending movies.");
  }
});

// Handle Recommendation Selection
bot.action(/recommend_(\d+)/, async (ctx) => {
  const index = parseInt(ctx.match[1]);
  const movie = ctx.session.trendingMovies[index];

  if (!movie) {
    return ctx.reply("⚠️ Movie not found. Please try again.");
  }

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "https://via.placeholder.com/500x750?text=No+Image";

  ctx.replyWithPhoto(posterUrl, {
    caption: `🎥 *${movie.title}*\n` +
      `📅 Release Date: ${movie.release_date}\n` +
      `⭐ Rating: ${movie.vote_average}\n` +
      `📖 Overview: ${movie.overview}\n\n` +
      "_Powered by AI Of Lautech_",
    parse_mode: "Markdown",
  });
});

// Command: /download
bot.command("download", async (ctx) => {
  const movieName = ctx.message.text.split(" ").slice(1).join(" ");
  if (!movieName) {
    return ctx.reply("⚠️ Please provide a movie name! Example: `/download Deadpool`");
  }

  // Store history
  if (!ctx.session.history) ctx.session.history = [];
  ctx.session.history.push(movieName);
  if (ctx.session.history.length > 10) ctx.session.history.shift();

  try {
    ctx.reply(`🔍 Searching for "${movieName}"...`);

    const searchUrl = `${sinhalaSubBaseURL}/search?q=${encodeURIComponent(movieName)}`;
    const response = await axios.get(searchUrl);
    const movies = response.data.result || [];

    if (movies.length === 0) {
      return ctx.reply(`⚠️ No results found for "${movieName}".`);
    }

    const buttons = movies.slice(0, 5).map((movie, index) => [
      Markup.button.callback(`${index + 1}. ${movie.title}`, `download_${index}`),
    ]);

    ctx.session.downloadMovies = movies;

    ctx.reply(
      `🎥 *Search Results for "${movieName}":*\n\n_Select a movie to get the download link._`,
      {
        parse_mode: "Markdown",
        reply_markup: Markup.inlineKeyboard(buttons),
      }
    );
  } catch (error) {
    console.error("Error fetching movie:", error.message);
    ctx.reply("❌ An error occurred. Please try again.");
  }
});

// Handle Download Selection
bot.action(/download_(\d+)/, async (ctx) => {
  const index = parseInt(ctx.match[1]);
  const movie = ctx.session.downloadMovies[index];

  if (!movie) {
    return ctx.reply("⚠️ Movie not found.");
  }

  ctx.reply(
    `🎥 *Download Links for "${movie.title}":*\n\n` +
      `1️⃣ [Direct Download](https://pixeldrain.com/api/file/${movie.fileId}?download)\n` +
      `2️⃣ [Watch on SinhalaSub](${movie.link})\n\n` +
      "_Powered by AI Of Lautech_",
    { parse_mode: "Markdown" }
  );
});

// Command: /info
bot.command("info", async (ctx) => {
  const movieName = ctx.message.text.split(" ").slice(1).join(" ");
  if (!movieName) {
    return ctx.reply("⚠️ Please provide a movie name! Example: `/info Inception`");
  }

  try {
    const imdbUrl = `http://www.omdbapi.com/?t=${encodeURIComponent(movieName)}&apikey=${omdbApiKey}`;
    const response = await axios.get(imdbUrl);
    const movie = response.data;

    if (movie.Response === "False") {
      return ctx.reply("⚠️ No movie found.");
    }

    ctx.reply(
      `🎬 *${movie.Title}*\n` +
        `⭐ Rating: ${movie.imdbRating}\n` +
        `📅 Year: ${movie.Year}\n` +
        `📝 Genre: ${movie.Genre}\n` +
        `📖 Plot: ${movie.Plot}\n\n` +
        "_Powered by OMDB_"
    );
  } catch (error) {
    console.error("Error fetching movie details:", error.message);
    ctx.reply("❌ An error occurred. Please try again.");
  }
});

// Launch the bot
bot.launch().then(() => console.log("🤖 CineMindBot is running!"));

// Graceful shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
