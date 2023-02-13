import axios from "axios";

interface TokenServiceProps{
    authEndpoint: string
    clientId: string
    grantType: string
    redirectUrl: string
}

interface GetTokenProps{
    code: string
}

export class TokenService {

    private serviceProps: TokenServiceProps

    public constructor(props: TokenServiceProps){
        this.serviceProps = props
    }

    async getToken(props: GetTokenProps): Promise<any> {
        try {
            const params = new URLSearchParams({ });
            params.append('client_id', this.serviceProps.clientId)
            params.append('code', props.code)
            params.append('grant_type', this.serviceProps.grantType)
            params.append('redirect_uri', this.serviceProps.redirectUrl)
            let res = await axios({
                url: this.serviceProps.authEndpoint,
                method: 'POST',
                timeout: 8000,
                data: params,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            })

            return res.data
        } catch (error) {
            throw error
        }
        return {}
    }

}
