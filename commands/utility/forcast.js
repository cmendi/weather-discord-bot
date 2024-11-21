const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
require("dotenv").config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName("forcast")
		.setDescription("Provides information about your local forecast")
		.addStringOption((option) => option.setName("city").setDescription("Enter City Name").setRequired(true)),

	async execute(interaction) {
		await interaction.deferReply();

		const city = interaction.options.getString("city");
		const cityQuery = encodeURIComponent(city);

		// Fetch current weather data
		const weatherResults = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cityQuery}&appid=${process.env.WEATHER_API_KEY}`);
		const list = await weatherResults.json();
		const lon = list.coord.lon;
		const lat = list.coord.lat;

		// Fetch 5-day forecast data
		const forecastResults = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.WEATHER_API_KEY}`);
		const forecastList = await forecastResults.json();

		const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${lon},${lat},9.07,0/300x200?access_token=${process.env.MAP_API_KEY}`;
		let cardColor = 0xefff00;

		// Calculate daily high temperatures
		const dailyHighs = [];
		for (let i = 0; i < forecastList.list.length; i += 8) {
			const dayData = forecastList.list.slice(i, i + 8); // Group by day (8 intervals)
			const maxTempKelvin = Math.max(...dayData.map((forecast) => forecast.main.temp_max));
			const minTempKelvin = Math.min(...dayData.map((forecast) => forecast.main.temp_min));
			const maxTempFahrenheit = ((maxTempKelvin - 273.15) * 9) / 5 + 32;
			const minTempFahrenheit = ((minTempKelvin - 273.15) * 9) / 5 + 32;

			dailyHighs.push({
				date: dayData[0].dt_txt.split(" ")[0], // Extract date (YYYY-MM-DD)
				highTemp: maxTempFahrenheit.toFixed(2), // Format to 2 decimal places
				lowTemp: minTempFahrenheit.toFixed(2), // Format to 2 decimal places
				description: dayData[0].weather[0].description, // Take first interval's description
			});
		}

		// Build the embed
		const embed = new EmbedBuilder()
			.setColor(cardColor)
			.setImage(mapUrl)
			.setTitle(`5-Day Forecast for ${list.name}`)
			.setFooter({ text: "Data provided by OpenWeatherMap" })
			.setTimestamp()
			.setThumbnail("https://openweathermap.org/img/wn/01d.png");

		// Add fields for each day's forecast
		dailyHighs.slice(0, 5).forEach((forecast) => {
			embed.addFields({
				name: `${forecast.date}`,
				value: `**Description:** ${forecast.description}\n**High Temp:** ${forecast.highTemp}°F\n**Low Temp:** ${forecast.lowTemp}°F`,
			});
		});

		interaction.editReply({ embeds: [embed] });
	},
};
