const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
require("dotenv").config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName("weather")
		.setDescription("Provides information about your local weather")
		.addStringOption((option) => option.setName("city").setDescription("Enter City Name").setRequired(true))
		.addStringOption((option) => option.setName("state").setDescription("Enter State Name").setRequired(false)),

	async execute(interaction) {
		await interaction.deferReply();

		const city = interaction.options.getString("city");
		console.log(city);
		const state = interaction.options.getString("state");
		const cityQuery = encodeURIComponent(city);
		const stateQuery = encodeURIComponent(state);

		const weatherResults = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cityQuery}&appid=${process.env.WEATHER_API_KEY}`);
		const list = await weatherResults.json();
		const lon = list.coord.lon;
		const lat = list.coord.lat;
		const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${lon},${lat},9.07,0/300x200?access_token=${process.env.MAP_API_KEY}`;
		const tempEmoji = (((list.main.temp - 273.15) * 9) / 5 + 32).toFixed(2) < 55 ? "❄️" : "☀️";
		let cloudEmoji = "";
		let percipEmoji = "";
		let cardColor = 0;

		if ((((list.main.temp - 273.15) * 9) / 5 + 32).toFixed(2) <= 45) {
			//Blue
			cardColor = 0x3498db;
		} else if ((((list.main.temp - 273.15) * 9) / 5 + 32).toFixed(2) >= 46 && (((list.main.temp - 273.15) * 9) / 5 + 32).toFixed(2) <= 77) {
			//Orange
			cardColor = 0xe67e22;
		} else {
			//Red
			cardColor = 0xed4245;
		}

		if (list.clouds.all <= 5) {
			cloudEmoji = "☀️";
		} else if (list.clouds.all >= 6 && list.clouds.all <= 45) {
			cloudEmoji = "🌤️";
		} else {
			cloudEmoji = "☁️";
		}

		if ((((list.main.temp - 273.15) * 9) / 5 + 32).toFixed(2) <= 32 && list.main.humidity >= 80) {
			percipEmoji = "🌨️";
		} else if ((((list.main.temp - 273.15) * 9) / 5 + 32).toFixed(2) >= 35 && list.main.humidity >= 80) {
			percipEmoji = "🌧️";
		} else {
			percipEmoji = "☀️";
		}

		const embed = new EmbedBuilder()
			.setColor(cardColor) //0xefff00
			.setImage(mapUrl)
			.setTitle(`Current weather for ${list.name}`)
			.addFields(
				{ name: `Temp ${tempEmoji}`, value: `${(((list.main.temp - 273.15) * 9) / 5 + 32).toFixed(2)}°F` },
				{ name: `Feels Like ${tempEmoji}`, value: `${(((list.main.feels_like - 273.15) * 9) / 5 + 32).toFixed(2)}°F` },
				{ name: `Humidity ${percipEmoji}`, value: `${list.main.humidity}%` },
				{ name: `Clouds ${cloudEmoji}`, value: `${list.clouds.all}%` },
				{ name: "Wind", value: `${list.wind.speed} Mph` }
			);

		interaction.editReply({ embeds: [embed] });
	},
};