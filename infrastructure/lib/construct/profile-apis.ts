import {Construct} from "constructs";
import {GenericDynamoTable} from "../generic/GenericDynamoTable";
import {AuthorizerProps, GenericApi} from "../generic/GenericApi";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import {createProfileSchema, editProfileSchema} from "./profile-schema";
import {FameorbitCognito} from "./fameorbit-cognito";
import {CognitoUserPoolsAuthorizer} from "aws-cdk-lib/aws-apigateway";
import {AuthorizationType} from "@aws-cdk/aws-apigateway";
import config from "../../config/config";

export interface ProfileApiProps {
    profileTable: GenericDynamoTable
    cognito: FameorbitCognito
}

export class ProfileApis extends GenericApi {
    private listApi: NodejsFunction
    private getApi: NodejsFunction
    private createApi: NodejsFunction
    private editApi: NodejsFunction
    private deleteApi: NodejsFunction

    public constructor(scope: Construct, id: string, props: ProfileApiProps) {
        super(scope, id)
        this.initializeApis(props);
        this.initializeDomainName({
            certificateArn: config.apiDomainCertificateArn,
            subdomain: config.apiSubdomain,
            domainNameId: 'domainNameId',
            rootDomain: config.rootDomain,
            ARecordId: 'ARecordId',
            basePath: config.basePath,
        })
    }

    private initializeApis(props: ProfileApiProps){
        const authorizer = this.createAuthorizer({
            id: 'profileUserAuthorizerId',
            authorizerName: 'profileUserAuthorizer',
            identitySource: 'method.request.header.Authorization',
            cognitoUserPools: [props.cognito.userPool]
        })

        const profilesApiResource = this.api.root.addResource('profiles')
        const profileAccountIdResource = profilesApiResource.addResource('{accountId}')

        this.listApi = this.addMethod({
            functionName: 'profile-list',
            handlerName: 'profile-list-handler.ts',
            verb: 'GET',
            resource: profilesApiResource,
            environment: {
                PROFILE_TABLE: props.profileTable.table.tableName
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: authorizer
        })

        this.getApi = this.addMethod({
            functionName: 'profile-get',
            handlerName: 'profile-get-handler.ts',
            verb: 'GET',
            resource: profileAccountIdResource,
            environment: {
                PROFILE_TABLE: props.profileTable.table.tableName
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: authorizer
        })

        this.createApi = this.addMethod({
            functionName: 'profile-post',
            handlerName: 'profile-create-handler.ts',
            verb: 'POST',
            resource: profilesApiResource,
            environment: {
                PROFILE_TABLE: props.profileTable.table.tableName
            },
            validateRequestBody: true,
            bodySchema: createProfileSchema,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: authorizer
        })

        this.editApi = this.addMethod({
            functionName: 'profile-put',
            handlerName: 'profile-edit-handler.ts',
            verb: 'PUT',
            resource: profilesApiResource,
            environment: {
                PROFILE_TABLE: props.profileTable.table.tableName
            },
            validateRequestBody: true,
            bodySchema: editProfileSchema,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: authorizer
        })

        this.deleteApi = this.addMethod({
            functionName: 'profile-delete',
            handlerName: 'profile-delete-handler.ts',
            verb: 'DELETE',
            resource: profileAccountIdResource,
            environment: {
                PROFILE_TABLE: props.profileTable.table.tableName
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: authorizer
        })

        props.profileTable.table.grantFullAccess(this.listApi.grantPrincipal)
        props.profileTable.table.grantFullAccess(this.getApi.grantPrincipal)
        props.profileTable.table.grantFullAccess(this.createApi.grantPrincipal)
        props.profileTable.table.grantFullAccess(this.editApi.grantPrincipal)
        props.profileTable.table.grantFullAccess(this.deleteApi.grantPrincipal)
    }

    protected createAuthorizer(props: AuthorizerProps): CognitoUserPoolsAuthorizer{
        const authorizer = new CognitoUserPoolsAuthorizer(
            this,
            props.id,
            {
                cognitoUserPools: props.cognitoUserPools,
                authorizerName: props.authorizerName,
                identitySource: props.identitySource
            });
        authorizer._attachToApi(this.api)
        return authorizer
    }

}
