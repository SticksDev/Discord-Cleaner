let discord_token;
let discord;

// Fetch all guilds from the Discord API
const axios = require('axios').default;
const prompts = require('prompts');

// Ask the user for their Discord token

// Fetch all friends from the Discord API and save them in an array
async function fetchFriends() {
    let friends = [];
    let friendsData = await discord.get('/users/@me/relationships');

    // Filter all friends that are not a friend (blocked, pending, etc.)
    friendsData.data = friendsData.data.filter((friend) => friend.type === 1);

    // Add all friends to the array
    friendsData.data.forEach((friend) => {
        friends.push({
            id: friend.id,
            username: friend.user.username,
            discriminator: friend.user.discriminator,
        });
    });

    return friends;
}

async function main() {
    let response1 = await prompts({
        type: 'text',
        name: 'value',
        message: 'Enter your Discord token:',
    });

    // If the user entered a token, save it and start the program
    if (response1.value) {
        discord_token = response1.value;
        console.log(`Checking token ending in ${discord_token.slice(-4)}...`);
    } else {
        console.log('No token entered - exiting.');
        process.exit();
    }

    discord = axios.create({
        baseURL: 'https://discord.com/api/v10',
        headers: {
            Authorization: `${discord_token}`,
        },
    });
    
    // Check to make sure the token is valid
    await discord
        .get('/users/@me')
        .then((res) => {
            console.log('Logged in as ' + res.data.username);
        })
        .catch((err) => {
            console.log(`Error: ${err.response.data.message ? err.response.data.message : err.response.data}`);
            console.log('Invalid token - exiting.');
            process.exit();
        });

   
    console.log('Fetching friends...');
    let friends = await fetchFriends();

    console.log(`Found ${friends.length} friends.`);

    // For each friend, ask if they want to be kept or removed
    for (let i = 0; i < friends.length; i++) {
        const friend = friends[i];

        // Ask the user if they want to keep the friend
        let response = await prompts({
            type: 'confirm',
            name: 'value',
            message: `Do you want to keep ${friend.username}#${friend.discriminator}?`,
            initial: true,
        });

        // If the user doesn't want to keep the friend, remove them
        if (!response.value) {
            console.log(
                `Removing ${friend.username}#${friend.discriminator}...`,
            );
            let res = await discord.delete(
                `/users/@me/relationships/${friend.id}`,
            );

            // If the friend was removed successfully, log it
            if (res.status === 204) {
                console.log(
                    `Removed ${friend.username}#${friend.discriminator}.`,
                );
            } else {
                console.log(
                    `Failed to remove ${friend.username}#${friend.discriminator} (status code ${res.status}).`,
                );
            }
        }
    }
}

main();
