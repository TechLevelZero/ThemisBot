var { Client, MessageEmbed } = require('discord.js');
var bot = require('./json_files/data.json');
const config = require('./json_files/config.json');
const crypto = require('crypto');
const fs = require('fs'); 

const client = new Client();

// Discord login
client.login('NTg5Mjg1ODQ3NzQ1MDM2Mjg5.XQRdpQ.eBuU-4b1s8yUYZ5ShbcrvpI0e4s');

// Discord error handleing
client.on('error', e => console.error(e));
client.on('warn', e => console.warn(e));
client.on('debug', e => console.log(e));

client.on('ready', () => {
  client.user.setStatus('invisible', 'test')
});

client.on('message', (message) => {
  if (message.author.bot) return;
  const args = message.content.toLowerCase().slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if (message.channel.type === 'dm') {
    if (command === 'passcode') {
      function rFile(callback, content) {
        fs.readFile(`./users/${message.author.id}/PASSCODE.PCHMAC`, 'utf8', function(err, contents) {
          if (err) callback(err, null);

          callback(true, contents)
          console.log(contents);
        });
      }

      rFile((result, content) => {
        if (result === true) {
          if (args[0] === undefined) {
            if (content === '0') {
              return message.channel.send(`Passcode Usage: d!passcode [new passcode] **Its strongly recomened you delete any messages with the passcode in**`);
            } else {
              return message.channel.send(`Passcode Usage: d!passcode [old passcode] [new passcode] **Its strongly recomened you delete any messages with the passcode in**`);
            }
          }
          if (content === '0') {
            if (args[0].length === 4) {
              const contentHashed = crypto.createHmac('sha256', config.key).update(args[0]).digest('hex');
              fs.writeFile(`./users/${message.author.id}/PASSCODE.PCHMAC`, contentHashed, (err) => {
                if (err) throw err;
                console.log("The file was succesfully saved!");
              });
              message.channel.send(`Passcode has been set to '||${args[0]}||' **Its strongly recomened you delete your passcode message** (this message will self destruct)`).then((msg) => {
                setTimeout(() => { msg.delete(1) }, 15000)
              })
            } else { message.channel.send('The passcode can only be 4 digits long') }
          } else {
            const contentHashed = crypto.createHmac('sha256', config.key).update(args[0]).digest('hex');
            if (contentHashed === content) {
              if(args[1] && args[0] === undefined) { message.channel.send('`d!passcode [old passcode] [new passcode]`') } else {
                if (args[1].length === 4) {
                  const contentHashedUpdated = crypto.createHmac('sha256', config.key).update(args[1]).digest('hex');
                  fs.writeFile(`./users/${message.author.id}/PASSCODE.PCHMAC`, contentHashedUpdated, (err) => {
                    if (err) throw err;
                    console.log("The file was succesfully saved!");
                  });
                  message.channel.send(`Passcode has been updated to ||'${args[1]}'|| **Its strongly recomened you delete your passcode message** (this message will self destruct)`).then((msg) => {
                    setTimeout(() => { msg.delete(1) }, 15000)
                  })
                } else { message.channel.send('The passcode can only be 4 digits long') }
              }
            } else { message.channel.send('passcode does not match') } // fight me,  like this style 
          }
        }
      })
    }
  }
  if (command === 'admintools') {
    console.log(message.member)
    if (!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send('you don\'t have the perms to perform this request')
    if (message.mentions.users.first() === undefined) return message.channel.send('That is not a member, usages: `d!admintools add/remove [@member]`');
    var mentionedUser = message.mentions.users.first();
    function ensureExists(path, mask, cb) {
      if (typeof mask == 'function') { // allow the `mask` parameter to be optional
        cb = mask;
        mask = 0777;
      }
      fs.mkdir(path, mask, function(err) {
        if (err) {
          if (err.code == 'EEXIST') cb(null); // ignore the error if the folder already exists
          else cb(err); // something else went wrong
        } else cb(null); // successfully created folder
      });
    }
    ensureExists(__dirname + `/users/${mentionedUser.id}`, 0744, function(err) {
      if (err) {

      } else {
        if (args[0] === 'add') {
          fs.writeFile(`./users/${mentionedUser.id}/${message.guild.id}.dbmtd`, '0', (err) => {
            if (err) throw err;
            console.log("The dbmtd file was succesfully saved!");
          });
          fs.access(`./users/${mentionedUser.id}/PASSCODE.PCHMAC`, fs.F_OK, (err) => {
            if (err) {
              console.error(err)
              fs.writeFile(`./users/${mentionedUser.id}/PASSCODE.PCHMAC`, '0', (err) => {
                if (err) throw err;
                console.log("The PCHMAC file was succesfully saved!");
              });
            }
          })
        }
        if (args[0] === 'remove') {
          fs.unlink(`./users/${mentionedUser.id}/${message.guild.id}.dbmtd`, (err) => {
            if (err) throw err;
            console.log("The user was succesfully removed!");
          }); 
        }
      }
    });
  }

  if (command === 'kick') {
    function checkMod(files, callback) {
      var mark = false
      for (i = 0; files.length > i; i++) {
        if (message.guild.id === (files[i].replace(/(\.)(d)\w+/, ''))) {
          mark = true
        }
      }
      callback(mark)
    }
    const memtionedMember = message.mentions.users.first();
    const member = message.guild.member(memtionedMember);
    if (args[0] === undefined) {
      return message.channel.send('d!kick [Passcode] [@User] [Reason]')
    } else if (memtionedMember === undefined) {
      return message.channel.send('No Member(s) was given'), message.delete(1)
    }
    fs.readdir(`./users/${message.author.id}/`, (err, files) => {
      const contentHashed = crypto.createHmac('sha256', config.key).update(args[0]).digest('hex');
      fs.readFile(`./users/${message.author.id}/PASSCODE.PCHMAC`, 'utf8', function(err, contents) {
        if (contentHashed != contents) return message.channel.send('Passcode did not match'), message.delete(1);
        checkMod(files, boolean => {
          if (boolean === true) {
            member.kick(message.cleanContent.slice(9 + message.mentions.users.first().tag.length)).then(() => {
              message.delete(1)
              message.reply(`Successfully kicked ${message.mentions.users.first().tag}. reason: ${message.cleanContent.slice(9 + message.mentions.users.first().tag.length)}`);
            }).catch(err => {
              message.delete(1)
              message.reply('I was unable to kick the member');
              console.error(err);
            });
          } else {
            message.channel.send('you don\'t have the perms to perform this request')
          }
        })
      });
    });

    // if (message.channel.id === bot.channels.themods || bot.channels.thejoshes || bot.channels.thebot || bot.channels.testfacility) {

    //   function fun(callback) {
    //     // humanCorrectionControl
    //     if (args[0] === undefined) { 
    //       return message.channel.send('d!kick [Passcode] [@User] [Reason]'), message.delete(1)
    //     } else if (message.mentions.users.first() === undefined) { 
    //       return message.channel.send('No Member(s) was given'), message.delete(1)
    //     }

    //     const user = message.mentions.users.first();
    //     const member = message.guild.member(user);
    //     const contentHashed = crypto.createHmac('sha256', config.key).update(args[0]).digest('hex');
    //     db.each(`SELECT passcode FROM modData WHERE userid = '${message.author.id}'`, (err, result) => {
    //       if (contentHashed != result.passcode) return message.channel.send('Passcode did not match'), message.delete(1);
    //     })
    //     console.log(member.id)
    //     callback(user, member)
    //   }

    //   console.log(message.mentions.users)

    //   if (command === 'kick') {
    //     fun((user, member) => {
    //       // message.delete(1)
    //       // message.reply(`Successfully kicked ${user.tag}. Reason: ${message.cleanContent.slice(8 + user.tag.length) || 'No Reason'}`);
    //       console.log(message.cleanContent.slice(4 + user.tag.length))

    //       member.kick(message.cleanContent.slice(4 + user.tag.length)).then(() => {
    //         message.delete(1)
    //         message.reply(`Successfully kicked ${user.tag}. reason: ${message.cleanContent.slice(4, user.tag.length)}`);
    //       }).catch(err => {
    //         message.delete(1)
    //         message.reply('I was unable to kick the member');
    //         console.error(err);
    //       });
    //     })
    //   }
    //   if (command === 'ban') {
    //     fun()
    //     member.ban({
    //       reason: message.cleanContent.slice(3, user.tag.length),
    //     }).then(() => {
    //       message.delete(1)
    //       message.reply(`Successfully banned ${user.tag}`);
    //     }).catch(err => {
    //       message.delete(1)
    //       message.reply('I was unable to ban the member');
    //       console.error(err);
    //     });
    //   }
    // }
  }
  
  if (command === 'ban') { 
    function checkMod(files, callback) {
      var mark = false
      for (i = 0; files.length > i; i++) {
        if (message.guild.id === (files[i].replace(/(\.)(d)\w+/, ''))) {
          mark = true
          // message.channel.send('you tryed to kick but this is a test')
        }
      }
      callback(mark)
    }
    const memtionedMember = message.mentions.users.first();
    // const member = message.guild.member(memtionedMember);
    if (args[0] === undefined) {
      return message.channel.send('d!kick [Passcode] [@User] [Reason]')
    } else if (memtionedMember === undefined) {
      return message.channel.send('No Member(s) was given'), message.delete(1)
    }
    fs.readdir(`./users/${message.author.id}/`, (err, files) => {
      const contentHashed = crypto.createHmac('sha256', config.key).update(args[0]).digest('hex');
      fs.readFile(`./users/${message.author.id}/PASSCODE.PCHMAC`, 'utf8', function(err, contents) {
        if (contentHashed != contents) return message.channel.send('Passcode did not match'), message.delete(1);
        console.log(`Successfully kicked ${message.mentions.users.first().tag}. reason: ${message.cleanContent.slice(9 + message.mentions.users.first().tag.length)}`);
        checkMod(files, boolean => {
          if (boolean === true) {
            var i = 0
            message.mentions.users.map(users => {
              i++
              const member = message.guild.member(users.id);
              if (i > 4) return message.channel.send('Can not ban more then 4 at a time')
              member.ban({
                reason: message.cleanContent.slice(8 + message.mentions.users.first().tag.length),
              }).then(() => {
                message.delete(1)
                message.channel.send(`Successfully banned ${message.mentions.users.first().tag}`);
              }).catch(err => {
                message.delete(1)
                message.channel.send(`${message.member.displayName}, unable to ban ${users.tag}`);
                console.error(err);
              });
            })
            // member.kick(message.cleanContent.slice(9 + message.mentions.users.first().tag.length)).then(() => {
            //   message.delete(1)
            //   message.reply(`Successfully kicked ${message.mentions.users.first().tag}. reason: ${message.cleanContent.slice(9 + message.mentions.users.first().tag.length)}`);
            // }).catch(err => {
            //   message.delete(1)
            //   message.reply('I was unable to kick the member');
            //   console.error(err);
            // });
            // // message.channel.send('you tryed to kick but this is a test'), message.delete(1);
          } else {
            message.channel.send('you don\'t have the perms to perform this request')
          }
        })
      });
    });
  }
  if (command === 'test') {
     message.mentions.users.map(users => {
      console.log(users.id, users.tag)
     })
  }
  
  // db.run("CREATE TABLE modData('userid' VARCHAR, 'passcode' VARCHAR)");
  // console.log(message.guild.roles.get('376873845333950477').members.map(m => m.id))

  //   var mods = message.guild.roles.get('337013993669656586').members.map(m => m.id)
  //   for (var i = 0; mods.length > i; i++) {
  //     console.log('hello')
  //     db.run(`INSERT INTO modData (userid, passcode) VALUES ('${mods[i]}', 0)`);
  //   }
  // db.close();
})

