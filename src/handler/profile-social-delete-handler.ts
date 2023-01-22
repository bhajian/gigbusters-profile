import {
    Context,
    APIGatewayProxyResult,
    APIGatewayProxyEvent
} from 'aws-lambda';
import {Env} from "../lib/env";
import {ProfileService} from "../service/profile-service";
import {getEventBody, getPathParameter, getSub} from "../lib/utils";
import {ProfileCreateParams, ProfileDeleteParams} from "../service/types";

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
        body: 'Hello From Todo Edit Api!'
    }
    try {
        const accountId = getPathParameter(event, 'accountId')
        const sub = getSub(event)
        const todo = await todoService.deleteProfile({
            accountId: accountId,
            userId: sub,
        })
        result.body = JSON.stringify(todo)
    } catch (error) {
        console.error(error.message)
        result.statusCode = 500
        result.body = error.message
    }
    return result
}
