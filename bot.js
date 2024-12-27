require("dotenv").config(); // Load environment variables
const { Telegraf } = require("telegraf");
const axios = require("axios");

const bot = new Telegraf(process.env.BOT_TOKEN); // Initialize bot

// Temporary storage for user preferences (e.g., language)
const userLanguages = {};
const botOwnerId = process.env.OWNER_ID; // Add your Telegram User ID in .env file

// Command: /start
bot.start((ctx) => {
  ctx.reply(
    "👋 Welcome to CineMindBot!\n\nHere are the available commands:\n" +
      "🎥 `/download <movie_name>` - Search and download movies\n" +
      "📜 `/subtitle <movie_name>` - Download subtitles for movies\n" +
      "🔥 `/recommend` - Get trending movie recommendations\n" +
      "🎬 `/info <movie_name>` - Get detailed movie information\n" +
      "🌐 `/language` - View or change language preferences\n" +
      "📋 `/users` - View bot users (Owner only)\n" +
      "📝 `/feedback` - Provide feedback or suggestions\n" +
      "🙋 `/owner` - Get bot owner's contact info\n" +
      "💳 `/donate` - Get donation details"
  );
});

// Command: /owner
bot.command("owner", (ctx) => {
  ctx.reply("🤖 Bot Owner:\nAI Of Lautech\n📞 WhatsApp: +2348089336992");
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
      .map(
        (movie, index) =>
          `${index + 1}. ${movie.title}\n🔗 Movie Link: ${movie.link}\n🔗 Download Link: https://pixeldrain.com/api/file/${movie.link}?download`
      )
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
          `${index + 1}. *${subtitle.attributes.language}*\n🔗 [Download Link](${subtitle.attributes.url})`
      )
      .join("\n\n");

    ctx.replyWithMarkdown(`📜 *Subtitle Results for "${movieName}":*\n\n${subtitleList}`);
  } catch (error) {
    console.error("Error during subtitle search:", error.message);
    ctx.reply("❌ An error occurred while searching for subtitles. Please try again.");
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
          `${index + 1}. *${movie.title}* (${movie.release_date.substring(0, 4)})\n⭐ Rating: ${movie.vote_average}`
      )
      .join("\n\n");

    ctx.replyWithMarkdown(`🔥 *Trending Movies Today:*\n\n${recommendations}`);
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
require("dotenv").config(); // Load environment variables
const { Telegraf } = require("telegraf");
const axios = require("axios");

const bot = new Telegraf(process.env.BOT_TOKEN); // Initialize bot

// Temporary storage for user preferences (e.g., language)
const userLanguages = {};
const botOwnerId = process.env.OWNER_ID; // Add your Telegram User ID in .env file

// Command: /start
bot.start((ctx) => {
  ctx.reply(
    "👋 Welcome to CineMindBot!\n\nHere are the available commands:\n" +
      "🎥 `/download <movie_name>` - Search and download movies\n" +
      "📜 `/subtitle <movie_name>` - Download subtitles for movies\n" +
      "🔥 `/recommend` - Get trending movie recommendations\n" +
      "🎬 `/info <movie_name>` - Get detailed movie information\n" +
      "🌐 `/language` - View or change language preferences\n" +
      "📋 `/users` - View bot users (Owner only)\n" +
      "📝 `/feedback` - Provide feedback or suggestions\n" +
      "🙋 `/owner` - Get bot owner's contact info\n" +
      "💳 `/donate` - Get donation details"
  );
});

// Command: /owner
bot.command("owner", (ctx) => {
  ctx.reply("🤖 Bot Owner:\nAI Of Lautech\n📞 WhatsApp: +2348089336992");
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
      .map(
        (movie, index) =>
          `${index + 1}. ${movie.title}\n🔗 Movie Link: ${movie.link}\n🔗 Download Link: https://pixeldrain.com/api/file/${movie.link}?download`
      )
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
          `${index + 1}. *${subtitle.attributes.language}*\n🔗 [Download Link](${subtitle.attributes.url})`
      )
      .join("\n\n");

    ctx.replyWithMarkdown(`📜 *Subtitle Results for "${movieName}":*\n\n${subtitleList}`);
  } catch (error) {
    console.error("Error during subtitle search:", error.message);
    ctx.reply("❌ An error occurred while searching for subtitles. Please try again.");
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
          `${index + 1}. *${movie.title}* (${movie.release_date.substring(0, 4)})\n⭐ Rating: ${movie.vote_average}`
      )
      .join("\n\n");

    ctx.replyWithMarkdown(`🔥 *Trending Movies Today:*\n\n${recommendations}`);
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

    ctx.replyWithMarkdown(
      `🎬 *${movie.Title}*\n` +
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

// Command: /users (Owner Only)
bot.command("users", (ctx) => {
  if (ctx.from.id.toString() !== botOwnerId) {
    return ctx.reply("⚠️ This command is for the bot owner only.");
  }

  const userIds = Object.keys(userLanguages);
  const userList = userIds.map((id, index) => `${index + 1}. User ID: ${id}`).join("\n");

  ctx.reply(userList.length > 0 ? `👥 Registered Users:\n\n${userList}` : "No users registered yet.");
});

// Command: /feedback
bot.command("feedback", (ctx) => {
  ctx.reply("Please share your feedback. I'll send it directly to the bot owner.");
});

// Forward feedback to bot owner
bot.on("text", (ctx) => {
  if (ctx.chat.type === "private" && ctx.message.text !== "/start") {
    bot.telegram.sendMessage(botOwnerId, `📬 Feedback from ${ctx.from.id}:\n${ctx.message.text}`);
    ctx.reply("Thank you! Your feedback has been sent to the owner.");
  }
});

// Command: /language
bot.command("language", (ctx) => {
  ctx.reply(
    "🌐 Available languages:\n- English\n- French\n- Spanish\n\nReply with your preferred language."
  );
});

// Handle user language preference
bot.on("text", (ctx) => {
  const text = ctx.message.text.toLowerCase();
  const userId = ctx.from.id;

  const languages = { english: "English", french: "French", spanish: "Spanish" };
  if (languages[text]) {
    userLanguages[userId] = languages[text];
    ctx.reply(`✅ Language set to: ${languages[text]}`);
  }
});

// Command: /donate
bot.command("donate", (ctx) => {
  ctx.reply(
    "💳 Donate via:\n" +
      "Bank Name: Moniepoint\n" +
      "Account Number: 8089336992\n" +
      "Account Name: Babalola Hephzibah Samuel\n" +
      "Thank you for your support!"
  );
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
