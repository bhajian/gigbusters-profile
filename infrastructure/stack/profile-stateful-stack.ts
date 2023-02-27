import * as cdk from 'aws-cdk-lib';
import {CfnOutput, Fn, RemovalPolicy, Stack} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Bucket, HttpMethods} from "aws-cdk-lib/aws-s3";
import {Effect, PolicyStatement} from "aws-cdk-lib/aws-iam";
import {GenericDynamoTable} from "../lib/generic/GenericDynamoTable";
import {FameorbitCognito} from "../lib/construct/fameorbit-cognito";
import {AttributeType, StreamViewType} from "aws-cdk-lib/aws-dynamodb";
import {ARecord, HostedZone, RecordTarget} from "aws-cdk-lib/aws-route53";
import config from "../config/config";
import {Topic} from "aws-cdk-lib/aws-sns";


export class ProfileStatefulStack extends Stack {
    public table: GenericDynamoTable
    public profilePhotoBucket: Bucket
    public profilePhotosPolicy: PolicyStatement
    public cognito: FameorbitCognito
    public snsTopic: Topic
    private suffix: string;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        this.initializeSuffix()
        this.initializeARecord()
        this.initializeProfilePhotosBucket()
        this.initializeDynamodbTable()
        this.initializeBucketPolicies()
        this.initializeCognito()
        this.snsTopic = new Topic(this, 'Topic')

    }

    private initializeARecord() {
        const hostedZone = HostedZone.fromLookup(this, 'HostedZone', {
            domainName: config.rootDomain
        })

        new ARecord(this, 'DummyARecordId', {
            zone: hostedZone,
            recordName: `${config.envName}.${config.rootDomain}`,
            target: RecordTarget.fromIpAddresses('1.1.1.1')
        })
    }

    private initializeSuffix() {
        const shortStackId = Fn.select(2, Fn.split('/', this.stackId));
        const Suffix = Fn.select(4, Fn.split('-', shortStackId));
        this.suffix = Suffix;
    }

    private initializeDynamodbTable() {
        this.table = new GenericDynamoTable(this, 'ProfileDynamoDBTable', {
            tableName: `Profile-${config.envName}-${this.suffix}` ,
            primaryKey: 'accountId',
            stream: StreamViewType.NEW_AND_OLD_IMAGES,
            keyType: AttributeType.STRING
        })
        this.table.addSecondaryIndexes({
            indexName: 'userIdIndex',
            partitionKeyName: 'userId',
            partitionKeyType: AttributeType.STRING
        })
    }

    private initializeProfilePhotosBucket() {
        this.profilePhotoBucket = new Bucket(this, 'profile-photos', {
            removalPolicy: RemovalPolicy.DESTROY,
            bucketName: `profile-photos-${config.envName}-${this.suffix}`,
            cors: [{
                allowedMethods: [
                    HttpMethods.HEAD,
                    HttpMethods.GET,
                    HttpMethods.PUT
                ],
                allowedOrigins: ['*'],
                allowedHeaders: ['*']
            }]
        });
        new CfnOutput(this, 'profile-photos-bucket-name', {
            value: this.profilePhotoBucket.bucketName
        })
    }

    private initializeBucketPolicies() {
        this.profilePhotosPolicy = new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
                's3:PutObject',
                's3:PutObjectAcl',
                's3:GetObject',
                's3:DeleteObject'
            ],
            resources: [this.profilePhotoBucket.bucketArn + '/*']
        });
    }

    private initializeCognito() {
        this.cognito = new FameorbitCognito(this,'profileCognitoId', {
            suffixId: this.suffix
        })
        this.cognito.addToAuthenticatedRole(this.profilePhotosPolicy)
        this.cognito.addToAdminRole(this.profilePhotosPolicy)
    }

}
