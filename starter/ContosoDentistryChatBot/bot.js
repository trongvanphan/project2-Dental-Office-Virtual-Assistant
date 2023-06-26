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
        this.QnAMaker = new QnAMaker(configuration.QnAConfiguration, qnaOptions);
        // create a DentistScheduler connector
        this.DentistScheduler = new DentistScheduler(configuration.SchedulerConfiguration);
      
        // create a IntentRecognizer connector
        this.IntentRecognizer = new IntentRecognizer(configuration.CLUConfiguration);

        this.onMessage(async (context, next) => {
            // send user input to QnA Maker and collect the response in a variable
            // don't forget to use the 'await' keyword
            const qnaResults = await this.QnAMaker.getAnswers(context);

            // send user input to IntentRecognizer and collect the response in a variable
            // don't forget 'await'
            const LuisResult = await this.IntentRecognizer.executeLuisQuery(context);
                     
            // determine which service to respond with based on the results from LUIS //
            
            // if(top intent is intentA and confidence greater than 50){
            if (LuisResult.prediction.topIntent === "GetAvailability" && 
            LuisResult.prediction.intents[0].confidence>0.5 && LuisResult.prediction.entities[0]){

                const  available_slots = await this.DentistScheduler.getAvailability();

                await context.sendActivity(available_slots);
                await next();
                return;
            }
            if (LuisResult.prediction.topIntent === "ScheduleAppointment" && 
            LuisResult.prediction.intents[0].confidence>0.5 && LuisResult.prediction.entities[0]){

                const time = this.IntentRecognizer.getTimeEntity(LuisResult)

                const schedule_time = await this.DentistScheduler.scheduleAppointment(time);
            
                await context.sendActivity(MessageFactory.text(schedule_time,schedule_time));
                await next();
                return;
            }

            if (qnaResults[0]) {
                await context.sendActivity(`${qnaResults[0].answer}`);
            }
            else {
                // If no answers were returned from QnA Maker, reply with help.
                await context.sendActivity(`I'm not sure I can answer your question`
                    + 'I can schedule appointments for you based  our available slots'
                    + `Or you can ask me questions about our services`);
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
