const { Telegraf } = require("telegraf"); // Import Telegraf library
const axios = require("axios");

// Initialize the bot with your bot token
const bot = new Telegraf("YOUR_TELEGRAM_BOT_TOKEN"); // Replace with your Telegram Bot Token

// Command: /start
bot.start((ctx) => {
  const welcomeMessage = `
Welcome to CineMind Bot! 🎥

Here are the commands you can use:
1️⃣ /download <movie_name> - Search and download movies.
2️⃣ /owner - Show owner contact information.
3️⃣ /start - Show this message.

Enjoy!
  `;
  ctx.reply(welcomeMessage, { parse_mode: "Markdown" });
});

// Command: /owner
bot.command("owner", (ctx) => {
  const ownerMessage = `
👤 *Bot Owner Information*:
Name: *AI OF LAUTECH*
WhatsApp: *+2348089336992*
  
Feel free to reach out for any questions or support!
  `;
  ctx.reply(ownerMessage, { parse_mode: "Markdown" });
});

// Command: /download
bot.command("download", async (ctx) => {
  const query = ctx.message.text.split(" ").slice(1).join(" ");

  // Check if the user has provided a movie name
  if (!query) {
    return ctx.reply("❗ *Please provide a movie name!* (e.g., `/download Deadpool`)", { parse_mode: "Markdown" });
  }

  try {
    // Step 1: Search for movies on SinhalaSub
    const searchUrl = `https://api-site-2.vercel.app/api/sinhalasub/search?q=${encodeURIComponent(query)}`;
    const response = await axios.get(searchUrl);
    const movies = response.data.result.slice(0, 10); // Limit to top 10 results

    if (!movies.length) {
      return ctx.reply(`❌ No results found for: *${query}*`, { parse_mode: "Markdown" });
    }

    // Step 2: Display movie options to the user
    let movieList = `📽️ *Search Results for* "${query}":\n\n`;
    movies.forEach((movie, index) => {
      movieList += `*${index + 1}.* ${movie.title}\n🔗 [View Details](${movie.link})\n\n`;
    });

    ctx.reply(movieList, { parse_mode: "Markdown" });

    // Step 3: Ask user to select a movie
    ctx.reply("Reply with the movie number (e.g., `1`) to get download links.");

    // Listen for user's selection
    bot.on("text", async (responseCtx) => {
      const selectedIndex = parseInt(responseCtx.message.text.trim());

      if (isNaN(selectedIndex) || selectedIndex < 1 || selectedIndex > movies.length) {
        return responseCtx.reply("❗ Invalid selection. Please reply with a valid number.");
      }

      const selectedMovie = movies[selectedIndex - 1];
      const movieApiUrl = `https://api-site-2.vercel.app/api/sinhalasub/movie?url=${encodeURIComponent(selectedMovie.link)}`;

      // Step 4: Fetch movie details
      try {
        const movieDetailsResponse = await axios.get(movieApiUrl);
        const movieDetails = movieDetailsResponse.data.result;
        const downloadLinks = movieDetails.dl_links || [];

        if (!downloadLinks.length) {
          return responseCtx.reply("❌ No download links found for this movie.");
        }

        // Step 5: Display download links
        let downloadList = `🎥 *Download Links for* "${movieDetails.title}":\n\n`;
        downloadLinks.forEach((link, index) => {
          downloadList += `*${index + 1}.* ${link.quality} (${link.size})\n🔗 [Download](${link.link})\n\n`;
        });

        responseCtx.reply(downloadList, { parse_mode: "Markdown" });
      } catch (error) {
        console.error("Error fetching movie details:", error);
        responseCtx.reply("❗ An error occurred while fetching movie details. Please try again.");
      }
    });
  } catch (error) {
    console.error("Error during movie search:", error);
    ctx.reply("❗ An error occurred while searching for movies. Please try again.");
  }
});

// Start the bot
bot.launch();
console.log("CineMind  bot is running...");
