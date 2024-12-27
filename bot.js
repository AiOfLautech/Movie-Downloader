require("dotenv").config(); // Load environment variables
const { Telegraf } = require("telegraf");
const axios = require("axios");

// Initialize the bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Temporary storage for user preferences and interactions
const userLanguages = {};
const users = new Set(); // Store unique user IDs

// Middleware to track users
bot.use((ctx, next) => {
  if (ctx.from) {
    users.add(ctx.from.id);
  }
  return next();
});

// Command: /start
bot.start((ctx) => {
  ctx.reply(
    "👋 Welcome to CineMindBot!\n\nHere are the available commands:\n" +
      "🎥 `/download <movie_name>` - Search and download movies\n" +
      "📜 `/subtitle <movie_name>` - Download subtitles for movies\n" +
      "🔥 `/recommend` - Get trending movie recommendations\n" +
      "🎬 `/info <movie_name>` - Get detailed movie information\n" +
      "🌐 `/language` - View or change language preferences\n" +
      "📝 `/feedback` - Provide feedback or suggestions\n" +
      "👥 `/users` - (Owner only) View user count\n" +
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

// Command: /language
bot.command("language", (ctx) => {
  const userId = ctx.from.id;

  if (userLanguages[userId]) {
    ctx.reply(
      `🌐 Your current language preference is: ${userLanguages[userId]}\n\n` +
        "To change it, reply with one of the following:\n" +
        "- `English`\n" +
        "- `French`\n" +
        "- `Spanish`\n" +
        "- `German`\n" +
        "- `Hindi`"
    );
  } else {
    ctx.reply(
      "🌐 You have not set a language preference yet.\n\nReply with one of the following to select your language:\n" +
        "- `English`\n" +
        "- `French`\n" +
        "- `Spanish`\n" +
        "- `German`\n" +
        "- `Hindi`"
    );
  }
});

// Command: /feedback (Send feedback to owner's DM)
bot.command("feedback", (ctx) => {
  ctx.reply(
    "We'd love your feedback! Reply with:\n" +
      "- `Good` for positive feedback\n" +
      "- `Bad` for negative feedback\n" +
      "- `Suggestion <your_message>` to suggest something new!"
  );
});

bot.on("text", async (ctx) => {
  const ownerId = process.env.OWNER_ID;
  const userMessage = ctx.message.text.toLowerCase();

  if (ctx.from.id.toString() !== ownerId) {
    if (userMessage === "good") {
      ctx.reply("Thank you for your feedback! 😊");
      bot.telegram.sendMessage(ownerId, `👍 Positive feedback from @${ctx.from.username || "User"}`);
    } else if (userMessage === "bad") {
      ctx.reply("We're sorry! Let us know how to improve.");
      bot.telegram.sendMessage(ownerId, `👎 Negative feedback from @${ctx.from.username || "User"}`);
    } else if (userMessage.startsWith("suggestion")) {
      const suggestion = userMessage.split(" ").slice(1).join(" ");
      if (suggestion) {
        ctx.reply("Thank you for your suggestion! 🙏");
        bot.telegram.sendMessage(ownerId, `💡 Suggestion from @${ctx.from.username || "User"}: ${suggestion}`);
      } else {
        ctx.reply("⚠️ Please include your suggestion after the command.");
      }
    }
  }
});

// Command: /users
bot.command("users", (ctx) => {
  const ownerId = process.env.OWNER_ID;

  if (ctx.from.id.toString() === ownerId) {
    ctx.reply(`👥 Total users who interacted with the bot: ${users.size}`);
  } else {
    ctx.reply("⚠️ This command is restricted to the bot owner.`);
  }
});

// Command: /donate
bot.command("donate", (ctx) => {
  ctx.reply(
    "💳 If you'd like to donate, here are the details:\n" +
    "Bank Name: Moniepoint\n" +
    "Account Number: 8089336992\n" +
    "Account Name: Babalola Hephzibah Samuel\n\n" +
    "Thank you for your support! 🙏"
  );
});

// Graceful shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

// Launch the bot
if (process.env.RENDER_EXTERNAL_URL) {
  bot.telegram.setWebhook(`${process.env.RENDER_EXTERNAL_URL}/webhook`);
  bot.startWebhook("/webhook", null, process.env.PORT || 3000);
  console.log("🤖 CineMindBot is running with webhook!");
} else {
  bot.launch().then(() => console.log("🤖 CineMindBot is running with long polling!"));
            }
