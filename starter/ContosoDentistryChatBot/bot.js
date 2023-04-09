// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory } = require('botbuilder');

const { QnAMaker } = require('botbuilder-ai');
const DentistScheduler = require('./dentistscheduler');
const IntentRecognizer = require('./intentrecognizer');

class DentaBot extends ActivityHandler {
    constructor(configuration, qnaOptions) {
        // call the parent constructor
        super();
        if (!configuration) throw new Error('[QnaMakerBot]: Missing parameter. configuration is required');

        // create a QnAMaker connector
        this.QnAMaker = new QnAMaker();

        // create a DentistScheduler connector
        this.dentistscheduler = new DentistScheduler(configuration.SchedulerConfiguration);

        // create a LUIS connector
        this.intentRecognizer = new IntentRecognizer(configuration.LuisConfiguration);

        this.onMessage(async (context, next) => {
            // send user input to QnA Maker and collect the response in a variable
            // don't forget to use the 'await' keyword
            const qnaResults = await this.qnaMaker.getAnswers(context);

            // send user input to IntentRecognizer and collect the response in a variable
            // don't forget 'await'
            const LuisResult = await this.intentRecognizer.executeLuisQuery(context);
            // determine which service to respond with based on the results from LUIS //
            // if(top intent is intentA and confidence greater than 50){
            //  doSomething();
            //  await context.sendActivity();
            //  await next();
            //  return;
            // }
            // else {...}
            if (LuisResult.luisResult.prediction.topIntent === 'getAvailability' &&
                LuisResult.intents.getAvailability.score > 0.6 &&
                LuisResult.entities.$instance &&
                LuisResult.entities.$instance.timeday &&
                LuisResult.entities.$instance.timeday[0]
            ) {
                const timeday = LuisResult.entities.$instance.timeday[0].text;

                const getAvailableTime = 'I have a few spots for ' + timeday;
                console.log(getAvailableTime);

                await context.sendActivity(getAvailableTime);
                await next();
                return;
            }

            // If an answer was received from QnA Maker, send the answer back to the user.
            if (qnaResults[0]) {
                console.log(qnaResults[0]);
                await context.sendActivity(`${ qnaResults[0].answer }`);
            } else {
                await context.sendActivity('I\'m not sure' +
                     'I found an answer to your question' +
                     'You can ask me questions about our dental services like "Do you treat children?\' or tell me what time you want an appointment like "today"');
            }

            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            // write a custom greeting
            const welcomeText = 'Hello and welcome to Dental Office Assistant!';
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
                }
            }
            // by calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }
}

module.exports.DentaBot = DentaBot;
