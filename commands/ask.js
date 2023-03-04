const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const { QuickDB } = require('quick.db');
const { openAIKey } = require('../config.json');

const configuration = new Configuration({
	apiKey: openAIKey,
});
const openai = new OpenAIApi(configuration);
const db = new QuickDB();

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
				{ 'role': 'system', 'content': 'You are Ushio Noa, your nickname is Noa, you are the secretary of the student council "Seminar" at Millennium Science School. Today, you are assisting Sensei which is the one interacting with you. Speak like a japanese student.' },
				{ 'role': 'user', 'content': `${query}` },
			],
		});
		await db.set(`userId_${interaction.member.id}.promptCount`, 1);
		await db.set(`userId_${interaction.member.id}.userPrompt`, [query]);
		await db.set(`userId_${interaction.member.id}.noaPrompt`, [result.data.choices[0].message.content]);
		console.log('Total tokens used: ' + result.data.usage.total_tokens);
		const successEmbed = new EmbedBuilder()
			.setColor([109, 108, 163])
			.setTimestamp()
			.setTitle(interaction.member.displayName + ': ' + query)
			.addFields({ name: 'Prompt: ', value: `${await db.get(`userId_${interaction.member.id}.promptCount`)} out of 3` });
		await interaction.editReply({ embeds: [successEmbed] });
		await interaction.channel.send(result.data.choices[0].message.content);
	},
};