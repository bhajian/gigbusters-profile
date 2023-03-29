import {DynamoDB} from "aws-sdk";
import {Env} from "../lib/env";
import {ProfileService} from "../service/profile-service";
const table = Env.get('PROFILE_TABLE')
const bucket = Env.get('PROFILE_BUCKET')
const reviewApiUrl = Env.get('REVIEW_API_URL')
const profileService = new ProfileService({
    table: table,
    bucket: bucket,
    reviewApiUrl: reviewApiUrl
})

export async function handler(event: any) {
    for(let i = 0 ; i < event.Records.length; i++){
        const record = event.Records[i]
        if(record.eventName === 'INSERT'){
            const unmarshalledProfile = DynamoDB.Converter.unmarshall(record.dynamodb.NewImage)
            await profileService.createReviewable(unmarshalledProfile)
        }
    }
}
