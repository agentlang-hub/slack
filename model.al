{:name :Slack
 :agentlang-version "current"
 :components [:Slack.Core]
 :channel {:tools [:Slack.Core/Chat :Slack.Core/ManagerSlackChannel]}
 :connection-types
 [{:name :Slack/Connection
   :type :Slack.Core/ConnectionConfig
   :title "Configure Slack Connection"
   :description "provide slack api-key and channel-id"}]}
