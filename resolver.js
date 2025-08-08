let al_integmanager
import(`${process.cwd()}/node_modules/agentlang/out/runtime/integrations.js`).then((r) => {
    al_integmanager = r
})

function getApiKey() {
    return al_integmanager.getIntegrationConfig('slack', 'apiKey')
}

function getChannel() {
    return al_integmanager.getIntegrationConfig('slack', 'channel')
}

const SlackBaseUrl = "https://slack.com/api"

function getUrl(endpoint) {
    return SlackBaseUrl + "/" + endpoint
}

function StandardHeaders() {
    return {"Authorization": "Bearer " + getApiKey(),
	    "Content-Type": "application/json"
	   }
}

async function handleFetch(url, req) {
    try {
        const response = await fetch(url, req);
        if (!response.ok) {
            return { error: `HTTP error! status: ${response.status} ${response.text} ${response.statusText}` }
        }
        return await response.json();
    } catch (error) {
        return { error: error.message };
    }
}

async function waitForReply(thread) {
    const apiUrl = getUrl("conversations.replies?ts=" + thread + "&channel=" + getChannel())
    await new Promise(resolve => setTimeout(resolve, 10000))
    const resp = await handleFetch(apiUrl, {
        method: 'GET',
        headers: StandardHeaders()
    });
    const msgs = resp['messages']
    if (msgs.length >= 2) {
        return msgs[msgs.length - 1]['text']
    } else {
        return 'no response'
    }
}

const AL_HOST = process.env['AL_HOST'] || 'http://localhost:8080'

export async function send(channel, message, env) {
    const apiUrl = getUrl("chat.postMessage")
    //const suspId = env.suspend()
    const r = await handleFetch(apiUrl, {
        method: 'POST',
        headers: StandardHeaders(),
        body: JSON.stringify({
            channel: getChannel(),
            markdown_text: `${message}
Please reply to either *approve* or *reject* this request`,
            mrkdwn: true
        })
    });
    return r.ts
}

export async function receive(threadId, env) {
    const suspData = env.lookupSuspensionUserData()
    if (suspData) {
        return suspData
    }
    const response = await waitForReply(threadId)
    return response
}
