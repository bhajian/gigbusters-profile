import {Construct} from "constructs";
import {GenericDynamoTable} from "../generic/GenericDynamoTable";
import {GenericApi} from "../generic/GenericApi";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import {createProfileSchema, editProfileSchema} from "./profile-schema";
import {GenericCognito} from "../generic/GenericCognito";
import {UserPool} from "aws-cdk-lib/aws-cognito";
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
            userPoolName: 'FameorbitUserPool-' + this.suffixId,
            selfSignUpEnabled: true,
            emailSignInAliases: true,
            userNameSignInAliases: true,
            phoneSignInAliases: false,
            certificateArn: config.authDomainCertificateArn,
            authSubdomain: config.authSubdomain,
            rootDomain: config.rootDomain
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
