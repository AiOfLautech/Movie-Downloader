const { Telegraf } = require("telegraf");
const axios = require("axios");
const express = require("express");
require("dotenv").config();

const bot = new Telegraf(process.env.BOT_TOKEN);

// Webhook setup for Render
const app = express();
app.use(express.json());

app.post(`/${process.env.BOT_TOKEN}`, (req, res) => {
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Start webhook
bot.telegram.setWebhook(`${process.env.WEBHOOK_URL}/${process.env.BOT_TOKEN}`);

// Welcome Message
bot.start((ctx) => {
  ctx.reply(
    `👋 Welcome to CineMindBot!\n\n` +
      `🎥 Use me to search, download, and explore movies.\n\n` +
      `📜 Commands List:\n` +
      `🎥 /download <movie_name> - Search and download movies\n` +
      `📜 /subtitle <movie_name> - Download subtitles\n` +
      `🔥 /recommend - Trending movie recommendations\n` +
      `🎬 /info <movie_name> - Get detailed movie information\n` +
      `🌐 /language - Change language preferences\n` +
      `📝 /feedback - Send feedback or suggestions\n` +
      `🙋 /owner - Bot owner contact details`
  );
});

// /download command
bot.command("download", async (ctx) => {
  const query = ctx.message.text.split(" ").slice(1).join(" ");
  if (!query) {
    return ctx.reply("❗ Please provide a movie name. Example: `/download Venom`");
  }

  try {
    const response = await axios.get(
      `https://api-site-2.vercel.app/api/sinhalasub/search?q=${encodeURIComponent(
        query
      )}`
    );
    const results = response.data.result.slice(0, 5);

    if (!results.length) {
      return ctx.reply("❌ No results found for your search.");
    }

    let movieList = "🎥 *Search Results:*\n\n";
    results.forEach((movie, index) => {
      movieList += `${index + 1}. *${movie.title}* (${movie.year})\n🔗 [Details](${movie.link})\n\n`;
    });

    ctx.reply(movieList, { parse_mode: "Markdown" });
  } catch (error) {
    console.error(error.message);
    ctx.reply("❌ Error fetching movie data. Please try again.");
  }
});

// /subtitle command
bot.command("subtitle", async (ctx) => {
  const query = ctx.message.text.split(" ").slice(1).join(" ");
  if (!query) {
    return ctx.reply("❗ Please provide a movie name. Example: `/subtitle Venom`");
  }

  try {
    const response = await axios.get(
      `https://api-site-2.vercel.app/api/sinhalasub/search?q=${encodeURIComponent(
        query
      )}`
    );
    const results = response.data.result.slice(0, 5);

    if (!results.length) {
      return ctx.reply("❌ No results found for your search.");
    }

    let subtitleList = "📜 *Subtitle Search Results:*\n\n";
    results.forEach((movie, index) => {
      subtitleList += `${index + 1}. *${movie.title}*\n🔗 [Download Subtitle](${movie.link})\n\n`;
    });

    ctx.reply(subtitleList, { parse_mode: "Markdown" });
  } catch (error) {
    console.error(error.message);
    ctx.reply("❌ Error fetching subtitles. Please try again.");
  }
});

// /recommend command
bot.command("recommend", async (ctx) => {
  try {
    const response = await axios.get(
      "https://api.example.com/trending" // Replace with a valid trending movies API
    );
    const results = response.data.results.slice(0, 5);

    if (!results.length) {
      return ctx.reply("❌ No trending movies found.");
    }

    let recommendList = "🔥 *Trending Movies:*\n\n";
    results.forEach((movie, index) => {
      recommendList += `${index + 1}. *${movie.title}*\n🎞️ ${movie.overview}\n\n`;
    });

    ctx.reply(recommendList, { parse_mode: "Markdown" });
  } catch (error) {
    console.error(error.message);
    ctx.reply("❌ Error fetching trending movies. Please try again.");
  }
});

// /info command
bot.command("info", async (ctx) => {
  const query = ctx.message.text.split(" ").slice(1).join(" ");
  if (!query) {
    return ctx.reply("❗ Please provide a movie name. Example: `/info Venom`");
  }

  try {
    const response = await axios.get(
      `https://api.example.com/movie/info?q=${encodeURIComponent(query)}` // Replace with a valid movie info API
    );
    const movie = response.data;

    if (!movie) {
      return ctx.reply("❌ No movie information found.");
    }

    ctx.reply(
      `🎬 *${movie.title}*\n\n` +
        `📅 Release Date: ${movie.release_date}\n` +
        `⭐ IMDB Rating: ${movie.rating}\n` +
        `🎞️ Overview: ${movie.overview}\n` +
        `🔗 [More Details](${movie.url})`,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    console.error(error.message);
    ctx.reply("❌ Error fetching movie information. Please try again.");
  }
});

// /language command
const userLanguages = {};
bot.command("language", (ctx) => {
  ctx.reply(
    "🌐 Choose your language:\n\n" +
      "1. English - Reply with `1`\n" +
      "2. Sinhala - Reply with `2`"
  );

  const userId = ctx.from.id;
  userLanguages[userId] = null; // Resetting the preference
});

bot.on("text", (ctx) => {
  const userId = ctx.from.id;

  if (userLanguages[userId] === null) {
    const choice = ctx.message.text.trim();
    if (choice === "1") {
      userLanguages[userId] = "English";
      ctx.reply("✅ Language set to English.");
    } else if (choice === "2") {
      userLanguages[userId] = "Sinhala";
      ctx.reply("✅ Language set to Sinhala.");
    } else {
      ctx.reply("❌ Invalid choice. Please reply with `1` or `2`.");
    }
    return;
  }
});

// /feedback command
bot.command("feedback", (ctx) => {
  ctx.reply(
    "📝 Please send your feedback or suggestions.\nYour message will be forwarded directly to the bot owner."
  );
});

bot.on("text", async (ctx) => {
  const text = ctx.message.text;
  if (text.startsWith("/")) return; // Ignore other commands

  const userId = ctx.from.id;
  const username = ctx.from.username || "Unknown User";
  const ownerId = process.env.OWNER_ID; // Replace with owner's Telegram ID

  try {
    await bot.telegram.sendMessage(
      ownerId,
      `📩 *New Feedback Received:*\n\n👤 *From:* ${username} (ID: ${userId})\n📝 *Message:* ${text}`,
      { parse_mode: "Markdown" }
    );
    ctx.reply("✅ Thank you for your feedback! It has been sent to the bot owner.");
  } catch (error) {
    console.error("Error forwarding feedback:", error.message);
    ctx.reply("❌ Error sending feedback. Please try again.");
  }
});

// /owner command
bot.command("owner", (ctx) => {
  const ownerContact = process.env.OWNER_CONTACT || "Owner's contact not available";
  ctx.reply(`🙋 Bot Owner's Contact:\n${ownerContact}`);
});

// Handle unknown commands
bot.on("text", (ctx) => {
  const text = ctx.message.text.toLowerCase();
  if (text.startsWith("/")) {
    ctx.reply("⚠️ Unknown command. Use `/start` to see the list of available commands.");
  }
});
