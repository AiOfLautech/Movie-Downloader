require('dotenv').config(); // Load environment variables
const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN); // Initialize the bot

// Temporary storage for user preferences and feedback
const userLanguages = {};
const users = new Set();

// Command: /start
bot.start((ctx) => {
  // Add user to the users set
  users.add(ctx.from.id);

  ctx.reply(
    `Welcome to CineMindBot!\n\nAvailable commands:\n` +
      `/download <movie_name> - Search and download movies\n` +
      `/subtitle <movie_name> - Download subtitles\n` +
      `/recommend - Get trending movies\n` +
      `/info <movie_name> - Get movie details\n` +
      `/language - Change language preferences\n` +
      `/owner - Contact owner\n` +
      `/donate - Get donation details\n` +
      `/users - View users (Owner only)\n` +
      `/feedback - Send feedback`
  );
});

// Command: /owner
bot.command('owner', (ctx) => {
  ctx.reply(`Owner: AI Of Lautech\nContact: +2348089336992`);
});

// Command: /feedback
bot.command('feedback', (ctx) => {
  ctx.reply('Please send your feedback directly in this chat. Example: "feedback This bot is awesome!"');
});
bot.on('text', async (ctx) => {
  const message = ctx.message.text.toLowerCase();

  if (message.startsWith('feedback')) {
    const feedback = ctx.message.text.split(' ').slice(1).join(' ');
    if (!feedback) {
      return ctx.reply('Please provide feedback! Example: "feedback I love this bot!"');
    }

    await bot.telegram.sendMessage(
      process.env.OWNER_ID,
      `Feedback from ${ctx.from.username || ctx.from.id}:\n\n${feedback}`
    );
    ctx.reply('Thank you for your feedback!');
  }
});

// Command: /users (Owner only)
bot.command('users', (ctx) => {
  if (ctx.from.id.toString() !== process.env.OWNER_ID) {
    return ctx.reply('This command is restricted to the owner.');
  }

  const userList = Array.from(users)
    .map((userId, index) => `${index + 1}. User ID: ${userId}`)
    .join('\n');

  ctx.reply(`Registered Users:\n\n${userList || 'No users yet.'}`);
});

// Command: /download
bot.command('download', async (ctx) => {
  const movieName = ctx.message.text.split(' ').slice(1).join(' ');
  if (!movieName) {
    return ctx.reply('Please provide a movie name! Example: /download Deadpool');
  }

  try {
    ctx.reply(`Searching for "${movieName}"...`);
    const response = await axios.get(`https://api-site-2.vercel.app/api/sinhalasub/search?q=${encodeURIComponent(movieName)}`);
    const movies = response.data.result || [];

    if (movies.length === 0) {
      return ctx.reply(`No results found for "${movieName}".`);
    }

    const movieList = movies
      .slice(0, 10)
      .map(
        (movie, index) =>
          `${index + 1}. ${movie.title}\nMovie Link: ${movie.link}\nDownload Link: https://pixeldrain.com/api/file/${movie.link}?download`
      )
      .join('\n\n');

    ctx.reply(`Search Results for "${movieName}":\n\n${movieList}`);
  } catch (error) {
    console.error('Error during movie search:', error.message);
    ctx.reply('An error occurred while searching for the movie. Please try again.');
  }
});

// Command: /subtitle
bot.command('subtitle', async (ctx) => {
  const movieName = ctx.message.text.split(' ').slice(1).join(' ');
  if (!movieName) {
    return ctx.reply('Please provide a movie name! Example: /subtitle Deadpool');
  }

  try {
    ctx.reply(`Searching subtitles for "${movieName}"...`);
    const response = await axios.get(`https://api.opensubtitles.com/api/v1/subtitles?query=${encodeURIComponent(movieName)}`, {
      headers: { 'Api-Key': process.env.OPENSUBTITLES_API_KEY },
    });
    const subtitles = response.data.data || [];

    if (subtitles.length === 0) {
      return ctx.reply(`No subtitles found for "${movieName}".`);
    }

    const subtitleList = subtitles
      .slice(0, 10)
      .map((subtitle, index) => `${index + 1}. Language: ${subtitle.attributes.language}\nDownload Link: ${subtitle.attributes.url}`)
      .join('\n\n');

    ctx.reply(`Subtitle Results for "${movieName}":\n\n${subtitleList}`);
  } catch (error) {
    console.error('Error during subtitle search:', error.message);
    ctx.reply('An error occurred while searching for subtitles. Please try again.');
  }
});

// Command: /recommend
bot.command('recommend', async (ctx) => {
  try {
    const response = await axios.get(`https://api.themoviedb.org/3/trending/movie/day?api_key=${process.env.TMDB_API_KEY}`);
    const trendingMovies = response.data.results || [];

    if (trendingMovies.length === 0) {
      return ctx.reply('No trending movies found.');
    }

    const recommendations = trendingMovies
      .slice(0, 5)
      .map(
        (movie, index) =>
          `${index + 1}. ${movie.title} (${movie.release_date.substring(0, 4)})\nRating: ${movie.vote_average}`
      )
      .join('\n\n');

    ctx.reply(`Trending Movies Today:\n\n${recommendations}`);
  } catch (error) {
    console.error('Error fetching trending movies:', error.message);
    ctx.reply('An error occurred while fetching trending movies.');
  }
});

// Command: /info
bot.command('info', async (ctx) => {
  const movieName = ctx.message.text.split(' ').slice(1).join(' ');
  if (!movieName) {
    return ctx.reply('Please provide a movie name! Example: /info Deadpool');
  }

  try {
    const response = await axios.get(`http://www.omdbapi.com/?t=${encodeURIComponent(movieName)}&apikey=${process.env.OMDB_API_KEY}`);
    const movie = response.data;

    if (movie.Response === 'False') {
      return ctx.reply('No movie found with that name.');
    }

    ctx.reply(
      `Title: ${movie.Title}\n` +
        `Rating: ${movie.imdbRating}\n` +
        `Year: ${movie.Year}\n` +
        `Genre: ${movie.Genre}\n` +
        `Plot: ${movie.Plot}`
    );
  } catch (error) {
    console.error('Error fetching movie info:', error.message);
    ctx.reply('An error occurred while fetching movie info.');
  }
});

// Command: /language
bot.command('language', (ctx) => {
  const userId = ctx.from.id;

  if (userLanguages[userId]) {
    ctx.reply(
      `Your current language preference is: ${userLanguages[userId]}\nReply with your new preference: English, French, Spanish`
    );
  } else {
    ctx.reply('Reply with your language preference: English, French, or Spanish.');
  }
});

// Command: /donate
bot.command('donate', (ctx) => {
  ctx.reply(
    'Donation Details:\n' +
      'Bank Name: Moniepoint\n' +
      'Account Number: 8089336992\n' +
      'Account Name: Babalola Hephzibah Samuel\n\n' +
      'Thank you for supporting CineMindBot!'
  );
});

// Webhook setup for Render
if (process.env.RENDER_EXTERNAL_URL) {
  bot.telegram.setWebhook(`${process.env.RENDER_EXTERNAL_URL}/webhook`);
  bot.startWebhook('/webhook', null, process.env.PORT || 3000);
  console.log('Bot running with webhook!');
} else {
  bot.launch().then(() => console.log('Bot running with long polling!'));
}

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
