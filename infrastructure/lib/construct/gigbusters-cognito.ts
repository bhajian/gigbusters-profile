import {Construct} from "constructs";
import {GenericCognito} from "../generic/GenericCognito";

import config from "../../config/config";
import {
    ProviderAttribute,
    UserPoolClientIdentityProvider,
    UserPoolIdentityProviderGoogle
} from "aws-cdk-lib/aws-cognito";

export interface ProfileCognitoProps {
    suffixId: string
}

export class GigbustersCognito extends GenericCognito {
    suffixId: string

    public constructor(scope: Construct, id: string, props: ProfileCognitoProps) {
        super(scope, id, props)
        this.suffixId = props.suffixId
        this.initializeCognito()
    }

    public initializeCognito(){
        this.createUserPool({
            id: 'GigbustersUserPoolId',
            userPoolName: `Gigbusters-UserPool-${config.envName}-${this.suffixId}`,
            selfSignUpEnabled: true,
            emailSignInAliases: true,
            userNameSignInAliases: true,
            phoneSignInAliases: false,
            certificateArn: config.authDomainCertificateArn,
            authSubdomain: config.authSubdomain,
            rootDomain: config.rootDomain,
            envName: config.envName
        })

        const provider = new UserPoolIdentityProviderGoogle(this, "MyUserPoolIdentityProviderGoogle", {
            userPool: this.userPool,
            clientId: config.googleClientId,
            clientSecret: config.googleClientSecret,
            scopes: ["email", "profile"],
            attributeMapping: {
                email: ProviderAttribute.GOOGLE_EMAIL,
            },
        })

        

        this.createUserPoolClient({
            id: 'GigbustersPoolClientId',
            userPoolClientName: 'GigbustersPoolClient',
            generateSecret: true,
            supportedIdentityProviders: [
                UserPoolClientIdentityProvider.GOOGLE,
                UserPoolClientIdentityProvider.COGNITO
            ],
            authFlow:{
                adminUserPassword: true,
                custom: true,
                userPassword: true,
                userSrp: true
            },
            oAuth: {
                callbackUrls: config.callbackUrls,
                logoutUrls: config.logoutUrls
            },
        })



        this.initializeIdentityPool({
            id: 'GigbustersIdentityPoolId',
            userPool: this.userPool,
            userPoolClient: this.userPoolClient,
            allowUnauthenticatedIdentities: false,
        })

        this.initializeRoles(this.identityPool)

        this.createAdminsGroup()

        this.attachRoles()
    }


}
