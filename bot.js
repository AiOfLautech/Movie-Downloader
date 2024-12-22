require("dotenv").config(); // Load environment variables from .env
const { Telegraf, Markup } = require("telegraf");
const axios = require("axios");

// Initialize the bot
const bot = new Telegraf(process.env.BOT_TOKEN); // Telegram bot token

// Integrate your API 
const tmdbApiKey = process.env.TMDB_API_KEY;    // TMDB API key
const omdbApiKey = process.env.OMDB_API_KEY;    // OMDB API key

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
      "📜 `/history` - View your search history.\n" +
      "🌐 `/language` - Change your preferred language.\n" +
      "📝 `/feedback` - Provide feedback or suggestions.\n" +
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
      {
        parse_mode: "Markdown",
        reply_markup: Markup.inlineKeyboard(buttons),
      }
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
    const url = `https://api.themoviedb.org/3/trending/movie/day?api_key=${process.env.TMDB_API_KEY}`;
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

// Handle recommendation selection
bot.action(/recommend_(\d+)/, async (ctx) => {
  const movieIndex = parseInt(ctx.match[1]);
  const selectedMovie = ctx.session.trendingMovies[movieIndex];

  if (!selectedMovie) {
    return ctx.reply("❌ Movie details not found. Please try again.");
  }

  try {
    const detailsUrl = `https://api.themoviedb.org/3/movie/${selectedMovie.id}?api_key=${process.env.TMDB_API_KEY}`;
    const detailsResponse = await axios.get(detailsUrl);
    const details = detailsResponse.data;

    ctx.reply(
      `🎬 *${selectedMovie.title}*\n` +
        `⭐ Rating: ${details.vote_average}\n` +
        `📅 Year: ${details.release_date}\n` +
        `📝 Genre: ${details.genres.map((g) => g.name).join(", ")}\n` +
        `📖 Plot: ${details.overview}`,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    console.error("Error fetching movie details:", error.message);
    ctx.reply("❌ An error occurred while fetching movie details.");
  }
});

// Command: /info
bot.command("info", async (ctx) => {
  const movieName = ctx.message.text.split(" ").slice(1).join(" ");
  if (!movieName) {
    return ctx.reply("⚠️ Please provide a movie name! Example: `/info Deadpool`");
  }

  try {
    const url = `http://www.omdbapi.com/?t=${encodeURIComponent(movieName)}&apikey=${process.env.OMDB_API_KEY}`;
    const response = await axios.get(url);
    const movie = response.data;

    if (movie.Response === "False") {
      return ctx.reply("⚠️ No movie found with that name.");
    }

    ctx.reply(
      `🎬 *${movie.Title}*\n` +
        `⭐ Rating: ${movie.imdbRating}\n` +
        `📅 Year: ${movie.Year}\n` +
        `📝 Genre: ${movie.Genre}\n` +
        `📖 Plot: ${movie.Plot}`,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    console.error("Error fetching movie info:", error.message);
    ctx.reply("❌ An error occurred while fetching movie info.");
  }
});

// Command: /language
bot.command("language", (ctx) => {
  const buttons = [
    Markup.button.callback("🇬🇧 English", "lang_en"),
    Markup.button.callback("🇪🇸 Español", "lang_es"),
    Markup.button.callback("🇫🇷 Français", "lang_fr"),
  ];

  ctx.reply("🌐 Choose your preferred language:", {
    reply_markup: Markup.inlineKeyboard(buttons),
  });
});

bot.action("lang_en", (ctx) => ctx.reply("Language set to English."));
bot.action("lang_es", (ctx) => ctx.reply("Idioma configurado a Español."));
bot.action("lang_fr", (ctx) => ctx.reply("Langue définie sur Français."));

// Command: /feedback
bot.command("feedback", (ctx) => {
  const buttons = [
    Markup.button.callback("👍 Good", "feedback_good"),
    Markup.button.callback("👎 Bad", "feedback_bad"),
    Markup.button.callback("💬 Suggestion", "feedback_suggestion"),
  ];
  ctx.reply("We'd love your feedback! Choose an option below:", {
    reply_markup: Markup.inlineKeyboard(buttons),
  });
});

bot.action("feedback_good", (ctx) => ctx.reply("Thank you for your feedback! 😊"));
bot.action("feedback_bad", (ctx) => ctx.reply("We're sorry to hear that. How can we improve?"));
bot.action("feedback_suggestion", (ctx) => ctx.reply("Please send us your suggestions!"));

// Command: /history
bot.command("history", (ctx) => {
  const history = ctx.session.history || [];
  if (history.length === 0) {
    return ctx.reply("📜 Your search history is empty.");
  }

  const formattedHistory = history
    .map((item, index) => `${index + 1}. ${item}`)
    .join("\n");

  ctx.reply(`📜 *Your Search History:*\n\n${formattedHistory}`, {
    parse_mode: "Markdown",
  });
});

// Middleware to save search queries to history
bot.use((ctx, next) => {
  if (ctx.message?.text?.startsWith("/download")) {
    const movieName = ctx.message.text.split(" ").slice(1).join(" ");
    if (movieName) {
      if (!ctx.session.history) ctx.session.history = [];
      ctx.session.history.push(movieName);
    }
  }
  return next();
});

// Webhook configuration for Render deployment
if (process.env.RENDER_EXTERNAL_URL) {
  bot.telegram.setWebhook(`${process.env.RENDER_EXTERNAL_URL}/webhook`);
  bot.startWebhook("/webhook", null, process.env.PORT || 3000);
} else {
  // Fallback to long polling if webhook URL isn't set
  bot.launch().then(() => {
    console.log("🤖 CineMindBot is running!");
  });
}

// Graceful shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
