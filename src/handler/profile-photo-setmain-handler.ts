import {
    Context,
    APIGatewayProxyResult,
    APIGatewayProxyEvent
} from 'aws-lambda';
import {getEventBody, getSub} from "../lib/utils";
import {Env} from "../lib/env";
import {ProfileService} from "../service/profile-service";
import {ProfileEntity} from "../service/types";

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
        const item = getEventBody(event) as ProfileEntity;
        const sub = getSub(event)
        item.userId = sub
        const profile = await todoService.editProfile(item)
        result.body = JSON.stringify(profile)
    } catch (error) {
        result.statusCode = 500
        result.body = error.message
    }
    return result
}
