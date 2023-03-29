import {Construct} from "constructs"
import {GenericAsyncFunction} from "../generic/GenericAsyncFunction"
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import {DynamoEventSource} from "aws-cdk-lib/aws-lambda-event-sources";
import {StartingPosition} from "aws-cdk-lib/aws-lambda"
import {GenericDynamoTable} from "../generic/GenericDynamoTable";
import config from "../../config/config";
import {Bucket} from "aws-cdk-lib/aws-s3";

export interface ProfileAsyncProps {
    profileTable: GenericDynamoTable
    profilePhotoBucket: Bucket
}

export class ProfileAyncFunction extends GenericAsyncFunction {
    profileCreationStream: NodejsFunction
    props: ProfileAsyncProps

    public constructor(scope: Construct, id: string, props: ProfileAsyncProps) {
        super(scope, id)
        this.props = props
        this.initializeFunctions()
    }

    private initializeFunctions() {
        this.profileCreationStream = this.addFunction({
            functionName: 'profile-creation-dynamo-stream',
            handlerName: 'profile-creation-dynamo-stream-handler.ts',
            environment: {
                REVIEW_API_URL: config.reviewableUrl,
                PROFILE_TABLE: this.props.profileTable.table.tableName,
                PROFILE_BUCKET: this.props.profilePhotoBucket.bucketName
            },
            externalModules: []
        })

        this.profileCreationStream.addEventSource(new DynamoEventSource(
            this.props.profileTable.table, {
                startingPosition: StartingPosition.LATEST,
            }))
    }
}
