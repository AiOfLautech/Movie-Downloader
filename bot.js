require('dotenv').config(); // Load environment variables from .env file
const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');

// Your API keys
const tmdbApiKey = process.env.TMDB_API_KEY;
const omdbApiKey = process.env.OMDB_API_KEY;

// Initialize the bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Webhook setup for Render
if (process.env.RENDER_EXTERNAL_URL) {
  bot.telegram.setWebhook(`${process.env.RENDER_EXTERNAL_URL}/bot${process.env.BOT_TOKEN}`);
}

// Command: /start
bot.start((ctx) => {
  ctx.reply(
    `👋 *Welcome to CineMindBot!*\n\n` +
    `🎥 \`/download <movie_name>\` - Search and download movies.\n` +
    `📝 \`/feedback\` - Provide feedback or suggestions.\n` +
    `🔥 \`/recommend\` - Get movie recommendations.\n` +
    `📜 \`/history\` - View your search history.\n` +
    `🌐 \`/language\` - Change your preferred language.\n` +
    `🎬 \`/info <movie_name>\` - Get more movie details.\n\n` +
    `_Powered by AI Of Lautech_`,
    { parse_mode: 'Markdown' }
  );
});

// Command: /owner
bot.command('owner', (ctx) => {
  ctx.reply(
    '🤖 *Bot Owner:*\n*AI Of Lautech*\n📞 WhatsApp: +2348089336992',
    { parse_mode: 'Markdown' }
  );
});

// Command: /download
bot.command('download', async (ctx) => {
  const movieName = ctx.message.text.split(' ').slice(1).join(' ');
  if (!movieName) {
    return ctx.reply('⚠️ Please provide a movie name! Example: `/download Inception`');
  }

  if (!ctx.session.history) ctx.session.history = [];
  ctx.session.history.push(movieName);
  if (ctx.session.history.length > 10) ctx.session.history.shift();

  try {
    ctx.reply(`🔍 Searching for "${movieName}"...`);
    const response = await axios.get(`https://api-site-2.vercel.app/api/sinhalasub/search?q=${encodeURIComponent(movieName)}`);
    const movies = response.data.result || [];

    if (movies.length === 0) {
      return ctx.reply(`⚠️ No results found for "${movieName}".`);
    }

    const buttons = movies.slice(0, 5).map((movie, index) => {
      return [
        Markup.button.callback(`${index + 1}. ${movie.title} (${movie.year})`, `movie_${index}`)
      ];
    });

    ctx.session.movies = movies;

    ctx.reply(
      `🎥 *Search Results for "${movieName}":*\n\n_Select a movie below to get the download link._`,
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard(buttons),
      }
    );
  } catch (error) {
    console.error('Error fetching movies:', error.message);
    ctx.reply('❌ An error occurred while searching. Please try again.');
  }
});

// Handle movie selection
bot.action(/movie_(\d+)/, async (ctx) => {
  const movieIndex = parseInt(ctx.match[1]);
  const selectedMovie = ctx.session.movies[movieIndex];

  if (!selectedMovie) {
    return ctx.reply('❌ Movie details not found. Please search again.');
  }

  try {
    ctx.reply(`🔗 Fetching download links for "${selectedMovie.title}"...`);
    const pixeldrainLink = `https://pixeldrain.com/api/file/${selectedMovie.fileId}?download`;

    ctx.reply(
      `🎥 *Download Links for "${selectedMovie.title}":*\n\n` +
        `1️⃣ [Direct Download](${pixeldrainLink})\n` +
        `2️⃣ [Watch on SinhalaSub](${selectedMovie.link})\n\n` +
        `_Powered by AI Of Lautech_`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Error fetching download link:', error.message);
    ctx.reply('❌ An error occurred while fetching the download link. Please try again.');
  }
});

// Command: /recommend
bot.command('recommend', async (ctx) => {
  try {
    const response = await axios.get(`https://api.themoviedb.org/3/trending/movie/day?api_key=${tmdbApiKey}`);
    const movies = response.data.results || [];

    if (movies.length === 0) {
      return ctx.reply('⚠️ No trending movies found.');
    }

    const buttons = movies.slice(0, 5).map((movie, index) => {
      return [
        Markup.button.callback(`${index + 1}. ${movie.title} (${movie.release_date.split('-')[0]})`, `recommend_${index}`)
      ];
    });

    ctx.session.trendingMovies = movies;

    ctx.reply(
      '🔥 *Trending Movies Today:*\n\n_Select a movie below to get more details._',
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard(buttons),
      }
    );
  } catch (error) {
    console.error('Error fetching trending movies:', error.message);
    ctx.reply('❌ An error occurred while fetching trending movies. Please try again.');
  }
});

// Handle recommendation selection
bot.action(/recommend_(\d+)/, async (ctx) => {
  const movieIndex = parseInt(ctx.match[1]);
  const movie = ctx.session.trendingMovies[movieIndex];

  if (!movie) {
    return ctx.reply('❌ Movie details not found. Please try again.');
  }

  ctx.reply(
    `🎬 *${movie.title}*\n` +
    `⭐ Rating: ${movie.vote_average}\n` +
    `📅 Released: ${movie.release_date}\n` +
    `📖 Overview: ${movie.overview}`,
    { parse_mode: 'Markdown' }
  );
});

// Command: /history
bot.command('history', (ctx) => {
  const history = ctx.session.history || [];
  if (history.length === 0) {
    ctx.reply('⚠️ No search history found.');
  } else {
    ctx.reply(`📜 *Your Search History:*\n\n${history.join('\n')}`, { parse_mode: 'Markdown' });
  }
});

// Command: /language
bot.command('language', (ctx) => {
  ctx.reply(
    '🌐 Please choose your preferred language:',
    {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('🇬🇧 English', 'lang_en')],
        [Markup.button.callback('🇪🇸 Español', 'lang_es')],
        [Markup.button.callback('🇫🇷 Français', 'lang_fr')],
      ]),
    }
  );
});

// Handle language change
bot.action('lang_en', (ctx) => ctx.reply('Language changed to English.'));
bot.action('lang_es', (ctx) => ctx.reply('Idioma cambiado a Español.'));
bot.action('lang_fr', (ctx) => ctx.reply('Langue changée en Français.'));

// Command: /info
bot.command('info', async (ctx) => {
  const movieName = ctx.message.text.split(' ').slice(1).join(' ');
  if (!movieName) {
    return ctx.reply('⚠️ Please provide a movie name! Example: `/info Avatar`');
  }

  try {
    const response = await axios.get(`http://www.omdbapi.com/?t=${encodeURIComponent(movieName)}&apikey=${omdbApiKey}`);
    const movie = response.data;

    if (movie.Response === 'False') {
      return ctx.reply('⚠️ No movie found with that name.');
    }

    ctx.reply(
      `🎬 *${movie.Title}*\n` +
      `⭐ Rating: ${movie.imdbRating}\n` +
      `📅 Year: ${movie.Year}\n` +
      `📝 Genre: ${movie.Genre}\n` +
      `📖 Plot: ${movie.Plot}`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Error fetching movie info:', error.message);
    ctx.reply('❌ An error occurred while fetching movie details.');
  }
});

// Start the bot
bot.launch()
  .then(() => console.log('🤖 CineMindBot is running!'))
  .catch((err) => console.error('Error launching bot:', err));

module.exports = bot;
