import {
    Context,
    APIGatewayProxyResult,
    APIGatewayProxyEvent
} from 'aws-lambda';
import {Env} from "../lib/env";
import {TodoService} from "../service/TodoService";
import {getPathParameter, getQueryString, getSub} from "../lib/utils";

const table = Env.get('TODO_TABLE')
const todoService = new TodoService({
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
    const userId = getSub(event)
    const todo = await todoService.list(userId)

    result.body = JSON.stringify(todo)
    return result
}
