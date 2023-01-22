import {
    Context,
    APIGatewayProxyResult,
    APIGatewayProxyEvent
} from 'aws-lambda';
import {getEventBody, getPathParameter, getSub} from "../lib/utils";
import {Env} from "../lib/env";
import {ProfileService} from "../service/profile-service";
import {ProfileCreateParams, SocialAccount} from "../service/types";

const table = Env.get('PROFILE_TABLE')
const profileService = new ProfileService({
    table: table
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
        const accountId = getPathParameter(event, 'accountId')
        const sub = getSub(event)
        const social: SocialAccount = getEventBody(event)

        const socialAccount = await profileService.addSocial({
            accountId: accountId,
            userId: sub,
        },social)
        result.body = JSON.stringify(socialAccount)
    } catch (error) {
        result.statusCode = 500
        result.body = error.message
    }
    return result
}
