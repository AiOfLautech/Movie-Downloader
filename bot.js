const { sinhalaSub } = require("mrnima-moviedl");
const axios = require("axios");
require("dotenv").config(); // For environment variables like BOT_TOKEN

const { Telegraf } = require("telegraf");
const bot = new Telegraf(process.env.BOT_TOKEN);

// Command to start the bot
bot.command("start", (ctx) => {
    ctx.reply("🎬 Welcome to the SinhalaSub Movie Downloader Bot! Type a movie name to search.");
});

// Handle text messages
bot.on("text", async (ctx) => {
    const query = ctx.message.text.trim();

    if (!query) {
        return ctx.reply("❌ Please provide a movie name to search. Example: `Venom`", { parse_mode: "Markdown" });
    }

    ctx.reply(`🔍 Searching for "${query}"...`);

    try {
        // Use SinhalaSub package to search for movies
        const sinhala = await sinhalaSub();
        const results = await sinhala.search(query);

        if (!results.result || results.result.length === 0) {
            return ctx.reply(`❌ No results found for "${query}". Please try a different movie.`);
        }

        const movies = results.result.slice(0, 5); // Get the first 5 movies
        let movieList = `🎥 *Search Results for* "${query}":\n\n`;

        // Display movie list to the user
        movies.forEach((movie, index) => {
            movieList += `*${index + 1}.* ${movie.title}\n🔗 [Select this movie](${movie.link})\n\n`;
        });

        await ctx.reply(movieList, { parse_mode: "Markdown" });

        // Process movie selection
        bot.on("callback_query", async (callbackQuery) => {
            const selectedMovieIndex = parseInt(callbackQuery.data);

            if (isNaN(selectedMovieIndex) || selectedMovieIndex < 1 || selectedMovieIndex > movies.length) {
                return ctx.reply("❌ Invalid selection. Please try again.");
            }

            const selectedMovie = movies[selectedMovieIndex - 1];
            const apiUrl = `https://api-site-2.vercel.app/api/sinhalasub/movie?url=${encodeURIComponent(selectedMovie.link)}`;

            try {
                // Fetch movie download links
                const { data } = await axios.get(apiUrl);

                if (!data.result || !data.result.dl_links || data.result.dl_links.length === 0) {
                    return ctx.reply("❌ No download links found for this movie.");
                }

                let downloadLinks = `🎥 *${data.result.title}*\n\n*Available Download Links:*\n`;
                data.result.dl_links.forEach((link, index) => {
                    downloadLinks += `*${index + 1}.* ${link.quality} - ${link.size}\n🔗 [Download](${link.link})\n\n`;
                });

                await ctx.reply(downloadLinks, { parse_mode: "Markdown" });

            } catch (error) {
                console.error("Error fetching download links:", error.message || error);
                ctx.reply("❌ An error occurred while fetching download links. Please try again later.");
            }
        });

    } catch (error) {
        console.error("Error searching for movies:", error.message || error);
        ctx.reply("❌ An error occurred while searching. Please try again later.");
    }
});

// Start the bot
bot.launch().then(() => {
    console.log("🎬 SinhalaSub Movie Bot is running...");
}).catch((error) => {
    console.error("Failed to start bot:", error.message || error);
});
