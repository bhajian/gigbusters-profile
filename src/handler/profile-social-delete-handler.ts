import {
    Context,
    APIGatewayProxyResult,
    APIGatewayProxyEvent
} from 'aws-lambda';
import {Env} from "../lib/env";
import {ProfileService} from "../service/profile-service";
import {getEventBody, getPathParameter, getSub} from "../lib/utils";

const table = Env.get('PROFILE_TABLE')
const service = new ProfileService({
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
        body: 'Hello From Todo Edit Api!'
    }
    try {
        const accountId = getPathParameter(event, 'accountId')
        const socialUserId = getPathParameter(event, 'socialUserId')
        const snName = getPathParameter(event, 'snName')
        const sub = getSub(event)
        await service.deleteSocial({
            accountId: accountId,
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
