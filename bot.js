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
      "🙋 `/owner` - Get bot owner's contact info\n" +
      "🙏 `/donate` -                            ”
  );
});

//comand: /donate
bot.command("donate", (ctx) => {
  ctx.reply("🏦 Bank Name: Moniepoint\nAccount Name: Babalola Hephzibah Samuel\nAccount Number:8089336992");
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

    if (movies.length === 0) {
      return ctx.reply(`⚠️ No results found for "${movieName}".`);
    }

    let movieList = `🎥 *Search Results for* "${movieName}":\n\n`;
    movies.forEach((movie, index) => {
      movieList += `*${index + 1}.* ${movie.title}\n🔗 Link: ${movie.link}\n\n`;
    });

    ctx.reply(movieList);

    // After sending the movie list, prompt the user to select a movie by number
    ctx.reply("Please reply with the number of the movie you want to download.");

    bot.on("text", async (messageCtx) => {
      const selectedMovieIndex = parseInt(messageCtx.message.text.trim());
      if (isNaN(selectedMovieIndex) || selectedMovieIndex < 1 || selectedMovieIndex > movies.length) {
        return messageCtx.reply("⚠️ Invalid selection. Please reply with a valid movie number.");
      }

      const selectedMovie = movies[selectedMovieIndex - 1];
      const apiUrl = `https://api-site-2.vercel.app/api/sinhalasub/movie?url=${encodeURIComponent(selectedMovie.link)}`;

      try {
        const { data } = await axios.get(apiUrl);
        const downloadLinks = data.result.dl_links || [];

        if (downloadLinks.length === 0) {
          return messageCtx.reply("⚠️ No PixelDrain links found.");
        }

        let qualityList = `🎥 *${data.result.title}* - Available PixelDrain Download Links:\n`;
        downloadLinks.forEach((link, index) => {
          qualityList += `*${index + 1}.* ${link.quality} - ${link.size}\n🔗 Link: ${link.link}\n\n`;
        });

        messageCtx.reply(qualityList);
      } catch (error) {
        console.error("Error fetching download links:", error.message);
        messageCtx.reply("❌ An error occurred while fetching download links.");
      }
    });
  } catch (error) {
    console.error("Error during movie search:", error.message);
    ctx.reply("❌ An error occurred while searching for the movie. Please try again.");
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

    let trendingList = "🔥 *Trending Movies Today:*\n\n";
    trendingMovies.forEach((movie, index) => {
      trendingList += `*${index + 1}.* ${movie.title} (${movie.release_date.substring(0, 4)})\n⭐ Rating: ${movie.vote_average}\n\n`;
    });

    ctx.reply(trendingList);
  } catch (error) {
    console.error("Error fetching trending movies:", error.message);
    ctx.reply("❌ An error occurred while fetching trending movies.");
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
