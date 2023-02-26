import {
    Context,
    APIGatewayProxyResult,
    APIGatewayProxyEvent
} from 'aws-lambda';
import {getEventBody, getPathParameter, getSub} from "../lib/utils";
import {Env} from "../lib/env";
import {ProfileService} from "../service/profile-service";
import {ProfileEntity} from "../service/types";

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
        const item = getEventBody(event) as ProfileEntity;
        const sub = getSub(event)
        const accountId = getPathParameter(event, 'accountId')
        item.userId = sub
        item.accountId = accountId
        const profile = await profileService.validate(item)
        result.body = JSON.stringify(profile)
    } catch (error) {
        result.statusCode = 500
        result.body = error.message
    }
    return result
}
