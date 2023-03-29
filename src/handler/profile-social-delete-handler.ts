import {
    Context,
    APIGatewayProxyResult,
    APIGatewayProxyEvent
} from 'aws-lambda';
import {Env} from "../lib/env";
import {ProfileService} from "../service/profile-service";
import {getEventBody, getPathParameter, getSub} from "../lib/utils";

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
        body: 'Hello From Todo Edit Api!'
    }
    try {
        const socialUserId = getPathParameter(event, 'socialUserId')
        const snName = getPathParameter(event, 'snName')
        const sub = getSub(event)
        await profileService.deleteSocial({
            userId: sub,
            snName: snName,
            socialUserId: socialUserId
        })
        result.body = JSON.stringify({success: true})
    } catch (error) {
        console.error(error.message)
        result.statusCode = 500
        result.body = error.message
    }
    return result
}
