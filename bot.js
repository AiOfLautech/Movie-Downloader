const { sinhalaSub } = require("mrnima-moviedl");
const axios = require("axios");
require("dotenv").config(); // For loading environment variables like BOT_TOKEN

const { Telegraf } = require("telegraf"); // Import Telegraf for Telegram bot
const bot = new Telegraf(process.env.BOT_TOKEN); // Initialize the bot

// Command to search for movies
bot.command("start", (ctx) => {
    ctx.reply("🎬 Welcome to the SinhalaSub Movie Downloader Bot! Type a movie name to search.");
});

bot.on("text", async (ctx) => {
    const query = ctx.message.text.trim();

    if (!query) {
        return ctx.reply("❌ Please provide a movie name to search. Example: `Venom`", { parse_mode: "Markdown" });
    }

    ctx.reply(`🔍 Searching for "${query}"...`);

    try {
        // Call SinhalaSub API to search for movies
        const searchUrl = `https://api-site-2.vercel.app/api/sinhalasub/movie?query=${encodeURIComponent(query)}`;
        console.log("Calling API:", searchUrl); // Debugging step

        const response = await axios.get(searchUrl);

        // Check API response
        if (!response.data || !response.data.result || response.data.result.length === 0) {
            return ctx.reply(`❌ No results found for "${query}". Please try a different movie.`);
        }

        const movies = response.data.result.slice(0, 5); // Get the first 5 movies
        let movieList = `🎥 *Search Results for* "${query}":\n\n`;

        // Display movie list to the user
        movies.forEach((movie, index) => {
            movieList += `*${index + 1}.* ${movie.title}\n🔗 [View Movie](${movie.link})\n\n`;
        });

        await ctx.reply(movieList, { parse_mode: "Markdown" });

    } catch (error) {
        console.error("Error while searching for movies:", error.message || error);
        ctx.reply("❌ An error occurred while searching. Please try again later.");
    }
});

// Start the bot
bot.launch().then(() => {
    console.log("🎬 CineMind Movie Bot is running...");
}).catch((error) => {
    console.error("Failed to start bot:", error.message || error);
});
