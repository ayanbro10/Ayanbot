const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const ytdl = require('@distube/ytdl-core');
const ytSearch = require('yt-search');

const app = express();
const PORT = process.env.PORT || 3000;
const PAGE_ACCESS_TOKEN = 'EAAU2eqYXA4ABOZCCz9hIQ9bVpCZAh2F0S11btyavrKt1ZB2m9ZA3N34HD7SORQz2icIW9JUY6aM2wf0ljRfJ1ZCW6ZBNFv5why8Ho4ZBE2ik0CTeaFltZCeZARBUi0PtFe1TkZAVZBn5z8Xp8Ydw2ZBLeOb2kwerIM5nRn5G5C6v6RngErVnN7APKNnFQA8kKpALZByCWpQZDZD';
const VERIFY_TOKEN = 'pagebot';

app.use(bodyParser.json());

// Verify the webhook with Facebook
app.get('/webhook', (req, res) => {
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});

// Handle webhook events
app.post('/webhook', (req, res) => {
    let body = req.body;

    if (body.object === 'page') {
        body.entry.forEach(function (entry) {
            let webhook_event = entry.messaging[0];
            let sender_psid = webhook_event.sender.id;

            if (webhook_event.message && webhook_event.message.text) {
                handleMessage(sender_psid, webhook_event.message.text);
            }
        });

        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

function handleMessage(sender_psid, received_message) {
    const prefix = '!yt';  // Prefix for commands

    if (received_message.startsWith(prefix)) {
        const query = received_message.slice(prefix.length).trim();
        ytSearch(query, function (err, result) {
            if (err) {
                sendTextMessage(sender_psid, 'Error: Unable to search');
                return;
            }

            const video = result.videos[0];  // Get the first video result
            const videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;

            sendVideo(sender_psid, videoUrl);
        });
    } else {
        sendTextMessage(sender_psid, "Send a command with !yt <search term>");
    }
}

function sendTextMessage(sender_psid, message) {
    let response = { text: message };

    request({
        url: `https://graph.facebook.com/v12.0/me/messages`,
        qs: { access_token: PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: {
            recipient: { id: sender_psid },
            message: response
        }
    });
}

function sendVideo(sender_psid, videoUrl) {
    let response = {
        attachment: {
            type: 'video',
            payload: {
                url: videoUrl,
                is_reusable: true
            }
        }
    };

    request({
        url: `https://graph.facebook.com/v12.0/me/messages`,
        qs: { access_token: PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: {
            recipient: { id: sender_psid },
            message: response
        }
    });
}

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
