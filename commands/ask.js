const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const { openAIKey } = require('../config.json');

const configuration = new Configuration({
	apiKey: openAIKey,
});
const openai = new OpenAIApi(configuration);
const successEmbed = new EmbedBuilder()
	.setColor([109, 108, 163])
	.setTimestamp();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ask')
		.setDescription('Ask Yuuka a question!')
		.addStringOption(option => option.setName('message').setDescription('Your question here.').setRequired(true).setMaxLength(1024)),
	async execute(interaction) {
		await interaction.deferReply();
		const query = interaction.options.getString('message');
		console.log(`[Information] ${interaction.member.displayName} asked ${query}`);
		const result = await openai.createChatCompletion({
			model: 'gpt-3.5-turbo',
			messages: [
				{ 'role': 'system', 'content': 'You are Yuuka, the student assistant of Sensei which is the one talking to you.' },
				{ 'role': 'user', 'content': `${query}` },
			],
		});
		successEmbed.setTitle(interaction.member.displayName + ': ' + query);
		await interaction.editReply({ embeds: [successEmbed] });
		await interaction.channel.send(result.data.choices[0].message.content);
	},
};