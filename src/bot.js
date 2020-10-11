const Discord = require('discord.js');
require('dotenv').config()
const sightengine = require('sightengine')(process.env.API_USER, process.env.API_SECRET);
const botInfo = require('./bot_info')

const prefix = 'ac!'

const client = new Discord.Client()
client.login(process.env.BOT_TOKEN)

var elementsToCheck = [
    'nudity',
    'wad',
    'offensive',
    'scam'
]

client.on('message', function(message) {
    //Check if the bot needs to deal with the message.
    if (!message.content.startsWith(prefix)) return

    const commandBody = message.content.slice(prefix.length)
    const args = commandBody.split(' ')
    const command = args.shift().toLowerCase()

    switch (command) {
        //Help command
        case 'help':
            var embed = new Discord.MessageEmbed()
                .addField(`${prefix}help`, 'Displays what you are reading.')
                .addField(`${prefix}contact`, 'Displays Bot author\'s contact information.')
                .addField(`${prefix}info`, 'Displays information about what the bot does.')
                .setColor(0x000000)
                .setFooter('By ' + botInfo.authorName, botInfo.authorLogo)
            message.channel.send(embed)
            break

        //Contact command
        case 'contact':
            var embed = new Discord.MessageEmbed()
                .setTitle('Contact the Bot author:')
                .setDescription(botInfo.authorContact)
                .setColor(0x000000)
                .setFooter('By ' + botInfo.authorName, botInfo.authorLogo)
            message.channel.send(embed)
            break
        
        //Info command
        case 'info':
            var embed = new Discord.MessageEmbed()
                .setTitle('Information about ' + botInfo.botName)
                .setThumbnail(botInfo.botLogo)
                .setDescription('This Discord Bot will check the avatar of every new member joing the server, and will verify if the image is appropriate or not.')
                .addField('What the bot detects:', 'Nudity (Raw or partial)\nWeapons\nAlcohol\nDrugs\nOffensive content\nScam content')
                .addField('How does he do it?', 'The bot uses an AI provided by https://sightengine.com/.')
                .setColor(0x000000)
                .setFooter('By ' + botInfo.authorName, botInfo.authorLogo)
            message.channel.send(embed)
            break
        
        default:
            var embed = new Discord.MessageEmbed()
                .setDescription(`This command does not exist.\nType **${prefix}help** to see the available commands.`)
                .setColor(0x000000)
                .setFooter('By ' + botInfo.authorName, botInfo.authorLogo)
            message.channel.send(embed)
            break
    }
})

client.on('guildMemberAdd', function(member) {

    //Avatar of the new member.
    var avatarURL = member.user.avatarURL({
        format: 'png',
        dynamic: false,
        size: 256
    })

    //Variable that will contain the inappropriate elements of the avatar.
    var inappropriateElements = []

    //Check the validity of the avatar.
    sightengine.check(elementsToCheck).set_url(avatarURL)
    .then(function(result) {

        //Check nudity
        if (elementsToCheck.includes('nudity')) {
            if (result.nudity.raw >= 0.3) {
                inappropriateElements.push('**Raw nudity** (Probability: ' + result.nudity.raw*100 + '%)')
            }
            if (result.nudity.partial >= 0.5) {
                inappropriateElements.push('**Partial nudity** (Probability: ' + result.nudity.partial*100 + '%)')
            }
        }

        //Check Weapon, Alcohol, Drugs
        if (elementsToCheck.includes('wad')) {
            if (result.weapon >= 0.3) {
                inappropriateElements.push('**Weapon** (Probability: ' + result.weapon*100 + '%)')
            }
            if (result.alcohol >= 0.3) {
                inappropriateElements.push('**Alcohol** (Probability: ' + result.alcohol*100 + '%)')
            }
            if (result.drugs >= 0.3) {
                inappropriateElements.push('**Drugs** (Probability: ' + result.drugs*100 + '%)')
            }
        }

        //Check Offensive content
        if (elementsToCheck.includes('offensive')) {
            console.log(result.offensive.hasOwnProperty('boxes'))
            if (result.offensive.hasOwnProperty('boxes')) {
                console.log(result.offensive.boxes[0].label)
                inappropriateElements.push('**Offensive** (' + result.offensive.boxes[0].label + ')')
            }
        }

        //Check Scam content
        if (elementsToCheck.includes('scam')) {
            if (result.scam.prob >= 0.5) {
                inappropriateElements.push('**Scam** (Probability: ' + result.scam.prob*100 + '%)')
            }
        }

        if (inappropriateElements.length != 0) {
        
            var messageToDisplay = 'You cannot join this server because your profile picture is inappropriate. We have detected the following element(s):\n' +
                inappropriateElements.join('\n') +
                '\n\nAfter changing it, you will be able to rejoin the server.'
    
            var embed = new Discord.MessageEmbed()
                .setTitle('You have been kicked from ' + member.guild.name)
                .setColor(0xf5a442)
                .setDescription(messageToDisplay)
                .setFooter('By ' + botInfo.authorName, botInfo.authorLogo)

            //Send a DM to notify the user and kick him.
            member.send(embed).then(function() {
                member.kick('Inappropriate profile picture (' + inappropriateElements.join(' / ') + ').')
            })
    
        }

    }).catch(function(err) {
        console.log(err)
    })

})