const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const { QuickDB } = require('quick.db');
const { openAIKey } = require('../config.json');

const configuration = new Configuration({
	apiKey: openAIKey,
});
const openai = new OpenAIApi(configuration);
const db = new QuickDB;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reply')
		.setDescription('Reply to your current conversation')
		.addStringOption(option => option.setName('message').setDescription('Your reply here.').setRequired(true).setMaxLength(1024)),
	async execute(interaction) {
		await interaction.deferReply();
		const promptCount = await db.get(`userId_${interaction.member.id}.promptCount`);
		if (promptCount == 3) {
			await interaction.editReply('Prompt limit maximum for this conversation has been reached (3). Use /ask to ask another question');
			return;
		}
		const query = interaction.options.getString('message');
		console.log(`[Information] ${interaction.member.displayName} replied ${query}`);
		const userPrompt = await db.get(`userId_${interaction.member.id}.userPrompt`);
		const noaPrompt = await db.get(`userId_${interaction.member.id}.noaPrompt`);
		const messageGroup = [{ 'role' : 'system', 'content' : 'You are Ushio Noa, your nickname is Noa, you are the secretary of the student council "Seminar" at Millennium Science School. Today, you are assisting Sensei which is the one interacting with you. Use sensei honorifics.' }];
		for (let i = 0; i < userPrompt.length; i++) {
			messageGroup.push({ 'role': 'user', 'content' : `${userPrompt[0]}` });
			messageGroup.push({ 'role': 'assistant', 'content' : `${noaPrompt[0]}` });
		}
		messageGroup.push({ 'role': 'user', 'content' : `${query}` });
		const result = await openai.createChatCompletion({
			model: 'gpt-3.5-turbo',
			messages: messageGroup,
		});
		await db.add(`userId_${interaction.member.id}.promptCount`, 1);
		await db.push(`userId_${interaction.member.id}.userPrompt`, [query]);
		await db.push(`userId_${interaction.member.id}.noaPrompt`, [result.data.choices[0].message.content]);
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