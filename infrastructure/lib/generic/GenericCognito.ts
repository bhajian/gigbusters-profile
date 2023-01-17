import {Construct} from "constructs";
import {GenericTableProps} from "./GenericDynamoTable";
import {
    CfnIdentityPool,
    CfnIdentityPoolRoleAttachment,
    CfnUserPoolGroup,
    UserPool,
    UserPoolClient, UserPoolEmail, VerificationEmailStyle
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
    authFlow:{
        adminUserPassword: boolean
        custom: boolean
        userPassword: boolean
        userSrp: boolean
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
            email: UserPoolEmail.withCognito('support@myawesomeapp.com'),
            userVerification: {
                emailSubject: 'Verify your email for our awesome app!',
                emailBody: 'Thanks for signing up to our awesome app! Your verification code is {####}',
                emailStyle: VerificationEmailStyle.CODE,
                smsMessage: 'Thanks for signing up to our awesome app! Your verification code is {####}',
            },
            standardAttributes: {
                email: {
                    required: true,
                    mutable: false,
                },
                phoneNumber: {
                    required: true,
                    mutable: false,
                },
                givenName: {
                    required: false,
                    mutable: false,
                },
                familyName: {
                    required: false,
                    mutable: false,
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
            authFlows: {
                adminUserPassword: props.authFlow.adminUserPassword,
                custom: props.authFlow.custom,
                userPassword: props.authFlow.userPassword,
                userSrp: props.authFlow.userSrp
            },
            generateSecret: false
        });
        new CfnOutput(this, 'UserPoolClientId', {
            value: this.userPoolClient.userPoolClientId
        })
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
        });

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
        });

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
