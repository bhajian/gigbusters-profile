import {Construct} from "constructs";
import {GenericTableProps} from "./GenericDynamoTable";
import {
    CfnIdentityPool,
    CfnIdentityPoolRoleAttachment,
    CfnUserPoolGroup,
    UserPool,
    UserPoolClient, UserPoolClientIdentityProvider, UserPoolEmail, VerificationEmailStyle
} from "aws-cdk-lib/aws-cognito";
import {aws_route53_targets, CfnOutput, RemovalPolicy} from "aws-cdk-lib";
import {CognitoUserPoolsAuthorizer} from "aws-cdk-lib/aws-apigateway";
import {FederatedPrincipal, Role} from "aws-cdk-lib/aws-iam";
import {PolicyStatement} from "aws-cdk-lib/aws-iam/lib/policy-statement";
import {Certificate} from "aws-cdk-lib/aws-certificatemanager";
import {ARecord, HostedZone, RecordTarget} from "aws-cdk-lib/aws-route53";
import {UserPoolDomainTarget} from "aws-cdk-lib/aws-route53-targets";

export interface UserPoolProps {
    id: string
    userPoolName: string
    selfSignUpEnabled: boolean
    emailSignInAliases: boolean
    userNameSignInAliases: boolean
    phoneSignInAliases: boolean
    certificateArn: string
    authSubdomain: string
    rootDomain: string
    envName: string
}

export interface UserPoolClientProps {
    id: string
    userPoolClientName: string
    generateSecret: boolean
    supportedIdentityProviders: UserPoolClientIdentityProvider[]
    authFlow:{
        adminUserPassword: boolean
        custom: boolean
        userPassword: boolean
        userSrp: boolean
    },
    oAuth: {
        callbackUrls: any[]
        logoutUrls: any[]
    }
}

export interface IdentityPoolProps {
    id: string
    allowUnauthenticatedIdentities: boolean
    userPool: UserPool
    userPoolClient: UserPoolClient
}

export class GenericCognito extends Construct{
    protected props: UserPoolProps
    public userPool: UserPool;
    public userPoolClient: UserPoolClient;
    protected identityPool: CfnIdentityPool;
    public authenticatedRole: Role;
    public unAuthenticatedRole: Role;
    public adminRole: Role;

    public constructor(scope: Construct, id: string, props: any){
        super(scope, id)
        this.props = props
    }

    protected createUserPool(props: UserPoolProps){
        this.userPool = new UserPool(
            this,
            props.id,
            {
            removalPolicy: RemovalPolicy.DESTROY,
            userPoolName: props.userPoolName,
            selfSignUpEnabled: props.selfSignUpEnabled,
            email: UserPoolEmail.withCognito('support@orbitstellar.com'), // FIX ME
            userVerification: {
                emailSubject: 'Verify your email to access your account!',
                emailBody: 'Thanks for signing up to the Gig Busters app! Your verification code is {####}',
                emailStyle: VerificationEmailStyle.CODE,
                smsMessage: 'Thanks for signing up to the Gig Busters app! Your verification code is {####}',
            },
            standardAttributes: {
                email: {
                    required: true,
                    mutable: true,
                },
                phoneNumber: {
                    required: false,
                    mutable: true,
                },
                givenName: {
                    required: false,
                    mutable: true,
                },
                familyName: {
                    required: false,
                    mutable: true,
                },
            },
            signInAliases: {
                // username: props.userNameSignInAliases,
                email: props.emailSignInAliases,
                phone: props.phoneSignInAliases,
            }
        })

        const cert = Certificate.fromCertificateArn(this,
            'certificateId',
            props.certificateArn)

        const userPoolDomain = this.userPool.addDomain('UserPoolCustomDomain', {
            customDomain: {
                domainName: [props.authSubdomain, props.envName, props.rootDomain].join('.'),
                certificate: cert,
            },
        })

        const hostedZone = HostedZone.fromLookup(this, 'HostedZone', {
            domainName: props.rootDomain
        })

        new ARecord(this, 'authARecordId', {
            zone: hostedZone,
            recordName: [props.authSubdomain, props.envName].join('.'),
            target: RecordTarget.fromAlias(new UserPoolDomainTarget(userPoolDomain)),
        })

        new CfnOutput(this, 'UserPoolId', {
            value: this.userPool.userPoolId
        })
    }

    protected createUserPoolClient(props: UserPoolClientProps){
        this.userPoolClient = this.userPool.addClient(
            props.id,
            {
            userPoolClientName: props.userPoolClientName,
            authFlows: props.authFlow,
            oAuth: props.oAuth,
            supportedIdentityProviders: props.supportedIdentityProviders,
            generateSecret: false,
        });
        new CfnOutput(this, 'UserPoolClientId', {
            value: this.userPoolClient.userPoolClientId
        })
        return this.userPoolClient
    }

    protected createAdminsGroup(){
        new CfnUserPoolGroup(this, 'admins', {
            groupName: 'admins',
            userPoolId: this.userPool.userPoolId,
            roleArn: this.adminRole.roleArn
        })
    }

    protected initializeIdentityPool(props: IdentityPoolProps) {
        this.identityPool = new CfnIdentityPool(
            this,
            props.id,
            {
            allowUnauthenticatedIdentities: props.allowUnauthenticatedIdentities,
            cognitoIdentityProviders: [{
                clientId: props.userPoolClient.userPoolClientId,
                providerName: props.userPool.userPoolProviderName
            }]
        });
        new CfnOutput(this, 'IdentityPoolId', {
            value: this.identityPool.ref
        })
    }

    protected initializeRoles(identityPool: CfnIdentityPool) {
        this.authenticatedRole = new Role(this, 'CognitoDefaultAuthenticatedRole', {
            assumedBy: new FederatedPrincipal('cognito-identity.amazonaws.com', {
                    StringEquals: {
                        'cognito-identity.amazonaws.com:aud': identityPool.ref
                    },
                    'ForAnyValue:StringLike': {
                        'cognito-identity.amazonaws.com:amr': 'authenticated'
                    }
                },
                'sts:AssumeRoleWithWebIdentity'
            )
        })
        new CfnOutput(this, 'cognito-identitypool-authenticated-role-arn', {
            value: this.authenticatedRole.roleArn
        })

        this.unAuthenticatedRole = new Role(this, 'CognitoDefaultUnAuthenticatedRole', {
            assumedBy: new FederatedPrincipal('cognito-identity.amazonaws.com', {
                    StringEquals: {
                        'cognito-identity.amazonaws.com:aud': identityPool.ref
                    },
                    'ForAnyValue:StringLike': {
                        'cognito-identity.amazonaws.com:amr': 'unauthenticated'
                    }
                },
                'sts:AssumeRoleWithWebIdentity'
            )
        })
        new CfnOutput(this, 'cognito-identitypool-unauthenticated-role-arn', {
            value: this.unAuthenticatedRole.roleArn
        })

        this.adminRole = new Role(this, 'CognitoAdminRole', {
            assumedBy: new FederatedPrincipal('cognito-identity.amazonaws.com', {
                    StringEquals: {
                        'cognito-identity.amazonaws.com:aud': identityPool.ref
                    },
                    'ForAnyValue:StringLike': {
                        'cognito-identity.amazonaws.com:amr': 'authenticated'
                    }
                },
                'sts:AssumeRoleWithWebIdentity'
            )
        })
        new CfnOutput(this, 'cognito-identitypool-admin-role-arn', {
            value: this.adminRole.roleArn
        })

    }

    protected attachRoles(){
        new CfnIdentityPoolRoleAttachment(this, 'RolesAttachment', {
            identityPoolId: this.identityPool.ref,
            roles: {
                'authenticated': this.authenticatedRole.roleArn,
                'unauthenticated': this.unAuthenticatedRole.roleArn
            },
            roleMappings: {
                adminsMapping: {
                    type: 'Token',
                    ambiguousRoleResolution: 'AuthenticatedRole',
                    identityProvider: `${this.userPool.userPoolProviderName}:${this.userPoolClient.userPoolClientId}`
                }
            }
        })
    }

    public addToAuthenticatedRole(statement: PolicyStatement){
        this.authenticatedRole.addToPolicy(statement)
    }
    public addToUnAuthenticatedRole(statement: PolicyStatement){
        this.unAuthenticatedRole.addToPolicy(statement)
    }
    public addToAdminRole(statement: PolicyStatement){
        this.adminRole.addToPolicy(statement)
    }

}
