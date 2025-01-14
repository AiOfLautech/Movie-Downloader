const express = require("express");
const { Telegraf, Markup } = require("telegraf");
const axios = require("axios");
require("dotenv").config();

const bot = new Telegraf(process.env.BOT_TOKEN); // Initialize bot
const app = express();
const PORT = process.env.PORT || 3000;

const feedbackLog = []; // Array to store feedback temporarily

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

// /start Command
bot.start((ctx) => {
  ctx.reply(
    "👋 Welcome to CineMindBot!\n\nHere are the available commands:\n" +
      "🎥 `/download <movie_name>` - Search and download movies\n" +
      "📜 `/subtitle <movie_name>` - Download subtitles\n" +
      "🎬 `/info <movie_name>` - Get detailed movie information with trailer\n" +
      "🔥 `/recommend` - Get trending movie recommendations\n" +
      "💳 `/donate` - Support the bot development\n" +
      "📝 `/feedback <message>` - Provide feedback or suggestions\n" +
      "🙋 `/owner` - Contact the bot owner"
  );
});

// /donate Command
bot.command("donate", (ctx) => {
  ctx.reply(
    "💳 *Support CineMindBot Development*:\n\n" +
      "Bank Name: Moniepoint\n" +
      "Account Name: Babalola Hephzibah Samuel\n" +
      "Account Number: 8089336992",
    { parse_mode: "Markdown" }
  );
});

// /owner Command
bot.command("owner", (ctx) => {
  ctx.reply("🤖 Bot Owner:\nAI OF LAUTECH\n📞 WhatsApp: +2348089336992");
});

// /info Command
bot.command("info", async (ctx) => {
  const movieName = ctx.message.text.split(" ").slice(1).join(" ");
  if (!movieName) {
    return ctx.reply("⚠️ Please provide a movie name! Example: `/info Deadpool`");
  }

  try {
    ctx.reply(`🔍 Fetching information for "${movieName}"...`);

    // Fetch movie details from OMDb API
    const omdbResponse = await axios.get(`http://www.omdbapi.com/`, {
      params: {
        apikey: process.env.OMDB_API_KEY,
        t: movieName,
      },
    });

    const movie = omdbResponse.data;
    if (movie.Response === "False") {
      return ctx.reply(`⚠️ No information found for "${movieName}".`);
    }

    // Fetch trailer from YouTube
    const youtubeResponse = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
      params: {
        part: "snippet",
        q: `${movieName} official trailer`,
        key: process.env.YOUTUBE_API_KEY,
        maxResults: 1,
        type: "video",
      },
    });

    const trailerLink =
      youtubeResponse.data.items.length > 0
        ? `🎥 *Trailer:* [Watch here](https://www.youtube.com/watch?v=${youtubeResponse.data.items[0].id.videoId})`
        : "🎥 *Trailer:* Not available";

    const infoMessage = `
🎬 *${movie.Title}* (${movie.Year})
⭐ *IMDb Rating:* ${movie.imdbRating || "N/A"}
🗓️ *Released:* ${movie.Released || "N/A"}
🕒 *Runtime:* ${movie.Runtime || "N/A"}
📖 *Genre:* ${movie.Genre || "N/A"}
🎭 *Actors:* ${movie.Actors || "N/A"}
📚 *Plot:* ${movie.Plot || "N/A"}

${trailerLink}
    `;

    ctx.reply(infoMessage, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("Error during /info command:", error.message);
    ctx.reply("❌ An error occurred while fetching movie information.");
  }
});

// /download Command
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

          if (downloadLinks.length > 0) {
            const pixeldrainLinks = downloadLinks.filter((link) =>
              link.link.includes("pixeldrain")
            );

            if (pixeldrainLinks.length > 0) {
              const fileId = pixeldrainLinks[0].link.split("/").pop();
              const downloadUrl = `https://pixeldrain.com/api/file/${fileId}`;

              return ctx.replyWithDocument(
                { url: downloadUrl },
                {
                  caption: `🎥 *${data.result.title}*\n` +
                    `🔗 *Quality:* ${pixeldrainLinks[0].quality}\n` +
                    `🎬 Powered by CineMindBot`,
                  parse_mode: "Markdown",
                }
              );
            }
          }

          ctx.reply("❌ No Pixeldrain links available.");
        } catch (error) {
          console.error("Error during /download action:", error.message);
          ctx.reply("❌ An error occurred while fetching the download links.");
        }
      });
    });
  } catch (error) {
    console.error("Error during /download command:", error.message);
    ctx.reply("❌ An error occurred. Please try again later.");
  }
});

// /subtitle Command
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

// /recommend Command
bot.command("recommend", async (ctx) => {
  try {
    ctx.reply("🔍 Fetching trending movie recommendations...");
    const response = await axios.get(`https://api.themoviedb.org/3/trending/movie/day`, {
      params: { api_key: process.env.TMDB_API_KEY },
    });

    const movies = response.data.results || [];
    if (!movies.length) {
      return ctx.reply("⚠️ No recommendations available at the moment.");
      const buttons = movies.slice(0, 10).map((movie) =>
      Markup.button.callback(movie.title, `recommend_${movie.id}`)
    );

    ctx.reply(
      "🔥 *Trending Movie Recommendations:*",
      Markup.inlineKeyboard(buttons, { columns: 1 })
    );

    // Handle user selection for recommendations
    movies.slice(0, 10).forEach((movie) => {
      bot.action(`recommend_${movie.id}`, async (ctx) => {
        try {
          // Fetch detailed movie information
          const details = await axios.get(`https://api.themoviedb.org/3/movie/${movie.id}`, {
            params: { api_key: process.env.TMDB_API_KEY },
          });

          const movieDetails = details.data;
          const infoMessage = `
🎬 *${movieDetails.title}* (${movieDetails.release_date.split("-")[0]})
⭐ *Rating:* ${movieDetails.vote_average}/10 (${movieDetails.vote_count} votes)
📖 *Overview:* ${movieDetails.overview || "N/A"}
🔗 *More Info:* [View on TMDb](https://www.themoviedb.org/movie/${movie.id})
          `;

          ctx.reply(infoMessage, { parse_mode: "Markdown" });
        } catch (error) {
          console.error(`Error fetching recommendation details: ${error.message}`);
          ctx.reply("❌ An error occurred while fetching movie details.");
        }
      });
    });
  } catch (error) {
    console.error("Error during /recommend command:", error.message);
    ctx.reply("❌ An error occurred while fetching recommendations.");
  }
});

// /feedback Command
bot.command("feedback", (ctx) => {
  const feedbackMessage = ctx.message.text.split(" ").slice(1).join(" ");
  if (!feedbackMessage) {
    return ctx.reply("⚠️ Please provide your feedback. Example: `/feedback I love this bot!`");
  }

  feedbackLog.push({ user: ctx.from.username || ctx.from.id, feedback: feedbackMessage });
  ctx.reply("📝 Thank you for your feedback! We value your input.");
  console.log(`New feedback from ${ctx.from.username || ctx.from.id}: ${feedbackMessage}`);
});

// Launch the bot
bot.launch().then(() => console.log("🤖 CineMindBot is running!"));
