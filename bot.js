// This plugin was created by David Cyril

// Don't Edit or Share without giving me credits

const { sinhalaSub } = require("mrnima-moviedl");
const axios = require("axios");
const { Telegraf } = require("telegraf");

// Initialize bot
const bot = new Telegraf("7263499266:AAFA6iaa0GfgcaIBViB4QF1EnN0qV3tqRq0"); // Replace with your bot token

// Command: /owner
bot.command("owner", (ctx) => {
  const ownerInfo = `
  👤 *Owner Information*:
  Name: *AI OF LAUTECH*
  WhatsApp: *+2348089336992*
  
  For any queries, feel free to reach out!
  `;
  ctx.reply(ownerInfo, { parse_mode: "Markdown" });
});

// Command: /start
bot.command("start", (ctx) => {
  const commandsList = `
  📜 *Available Commands*:
  
  1️⃣ /download <movie_name> - Search and download movies
  2️⃣ /owner - Show owner information
  3️⃣ /start - Display all available commands
  
  Powered by CineMindBot
  `;
  ctx.reply(commandsList, { parse_mode: "Markdown" });
});

// Command: /download
bot.command("download", async (ctx) => {
  const query = ctx.message.text.split(" ").slice(1).join(" ");

  if (!query) {
    return ctx.reply("*Please provide a search query! (e.g., Deadpool)*", { parse_mode: "Markdown" });
  }

  try {
    // Step 2: Search SinhalaSub for movies
    const sinhala = await sinhalaSub();
    const results = await sinhala.search(query);
    const movies = results.result.slice(0, 10);

    if (!movies.length) {
      return ctx.reply(`No results found for: ${query}`);
    }

    // Step 3: Send movie list to the user
    let movieList = `📽️ *Search Results for* "${query}":\n\n`;
    movies.forEach((movie, index) => {
      movieList += `*${index + 1}.* ${movie.title}\n🔗 Link: ${movie.link}\n\n`;
    });

    const replyMessage = await ctx.reply(movieList, { parse_mode: "Markdown" });

    // Step 4: Listen for user's movie selection
    bot.on("text", async (responseCtx) => {
      const selection = responseCtx.message.text;
      const selectedIndex = parseInt(selection.trim());

      if (isNaN(selectedIndex) || selectedIndex <= 0 || selectedIndex > movies.length) {
        return responseCtx.reply("Invalid selection. Please reply with a valid number.");
      }

      const selectedMovie = movies[selectedIndex - 1];
      const apiUrl = `https://api-site-2.vercel.app/api/sinhalasub/movie?url=${encodeURIComponent(selectedMovie.link)}`;

      try {
        // Step 5: Fetch movie details and download links
        const { data } = await axios.get(apiUrl);
        const movieDetails = data.result;
        const downloadLinks = movieDetails.dl_links || [];

        if (!downloadLinks.length) {
          return responseCtx.reply("No download links found.");
        }

        // Step 6: Send download links to the user
        let qualityList = `🎥 *${movieDetails.title}*\n\n*Available Download Links:*\n`;
        downloadLinks.forEach((link, index) => {
          qualityList += `*${index + 1}.* ${link.quality} - ${link.size}\n🔗 Link: ${link.link}\n\n`;
        });

        responseCtx.reply(qualityList, { parse_mode: "Markdown" });
      } catch (error) {
        console.error("Error fetching movie details:", error);
        responseCtx.reply("An error occurred while fetching movie details. Please try again.");
      }
    });
  } catch (error) {
    console.error("Error during search:", error);
    ctx.reply("*An error occurred while searching!*", { parse_mode: "Markdown" });
  }
});

// Start the bot
bot.launch();
console.log("Bot is running...");
