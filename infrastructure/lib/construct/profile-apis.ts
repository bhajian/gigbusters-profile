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
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import {Bucket} from "aws-cdk-lib/aws-s3";

const AUTH_API_PROTOCOL: string = 'https://'
const OAUTH_TOKEN_API_PATH: string = '/oauth2/token'
export interface ProfileApiProps {
    profileTable: GenericDynamoTable
    cognito: FameorbitCognito
    profilePhotoBucket: Bucket
}

export interface ApiProps {
    table: Table
    profilePhotoBucket: Bucket
    authorizer: CognitoUserPoolsAuthorizer
    rootResource: IResource
    idResource: IResource
    authEndpoint?: string
}

export class ProfileApis extends GenericApi {
    private tokenApi: NodejsFunction

    private listApi: NodejsFunction
    private getApi: NodejsFunction
    private createApi: NodejsFunction
    private editApi: NodejsFunction
    private deleteApi: NodejsFunction

    private changeMainPhotoApi: NodejsFunction
    private addPhotoApi: NodejsFunction
    private deletePhotoApi: NodejsFunction
    private listPhotosApi: NodejsFunction
    private getPhotosApi: NodejsFunction

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
        this.initializeApis(props)
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
        const authDomain = [
            config.authSubdomain,
            config.envName,
            config.rootDomain
        ].join('.')
        const authEndpoint = AUTH_API_PROTOCOL+authDomain+OAUTH_TOKEN_API_PATH

        this.initializeTokenApis({
            authorizer: authorizer,
            idResource: profileAccountIdResource,
            rootResource: this.api.root,
            table: props.profileTable.table,
            profilePhotoBucket: props.profilePhotoBucket,
            authEndpoint: authEndpoint
        })
        this.initializeProfileMainApis({
            authorizer: authorizer,
            idResource: profileAccountIdResource,
            rootResource: this.api.root,
            table: props.profileTable.table,
            profilePhotoBucket: props.profilePhotoBucket,
        })
        this.initializeProfilePhotoApis({
            authorizer: authorizer,
            idResource: profileAccountIdResource,
            rootResource: this.api.root,
            table: props.profileTable.table,
            profilePhotoBucket: props.profilePhotoBucket,
        })
        this.initializeLocationApis({
            authorizer: authorizer,
            idResource: profileAccountIdResource,
            rootResource: this.api.root,
            table: props.profileTable.table,
            profilePhotoBucket: props.profilePhotoBucket,
        })
        this.initializeSettingsApis({
            authorizer: authorizer,
            idResource: profileAccountIdResource,
            rootResource: this.api.root,
            table: props.profileTable.table,
            profilePhotoBucket: props.profilePhotoBucket,
        })
        this.initializeProfileCategoryApis({
            authorizer: authorizer,
            idResource: profileAccountIdResource,
            rootResource: this.api.root,
            table: props.profileTable.table,
            profilePhotoBucket: props.profilePhotoBucket,
        })
        this.initializeSocialAccountsApis({
            authorizer: authorizer,
            idResource: profileAccountIdResource,
            rootResource: this.api.root,
            table: props.profileTable.table,
            profilePhotoBucket: props.profilePhotoBucket,
        })
        this.initializeValidateApis({
            authorizer: authorizer,
            idResource: profileAccountIdResource,
            rootResource: this.api.root,
            table: props.profileTable.table,
            profilePhotoBucket: props.profilePhotoBucket,
        })
    }

    private initializeTokenApis(props: ApiProps) {
        const tokenResource = props.rootResource.addResource('token')
        this.tokenApi = this.addMethod({
            functionName: 'token-get',
            handlerName: 'token-get-handler.ts',
            verb: 'GET',
            resource: tokenResource,
            environment: {
                AUTH_END_POINT: props.authEndpoint,
                AUTH_CLIENT_ID: '59j60vfqh642vhqaql9kfen8hb', // FIX ME
                AUTH_GRANT_TYPE: 'authorization_code',
                AUTH_REDIRECT_URL: 'https://api.dev2.fameorbit.com/profile/token/'
            },
            validateRequestBody: false,
        })
    }
    private initializeProfileMainApis(props: ApiProps){
        this.listApi = this.addMethod({
            functionName: 'profile-list',
            handlerName: 'profile-list-handler.ts',
            verb: 'GET',
            resource: props.rootResource,
            environment: {
                PROFILE_TABLE: props.table.tableName,
                PROFILE_BUCKET: props.profilePhotoBucket.bucketName
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
                PROFILE_TABLE: props.table.tableName,
                PROFILE_BUCKET: props.profilePhotoBucket.bucketName
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
                PROFILE_TABLE: props.table.tableName,
                PROFILE_BUCKET: props.profilePhotoBucket.bucketName
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
                PROFILE_TABLE: props.table.tableName,
                PROFILE_BUCKET: props.profilePhotoBucket.bucketName
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
                PROFILE_TABLE: props.table.tableName,
                PROFILE_BUCKET: props.profilePhotoBucket.bucketName
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
                PROFILE_TABLE: props.table.tableName,
                PROFILE_BUCKET: props.profilePhotoBucket.bucketName
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })

        this.getPhotosApi = this.addMethod({
            functionName: 'profile-photo-get',
            handlerName: 'profile-photo-get-handler.ts',
            verb: 'GET',
            resource: photoIdResource,
            environment: {
                PROFILE_TABLE: props.table.tableName,
                PROFILE_BUCKET: props.profilePhotoBucket.bucketName
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })

        this.changeMainPhotoApi = this.addMethod({
            functionName: 'profile-photo-change-main',
            handlerName: 'profile-photo-set-main-handler.ts',
            verb: 'PUT',
            resource: photoResource,
            environment: {
                PROFILE_TABLE: props.table.tableName,
                PROFILE_BUCKET: props.profilePhotoBucket.bucketName
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
                PROFILE_TABLE: props.table.tableName,
                PROFILE_BUCKET: props.profilePhotoBucket.bucketName
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
                PROFILE_TABLE: props.table.tableName,
                PROFILE_BUCKET: props.profilePhotoBucket.bucketName
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })

        props.table.grantFullAccess(this.changeMainPhotoApi.grantPrincipal)
        props.table.grantFullAccess(this.addPhotoApi.grantPrincipal)
        props.table.grantFullAccess(this.deletePhotoApi.grantPrincipal)
        props.table.grantFullAccess(this.listPhotosApi.grantPrincipal)
        props.table.grantFullAccess(this.getPhotosApi.grantPrincipal)
    }

    private initializeLocationApis(props: ApiProps){
        const locationResource = props.idResource.addResource('location')

        this.setLocationApi = this.addMethod({
            functionName: 'profile-location-set',
            handlerName: 'profile-location-set-handler.ts',
            verb: 'PUT',
            resource: locationResource,
            environment: {
                PROFILE_TABLE: props.table.tableName,
                PROFILE_BUCKET: props.profilePhotoBucket.bucketName
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
                PROFILE_TABLE: props.table.tableName,
                PROFILE_BUCKET: props.profilePhotoBucket.bucketName
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
                PROFILE_TABLE: props.table.tableName,
                PROFILE_BUCKET: props.profilePhotoBucket.bucketName
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
                PROFILE_TABLE: props.table.tableName,
                PROFILE_BUCKET: props.profilePhotoBucket.bucketName
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
                PROFILE_TABLE: props.table.tableName,
                PROFILE_BUCKET: props.profilePhotoBucket.bucketName
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
                PROFILE_TABLE: props.table.tableName,
                PROFILE_BUCKET: props.profilePhotoBucket.bucketName
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
                PROFILE_TABLE: props.table.tableName,
                PROFILE_BUCKET: props.profilePhotoBucket.bucketName
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
        const snNameResource = socialResource.addResource('{snName}')
        const socialUserIdResource = snNameResource.addResource('{socialUserId}')

        this.listSocialApi = this.addMethod({
            functionName: 'profile-social-list',
            handlerName: 'profile-social-list-handler.ts',
            verb: 'GET',
            resource: socialResource,
            environment: {
                PROFILE_TABLE: props.table.tableName,
                PROFILE_BUCKET: props.profilePhotoBucket.bucketName
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
                PROFILE_TABLE: props.table.tableName,
                PROFILE_BUCKET: props.profilePhotoBucket.bucketName
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })

        this.deleteSocialApi = this.addMethod({
            functionName: 'profile-social-delete',
            handlerName: 'profile-social-delete-handler.ts',
            verb: 'DELETE',
            resource: socialUserIdResource,
            environment: {
                PROFILE_TABLE: props.table.tableName,
                PROFILE_BUCKET: props.profilePhotoBucket.bucketName
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
                PROFILE_TABLE: props.table.tableName,
                PROFILE_BUCKET: props.profilePhotoBucket.bucketName
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
                PROFILE_TABLE: props.table.tableName,
                PROFILE_BUCKET: props.profilePhotoBucket.bucketName
            },
            validateRequestBody: false,
            authorizationType: AuthorizationType.COGNITO,
            authorizer: props.authorizer
        })
        props.table.grantFullAccess(this.validateApi.grantPrincipal)
        props.table.grantFullAccess(this.requestValidationApi.grantPrincipal)

        const snsTopicPolicy = new PolicyStatement({
            actions: ['sns:publish'],
            resources: ['*'],
        });

        this.requestValidationApi.addToRolePolicy(snsTopicPolicy);

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
