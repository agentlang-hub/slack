(component
 :Slack.Core
 {:clj-import [(:require [clojure.string :as s]
                         [agentlang.component :as cn]
                         [agentlang.util :as u]
                         [agentlang.util.http :as http]
                         [agentlang.util.logger :as log]
                         [agentlang.datafmt.json :as json]
                         [agentlang.connections.client :as cc]
                         [agentlang.lang.internal :as li])]})

(entity
 :ConnectionConfig
 {:apikey :String
  :channelid :String})

(entity
 :Chat
 {:id :Identity
  :channel {:type :String :optional true}
  :text :String
  :mrkdwn {:type :Boolean :default true}
  :thread {:type :String :optional true}})

(entity
 :Response
 {:chat :Chat
  :text {:type :String :read-only true}})

(defn slack-connection []
  (cc/open-connection :Slack/Connection))

(defn slack-api-key []
  (or (:apikey (cc/connection-parameter (slack-connection))) (System/getenv "SLACK_API_KEY")))

(defn slack-channel-id []
  (or (:channelid (cc/connection-parameter (slack-connection))) (System/getenv "SLACK_CHANNEL_ID")))

(def slack-base-url "https://slack.com/api")

(defn get-url [endpoint] (str slack-base-url endpoint))

(defn- handle-response [response result]
  (let [status (:status response)
        body (:body response)]
    (if (<= 200 status 299)
      (let [output-decoded (json/decode body)]
        (if (:ok output-decoded)
          (assoc result :thread (:ts output-decoded))
          (throw (ex-info "Request failed. " output-decoded))))
      (throw (ex-info "Request failed. " {:status status :body body})))))

(defn- http-opts []
  {:headers {"Authorization" (str "Bearer " (slack-api-key))
             "Content-Type" "application/json"}})

(defn- extract-reply [response]
  (let [status (:status response)
        body (:body response)]
    (when (= 200 status)
      (let [output-decoded (json/decode body)]
        (when (:ok output-decoded)
          (let [messages (:messages output-decoded)]
            (when (>= (count messages) 2)
              (s/lower-case (s/trim (:text (second messages)))))))))))

(defn wait-for-reply [channel ts] ; ts=thread
  (let [url (get-url (str "/conversations.replies?ts=" ts "&channel=" channel))
        f (fn [] (Thread/sleep (* 10 1000)) (http/do-get url (http-opts)))
        r
        (loop [response (f), retries 3]
          (if (zero? retries)
            ""
            (if-let [r (extract-reply response)]
              r
              (recur (f) (dec retries)))))]
    (log/debug (str "slack-resolver/wait-for-reply: " r))
    r))

(defn- create-chat [api-name instance]
  (let [data (dissoc instance :-*-type-*- :type-*-tag-*- :thread :id)
        url (get-url (str "/" api-name))
        response (http/do-post url (http-opts) data)]
    (handle-response response instance)))

(defn- create-response [instance]
  (let [chat (:chat instance)
        r (wait-for-reply (or (:channel chat) (slack-channel-id)) (:thread chat))]
    (assoc instance :text r)))

(defn create-entity [instance]
  (let [[c n] (li/split-path (cn/instance-type instance))]
    (case n
      :Chat (create-chat
             "chat.postMessage"
             (if (:channel instance)
               instance
               (assoc instance :channel (slack-channel-id))))
      :Response (create-response instance)
      instance)))

(resolver
 :Slack.Core/Resolver
 {:with-methods {:create create-entity}
  :paths [:Slack.Core/Chat :Slack.Core/Response]})
