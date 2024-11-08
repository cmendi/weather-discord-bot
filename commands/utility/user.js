const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { request } = require("undici");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("user")
		.setDescription("Provides information about the user.")
		.addStringOption(
			(option) => option.setName("term").setDescription("The term to search for").setRequired(true) // Makes the option required
		),

	async execute(interaction) {
		const trim = (str, max) => (str.length > max ? `${str.slice(0, max - 3)}...` : str);
		await interaction.deferReply();

		// Extract the term input from the interaction options
		const term = interaction.options.getString("term");
		console.error(term); // Debug to ensure term is captured

		const query = new URLSearchParams({ term });

		const dictResult = await request(`https://api.urbandictionary.com/v0/define?${query}`);
		const { list } = await dictResult.body.json();

		if (!list.length) {
			return interaction.editReply(`No results found for **${term}**.`);
		}

		const [answer] = list;

		const embed = new EmbedBuilder()
			.setColor(0xefff00)
			.setTitle(answer.word)
			.setURL(answer.permalink)
			.addFields(
				{ name: "Definition", value: trim(answer.definition, 1024) },
				{ name: "Example", value: trim(answer.example, 1024) },
				{
					name: "Rating",
					value: `${answer.thumbs_up} thumbs up. ${answer.thumbs_down} thumbs down.`,
				}
			);
		interaction.editReply({ embeds: [embed] });
	},
};
