require("dotenv").config(); // Load environment variables
const { Telegraf } = require("telegraf");
const axios = require("axios");
const i18n = require("i18n");

const bot = new Telegraf(process.env.BOT_TOKEN); // Initialize bot

// Configure i18n for localization
i18n.configure({
  locales: ["en", "fr", "es", "de", "hi"], // Supported languages
  directory: __dirname + "/locales", // Path to translation files
  defaultLocale: "en", // Default language
  objectNotation: true,
});

// Temporary storage for user preferences (e.g., language)
const userLanguages = {};

// Middleware to set language for each user
bot.use((ctx, next) => {
  const userId = ctx.from.id;
  const lang = userLanguages[userId] || "en"; // Default to English if no language is set
  i18n.setLocale(lang); // Set the locale for i18n
  return next();
});

// Command: /start
bot.start((ctx) => {
  ctx.reply(
    `${i18n.__("welcome_message")}\n\n${i18n.__("commands_list")}`
  );
});

// Command: /owner
bot.command("owner", (ctx) => {
  ctx.reply(`${i18n.__("owner_message")}`);
});

// Command: /download
bot.command("download", async (ctx) => {
  const movieName = ctx.message.text.split(" ").slice(1).join(" ");
  if (!movieName) {
    return ctx.reply(i18n.__("download_no_movie"));
  }

  try {
    ctx.reply(i18n.__("download_searching", { movieName }));

    const searchUrl = `https://api-site-2.vercel.app/api/sinhalasub/search?q=${encodeURIComponent(movieName)}`;
    const response = await axios.get(searchUrl);
    const movies = response.data.result || [];

    if (movies.length === 0) {
      return ctx.reply(i18n.__("download_no_results", { movieName }));
    }

    const movieList = movies
      .slice(0, 10)
      .map(
        (movie, index) =>
          `${index + 1}. ${movie.title}\n🔗 ${i18n.__("download_link", { link: `https://pixeldrain.com/api/file/${movie.link}?download` })}`
      )
      .join("\n\n");

    ctx.reply(`${i18n.__("download_results", { movieName })}:\n\n${movieList}`);
  } catch (error) {
    console.error("Error during movie search:", error.message);
    ctx.reply(i18n.__("error_message"));
  }
});

// Command: /subtitle
bot.command("subtitle", async (ctx) => {
  const movieName = ctx.message.text.split(" ").slice(1).join(" ");
  if (!movieName) {
    return ctx.reply(i18n.__("subtitle_no_movie"));
  }

  try {
    ctx.reply(i18n.__("subtitle_searching", { movieName }));

    const searchUrl = `https://api.opensubtitles.com/api/v1/subtitles?query=${encodeURIComponent(movieName)}`;
    const response = await axios.get(searchUrl, {
      headers: { "Api-Key": process.env.OPENSUBTITLES_API_KEY },
    });
    const subtitles = response.data.data || [];

    if (subtitles.length === 0) {
      return ctx.reply(i18n.__("subtitle_no_results", { movieName }));
    }

    const subtitleList = subtitles
      .slice(0, 10)
      .map(
        (subtitle, index) =>
          `${index + 1}. *${subtitle.attributes.language}*\n🔗 [${i18n.__("download_link")}](${subtitle.attributes.url})`
      )
      .join("\n\n");

    ctx.replyWithMarkdown(`${i18n.__("subtitle_results", { movieName })}:\n\n${subtitleList}`);
  } catch (error) {
    console.error("Error during subtitle search:", error.message);
    ctx.reply(i18n.__("error_message"));
  }
});

// Command: /recommend
bot.command("recommend", async (ctx) => {
  try {
    const url = `https://api.themoviedb.org/3/trending/movie/day?api_key=${process.env.TMDB_API_KEY}`;
    const response = await axios.get(url);
    const trendingMovies = response.data.results || [];

    if (trendingMovies.length === 0) {
      return ctx.reply(i18n.__("no_trending_movies"));
    }

    const recommendations = trendingMovies
      .slice(0, 5)
      .map(
        (movie, index) =>
          `${index + 1}. *${movie.title}* (${movie.release_date.substring(0, 4)})\n⭐ ${i18n.__("rating")}: ${movie.vote_average}`
      )
      .join("\n\n");

    ctx.replyWithMarkdown(`${i18n.__("trending_movies_today")}:\n\n${recommendations}`);
  } catch (error) {
    console.error("Error fetching trending movies:", error.message);
    ctx.reply(i18n.__("error_message"));
  }
});

// Command: /info
bot.command("info", async (ctx) => {
  const movieName = ctx.message.text.split(" ").slice(1).join(" ");
  if (!movieName) {
    return ctx.reply(i18n.__("info_no_movie"));
  }

  try {
    const url = `http://www.omdbapi.com/?t=${encodeURIComponent(movieName)}&apikey=${process.env.OMDB_API_KEY}`;
    const response = await axios.get(url);
    const movie = response.data;

    if (movie.Response === "False") {
      return ctx.reply(i18n.__("no_movie_found"));
    }

    ctx.replyWithMarkdown(
      `${i18n.__("movie_info", { title: movie.Title })}\n` +
        `⭐ ${i18n.__("rating")}: ${movie.imdbRating}\n` +
        `📅 ${i18n.__("year")}: ${movie.Year}\n` +
        `📝 ${i18n.__("genre")}: ${movie.Genre}\n` +
        `📖 ${i18n.__("plot")}: ${movie.Plot}`
    );
  } catch (error) {
    console.error("Error fetching movie info:", error.message);
    ctx.reply(i18n.__("error_message"));
  }
});

// Command: /language
bot.command("language", (ctx) => {
  const userId = ctx.from.id;

  if (userLanguages[userId]) {
    ctx.reply(
      `${i18n.__("current_language")}: ${userLanguages[userId]}\n\n` +
        `${i18n.__("change_language_prompt")}`
    );
  } else {
    ctx.reply(
      `${i18n.__("no_language_set")}\n\n${i18n.__("select_language_prompt")}`
    );
  }
});

// Handle language preference replies
bot.on("text", (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text.toLowerCase();

  const languages = {
    english: "en",
    french: "fr",
    spanish: "es",
    german: "de",
    hindi: "hi",
  };

  if (languages[text]) {
    userLanguages[userId] = languages[text];
    i18n.setLocale(languages[text]); // Update locale for this user
    ctx.reply(`${i18n.__("language_set", { language: languages[text] })}`);
  }
});

// Command: /feedback
bot.command("feedback", (ctx) => {
  ctx.reply(
    `${i18n.__("feedback_prompt")}\n` +
      `${i18n.__("good_feedback")}\n` +
      `${i18n.__("bad_feedback")}\n` +
      `${i18n.__("suggestion_feedback")}`
  );
});

// Handle feedback replies
bot.on("text", (ctx) => {
  const message = ctx.message.text.toLowerCase();

  if (message === "good") {
    ctx.reply(i18n.__("good_feedback_response"));
  } else if (message === "bad") {
    ctx.reply(i18n.__("bad_feedback_response"));
  } else if (message.startsWith("suggestion")) {
    const suggestion = ctx.message.text.split(" ").slice(1).join(" ");
    if (suggestion) {
      ctx.reply(i18n.__("thank_you_suggestion"));
    } else {
      ctx.reply(i18n.__("suggestion_prompt"));
    }
  }
});

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
