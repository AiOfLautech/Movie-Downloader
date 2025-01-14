const express = require("express");
const { Telegraf, Markup } = require("telegraf");
const axios = require("axios");
require("dotenv").config();

const bot = new Telegraf(process.env.BOT_TOKEN); // Initialize bot
const app = express();
const PORT = process.env.PORT || 3000;

// Webhook Endpoint for Render
app.use(express.json());
app.post(`/webhook`, (req, res) => {
  bot.handleUpdate(req.body);
  res.status(200).send("OK");
});

// Start Webhook or Long Polling
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
    "👋 Welcome to CineMindBot!\n\nHere are the available commands:\n" +
      "🎥 `/download <movie_name>` - Search and download movies\n" +
      "📜 `/subtitle <movie_name>` - Download subtitles for movies\n" +
      "🔥 `/recommend` - Get trending movie recommendations\n" +
      "🎬 `/info <movie_name>` - Get detailed movie information\n" +
      "🌐 `/language` - View or change language preferences\n" +
      "📝 `/feedback` - Provide feedback or suggestions\n" +
      "💳 `/donate` - Support the bot development\n" +
      "🙋 `/owner` - Get bot owner's contact info"
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

    if (!movies.length) {
      return ctx.reply(`⚠️ No results found for "${movieName}".`);
    }

    const buttons = movies.map((movie, index) =>
      Markup.button.callback(`${index + 1}. ${movie.title}`, `download_${index}`)
    );

    ctx.reply(
      "🎥 *Search Results*:\nSelect a movie to download:",
      Markup.inlineKeyboard(buttons, { columns: 1 })
    );

    // Handle user selection
    movies.forEach((movie, index) => {
      bot.action(`download_${index}`, async (ctx) => {
        try {
          const apiUrl = `https://api-site-2.vercel.app/api/sinhalasub/movie?url=${encodeURIComponent(movie.link)}`;
          const { data } = await axios.get(apiUrl);
          const downloadLinks = data.result.dl_links || [];

          if (!downloadLinks.length) {
            return ctx.reply(`❌ No download links found for "${movie.title}".`);
          }

          const pixeldrainLink = downloadLinks.find((link) => link.link.includes("pixeldrain"));
          if (!pixeldrainLink) {
            return ctx.reply(
              `❌ No Pixeldrain links found. \n🔗 [SinhalaSub Download Link](${movie.link})`,
              { parse_mode: "Markdown" }
            );
          }

          const fileId = pixeldrainLink.link.split("/").pop();
          const fileUrl = `https://pixeldrain.com/api/file/${fileId}`;

          ctx.reply(`📥 Preparing your movie...`);
          await ctx.replyWithDocument({
            url: fileUrl,
            filename: `${data.result.title}.mp4`,
          });
        } catch (error) {
          console.error(error);
          ctx.reply("❌ An error occurred while fetching the movie file.");
        }
      });
    });
  } catch (error) {
    console.error("Error during /download command:", error.message);
    ctx.reply("❌ An error occurred. Please try again later.");
  }
});

// Command: /info
bot.command("info", async (ctx) => {
  const movieName = ctx.message.text.split(" ").slice(1).join(" ");
  if (!movieName) {
    return ctx.reply("⚠️ Please provide a movie name! Example: `/info Deadpool`");
  }

  try {
    const omdbUrl = `https://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&t=${encodeURIComponent(movieName)}`;
    const movieResponse = await axios.get(omdbUrl);
    const movie = movieResponse.data;

    if (movie.Response === "False") {
      return ctx.reply(`❌ No information found for "${movieName}".`);
    }

    const youtubeSearchUrl = `https://www.googleapis.com/youtube/v3/search?key=${process.env.YOUTUBE_API_KEY}&q=${encodeURIComponent(
      movie.Title + " trailer"
    )}&part=snippet&type=video&maxResults=1`;
    const youtubeResponse = await axios.get(youtubeSearchUrl);
    const trailer = youtubeResponse.data.items[0];

    const trailerLink = trailer
      ? `🎥 [Watch Trailer](https://www.youtube.com/watch?v=${trailer.id.videoId})`
      : "🎥 Trailer not available.";

    ctx.replyWithMarkdown(
      `🎬 *${movie.Title}*\n` +
        `📅 Released: ${movie.Released}\n` +
        `⭐ IMDB Rating: ${movie.imdbRating}/10\n` +
        `🎭 Genre: ${movie.Genre}\n` +
        `🎙️ Actors: ${movie.Actors}\n` +
        `${trailerLink}\n\n` +
        `📖 *Plot*: ${movie.Plot}`
    );
  } catch (error) {
    console.error("Error during /info command:", error.message);
    ctx.reply("❌ An error occurred while fetching movie information.");
  }
});

// Command: /donate
bot.command("donate", (ctx) => {
  ctx.reply(
    "💳 *Support CineMindBot Development*:\n\n" +
      "Bank Name: Moniepoint\n" +
      "Account Name: Babalola Hephzibah Samuel\n" +
      "Account Number: 8089336992",
    { parse_mode: "Markdown" }
  );
});

// Command: /owner
bot.command("owner", (ctx) => {
  ctx.reply("🤖 Bot Owner:\nAI OF LAUTECH\n📞 WhatsApp: +2348089336992");
});

// Command: /feedback
bot.command("feedback", (ctx) => {
  ctx.reply("📝 Please reply to this message with your feedback.");
  bot.on("text", (ctx) => {
    userFeedback.push({ user: ctx.from.username || ctx.from.first_name, feedback: ctx.message.text });
    ctx.reply("✅ Thank you for your feedback!");
  });
});

// Command: /recommend
bot.command("recommend", async (ctx) => {
  try {
    const apiUrl = "https://api.themoviedb.org/3/trending/movie/week?api_key=" + process.env.TMDB_API_KEY;
    const response = await axios.get(apiUrl);
    const movies = response.data.results.slice(0, 5);

    let recommendations = "🔥 *Trending Movies This Week*:\n\n";
    movies.forEach((movie, index) => {
      recommendations += `${index + 1}. *${movie.title}*\n🗓️ Release Date: ${movie.release_date}\n⭐ Rating: ${movie.vote_average}\n\n`;
    });

    ctx.reply(recommendations, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("Error fetching trending movies:", error.message);
    ctx.reply("❌ An error occurred while fetching recommendations.");
  }
});
// Command: /subtitle
bot.command("subtitle", async (ctx) => {
  const movieName = ctx.message.text.split(" ").slice(1).join(" ");
  if (!movieName) {
    return ctx.reply("⚠️ Please provide a movie name! Example: `/subtitle Deadpool`");
  }

  try {
    const searchUrl = `https://api.opensubtitles.com/api/v1/subtitles?query=${encodeURIComponent(movieName)}`;
    const response = await axios.get(searchUrl, {
      headers: { "Api-Key": process.env.OPENSUBTITLES_API_KEY },
    });
    const subtitles = response.data.data || [];

    if (!subtitles.length) {
      return ctx.reply(`⚠️ No subtitles found for "${movieName}".`);
    }

    const buttons = subtitles.map((subtitle) =>
      Markup.button.url(`${subtitle.attributes.language}`, subtitle.attributes.url)
    );

    ctx.reply(
      `📜 *Subtitles for "${movieName}":*`,
      Markup.inlineKeyboard(buttons, { columns: 1 })
    );
  } catch (error) {
    console.error("Error during /subtitle command:", error.message);
    ctx.reply("❌ An error occurred while fetching subtitles.");
  }
});

// Command: /language
bot.command("language", (ctx) => {
  const chatId = ctx.chat.id;

  if (!userLanguages[chatId]) {
    userLanguages[chatId] = "English"; // Default language
  }

  ctx.reply(
    `🌐 Current language: *${userLanguages[chatId]}*\n\nWould you like to change it?`,
    Markup.inlineKeyboard([
      Markup.button.callback("English", "lang_en"),
      Markup.button.callback("French", "lang_fr"),
    ])
  );
});

// Handle language changes
bot.action("lang_en", (ctx) => {
  const chatId = ctx.chat.id;
  userLanguages[chatId] = "English";
  ctx.reply("✅ Language changed to English.");
});

bot.action("lang_fr", (ctx) => {
  const chatId = ctx.chat.id;
  userLanguages[chatId] = "French";
  ctx.reply("✅ Langue changée en Français.");
});

module.exports = bot;
