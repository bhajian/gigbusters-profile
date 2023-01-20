import {Construct} from "constructs";
import {GenericDynamoTable} from "../generic/GenericDynamoTable";
import {AuthorizerProps, GenericApi} from "../generic/GenericApi";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import {createProfileSchema, editProfileSchema} from "./profile-schema";
import {FameorbitCognito} from "./fameorbit-cognito";
import {CognitoUserPoolsAuthorizer, IResource} from "aws-cdk-lib/aws-apigateway";
import {AuthorizationType} from "@aws-cdk/aws-apigateway";
import config from "../../config/config";
import {Table} from "aws-cdk-lib/aws-dynamodb";

export interface ProfileApiProps {
    profileTable: GenericDynamoTable
    cognito: FameorbitCognito
}

export interface ApiProps {
    table: Table
    authorizer: CognitoUserPoolsAuthorizer
    rootResource: IResource
    idResource: IResource
}

export class ProfileApis extends GenericApi {
    private listApi: NodejsFunction
    private getApi: NodejsFunction
    private createApi: NodejsFunction
    private editApi: NodejsFunction
    private deleteApi: NodejsFunction

    private addPhotoApi: NodejsFunction
    private deletePhotoApi: NodejsFunction
    private listPhotosApi: NodejsFunction
    private setMainPhotoApi: NodejsFunction

    private setLocationApi: NodejsFunction
    private getLocationApi: NodejsFunction

    private setSettingApi: NodejsFunction
    private getSettingApi: NodejsFunction

    private addSocialApi: NodejsFunction
    private deleteSocialApi: NodejsFunction
    private listSocialApi: NodejsFunction

    private addCategoryApi: NodejsFunction
    private deleteCategoryApi: NodejsFunction
    private listCategoryApi: NodejsFunction

    private validateApi: NodejsFunction
    private requestValidationApi: NodejsFunction

    public constructor(scope: Construct, id: string, props: ProfileApiProps) {
        super(scope, id)
        this.initializeApis(props);
        this.initializeDomainName({
            certificateArn: config.apiDomainCertificateArn,
            apiSubdomain: config.apiSubdomain,
            domainNameId: 'domainNameId',
            rootDomain: config.rootDomain,
            ARecordId: 'ARecordId',
            basePath: config.basePath,
            envName: config.envName
        })
    }

    private initializeApis(props: ProfileApiProps){
        const authorizer = this.createAuthorizer({
            id: 'profileUserAuthorizerId',
            authorizerName: 'profileUserAuthorizer',
            identitySource: 'method.request.header.Authorization',
            cognitoUserPools: [props.cognito.userPool]
        })

        const profileAccountIdResource = this.api.root.addResource('{accountId}')
        this.initializeProfileMainApis({
            authorizer: authorizer,
            idResource: profileAccountIdResource,
            rootResource: this.api.root,
            table: props.profileTable.table
        })
        this.initializeProfilePhotoApis({
            authorizer: authorizer,
            idResource: profileAccountIdResource,
            rootResource: this.api.root,
            table: props.profileTable.table
        })
        this.initializeLocationApis({
            authorizer: authorizer,
            idResource: profileAccountIdResource,
            rootResource: this.api.root,
            table: props.profileTable.table
        })
        this.initializeSettingsApis({
            authorizer: authorizer,
            idResource: profileAccountIdResource,
            rootResource: this.api.root,
            table: props.profileTable.table
        })
        this.initializeProfileCategoryApis({
            authorizer: authorizer,
            idResource: profileAccountIdResource,
            rootResource: this.api.root,
            table: props.profileTable.table
        })
        this.initializeSocialAccountsApis({
            authorizer: authorizer,
            idResource: profileAccountIdResource,
            rootResource: this.api.root,
            table: props.profileTable.table
        })
        this.initializeValidateApis({
            authorizer: authorizer,
            idResource: profileAccountIdResource,
            rootResource: this.api.root,
            table: props.profileTable.table
        })
    }

    private initializeProfileMainApis(props: ApiProps){
        this.listApi = this.addMethod({
            functionName: 'profile-list',
            handlerName: 'profile-list-handler.ts',
            verb: 'GET',
            resource: props.rootResource,
            environment: {
                PROFILE_TABLE: props.table.tableName
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })

        this.getApi = this.addMethod({
            functionName: 'profile-get',
            handlerName: 'profile-get-handler.ts',
            verb: 'GET',
            resource: props.idResource,
            environment: {
                PROFILE_TABLE: props.table.tableName
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })

        this.createApi = this.addMethod({
            functionName: 'profile-post',
            handlerName: 'profile-create-handler.ts',
            verb: 'POST',
            resource: props.rootResource,
            environment: {
                PROFILE_TABLE: props.table.tableName
            },
            validateRequestBody: true,
            bodySchema: createProfileSchema,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })

        this.editApi = this.addMethod({
            functionName: 'profile-put',
            handlerName: 'profile-edit-handler.ts',
            verb: 'PUT',
            resource: props.rootResource,
            environment: {
                PROFILE_TABLE: props.table.tableName
            },
            validateRequestBody: true,
            bodySchema: editProfileSchema,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })

        this.deleteApi = this.addMethod({
            functionName: 'profile-delete',
            handlerName: 'profile-delete-handler.ts',
            verb: 'DELETE',
            resource: props.idResource,
            environment: {
                PROFILE_TABLE: props.table.tableName
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })

        props.table.grantFullAccess(this.listApi.grantPrincipal)
        props.table.grantFullAccess(this.getApi.grantPrincipal)
        props.table.grantFullAccess(this.createApi.grantPrincipal)
        props.table.grantFullAccess(this.editApi.grantPrincipal)
        props.table.grantFullAccess(this.deleteApi.grantPrincipal)
    }

    private initializeProfilePhotoApis(props: ApiProps){
        const photoResource = props.idResource.addResource('photo')
        const photoIdResource = photoResource.addResource('{photoId}')

        this.listPhotosApi = this.addMethod({
            functionName: 'profile-photo-list',
            handlerName: 'profile-photo-list-handler.ts',
            verb: 'GET',
            resource: photoResource,
            environment: {
                PROFILE_TABLE: props.table.tableName
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })

        this.addPhotoApi = this.addMethod({
            functionName: 'profile-photo-add',
            handlerName: 'profile-photo-add-handler.ts',
            verb: 'POST',
            resource: photoResource,
            environment: {
                PROFILE_TABLE: props.table.tableName
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })

        this.deletePhotoApi = this.addMethod({
            functionName: 'profile-photo-delete',
            handlerName: 'profile-photo-delete-handler.ts',
            verb: 'DELETE',
            resource: photoIdResource,
            environment: {
                PROFILE_TABLE: props.table.tableName
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })

        this.setMainPhotoApi = this.addMethod({
            functionName: 'profile-photo-setmain',
            handlerName: 'profile-photo-setmain-handler.ts',
            verb: 'PUT',
            resource: photoIdResource,
            environment: {
                PROFILE_TABLE: props.table.tableName
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })

        props.table.grantFullAccess(this.setMainPhotoApi.grantPrincipal)
        props.table.grantFullAccess(this.addPhotoApi.grantPrincipal)
        props.table.grantFullAccess(this.deletePhotoApi.grantPrincipal)
        props.table.grantFullAccess(this.listPhotosApi.grantPrincipal)
    }

    private initializeLocationApis(props: ApiProps){
        const locationResource = props.idResource.addResource('location')

        this.setLocationApi = this.addMethod({
            functionName: 'profile-location-set',
            handlerName: 'profile-location-set-handler.ts',
            verb: 'PUT',
            resource: locationResource,
            environment: {
                PROFILE_TABLE: props.table.tableName
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })

        this.getLocationApi = this.addMethod({
            functionName: 'profile-location-get',
            handlerName: 'profile-location-get-handler.ts',
            verb: 'GET',
            resource: locationResource,
            environment: {
                PROFILE_TABLE: props.table.tableName
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })

        props.table.grantFullAccess(this.setLocationApi.grantPrincipal)
        props.table.grantFullAccess(this.getLocationApi.grantPrincipal)
    }

    private initializeSettingsApis(props: ApiProps){
        const settingsResource = props.idResource.addResource('setting')

        this.setSettingApi = this.addMethod({
            functionName: 'profile-setting-set',
            handlerName: 'profile-setting-set-handler.ts',
            verb: 'PUT',
            resource: settingsResource,
            environment: {
                PROFILE_TABLE: props.table.tableName
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })

        this.getSettingApi = this.addMethod({
            functionName: 'profile-setting-get',
            handlerName: 'profile-setting-get-handler.ts',
            verb: 'GET',
            resource: settingsResource,
            environment: {
                PROFILE_TABLE: props.table.tableName
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })

        props.table.grantFullAccess(this.setSettingApi.grantPrincipal)
        props.table.grantFullAccess(this.getSettingApi.grantPrincipal)
    }

    private initializeProfileCategoryApis(props: ApiProps){
        const categoryResource = props.idResource.addResource('category')
        const categoryIdResource = categoryResource.addResource('{categoryId}')

        this.listCategoryApi = this.addMethod({
            functionName: 'profile-category-list',
            handlerName: 'profile-category-list-handler.ts',
            verb: 'GET',
            resource: categoryResource,
            environment: {
                PROFILE_TABLE: props.table.tableName
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })

        this.addCategoryApi = this.addMethod({
            functionName: 'profile-category-add',
            handlerName: 'profile-category-add-handler.ts',
            verb: 'POST',
            resource: categoryResource,
            environment: {
                PROFILE_TABLE: props.table.tableName
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })

        this.deleteCategoryApi = this.addMethod({
            functionName: 'profile-category-delete',
            handlerName: 'profile-category-delete-handler.ts',
            verb: 'DELETE',
            resource: categoryIdResource,
            environment: {
                PROFILE_TABLE: props.table.tableName
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })

        props.table.grantFullAccess(this.listCategoryApi.grantPrincipal)
        props.table.grantFullAccess(this.addCategoryApi.grantPrincipal)
        props.table.grantFullAccess(this.deleteCategoryApi.grantPrincipal)
    }

    private initializeSocialAccountsApis(props: ApiProps){
        const socialResource = props.idResource.addResource('social')
        const socialIdResource = socialResource.addResource('{socialId}')

        this.listSocialApi = this.addMethod({
            functionName: 'profile-social-list',
            handlerName: 'profile-social-list-handler.ts',
            verb: 'GET',
            resource: socialResource,
            environment: {
                PROFILE_TABLE: props.table.tableName
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })

        this.addSocialApi = this.addMethod({
            functionName: 'profile-social-add',
            handlerName: 'profile-social-add-handler.ts',
            verb: 'POST',
            resource: socialResource,
            environment: {
                PROFILE_TABLE: props.table.tableName
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })

        this.deleteSocialApi = this.addMethod({
            functionName: 'profile-social-delete',
            handlerName: 'profile-social-delete-handler.ts',
            verb: 'DELETE',
            resource: socialIdResource,
            environment: {
                PROFILE_TABLE: props.table.tableName
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })

        props.table.grantFullAccess(this.listSocialApi.grantPrincipal)
        props.table.grantFullAccess(this.addSocialApi.grantPrincipal)
        props.table.grantFullAccess(this.deleteSocialApi.grantPrincipal)
    }

    private initializeValidateApis(props: ApiProps){
        const validateResource = props.idResource.addResource('validate')
        const requestValidationResource = props.idResource.addResource('requestValidation')

        this.validateApi = this.addMethod({
            functionName: 'profile-validate',
            handlerName: 'profile-validate-handler.ts',
            verb: 'POST',
            resource: validateResource,
            environment: {
                PROFILE_TABLE: props.table.tableName
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })
        this.requestValidationApi = this.addMethod({
            functionName: 'profile-request-validation',
            handlerName: 'profile-request-validation-handler.ts',
            verb: 'POST',
            resource: requestValidationResource,
            environment: {
                PROFILE_TABLE: props.table.tableName
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })
        props.table.grantFullAccess(this.validateApi.grantPrincipal)
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
