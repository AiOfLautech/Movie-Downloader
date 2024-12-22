require('dotenv').config(); // Load environment variables from .env file

const { Telegraf, Markup, session } = require('telegraf');
const axios = require('axios');

// API keys and tokens from .env file
const tmdbApiKey = process.env.TMDB_API_KEY;
const omdbApiKey = process.env.OMDB_API_KEY;
const botToken = process.env.BOT_TOKEN;
const webhookUrl = process.env.WEBHOOK_URL;

if (!tmdbApiKey || !omdbApiKey || !botToken || !webhookUrl) {
  console.error("⚠️ Missing API keys, bot token, or webhook URL. Please check your .env file.");
  process.exit(1);
}

const bot = new Telegraf(botToken);

// Middleware: Enable session handling
bot.use(session());

// Command: /start
bot.start((ctx) => {
  ctx.reply(
    "👋 *Welcome to CineMindBot!*\n\n" +
      "Here are the available commands:\n\n" +
      "🎥 `/download <movie_name>` - Search and download movies.\n" +
      "🙋 `/owner` - Get bot owner's contact info.\n" +
      "📝 `/feedback` - Provide feedback or suggestions.\n" +
      "🔥 `/recommend` - Get movie recommendations.\n" +
      "📜 `/history` - View your search history.\n" +
      "🌐 `/language` - Change your preferred language.\n" +
      "🎬 `/info <movie_name>` - Get more movie details.\n\n" +
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

  if (!ctx.session.history) ctx.session.history = [];
  ctx.session.history.push(movieName);
  if (ctx.session.history.length > 10) ctx.session.history.shift();

  try {
    ctx.reply(`🔍 Searching for "${movieName}"...`);
    const searchUrl = `https://api-site-2.vercel.app/api/sinhalasub/search?q=${encodeURIComponent(movieName)}`;
    const { data } = await axios.get(searchUrl);
    const movies = data.result || [];

    if (movies.length === 0) {
      return ctx.reply(`⚠️ No results found for "${movieName}".`);
    }

    const buttons = movies.slice(0, 5).map((movie, index) => [
      Markup.button.callback(`${index + 1}. ${movie.title} (${movie.year})`, `movie_${index}`)
    ]);

    ctx.session.movies = movies;

    ctx.reply(
      `🎥 *Search Results for "${movieName}":*\n\n_Select a movie below to get the download link._`,
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

// Command: /recommend - Trending Movies
bot.command("recommend", async (ctx) => {
  try {
    const trendingUrl = `https://api.themoviedb.org/3/trending/movie/day?api_key=${tmdbApiKey}`;
    const { data } = await axios.get(trendingUrl);
    const trendingMovies = data.results || [];

    if (trendingMovies.length === 0) {
      return ctx.reply("⚠️ No trending movies found.");
    }

    const buttons = trendingMovies.slice(0, 5).map((movie, index) => [
      Markup.button.callback(`${index + 1}. ${movie.title} (${movie.release_date.substring(0, 4)})`, `recommend_${index}`)
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
    ctx.reply("❌ An error occurred while fetching the trending movies. Please try again.");
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
    const movieDetails = await axios.get(
      `https://api.themoviedb.org/3/movie/${selectedMovie.id}?api_key=${tmdbApiKey}`
    );
    const movieOverview = movieDetails.data.overview;
    const movieRating = movieDetails.data.vote_average;

    ctx.reply(
      `🎥 *${selectedMovie.title}*\n` +
      `Rating: ${movieRating}\n` +
      `Overview: ${movieOverview}\n\n` +
      "_Powered by TMDB_"
    );
  } catch (error) {
    console.error("Error fetching movie details:", error.message);
    ctx.reply("❌ An error occurred while fetching the movie details. Please try again.");
  }
});

// Command: /feedback
bot.command("feedback", (ctx) => {
  const buttons = [
    Markup.button.callback("👍 Good", "feedback_good"),
    Markup.button.callback("👎 Bad", "feedback_bad"),
    Markup.button.callback("💬 Suggestion", "feedback_suggestion"),
  ];

  ctx.reply("We'd love your feedback! Please choose one option below:", {
    reply_markup: Markup.inlineKeyboard(buttons),
  });
});

bot.action("feedback_good", (ctx) => ctx.reply("Thank you for your positive feedback! 😊"));
bot.action("feedback_bad", (ctx) => ctx.reply("Sorry to hear that! 😔 Please let us know how we can improve."));
bot.action("feedback_suggestion", (ctx) => ctx.reply("Please send your suggestion as a message. We'll review it soon!"));

// Command: /history
bot.command("history", (ctx) => {
  if (ctx.session.history && ctx.session.history.length > 0) {
    const historyList = ctx.session.history.join("\n");
    ctx.reply(`📜 *Search History:*\n\n${historyList}`);
  } else {
    ctx.reply("⚠️ No search history found.");
  }
});

// Command: /language
bot.command("language", (ctx) => {
  const buttons = [
    Markup.button.callback("🇬🇧 English", "lang_en"),
    Markup.button.callback("🇪🇸 Español", "lang_es"),
    Markup.button.callback("🇫🇷 Français", "lang_fr"),
  ];

  ctx.reply("Please choose your preferred language:", {
    reply_markup: Markup.inlineKeyboard(buttons),
  });
});

bot.action("lang_en", (ctx) => ctx.reply("Language changed to English."));
bot.action("lang_es", (ctx) => ctx.reply("Idioma cambiado a Español."));
bot.action("lang_fr", (ctx) => ctx.reply("Langue changée en Français."));

// Webhook setup
(async () => {
  try {
    const domain = webhookUrl.endsWith("/") ? webhookUrl.slice(0, -1) : webhookUrl;
    console.log("Setting webhook...");
    await bot.telegram.setWebhook(`${domain}/bot${botToken}`);
    console.log(`✅ Webhook successfully set to ${domain}/bot${botToken}`);
  } catch (error) {
    console.error("❌ Failed to set webhook:", error.message);
    process.exit(1);
  }
})();

const express = require("express");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.json());

// Webhook route
app.post(`/bot${botToken}`, (req, res) => {
  bot.handleUpdate(req.body);
  res.status(200).send("OK");
});

// Default route
app.get("/", (req, res) => {
  res.send("🤖 CineMindBot is running with webhook support!");
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
