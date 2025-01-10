{:name :Slack
 :agentlang-version "0.6.2-alpha"
 :components [:Slack.Core]
 :channel {:tools [:Slack.Core/Chat :Slack.Core/ManagerSlackChannel]}
 :connection-types
 {:Slack/Connection
  {:type :ApiKey
   :title "Configure Slack Connection"
   :description "add your api-key from slack"}}}
