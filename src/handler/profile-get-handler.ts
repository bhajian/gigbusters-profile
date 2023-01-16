import {
    Context,
    APIGatewayProxyResult,
    APIGatewayProxyEvent
} from 'aws-lambda';
import {Env} from "../lib/env";
import {ProfileService} from "../service/ProfileService";
import {getPathParameter, getQueryString, getSub} from "../lib/utils";

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
        body: ''
    }
    try {
        const accountId = getPathParameter(event, 'accountId')
        const sub = getSub(event)
            const profile = await profileService.get({
                accountId: accountId,
                userId: sub
            })
            result.body = JSON.stringify(profile)
            return result
        }

    catch (e) {
        result.statusCode = 500
        result.body = e.message
    }
    return result
}
