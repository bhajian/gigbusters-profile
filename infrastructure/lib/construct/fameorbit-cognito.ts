import {Construct} from "constructs";
import {GenericCognito} from "../generic/GenericCognito";

import config from "../../config/config";

export interface ProfileCognitoProps {
    suffixId: string
}

export class FameorbitCognito extends GenericCognito {
    suffixId: string

    public constructor(scope: Construct, id: string, props: ProfileCognitoProps) {
        super(scope, id, props)
        this.suffixId = props.suffixId
        this.initializeCognito()
    }

    public initializeCognito(){
        this.createUserPool({
            id: 'FameorbitUserPoolId',
            userPoolName: `Fameorbit-UserPool-${config.envName}-${this.suffixId}`,
            selfSignUpEnabled: true,
            emailSignInAliases: true,
            userNameSignInAliases: true,
            phoneSignInAliases: false,
            certificateArn: config.authDomainCertificateArn,
            authSubdomain: config.authSubdomain,
            rootDomain: config.rootDomain,
            envName: config.envName
        })

        this.createUserPoolClient({
            id: 'FameorbitPoolClientId',
            userPoolClientName: 'FameorbitPoolClient',
            generateSecret: false,
            authFlow:{
                adminUserPassword: true,
                custom: true,
                userPassword: true,
                userSrp: true
            }
        })

        this.initializeIdentityPool({
            id: 'FameorbitIdentityPoolId',
            userPool: this.userPool,
            userPoolClient: this.userPoolClient,
            allowUnauthenticatedIdentities: false,
        })

        this.initializeRoles(this.identityPool)

        this.createAdminsGroup()

        this.attachRoles()
    }


}
