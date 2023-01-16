import * as cdk from 'aws-cdk-lib';
import {CfnOutput, Fn, RemovalPolicy, Stack} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Bucket, HttpMethods} from "aws-cdk-lib/aws-s3";
import {Effect, PolicyStatement} from "aws-cdk-lib/aws-iam";
import {GenericDynamoTable} from "../lib/generic/GenericDynamoTable";
import {FameorbitCognito} from "../lib/construct/fameorbit-cognito";
import {AttributeType, StreamViewType} from "aws-cdk-lib/aws-dynamodb";


export class ProfileStatefulStack extends Stack {
    public profileTable: GenericDynamoTable
    public profilePhotoBucket: Bucket
    public uploadProfilePhotosPolicy: PolicyStatement
    public cognito: FameorbitCognito
    private suffix: string;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        this.initializeSuffix()
        this.initializeTodosPhotosBucket()
        this.initializeTodosTable()
        this.initializeBucketPolicies()
        this.initializeCognito()
    }

    private initializeSuffix() {
        const shortStackId = Fn.select(2, Fn.split('/', this.stackId));
        const Suffix = Fn.select(4, Fn.split('-', shortStackId));
        this.suffix = Suffix;
    }

    private initializeTodosTable() {
        this.profileTable = new GenericDynamoTable(this, 'ProfileDynamoDBTable', {
            tableName: 'Profile-' + this.suffix,
            primaryKey: 'accountId',
            stream: StreamViewType.NEW_AND_OLD_IMAGES,
            keyType: AttributeType.STRING
        })
        this.profileTable.addSecondaryIndexes({
            indexName: 'userIdIndex',
            partitionKeyName: 'userId',
            keyType: AttributeType.STRING
        })
    }

    private initializeTodosPhotosBucket() {
        this.profilePhotoBucket = new Bucket(this, 'profile-photos', {
            removalPolicy: RemovalPolicy.DESTROY,
            bucketName: 'profile-photos-' + this.suffix,
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
        this.uploadProfilePhotosPolicy = new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
                's3:PutObject',
                's3:PutObjectAcl'
            ],
            resources: [this.profilePhotoBucket.bucketArn + '/*']
        });
    }

    private initializeCognito() {
        this.cognito = new FameorbitCognito(this,'profileCognitoId', {
            suffixId: this.suffix
        })
        this.cognito.addToAuthenticatedRole(this.uploadProfilePhotosPolicy)
        this.cognito.addToAdminRole(this.uploadProfilePhotosPolicy)
    }

}
