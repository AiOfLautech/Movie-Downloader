const express = require("express");
const { Telegraf } = require("telegraf");
const axios = require("axios");
require("dotenv").config();

const bot = new Telegraf(process.env.BOT_TOKEN); // Initialize bot
const app = express();
const PORT = process.env.PORT || 3000;

// Temporary storage for user preferences
const userLanguages = {};

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

    if (!movies.length) {
      return ctx.reply(`⚠️ No results found for "${movieName}".`);
    }

    let movieList = "🎥 *Search Results:*\n\n";
    movies.forEach((movie, index) => {
      movieList += `${index + 1}. *${movie.title}*\nIMDB: ${movie.imdb}\nYear: ${movie.year}\n🔗 [Link](${movie.link})\n\n`;
    });

    ctx.replyWithMarkdown(movieList);
  } catch (error) {
    console.error("Error during /download command:", error.message);
    ctx.reply("❌ An error occurred while searching for the movie. Please try again later.");
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

    let subtitleList = `📜 *Subtitles for "${movieName}":*\n\n`;
    subtitles.forEach((subtitle, index) => {
      subtitleList += `${index + 1}. Language: *${subtitle.attributes.language}*\n🔗 [Download Link](${subtitle.attributes.url})\n\n`;
    });

    ctx.replyWithMarkdown(subtitleList);
  } catch (error) {
    console.error("Error during /subtitle command:", error.message);
    ctx.reply("❌ An error occurred while fetching subtitles.");
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

    let recommendations = `🔥 *Trending Movies Today:*\n\n`;
    trendingMovies.slice(0, 5).forEach((movie, index) => {
      recommendations += `${index + 1}. *${movie.title}* (${movie.release_date.substring(0, 4)})\n⭐ Rating: ${movie.vote_average}\n\n`;
    });

    ctx.replyWithMarkdown(recommendations);
  } catch (error) {
    console.error("Error during /recommend command:", error.message);
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
    console.error("Error during /info command:", error.message);
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

// Command: /feedback
bot.command("feedback", (ctx) => {
  const userId = ctx.from.id;
  const feedbackText = "🌟 Please share your feedback:\n- `Good`\n- `Bad`\n- `Suggestion <message>`";
  ctx.reply(feedbackText);
});

// Handle feedback
bot.on("text", (ctx) => {
  const text = ctx.message.text;
  if (text.startsWith("Suggestion")) {
    const suggestion = text.split(" ").slice(1).join(" ");
    if (suggestion) {
      ctx.telegram.sendMessage(process.env.OWNER_ID, `📥 New suggestion from ${ctx.from.first_name}: ${suggestion}`);
      ctx.reply("✅ Your suggestion has been sent. Thank you!");
    } else {
      ctx.reply("⚠️ Please provide your suggestion after 'Suggestion'.");
    }
  }
});
