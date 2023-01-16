import {
    Context,
    APIGatewayProxyResult,
    APIGatewayProxyEvent
} from 'aws-lambda';
import {getEventBody, getPathParameter, getSub} from "../lib/utils";
import {Env} from "../lib/env";
import {ProfileService} from "../service/ProfileService";
import {ProfileCreateParams} from "../service/types";

const table = Env.get('PROFILE_TABLE')
const todoService = new ProfileService({
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
        const item = getEventBody(event) as ProfileCreateParams;
        const sub = getSub(event)
        item.userId = sub
        const profile = await todoService.create(item)
        result.body = JSON.stringify(profile)
    } catch (error) {
        result.statusCode = 500
        result.body = error.message
    }
    return result
}
