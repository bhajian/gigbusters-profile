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
    todoTable: GenericDynamoTable
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
            id: 'todoUserAuthorizerId',
            authorizerName: 'todoUserAuthorizer',
            identitySource: 'method.request.header.Authorization',
            cognitoUserPools: [props.cognito.userPool]
        })

        const todosApiResource = this.api.root.addResource('todos')
        const todoIdResource = todosApiResource.addResource('{id}')

        this.listApi = this.addMethod({
            functionName: 'todo-list',
            handlerName: 'todo-list-handler.ts',
            verb: 'GET',
            resource: todosApiResource,
            environment: {
                TODO_TABLE: props.todoTable.table.tableName
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: authorizer
        })

        this.getApi = this.addMethod({
            functionName: 'todo-get',
            handlerName: 'todo-get-handler.ts',
            verb: 'GET',
            resource: todoIdResource,
            environment: {
                TODO_TABLE: props.todoTable.table.tableName
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: authorizer
        })

        this.createApi = this.addMethod({
            functionName: 'todo-post',
            handlerName: 'todo-create-handler.ts',
            verb: 'POST',
            resource: todosApiResource,
            environment: {
                TODO_TABLE: props.todoTable.table.tableName
            },
            validateRequestBody: true,
            bodySchema: createProfileSchema,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: authorizer
        })

        this.editApi = this.addMethod({
            functionName: 'todo-put',
            handlerName: 'todo-edit-handler.ts',
            verb: 'PUT',
            resource: todosApiResource,
            environment: {
                TODO_TABLE: props.todoTable.table.tableName
            },
            validateRequestBody: true,
            bodySchema: editProfileSchema,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: authorizer
        })

        this.deleteApi = this.addMethod({
            functionName: 'todo-delete',
            handlerName: 'todo-delete-handler.ts',
            verb: 'DELETE',
            resource: todoIdResource,
            environment: {
                TODO_TABLE: props.todoTable.table.tableName
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: authorizer
        })

        props.todoTable.table.grantFullAccess(this.listApi.grantPrincipal)
        props.todoTable.table.grantFullAccess(this.getApi.grantPrincipal)
        props.todoTable.table.grantFullAccess(this.createApi.grantPrincipal)
        props.todoTable.table.grantFullAccess(this.editApi.grantPrincipal)
        props.todoTable.table.grantFullAccess(this.deleteApi.grantPrincipal)
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
