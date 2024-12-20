const { Telegraf } = require("telegraf");
const axios = require("axios");

// Load the bot token from environment variables
const bot = new Telegraf(process.env.BOT_TOKEN);

// Command: /start
bot.start((ctx) => {
  ctx.reply(
    "👋 Welcome to CineMindBot!\n\nUse the following commands:\n" +
    "🎥 `/download <movie_name>` - Search and download movies\n" +
    "🎬 `/movieinfo <movie_name>` - Get detailed movie information\n" +
    "🎞️ `/recommendation <genre>` - Get movie recommendations\n" +
    "🔥 `/trending` - Get trending movies\n" +
    "🔧 `/feedback <your_feedback>` - Give feedback\n" +
    "🙋 `/owner` - Get bot owner's contact info\n\n" +
    "Powered by AI Of Lautech"
  );
});

// Command: /owner
bot.command("owner", (ctx) => {
  ctx.reply(
    "🤖 Bot Owner:\n*AI OF LAUTECH*\n📞 WhatsApp: +2348089336992",
    { parse_mode: "Markdown" }
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
    const searchResponse = await axios.get(searchUrl);
    const movies = searchResponse.data.result || [];

    if (movies.length === 0) {
      return ctx.reply(`⚠️ No results found for "${movieName}".`);
    }

    let movieList = `🎥 *Search Results for "${movieName}":*\n\n`;
    movies.slice(0, 10).forEach((movie, index) => {
      movieList += `${index + 1}. *${movie.title}* (${movie.year})\n`;
      movieList += `   🎞️ IMDb: ${movie.imdb}\n`;
      movieList += `   🔗 [Watch Here](${movie.link})\n\n`;
    });

    ctx.replyWithMarkdown(movieList);
  } catch (error) {
    console.error("Error during movie search:", error.message);
    ctx.reply("❌ An error occurred while searching for the movie. Please try again.");
  }
});

// Command: /movieinfo
bot.command("movieinfo", async (ctx) => {
  const movieName = ctx.message.text.split(" ").slice(1).join(" ");
  if (!movieName) {
    return ctx.reply("⚠️ Please provide a movie name! Example: `/movieinfo Deadpool`");
  }

  try {
    ctx.reply(`🔍 Fetching information for "${movieName}"...`);

    const movieInfoUrl = `https://api.example.com/movieinfo?q=${encodeURIComponent(movieName)}`;
    const response = await axios.get(movieInfoUrl);
    const movie = response.data;

    if (!movie) {
      return ctx.reply(`⚠️ No information found for "${movieName}".`);
    }

    const movieDetails = `
      🎬 *Movie Info: ${movie.title} (${movie.year})*
      🌟 IMDb: ${movie.imdb}
      🕒 Runtime: ${movie.runtime} minutes
      🎥 Genre: ${movie.genre}
      📖 Plot: ${movie.plot}
    `;

    ctx.replyWithMarkdown(movieDetails);
  } catch (error) {
    console.error("Error fetching movie info:", error.message);
    ctx.reply("❌ An error occurred while fetching movie info. Please try again.");
  }
});

// Command: /recommendation
bot.command("recommendation", async (ctx) => {
  const genre = ctx.message.text.split(" ").slice(1).join(" ");
  if (!genre) {
    return ctx.reply("⚠️ Please provide a genre! Example: `/recommendation Action`");
  }

  try {
    ctx.reply(`🔍 Getting recommendations for the "${genre}" genre...`);

    const recommendationUrl = `https://api.example.com/recommendations?genre=${encodeURIComponent(genre)}`;
    const response = await axios.get(recommendationUrl);
    const recommendations = response.data;

    if (!recommendations || recommendations.length === 0) {
      return ctx.reply(`⚠️ No recommendations found for the "${genre}" genre.`);
    }

    let recommendationList = `🎬 *Recommendations for "${genre}" genre:*\n\n`;
    recommendations.forEach((movie, index) => {
      recommendationList += `${index + 1}. *${movie.title}* (${movie.year})\n`;
      recommendationList += `   🎞️ IMDb: ${movie.imdb}\n\n`;
    });

    ctx.replyWithMarkdown(recommendationList);
  } catch (error) {
    console.error("Error fetching recommendations:", error.message);
    ctx.reply("❌ An error occurred while fetching recommendations. Please try again.");
  }
});

// Command: /trending
bot.command("trending", async (ctx) => {
  try {
    ctx.reply("🔍 Fetching trending movies...");

    const trendingUrl = `https://api.example.com/trending`;
    const response = await axios.get(trendingUrl);
    const trendingMovies = response.data;

    if (!trendingMovies || trendingMovies.length === 0) {
      return ctx.reply("⚠️ No trending movies found.");
    }

    let trendingList = `🔥 *Trending Movies:*\n\n`;
    trendingMovies.forEach((movie, index) => {
      trendingList += `${index + 1}. *${movie.title}* (${movie.year})\n`;
      trendingList += `   🎞️ IMDb: ${movie.imdb}\n\n`;
    });

    ctx.replyWithMarkdown(trendingList);
  } catch (error) {
    console.error("Error fetching trending movies:", error.message);
    ctx.reply("❌ An error occurred while fetching trending movies. Please try again.");
  }
});

// Command: /feedback
bot.command("feedback", async (ctx) => {
  const feedback = ctx.message.text.split(" ").slice(1).join(" ");
  if (!feedback) {
    return ctx.reply("⚠️ Please provide your feedback! Example: `/feedback Great bot!`");
  }

  try {
    // Store the feedback or send it to the bot owner
    console.log("Feedback received: ", feedback);

    // Send a thank you message
    ctx.reply("🙏 Thank you for your feedback!");
  } catch (error) {
    console.error("Error saving feedback:", error.message);
    ctx.reply("❌ An error occurred while submitting feedback. Please try again.");
  }
});

// Launch the bot using long polling
bot.launch().then(() => {
  console.log("🤖 CineMindBot is running!");
});
