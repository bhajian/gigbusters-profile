import {
    Context,
    APIGatewayProxyResult,
    APIGatewayProxyEvent
} from 'aws-lambda';
import {getEventBody, getPathParameter, getSub} from "../lib/utils";
import {Env} from "../lib/env";
import {ProfileService} from "../service/profile-service";
import {SocialEntry} from "../service/types";

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
        body: 'Empty!'
    }
    try {
        const sub = getSub(event)
        const social: SocialEntry = getEventBody(event)

        const socialAccount = await profileService.addSocial({
            userId: sub,
        },social)
        result.body = JSON.stringify(socialAccount)
    } catch (error) {
        result.statusCode = 500
        result.body = error.message
    }
    return result
}
