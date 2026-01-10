import { Schema } from "mongoose";


const meetingSchema = new Schema(
    {
        userId : {type: String},
        meetingId: {type: String, required: true, unique: true},
        createdAt: {type: Date, default: Date.now,required: true}
    }
)
const Meeting = mongoose.model("Meeting", meetingSchema);
export {Meeting};// we use this type of export when we have multiple exports in a single file and we want to import only few of them in another file we use export default when we have single export in a file and we want to import that in another file