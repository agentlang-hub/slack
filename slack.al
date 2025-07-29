module slack

import "resolver.js" as slack

record channel {
    channel String
}

event sendMessageOnChannel {
    channel String,
    message String
}

workflow sendMessageOnChannel {
    await slack.send(sendMessageOnChannel.channel, sendMessageOnChannel.message)
}
