import {
    Context,
    APIGatewayProxyResult,
    APIGatewayProxyEvent
} from 'aws-lambda';
import {Env} from "../lib/env";
import {ProfileService} from "../service/profile-service";
import {getQueryString, getSub} from "../lib/utils";

const table = Env.get('PROFILE_TABLE')
const bucket = Env.get('PROFILE_BUCKET')
const profileService = new ProfileService({
    table: table,
    bucket: bucket
})

export async function handler(event: APIGatewayProxyEvent, context: Context):
    Promise<APIGatewayProxyResult> {

    const result: APIGatewayProxyResult = {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Methods': '*'
        },
        body: ''
    }
    try{
        const userId = getSub(event)
        const limit = getQueryString(event, 'limit')
        const lastEvaluatedKey = getQueryString(event, 'lastEvaluatedKey')
        const profiles = await profileService.listProfile({
            userId: userId,
            limit: (limit? limit : 100),
            lastEvaluatedKey: lastEvaluatedKey
        })
        result.body = JSON.stringify(profiles)
        return result
    }
    catch (e) {
        result.statusCode = 500
        result.body = e.message
    }
    return result
}
