const {LuisRecognizer} = require('botbuilder-ai')
const  { ConversationAnalysisClient,ConversationalTask } =require("@azure/ai-language-conversations");
const { AzureKeyCredential } =require("@azure/core-auth") ;




class IntentRecognizer {
    constructor(config) {
        const luisIsConfigured = config  && config.CluSubscriptionKey && config.CluEndpoint;
        if (luisIsConfigured) {
            // Set the recognizer options depending on which endpoint version you want to use e.g v2 or v3.
            // More details can be found in https://docs.microsoft.com/en-gb/azure/cognitive-services/luis/luis-migration-api-v3
            const recognizerOptions = {
                apiVersion: 'v3'
            };
            this.recognizer = new ConversationAnalysisClient(
                config.CluEndpoint, new AzureKeyCredential(config.CluSubscriptionKey));

            this.body = {
                    kind: "Conversation",
                    analysisInput: {
                      conversationItem: {
                        id: "id__7863",
                        participantId: "id__7863",
                        text: "hi",
                      },
                    },
                    parameters: {
                      projectName: config.CluProjectName,
                      deploymentName: config.CluDeploymentName
                    },
            };
        
        }
    }

    get isConfigured() {

        return (this.recognizer !== undefined);
    }

    /**
     * Returns an object with preformatted LUIS results fcor the bot's dialogs to consume.
     * @param {TurnContext} context
     */
    async executeLuisQuery(context) {
    // replace with incoming context
    this.body.analysisInput.conversationItem.text=context.activity.text

    const {result} = await this.recognizer.analyzeConversation(this.body);

    console.log(result.prediction)

    return  result;
    }

    getTimeEntity(result) {
        const datetimeEntity = result.prediction.entities;
        if (!datetimeEntity || !datetimeEntity[0]) return undefined;

        const timex = datetimeEntity[0].text;
        if (!timex || !timex[0]) return undefined;

        const datetime = timex
        return datetime;
    }
}

module.exports = IntentRecognizer
