const express = require("express");
const { Telegraf, Markup } = require("telegraf");
const axios = require("axios");
require("dotenv").config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();
const PORT = process.env.PORT || 3000;

// User preferences
const userLanguages = {};

// Webhook setup
app.use(express.json());
app.post(`/webhook`, (req, res) => {
  bot.handleUpdate(req.body);
  res.status(200).send("OK");
});

// Start bot
if (process.env.RENDER_EXTERNAL_URL) {
  bot.telegram.setWebhook(`${process.env.RENDER_EXTERNAL_URL}/webhook`);
  app.listen(PORT, () => {
    console.log(`🤖 Bot running on Webhook at ${process.env.RENDER_EXTERNAL_URL}/webhook`);
  });
} else {
  bot.launch().then(() => console.log("🤖 Bot running with long polling!"));
}

// Graceful shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

// Command: /start
bot.start((ctx) => {
  ctx.reply(
    `👋 Welcome to CineMindBot!\n\nHere are the available commands:\n` +
      `🎥 \`/download <movie_name>\` - Search and download movies\n` +
      `📜 \`/subtitle <movie_name>\` - Download subtitles for movies\n` +
      `🔥 \`/recommend\` - Get trending movie recommendations\n` +
      `🎬 \`/info <movie_name>\` - Get detailed movie information\n` +
      `🌐 \`/language\` - View or change language preferences\n` +
      `📝 \`/feedback\` - Provide feedback or suggestions\n` +
      `🙋 \`/owner\` - Get bot owner's contact info`
  );
});

// Command: /owner
bot.command("owner", (ctx) => {
  ctx.reply("🤖 Bot Owner:\nAI OF LAUTECH\n📞 WhatsApp: +2348089336992");
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
        `📖 Plot: ${movie.Plot}\n` +
        `🔗 [More Info](${movie.Website})`
    );
  } catch (error) {
    console.error("Error during /info command:", error.message);
    ctx.reply("❌ An error occurred while fetching movie info.");
  }
});

// Command: /feedback
bot.command("feedback", (ctx) => {
  ctx.reply(
    "🌟 Please share your feedback or suggestions:",
    Markup.inlineKeyboard([
      [Markup.button.callback("Good 👍", "feedback_good")],
      [Markup.button.callback("Bad 👎", "feedback_bad")],
      [Markup.button.callback("Suggestion 💡", "feedback_suggestion")],
    ])
  );
});

bot.action("feedback_good", async (ctx) => {
  ctx.reply("✅ Thank you for your positive feedback!");
});

bot.action("feedback_bad", async (ctx) => {
  ctx.reply("⚠️ Sorry to hear that! Please share how we can improve.");
});

bot.action("feedback_suggestion", async (ctx) => {
  ctx.reply("💡 Please type your suggestion below.");
  bot.on("text", async (ctx) => {
    const suggestion = ctx.message.text;
    await ctx.telegram.sendMessage(
      process.env.OWNER_ID,
      `📥 New suggestion from ${ctx.from.first_name}: ${suggestion}`
    );
    ctx.reply("✅ Your suggestion has been sent. Thank you!");
  });
});

// Command: /download
bot.command("download", async (ctx) => {
  const movieName = ctx.message.text.split(" ").slice(1).join(" ");
  if (!movieName) {
    return ctx.reply("⚠️ Please provide a movie name! Example: `/download Deadpool`");
  }

  try {
    ctx.reply("🔍 Searching for movies...");

    // Fetch movies from SinhalaSub API
    const searchUrl = `https://api-site-2.vercel.app/api/sinhalasub/search?q=${encodeURIComponent(movieName)}`;
    const response = await axios.get(searchUrl);
    const movies = response.data.result || [];

    if (!movies.length) {
      return ctx.reply(`⚠️ No results found for "${movieName}".`);
    }

    const movieButtons = movies.map((movie, index) => [
      Markup.button.callback(movie.title, `movie_${index}`),
    ]);

    ctx.reply(
      "🎥 *Search Results:*",
      Markup.inlineKeyboard(movieButtons)
    );

    // Handle movie selection
    movies.forEach((movie, index) => {
      bot.action(`movie_${index}`, async (ctx) => {
        ctx.reply("Fetching download links...");
        const apiUrl = `https://api-site-2.vercel.app/api/sinhalasub/movie?url=${encodeURIComponent(
          movie.link
        )}`;

        try {
          const { data } = await axios.get(apiUrl);
          const downloadLinks = data.result.dl_links || [];

          if (!downloadLinks.length) {
            return ctx.reply("⚠️ No PixelDrain links found for this movie.");
          }

          const qualityButtons = downloadLinks.map((link, i) => [
            Markup.button.url(link.quality, link.link),
          ]);

          ctx.reply(
            `🎥 *${movie.title}*\nAvailable Download Links:`,
            Markup.inlineKeyboard(qualityButtons)
          );
        } catch (error) {
          console.error("Error fetching download links:", error.message);
          ctx.reply("❌ An error occurred while fetching download links.");
        }
      });
    });
  } catch (error) {
    console.error("Error during /download command:", error.message);
    ctx.reply("❌ An error occurred while searching for the movie.");
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

// Handle language selection
bot.on("text", (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text.toLowerCase();
  const languages = {
    english: "English",
    french: "French",
    spanish: "Spanish",
    german: "German",
    hindi: "Hindi",
  };

  if (languages[text]) {
    userLanguages[userId] = languages[text];
    ctx.reply(`✅ Your language preference has been set to: ${languages[text]}`);
  }
});

// Command: /recommend
bot.command("recommend", async (ctx) => {
  try {
    const url = `https://api.themoviedb.org/3/trending/movie/day?api_key=${process.env.TMDB_API_KEY}`;
    const response = await axios.get(url);
    const trendingMovies = response.data.results || [];

    if (!trendingMovies.length) {
      return ctx.reply("⚠️ No trending movies found.");
    }

    const recommendations = trendingMovies
      .slice(0, 5)
      .map(
        (movie, index) =>
          `${index + 1}. *${movie.title}* (${movie.release_date.substring(
            0,
            4
          )})\n⭐ Rating: ${movie.vote_average}`
      )
      .join("\n\n");

    ctx.replyWithMarkdown(`🔥 *Trending Movies Today:*\n\n${recommendations}`);
  } catch (error) {
    console.error("Error during /recommend command:", error.message);
    ctx.reply("❌ An error occurred while fetching trending movies. Please try again later.");
  }
});

// Command: /subtitle
bot.command("subtitle", async (ctx) => {
  const movieName = ctx.message.text.split(" ").slice(1).join(" ");
  if (!movieName) {
    return ctx.reply("⚠️ Please provide a movie name! Example: `/subtitle Deadpool`");
  }

  try {
    ctx.reply("🔍 Searching for subtitles...");

    const subtitleUrl = `https://api-site-2.vercel.app/api/sinhalasub/search?q=${encodeURIComponent(movieName)}`;
    const response = await axios.get(subtitleUrl);
    const results = response.data.result || [];

    if (!results.length) {
      return ctx.reply(`⚠️ No subtitles found for "${movieName}".`);
    }

    const subtitleButtons = results.map((sub, index) => [
      Markup.button.url(sub.title, sub.link),
    ]);

    ctx.reply(
      "📜 *Subtitle Results:*",
      Markup.inlineKeyboard(subtitleButtons)
    );
  } catch (error) {
    console.error("Error during /subtitle command:", error.message);
    ctx.reply("❌ An error occurred while searching for subtitles.");
  }
});

// Default handler for unknown commands
bot.on("message", (ctx) => {
  ctx.reply(
    "⚠️ Unknown command. Please use one of the available commands:\n" +
      `🎥 \`/download <movie_name>\` - Search and download movies\n` +
      `📜 \`/subtitle <movie_name>\` - Download subtitles for movies\n` +
      `🔥 \`/recommend\` - Get trending movie recommendations\n` +
      `🎬 \`/info <movie_name>\` - Get detailed movie information\n` +
      `🌐 \`/language\` - View or change language preferences\n` +
      `📝 \`/feedback\` - Provide feedback or suggestions\n` +
      `🙋 \`/owner\` - Get bot owner's contact info`
  );
});

// Export for testing
module.exports = bot;
