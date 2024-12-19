

# CineMindBot Movie Bot

This is a Telegram bot that allows users to search for movies on SinhalaSub and get download links.

## Features
- `/download <movie_name>`: Search for a movie and get download links.
- `/owner`: Display the bot owner's contact information.
- `/start`: Display a list of available commands.

## Requirements
- Node.js
- A valid Telegram bot token

## Installation
1. Clone the repository:

git clone https://github.com/your-repo/sinhalasub-bot.git cd sinhalasub-bot

2. Install dependencies:

npm install

3. Run the bot:

node bot.js

## Deployment
You can deploy this bot on platforms like [Render](https://render.com) or [Vercel](https://vercel.com).

## License
This project is licensed under the MIT License.


---

Deployment on Render

1. Push your files to a GitHub repository.


2. Go to Render.


3. Click "New +" > "Web Service".


4. Connect your GitHub repository.


5. Set the Start Command to:

npm install && npm start


6. Add the environment variable for your bot token:

Key: BOT_TOKEN

Value: Your Telegram bot token.



7. Deploy the bot.
