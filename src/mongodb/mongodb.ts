import mongoose, { Mongoose } from "mongoose";
import { Base, Initializable } from "../base";
import { Bot } from "../bot";
import { Logger } from "../logger";

export class MongoDB extends Base implements Initializable<string> {
    mongoose: Mongoose;

    constructor (bot: Bot) {
        super(bot);

        this.mongoose = undefined;
    }
    
    async initialize(uri: string) {
        this.mongoose = await mongoose.connect(uri).catch(r => {
            Logger.error(`Error connecting to database: ${r}`, "DATABASE");
            return undefined;
        });

        if (this.mongoose) Logger.log("Connected to the database properly", "DATABASE");

        return !!this.mongoose;
    }
}