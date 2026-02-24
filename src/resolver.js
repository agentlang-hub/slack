const INTEG_MANAGER_HOST = process.env.INTEG_MANAGER_HOST || 'http://localhost:8085'
const SLACK_CHANNEL = process.env.SLACK_CHANNEL

async function fetchAuthHeaders() {
    const resp = await fetch(
        `${INTEG_MANAGER_HOST}/integmanager.auth/authHeaders?integrationName=slack`
    )
    if (!resp.ok) {
        throw new Error(`Failed to get auth headers for slack: ${resp.status}`)
    }
    const data = await resp.json()
    return data.headers
}

function getChannel() {
    return SLACK_CHANNEL
}

const SlackBaseUrl = "https://slack.com/api"

function getUrl(endpoint) {
    return SlackBaseUrl + "/" + endpoint
}

async function StandardHeaders() {
    const authHeaders = await fetchAuthHeaders()
    return { ...authHeaders, "Content-Type": "application/json" }
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
        headers: await StandardHeaders()
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
    const suspId = env.suspend()
    const r = await handleFetch(apiUrl, {
        method: 'POST',
        headers: await StandardHeaders(),
        body: JSON.stringify({
            channel: getChannel(),
            markdown_text: `${message}
            <${AL_HOST}/agentlang/activeSuspension/${suspId}:approve|Approve>
            <${AL_HOST}/agentlang/activeSuspension/${suspId}:reject|Reject>
            `,
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
