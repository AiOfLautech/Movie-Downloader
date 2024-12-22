const { Telegraf } = require("telegraf");
const axios = require("axios");
require("dotenv").config();

// Initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Helper Function for TMDb API requests
const fetchFromTMDb = async (endpoint, params = {}) => {
  try {
    const response = await axios.get(`https://api.themoviedb.org/3/${endpoint}`, {
      params: {
        api_key: process.env.TMDB_API_KEY,
        ...params,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`TMDb API Error: ${error.message}`);
    return null;
  }
};

// Helper Function for OMDb API requests
const fetchFromOMDb = async (params = {}) => {
  try {
    const response = await axios.get("http://www.omdbapi.com/", {
      params: {
        apikey: process.env.OMDB_API_KEY,
        ...params,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`OMDb API Error: ${error.message}`);
    return null;
  }
};

// /start Command
bot.start((ctx) => {
  ctx.reply(`👋 Welcome to CineMindBot! 🎬
I can help you find movies, download links, and subtitles.

Commands:
/download <movie name> - Find a movie and download it
/recommend - Get trending movies
/history - View your search history
/feedback - Give us your feedback
/subtitle <movie name> - Get subtitles for a movie`);
});

// /download Command
bot.command("download", async (ctx) => {
  const query = ctx.message.text.split(" ").slice(1).join(" ");
  if (!query) {
    return ctx.reply("❌ Please provide a movie name! Example: `/download Deadpool`");
  }

  try {
    ctx.reply(`🔎 Searching for "${query}"...`);

    const tmdbData = await fetchFromTMDb("search/movie", { query });
    if (!tmdbData || tmdbData.results.length === 0) {
      return ctx.reply(`❌ No results found for "${query}".`);
    }

    const movie = tmdbData.results[0];
    const omdbData = await fetchFromOMDb({ t: movie.title });
    const imdbRating = omdbData?.imdbRating || "N/A";

    const message = `
🎬 *${movie.title}* (${movie.release_date || "N/A"})
⭐ TMDb Rating: ${movie.vote_average} / 10
🌟 IMDb Rating: ${imdbRating}
📅 Released: ${omdbData?.Released || movie.release_date || "N/A"}
🎭 Genre: ${omdbData?.Genre || "N/A"}
🎥 Director: ${omdbData?.Director || "N/A"}
📝 Plot: ${omdbData?.Plot || movie.overview || "No plot available"}

📥 Download: [Get Download Link](https://example.com/download/${movie.id})
    `;

    ctx.replyWithMarkdown(message);
  } catch (error) {
    console.error(error.message);
    ctx.reply("❌ An error occurred. Please try again later.");
  }
});

// /recommend Command
bot.command("recommend", async (ctx) => {
  try {
    ctx.reply("🔥 Fetching trending movies...");

    const trendingData = await fetchFromTMDb("trending/movie/day");
    if (!trendingData || trendingData.results.length === 0) {
      return ctx.reply("❌ No trending movies available right now.");
    }

    const recommendations = trendingData.results
      .slice(0, 5)
      .map((movie, index) => `${index + 1}. *${movie.title}* (${movie.release_date || "N/A"})`)
      .join("\n");

    ctx.replyWithMarkdown(`🎥 *Trending Movies Today:*\n\n${recommendations}`);
  } catch (error) {
    console.error(error.message);
    ctx.reply("❌ An error occurred while fetching trending movies.");
  }
});

// /subtitle Command
bot.command("subtitle", async (ctx) => {
  const query = ctx.message.text.split(" ").slice(1).join(" ");
  if (!query) {
    return ctx.reply("❌ Please provide a movie name! Example: `/subtitle Deadpool`");
  }

  try {
    ctx.reply(`🔎 Searching subtitles for "${query}"...`);

    const response = await axios.get("https://api.opensubtitles.com/api/v1/subtitles", {
      params: { query },
      headers: { "Api-Key": process.env.OPENSUBTITLES_API_KEY },
    });

    const subtitles = response.data.data;
    if (!subtitles || subtitles.length === 0) {
      return ctx.reply("❌ No subtitles found for this movie.");
    }

    const subtitleLinks = subtitles
      .slice(0, 5)
      .map((sub, index) => `${index + 1}. [${sub.attributes.language}](${sub.attributes.url})`)
      .join("\n");

    ctx.replyWithMarkdown(`📄 *Available Subtitles for "${query}":*\n\n${subtitleLinks}`);
  } catch (error) {
    console.error(error.message);
    ctx.reply("❌ An error occurred while fetching subtitles.");
  }
});

// /history Command
bot.command("history", (ctx) => {
  ctx.reply("📜 Your search history is empty (for now).");
});

// /feedback Command
bot.command("feedback", (ctx) => {
  ctx.reply("📝 We'd love your feedback! Type your feedback below:");
});

// Webhook setup for Render
const express = require("express");
const app = express();
app.use(express.json());

app.post(`/webhook/${process.env.BOT_TOKEN}`, (req, res) => {
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});

// Start the webhook server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🤖 Bot is set to webhook mode.`);
});

// Graceful shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
