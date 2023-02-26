import {
    Context,
    APIGatewayProxyResult,
    APIGatewayProxyEvent
} from 'aws-lambda';
import {Env} from "../lib/env";
import {getQueryString} from "../lib/utils";
import {TokenService} from "../service/token-service";

const authEndpoint = Env.get('AUTH_END_POINT')
const authClientId = Env.get('AUTH_CLIENT_ID')
const authGrantType = Env.get('AUTH_GRANT_TYPE')
const authRedirectUrl = Env.get('AUTH_REDIRECT_URL')

const service = new TokenService({
    authEndpoint: authEndpoint,
    clientId: authClientId,
    grantType: authGrantType,
    redirectUrl: authRedirectUrl
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
        const code = getQueryString(event, 'code')
        const token = await service.getToken({
            code: code
        })
        result.body = JSON.stringify(token)
        return result
    }
    catch (e) {
        result.statusCode = 500
        console.error(e)
        result.body = e.message
    }
    return result
}
