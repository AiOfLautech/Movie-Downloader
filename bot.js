require("dotenv").config(); // Load environment variables
const { Telegraf } = require("telegraf");
const axios = require("axios");

const bot = new Telegraf(process.env.BOT_TOKEN); // Initialize bot

// Temporary storage for user preferences (e.g., language)
const userLanguages = {};

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

    // Fetch movie data
    const searchUrl = `https://api-site-2.vercel.app/api/sinhalasub/search?q=${encodeURIComponent(movieName)}`;
    const response = await axios.get(searchUrl);
    const movies = response.data.result || [];

    if (movies.length === 0) {
      return ctx.reply(`⚠️ No results found for "${movieName}".`);
    }

    // Display search results
    const movieList = movies.slice(0, 10).map((movie, index) => ({
      text: `${index + 1}. ${movie.title}`,
      callback_data: `movie_${index}`,
    }));

    ctx.reply("🎥 Select a movie from the list:", {
      reply_markup: {
        inline_keyboard: [movieList.map((movie) => [movie])],
      },
    });

    // Listen for movie selection
    movieList.forEach((movie, index) => {
      bot.action(`movie_${index}`, async (actionCtx) => {
        const selectedMovie = movies[index];
        actionCtx.reply(`🎥 You selected: *${selectedMovie.title}*`, { parse_mode: "Markdown" });

        // Fetch quality options
        const qualityResponse = await axios.get(selectedMovie.link); // Adjust API if necessary
        const qualities = qualityResponse.data.qualities || []; // Replace with actual response

        if (qualities.length === 0) {
          return actionCtx.reply("⚠️ No qualities available for this movie.");
        }

        // Display qualities with direct download links
        const qualityButtons = qualities.map((quality, qIndex) => ({
          text: `${quality.resolution} - ${quality.size}`,
          callback_data: `quality_${index}_${qIndex}`,
        }));

        actionCtx.reply(
          `🎥 *Available Qualities for: ${selectedMovie.title}*\n\nSelect a quality to download directly:`,
          {
            parse_mode: "Markdown",
            reply_markup: { inline_keyboard: [qualityButtons.map((quality) => [quality])] },
          }
        );

        // Handle quality selection
        qualities.forEach((quality, qIndex) => {
          bot.action(`quality_${index}_${qIndex}`, async (qualityCtx) => {
            const directDownloadUrl = quality.download_url; // Replace with actual API response
            qualityCtx.reply(
              `📥 *Your download is ready:*\n\n🔗 [Download Link](${directDownloadUrl})`,
              { parse_mode: "Markdown" }
            );
          });
        });
      });
    });
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

// Handle language preference replies
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
  ctx.reply(
    "We'd love your feedback! Please reply with one of the following:\n" +
      "- `Good` - If you like the bot\n" +
      "- `Bad` - If you dislike the bot\n" +
      "- `Suggestion <your_message>` - To share suggestions"
  );
});

// Handle feedback replies
bot.on("text", (ctx) => {
  const message = ctx.message.text.toLowerCase();

  if (message === "good") {
    ctx.reply("Thank you for your positive feedback! 😊");
  } else if (message === "bad") {
    ctx.reply("We're sorry to hear that. Could you share how we can improve?");
  } else if (message.startsWith("suggestion")) {
    const suggestion = ctx.message.text.split(" ").slice(1).join(" ");
    if (suggestion) {
      ctx.reply("Thank you for your suggestion! We'll consider it. 🙏");
    } else {
      ctx.reply("⚠️ Please provide your suggestion. Example: `Suggestion Add more features`");
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
