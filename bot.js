require("dotenv").config();
const { Telegraf } = require("telegraf");
const axios = require("axios");

const bot = new Telegraf(process.env.BOT_TOKEN);

// Temporary storage for user preferences and feedback
const userLanguages = {};
const feedbackData = {};

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
    return ctx.reply("⚠️ Please provide a movie name! Example: `/download Venom`");
  }

  try {
    ctx.reply(`🔍 Searching for "${movieName}"...`);

    // Fetch movie data from SinhalaSub API
    const searchUrl = `https://api-site-2.vercel.app/api/sinhalasub/search?q=${encodeURIComponent(movieName)}`;
    const response = await axios.get(searchUrl);
    const movies = response.data.result || [];

    if (movies.length === 0) {
      return ctx.reply(`⚠️ No results found for "${movieName}".`);
    }

    // Display search results
    const movieList = movies.map((movie, index) => ({
      text: `${index + 1}. ${movie.title} (${movie.year})`,
      callback_data: `movie_${index}`,
    }));

    ctx.reply("🎥 Select a movie from the list:", {
      reply_markup: {
        inline_keyboard: movieList.map((movie) => [movie]),
      },
    });

    // Handle movie selection
    movies.forEach((movie, index) => {
      bot.action(`movie_${index}`, async (actionCtx) => {
        const selectedMovie = movies[index];
        actionCtx.reply(
          `🎥 *Selected Movie:*\n` +
            `📜 *Title*: ${selectedMovie.title}\n` +
            `🗓️ *Year*: ${selectedMovie.year}\n` +
            `⭐ *IMDB*: ${selectedMovie.imdb}\n` +
            `🔗 [View Details](${selectedMovie.link})\n\nFetching download links...`,
          { parse_mode: "Markdown" }
        );

        // Fetch download links
        const movieDetailsUrl = `https://api-site-2.vercel.app/api/sinhalasub/movie?url=${encodeURIComponent(
          selectedMovie.link
        )}`;
        const movieDetails = await axios.get(movieDetailsUrl);

        const downloadLinks = movieDetails.data.result?.dl_links || [];
        if (downloadLinks.length === 0) {
          return actionCtx.reply("⚠️ No PixelDrain links found for this movie.");
        }

        // Display download links
        const linksMessage = downloadLinks
          .map(
            (link, idx) =>
              `*${idx + 1}.* ${link.quality} (${link.size})\n🔗 [Download Link](${link.link})`
          )
          .join("\n\n");

        actionCtx.replyWithMarkdown(
          `🎬 *Download Links for "${selectedMovie.title}":*\n\n${linksMessage}`
        );
      });
    });
  } catch (error) {
    console.error("Error during /download command:", error.message);
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
bot .command("feedback", (ctx) => {
  ctx.reply(
    "📝 Please send your feedback or suggestions.\n" +
      "Your message will be forwarded directly to the bot owner."
  );
});

// Handle feedback messages
bot.on("text", async (ctx) => {
  const text = ctx.message.text;

  // Check if the user is providing feedback
  if (text.startsWith("/")) return; // Skip command messages

  const userId = ctx.from.id;
  const username = ctx.from.username || "Unknown User";
  const ownerId = process.env.OWNER_ID; // Bot owner's Telegram user ID

  try {
    // Forward feedback to the bot owner
    await bot.telegram.sendMessage(
      ownerId,
      `📩 *New Feedback Received:*\n\n` +
        `👤 *From:* ${username} (ID: ${userId})\n` +
        `📝 *Message:* ${text}`,
      { parse_mode: "Markdown" }
    );

    ctx.reply("✅ Thank you for your feedback! It has been sent to the bot owner.");
  } catch (error) {
    console.error("Error forwarding feedback:", error.message);
    ctx.reply("❌ An error occurred while sending your feedback. Please try again.");
  }
});

// Default handler for unsupported commands or messages
bot.on("text", (ctx) => {
  const text = ctx.message.text.toLowerCase();

  if (text.startsWith("/")) {
    ctx.reply(
      "⚠️ Unknown command. Please use one of the following:\n\n" +
        "🎥 `/download <movie_name>` - Search and download movies\n" +
        "📜 `/subtitle <movie_name>` - Download subtitles for movies\n" +
        "🔥 `/recommend` - Get trending movie recommendations\n" +
        "🎬 `/info <movie_name>` - Get detailed movie information\n" +
        "🌐 `/language` - View or change language preferences\n" +
        "📝 `/feedback` - Provide feedback or suggestions\n" +
        "🙋 `/owner` - Get bot owner's contact info"
    );
  }
});

// Start the bot
bot.launch()
  .then(() => console.log("🚀 CineMindBot is running..."))
  .catch((error) => console.error("❌ Failed to launch the bot:", error.message));

// Graceful shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
