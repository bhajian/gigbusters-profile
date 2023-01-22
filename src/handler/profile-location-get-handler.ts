import {
    Context,
    APIGatewayProxyResult,
    APIGatewayProxyEvent
} from 'aws-lambda';
import {Env} from "../lib/env";
import {ProfileService} from "../service/profile-service";
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
    try{
        const userId = getSub(event)
        const accountId = getPathParameter(event, 'accountId')
        const item = await profileService.getLocation({
            accountId: accountId,
            userId: userId
        })
        result.body = JSON.stringify(item)
        return result
    }
    catch (e) {
        result.statusCode = 500
        result.body = e.message
    }
    return result
}
