require("dotenv").config(); // Load environment variables
const { Telegraf, Markup } = require("telegraf");
const axios = require("axios");

const bot = new Telegraf(process.env.BOT_TOKEN); // Initialize bot

// Command: /start
bot.start((ctx) => {
  ctx.reply(
    "👋 Welcome to CineMindBot!\n\nHere are the available commands:\n" +
      "🎥 `/download <movie_name>` - Search and download movies\n" +
      "📜 `/subtitle <movie_name>` - Download subtitles for movies\n" +
      "🔥 `/recommend` - Get trending movie recommendations\n" +
      "🎬 `/info <movie_name>` - Get detailed movie information\n" +
      "🔗 `/direct <file_id>` - Get a direct download link for a file\n" +
      "🗣️ `/language` - View or change language preferences\n" +
      "📝 `/feedback` - Provide feedback or suggestions\n" +
      "🙋 `/owner` - Get bot owner's contact info"
  );
});

// Command: /owner
bot.command("owner", (ctx) => {
  ctx.reply("🤖 Bot Owner:\nAI OF LAUTECH\n📞 WhatsApp: +2348089336992");
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
      .map((movie, index) => `${index + 1}. ${movie.title}\n🔗 ${movie.link}`)
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
          `${index + 1}. Language: ${subtitle.attributes.language}\n🔗 ${subtitle.attributes.url}`
      )
      .join("\n\n");

    ctx.reply(`📜 Subtitles for "${movieName}":\n\n${subtitleList}`);
  } catch (error) {
    console.error("Error during subtitle search:", error.message);
    ctx.reply("❌ An error occurred while searching for subtitles.");
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

    const recommendations = trendingMovies
      .slice(0, 5)
      .map(
        (movie, index) =>
          `${index + 1}. ${movie.title} (${movie.release_date.split("-")[0]})\n⭐ Rating: ${movie.vote_average}`
      )
      .join("\n\n");

    ctx.reply(`🔥 Trending Movies Today:\n\n${recommendations}`);
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
    const url = `http://www.omdbapi.com/?t=${encodeURIComponent(movieName)}&apikey=${process.env.OMDB_API_KEY}`;
    const response = await axios.get(url);
    const movie = response.data;

    if (movie.Response === "False") {
      return ctx.reply("⚠️ No movie found with that name.");
    }

    ctx.reply(
      `🎬 ${movie.Title}\n` +
        `⭐ Rating: ${movie.imdbRating}\n` +
        `📅 Year: ${movie.Year}\n` +
        `📝 Genre: ${movie.Genre}\n` +
        `📖 Plot: ${movie.Plot}`
    );
  } catch (error) {
    console.error("Error fetching movie info:", error.message);
    ctx.reply("❌ An error occurred while fetching movie info.");
  }
});

// Command: /direct
bot.command("direct", async (ctx) => {
  const fileId = ctx.message.text.split(" ").slice(1).join(" ");
  if (!fileId) {
    return ctx.reply("⚠️ Please provide a file ID! Example: `/direct abc123`");
  }

  const directUrl = `https://pixeldrain.com/api/file/${fileId}?download`;
  ctx.reply(`🔗 Direct Download Link: ${directUrl}`);
});

// Command: /language
bot.command("language", (ctx) => {
  ctx.reply("Language settings are not yet implemented. Stay tuned for updates!");
});

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

// Handle feedback actions
bot.action("feedback_good", (ctx) => ctx.reply("Thank you for your feedback! 😊"));
bot.action("feedback_bad", (ctx) => ctx.reply("We're sorry to hear that. How can we improve?"));
bot.action("feedback_suggestion", (ctx) => ctx.reply("Please send us your suggestions!"));

// Webhook configuration for Render deployment
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
