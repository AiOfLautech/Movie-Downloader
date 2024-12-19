require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

const botToken = process.env.BOT_TOKEN;
const bot = new TelegramBot(botToken, { polling: true });

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "🎥 Welcome to the SinhalaSub Movie Downloader Bot!\n\nType a movie name to search.");
});

bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const query = msg.text;

    if (query.startsWith("/")) return;

    bot.sendMessage(chatId, `🔍 Searching for "${query}"...`);
    try {
        const response = await axios.get(`https://api-site-2.vercel.app/api/sinhalasub/movie?query=${encodeURIComponent(query)}`);
        const movies = response.data.result || [];

        if (movies.length === 0) {
            bot.sendMessage(chatId, `❌ No results found for "${query}".`);
            return;
        }

        let movieList = `📽️ *Search Results for* "${query}":\n\n`;
        movies.forEach((movie, index) => {
            movieList += `*${index + 1}.* ${movie.title}\n🔗 [Download Link](${movie.link})\n\n`;
        });

        bot.sendMessage(chatId, movieList, { parse_mode: "Markdown" });
    } catch (error) {
        console.error("Error fetching movies:", error);
        bot.sendMessage(chatId, "❌ An error occurred while searching. Please try again later.");
    }
});
