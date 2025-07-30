const SlackApiKey = process.env['SLACK_API_KEY']
const SlackChannelId = process.env['SLACK_CHANNEL_ID']
const SlackBaseUrl = "https://slack.com/api"

function getUrl(endpoint) {
    return SlackBaseUrl + "/" + endpoint
}

const StandardHeaders = {"Authorization": "Bearer " + SlackApiKey,
			 "Content-Type": "application/json"}

async function handleFetch(url, req) {
    try {
        const response = await fetch(url, req);
        if (!response.ok) {
            return {error: `HTTP error! status: ${response.status} ${response.text} ${response.statusText}`}
	}
        return await response.json();
    } catch (error) {
        return { error: error.message };
    }
}

async function waitForReply(thread) {
    const apiUrl = getUrl("conversations.replies?ts=" + thread + "&channel=" + SlackChannelId)
    await new Promise(resolve => setTimeout(resolve, 10000))
    const resp = await handleFetch(apiUrl, {
        method: 'GET',
        headers: StandardHeaders
    });
    const msgs = resp['messages']
    if (msgs.length >= 2) {
	return msgs[msgs.length - 1]['text']
    } else {
	return 'no response'
    }
}

export async function send(channel, message, env) {
    const apiUrl = getUrl("chat.postMessage")
    const suspId = env.suspend()
    const r = await handleFetch(apiUrl, {
        method: 'POST',
        headers: StandardHeaders,
	body: JSON.stringify({channel: SlackChannelId,
			      text: `${suspId} -- ${message}`,
			      mrkdwn: true})
    });
    return r.ts
}

export async function receive(threadId) {
	const response = await waitForReply(threadId)
	return response
}
